import { createHmac } from 'node:crypto';
export function validateRequest(body) {
 if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('invalid');
 const text=(key,min,max)=>{const value=body[key];if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)throw Error(key);return value.trim()};
 const name=text('name',2,120), email=text('email',3,254), message=text('message',10,2000);
 if(/[\u0000-\u001f\u007f]/.test(name+email)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(message)||![name,email,message].every(value=>value.isWellFormed()))throw Error('invalid text');
 const requestId=body.requestId;
 if(requestId!==undefined&&(typeof requestId!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)))throw Error('invalid request ID');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['pt','en'].includes(body.language)||body.website)throw Error('invalid');
 const preferredDate=body.preferredDate ?? '';
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(typeof preferredDate!=='string'||(preferredDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)||!Number.isFinite(Date.parse(preferredDate))||new Date(preferredDate).toISOString().slice(0,10)!==preferredDate||preferredDate<today)))throw Error('date');
 return {name,email,message,preferredDate:preferredDate||null,language:body.language,...(requestId?{requestId}: {})};
}
export function createHandler(save) {
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  // Browser clients must be same-origin. Non-browser integrations may omit Origin.
  const origin=req.headers.origin;
  const host=req.headers.host;
  if(req.headers['sec-fetch-site']==='cross-site')return res.status(403).json({error:'forbidden_origin'});
  if(origin){try{if(!host||new URL(origin).host!==host||!['https:','http:'].includes(new URL(origin).protocol))return res.status(403).json({error:'forbidden_origin'})}catch{return res.status(403).json({error:'forbidden_origin'})}}
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'method_not_allowed'})}
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))return res.status(415).json({error:'unsupported_content_type'});
  if(Number(req.headers['content-length'])>12000)return res.status(413).json({error:'too_large'});
  let data;
  try{if(Buffer.byteLength(JSON.stringify(req.body)??'')>12000)return res.status(413).json({error:'too_large'});data=validateRequest(req.body)}catch{return res.status(400).json({error:'invalid_request'})}
  try{
   const ip=req.headers['x-vercel-forwarded-for']?.split(',')[0]?.trim()||req.socket?.remoteAddress||'unknown';
   const key=createHmac('sha256',process.env.RATE_LIMIT_SECRET||'local-development').update(ip).digest('hex');
   const id=await save(data,key);
   if(!id){res.setHeader('Retry-After','3600');return res.status(429).json({error:'rate_limited'})}
   return res.status(201).json({id});
  }catch(error){if(error.code==='REQUEST_CONFLICT')return res.status(409).json({error:'request_conflict'});return res.status(503).json({error:'service_unavailable'})}
 };
}
