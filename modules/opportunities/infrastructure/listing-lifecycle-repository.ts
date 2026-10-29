import {randomUUID} from 'node:crypto';
import type {RelationalDatabase} from '@/modules/shared/infrastructure/database/sqlite-database';
import type {ListingLifecycleRepository,LifecycleRecord,ListingCommand} from '../application/listing-lifecycle-service';
export class SqliteListingLifecycleRepository implements ListingLifecycleRepository{
 constructor(private readonly db:RelationalDatabase){}
 transaction<T>(work:()=>T){return this.db.transaction(work);}
 find(id:string){return this.db.prepare(`SELECT o.id,o.status,o.version,o.deleted_at deletedAt,il.institution_id institutionId,(SELECT substr(MAX(due_at),1,10) FROM deadlines d WHERE d.opportunity_id=o.id) deadline FROM opportunities o LEFT JOIN institutional_listings il ON il.opportunity_id=o.id WHERE o.id=?`).get(id) as LifecycleRecord|undefined??null;}
 allowed(actorId:string,item:LifecycleRecord){const actor=this.db.prepare("SELECT role FROM users WHERE id=? AND status='active'").get(actorId) as {role:string}|undefined;if(!actor)return false;return ['owner','admin','curator'].includes(actor.role)||Boolean(item.institutionId&&this.db.prepare("SELECT 1 FROM institution_members WHERE institution_id=? AND user_id=? AND role='manager'").get(item.institutionId,actorId));}
 save(actorId:string,item:LifecycleRecord,command:ListingCommand,status:string,deleted:boolean){
 this.db.prepare('UPDATE opportunities SET status=?,deleted_at=?,archived_at=CASE WHEN ?=\'archived\' THEN CURRENT_TIMESTAMP ELSE NULL END,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=?').run(status,deleted?new Date().toISOString():null,status,item.id,item.version);
 this.db.prepare("INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json) VALUES(?,? ,?,'opportunity',?,?)").run(randomUUID(),actorId,'opportunity.'+command,item.id,JSON.stringify({from:item.status,to:status,deleted}));
 this.db.prepare("DELETE FROM cache_entries WHERE namespace='opportunity-facets'").run();
 }
}
