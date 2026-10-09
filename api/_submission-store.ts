import { validSubmissionId, type SubmissionRecord } from './_submission-contract.js';
export class SubmissionStoreError extends Error {constructor(){super('submission_store_unavailable');}}
export const SUBMISSION_HASH='tt:submissions:v1';
export type ReserveResult={status:'created'|'existing';record:SubmissionRecord}|{status:'conflict'};
export async function redisCommand(command:(string|number)[]):Promise<unknown>{
 try {
  const url=new URL(process.env.SUBMISSION_REDIS_URL||''); const token=process.env.SUBMISSION_REDIS_TOKEN;
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/'||!url.hostname.endsWith('.upstash.io')||!token)throw new Error();
  const response=await fetch(url.href,{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(3000)});
  if(!response.ok)throw new Error();
  const body=await response.json();
  if(!body||typeof body!=='object'||'error' in body||!Object.hasOwn(body,'result'))throw new Error();
  return body.result;
 }catch{throw new SubmissionStoreError();}
}
export function parseRecord(raw:unknown):SubmissionRecord{
 try{
  if(typeof raw!=='string')throw new Error();const r=JSON.parse(raw);
  if(r.version!==1||!validSubmissionId(r.submissionId)||!/^\w{64}$/.test(r.fingerprint)||!['accepted','suspended'].includes(r.state)||!Number.isFinite(r.acceptedAt)||!r.jobs?.internal||!r.jobs?.confirmation)throw new Error();
  for(const j of Object.values(r.jobs) as {state?:string;key?:string}[]){if(!['pending','sending','sent','reconcile'].includes(j.state||'')||typeof j.key!=='string')throw new Error();}
  return r;
 }catch{throw new SubmissionStoreError();}
}
export async function getSubmission(id:string):Promise<SubmissionRecord|null>{
 if(!validSubmissionId(id))throw new SubmissionStoreError();const raw=await redisCommand(['HGET',SUBMISSION_HASH,`submission:${id}`]);
 if(raw===null)return null;const r=parseRecord(raw);if(r.submissionId!==id)throw new SubmissionStoreError();return r;
}
export const RESERVE_SCRIPT=`
local incoming=cjson.decode(ARGV[1])
local sf='submission:'..incoming.submissionId
local existing=redis.call('HGET',KEYS[1],sf)
if existing then
 local r=cjson.decode(existing)
 if r.fingerprint~=incoming.fingerprint or r.state~='accepted' then return {'conflict'} end
 return {'existing',existing}
end
local cf=nil
if incoming.checkoutId then
 cf='checkout:'..incoming.checkoutId
 if redis.call('HEXISTS',KEYS[1],cf)==1 then return {'conflict'} end
end
local clock=redis.call('TIME')
incoming.acceptedAt=tonumber(clock[1])*1000+math.floor(tonumber(clock[2])/1000)
local encoded=cjson.encode(incoming)
if cf then redis.call('HSET',KEYS[1],sf,encoded,cf,incoming.submissionId)
else redis.call('HSET',KEYS[1],sf,encoded) end
return {'created',encoded}
`;
export async function reserveSubmission(record:SubmissionRecord):Promise<ReserveResult>{
 parseRecord(JSON.stringify(record));
 const r=await redisCommand(['EVAL',RESERVE_SCRIPT,1,SUBMISSION_HASH,JSON.stringify(record)]);
 if(!Array.isArray(r))throw new SubmissionStoreError();
 if(r.length===1&&r[0]==='conflict')return {status:'conflict'};
 if(r.length===2&&(r[0]==='created'||r[0]==='existing'))return {status:r[0],record:parseRecord(r[1])};
 throw new SubmissionStoreError();
}
