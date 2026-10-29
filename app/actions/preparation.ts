'use server';
import {requireUser} from '@/modules/identity/infrastructure/server-auth';
import {getDatabase} from '@/modules/shared/infrastructure/database/server-database';
import {ApplicationService} from '@/modules/applications/application/application-service';
import {UuidIdentifierGenerator} from '@/modules/shared/domain/identifier';
import {revalidatePath} from 'next/cache';
export async function preparationAction(_state:{error?:string;success?:string},form:FormData):Promise<{error?:string;success?:string}>{const user=await requireUser(),command=String(form.get('command'));if(!['trash','restore','deadline'].includes(command))return {error:'Geçersiz işlem.'};try{new ApplicationService(getDatabase(),new UuidIdentifierGenerator()).change(user.id,String(form.get('id')),Number(form.get('version')),command as 'trash'|'restore'|'deadline',String(form.get('deadline')??''));revalidatePath('/','layout');return {success:'Hazırlık alanı güncellendi.'};}catch(error){return {error:error instanceof Error?error.message:'İşlem tamamlanamadı.'};}}
