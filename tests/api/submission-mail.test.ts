import {beforeAll,afterAll,beforeEach,describe,it,expect,vi} from 'vitest';
import {startRedis,receiptFixture} from './redis-fixture';
import {reserveSubmission,getSubmission,claimMail,finishMail,SUBMISSION_HASH} from '../../api/_submission-store';
const emails=vi.hoisted(()=>vi.fn());vi.mock('resend',()=>({Resend:class{emails={send:emails};}}));
import {maintainSubmissions} from '../../api/submission-maintenance';
import {deliverSubmission} from '../../api/_submission-mail';
const suite=process.env.SUBMISSION_TEST_REDIS_BIN?describe:describe.skip;
suite('real Redis mail leases',()=>{
 let redis:Awaited<ReturnType<typeof startRedis>>;
 beforeAll(async()=>{redis=await startRedis();vi.stubEnv('SUBMISSION_REDIS_URL','https://recipe.upstash.io');vi.stubEnv('SUBMISSION_REDIS_TOKEN','test');vi.stubGlobal('fetch',redis.fetch);});
 afterAll(async()=>{await redis.stop();vi.unstubAllGlobals();vi.unstubAllEnvs();});
 beforeEach(async()=>{await redis.command(['DEL',SUBMISSION_HASH]);await reserveSubmission(structuredClone(receiptFixture));emails.mockReset().mockResolvedValue({data:{id:'mail-local'},error:null});});
 it('two concurrent workers send each message once with a stable provider key',async()=>{
  await Promise.all([deliverSubmission(receiptFixture.submissionId),deliverSubmission(receiptFixture.submissionId)]);
  expect(emails).toHaveBeenCalledTimes(2);expect(emails.mock.calls.map(c=>c[1].idempotencyKey).sort()).toEqual(['confirmation','internal']);
  const r=await getSubmission(receiptFixture.submissionId);expect(r!.jobs.internal.state).toBe('sent');expect(r!.jobs.confirmation.providerId).toBe('mail-local');
 });
 it('cannot finish a lease owned by another worker or already expired',async()=>{
  const j=await claimMail(receiptFixture.submissionId,'internal','owner-a');expect(j!.leaseUntil!-j!.firstAttemptAt!).toBe(60000);
  expect(await finishMail(receiptFixture.submissionId,'internal','owner-b',{providerId:'wrong'})).toBe(false);
  const r=(await getSubmission(receiptFixture.submissionId))!;r.jobs.internal.leaseUntil=1;await redis.command(['HSET',SUBMISSION_HASH,'submission:'+r.submissionId,JSON.stringify(r)]);
  expect(await finishMail(r.submissionId,'internal','owner-a',{providerId:'late'})).toBe(false);
 });
 it('ambiguous retries keep the same key and stop after 24 hours',async()=>{
  await claimMail(receiptFixture.submissionId,'internal','first');await finishMail(receiptFixture.submissionId,'internal','first',{uncertain:true});
  const retry=await claimMail(receiptFixture.submissionId,'internal','second');expect(retry!.key).toBe('internal');
  const r=(await getSubmission(receiptFixture.submissionId))!;r.jobs.internal.firstAttemptAt=Date.now()-86400001;r.jobs.internal.leaseUntil=1;await redis.command(['HSET',SUBMISSION_HASH,'submission:'+r.submissionId,JSON.stringify(r)]);
  expect(await claimMail(r.submissionId,'internal','third')).toBeNull();expect((await getSubmission(r.submissionId))!.jobs.internal.state).toBe('reconcile');
 });
 it('accepted submission survives provider exceptions and a lost delivery result',async()=>{
  emails.mockRejectedValueOnce(new Error('network unknown'));await deliverSubmission(receiptFixture.submissionId);
  const r=(await getSubmission(receiptFixture.submissionId))!;expect(r.jobs.internal.state).toBe('pending');expect(r.jobs.internal.firstAttemptAt).toBeGreaterThan(0);expect(r.jobs.confirmation.state).toBe('sent');
  await deliverSubmission(r.submissionId);expect(emails.mock.calls[2][1].idempotencyKey).toBe('internal');
 });
 it('suspension preserves payment and prevents all new delivery',async()=>{
  await maintainSubmissions('suspend','0',receiptFixture.submissionId);await deliverSubmission(receiptFixture.submissionId);expect(emails).not.toHaveBeenCalled();
  expect(await reserveSubmission({...receiptFixture,submissionId:'8ec2090a-9157-43c9-9238-f8931667420d'})).toEqual({status:'conflict'});
 });
 it('archiving old delivered emails removes personal payload without releasing the receipt',async()=>{
  const r=(await getSubmission(receiptFixture.submissionId))!;for(const kind of ['internal','confirmation'] as const){r.jobs[kind].state='sent';r.jobs[kind].sentAt=Date.now()-91*86400000;}
  await redis.command(['HSET',SUBMISSION_HASH,'submission:'+r.submissionId,JSON.stringify(r)]);await maintainSubmissions('archive','0');
  const archived=(await getSubmission(r.submissionId))!;expect(archived.jobs.internal.payload).toBeUndefined();expect(archived.archived).toBe(true);
  expect(await reserveSubmission({...receiptFixture,submissionId:'8ec2090a-9157-43c9-9238-f8931667420d'})).toEqual({status:'conflict'});
 });
});
