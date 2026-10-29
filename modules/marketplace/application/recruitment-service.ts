import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from '@/modules/shared/domain/errors';
import { opportunityTypes } from '@/modules/opportunities/domain/opportunity';
import type { InstitutionalCatalog, RecruitmentRepository } from './ports';
import type { InstitutionStatus, SubmissionStatus } from '../domain/models';

const url=z.string().url().refine(v=>['https:','http:'].includes(new URL(v).protocol),'HTTP veya HTTPS adresi kullanın.');
const institutionSchema=z.object({key:z.string().uuid(),name:z.string().trim().min(3).max(160),countryCode:z.string().regex(/^[A-Z]{2}$/),websiteUrl:url,description:z.string().trim().min(20).max(4000)});
const listingSchema=z.object({id:z.string().uuid(),institutionId:z.string().uuid(),version:z.coerce.number().int().nonnegative(),title:z.string().trim().min(8).max(180),summary:z.string().trim().min(20).max(400),description:z.string().trim().min(40).max(12000),type:z.enum(opportunityTypes),attendanceMode:z.enum(['onsite','online','hybrid','not_applicable']),officialUrl:url,deadline:z.iso.date(),applyMode:z.enum(['platform','external'])});
function parse<T>(schema:z.ZodType<T>,data:unknown):T {const result=schema.safeParse(data);if(!result.success)throw new ValidationError('Alanları kontrol edin. Başlık, açıklama, geçerli adres ve son tarih gereklidir.');return result.data;}
function hash(value:unknown){return createHash('sha256').update(JSON.stringify(value)).digest('hex');}

export class RecruitmentService {
  constructor(private readonly repository:RecruitmentRepository,private readonly catalog:InstitutionalCatalog){}

  private actor(id:string){const actor=this.repository.actor(id);if(!actor||actor.status!=='active')throw new AuthorizationError();return actor;}
  private admin(id:string){const actor=this.actor(id);if(!['owner','admin'].includes(actor.role))throw new AuthorizationError();return actor;}
  private member(id:string,institutionId:string,manager=false){this.actor(id);const role=this.repository.membership(id,institutionId);if(!role||(manager&&role!=='manager'))throw new AuthorizationError();}
  private requireInstitution(id:string){const institution=this.repository.institution(id);if(!institution)throw new NotFoundError('Kurum');return institution;}
  private requireListing(id:string){const listing=this.catalog.get(id);if(!listing)throw new NotFoundError('İlan');return listing;}
  private version(actual:number,expected:number){if(actual!==expected)throw new ConflictError('Bu kayıt değişti. Sayfayı yenileyip tekrar deneyin.');}

  createInstitution(actorId:string,raw:unknown){
    this.actor(actorId);const input=parse(institutionSchema,raw);const creationHash=hash(input);
    return this.repository.transaction(()=>{
      const existing=this.repository.institution(input.key);
      if(existing){this.member(actorId,existing.id,true);if(existing.creationHash!==creationHash)throw new ConflictError('İşlem anahtarı farklı içerikle kullanıldı.');return existing.id;}
      this.repository.createInstitution(actorId,{...input,id:input.key,creationHash});
      this.repository.audit(actorId,'institution.created','institution',input.key);
      return input.key;
    });
  }
  moderateInstitution(actorId:string,id:string,status:InstitutionStatus,version:number){
    this.admin(actorId);if(!['verified','rejected'].includes(status))throw new ValidationError('Geçersiz karar.');
    this.repository.transaction(()=>{const institution=this.requireInstitution(id);this.version(institution.version,version);this.repository.setInstitutionStatus(id,status,version);this.repository.audit(actorId,'institution.moderated','institution',id,{status});});
  }
  directory(search='',page=1){return this.repository.institutions({publicOnly:true,search:search.slice(0,120),page});}
  updateInstitution(actorId:string,id:string,raw:unknown){
    this.member(actorId,id,true);const input=parse(institutionSchema.omit({key:true}).extend({version:z.coerce.number().int().positive()}),raw);
    this.repository.transaction(()=>{const current=this.requireInstitution(id);this.version(current.version,input.version);const identityChanged=current.name!==input.name||current.websiteUrl!==input.websiteUrl||current.countryCode!==input.countryCode;
      this.repository.updateInstitution(id,input,identityChanged?'pending':current.status,input.version);this.repository.audit(actorId,'institution.updated','institution',id,{requiresReview:identityChanged});});
  }
  setInstitutionActive(actorId:string,id:string,version:number,active:boolean){this.member(actorId,id,true);this.repository.transaction(()=>{const institution=this.requireInstitution(id);this.version(institution.version,version);this.repository.updateInstitution(id,institution,active?'pending':'rejected',version);this.repository.audit(actorId,active?'institution.review_requested':'institution.deactivated','institution',id);});}
  mine(actorId:string){this.actor(actorId);return this.repository.institutions({userId:actorId}).items;}
  institution(id:string){const institution=this.requireInstitution(id);if(institution.status!=='verified')throw new NotFoundError('Kurum');return institution;}
  institutionForManager(actorId:string,id:string){this.member(actorId,id,true);return this.requireInstitution(id);}
  moderation(actorId:string){this.admin(actorId);return {institutions:this.repository.institutions({}).items,listings:this.catalog.list({reviewOnly:true})};}

  saveListing(actorId:string,raw:unknown){
    const input=parse(listingSchema,raw);this.member(actorId,input.institutionId,true);
    return this.repository.transaction(()=>{
      const current=this.catalog.get(input.id), creationHash=hash(input);
      if(current){
        if(current.deletedAt)throw new ConflictError('İlan çöp kutusunda. Önce geri alın.');
        if(current.institutionId!==input.institutionId)throw new AuthorizationError();
        if(input.version===0&&current.creationHash===creationHash)return current.id;
        this.version(current.version,input.version);
        if(!['draft','rejected'].includes(current.status))throw new ConflictError('Yalnızca taslak veya düzeltme istenen ilanlar düzenlenebilir.');
      }else if(input.version!==0)throw new NotFoundError('İlan');
      if(input.deadline<new Date().toISOString().slice(0,10))throw new ValidationError('Son tarih geçmişte olamaz.');
      this.catalog.save(input,this.requireInstitution(input.institutionId),actorId,creationHash);
      this.repository.audit(actorId,'listing.saved','opportunity',input.id);
      return input.id;
    });
  }
  requestReview(actorId:string,id:string,version:number){this.transitionListing(actorId,id,version,'review');}
  closeListing(actorId:string,id:string,version:number){this.transitionListing(actorId,id,version,'archived');}
  private transitionListing(actorId:string,id:string,version:number,status:'review'|'archived'){
    this.repository.transaction(()=>{
      const listing=this.requireListing(id);this.member(actorId,listing.institutionId,true);this.version(listing.version,version);if(listing.deletedAt)throw new ConflictError('İlan çöp kutusunda. Önce geri alın.');
      if(status==='review'&&(!['draft','rejected'].includes(listing.status)||this.requireInstitution(listing.institutionId).status!=='verified'))throw new ConflictError('İncelemeye göndermek için kurumun onaylı, ilanın taslak olması gerekir.');
      if(status==='review'&&listing.deadline<new Date().toISOString().slice(0,10))throw new ValidationError('Son tarihi güncelleyin.');
      if(listing.status==='archived')throw new ConflictError('İlan zaten kapalı.');
      this.catalog.transition(id,status,version);this.repository.audit(actorId,`listing.${status}`,'opportunity',id);
    });
  }
  moderateListing(actorId:string,id:string,status:'published'|'rejected',version:number){
    this.admin(actorId);if(!['published','rejected'].includes(status))throw new ValidationError('Geçersiz karar.');
    this.repository.transaction(()=>{
      const listing=this.requireListing(id);this.version(listing.version,version);
      if(listing.status!=='review')throw new ConflictError('İlan inceleme kuyruğunda değil.');
      if(status==='published'&&(this.requireInstitution(listing.institutionId).status!=='verified'||listing.deadline<new Date().toISOString().slice(0,10)))throw new ConflictError('Kurum onayı ve geçerli son tarih gerekiyor.');
      this.catalog.transition(id,status,version);this.repository.audit(actorId,`listing.${status}`,'opportunity',id);
    });
  }
  listingForManager(actorId:string,id:string){const listing=this.requireListing(id);this.member(actorId,listing.institutionId);return listing;}
  publicListing(id:string){const listing=this.catalog.get(id);return listing?.status==='published'&&this.requireInstitution(listing.institutionId).status==='verified'?listing:null;}
  listings(actorId:string,institutionId:string,trash=false){this.member(actorId,institutionId);return this.catalog.list({institutionId,trash});}
  publicListings(institutionId:string){this.institution(institutionId);return this.catalog.list({institutionId,publicOnly:true});}

  submit(actorId:string,raw:unknown){
    const actor=this.actor(actorId);const input=parse(z.object({opportunityId:z.string().uuid(),message:z.string().trim().min(30).max(6000),consent:z.literal(true)}),raw);
    return this.repository.transaction(()=>{
      const listing=this.requireListing(input.opportunityId);
      if(this.repository.membership(actorId,listing.institutionId))throw new ConflictError('Yönettiğiniz kurumun ilanına başvuramazsınız.');
      if(listing.status!=='published'||listing.applyMode!=='platform'||this.requireInstitution(listing.institutionId).status!=='verified'||listing.deadline<new Date().toISOString().slice(0,10))throw new ConflictError('Bu ilan şu anda platform üzerinden başvuru kabul etmiyor.');
      const previous=this.repository.submissionFor(actorId,listing.id);
      if(previous){if(previous.status==='withdrawn'||previous.message!==input.message)throw new ConflictError('Bu ilana zaten başvurdunuz. Gönderimlerinizi kontrol edin.');return previous.id;}
      const id=randomUUID();this.repository.insertSubmission(id,actor,listing.id,input.message);
      this.repository.audit(actorId,'submission.sent','submission',id);
      this.repository.notify(actorId,listing.id,`submission:${id}:1`,'Başvurunuz kuruma iletildi',listing.title);
      return id;
    });
  }
  mySubmissions(actorId:string){this.actor(actorId);return this.repository.submissions({applicantId:actorId});}
  mySubmissionPage(actorId:string,page=1){this.actor(actorId);return this.repository.submissionPage({applicantId:actorId},page);}
  administrativeSubmissions(actorId:string,userId:string,page=1){
    this.admin(actorId);
    const result=this.repository.submissionPage({applicantId:userId},page);
    // Support staff get a status projection, not the applicant's message or contact snapshot.
    return {...result,items:result.items.map(s=>({id:s.id,title:s.title,institutionName:s.institutionName,status:s.status,createdAt:s.createdAt}))};
  }
  candidates(actorId:string,opportunityId:string,search='',status='',page=1){
    const listing=this.listingForManager(actorId,opportunityId);
    return this.repository.submissionPage({opportunityId:listing.id,search:search.slice(0,120),status},page);
  }
  decide(actorId:string,id:string,status:SubmissionStatus,version:number,note:string){
    if(!['reviewing','accepted','rejected'].includes(status))throw new ValidationError('Geçersiz başvuru kararı.');
    this.repository.transaction(()=>{
      const submission=this.repository.submission(id);if(!submission)throw new NotFoundError('Başvuru');
      this.listingForManager(actorId,submission.opportunityId);this.version(submission.version,version);
      if(!['submitted','reviewing'].includes(submission.status)&&!(status==='reviewing'&&['accepted','rejected'].includes(submission.status)))throw new ConflictError('Önce sonuçlanmış başvuruyu yeniden değerlendirmeye açın. Geri çekilmiş başvuruyu yalnızca araştırmacı yeniden gönderebilir.');
      if(status===submission.status)throw new ConflictError('Başvuru zaten bu durumda.');
      const body=parse(z.string().trim().min(5).max(2000),note);
      this.repository.setSubmissionStatus(id,status,body,version);
      this.repository.audit(actorId,`submission.${status}`,'submission',id);
      this.repository.notify(submission.applicantId,submission.opportunityId,`submission:${id}:${version+1}`,'Başvurunuzun durumu güncellendi',body);
    });
  }
  withdraw(actorId:string,id:string,version:number){
    this.actor(actorId);this.repository.transaction(()=>{
      const submission=this.repository.submission(id);if(!submission||submission.applicantId!==actorId)throw new AuthorizationError();this.version(submission.version,version);
      if(['withdrawn','rejected'].includes(submission.status))throw new ConflictError('Başvuru zaten kapalı.');
      this.repository.setSubmissionStatus(id,'withdrawn','Araştırmacı başvurusunu geri çekti.',version);this.repository.audit(actorId,'submission.withdrawn','submission',id);
    });
  }
  resubmit(actorId:string,id:string,version:number,consent:boolean){
    const actor=this.actor(actorId);if(consent!==true)throw new ValidationError('Yeniden paylaşım onayı gerekiyor.');
    this.repository.transaction(()=>{const submission=this.repository.submission(id);if(!submission||submission.applicantId!==actorId)throw new AuthorizationError();this.version(submission.version,version);if(submission.status!=='withdrawn')throw new ConflictError('Yalnızca geri çekilmiş başvuru yeniden gönderilebilir.');
      const listing=this.requireListing(submission.opportunityId);if(listing.status!=='published'||listing.applyMode!=='platform'||listing.deadline<new Date().toISOString().slice(0,10)||this.requireInstitution(listing.institutionId).status!=='verified'||this.repository.membership(actorId,listing.institutionId))throw new ConflictError('İlan şu anda yeni başvuru kabul etmiyor.');
      this.repository.setSubmissionStatus(id,'submitted','Araştırmacı başvurusunu yeniden gönderdi.',version);this.repository.renewConsent(id,actor);this.repository.audit(actorId,'submission.resubmitted','submission',id);this.repository.notify(actorId,listing.id,`submission:${id}:${version+1}`,'Başvurunuz yeniden iletildi',listing.title);
    });
  }
}
