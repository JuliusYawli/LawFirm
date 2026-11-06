import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRequest, createHandler } from '../lib/requests.mjs';
const valid = {name:'Maria Silva',email:'maria@example.com',message:'I would like an appointment.',language:'en',preferredDate:''};
test('validates requests and rejects malformed fields',()=>{
 assert.equal(validateRequest(valid).email, valid.email);
 for(const patch of [{name:''},{email:'bad'},{message:'x'},{language:'fr'},{preferredDate:'2020-01-01'},{preferredDate:'2099-02-30'},{name:[]},{message:'x'.repeat(2001)}]) assert.throws(()=>validateRequest({...valid,...patch}));
});
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(v){this.body=v;return this},end(){return this}}}
test('only confirms after saving; rate limit and storage failure are explicit',async()=>{
 const req={method:'POST',headers:{'content-type':'application/json'},body:valid,socket:{remoteAddress:'127.0.0.1'}};
 let saved;
 let res=response();await createHandler(async v=>{saved=v;return 'abc'})(req,res);assert.equal(res.code,201);assert.equal(saved.name,valid.name);
 res=response();await createHandler(async()=>null)(req,res);assert.equal(res.code,429);
 res=response();await createHandler(async()=>{throw Error('offline')})(req,res);assert.equal(res.code,503);
 res=response();await createHandler(async()=>{throw Error('must not save')})({...req,body:{...valid,email:'bad'}},res);assert.equal(res.code,400);
 res=response();await createHandler(async()=>{})({...req,method:'GET'},res);assert.equal(res.code,405);
 res=response();await createHandler(async()=>{})({...req,body:{...valid,website:'spam'}},res);assert.equal(res.code,400);
});
test('rejects oversized payloads, unsupported content types and non-object input',async()=>{
 const handler=createHandler(async()=>{throw Error('must not save')});
 for(const [patch,expected] of [[{headers:{'content-type':'text/plain'}},415],[{headers:{'content-type':'application/json','content-length':'12001'}},413],[{body:null},400],[{body:{...valid,unknown:'x'.repeat(12001)}},413]]){
  const res=response();await handler({method:'POST',headers:{'content-type':'application/json'},body:valid,...patch},res);assert.equal(res.code,expected);
 }
});
test('accepts future dates and normalizes surrounding whitespace',()=>{
 const result=validateRequest({...valid,name:'  Maria  ',preferredDate:'2099-12-01'});
 assert.equal(result.name,'Maria');assert.equal(result.preferredDate,'2099-12-01');
});
test('rate limit keys are hashed and distinct per source',async()=>{
 const keys=[];const handler=createHandler(async(data,key)=>{keys.push(key);return 'saved'});
 for(const ip of ['1.2.3.4','5.6.7.8']){await handler({method:'POST',headers:{'content-type':'application/json','x-vercel-forwarded-for':ip},body:valid},response())}
 assert.match(keys[0],/^[a-f0-9]{64}$/);assert.notEqual(keys[0],keys[1]);
});
test('cross-site requests are rejected before persistence while same-origin JSON works',async()=>{
 let saves=0;const handler=createHandler(async()=>{saves++;return 'saved'});
 const req={method:'POST',headers:{'content-type':'application/json',host:'office.example'},body:valid};
 for(const headers of [{origin:'https://evil.example'},{'sec-fetch-site':'cross-site'},{origin:'null'},{'content-type':'application/jsonp'}]){
  const res=response();await handler({...req,headers:{...req.headers,...headers}},res);assert.ok([403,415].includes(res.code));
 }
 assert.equal(saves,0);
 const res=response();await handler({...req,headers:{...req.headers,origin:'https://office.example'}},res);assert.equal(res.code,201);
});
test('invalid text and request IDs are rejected; retry UUIDs survive validation',()=>{
 for(const patch of [{name:'Name\u0000'},{email:'a\n@example.com'},{message:'invalid\u0000message'},{message:'invalid \ud800 text'},{requestId:'bad-id'}])assert.throws(()=>validateRequest({...valid,...patch}));
 const requestId='c25444ac-274c-43ee-a6b4-e5dc4cf334ac';assert.equal(validateRequest({...valid,requestId}).requestId,requestId);
});
test('UUID collisions with different payloads have a safe conflict response',async()=>{
 const error=Error('private database detail');error.code='REQUEST_CONFLICT';
 const res=response();await createHandler(async()=>{throw error})({method:'POST',headers:{'content-type':'application/json'},body:valid},res);
 assert.equal(res.code,409);assert.deepEqual(res.body,{error:'request_conflict'});
});
