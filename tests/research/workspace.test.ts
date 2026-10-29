import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase,seedOpportunityFixture} from '../helpers/database';
import {ResearchWorkspace} from '@/modules/research/research-workspace';
test('collections isolate users and duplicate membership is harmless',()=>{const db=createTestDatabase();seedOpportunityFixture(db);db.exec("INSERT INTO users(id,email,display_name,password_hash,role,status) VALUES ('a','a@t.dev','A','hash','user','active'),('b','b@t.dev','B','hash','user','active')");const w=new ResearchWorkspace(db);const id=w.createCollection('a','Klinik araştırma');w.addItem('a',id,'opp-1');w.addItem('a',id,'opp-1');assert.equal(w.collections('a')[0].item_count,1);assert.equal(w.collections('b').length,0);assert.throws(()=>w.addItem('b',id,'opp-1'));db.close()});
test('notification order stays stable when read state changes and hidden items remain recoverable',()=>{
 const db=createTestDatabase();try{
  db.exec("INSERT INTO users(id,email,password_hash,display_name) VALUES('reader','reader@test.dev','hash','Reader'); INSERT INTO notifications(id,user_id,kind,title,body,created_at,deduplication_key) VALUES('first','reader','update','First','Body','2026-10-01 00:00:00','first'),('second','reader','update','Second','Body','2026-10-01 00:00:00','second')");
  const workspace=new ResearchWorkspace(db),initial=workspace.notifications('reader').map(n=>n.id),id=initial[0];
  workspace.markRead('reader',id);assert.deepEqual(workspace.notifications('reader').map(n=>n.id),initial);
  workspace.markUnread('reader',id);assert.equal(workspace.notifications('reader')[0].read_at,null);
  workspace.hideNotification('reader',id,true);assert.equal(workspace.notifications('reader').length,1);assert.equal(workspace.notifications('reader',true)[0].id,id);
  workspace.hideNotification('reader',id,false);assert.deepEqual(workspace.notifications('reader').map(n=>n.id),initial);
 }finally{db.close();}
});
