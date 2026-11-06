import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
for(const dir of ['api','lib','public','scripts','tests']){
 for(const name of await readdir(dir))if(/\.(?:m?js)$/.test(name)){
  const result=spawnSync(process.execPath,['--check',`${dir}/${name}`],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
 }
}
console.log('JavaScript syntax checks passed.');
