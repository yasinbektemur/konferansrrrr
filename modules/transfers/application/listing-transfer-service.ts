import {randomUUID} from 'node:crypto';
import {AuthorizationError,ConflictError,ValidationError} from '@/modules/shared/domain/errors';
import {listingColumns,listingCsv,validateListingCsv,type ImportIssue,type TransferRow} from '../domain/listing-csv';
import {scopeKey,type TransferStore,type ListingTransferTarget,type TransferScope} from './ports';
export type PreviewRow={line:number;data:TransferRow;action:'create'|'skip'};
export type TransferPreview={batchId?:string;issues:ImportIssue[];rows:PreviewRow[];total:number};
const equal=(a:TransferRow,b:TransferRow)=>listingColumns.filter(c=>c.key!=='reference').every(c=>a[c.key]===b[c.key]);
export class ListingTransferService{
 constructor(private readonly store:TransferStore,private readonly target:ListingTransferTarget,private readonly scope:TransferScope){}
 private check(row:TransferRow){const id=this.store.reference(scopeKey(this.scope),row.reference)??(row.reference.startsWith('id:')?row.reference.slice(3):null);if(!id)return {action:'create' as const,id:null};const current=this.target.find(id);if(!current||!equal(current,row))throw new ConflictError('Bu referansın mevcut içeriği farklı veya artık erişilemiyor.');return {action:'skip' as const,id};}
 preview(actorId:string,text:string):TransferPreview{
  this.target.authorize(actorId);const checked=validateListingCsv(text),issues=[...checked.issues],rows:PreviewRow[]=[];
  for(const row of checked.rows){try{if(this.scope.kind==='catalog'&&row.data.apply_mode!=='external')throw new ValidationError('Katalog ilanları için external kullanın; platform başvurusu kurum panelinden açılır.');
    rows.push({...row,action:this.check(row.data).action});
   }catch(e){issues.push({line:row.line,column:'reference / apply_mode',value:row.data.reference,message:(e as Error).message,hint:'Mevcut ilanı kendi düzenleme ekranından değiştirin. Yeni ilan için yeni referans kullanın.'});}}
  if(issues.length)return {issues,rows,total:checked.total};
  const id=randomUUID();this.store.savePreview({id,actorId,scopeKey:scopeKey(this.scope),rows:checked.rows,expiresAt:new Date(Date.now()+30*60*1000).toISOString(),result:null},this.scope);
  return {batchId:id,issues,rows,total:checked.total};
 }
 commit(actorId:string,batchId:string){
  return this.store.transaction(()=>{
   this.target.authorize(actorId);const batch=this.store.batch(batchId);
   if(!batch||batch.actorId!==actorId||batch.scopeKey!==scopeKey(this.scope))throw new AuthorizationError();
   if(batch.result)return batch.result;
   if(batch.expiresAt<new Date().toISOString())throw new ConflictError('Önizleme süresi doldu. Dosyayı yeniden kontrol edin.');
   const check=validateListingCsv(listingCsv(batch.rows.map(r=>r.data)));if(check.issues.length)throw new ValidationError('Önizlemeden sonra tarih veya alan koşulları değişti. Dosyayı yeniden kontrol edin.');
   const result={created:0,skipped:0,ids:[] as string[]};
   for(const {data}of batch.rows){const existing=this.check(data);if(existing.action==='skip'){result.skipped++;continue;}
    const id=randomUUID();this.target.create(actorId,id,data);this.store.remember(batch.scopeKey,data.reference,id);result.ids.push(id);result.created++;
   }
   this.store.complete(batchId,result);this.store.audit(actorId,batch.scopeKey,result);return result;
  });
 }
 export(actorId:string){this.target.authorize(actorId);return listingCsv(this.target.all().map(({id,row})=>({...row,reference:this.store.referenceFor(scopeKey(this.scope),id)??`id:${id}`})));}
}
