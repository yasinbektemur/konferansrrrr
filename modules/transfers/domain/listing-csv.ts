import {z} from 'zod';
import {opportunityTypes} from '@/modules/opportunities/domain/opportunity';
import {parseCsv,writeCsv} from './csv';
export const listingColumns=[
 {key:'reference',label:'İlan referansı',rule:'Zorunlu; 1–100 karakter. Her ilan için sabit ve benzersiz kod.'},
 {key:'title',label:'Başlık',rule:'Zorunlu; 8–180 karakter.'},
 {key:'type',label:'Fırsat türü',rule:opportunityTypes.join(', ')},
 {key:'summary',label:'Kısa özet',rule:'Zorunlu; 20–400 karakter.'},
 {key:'description',label:'Açıklama',rule:'Zorunlu; 40–12000 karakter.'},
 {key:'attendance_mode',label:'Katılım',rule:'onsite, online, hybrid, not_applicable'},
 {key:'official_url',label:'Resmî çağrı adresi',rule:'Zorunlu; http:// veya https:// ile başlayan tam adres.'},
 {key:'deadline',label:'Son tarih',rule:'Zorunlu; YYYY-MM-DD, geçerli ve geçmişte olmayan UTC tarih.'},
 {key:'apply_mode',label:'Başvuru kanalı',rule:'external: resmî site; platform: kurum paneline başvuru. Katalog aktarımında external kullanın.'}
] as const;
export type TransferRow={reference:string;title:string;type:typeof opportunityTypes[number];summary:string;description:string;attendance_mode:'onsite'|'online'|'hybrid'|'not_applicable';official_url:string;deadline:string;apply_mode:'external'|'platform'};
export type ImportIssue={line:number;column:string;value:string;message:string;hint:string};
export type CheckedRow={line:number;data:TransferRow};
export const transferSchema=z.object({
 reference:z.string().trim().min(1).max(100),title:z.string().trim().min(8).max(180),type:z.enum(opportunityTypes),
 summary:z.string().trim().min(20).max(400),description:z.string().trim().min(40).max(12000),
 attendance_mode:z.enum(['onsite','online','hybrid','not_applicable']),
 official_url:z.url().refine(v=>['http:','https:'].includes(new URL(v).protocol)),
 deadline:z.iso.date(),apply_mode:z.enum(['external','platform'])
});
export const MAX_CSV_BYTES=1024*1024,MAX_CSV_ROWS=200;
export function validateListingCsv(text:string){
 const issues:ImportIssue[]=[],rows:CheckedRow[]=[];
 const issue=(line:number,column:string,value:string,message:string,hint:string)=>issues.push({line,column,value:value.slice(0,120),message,hint});
 if(new TextEncoder().encode(text).length>MAX_CSV_BYTES){issue(0,'dosya','','Dosya 1 MB sınırını aşıyor.','Dosyayı en fazla 200 ilan içeren parçalara bölün.');return {issues,rows,total:0};}
 let records;try{records=parseCsv(text).records;}catch(e){issue(0,'dosya','',String((e as Error).message),'Şablonu indirin; dosyayı UTF-8 CSV olarak kaydedin.');return {issues,rows,total:0};}
 if(!records.length){issue(1,'başlık','','Dosya boş.','Şablona en az bir ilan ekleyin.');return {issues,rows,total:0};}
 const headers=records[0].cells.map(h=>h.trim().toLowerCase()),keys=listingColumns.map(c=>c.key),total=records.length-1;
 for(const key of headers)if(!keys.includes(key as typeof keys[number]))issue(1,key,key,'Bilinmeyen sütun.','Şablondaki sütun adlarını kullanın; bu sütunu kaldırın.');
 for(const c of listingColumns){const count=headers.filter(h=>h===c.key).length;if(count!==1)issue(1,c.key,'',count?'Sütun birden fazla yazılmış.':'Zorunlu sütun eksik.',`${c.key} sütunu tam bir kez bulunmalı.`);}
 if(total<1||total>MAX_CSV_ROWS)issue(1,'dosya',String(total),'Dosya 1–200 ilan içermeli.','Dosyayı bölün veya en az bir ilan ekleyin.');
 if(issues.length)return {issues,rows,total};
 const references=new Set<string>();
 for(const record of records.slice(1)){
  if(record.cells.length!==headers.length){issue(record.line,'satır','',`Beklenen ${headers.length}, bulunan ${record.cells.length} alan.`,'Virgül veya satır sonu içeren metinleri çift tırnak içine alın.');continue;}
  const raw=Object.fromEntries(headers.map((h,i)=>[h,record.cells[i].trim()])),result=transferSchema.safeParse(raw);
  if(!result.success){for(const error of result.error.issues){const column=String(error.path[0]),definition=listingColumns.find(c=>c.key===column);issue(record.line,column,raw[column]??'','Alan eksik veya biçimi geçersiz.',definition?.rule??'Şablondaki kurala uyun.');}}
  if(raw.deadline&&/^\d{4}-\d{2}-\d{2}$/.test(raw.deadline)&&raw.deadline<new Date().toISOString().slice(0,10))issue(record.line,'deadline',raw.deadline,'Son tarih geçmişte.','İlandaki güncel tarihi YYYY-MM-DD biçiminde yazın.');
  if(references.has(raw.reference))issue(record.line,'reference',raw.reference,'Dosyada aynı referans tekrar ediyor.','Tekrarlanan satırı kaldırın veya farklı ilan için ayrı referans kullanın.');
  references.add(raw.reference);
  if(result.success)rows.push({line:record.line,data:result.data});
 }
 return {issues,rows,total};
}
export function listingCsv(rows:TransferRow[]){return writeCsv([listingColumns.map(c=>c.key),...rows.map(r=>listingColumns.map(c=>r[c.key]))]);}
export function listingTemplate(){return listingCsv([{reference:'CALL-001',title:'Biyomedikal araştırma bursu',type:'fellowship',summary:'Klinik yapay zekâ araştırmacılarına destek.',description:'Klinik yapay zekâ alanındaki araştırma deneyiminizi paylaşarak başvurun.',attendance_mode:'online',official_url:'https://example.org/call',deadline:`${new Date().getUTCFullYear()+1}-12-01`,apply_mode:'external'}]);}
