import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, cp, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('production output includes metadata/404 and excludes server source and secrets',async()=>{
 const root=await mkdtemp(join(tmpdir(),'manoel-build-'));
 try{
  for(const path of ['scripts','lib','public'])await cp(path,join(root,path),{recursive:true});
  for(const path of ['index.html','vercel.json'])await cp(path,join(root,path));
  const result=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,env:{...process.env,SITE_URL:'https://example.invalid',VERCEL_ENV:'production'},encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const html=await readFile(join(root,'dist/index.html'),'utf8');assert.ok(html.includes('rel="canonical" href="https://example.invalid/"'));
  assert.ok((await readFile(join(root,'dist/404.html'),'utf8')).includes('noindex'));
  assert.ok((await readFile(join(root,'dist/robots.txt'),'utf8')).includes('Sitemap: https://example.invalid/sitemap.xml'));
  assert.ok((await readFile(join(root,'dist/sitemap.xml'),'utf8')).includes('<loc>https://example.invalid/</loc>'));
  assert.ok(!(await readdir(join(root,'dist'))).some(name=>['lib','api','scripts','.env.local'].includes(name)));
  const invalid=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,env:{...process.env,SITE_URL:'http://example.invalid',VERCEL_ENV:'production'},encoding:'utf8'});assert.notEqual(invalid.status,0);
 }finally{await rm(root,{recursive:true,force:true})}
});
