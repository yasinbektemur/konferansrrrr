import {runNpm} from './runtime.mjs';
const [command='dev',...args]=process.argv.slice(2);
if(!['dev','start','build','test','lint','typecheck','db:seed','db:backup','db:doctor','db:restore'].includes(command))throw Error('Desteklenmeyen komut.');
try{runNpm(['run',command,...(args.length?['--',...args]:[])]);}catch(error){console.error(error.message);process.exitCode=1;}
