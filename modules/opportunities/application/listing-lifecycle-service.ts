import {AuthorizationError,ConflictError,NotFoundError} from '@/modules/shared/domain/errors';
export type ListingCommand='archive'|'unarchive'|'trash'|'restore';
export type LifecycleRecord={id:string;status:string;version:number;deletedAt:string|null;institutionId:string|null;deadline:string|null};
export interface ListingLifecycleRepository{transaction<T>(work:()=>T):T;find(id:string):LifecycleRecord|null;allowed(actorId:string,item:LifecycleRecord):boolean;save(actorId:string,item:LifecycleRecord,command:ListingCommand,status:string,deleted:boolean):void;}
export class ListingLifecycleService{
 constructor(private readonly repository:ListingLifecycleRepository){}
 change(actorId:string,id:string,command:ListingCommand,version:number){
  return this.repository.transaction(()=>{
   const item=this.repository.find(id);if(!item)throw new NotFoundError('İlan');if(!this.repository.allowed(actorId,item))throw new AuthorizationError();
   if(!['archive','unarchive','trash','restore'].includes(command))throw new ConflictError('Geçersiz işlem.');
   if(item.version!==version)throw new ConflictError('İlan değişti. Sayfayı yenileyip tekrar deneyin.');
   if(command==='restore'&&!item.deletedAt||command!=='restore'&&item.deletedAt)throw new ConflictError('İlanın mevcut durumunda bu işlem yapılamaz.');
   if(command==='unarchive'&&item.status!=='archived')throw new ConflictError('İlan arşivde değil.');
   const status=command==='unarchive'?(item.institutionId?'draft':'published'):'archived';
   if(status==='published'&&item.deadline&&item.deadline<new Date().toISOString().slice(0,10))throw new ConflictError('Son tarih geçmişte. İlanı düzenleyip tarihi güncelleyin.');
   this.repository.save(actorId,item,command,status,command==='trash');
   return {status,deleted:command==='trash'};
  });
 }
}
