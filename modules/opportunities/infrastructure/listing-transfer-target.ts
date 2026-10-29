import {randomUUID} from 'node:crypto';
import type {RelationalDatabase} from '@/modules/shared/infrastructure/database/sqlite-database';
import {AuthorizationError} from '@/modules/shared/domain/errors';
import type {ListingTransferTarget,TransferScope} from '@/modules/transfers/application/ports';
import type {TransferRow} from '@/modules/transfers/domain/listing-csv';
import type {RecruitmentService} from '@/modules/marketplace/application/recruitment-service';
import {SqliteInstitutionalCatalog} from './institutional-catalog';
import type {Listing} from '@/modules/marketplace/domain/models';
const catalogSelect=`SELECT o.id,o.title,o.type,o.summary,o.description,o.attendance_mode,o.official_url,
 COALESCE((SELECT substr(due_at,1,10) FROM deadlines d WHERE d.opportunity_id=o.id ORDER BY kind='application' DESC,due_at LIMIT 1),'') deadline,
 'external' apply_mode FROM opportunities o WHERE o.deleted_at IS NULL AND NOT EXISTS(SELECT 1 FROM institutional_listings il WHERE il.opportunity_id=o.id)`;
const fromListing=(l:Listing):TransferRow=>({reference:'',title:l.title,type:l.type as TransferRow['type'],summary:l.summary,description:l.description,attendance_mode:l.attendanceMode as TransferRow['attendance_mode'],official_url:l.officialUrl,deadline:l.deadline,apply_mode:l.applyMode});
export class SqliteListingTransferTarget implements ListingTransferTarget{
 constructor(private readonly db:RelationalDatabase,private readonly recruitment:RecruitmentService,private readonly scope:TransferScope){}
 authorize(actorId:string){if(this.scope.kind==='institution'){this.recruitment.institutionForManager(actorId,this.scope.institutionId??'');return;}const user=this.db.prepare("SELECT role FROM users WHERE id=? AND status='active'").get(actorId) as {role:string}|undefined;if(!user||!['owner','admin','curator'].includes(user.role))throw new AuthorizationError();}
 find(id:string){if(this.scope.kind==='institution'){const l=new SqliteInstitutionalCatalog(this.db).get(id);return l&&!l.deletedAt&&l.institutionId===this.scope.institutionId?fromListing(l):null;}
 const r=this.db.prepare(catalogSelect+' AND o.id=?').get(id) as (TransferRow&{id:string})|undefined;return r?{...r,reference:''}:null;}
 create(actorId:string,id:string,row:TransferRow){
  if(this.scope.kind==='institution'){this.recruitment.saveListing(actorId,{id,institutionId:this.scope.institutionId,version:0,title:row.title,type:row.type,summary:row.summary,description:row.description,attendanceMode:row.attendance_mode,officialUrl:row.official_url,deadline:row.deadline,applyMode:row.apply_mode});return;}
  this.db.prepare("INSERT INTO data_sources(id,name,kind,trust_level) VALUES('csv-import','Yönetici CSV aktarımı','manual','unknown') ON CONFLICT(id) DO NOTHING").run();
  this.db.prepare(`INSERT INTO opportunities(id,slug,source_id,type,title,summary,description,status,attendance_mode,official_url,trust_level,confidence_score,published_at) VALUES(?,?,'csv-import',?,?,?,?,'published',?,?,'unknown',0,CURRENT_TIMESTAMP)`).run(id,`csv-${id}`,row.type,row.title,row.summary,row.description,row.attendance_mode,row.official_url);
  this.db.prepare("INSERT INTO deadlines(id,opportunity_id,kind,label,due_at,source_url) VALUES(?,?,'application','Başvuru sonu',?,?)").run(randomUUID(),id,row.deadline,row.official_url);
  this.db.prepare("INSERT INTO outbox_events(id,aggregate_type,aggregate_id,event_type,payload_json) VALUES(?,'opportunity',?,'opportunity.published',?)").run(randomUUID(),id,JSON.stringify({id}));
  this.db.prepare("DELETE FROM cache_entries WHERE namespace='opportunity-facets'").run();
 }
 all(){if(this.scope.kind==='institution')return new SqliteInstitutionalCatalog(this.db).list({institutionId:this.scope.institutionId}).map(l=>({id:l.id,row:fromListing(l)}));
 return (this.db.prepare(catalogSelect+' ORDER BY o.created_at DESC').all() as Array<TransferRow&{id:string}>).map(r=>({id:r.id,row:{...r,reference:''}}));}
}
