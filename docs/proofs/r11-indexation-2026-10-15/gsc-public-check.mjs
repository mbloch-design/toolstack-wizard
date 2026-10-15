import fs from 'node:fs';
const urls=JSON.parse(fs.readFileSync('docs/proofs/r11-indexation-2026-10-15/gsc-sample-urls.json','utf8'));
const rows=[];
for(const url of urls){let current=url;const chain=[];for(let hop=0;hop<6;hop++){const r=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(20000)});const html=await r.text();const location=r.headers.get('location');chain.push({url:current,status:r.status,location,canonical:html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1],robots:[...html.matchAll(/<meta\s+name="robots"\s+content="([^"]+)"/gi)].map(m=>m[1]),title:html.match(/<title>(.*?)<\/title>/i)?.[1]});if(r.status<300||r.status>=400||!location)break;current=new URL(location,current).href;}rows.push({url,chain});}
fs.writeFileSync('docs/proofs/r11-indexation-2026-10-15/gsc-current-http.json',JSON.stringify({measuredAt:new Date().toISOString(),rows},null,2));console.log(`Measured ${rows.length} public GSC sample chains`);
