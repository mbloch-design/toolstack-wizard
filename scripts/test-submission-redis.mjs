// Run: node --import tsx scripts/test-submission-redis.mjs
// Only a dedicated recipe database; never production. No credentials are printed.
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { reserveSubmission, getSubmission, SUBMISSION_HASH } from '../api/_submission-store.ts';
import { receiptFixture } from '../tests/api/redis-fixture.ts';
const endpoint=process.env.SUBMISSION_REDIS_TEST_URL;
const token=process.env.SUBMISSION_REDIS_TEST_TOKEN;
if(!endpoint||!token||endpoint===process.env.SUBMISSION_REDIS_URL)throw new Error('Dedicated SUBMISSION_REDIS_TEST_URL/TOKEN required; production target refused');
const key=`tt:recipe:${randomUUID()}`;let commands=0;
const fetchOriginal=globalThis.fetch;
process.env.SUBMISSION_REDIS_URL=endpoint;process.env.SUBMISSION_REDIS_TOKEN=token;
globalThis.fetch=async(url,init)=>{
 const args=JSON.parse(init.body).map(v=>v===SUBMISSION_HASH?key:v);commands++;
 return fetchOriginal(url,{...init,body:JSON.stringify(args)});
};
try{
 const results=await Promise.all(Array.from({length:20},()=>reserveSubmission(structuredClone(receiptFixture))));
 assert.equal(results.filter(r=>r.status==='created').length,1);
 assert.equal(results.filter(r=>r.status==='existing').length,19);
 assert.equal((await reserveSubmission({...receiptFixture,submissionId:randomUUID()})).status,'conflict');
 const record=await getSubmission(receiptFixture.submissionId);assert.equal(record.checkoutId,'ch_local');
 console.log(JSON.stringify({concurrency:20,created:1,existing:19,conflict:'PASS',restRequests:commands,recordBytes:Buffer.byteLength(JSON.stringify(record)),target:'dedicated recipe only'}));
}finally{
 await fetchOriginal(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(['DEL',key]),signal:AbortSignal.timeout(3000)});
 globalThis.fetch=fetchOriginal;
}
