import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {SqliteDatabase} from '@/modules/shared/infrastructure/database/sqlite-database';
test('nested work rolls back with its outer transaction',()=>{
 const db=new SqliteDatabase(':memory:');try{
 db.exec('CREATE TABLE sample(id INTEGER PRIMARY KEY)');
 assert.throws(()=>db.transaction(()=>{db.transaction(()=>db.exec('INSERT INTO sample VALUES(1)'));throw Error('fail');}));
 assert.equal(db.prepare('SELECT count(*) n FROM sample').get()?.n,0);
 db.transaction(()=>{db.exec('INSERT INTO sample VALUES(2)');try{db.transaction(()=>{db.exec('INSERT INTO sample VALUES(3)');throw Error('inner');});}catch{}});
 assert.equal(db.prepare('SELECT count(*) n FROM sample').get()?.n,1);
 }finally{db.close();}
});
test('existing files are backed up before migration; failed migrations roll back and release the lock',()=>{
 const folder=mkdtempSync(join(tmpdir(),'radar-life-')),file=join(folder,'app.db');
 const one={version:1,name:'one',sql:'CREATE TABLE sample(id INTEGER PRIMARY KEY); INSERT INTO sample VALUES(42);'};
 const two={version:2,name:'two',sql:'ALTER TABLE sample ADD COLUMN label TEXT;'};
 const db=new SqliteDatabase(file);
 try{
 db.migrate([one]);db.migrate([one,two]);
 const backups=readdirSync(join(folder,'backups'));assert.equal(backups.length,1);
 const copy=new DatabaseSync(join(folder,'backups',backups[0]),{readOnly:true});
 assert.equal(copy.prepare('SELECT id FROM sample').get()?.id,42);assert.equal(copy.prepare('SELECT max(version) v FROM schema_migrations').get()?.v,1);copy.close();
 db.migrate([one,two]);assert.equal(readdirSync(join(folder,'backups')).length,1);
 assert.throws(()=>db.migrate([one,two,{version:3,name:'broken',sql:'CREATE TABLE half(id); INVALID SQL;'}]));
 assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='half'").get(),undefined);
 db.migrate([one,two,{version:3,name:'fixed',sql:'CREATE TABLE complete(id);'}]);
 assert.equal(db.integrityCheck(),true);
 }finally{db.close();rmSync(folder,{recursive:true,force:true});}
});
