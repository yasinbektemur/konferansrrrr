import {mkdirSync} from 'node:fs';
import {dirname,join,basename,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
export function backupConnection(db:DatabaseSync,source:string,reason='manual'){
 const directory=process.env.BACKUP_DIR?resolve(process.env.BACKUP_DIR):join(dirname(resolve(source)),'backups');
 mkdirSync(directory,{recursive:true,mode:0o700});
 const target=join(directory,`${basename(source,'.db')}-${reason}-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,8)}.db`);
 db.prepare('VACUUM INTO ?').run(target);
 return target;
}
