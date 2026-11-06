import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseOptions } from '../lib/database-options.mjs';
test('hosted databases enforce TLS certificate verification regardless of URL SSL mode',()=>{
 for(const query of ['', '?sslmode=require','?sslmode=disable','?ssl=false']){
  assert.equal(databaseOptions('postgres://user:dummy@db.example.invalid/app'+query).ssl.rejectUnauthorized,true);
 }
});
test('plaintext is limited to explicit loopback development and never production',()=>{
 assert.equal(databaseOptions('postgres://localhost/app',{allowInsecureLocal:true}).ssl,false);
 for(const host of ['localhost','127.0.0.1','[::1]'])assert.equal(databaseOptions(`postgres://${host}/app`,{production:true,allowInsecureLocal:true}).ssl.rejectUnauthorized,true);
 assert.equal(databaseOptions('postgres://db.example.invalid/app',{allowInsecureLocal:true}).ssl.rejectUnauthorized,true);
 assert.throws(()=>databaseOptions('https://db.example.invalid/app'));
 assert.equal(databaseOptions('postgres://localhost/app',{ca:'test-ca'}).ssl.ca,'test-ca');
});
test('production refuses short rate-limit secrets before accessing the database',async()=>{
 const { saveRequest }=await import('../lib/database.mjs');
 const previous={VERCEL:process.env.VERCEL,RATE_LIMIT_SECRET:process.env.RATE_LIMIT_SECRET};
 process.env.VERCEL='1';process.env.RATE_LIMIT_SECRET='short';
 try{await assert.rejects(saveRequest({},'key'),/at least 32/)}finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value}}
});
