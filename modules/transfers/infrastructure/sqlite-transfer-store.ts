import {randomUUID} from 'node:crypto';
import type {RelationalDatabase} from '@/modules/shared/infrastructure/database/sqlite-database';
import type {TransferStore,Batch,ImportResult,TransferScope} from '../application/ports';
export class SqliteTransferStore implements TransferStore{
 constructor(private readonly db:RelationalDatabase){}
 transaction<T>(work:()=>T){return this.db.transaction(work);}
 savePreview(batch:Batch,scope:TransferScope){this.transaction(()=>{
  this.db.prepare("DELETE FROM listing_import_batches WHERE status='preview' AND (expires_at<? OR id IN (SELECT id FROM listing_import_batches WHERE actor_id=? AND status='preview' ORDER BY created_at DESC LIMIT -1 OFFSET 20))").run(new Date().toISOString(),batch.actorId);
  this.db.prepare('INSERT INTO listing_import_batches(id,actor_id,scope_key,institution_id,rows_json,expires_at) VALUES(?,?,?,?,?,?)').run(batch.id,batch.actorId,batch.scopeKey,scope.institutionId??null,JSON.stringify(batch.rows),batch.expiresAt);
 });}
 batch(id:string){const r=this.db.prepare('SELECT * FROM listing_import_batches WHERE id=?').get(id) as {id:string;actor_id:string;scope_key:string;rows_json:string;expires_at:string;result_json:string|null}|undefined;return r?{id:r.id,actorId:r.actor_id,scopeKey:r.scope_key,rows:JSON.parse(r.rows_json),expiresAt:r.expires_at,result:r.result_json?JSON.parse(r.result_json):null}:null;}
 reference(scope:string,key:string){return (this.db.prepare('SELECT opportunity_id id FROM listing_import_references WHERE scope_key=? AND reference=?').get(scope,key) as {id:string}|undefined)?.id??null;}
 referenceFor(scope:string,id:string){return (this.db.prepare('SELECT reference FROM listing_import_references WHERE scope_key=? AND opportunity_id=?').get(scope,id) as {reference:string}|undefined)?.reference??null;}
 remember(scope:string,key:string,id:string){this.db.prepare('INSERT INTO listing_import_references(scope_key,reference,opportunity_id) VALUES(?,?,?)').run(scope,key,id);}
 complete(id:string,result:ImportResult){this.db.prepare("UPDATE listing_import_batches SET status='applied',rows_json='[]',result_json=? WHERE id=?").run(JSON.stringify(result),id);}
 audit(actor:string,scope:string,result:ImportResult){this.db.prepare("INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,'listing.import','import',?,?)").run(randomUUID(),actor,scope,JSON.stringify({created:result.created,skipped:result.skipped}));}
}
