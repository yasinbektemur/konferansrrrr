'use server';
import {revalidatePath} from 'next/cache';
import {requireUser} from '@/modules/identity/infrastructure/server-auth';
import {getListingTransfer} from '@/modules/transfers/infrastructure/server-transfer';
import {DomainError} from '@/modules/shared/domain/errors';
import {MAX_CSV_BYTES} from '@/modules/transfers/domain/listing-csv';
import type {TransferPreview} from '@/modules/transfers/application/listing-transfer-service';
import type {ImportResult,TransferScope} from '@/modules/transfers/application/ports';
export type TransferState={error?:string;preview?:TransferPreview;revision?:string;result?:ImportResult;batchId?:string;csv?:string};
function scope(form:FormData):TransferScope{return form.get('kind')==='institution'?{kind:'institution',institutionId:String(form.get('institutionId')??'')}:{kind:'catalog'};}
export async function previewListings(_state:TransferState,form:FormData):Promise<TransferState>{
 const user=await requireUser(),revision=String(form.get('revision'));
 try{
  let text:string;
  if(form.get('source')==='editor')text=String(form.get('csvText')??'');else{
  const file=form.get('file');
  if(!(file instanceof File)||!file.name.toLowerCase().endsWith('.csv'))return {error:'CSV dosyası seçin. Excel dosyasını önce CSV UTF-8 olarak kaydedin.',revision};
  if(file.size>MAX_CSV_BYTES||file.size===0)return {error:'Dosya boş veya 1 MB sınırını aşıyor. En fazla 200 ilan içeren CSV yükleyin.',revision};
  try{text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());}catch{return {error:'Dosya UTF-8 kodlamasında değil. CSV UTF-8 olarak yeniden kaydedin.',revision};}}
  if(new TextEncoder().encode(text).length>MAX_CSV_BYTES)return {revision,error:'Dosya 1 MB sınırını aşıyor.'};
  return {revision,csv:text,preview:getListingTransfer(scope(form)).preview(user.id,text)};
 }catch(error){return {revision,error:error instanceof DomainError?error.message:'Dosya kontrol edilemedi. Şablonu kontrol edip yeniden deneyin.'};}
}
export async function commitListings(_state:TransferState,form:FormData):Promise<TransferState>{
 const user=await requireUser(),batchId=String(form.get('batchId'));
 try{const result=getListingTransfer(scope(form)).commit(user.id,batchId);revalidatePath('/','layout');return {result,batchId};}
 catch(error){return {batchId,error:error instanceof DomainError?error.message:'Aktarım tamamlanamadı; hiçbir ilan kaydedilmedi. Dosyayı yeniden kontrol edin.'};}
}
