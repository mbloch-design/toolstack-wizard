import {beforeAll,afterAll,beforeEach,describe,it,expect,vi} from 'vitest';
import {startRedis,receiptFixture} from './redis-fixture';
import {reserveSubmission,getSubmission,SUBMISSION_HASH} from '../../api/_submission-store';
const suite=process.env.SUBMISSION_TEST_REDIS_BIN?describe:describe.skip;
suite('real Redis reservation',()=>{
 let redis:Awaited<ReturnType<typeof startRedis>>;
 beforeAll(async()=>{redis=await startRedis();vi.stubEnv('SUBMISSION_REDIS_URL','https://recipe.upstash.io');vi.stubEnv('SUBMISSION_REDIS_TOKEN','local-test');vi.stubGlobal('fetch',redis.fetch);});
 afterAll(async()=>{await redis?.stop();vi.unstubAllGlobals();vi.unstubAllEnvs();});
 beforeEach(async()=>{await redis.command(['DEL',SUBMISSION_HASH]);});
 it('20 concurrent reservations create one record and two jobs',async()=>{
  const results=await Promise.all(Array.from({length:20},()=>reserveSubmission(structuredClone(receiptFixture))));
  expect(results.filter(r=>r.status==='created')).toHaveLength(1);expect(results.filter(r=>r.status==='existing')).toHaveLength(19);
  expect(await redis.command(['HLEN',SUBMISSION_HASH])).toBe(2);expect(Object.keys((await getSubmission(receiptFixture.submissionId))!.jobs).sort()).toEqual(['confirmation','internal']);
 });
 it('checkout cannot be reused with a different id or recipient',async()=>{
  await reserveSubmission(receiptFixture);
  expect(await reserveSubmission({...receiptFixture,submissionId:'8ec2090a-9157-43c9-9238-f8931667420d'})).toEqual({status:'conflict'});
  expect(await reserveSubmission({...receiptFixture,fingerprint:'b'.repeat(64)})).toEqual({status:'conflict'});
  expect(await redis.command(['HLEN',SUBMISSION_HASH])).toBe(2);
 });
 it('full_store_has_no_partial_reservation',async()=>{
  await reserveSubmission(receiptFixture);await redis.command(['CONFIG','SET','maxmemory',1]);
  try{await expect(reserveSubmission({...receiptFixture,submissionId:'8ec2090a-9157-43c9-9238-f8931667420d',checkoutId:'ch_other'})).rejects.toThrow();}
  finally{await redis.command(['CONFIG','SET','maxmemory',0]);}
  expect(await redis.command(['HLEN',SUBMISSION_HASH])).toBe(2);expect((await getSubmission(receiptFixture.submissionId))?.checkoutId).toBe('ch_local');
 });
 it('script error on an invalid hash type never replaces existing data',async()=>{
  await redis.command(['SET',SUBMISSION_HASH,'preserved']);await expect(reserveSubmission(receiptFixture)).rejects.toThrow();expect(await redis.command(['GET',SUBMISSION_HASH])).toBe('preserved');
 });
});
