import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request } from 'node:http';
import { createAppServer } from '../scripts/dev.mjs';
async function withServer(fn){
 const server=createAppServer({apiHandler:async(req,res)=>res.status(201).json({id:'test-only'})});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{await fn(`http://127.0.0.1:${server.address().port}`)}finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
}
test('local routes deliver branded 404s, correct favicon type and security headers',()=>withServer(async base=>{
 let response=await fetch(base+'/missing-page');assert.equal(response.status,404);assert.match(await response.text(),/Page not found/);
 response=await fetch(base+'/favicon.svg');assert.match(response.headers.get('content-type'),/^image\/svg\+xml/);assert.match(response.headers.get('content-security-policy'),/script-src 'self'/);
 for(const path of ['/.env.local','/package.json','/lib/database.mjs'])assert.equal((await fetch(base+path)).status,404);
 response=await fetch(base+'/missing-page',{method:'HEAD'});assert.equal(response.status,404);assert.equal(await response.text(),'');
}));
test('malformed, oversized and aborted POST requests do not stop the server',()=>withServer(async base=>{
 let response=await fetch(base+'/api/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(response.status,400);
 response=await fetch(base+'/api/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(12001)});assert.equal(response.status,413);
 await new Promise(resolve=>{const req=request(base+'/api/requests',{method:'POST',headers:{'Content-Type':'application/json','Content-Length':'10000'}});req.on('error',resolve);req.write('{');setTimeout(()=>req.destroy(),20)});
 assert.equal((await fetch(base+'/')).status,200);
}));
