import postgres from 'postgres';
import { randomUUID } from 'node:crypto';
import { databaseOptions } from './database-options.mjs';
let connection;
export function database(){
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required');
 return connection??=postgres(process.env.DATABASE_URL,databaseOptions(process.env.DATABASE_URL,{production:process.env.VERCEL==='1'||process.env.NODE_ENV==='production',allowInsecureLocal:process.env.ALLOW_INSECURE_LOCAL_DB==='true',ca:process.env.DATABASE_CA_CERT}));
}
export async function saveRequest(data,key){
 if((process.env.VERCEL||process.env.NODE_ENV==='production')&&(!process.env.RATE_LIMIT_SECRET||process.env.RATE_LIMIT_SECRET.length<32))throw Error('RATE_LIMIT_SECRET must contain at least 32 characters');
 const sql=database();
 return sql.begin(async tx=>{
  const id=data.requestId||randomUUID();
  // Serialize retries for this UUID across serverless instances, before rate accounting.
  await tx`SELECT pg_advisory_xact_lock(hashtextextended(${id},0))`;
  const [existing]=await tx`SELECT name,email,message,preferred_date::text AS preferred_date,language FROM contact_requests WHERE id=${id}`;
  if(existing){
   if(existing.name!==data.name||existing.email!==data.email||existing.message!==data.message||existing.preferred_date!==data.preferredDate||existing.language!==data.language){const error=Error('Request ID conflict');error.code='REQUEST_CONFLICT';throw error}
   return id;
  }
  const [limit]=await tx`INSERT INTO request_limits (key, window_start, count) VALUES (${key},date_trunc('hour',now()),1)
   ON CONFLICT (key) DO UPDATE SET count=CASE WHEN request_limits.window_start=date_trunc('hour',now()) THEN request_limits.count+1 ELSE 1 END,window_start=date_trunc('hour',now())
   RETURNING count`;
  if(limit.count>5)return null;
  await tx`INSERT INTO contact_requests (id,name,email,message,preferred_date,language) VALUES (${id},${data.name},${data.email},${data.message},${data.preferredDate},${data.language})`;
  await tx`DELETE FROM request_limits WHERE window_start < now()-interval '2 hours'`;
  return id;
 });
}
