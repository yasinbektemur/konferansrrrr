import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase,seedOpportunityFixture} from '../helpers/database';
import {ApplicationService} from '@/modules/applications/application/application-service';
import {ApplicationTasks} from '@/modules/applications/application/application-tasks';
import {ApplicationQueries} from '@/modules/applications/infrastructure/application-queries';
import {ResearchWorkspace} from '@/modules/research/research-workspace';
import {ContentService} from '@/modules/content/content-service';
import {randomUUID} from 'node:crypto';

function setup(){const db=createTestDatabase();seedOpportunityFixture(db);db.exec("INSERT INTO users(id,email,password_hash,display_name,role) VALUES('owner','owner@test.dev','hash','Owner','owner'),('other','other@test.dev','hash','Other','user')");return db;}

test('preparation trash preserves tasks and membership, rejects strangers and stale versions, and restart restores the same record',()=>{
 const db=setup();try{
  const service=new ApplicationService(db,{next:randomUUID}),tasks=new ApplicationTasks(db),queries=new ApplicationQueries(db),workspace=new ResearchWorkspace(db);
  const {id}=service.start({userId:'owner',opportunityId:'opp-1'});tasks.add('owner',id,'Belgeleri hazırla');
  const version=queries.boardForUser('owner')[0].version;
  assert.throws(()=>service.change('other',id,version,'trash'));
  service.change('owner',id,version,'trash');
  assert.equal(queries.boardForUser('owner').length,0);assert.equal(queries.boardForUser('owner',true)[0].taskCount,1);assert.equal(workspace.summary('owner').tasks,0);
  assert.throws(()=>service.change('owner',id,version,'restore'));
  assert.equal(service.start({userId:'owner',opportunityId:'opp-1'}).id,id);
  assert.equal(queries.boardForUser('owner')[0].taskCount,1);assert.equal(workspace.summary('owner').tasks,1);
  const current=queries.boardForUser('owner')[0].version;service.change('owner',id,current,'deadline','2099-01-10');service.change('owner',id,current+1,'deadline','');
  assert.equal(queries.boardForUser('owner')[0].internalDeadline,null);assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 }finally{db.close();}
});

test('task edits and reverse operations retain identity and enforce membership',()=>{
 const db=setup();try{
  const {id}=new ApplicationService(db,{next:randomUUID}).start({userId:'owner',opportunityId:'opp-1'}),tasks=new ApplicationTasks(db);
  tasks.add('owner',id,'İlk görev');const task=tasks.list('owner',id)[0];
  assert.throws(()=>tasks.change('other',task.id,'trash'));tasks.complete('owner',task.id);tasks.change('owner',task.id,'reopen');tasks.change('owner',task.id,'rename','Güncellenmiş görev');
  assert.equal(tasks.list('owner',id)[0].status,'todo');tasks.change('owner',task.id,'trash');assert.equal(tasks.list('owner',id).length,0);assert.equal(tasks.list('owner',id,true)[0].id,task.id);
  tasks.change('owner',task.id,'restore');assert.equal(tasks.list('owner',id)[0].title,'Güncellenmiş görev');
 }finally{db.close();}
});

test('collection trash retains memberships while restore and item removal stay owner scoped',()=>{
 const db=setup();try{
  const workspace=new ResearchWorkspace(db),id=workspace.createCollection('owner','Başlangıç koleksiyonu');workspace.addItem('owner',id,'opp-1');
  assert.throws(()=>workspace.trashCollection('other',id,true));workspace.trashCollection('owner',id,true);assert.equal(workspace.collections('owner').length,0);assert.equal(workspace.items('owner').length,0);
  workspace.trashCollection('owner',id,false);assert.equal(workspace.collections('owner')[0].item_count,1);workspace.renameCollection('owner',id,'Yeni koleksiyon');workspace.removeItem('owner',id,'opp-1');assert.equal(workspace.collections('owner')[0].item_count,0);
 }finally{db.close();}
});

test('CMS trash removes public navigation without deleting revisions and restores archived content',()=>{
 const db=setup();try{
  const cms=new ContentService(db);cms.save('owner',{slug:'geri-alma',title:'Geri alınabilir içerik',body:'Bu içerik geri alınırken sürümler ve bağlantılar korunur.',kind:'page',status:'published',version:0,showInNavigation:true,showInFooter:true,seoDescription:'',blocks:[]});
  assert.throws(()=>cms.trash('other','geri-alma',1,true));cms.trash('owner','geri-alma',1,true);assert.equal(cms.findPublished('geri-alma'),null);assert.equal(cms.navigation().some(p=>p.slug==='geri-alma'),false);assert.equal(cms.versions('geri-alma').length,1);
  assert.throws(()=>cms.trash('owner','geri-alma',1,false));cms.trash('owner','geri-alma',2,false);assert.equal(cms.findPublished('geri-alma'),null);assert.equal(cms.versions('geri-alma').length,1);assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 }finally{db.close();}
});
