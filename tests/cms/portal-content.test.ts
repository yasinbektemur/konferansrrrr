import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase} from '../helpers/database';
import {ContentService} from '@/modules/content/content-service';
function setup(){const db=createTestDatabase();db.exec("INSERT INTO users(id,email,display_name,password_hash,role,status) VALUES('owner','o@test.dev','Owner','hash','owner','active'),('editor','e@test.dev','Editor','hash','curator','active'),('reader','r@test.dev','Reader','hash','user','active')");return {db,cms:new ContentService(db)};}
const page={slug:'arastirma-merkezi',title:'Araştırma merkezi',body:'Kurumunuzun araştırma çağrılarını ve çalışmalarını tanıtın.',status:'draft',kind:'page',version:0,showInNavigation:true,showInFooter:true,seoDescription:'Araştırma merkezinin açık çağrıları ve iletişim bilgileri.',blocks:[{id:'intro',type:'text',title:'Araştırma alanlarımız',body:'Biyomedikal mühendislik ve sağlık teknolojileri.'},{id:'contact',type:'callout',title:'Fırsatları incele',body:'Size uygun bir çağrıyla başlayın.',linkLabel:'Keşfet',href:'/?type=conference'}]};
test('CMS pages publish ordered blocks and navigation only after authorization; restore creates a new version',()=>{
 const {db,cms}=setup();try{
  assert.throws(()=>cms.save('reader',page));cms.save('editor',page);
  assert.equal(cms.navigation().some(p=>p.slug===page.slug),false);
  assert.equal(cms.findPublished(page.slug),null);
  cms.save('owner',{...page,status:'published',version:1});
  assert.deepEqual(cms.findPublished(page.slug)?.blocks.map(b=>b.id),['intro','contact']);
  assert.ok(cms.navigation().find(p=>p.slug===page.slug));
  cms.save('owner',{...page,status:'published',version:2,blocks:[page.blocks[1],page.blocks[0]]});
  assert.throws(()=>cms.restore('owner',page.slug,2,2));
  cms.restore('owner',page.slug,2,3);
  assert.equal(cms.findPublished(page.slug)?.version,4);
  assert.equal(cms.findPublished(page.slug)?.blocks[0].id,'intro');
  assert.equal(cms.versions(page.slug).length,4);
 }finally{db.close();}
});
test('CMS rejects executable/redirect links, duplicate block IDs and unauthorized site settings',()=>{
 const {db,cms}=setup();try{
  for(const href of ['javascript:alert(1)','//evil.test','/\\evil.test','https://example.org'])assert.throws(()=>cms.save('owner',{...page,blocks:[{...page.blocks[1],href}]}));
  assert.throws(()=>cms.save('owner',{...page,blocks:[page.blocks[0],page.blocks[0]]}));
  const settings={...cms.siteSettings(),brandName:'Araştırma Ağı',footerText:'Araştırmacılar ve kurumlar için fırsat platformu.',contactEmail:'destek@example.org'};
  assert.throws(()=>cms.saveSettings('editor',settings));
  cms.saveSettings('owner',settings);assert.equal(cms.siteSettings().brandName,'Araştırma Ağı');
  assert.throws(()=>cms.saveSettings('owner',settings));
 }finally{db.close();}
});
