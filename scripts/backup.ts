import './environment';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {backupConnection} from '../modules/shared/infrastructure/database/sqlite-backup';
const source=resolve(process.env.DATABASE_PATH??'data/app.db');
if(!existsSync(source))throw Error('Yedeklenecek veritabanı bulunamadı. DATABASE_PATH ayarını kontrol edin.');
const db=new DatabaseSync(source,{readOnly:true});
try{console.log('Tutarlı SQLite yedeği: '+backupConnection(db,source));}finally{db.close();}
