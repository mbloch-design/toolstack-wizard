import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const reportPath=path.join(root,'research/maxon-2026-09-28/implementation-report.json');
const report=JSON.parse(await fs.readFile(reportPath,'utf8'));
const urls=[...new Set(report.changes.flatMap(c=>[c.logo,...(c.media||[])]).filter(Boolean))];
const results=[];
for(let i=0;i<urls.length;i+=6){
 await Promise.all(urls.slice(i,i+6).map(async url=>{
  try{const res=await fetch(url,{method:'HEAD'});results.push({url,status:res.status,type:res.headers.get('content-type'),bytes:Number(res.headers.get('content-length'))||null});}
  catch(e){results.push({url,error:String(e)});}
 }));
 if(i%60===0)console.log('Checked',Math.min(i+6,urls.length),'of',urls.length);
}
// Maxon's image CDN occasionally drops a concurrent HEAD request. Recheck
// only failures sequentially before classifying a sourced image as broken.
for(const failed of results.filter(r=>r.status!==200||!r.type?.startsWith('image/'))){
 await new Promise(resolve=>setTimeout(resolve,500));
 try{const res=await fetch(failed.url,{method:'HEAD'});failed.status=res.status;failed.type=res.headers.get('content-type');failed.bytes=Number(res.headers.get('content-length'))||null;delete failed.error;}
 catch(e){failed.error=String(e);}
}
const bad=results.filter(r=>r.status!==200||!r.type?.startsWith('image/'));
await fs.writeFile(path.join(root,'research/maxon-2026-09-28/media-validation.json'),JSON.stringify({checkedOn:new Date().toISOString(),total:urls.length,bad,results},null,2)+'\n');
console.log('Official media',urls.length,'bad',bad.length);
for(const b of bad)console.log(b.status,b.url);
