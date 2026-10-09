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

import type { MailJob, MailKind } from './_submission-contract.js';
export const UPDATE_SCRIPT=`
local raw=redis.call('HGET',KEYS[1],ARGV[1])
if not raw then return nil end
local r=cjson.decode(raw)
local op=ARGV[2]
local p=cjson.decode(ARGV[3])
local clock=redis.call('TIME')
local now=tonumber(clock[1])*1000+math.floor(tonumber(clock[2])/1000)
if op=='suspend' then
 r.state='suspended'
elseif op=='archive' then
 if r.archived then return nil end
 for _,kind in ipairs({'internal','confirmation'}) do
  local j=r.jobs[kind]
  if j.state~='sent' or not j.sentAt or now-j.sentAt<90*86400000 then return nil end
 end
 for _,kind in ipairs({'internal','confirmation'}) do r.jobs[kind].payload=nil end
 r.archived=true
else
 if r.state~='accepted' then return nil end
 local j=r.jobs[p.kind]
 if not j then return nil end
 if op=='claim' then
  if j.state=='sent' or j.state=='reconcile' or not j.payload then return nil end
  if j.leaseUntil and j.leaseUntil>now then return nil end
  if j.firstAttemptAt and now-j.firstAttemptAt>=86400000 then
   j.state='reconcile';j.owner=nil;j.leaseUntil=nil
   redis.call('HSET',KEYS[1],ARGV[1],cjson.encode(r));return nil
  end
  j.firstAttemptAt=j.firstAttemptAt or now
  j.state='sending';j.owner=p.owner;j.leaseUntil=now+60000
 elseif op=='finish' then
  if j.state~='sending' or j.owner~=p.owner or not j.leaseUntil or j.leaseUntil<=now then return nil end
  if p.providerId then j.state='sent';j.providerId=p.providerId;j.sentAt=now
  else j.state='pending' end
  j.owner=nil;j.leaseUntil=nil
 else return redis.error_reply('invalid operation') end
end
local encoded=cjson.encode(r)
redis.call('HSET',KEYS[1],ARGV[1],encoded)
return encoded
`;
async function update(id:string,operation:string,params:Record<string,unknown>):Promise<SubmissionRecord|null>{
 if(!validSubmissionId(id))throw new SubmissionStoreError();
 const result=await redisCommand(['EVAL',UPDATE_SCRIPT,1,SUBMISSION_HASH,`submission:${id}`,operation,JSON.stringify(params)]);
 return result===null?null:parseRecord(result);
}
export async function claimMail(id:string,kind:MailKind,owner:string):Promise<MailJob|null>{
 if(!['internal','confirmation'].includes(kind)||!owner||owner.length>64)throw new SubmissionStoreError();
 const record=await update(id,'claim',{kind,owner});return record?.jobs[kind]??null;
}
export async function finishMail(id:string,kind:MailKind,owner:string,result:{providerId:string}|{uncertain:true}):Promise<boolean>{
 if(!['internal','confirmation'].includes(kind)||!owner||owner.length>64||('providerId' in result&&(!result.providerId||result.providerId.length>300)))throw new SubmissionStoreError();
 return (await update(id,'finish',{kind,owner,...result}))!==null;
}
export async function suspendSubmission(id:string):Promise<boolean>{return (await update(id,'suspend',{}))!==null;}
export async function archiveSubmission(id:string):Promise<boolean>{return (await update(id,'archive',{}))!==null;}
// COUNT is a Redis hint, not a strict page limit. The offset keeps unprocessed fields on the same page.
export async function scanSubmissions(cursor:string,limit:number):Promise<{cursor:string;records:SubmissionRecord[]}>{
 if(!/^\d+(?::\d{1,6})?$/.test(cursor)||limit<1||limit>25)throw new SubmissionStoreError();
 const [position,offsetRaw='0']=cursor.split(':');const offset=Number(offsetRaw);
 const result=await redisCommand(['HSCAN',SUBMISSION_HASH,position,'COUNT',50]);
 if(!Array.isArray(result)||typeof result[0]!=='string'||!/^\d+$/.test(result[0])||!Array.isArray(result[1])||result[1].length%2!==0)throw new SubmissionStoreError();
 const fields=result[1];const records:SubmissionRecord[]=[];let index=offset*2;
 for(;index<fields.length;index+=2){
  if(typeof fields[index]!=='string')throw new SubmissionStoreError();
  if(!fields[index].startsWith('submission:'))continue;
  const record=parseRecord(fields[index+1]);records.push(record);
  if(records.length===limit){index+=2;break;}
 }
 return {records,cursor:index<fields.length?`${position}:${index/2}`:result[0]};
}
