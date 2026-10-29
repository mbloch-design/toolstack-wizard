import {describe,it,expect} from 'vitest';
import {inspectCss, inspectTsx, exceptionKey,collectControlClasses} from './design-ownership.mjs';

describe('design ownership contracts',()=>{
 it('rejects duplicate unconditional tokens but preserves responsive/theme contexts',()=>{
  const found=inspectCss('src/styles/foundations.css',':root{--x:1;--x:2}@media(max-width:600px){:root{--x:3}}.dark{--x:4}');
  expect(found.filter(x=>x.kind==='duplicate-token')).toHaveLength(1);
 });
 it('rejects page appearance overrides while allowing primitive placement',()=>{
  const found=inspectCss('src/styles/domains/backoffice.css','.bo .ui-button{color:red;margin-top:10px}.bo{display:grid}');
  expect(found.filter(x=>x.kind==='primitive-override').map(x=>x.property)).toEqual(['color']);
 });
 it('detects literal values and important declarations in modular CSS',()=>{
  const found=inspectCss('src/styles/domains/tools.css','.td{--local:#fff;color:#fff;border-radius:17px!important}');
  expect(found.map(x=>x.kind)).toEqual(expect.arrayContaining(['literal-color','literal-radius','important']));
  expect(found.filter(x=>x.kind==='literal-color')).toHaveLength(2);
 });
 it('uses AST imports and expressions to reject copied generic controls',()=>{
  const found=inspectTsx('src/components/backoffice/X.tsx',`import {Button} from '@/components/stack/StackKit'; const cls = active ? 'mk-button tt-button-primary' : 'ac-button'; export const X=()=> <button className={cls}/>;`);
  expect(found.map(x=>x.kind)).toContain('business-kit-import');
  expect(found.filter(x=>x.kind==='old-control-class')).toHaveLength(3);
 });
 it('does not treat comments or dynamic dataviz as static appearance',()=>{
  const found=inspectTsx('src/components/Plot.tsx',`// className="tt-button-primary"\nexport const P=({amount})=><div style={{width:amount+'%',transform:'scale('+amount+')','--amount':amount}}/>;`);
  expect(found).toEqual([]);
 });
 it('rejects new inline control appearance with an exact contextual key',()=>{
  const [found]=inspectTsx('src/pages/X.tsx',`export const X=()=> <button style={{borderRadius:'17px'}}/>;`);
  expect(found.kind).toBe('inline-appearance');
  expect(exceptionKey(found)).not.toBe(exceptionKey({...found,value:'18px'}));
  expect(exceptionKey(found)).not.toBe(exceptionKey({...found,file:'src/pages/Y.tsx'}));
 });
});

describe('exact exceptions instead of transferable budget',()=>{
 it('cannot spend a removed violation on a new value or consumer',async()=>{
  const {unmatchedFindings}=await import('../validate-design-system.mjs');
  const old={kind:'literal-color',file:'src/pages/Old.tsx',context:'Old',selector:'',property:'literal',value:'#ffffff'};
  const replacement={...old,file:'src/pages/New.tsx'};
  expect(unmatchedFindings([replacement],[{key:exceptionKey(old)}])).toEqual([replacement]);
  const ownership={...old,kind:'primitive-override'};
  expect(unmatchedFindings([ownership],[{key:exceptionKey(ownership)}])).toEqual([ownership]);
 });
});

it('tracks copied consumer class hooks so a page cannot indirectly reskin a shared control',()=>{
 const classes=collectControlClasses('src/pages/Settings.tsx',`import {Button as Action} from '@/components/ui/primitives';const Settings=()=> <Action className="delete-action"/>;`);
 expect(classes.has('delete-action')).toBe(true);
 expect(inspectCss('src/styles/domains/account.css','.settings .delete-action{color:red;margin-top:8px}',{controlClasses:classes}).filter(x=>x.kind==='primitive-override').map(x=>x.property)).toEqual(['color']);
});
it('follows relative StackKit composition hooks so inherited size overrides fail',()=>{
 const classes=collectControlClasses('src/components/stack/StackFindings.tsx',`import {TextLink} from './StackKit';const Findings=()=> <TextLink className="cancel"/>;`);
 expect(inspectCss('src/styles/domains/stack.css','.mf .cancel{min-height:44px}',{controlClasses:classes}).filter(x=>x.kind==='primitive-override')).toHaveLength(1);
});
