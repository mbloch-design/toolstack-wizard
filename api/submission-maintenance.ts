import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest,VercelResponse } from '../types/vercel-http.js';
import {validSubmissionId} from './_submission-contract.js';
import {scanSubmissions,suspendSubmission,archiveSubmission,validMaintenanceCursor} from './_submission-store.js';
import {deliverSubmission} from './_submission-mail.js';
export async function maintainSubmissions(action:'retry'|'archive'|'suspend',cursor:string,id?:string):Promise<{cursor:string;processed:number}>{
 if(action==='suspend'){if(!validSubmissionId(id))throw new Error('invalid_maintenance');return {cursor:'0',processed:await suspendSubmission(id)?1:0};}
 const page=await scanSubmissions(cursor,action==='retry'?1:25);let processed=0;
 for(const record of page.records){
  if(action==='archive'){if(await archiveSubmission(record.submissionId))processed++;}
  else if(record.state==='accepted'&&['internal','confirmation'].some(kind=>['pending','sending'].includes(record.jobs[kind as 'internal'|'confirmation'].state))){await deliverSubmission(record.submissionId);processed++;}
 }
 return {cursor:page.cursor,processed};
}
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 res.setHeader('Cache-Control','no-store');
 const secret=process.env.SUBMISSION_MAINTENANCE_TOKEN;
 const header=req.headers.authorization;
 const supplied=typeof header==='string'&&header.startsWith('Bearer ')?header.slice(7):'';
 if(!secret||!supplied||Buffer.byteLength(secret)!==Buffer.byteLength(supplied)||!timingSafeEqual(Buffer.from(secret),Buffer.from(supplied)))return res.status(401).json({error:'unauthorized'});
 const {action,cursor='0',id}=req.body??{};
 if(!['retry','archive','suspend'].includes(action)||!validMaintenanceCursor(cursor)||(action==='suspend'&&!validSubmissionId(id)))return res.status(400).json({error:'invalid_maintenance'});
 try{return res.status(200).json(await maintainSubmissions(action,cursor,id));}
 catch{return res.status(503).json({error:'submission_store_unavailable'});}
}
