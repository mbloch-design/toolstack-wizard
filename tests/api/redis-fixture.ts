import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
const exec=promisify(execFile);
export async function startRedis(){
 const bin=process.env.SUBMISSION_TEST_REDIS_BIN;if(!bin)throw new Error('SUBMISSION_TEST_REDIS_BIN required');
 const dir=await mkdtemp(join(tmpdir(),'tt-submission-redis-'));
 const port=await new Promise<number>(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>resolve(p));});});
 const child=spawn(join(bin,'redis-server'),['--port',String(port),'--bind','127.0.0.1','--save','','--appendonly','no','--dir',dir],{stdio:'ignore'});
 const command=async(args:(string|number)[])=>{const {stdout}=await exec(join(bin,'redis-cli'),['-h','127.0.0.1','-p',String(port),'--json',...args.map(String)]);return JSON.parse(stdout);};
 let ready=false;
 for(let i=0;i<50;i++){try{await command(['PING']);ready=true;break;}catch{await new Promise(r=>setTimeout(r,50));}}
 if(!ready){child.kill();throw new Error('local Redis failed to start');}
 return {command,fetch:async(_url:unknown,init?:RequestInit)=>{try{return new Response(JSON.stringify({result:await command(JSON.parse(String(init?.body)))}));}catch{return new Response(JSON.stringify({error:'local command failed'}),{status:400});}},stop:async()=>{child.kill();await new Promise<void>(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',()=>resolve());});await rm(dir,{recursive:true,force:true});}};
}
export const receiptFixture={version:1 as const,submissionId:'7ec2090a-9157-43c9-9238-f8931667420d',fingerprint:'a'.repeat(64),checkoutId:'ch_local',state:'accepted' as const,acceptedAt:1,jobs:{internal:{key:'internal',state:'pending' as const,payload:{from:'ToolTrim <contact@tooltrim.com>',to:'contact@tooltrim.com',subject:'Tool',html:'Hi'}},confirmation:{key:'confirmation',state:'pending' as const,payload:{from:'ToolTrim <contact@tooltrim.com>',to:'ada@example.com',subject:'Tool',html:'Hi'}}}};
