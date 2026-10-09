import {beforeAll,afterAll,beforeEach,describe,it,expect,vi} from 'vitest';
import {startRedis} from './redis-fixture';
import {SUBMISSION_HASH,getSubmission} from '../../api/_submission-store';
import {httpFixture} from './http';
const external=vi.hoisted(()=>({send:vi.fn()}));
vi.mock('resend',()=>({Resend:class{emails={send:external.send};}}));
import contact from '../../api/contact';
const paid={submissionId:'7ec2090a-9157-43c9-9238-f8931667420d',paymentReference:'7ec2090a-9157-43c9-9238-f8931667420d',checkoutId:'ch_local',paid:true,submissionType:'tool',name:'Ada',email:'ada@example.com',subject:'Tool',message:'Hello',toolName:'Sample',toolUrl:'https://example.com/',submitterRole:'Founder',lang:'en'};
const suite=process.env.SUBMISSION_TEST_REDIS_BIN?describe:describe.skip;
suite('durable contact against real Redis',()=>{
 let redis:Awaited<ReturnType<typeof startRedis>>;let creemDown=false;let storeDown=false;
 beforeAll(async()=>{redis=await startRedis();});afterAll(async()=>{await redis.stop();vi.unstubAllEnvs();vi.unstubAllGlobals();});
 beforeEach(async()=>{
  await redis.command(['DEL',SUBMISSION_HASH]);creemDown=false;storeDown=false;
  vi.stubEnv('SUBMISSION_REDIS_URL','https://recipe.upstash.io');vi.stubEnv('SUBMISSION_REDIS_TOKEN','test');vi.stubEnv('CREEM_API_KEY','test');
  external.send.mockReset().mockImplementation(async()=>({data:{id:'email-local'},error:null}));
  vi.stubGlobal('fetch',async(url:unknown,init?:RequestInit)=>{
   if(String(url).includes('.upstash.io')){if(storeDown)throw new Error('quota');return redis.fetch(url,init);}
   if(creemDown)throw new Error('Creem down');
   return new Response(JSON.stringify({id:'ch_local',mode:'prod',status:'completed',product:'prod_2LMoN4zyRhNAb53r3rWpwX',order:{status:'paid'},metadata:{tooltrim_submission_id:paid.paymentReference,tooltrim_tool_url:paid.toolUrl}}));
  });
 });
 it('lost_acceptance_reply_returns_same_record',async()=>{
  const a=httpFixture(paid);await contact(a.req,a.res);const b=httpFixture(paid);await contact(b.req,b.res);
  expect(a.body).toEqual({success:true});expect(b.body).toEqual({success:true});expect(await redis.command(['HLEN',SUBMISSION_HASH])).toBe(2);expect(external.send).toHaveBeenCalledTimes(2);
 });
 it('accepted_retry_during_creem_outage',async()=>{
  const a=httpFixture(paid);await contact(a.req,a.res);creemDown=true;
  const b=httpFixture(paid);await contact(b.req,b.res);expect(b.res.statusCode).toBe(200);expect(external.send).toHaveBeenCalledTimes(2);
 });
 it('paid_conflict_never_sends',async()=>{
  const a=httpFixture(paid);await contact(a.req,a.res);external.send.mockClear();
  for(const patch of [{email:'other@example.com'},{submissionId:'8ec2090a-9157-43c9-9238-f8931667420d'}]){const b=httpFixture({...paid,...patch});await contact(b.req,b.res);expect(b.res.statusCode).toBe(409);}
  expect(external.send).not.toHaveBeenCalled();
 });
 it('persists both messages before any email and retains an accepted request on delivery failure',async()=>{
  external.send.mockImplementation(async()=>{const saved=await getSubmission(paid.submissionId);expect(Object.keys(saved!.jobs)).toHaveLength(2);return {data:null,error:{message:'down'}};});
  const h=httpFixture(paid);await contact(h.req,h.res);expect(h.body).toEqual({success:true});expect(await getSubmission(paid.submissionId)).not.toBeNull();
 });
 it('quota failure has no email or accepted request',async()=>{
  storeDown=true;const h=httpFixture(paid);await contact(h.req,h.res);expect(h.res.statusCode).toBe(503);expect(external.send).not.toHaveBeenCalled();expect(await redis.command(['HLEN',SUBMISSION_HASH])).toBe(0);
 });
 it('unpaid_badge_bypass_stays_rejected',async()=>{const h=httpFixture({...paid,paid:false,badgeReview:false,checkoutId:undefined,paymentReference:undefined});await contact(h.req,h.res);expect(h.res.statusCode).toBe(400);expect(external.send).not.toHaveBeenCalled();});
});
