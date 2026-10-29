import {randomUUID} from 'node:crypto';
import type {RelationalDatabase} from '@/modules/shared/infrastructure/database/sqlite-database';
import {AuthorizationError,ConflictError,NotFoundError,ValidationError} from '@/modules/shared/domain/errors';
import {pageSchema,siteSettingsSchema,defaultSiteSettings,type ContentBlock,type SiteSettings} from './domain/page-content';
export type ContentPage={slug:string;title:string;body:string;status:string;kind:'guide'|'page'|'home';version:number;updated_at:string;blocks:ContentBlock[];seoDescription:string;showInNavigation:boolean;showInFooter:boolean;deletedAt?:string|null};
type PageRow={slug:string;title:string;body:string;status:string;kind:ContentPage['kind'];version:number;updated_at:string;blocks_json:string;seo_description:string;show_in_navigation:number;show_in_footer:number;deleted_at?:string|null};
export type ContentRevision=ContentPage&{id:string;created_at:string};
function hydrate(row:PageRow):ContentPage{return {slug:row.slug,title:row.title,body:row.body,status:row.status,kind:row.kind,version:row.version,updated_at:row.updated_at,blocks:JSON.parse(row.blocks_json),seoDescription:row.seo_description,showInNavigation:Boolean(row.show_in_navigation),showInFooter:Boolean(row.show_in_footer),deletedAt:row.deleted_at??null};}
export class ContentService{
  constructor(private readonly db:RelationalDatabase){}
  private authorize(actorId:string,settings=false){const actor=this.db.prepare("SELECT role FROM users WHERE id=? AND status='active'").get(actorId) as {role:string}|undefined;if(!actor||!(settings?['owner','admin']:['owner','admin','curator']).includes(actor.role))throw new AuthorizationError();}
  published(kind:ContentPage['kind']='guide'){return (this.db.prepare("SELECT * FROM content_pages WHERE deleted_at IS NULL AND status='published' AND kind=? ORDER BY updated_at DESC,slug").all(kind) as PageRow[]).map(hydrate);}
  findPublished(slug:string){const row=this.db.prepare("SELECT * FROM content_pages WHERE deleted_at IS NULL AND slug=? AND status='published'").get(slug) as PageRow|undefined;return row?hydrate(row):null;}
  navigation(){return (this.db.prepare("SELECT * FROM content_pages WHERE deleted_at IS NULL AND status='published' AND kind!='home' AND (show_in_navigation=1 OR show_in_footer=1) ORDER BY title").all() as PageRow[]).map(hydrate);}
  list(trash=false){return (this.db.prepare('SELECT * FROM content_pages WHERE deleted_at IS '+(trash?'NOT NULL':'NULL')+' ORDER BY updated_at DESC,slug').all() as PageRow[]).map(hydrate);}
  versions(slug:string){return (this.db.prepare('SELECT * FROM content_revisions WHERE page_slug=? ORDER BY version DESC').all(slug) as Array<PageRow&{id:string;page_slug:string;created_at:string}>).map(row=>({...hydrate({...row,slug:row.page_slug,updated_at:row.created_at}),id:row.id,created_at:row.created_at}));}
  save(actorId:string,input:unknown){
    this.authorize(actorId);const parsed=pageSchema.safeParse(input);if(!parsed.success)throw new ValidationError(parsed.error.issues[0]?.message??'İçerik alanlarını kontrol edin.');const data=parsed.data;
    return this.db.transaction(()=>{
      const existing=this.db.prepare('SELECT version,deleted_at FROM content_pages WHERE slug=?').get(data.slug) as {version:number;deleted_at:string|null}|undefined;
      if(existing?.deleted_at)throw new ConflictError('İçerik çöp kutusunda. Önce geri alın.');
      if((existing?.version??0)!==data.version)throw new ConflictError('İçerik başka bir editör tarafından değiştirildi. Sayfayı yenileyin.');
      const version=data.version+1,blocks=JSON.stringify(data.blocks),nav=Number(data.showInNavigation),footer=Number(data.showInFooter);
      this.db.prepare(`INSERT INTO content_pages(slug,title,body,status,version,author_id,kind,blocks_json,seo_description,show_in_navigation,show_in_footer)
        VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,body=excluded.body,status=excluded.status,version=excluded.version,author_id=excluded.author_id,
        kind=excluded.kind,blocks_json=excluded.blocks_json,seo_description=excluded.seo_description,show_in_navigation=excluded.show_in_navigation,show_in_footer=excluded.show_in_footer,updated_at=CURRENT_TIMESTAMP`).run(data.slug,data.title,data.body,data.status,version,actorId,data.kind,blocks,data.seoDescription,nav,footer);
      this.db.prepare(`INSERT INTO content_revisions(id,page_slug,version,title,body,status,author_id,kind,blocks_json,seo_description,show_in_navigation,show_in_footer) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(randomUUID(),data.slug,version,data.title,data.body,data.status,actorId,data.kind,blocks,data.seoDescription,nav,footer);
      this.audit(actorId,'content.save',data.slug,{status:data.status,version,kind:data.kind});return version;
    });
  }
  restore(actorId:string,slug:string,sourceVersion:number,expectedVersion:number){
    this.authorize(actorId);const revision=this.versions(slug).find(r=>r.version===sourceVersion);if(!revision)throw new NotFoundError('İçerik sürümü');
    return this.save(actorId,{...revision,slug,version:expectedVersion});
  }
  siteSettings():SiteSettings{const row=this.db.prepare('SELECT value_json,version FROM site_settings WHERE id=1').get() as {value_json:string;version:number}|undefined;return row?{...JSON.parse(row.value_json),version:row.version}:{...defaultSiteSettings};}
  trash(actorId:string,slug:string,version:number,deleted:boolean){this.authorize(actorId);if(slug==='ana-sayfa')throw new ConflictError('Ana sayfa silinemez; içeriğini düzenleyebilirsiniz.');this.db.transaction(()=>{const result=this.db.prepare("UPDATE content_pages SET deleted_at=?,status='archived',version=version+1,updated_at=CURRENT_TIMESTAMP WHERE slug=? AND version=?").run(deleted?new Date().toISOString():null,slug,version);if(!result.changes)throw new ConflictError('İçerik değişti; sayfayı yenileyin.');this.audit(actorId,deleted?'content.trash':'content.restore',slug,{version:version+1});});}
  saveSettings(actorId:string,input:unknown){
    this.authorize(actorId,true);const parsed=siteSettingsSchema.safeParse(input);if(!parsed.success)throw new ValidationError('Site adı, açıklama ve iletişim alanlarını kontrol edin.');const data=parsed.data;
    return this.db.transaction(()=>{if(this.siteSettings().version!==data.version)throw new ConflictError('Site ayarları değişti. Sayfayı yenileyin.');const version=data.version+1;
      this.db.prepare('INSERT INTO site_settings(id,value_json,version,updated_by) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET value_json=excluded.value_json,version=excluded.version,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP').run(JSON.stringify({...data,version}),version,actorId);
      this.audit(actorId,'site.settings','site',{version});return version;
    });
  }
  private audit(actorId:string,action:string,id:string,metadata:Record<string,unknown>){this.db.prepare("INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,'content',?,?)").run(randomUUID(),actorId,action,id,JSON.stringify(metadata));}
}
