// Collect public product evidence only. This does not publish catalogue entries.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const root = new URL('../research/maxon-2026-09-28/', import.meta.url);
await fs.mkdir(root, { recursive: true });
const sitemap = await (await fetch('https://www.maxon.net/api/sitemap.xml')).text();
const categories = new Set(['tools','blurs-and-glows','color','distortions','stylize','generators','motion-graphics','text','utilities','transitions']);
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]).filter(u=> {
  const path = new URL(u).pathname.split('/').filter(Boolean);
  return path[0]==='en' && path[1]==='product-detail' && path[2]==='red-giant' && path.length===5 && path[3]!=='maxon-studio' && !categories.has(path[4]);
});
urls.push(...['maxon-one','cinema-4d','zbrush','redshift','red-giant','autograph','capsules','cinebench','cineware','zbrush-for-ipad','cinema-4d/features/moves-by-maxon','product-detail/red-giant/maxon-studio'].map(p=>'https://www.maxon.net/en/'+p));
const clean = s => s.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const manifest=[];
const retry = process.argv.includes('--retry');
const extras=process.argv.includes('--extras');
const extraPaths=['red-giant/universe','maxon-app','cinema-4d/features/cineware-for-after-effects','cinema-4d/features/cineware-for-illustrator','redshift-for-architects','downloads'];
const selected = extras ? extraPaths.map(p=>'https://www.maxon.net/en/'+p) : retry ? (JSON.parse(await fs.readFile(new URL('manifest.json',root),'utf8'))).filter(x=>x.status!==200).map(x=>x.sourceUrl) : urls;
for(let i=0;i<selected.length;i+=1) await Promise.all(selected.slice(i,i+1).map(async url=>{
  const response=await fetch(url); const html=await response.text();
  const match=html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  const data=match?JSON.parse(match[1]):[];
  const strings=data.filter(v=>typeof v==='string');
  const slug=new URL(url).pathname.split('/').pop();
  const item={sourceUrl:url,resolvedUrl:response.url,status:response.status,fetchedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(html).digest('hex'),title:clean(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]||''),paragraphs:strings.filter(s=>/^<p[ >]/.test(s)).map(clean).filter(s=>!/^Stay up to date|^We encourage|^Maxon is an equal|^We collaborate|^We are obsessed|^We embrace/.test(s)),images:[...new Set(strings.filter(s=>s.startsWith('https://mxwebnuxtprod01.blob.core.windows.net/media/')&&!/Careers|Maxon_Beeple|Maxon_Unite/.test(s)))],strings:strings.filter(s=>!s.includes('imgix.net')&&!s.includes('<script')&&s.length<1000)};
  await fs.writeFile(new URL(slug+'.json',root),JSON.stringify(item,null,2)+'\n');
  manifest.push({slug,sourceUrl:url,status:response.status,title:item.title,images:item.images.length,paragraphs:item.paragraphs.length,reviewStatus:'collected-not-published'});
  console.log(response.status,slug,item.paragraphs.length,item.images.length);
  await new Promise(resolve=>setTimeout(resolve,2000));
}));
if(retry||extras){const previous=JSON.parse(await fs.readFile(new URL('manifest.json',root),'utf8'));manifest.push(...previous.filter(p=>!selected.includes(p.sourceUrl)));}
manifest.sort((a,b)=>a.slug.localeCompare(b.slug));
await fs.writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log('Collected',manifest.length,'sources. All require editorial review before publication.');
