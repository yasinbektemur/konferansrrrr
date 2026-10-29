import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from '../helpers/database';
import { ContentService } from '@/modules/content/content-service';
test('CMS drafts remain private, updates preserve versions and reject stale editors',()=>{
 const db=createTestDatabase(); db.exec("INSERT INTO users(id,email,display_name,password_hash,role,status) VALUES ('owner','a@b.test','Owner','hash','owner','active'),('reader','r@b.test','Reader','hash','user','active')");
 const cms=new ContentService(db);
 assert.throws(()=>cms.save('reader',{slug:'guide',title:'Araştırma rehberi',body:'Başvuru hazırlık adımları',status:'published',version:0}));
 cms.save('owner',{slug:'guide',title:'Araştırma rehberi',body:'Başvuru hazırlık adımları',status:'draft',version:0});
 assert.equal(cms.published().length,0);
 cms.save('owner',{slug:'guide',title:'Araştırma rehberi',body:'Güncel başvuru hazırlık adımları',status:'published',version:1});
 assert.equal(cms.published().length,1);
 assert.throws(()=>cms.save('owner',{slug:'guide',title:'Eski editör',body:'Eski içerik',status:'draft',version:1}));
 assert.equal(cms.versions('guide').length,2); db.close();
});
