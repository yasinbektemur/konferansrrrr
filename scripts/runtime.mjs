import {existsSync,realpathSync} from 'node:fs';
import {dirname,join,delimiter} from 'node:path';
import {spawnSync} from 'node:child_process';
export function npmCli(){
 const bin=dirname(process.execPath),candidates=[process.env.RADAR_NPM_CLI,process.env.npm_execpath,join(bin,'node_modules/npm/bin/npm-cli.js'),join(bin,'../lib/node_modules/npm/bin/npm-cli.js'),'/usr/share/nodejs/npm/bin/npm-cli.js'].filter(Boolean);
 for(const file of candidates)if(existsSync(file)&&!file.endsWith('.cmd'))return realpathSync(file);
 throw Error('npm bulunamadı. install.sh veya install.ps1 komutunu yeniden çalıştırın.');
}
export function runNpm(args,options={}){
 const result=spawnSync(process.execPath,[npmCli(),...args],{stdio:'inherit',...options,env:{...process.env,...options.env,PATH:dirname(process.execPath)+delimiter+(process.env.PATH??'')}});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error(`npm ${args.join(' ')} başarısız oldu (çıkış: ${result.status??result.signal}). Önce bu hatayı giderin; sonra kurulumu yeniden çalıştırın.`);
}
