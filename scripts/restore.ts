import './environment';
import {existsSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {migrations} from '../modules/shared/infrastructure/database/migrations';
const args=process.argv.slice(2),sourceArg=args[args.indexOf('--source')+1],targetArg=args[args.indexOf('--target')+1];
if(!args.includes('--source')||!args.includes('--target')||!sourceArg||!targetArg)throw Error('Kullanım: db:restore -- --source yedek.db --target data/restored.db');
const source=resolve(sourceArg),target=resolve(targetArg);
if(!existsSync(source))throw Error('Yedek bulunamadı.');
if([target,target+'-wal',target+'-shm'].some(existsSync))throw Error('Hedef veya WAL dosyası mevcut. Verinin üzerine yazılmaz; yeni bir hedef seçin.');
const db=new DatabaseSync(source,{readOnly:true});
try{
 const check=db.prepare('PRAGMA integrity_check').get() as Record<string,string>;
 if(Object.values(check)[0]!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Yedek bütünlük kontrolünü geçemedi.');
 const version=Number(db.prepare('SELECT MAX(version) version FROM schema_migrations').get()?.version);
 if(version>Math.max(...migrations.map(m=>m.version)))throw Error('Yedek daha yeni uygulama sürümüne ait. Önce kodu güncelleyin.');
 mkdirSync(dirname(target),{recursive:true,mode:0o700});db.prepare('VACUUM INTO ?').run(target);
 console.log('Yedek yeni dosyaya geri yüklendi: '+target+'\nUygulamayı durdurun, DATABASE_PATH değerini bu dosyaya yöneltin; db:seed ve db:doctor çalıştırıp yeniden başlatın.');
}finally{db.close();}
