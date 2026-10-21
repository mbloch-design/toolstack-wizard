// Test harness for Vercel's static-file + explicit fallback routing contract.
// It does not certify the deployed CDN; production HTTP must be checked after deploy.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { match, compile } from 'path-to-regexp';
const root=path.resolve('dist');
const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const redirects=config.redirects.filter(rule=>!rule.has).map(rule=>({...rule,match:match(rule.source),destination:compile(rule.destination,{encode:encodeURIComponent})}));
const headerRules=(config.headers||[]).map(rule=>({...rule,match:match(rule.source)}));
const rewrites=config.rewrites.map(rule=>({...rule,match:match(rule.source)}));
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const port=Number(process.env.PORT||8093);
http.createServer((request,response)=>{
 try{
  const url=new URL(request.url,'http://127.0.0.1');const pathname=decodeURIComponent(url.pathname);
  for(const rule of headerRules){const found=rule.match(pathname);if(found)for(const header of rule.headers){const value=header.value.replace(/:([A-Za-z][A-Za-z0-9_]*)/g,(token,key)=>found.params[key]===undefined?token:String(found.params[key]));response.setHeader(header.key,value);}}
  response.setHeader('Cache-Control','no-store');
  for(const rule of redirects){const found=rule.match(pathname);if(found){response.writeHead(rule.permanent?308:307,{Location:rule.destination(found.params)+url.search}).end();return;}}
  let file=path.resolve(root,`.${pathname}`);
  if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  let status=200;
  if(!fs.existsSync(file)){const rule=rewrites.find(rule=>rule.match(pathname));if(rule)file=path.join(root,rule.destination);else{file=path.join(root,'404.html');status=404;}}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404).end();return;}
  response.writeHead(status,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(response);
 }catch{response.writeHead(400).end();}
}).listen(port,'127.0.0.1',()=>console.log(`Generated routing contract server: http://127.0.0.1:${port}`));
