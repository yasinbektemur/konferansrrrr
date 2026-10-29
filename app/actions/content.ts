"use server";
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/modules/identity/infrastructure/server-auth';
import { getDatabase } from '@/modules/shared/infrastructure/database/server-database';
import { ContentService } from '@/modules/content/content-service';
import {redirect} from 'next/navigation';
import {requireUserAdministrator} from '@/modules/identity/infrastructure/server-auth';
type ContentState={error?:string;success?:string;version?:number};
export async function changeContentTrash(_state:ContentState,form:FormData):Promise<ContentState>{const user=await requireAdmin(),deleted=form.get('command')==='trash',slug=String(form.get('slug'));try{new ContentService(getDatabase()).trash(user.id,slug,Number(form.get('version')),deleted);}catch(error){return {error:error instanceof Error?error.message:'İşlem tamamlanamadı.'};}revalidatePath('/','layout');redirect(deleted?'/admin/content?status=trash':`/admin/content?edit=${encodeURIComponent(slug)}`);}
export async function saveContent(_previous:ContentState,form:FormData):Promise<ContentState>{
 const user=await requireAdmin();
 let version:number;
 try{version=new ContentService(getDatabase()).save(user.id,{...Object.fromEntries(form),blocks:JSON.parse(String(form.get('blocks')??'[]'))});}catch(error){return {error:error instanceof Error?error.message:'İçerik kaydedilemedi.'}}
 revalidatePath('/','layout');redirect(`/admin/content?edit=${encodeURIComponent(String(form.get('slug')))}&saved=${version}`);
}
export async function restoreContent(_previous:ContentState,form:FormData):Promise<ContentState>{
 const user=await requireAdmin(),slug=String(form.get('slug'));
 let version:number;
 try{version=new ContentService(getDatabase()).restore(user.id,slug,Number(form.get('sourceVersion')),Number(form.get('version')));}catch(error){return {error:error instanceof Error?error.message:'Sürüm geri yüklenemedi.'};}
 revalidatePath('/','layout');redirect(`/admin/content?edit=${encodeURIComponent(slug)}&restored=${version}`);
}
export async function saveSiteSettings(_previous:ContentState,form:FormData):Promise<ContentState>{
 const user=await requireUserAdministrator();let version:number;
 try{version=new ContentService(getDatabase()).saveSettings(user.id,Object.fromEntries(form));}catch(error){return {error:error instanceof Error?error.message:'Ayarlar kaydedilemedi.'};}
 revalidatePath('/','layout');return {success:'Site ayarları kaydedildi.',version};
}
