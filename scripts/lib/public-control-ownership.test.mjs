import fs from 'node:fs';
import {describe,it,expect} from 'vitest';
import {inspectTsx} from './design-ownership.mjs';

for(const name of ['ContactPage','TransparencyPage','ComparePage','SubmitToolPage']){
 describe(name,()=>{
  it('uses common controls instead of copied generic button classes',()=>{
   expect(inspectTsx(`src/pages/${name}.tsx`,fs.readFileSync(`src/pages/${name}.tsx`,'utf8')).filter(x=>x.kind==='old-control-class')).toEqual([]);
  });
 });
}
