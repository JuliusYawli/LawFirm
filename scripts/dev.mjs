import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import handler from '../api/requests.js';
import { securityHeaders } from '../lib/security-headers.mjs';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
export function createAppServer({ apiHandler=handler, root=resolve('.') }={}) {
 const base=resolve(root,'public');
 return createServer(async(req,res)=>{
  for(const [name,value] of Object.entries(securityHeaders))res.setHeader(name,value);
  res.setHeader('Cache-Control','no-store');
  res.status=function(n){this.statusCode=n;return this};
  res.json=function(body){this.setHeader('Content-Type','application/json');this.end(JSON.stringify(body));return this};
  try {
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/api/requests'){
    if(req.method!=='POST')return await apiHandler(req,res);
    let bytes=0;const chunks=[];
    for await(const chunk of req){bytes+=chunk.length;if(bytes>12000){res.status(413).json({error:'too_large'});return}chunks.push(chunk)}
    try{req.body=JSON.parse(Buffer.concat(chunks).toString())}catch{return res.status(400).json({error:'invalid_json'})}
    return await apiHandler(req,res);
   }
   if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');res.writeHead(405).end();return}
   const path=decodeURIComponent(url.pathname);
   let file=path==='/'||path==='/index.html'?resolve(root,'index.html'):resolve(base,'.'+path);
   if(file!==resolve(root,'index.html')&&!file.startsWith(base+'/')){res.writeHead(403).end();return}
   try {
    const actual=await realpath(file);
    if(actual!==resolve(root,'index.html')&&!actual.startsWith(base+'/')){res.writeHead(403).end();return}
    const content=await readFile(actual);
    res.writeHead(200,{'Content-Type':types[extname(actual)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:content);
   } catch {
    const page=await readFile(resolve(base,'404.html'));
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(req.method==='HEAD'?undefined:page);
   }
  }catch{
   if(!res.destroyed&&!res.headersSent)res.status(400).json({error:'invalid_request'});
   else if(!res.writableEnded)res.destroy();
  }
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const server=createAppServer();
 server.requestTimeout=15000;server.headersTimeout=10000;
 server.listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log(`Website running at http://localhost:${process.env.PORT||3000}`));
}
