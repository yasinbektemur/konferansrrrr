import './environment';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {migrations} from '../modules/shared/infrastructure/database/migrations';
const path=resolve(process.env.DATABASE_PATH??'data/app.db');
if(!existsSync(path))throw Error('Veritabanı yok. Önce db:seed çalıştırın; DATABASE_PATH ayarını kontrol edin.');
const db=new DatabaseSync(path,{readOnly:true});
try{
 const integrity=db.prepare('PRAGMA integrity_check').get() as Record<string,string>,foreignKeys=db.prepare('PRAGMA foreign_key_check').all();
 const migration=(db.prepare('SELECT MAX(version) version FROM schema_migrations').get() as {version:number}).version;
 const ok=Object.values(integrity)[0]==='ok'&&foreignKeys.length===0&&migration===Math.max(...migrations.map(m=>m.version));
 console.log(JSON.stringify({ok,path,migration,pendingMigrations:migrations.filter(m=>m.version>migration).length,foreignKeyErrors:foreignKeys.length,opportunities:db.prepare('SELECT COUNT(*) count FROM opportunities').get()?.count},null,2));if(!ok)process.exitCode=1;
}finally{db.close();}
