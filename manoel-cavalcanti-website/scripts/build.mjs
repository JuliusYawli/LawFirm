import { securityHeaders } from '../lib/security-headers.mjs';
import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
const configuration=JSON.parse(await readFile('vercel.json','utf8'));
const configured=Object.fromEntries(configuration.headers[0].headers.map(h=>[h.key,h.value]));
for(const [key,value] of Object.entries(securityHeaders))if(configured[key]!==value)throw Error(`Security header mismatch: ${key}`);
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
let html=await readFile('index.html','utf8');
let robots='User-agent: *\nAllow: /\nDisallow: /api/\n';
if(process.env.SITE_URL){
 const url=new URL(process.env.SITE_URL);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('SITE_URL must be a public origin, for example https://example.com');
 if(process.env.VERCEL_ENV==='production'&&url.protocol!=='https:')throw Error('Production SITE_URL must use HTTPS');
 const origin=url.origin;
 html=html.replace('</head>',`<link rel="canonical" href="${origin}/"><meta property="og:url" content="${origin}/"></head>`).replace('content="/assets/manoel.jpg"',`content="${origin}/assets/manoel.jpg"`);
 robots+=`Sitemap: ${origin}/sitemap.xml\n`;
 await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`);
}
await writeFile('dist/index.html',html);
await writeFile('dist/robots.txt',robots);
console.log('Static site built in dist; Vercel serves api/requests.js as a function.');
