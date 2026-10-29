'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/modules/identity/infrastructure/server-auth';
import { getRecruitment } from '@/modules/marketplace/infrastructure/server-recruitment';
import { DomainError } from '@/modules/shared/domain/errors';
import { StructuredLogger } from '@/modules/shared/infrastructure/logger';
import type { InstitutionStatus, SubmissionStatus } from '@/modules/marketplace/domain/models';

export type MarketplaceActionState={error?:string;success?:string};
export async function marketplaceAction(_state:MarketplaceActionState,form:FormData):Promise<MarketplaceActionState>{
  const user=await requireUser(),service=getRecruitment();
  const value=(key:string)=>String(form.get(key)??'');
  const id=value('id'),version=Number(value('version'));let destination='';
  try{
    switch(value('command')){
      case 'institution':destination=`/kurum-paneli/${service.createInstitution(user.id,Object.fromEntries(form))}`;break;
      case 'institution-update':service.updateInstitution(user.id,id,Object.fromEntries(form));break;
      case 'institution-deactivate':case 'institution-reactivate':service.setInstitutionActive(user.id,id,version,value('command')==='institution-reactivate');break;
      case 'institution-review':service.moderateInstitution(user.id,id,value('status') as InstitutionStatus,version);break;
      case 'listing':destination=`/kurum-paneli/ilan/${service.saveListing(user.id,Object.fromEntries(form))}`;break;
      case 'review':service.requestReview(user.id,id,version);break;
      case 'close':service.closeListing(user.id,id,version);break;
      case 'moderate':service.moderateListing(user.id,id,value('status') as 'published'|'rejected',version);break;
      case 'submit':service.submit(user.id,{opportunityId:id,message:value('message'),consent:form.get('consent')==='on'});break;
      case 'decide':service.decide(user.id,id,value('status') as SubmissionStatus,version,value('note'));break;
      case 'withdraw':service.withdraw(user.id,id,version);break;
      case 'resubmit':service.resubmit(user.id,id,version,form.get('consent')==='on');break;
      default:return {error:'Geçersiz işlem.'};
    }
  }catch(error){
    if(!(error instanceof DomainError))new StructuredLogger('marketplace').error('command.failed',error,{command:value('command')});
    return {error:error instanceof DomainError?error.message:'İşlem tamamlanamadı. Alanları kontrol edip yeniden deneyin.'};
  }
  revalidatePath('/','layout');
  if(destination)redirect(destination);
  return {success:'İşlem kaydedildi.'};
}
