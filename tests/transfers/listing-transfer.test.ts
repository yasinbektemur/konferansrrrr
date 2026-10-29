import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createTestDatabase} from '../helpers/database';
import {RecruitmentService} from '@/modules/marketplace/application/recruitment-service';
import {SqliteRecruitmentRepository} from '@/modules/marketplace/infrastructure/sqlite-recruitment-repository';
import {SqliteInstitutionalCatalog} from '@/modules/opportunities/infrastructure/institutional-catalog';
import {SqliteListingTransferTarget} from '@/modules/opportunities/infrastructure/listing-transfer-target';
import {SqliteTransferStore} from '@/modules/transfers/infrastructure/sqlite-transfer-store';
import {ListingTransferService} from '@/modules/transfers/application/listing-transfer-service';
import {listingCsv,type TransferRow} from '@/modules/transfers/domain/listing-csv';
const row:TransferRow={reference:'CALL-001',title:'Biyomedikal araştırma bursu',type:'fellowship',summary:'Klinik yapay zekâ araştırmacılarına destek.',description:'Klinik yapay zekâ alanındaki araştırma deneyiminizi paylaşarak başvurun.',attendance_mode:'online',official_url:'https://example.org/call',deadline:'2099-12-01',apply_mode:'external'};
function setup(){
 const db=createTestDatabase();db.exec("INSERT INTO users(id,email,display_name,password_hash,role,status) VALUES('owner','o@test.dev','Owner','hash','owner','active'),('publisher','p@test.dev','Publisher','hash','user','active'),('other','x@test.dev','Other','hash','user','active')");
 const recruitment=new RecruitmentService(new SqliteRecruitmentRepository(db),new SqliteInstitutionalCatalog(db));
 const id=recruitment.createInstitution('publisher',{key:randomUUID(),name:'Bilim Enstitüsü',countryCode:'TR',websiteUrl:'https://example.org',description:'Biyomedikal araştırmalar yapan bilim enstitüsü.'});
 const scope={kind:'institution' as const,institutionId:id},store=new SqliteTransferStore(db);
 return {db,recruitment,service:new ListingTransferService(store,new SqliteListingTransferTarget(db,recruitment,scope),scope),catalog:new ListingTransferService(store,new SqliteListingTransferTarget(db,recruitment,{kind:'catalog'}),{kind:'catalog'})};
}
test('preview writes no listings; institution imports drafts once and round-trips exports',()=>{
 const {db,service,recruitment}=setup();try{
 const file=listingCsv([row]),preview=service.preview('publisher',file);
 assert.equal(db.prepare('SELECT count(*) n FROM opportunities').get()?.n,0);
 assert.throws(()=>service.commit('other',preview.batchId!));
 const result=service.commit('publisher',preview.batchId!);assert.equal(result.created,1);
 assert.equal(recruitment.listingForManager('publisher',result.ids[0]).status,'draft');
 assert.deepEqual(service.commit('publisher',preview.batchId!),result);
 assert.equal(service.preview('publisher',file).rows[0].action,'skip');
 assert.equal(service.preview('publisher',service.export('publisher')).rows[0].action,'skip');
 assert.throws(()=>service.export('other'));
 assert.ok(service.preview('publisher',listingCsv([{...row,title:'Farklı araştırma bursu'}])).issues.length);
 db.prepare("UPDATE users SET status='suspended' WHERE id='publisher'").run();
 assert.throws(()=>service.commit('publisher',preview.batchId!));
 }finally{db.close();}
});
test('batch failures roll back every row, references and outbox; catalog is admin-only',()=>{
 const {db,catalog}=setup();try{
 assert.throws(()=>catalog.preview('publisher',listingCsv([row])));
 const preview=catalog.preview('owner',listingCsv([row,{...row,reference:'CALL-002',title:'İkinci araştırma çağrısı'}]));
 db.exec("CREATE TRIGGER stop_second BEFORE INSERT ON opportunities WHEN NEW.title='İkinci araştırma çağrısı' BEGIN SELECT RAISE(ABORT,'test'); END;");
 assert.throws(()=>catalog.commit('owner',preview.batchId!));
 assert.equal(db.prepare('SELECT count(*) n FROM opportunities').get()?.n,0);
 assert.equal(db.prepare('SELECT count(*) n FROM listing_import_references').get()?.n,0);
 assert.equal(db.prepare('SELECT count(*) n FROM outbox_events').get()?.n,0);
 db.exec('DROP TRIGGER stop_second');const result=catalog.commit('owner',preview.batchId!);assert.equal(result.created,2);
 const pending=catalog.preview('owner',listingCsv([row,{...row,reference:'CALL-003'}]));
 db.prepare("UPDATE opportunities SET title='Değiştirilmiş başlık' WHERE id=?").run(result.ids[0]);
 assert.throws(()=>catalog.commit('owner',pending.batchId!));
 assert.equal(db.prepare('SELECT count(*) n FROM opportunities').get()?.n,2);
 assert.ok(catalog.preview('owner',listingCsv([{...row,apply_mode:'platform'}])).issues.length);
 }finally{db.close();}
});
