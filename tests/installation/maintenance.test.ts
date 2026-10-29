import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,existsSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=resolve('.'),tsx=require.resolve('tsx');
test('maintenance commands read .env.local, backup WAL consistently, restore only to a new target',()=>{
 const folder=mkdtempSync(join(tmpdir(),'radar-env-'));
 const env:NodeJS.ProcessEnv={...process.env,TSX_TSCONFIG_PATH:join(root,'tsconfig.json')};delete env.DATABASE_PATH;delete env.BACKUP_DIR;delete env.__NEXT_PROCESSED_ENV;
 const run=(name:string,args:string[]=[])=>spawnSync(process.execPath,['--import',tsx,join(root,'scripts',name+'.ts'),...args],{cwd:folder,env,encoding:'utf8'});
 try{
 writeFileSync(join(folder,'.env.local'),'DATABASE_PATH=custom/app.db\n');
 let result=run('seed');assert.equal(result.status,0,result.stderr);
 assert.equal(existsSync(join(folder,'custom/app.db')),true);assert.equal(existsSync(join(folder,'data/app.db')),false);
 result=run('backup');assert.equal(result.status,0,result.stderr);
 const backup=join(folder,'custom/backups',readdirSync(join(folder,'custom/backups'))[0]),target=join(folder,'restored.db');
 result=run('restore',['--source',backup,'--target',target]);assert.equal(result.status,0,result.stderr);
 assert.equal(run('restore',['--source',backup,'--target',target]).status,1);
 result=run('db-doctor');assert.equal(result.status,0,result.stderr);
 writeFileSync(join(folder,'.env.local'),'DATABASE_PATH=missing.db\n');
 assert.equal(run('db-doctor').status,1);assert.equal(existsSync(join(folder,'missing.db')),false);
 }finally{rmSync(folder,{recursive:true,force:true});}
});
