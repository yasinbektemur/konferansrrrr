import {test} from 'node:test';import assert from 'node:assert/strict';
import {createTestDatabase,seedOpportunityFixture} from '../helpers/database';
import {ListingLifecycleService} from '@/modules/opportunities/application/listing-lifecycle-service';
import {SqliteListingLifecycleRepository} from '@/modules/opportunities/infrastructure/listing-lifecycle-repository';
import {ResearchWorkspace} from '@/modules/research/research-workspace';
test('archive, unarchive, trash and restore preserve related records and enforce actor/version',()=>{
 const db=createTestDatabase();try{seedOpportunityFixture(db);db.exec("INSERT INTO users(id,email,display_name,password_hash,role,status) VALUES('owner','o@test.dev','Owner','hash','owner','active'),('other','x@test.dev','Other','hash','user','active')");
 const service=new ListingLifecycleService(new SqliteListingLifecycleRepository(db));
 assert.throws(()=>service.change('other','opp-1','archive',1));service.change('owner','opp-1','archive',1);
 assert.equal(db.prepare("SELECT status FROM opportunities WHERE id='opp-1'").get()?.status,'archived');
 service.change('owner','opp-1','unarchive',2);service.change('owner','opp-1','trash',3);
 assert.equal(db.prepare("SELECT count(*) n FROM deadlines WHERE opportunity_id='opp-1'").get()?.n,2);
 assert.throws(()=>service.change('owner','opp-1','restore',3));
 service.change('owner','opp-1','restore',4);
 assert.equal(db.prepare("SELECT deleted_at FROM opportunities WHERE id='opp-1'").get()?.deleted_at,null);
 const workspace=new ResearchWorkspace(db),id=workspace.createCollection('other','Araştırma listem');
 workspace.addItem('other',id,'opp-1');assert.throws(()=>workspace.renameCollection('owner',id,'Başkasının listesi'));
 workspace.removeItem('other',id,'opp-1');assert.equal(workspace.items('other').length,0);
 workspace.trashCollection('other',id,true);assert.equal(workspace.collections('other').length,0);
 workspace.trashCollection('other',id,false);assert.equal(workspace.collections('other').length,1);
 }finally{db.close();}
});
