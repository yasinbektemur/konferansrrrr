import { randomUUID } from 'node:crypto';
import type { RelationalDatabase } from '@/modules/shared/infrastructure/database/sqlite-database';
import { ConflictError } from '@/modules/shared/domain/errors';
import type { RecruitmentRepository } from '../application/ports';
import type { Actor, Institution, InstitutionStatus, Submission, SubmissionStatus, SubmissionFilter } from '../domain/models';

const institutionSelect=`SELECT i.id,i.name,i.country_code AS countryCode,i.website_url AS websiteUrl,
  a.description,a.status,a.version,a.creation_hash AS creationHash,
  (SELECT COUNT(*) FROM institutional_listings il JOIN opportunities o ON o.id=il.opportunity_id
   WHERE il.institution_id=i.id AND o.status='published') AS listingCount
  FROM institutions i JOIN institution_accounts a ON a.institution_id=i.id`;
const submissionSelect=`SELECT s.id,s.opportunity_id AS opportunityId,s.applicant_id AS applicantId,
  s.applicant_name AS applicantName,s.applicant_email AS applicantEmail,s.message,s.status,
  s.decision_note AS decisionNote,s.version,s.created_at AS createdAt,o.title,i.name AS institutionName
  FROM opportunity_submissions s JOIN opportunities o ON o.id=s.opportunity_id
  JOIN institutional_listings il ON il.opportunity_id=o.id JOIN institutions i ON i.id=il.institution_id`;
export class SqliteRecruitmentRepository implements RecruitmentRepository {
  constructor(private readonly db:RelationalDatabase){}
  transaction<T>(work:()=>T){return this.db.transaction(work);}
  actor(id:string){const row=this.db.prepare('SELECT id,display_name AS name,email,role,status FROM users WHERE id=?').get(id) as Actor|undefined;return row?{...row}:null;}
  membership(userId:string,institutionId:string){const row=this.db.prepare('SELECT role FROM institution_members WHERE user_id=? AND institution_id=?').get(userId,institutionId) as {role:string}|undefined;return row?.role??null;}
  institution(id:string){const row=this.db.prepare(`${institutionSelect} WHERE i.id=?`).get(id) as Institution|undefined;return row?{...row}:null;}
  institutions(options:{userId?:string;publicOnly?:boolean;search?:string;page?:number}){
    const where=['1=1'],params:string[]=[];
    if(options.userId){where.push('EXISTS(SELECT 1 FROM institution_members m WHERE m.institution_id=i.id AND m.user_id=?)');params.push(options.userId);}
    if(options.publicOnly)where.push("a.status='verified'");
    if(options.search){where.push('(i.name LIKE ? OR a.description LIKE ?)');params.push(`%${options.search}%`,`%${options.search}%`);}
    const query=`${institutionSelect} WHERE ${where.join(' AND ')}`;
    const total=Number((this.db.prepare(`SELECT COUNT(*) AS count FROM (${query})`).get(...params) as {count:number}).count);
    const pages=Math.max(1,Math.ceil(total/12));const page=Math.min(pages,Math.max(1,Number.isFinite(options.page)?Math.floor(options.page!):1));
    // Private workspaces show every membership; public discovery is paginated.
    const suffix=options.publicOnly?' LIMIT 12 OFFSET ?':'';
    const args=options.publicOnly?[...params,(page-1)*12]:params;
    const items=(this.db.prepare(`${query} ORDER BY a.status='pending' DESC,i.name${suffix}`).all(...args) as Institution[]).map(row=>({...row}));
    return {items,total,page,pages};
  }
  createInstitution(actorId:string,input:Omit<Institution,'status'|'version'|'listingCount'>){
    this.db.prepare('INSERT INTO institutions(id,name,country_code,website_url) VALUES(?,?,?,?)').run(input.id,input.name,input.countryCode,input.websiteUrl);
    this.db.prepare('INSERT INTO institution_accounts(institution_id,description,creation_hash) VALUES(?,?,?)').run(input.id,input.description,input.creationHash);
    this.db.prepare("INSERT INTO institution_members(institution_id,user_id,role) VALUES(?,?,'manager')").run(input.id,actorId);
  }
  updateInstitution(id:string,input:Pick<Institution,'name'|'countryCode'|'websiteUrl'|'description'>,status:InstitutionStatus,version:number){
    const result=this.db.prepare('UPDATE institution_accounts SET description=?,status=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE institution_id=? AND version=?').run(input.description,status,id,version);if(!result.changes)throw new ConflictError('Kurum değişti.');
    this.db.prepare('UPDATE institutions SET name=?,country_code=?,website_url=? WHERE id=?').run(input.name,input.countryCode,input.websiteUrl,id);
    this.db.prepare('UPDATE organizers SET name=?,website_url=? WHERE institution_id=?').run(input.name,input.websiteUrl,id);
    this.db.prepare("DELETE FROM cache_entries WHERE namespace='opportunity-facets'").run();
  }
  setInstitutionStatus(id:string,status:InstitutionStatus,version:number){
    const result=this.db.prepare('UPDATE institution_accounts SET status=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE institution_id=? AND version=?').run(status,id,version);
    if(!result.changes)throw new ConflictError('Kurum kaydı değişti.');
    this.db.prepare("DELETE FROM cache_entries WHERE namespace='opportunity-facets'").run();
  }
  submission(id:string){const row=this.db.prepare(`${submissionSelect} WHERE s.id=?`).get(id) as Submission|undefined;return row?{...row}:null;}
  submissionFor(applicantId:string,opportunityId:string){const row=this.db.prepare(`${submissionSelect} WHERE s.applicant_id=? AND s.opportunity_id=?`).get(applicantId,opportunityId) as Submission|undefined;return row?{...row}:null;}
  private submissionQuery(options:SubmissionFilter){
    const where:string[]=[],params:string[]=[];
    if(options.applicantId){where.push('s.applicant_id=?');params.push(options.applicantId);}
    if(options.opportunityId){where.push('s.opportunity_id=?');params.push(options.opportunityId);}
    if(!where.length)throw new Error('Başvuru sorgusunda kapsam zorunludur.');
    if(options.search){where.push('(s.applicant_name LIKE ? OR s.applicant_email LIKE ?)');params.push(`%${options.search}%`,`%${options.search}%`);}
    if(options.status){where.push('s.status=?');params.push(options.status);}
    return {query:`${submissionSelect} WHERE ${where.join(' AND ')}`,params};
  }
  submissions(options:SubmissionFilter){
    const {query,params}=this.submissionQuery(options);
    return (this.db.prepare(`${query} ORDER BY s.created_at DESC,s.id`).all(...params) as Submission[]).map(row=>({...row}));
  }
  submissionPage(options:SubmissionFilter,requestedPage:number){
    const {query,params}=this.submissionQuery(options);
    const total=Number((this.db.prepare(`SELECT COUNT(*) AS count FROM (${query})`).get(...params) as {count:number}).count);
    const pages=Math.max(1,Math.ceil(total/10)),page=Math.min(pages,Number.isFinite(requestedPage)?Math.max(1,Math.floor(requestedPage)):1);
    const items=(this.db.prepare(`${query} ORDER BY s.created_at DESC,s.id LIMIT 10 OFFSET ?`).all(...params,(page-1)*10) as Submission[]).map(row=>({...row}));
    return {items,total,page,pages};
  }
  insertSubmission(id:string,actor:Actor,opportunityId:string,message:string){this.db.prepare('INSERT INTO opportunity_submissions(id,opportunity_id,applicant_id,applicant_name,applicant_email,message) VALUES(?,?,?,?,?,?)').run(id,opportunityId,actor.id,actor.name,actor.email,message);}
  setSubmissionStatus(id:string,status:SubmissionStatus,note:string,version:number){
    const result=this.db.prepare('UPDATE opportunity_submissions SET status=?,decision_note=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=?').run(status,note,id,version);
    if(!result.changes)throw new ConflictError('Başvuru değişti. Sayfayı yenileyin.');
  }
  audit(actorId:string,action:string,entityType:string,id:string,metadata:Record<string,unknown>={}){
    this.db.prepare('INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?,?)').run(randomUUID(),actorId,action,entityType,id,JSON.stringify(metadata));
  }
  renewConsent(id:string,actor:Actor){this.db.prepare('UPDATE opportunity_submissions SET consent_at=CURRENT_TIMESTAMP,applicant_name=?,applicant_email=? WHERE id=?').run(actor.name,actor.email,id);}
  notify(userId:string,opportunityId:string,key:string,title:string,body:string){
    this.db.prepare("INSERT INTO notifications(id,user_id,opportunity_id,kind,title,body,deduplication_key) VALUES(?,?,?,'application',?,?,?) ON CONFLICT(deduplication_key) DO NOTHING").run(randomUUID(),userId,opportunityId,title,body,key);
  }
}
