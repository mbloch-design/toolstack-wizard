/** Read-only availability audit: catalogue covers/logos/galleries/destinations and FR/EN editorial URLs.
 * node scripts/audit-r11-media-links.mjs --offline --output=reports/r11-media-links.json
 * Omit --offline for bounded GET checks (20 workers, 10 seconds/request).
 * HTTP 200 verifies availability only, not product accuracy, licensing or visual quality. */
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const offline=process.argv.includes('--offline');
const output=process.argv.find(arg=>arg.startsWith('--output='))?.slice(9)||'reports/r11-media-links.json';
const refs=new Map();
function add(url,source,kind,slug){if(typeof url!=='string'||!url.trim())return;url=url.trim();const key=url;const r=refs.get(key)||{url,refs:[]};r.refs.push({source,kind,slug});refs.set(key,r);}
for(const file of ['tools_index.json','tools_v4.json']) for(const t of JSON.parse(fs.readFileSync('src/data/'+file))){for(const k of ['ogImageUrl','logo'])add(t[k],file,k,t.slug);for(const u of t.galleryImages||[])add(u,file,'gallery',t.slug);for(const k of ['websiteUrl','affiliateLink'])add(t[k],file,k,t.slug);}
for(const file of ['posts-fr.json','posts-en.json'])for(const p of JSON.parse(fs.readFileSync('src/data/'+file)))for(const m of JSON.stringify(p).matchAll(/https?:\/\/[^\s"<>\\)\]]+/g))add(m[0],file,'editorial',p.slug);
for(const m of fs.readFileSync('src/data/toolMedia.ts','utf8').matchAll(/(src|sourceUrl): "([^"]+)"/g))add(m[2],'toolMedia.ts',m[1],'newbi');
const items=[...refs.values()];let i=0,done=0;const results=[];
function local(r){if(!/^https?:\/\//.test(r.url)&&!r.url.startsWith('/'))return {...r,status:'invalid_url'};let u;try{u=new URL(r.url,'https://tooltrim.com')}catch{return {...r,status:'invalid_url'}};if(!['tooltrim.com','www.tooltrim.com'].includes(u.hostname)||!r.refs.some(x=>['logo','ogImageUrl','gallery','src'].includes(x.kind)))return;const pathname=u.pathname.replace(/^\/public\//,'/');const file=path.join(root,'public',pathname);return {...r,status:fs.existsSync(file)?'local_exists':'local_missing',path:pathname,...(fs.existsSync(file)?{bytes:fs.statSync(file).size}:{})};}
async function inspect(r){let l=local(r);if(l)return l;if(offline)return {...r,status:'not_checked'};try{const response=await fetch(r.url,{redirect:'follow',signal:AbortSignal.timeout(10000),headers:{'user-agent':'Mozilla/5.0 (compatible; ToolTrimAudit/1.0; +https://tooltrim.com)'}});const contentType=response.headers.get('content-type')||'';const http=response.status;let status=http===404||http===410?'not_found':[401,403,429].includes(http)?'access_restricted':http>=500?'server_error':response.ok?'http_ok':'http_other';const media=r.refs.some(x=>['logo','ogImageUrl','gallery','src'].includes(x.kind));if(response.ok&&media&&!contentType.startsWith('image/'))status='unexpected_media_type';await response.body?.cancel();return {...r,status,http,contentType,finalUrl:response.url};}catch(e){return {...r,status:'network_uncertain',error:e.message,cause:e.cause?.code};}}
await Promise.all(Array.from({length:20},async()=>{while(i<items.length){const r=items[i++];results.push(await inspect(r));if(++done%100===0)console.log(done+'/'+items.length);}}));
results.sort((a,b)=>a.url.localeCompare(b.url));const counts={};for(const r of results)counts[r.status]=(counts[r.status]||0)+1;const report={generatedAt:new Date().toISOString(),method:'GET redirects followed, headers only; 10s timeout; restricted/timeouts not classified as broken; local media existence check',counts,uniqueUrls:items.length,items:results};fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({...report,offline},null,2)+'\n');console.log(JSON.stringify(counts));
