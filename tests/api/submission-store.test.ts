import { beforeEach, afterEach, describe,it,expect,vi } from 'vitest';
import { getSubmission, reserveSubmission, scanSubmissions } from '../../api/_submission-store';
import type { SubmissionRecord } from '../../api/_submission-contract';
export const record: SubmissionRecord = {version:1,submissionId:'7ec2090a-9157-43c9-9238-f8931667420d',fingerprint:'a'.repeat(64),checkoutId:'ch_local',state:'accepted',acceptedAt:1,jobs:{internal:{key:'internal',state:'pending',payload:{from:'ToolTrim <contact@tooltrim.com>',to:'contact@tooltrim.com',subject:'Tool',html:'Hi'}},confirmation:{key:'confirmation',state:'pending',payload:{from:'ToolTrim <contact@tooltrim.com>',to:'ada@example.com',subject:'Tool',html:'Hi'}}}};
beforeEach(()=>{vi.stubEnv('SUBMISSION_REDIS_URL','https://recipe.upstash.io');vi.stubEnv('SUBMISSION_REDIS_TOKEN','test-only-token');});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('submission REST boundary',()=>{
 it('redis_unavailable_does_not_mean_missing',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('down')));await expect(getSubmission(record.submissionId)).rejects.toThrow('submission_store_unavailable');});
 it.each([{error:'OOM'},{result:'unexpected'},{}])('rejects malformed or error reservation response %j',async body=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));await expect(reserveSubmission(record)).rejects.toThrow('submission_store_unavailable');});
 it('only sends the token in the header and never retries ambiguous writes',async()=>{const send=vi.fn().mockRejectedValue(new Error('lost reply'));vi.stubGlobal('fetch',send);await expect(reserveSubmission(record)).rejects.toThrow();expect(send).toHaveBeenCalledTimes(1);const [url,options]=send.mock.calls[0];expect(url).toBe('https://recipe.upstash.io/');expect(options.headers.Authorization).toBe('Bearer test-only-token');});
 it('missing credentials fail closed without calling any backend',async()=>{vi.stubEnv('SUBMISSION_REDIS_TOKEN','');const send=vi.fn();vi.stubGlobal('fetch',send);await expect(getSubmission(record.submissionId)).rejects.toThrow();expect(send).not.toHaveBeenCalled();});
});
it('corrupted pending records fail closed instead of pretending delivery can recover',async()=>{
 const bad=structuredClone(record);delete bad.jobs.internal.payload;
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({result:JSON.stringify(bad)}))));
 await expect(getSubmission(record.submissionId)).rejects.toThrow('submission_store_unavailable');
});

it('maintenance continuation freezes IDs instead of skipping a changed HSCAN page',async()=>{
 const records=[record,{...record,submissionId:'8ec2090a-9157-43c9-9238-f8931667420d'},{...record,submissionId:'9ec2090a-9157-43c9-9238-f8931667420d'}];let scans=0;
 vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{const args=JSON.parse(init.body);let result;
  if(args[0]==='HSCAN'){const page=scans++===0?records:[records[2],records[0],records[1]];result=['0',page.flatMap(r=>['submission:'+r.submissionId,JSON.stringify(r)])];}
  else result=JSON.stringify(records.find(r=>'submission:'+r.submissionId===args[2]));
  return new Response(JSON.stringify({result}));
 }));
 const first=await scanSubmissions('0',1);const second=await scanSubmissions(first.cursor,1);const third=await scanSubmissions(second.cursor,1);
 expect(first.records[0].submissionId).toBe(records[0].submissionId);expect(second.records[0].submissionId).toBe(records[1].submissionId);expect(third.records[0].submissionId).toBe(records[2].submissionId);expect(third.cursor).toBe('0');expect(scans).toBe(1);
});
