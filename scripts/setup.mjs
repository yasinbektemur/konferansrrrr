import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,mkdirSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {runNpm} from './runtime.mjs';
const step=message=>console.log('\n[Konferans Radar] '+message);
let lock;
try{
 if(Number(process.versions.node.split('.')[0])<24)throw Error('Node.js 24 veya yenisi gerekli.');
 const {DatabaseSync}=await import('node:sqlite');const probe=new DatabaseSync(':memory:');probe.close();
 mkdirSync('.runtime',{recursive:true});lock=openSync('.runtime/setup.lock','wx');writeFileSync(lock,String(process.pid));
 if(!existsSync('package-lock.json'))throw Error('package-lock.json eksik. ZIP dosyasını eksiksiz çıkartın.');
 const fingerprint=createHash('sha256').update(readFileSync('package-lock.json')).update(process.versions.node.split('.')[0]+process.platform+process.arch).digest('hex');
 const marker='.runtime/dependencies.sha256';
 const ready=existsSync(marker)&&readFileSync(marker,'utf8')===fingerprint&&['next','tsx','typescript','zod','@next/env'].every(p=>existsSync('node_modules/'+p+'/package.json'));
 if(ready)step('Bağımlılıklar güncel; indirme atlandı.');
 else{step('Kilit dosyasına göre bağımlılıklar kuruluyor');runNpm(['ci','--include=dev']);writeFileSync(marker,fingerprint);}
 if(!existsSync('.env.local')){writeFileSync('.env.local','DATABASE_PATH=data/app.db\nAPP_URL=http://localhost:3000\n',{flag:'wx',mode:0o600});step('.env.local oluşturuldu.');}
 else step('Mevcut .env.local korunuyor.');
 step('Veritabanı ve içerik hazırlanıyor; gerekli migration öncesinde otomatik yedek alınır.');
 runNpm(['run','db:seed']);runNpm(['run','db:doctor']);
 step('Test, lint ve üretim derlemesi doğrulanıyor');
 runNpm(['test']);runNpm(['run','lint']);runNpm(['run','build']);
 step('Kurulum tamamlandı. Linux/macOS: bash run.sh dev | Windows: .\\run.ps1 dev');
 console.log('Adres: http://localhost:3000 — İlk kullanıcı kaydı sistem sahibi olur.');
}catch(error){console.error('\nKurulum tamamlanamadı: '+error.message);process.exitCode=1;}
finally{if(lock!==undefined){closeSync(lock);unlinkSync('.runtime/setup.lock');}}
