import type {CheckedRow,TransferRow} from '../domain/listing-csv';
export type TransferScope={kind:'catalog'|'institution';institutionId?:string};
export function scopeKey(scope:TransferScope){return scope.kind==='catalog'?'catalog':`institution:${scope.institutionId}`;}
export type Batch={id:string;actorId:string;scopeKey:string;rows:CheckedRow[];expiresAt:string;result:ImportResult|null};
export type ImportResult={created:number;skipped:number;ids:string[]};
export interface TransferStore {
 transaction<T>(work:()=>T):T;
 savePreview(batch:Batch,scope:TransferScope):void;
 batch(id:string):Batch|null;
 reference(scope:string,key:string):string|null;
 referenceFor(scope:string,id:string):string|null;
 remember(scope:string,key:string,id:string):void;
 complete(id:string,result:ImportResult):void;
 audit(actor:string,scope:string,result:ImportResult):void;
}
export interface ListingTransferTarget {
 authorize(actorId:string):void;
 find(id:string):TransferRow|null;
 create(actorId:string,id:string,row:TransferRow):void;
 all():Array<{id:string;row:TransferRow}>;
}
