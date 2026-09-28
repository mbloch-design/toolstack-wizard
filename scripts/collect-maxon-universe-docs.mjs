import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const base='https://help.maxon.net/rg/en-us/Content/html/';
const root=new URL('../research/maxon-2026-09-28/manuals/',import.meta.url);
await fs.mkdir(root,{recursive:true});
const html=await(await fetch(base+'universe-tools-locator.html')).text();
const content=html.slice(html.lastIndexOf('This page lists every Maxon Universe tool'));
const links=[...new Map([...content.matchAll(/href="([^"#]+\.html)"[^>]*>([^<]+)</g)].filter(m=>!m[1].includes('/')).map(m=>[m[1],m[2].trim()])).entries()];
const clean=s=>s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const manifest=[];
for(const [path,name] of links){
 try{const prior=JSON.parse(await fs.readFile(new URL(path.replace('.html','.json'),root),'utf8'));if(prior.status===200){manifest.push({name,path,status:200});continue;}}catch{}
 const url=new URL(path,base).href;const res=await fetch(url);const body=await res.text();
 if(res.status===429){console.log('Rate limited; stopped without bypass.');break;}
 const item={name,url,status:res.status,fetchedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(body).digest('hex'),paragraphs:[...body.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)].map(m=>clean(m[1])).filter(Boolean),images:[...new Set([...body.matchAll(/(?:src|poster)="([^"#]+\.(?:png|jpg|jpeg|webp|gif))"/gi)].map(m=>new URL(m[1],url).href))]};
 await fs.writeFile(new URL(path.replace('.html','.json'),root),JSON.stringify(item,null,2)+'\n');manifest.push({name,path,status:res.status});console.log(name,item.paragraphs.length,item.images.length);await new Promise(r=>setTimeout(r,1000));
}
await fs.writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
