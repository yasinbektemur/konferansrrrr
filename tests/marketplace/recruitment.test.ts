import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase } from '../helpers/database';
import { RecruitmentService } from '@/modules/marketplace/application/recruitment-service';
import { SqliteRecruitmentRepository } from '@/modules/marketplace/infrastructure/sqlite-recruitment-repository';
import { SqliteInstitutionalCatalog } from '@/modules/opportunities/infrastructure/institutional-catalog';
import { SqliteOpportunityRepository } from '@/modules/opportunities/infrastructure/sqlite-opportunity-repository';
import { OpportunityFacets } from '@/modules/opportunities/infrastructure/opportunity-facets';

function setup() {
  const db = createTestDatabase();
  db.exec(`INSERT INTO users(id,email,display_name,password_hash,role,status) VALUES
    ('owner','owner@test.dev','Yönetici','hash','owner','active'),
    ('publisher','publisher@test.dev','Yayıncı','hash','user','active'),
    ('other','other@test.dev','Başka kurum','hash','user','active'),
    ('applicant','applicant@test.dev','Araştırmacı','hash','user','active')`);
  const service = new RecruitmentService(new SqliteRecruitmentRepository(db), new SqliteInstitutionalCatalog(db));
  const institution = service.createInstitution('publisher', {key:randomUUID(), name:'Bilim Araştırma Enstitüsü', countryCode:'TR', websiteUrl:'https://example.org', description:'Sağlık teknolojileri ve biyomedikal araştırmalar.'});
  return {db,service,institution};
}
function listing(institutionId:string) {
  return {id:randomUUID(),institutionId,version:0,title:'Biyomedikal araştırma bursu',summary:'Klinik yapay zekâ alanında araştırma desteği.',description:'Başvuruda araştırma yaklaşımınızı ve önceki deneyiminizi anlatın.',type:'fellowship',attendanceMode:'online',officialUrl:'https://example.org/call',deadline:'2099-12-01',applyMode:'platform'};
}
test('institution ownership never grants platform powers; drafts and review stay private',()=>{
  const {db,service,institution}=setup();
  try {
    assert.equal(service.directory('').items.length,0);
    assert.throws(()=>service.moderateInstitution('publisher',institution,'verified',1));
    const input=listing(institution);
    service.saveListing('publisher',input);
    assert.throws(()=>service.saveListing('other',{...input,version:1}));
    const catalog=new SqliteOpportunityRepository(db);
    assert.equal(catalog.findById(input.id),null);
    assert.throws(()=>service.requestReview('publisher',input.id,1));
    service.moderateInstitution('owner',institution,'verified',1);
    service.requestReview('publisher',input.id,1);
    assert.equal(catalog.findById(input.id),null);
    assert.throws(()=>service.moderateListing('publisher',input.id,'published',2));
    service.moderateListing('owner',input.id,'published',2);
    assert.ok(catalog.findById(input.id));
    assert.equal(service.directory('').items.length,1);
    assert.throws(()=>service.saveListing('publisher',{...input,version:1}));
    assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
  } finally { db.close(); }
});
test('submission delivery is idempotent, private, versioned and produces one notification per decision',()=>{
  const {db,service,institution}=setup();
  try {
    service.moderateInstitution('owner',institution,'verified',1);
    const input=listing(institution);
    service.saveListing('publisher',input);
    service.saveListing('publisher',input); // repeated original creation
    service.requestReview('publisher',input.id,1);
    service.moderateListing('owner',input.id,'published',2);
    const body={opportunityId:input.id,message:'Bu araştırma programına deneyimim ve çalışma önerimle katkıda bulunmak istiyorum.',consent:true};
    const id=service.submit('applicant',body);
    assert.equal(service.submit('applicant',body),id);
    assert.equal(service.mySubmissions('applicant').length,1);
    assert.equal(service.mySubmissions('other').length,0);
    assert.throws(()=>service.administrativeSubmissions('publisher','applicant'));
    const supportView=service.administrativeSubmissions('owner','applicant');
    assert.equal(supportView.items.length,1);
    assert.equal('message' in supportView.items[0],false);
    assert.equal('applicantEmail' in supportView.items[0],false);
    assert.throws(()=>service.candidates('other',input.id));
    assert.throws(()=>service.decide('other',id,'accepted',1,'Uygun bulundu.'));
    service.decide('publisher',id,'reviewing',1,'İnceleme başladı.');
    assert.throws(()=>service.decide('publisher',id,'accepted',1,'Eski sürüm.'));
    service.decide('publisher',id,'accepted',2,'Başvurunuz kabul edildi.');
    assert.equal(service.mySubmissions('applicant')[0].status,'accepted');
    const notes=db.prepare("SELECT * FROM notifications WHERE user_id='applicant'").all();
    assert.equal(notes.length,3); // delivered + reviewing + accepted
    service.withdraw('applicant',id,3);
    assert.throws(()=>service.decide('publisher',id,'accepted',4,'Tekrar kabul.'));
    assert.throws(()=>service.submit('applicant',body));
  } finally { db.close(); }
});
test('closed, expired, external, unconsented and self applications cannot be submitted',()=>{
  const {db,service,institution}=setup();
  try {
    service.moderateInstitution('owner',institution,'verified',1);
    const input=listing(institution);
    service.saveListing('publisher',input);
    service.requestReview('publisher',input.id,1);
    service.moderateListing('owner',input.id,'published',2);
    const body={opportunityId:input.id,message:'Bu programa başvurmak ve araştırmalarımla katkı sunmak istiyorum.',consent:true};
    assert.throws(()=>service.submit('applicant',{...body,consent:false}));
    assert.throws(()=>service.submit('publisher',body));
    db.prepare("UPDATE institutional_listings SET apply_mode='external' WHERE opportunity_id=?").run(input.id);
    assert.throws(()=>service.submit('applicant',body));
    db.prepare("UPDATE institutional_listings SET apply_mode='platform',deadline='2000-01-01' WHERE opportunity_id=?").run(input.id);
    assert.throws(()=>service.submit('applicant',body));
    service.closeListing('publisher',input.id,3);
    assert.throws(()=>service.submit('applicant',body));
    assert.equal(new SqliteOpportunityRepository(db).findById(input.id),null);
  } finally { db.close(); }
});
test('institution revocation invalidates cached facets and removes listings from public discovery',()=>{
  const {db,service,institution}=setup();
  try{
    service.moderateInstitution('owner',institution,'verified',1);
    const input=listing(institution);service.saveListing('publisher',input);service.requestReview('publisher',input.id,1);service.moderateListing('owner',input.id,'published',2);
    const facets=new OpportunityFacets(db),catalog=new SqliteOpportunityRepository(db);
    assert.equal(facets.getAll().types[0].count,1);
    service.moderateInstitution('owner',institution,'rejected',2);
    assert.equal(catalog.search({}).total,0);assert.equal(catalog.findById(input.id),null);assert.equal(service.publicListing(input.id),null);
    assert.equal(facets.getAll().types.length,0);
    db.prepare("UPDATE users SET status='suspended' WHERE id='publisher'").run();
    assert.throws(()=>service.listings('publisher',institution));
  }finally{db.close();}
});
test('submission, receipt notification and audit commit atomically; filtered pagination stays scoped',()=>{
  const {db,service,institution}=setup();
  try{
    service.moderateInstitution('owner',institution,'verified',1);
    const input=listing(institution);service.saveListing('publisher',input);service.requestReview('publisher',input.id,1);service.moderateListing('owner',input.id,'published',2);
    db.exec("CREATE TRIGGER fail_notification BEFORE INSERT ON notifications BEGIN SELECT RAISE(ABORT, 'delivery failure'); END;");
    assert.throws(()=>service.submit('applicant',{opportunityId:input.id,message:'Bu araştırma programına katkıda bulunmak için başvuruyorum.',consent:true}));
    assert.equal(service.mySubmissions('applicant').length,0);
    assert.equal(Number((db.prepare("SELECT COUNT(*) AS n FROM audit_logs WHERE action='submission.sent'").get() as {n:number}).n),0);
    db.exec('DROP TRIGGER fail_notification;');
    for(let i=0;i<13;i++){
      db.prepare("INSERT INTO users(id,email,display_name,password_hash,status) VALUES(?,?,?,'hash','active')").run(`candidate-${i}`,`candidate-${i}@example.test`,`Araştırmacı ${i}`);
      service.submit(`candidate-${i}`,{opportunityId:input.id,message:'Bu araştırma programına katkıda bulunmak için başvuruyorum.',consent:true});
    }
    const first=service.candidates('publisher',input.id,'','',1),second=service.candidates('publisher',input.id,'','',2);
    assert.equal(first.total,13);assert.equal(first.items.length,10);assert.equal(second.items.length,3);
    assert.equal(new Set([...first.items,...second.items].map(s=>s.id)).size,13);
    assert.equal(service.candidates('publisher',input.id,'candidate-12@').total,1);
    assert.equal(service.mySubmissionPage('candidate-12').total,1);
    assert.equal(service.mySubmissionPage('other').total,0);
  }finally{db.close();}
});
test('creation retries cannot overwrite content or attach a listing to another institution',()=>{
  const {db,service,institution}=setup();
  try{
    const request={key:randomUUID(),name:'Diğer Bilim Enstitüsü',countryCode:'TR',websiteUrl:'https://other.example.org',description:'Diğer kuruma ait bağımsız araştırma merkezi.'};
    const other=service.createInstitution('other',request);
    assert.equal(service.createInstitution('other',request),other);
    assert.throws(()=>service.createInstitution('other',{...request,name:'Değiştirilmiş kurum'}));
    const input=listing(institution);service.saveListing('publisher',input);
    assert.throws(()=>service.saveListing('other',{...input,institutionId:other}));
    assert.throws(()=>service.saveListing('publisher',{...input,title:'Aynı anahtar farklı içerik'}));
    service.saveListing('publisher',{...input,version:1,title:'Güncellenmiş araştırma bursu'});
    assert.throws(()=>service.saveListing('publisher',{...input,version:1,title:'Eski editörün yaptığı değişiklik'}));
    assert.equal(service.listingForManager('publisher',input.id).title,'Güncellenmiş araştırma bursu');
  }finally{db.close();}
});
test('withdrawn submissions require renewed consent; final decisions can reopen with notification',()=>{
 const {db,service,institution}=setup();try{
 service.moderateInstitution('owner',institution,'verified',1);const input=listing(institution);service.saveListing('publisher',input);service.requestReview('publisher',input.id,1);service.moderateListing('owner',input.id,'published',2);
 const id=service.submit('applicant',{opportunityId:input.id,message:'Klinik araştırma deneyimimle bu programa katkı sunmak istiyorum.',consent:true});
 service.withdraw('applicant',id,1);assert.throws(()=>service.resubmit('other',id,2,true));assert.throws(()=>service.resubmit('applicant',id,2,false));
 service.resubmit('applicant',id,2,true);assert.equal(service.mySubmissions('applicant')[0].status,'submitted');
 service.decide('publisher',id,'accepted',3,'Başvurunuz kabul edildi.');service.decide('publisher',id,'reviewing',4,'Karar ek belgeler için yeniden incelemeye açıldı.');
 assert.equal(service.mySubmissions('applicant')[0].status,'reviewing');assert.equal(service.mySubmissions('applicant')[0].version,5);
 }finally{db.close();}
});
