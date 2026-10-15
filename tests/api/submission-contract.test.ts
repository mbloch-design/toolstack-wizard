import { describe, it, expect } from 'vitest';
import { normalizeSubmission, submissionFingerprint } from '../../api/_submission-contract';
const input = { submissionId:'7ec2090a-9157-43c9-9238-f8931667420d', paid:false, name:'Ada', email:'ada@example.com', subject:'Tool', message:'Hello', toolName:'Sample', toolUrl:'https://EXAMPLE.com', submitterRole:'Founder', badgeUrl:'https://example.com/badge', lang:'en' };
describe('submission contract', () => {
 it('normalizes equivalent URLs and ignores temporary proof in the fingerprint', () => {
  const a=normalizeSubmission(input); const b=normalizeSubmission({...input, toolUrl:'https://example.com/', verificationToken:'renewed'});
  expect(a.toolUrl).toBe('https://example.com/'); expect(submissionFingerprint(a)).toBe(submissionFingerprint(b));
 });
 it.each([{email:'other@example.com'},{lang:'fr'},{message:'Changed'},{paid:true,checkoutId:'ch_local',paymentReference:input.submissionId}])('changed accepted contents change the fingerprint: %j', patch=>{
  expect(submissionFingerprint(normalizeSubmission({...input,...patch}))).not.toBe(submissionFingerprint(normalizeSubmission(input)));
 });
 it.each([{submissionId:'bad'},{paid:'true'},{toolName:{}},{message:'x'.repeat(2001)},{toolUrl:'http://user:pass@example.com'},{email:'invalid'}])('rejects unsafe input %j',patch=>expect(()=>normalizeSubmission({...input,...patch})).toThrow());
 it('adopts the existing paid reference without replacing it',()=>expect(normalizeSubmission({...input,submissionId:undefined,paid:true,checkoutId:'ch_local',paymentReference:input.submissionId}).submissionId).toBe(input.submissionId));
});
it('preserves the existing payment verifier checkout identifier grammar',()=>{
 expect(normalizeSubmission({...input,paid:true,checkoutId:'ch_supported-id_suffix',paymentReference:input.submissionId}).checkoutId).toBe('ch_supported-id_suffix');
});
