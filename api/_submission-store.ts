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
  if(typeof raw!=='string'||Buffer.byteLength(raw)>128*1024)throw new Error();const r=JSON.parse(raw);
  if(r.version!==1||!validSubmissionId(r.submissionId)||typeof r.fingerprint!=='string'||! /^[a-f0-9]{64}$/.test(r.fingerprint)||!['accepted','suspended'].includes(r.state)||!Number.isFinite(r.acceptedAt)||r.acceptedAt<0||!r.jobs?.internal||!r.jobs?.confirmation||Object.keys(r.jobs).length!==2)throw new Error();
  if(r.checkoutId!=null&&(typeof r.checkoutId!=='string'||!/^(?:ch|chk)_[A-Za-z0-9_-]{1,128}$/.test(r.checkoutId)))throw new Error();
  for(const j of Object.values(r.jobs) as MailJob[]){
   if(!['pending','sending','sent','reconcile'].includes(j.state)||typeof j.key!=='string'||!j.key||j.key.length>256)throw new Error();
   for(const value of [j.firstAttemptAt,j.leaseUntil,j.sentAt])if(value!=null&&(!Number.isFinite(value)||value<0))throw new Error();
   if(j.state==='sending'&&(!j.owner||!j.leaseUntil||!j.firstAttemptAt))throw new Error();
   if(j.payload){if([j.payload.from,j.payload.to,j.payload.subject,j.payload.html].some(v=>typeof v!=='string'||!v)||j.payload.to.length>300||j.payload.subject.length>500||j.payload.html.length>100*1024||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(j.payload.to))throw new Error();}
   else if(r.archived!==true||j.state!=='sent')throw new Error();
  }
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
type ScanState={next:string;ids:string[]};
function decodeCursor(cursor:string):ScanState{
 if(typeof cursor!=='string'||cursor.length>1024*1024)throw new SubmissionStoreError();
 if(/^\d{1,32}$/.test(cursor))return {next:cursor,ids:[]};
 try{
  const state=JSON.parse(Buffer.from(cursor,'base64url').toString('utf8'));
  if(!state||!/^\d{1,32}$/.test(state.next)||!Array.isArray(state.ids)||!state.ids.every(validSubmissionId))throw new Error();
  return state;
 }catch{throw new SubmissionStoreError();}
}
export function validMaintenanceCursor(cursor:unknown):cursor is string{try{if(typeof cursor!=='string')return false;decodeCursor(cursor);return true;}catch{return false;}}
// Freeze page IDs in the authenticated continuation, never positions in a repeated HSCAN page.
export async function scanSubmissions(cursor:string,limit:number):Promise<{cursor:string;records:SubmissionRecord[]}>{
 if(limit<1||limit>25)throw new SubmissionStoreError();const state=decodeCursor(cursor);
 if(state.ids.length===0){
  const result=await redisCommand(['HSCAN',SUBMISSION_HASH,state.next,'COUNT',50]);
  if(!Array.isArray(result)||typeof result[0]!=='string'||!/^\d+$/.test(result[0])||!Array.isArray(result[1])||result[1].length%2!==0)throw new SubmissionStoreError();
  state.next=result[0];
  for(let i=0;i<result[1].length;i+=2){const field=result[1][i];if(typeof field!=='string')throw new SubmissionStoreError();if(field.startsWith('submission:')){const id=field.slice(11);if(!validSubmissionId(id))throw new SubmissionStoreError();state.ids.push(id);}}
 }
 const selected=state.ids.splice(0,limit);const records:SubmissionRecord[]=[];
 for(const id of selected){const record=await getSubmission(id);if(record)records.push(record);}
 const next=state.ids.length===0?state.next:Buffer.from(JSON.stringify(state)).toString('base64url');
 if(next.length>1024*1024)throw new SubmissionStoreError();
 return {records,cursor:next};
}
