#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectCss, inspectTsx, exceptionKey,collectControlClasses } from './lib/design-ownership.mjs';

export function collectDesignFindings(root=process.cwd()){
 const files=[];
 const walk=dir=>{if(!fs.existsSync(path.join(root,dir)))return;for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  const p=path.posix.join(dir,e.name);if(e.isDirectory())walk(p);else if(!/\.(?:test|spec)\.|\/__tests__\//.test(p)&&/\.(?:css|tsx)$/.test(p))files.push(p);
 }};
 ['src/styles','src/components','src/pages'].forEach(walk);files.push('src/index.css');
 const sources=files.sort().map(file=>[file,fs.readFileSync(path.join(root,file),'utf8')]);
 const controlClasses=new Set(sources.filter(([file])=>file.endsWith('.tsx')).flatMap(([file,source])=>[...collectControlClasses(file,source)]));
 return sources.flatMap(([file,source])=>file.endsWith('.css')?inspectCss(file,source,{controlClasses}):inspectTsx(file,source));
}

export function unmatchedFindings(found,exceptions){
 const exact=new Set(exceptions.map(x=>x.key));
 // Ownership contracts can never be silenced through a token exception.
 const eligible=new Set(['literal-color','literal-radius','inline-appearance','important']);
 return found.filter(item=>!eligible.has(item.kind)||!exact.has(exceptionKey(item)));
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 if(process.argv.includes('--update-baseline')){
  console.error('No aggregate design budget exists. Review an exact exception with its owner and removal condition.');process.exit(1);
 }
 const manifest=JSON.parse(fs.readFileSync('scripts/design-system-exceptions.json','utf8'));
 for(const item of manifest.exceptions){
  if(!item.key||!item.owner||!item.reason||!item.removalCondition)throw new Error('Incomplete design exception');
 }
 const found=collectDesignFindings();const unknown=unmatchedFindings(found,manifest.exceptions);
 for(const item of unknown)console.error(`${item.kind}: ${item.file} ${item.context} ${item.selector} ${item.property}: ${item.value}`);
 if(unknown.length){console.error(`Design ownership failed: ${unknown.length} unreviewed findings.`);process.exit(1)}
 const active=new Set(found.map(exceptionKey));
 const stale=manifest.exceptions.filter(x=>!active.has(x.key));
 if(stale.length){console.error(`Remove ${stale.length} stale design exceptions; deleted debt gives no credit elsewhere.`);process.exit(1)}
 console.log(`Design ownership PASS: exact exceptions ${manifest.exceptions.length}; no transferable budget.`);
}
