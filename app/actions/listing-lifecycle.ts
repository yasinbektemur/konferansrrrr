'use server';
import {requireUser} from '@/modules/identity/infrastructure/server-auth';
import {getDatabase} from '@/modules/shared/infrastructure/database/server-database';
import {ListingLifecycleService,type ListingCommand} from '@/modules/opportunities/application/listing-lifecycle-service';
import {SqliteListingLifecycleRepository} from '@/modules/opportunities/infrastructure/listing-lifecycle-repository';
import {DomainError} from '@/modules/shared/domain/errors';
import {revalidatePath} from 'next/cache';
export async function listingLifecycleAction(_state:{error?:string;success?:string},form:FormData):Promise<{error?:string;success?:string}>{
 const user=await requireUser();try{const result=new ListingLifecycleService(new SqliteListingLifecycleRepository(getDatabase())).change(user.id,String(form.get('id')),String(form.get('command')) as ListingCommand,Number(form.get('version')));revalidatePath('/','layout');return {success:result.deleted?'İlan çöp kutusuna taşındı.':result.status==='draft'?'İlan taslağa alındı. Düzenleyip yeniden incelemeye gönderebilirsin.':result.status==='published'?'İlan yeniden yayımlandı.':'İlan arşive alındı.'};}catch(error){return {error:error instanceof DomainError?error.message:'İşlem tamamlanamadı.'};}
}
