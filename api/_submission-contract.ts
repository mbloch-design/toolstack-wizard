import { createHash } from 'node:crypto';
export type MailKind = 'internal' | 'confirmation';
export type MailPayload = {from:string;to:string;replyTo?:string;subject:string;html:string};
export type MailJob = {key:string;state:'pending'|'sending'|'sent'|'reconcile';payload?:MailPayload;firstAttemptAt?:number;leaseUntil?:number;owner?:string;providerId?:string;sentAt?:number};
export type SubmissionRecord = {version:1;submissionId:string;fingerprint:string;checkoutId?:string;state:'accepted'|'suspended';acceptedAt:number;jobs:Record<MailKind,MailJob>;archived?:boolean};
export type SubmissionInput = {submissionId:string;checkoutId?:string;paymentReference?:string;paid:boolean;name:string;email:string;subject:string;message:string;toolName:string;toolUrl:string;submitterRole:string;badgeUrl?:string;lang:'fr'|'en'};
export const validSubmissionId = (id:unknown):id is string => typeof id==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export function normalizeSubmission(raw:unknown):SubmissionInput {
 if(!raw || typeof raw!=='object' || Array.isArray(raw)) throw new Error('invalid_submission');
 const b=raw as Record<string,unknown>;
 const paid=b.paid===true;
 if(b.paid!=null && typeof b.paid!=='boolean') throw new Error('invalid_submission');
 const submissionId=b.submissionId ?? (paid?b.paymentReference:undefined);
 if(!validSubmissionId(submissionId)) throw new Error('invalid_submission');
 const text=(key:string,max=300)=>{const v=b[key];if(typeof v!=='string'|| !v.trim() || v.length>max)throw new Error('invalid_submission');return v.trim();};
 const url=(key:string)=>{const v=new URL(text(key));if(!['http:','https:'].includes(v.protocol)||v.username||v.password)throw new Error('invalid_submission');return v.href;};
 const input:SubmissionInput={submissionId,paid,name:text('name'),email:text('email'),subject:text('subject'),message:text('message',2000),toolName:text('toolName'),toolUrl:url('toolUrl'),submitterRole:text('submitterRole'),lang:b.lang==='fr'?'fr':'en'};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))throw new Error('invalid_submission');
 if(paid){input.checkoutId=text('checkoutId');input.paymentReference=text('paymentReference');if(!/^(?:ch|chk)_[A-Za-z0-9]+$/.test(input.checkoutId)||!validSubmissionId(input.paymentReference))throw new Error('invalid_submission');}
 else input.badgeUrl=url('badgeUrl');
 if(Buffer.byteLength(JSON.stringify(input))>16*1024)throw new Error('invalid_submission');
 return input;
}
export function submissionFingerprint(input:SubmissionInput):string {
 return createHash('sha256').update(JSON.stringify([input.submissionId,input.paid,input.checkoutId??'',input.paymentReference??'',input.name,input.email,input.subject,input.message,input.toolName,input.toolUrl,input.submitterRole,input.badgeUrl??'',input.lang])).digest('hex');
}
