import catalog from '@/data/tools_index.json';
import { describe, expect, it } from 'vitest';
import type { ToolSummary } from '@/hooks/useSupabaseData';
import { buildStackDiscovery } from './stackDiscovery';
const tool=(id:string, props:Partial<ToolSummary>={})=>({id,slug:id,name:id,categoryId:'design',functional_needs:['image-generation'],...props}) as ToolSummary;
const source=tool('firefly',{bundle_parent:'creative-cloud'});
const options=(tools:ToolSummary[])=>({sourceTools:[source],tools:[source,...tools],stackEntries:[],getCategoryLabel:()=> 'Design'});
describe('stack discovery',()=>{
 it('opens beyond the existing suite and varies declared families in the first three picks',()=>{
  const result=buildStackDiscovery(options([tool('photoshop',{bundle_parent:'creative-cloud'}),tool('illustrator',{bundle_parent:'creative-cloud'}),tool('other-image'),tool('another-image')]));
  expect(result.slice(0,3).filter(x=>x.tool.bundle_parent==='creative-cloud')).toHaveLength(1);
  expect(result.some(x=>x.tool.id==='other-image')).toBe(true);
 });
 it('includes clearly described alternatives as discovery rather than promising no overlap',()=>{
  const alt=tool('another-image',{alternatives:['firefly']});
  expect(buildStackDiscovery(options([alt]))[0]).toMatchObject({direction:'alternatives',tool:alt});
 });
 it('excludes existing tools, own attached modules and guarded comparisons',()=>{
  const input=options([tool('module',{host_app:'firefly',tool_type:'metier'}),tool('saved')]);
  expect(buildStackDiscovery({...input,stackEntries:[{toolSlug:'saved',needIds:[],intent:'stack',addedAt:'2026-10-27',assignmentMode:'pending'}]})).toEqual([]);
 });
 it('does not invent a visible relationship for an unrelated tool',()=>{
  expect(buildStackDiscovery(options([tool('unrelated',{functional_needs:[],categoryId:'finance'})]))).toEqual([]);
 });
});

it('opens the real Firefly catalogue beyond its two Adobe suite neighbours',()=>{
 const firefly=catalog.find(tool=>tool.slug==='firefly') as ToolSummary;
 const candidates=buildStackDiscovery({sourceTools:[firefly],tools:catalog as ToolSummary[],stackEntries:[],getCategoryLabel:()=>''});
 expect(candidates.length).toBeGreaterThan(3);
 expect(candidates.slice(0,3).filter(candidate=>candidate.tool.bundle_parent==='adobe-creative-cloud').length).toBeLessThanOrEqual(1);
 expect(candidates.some(candidate=>candidate.direction==='alternatives')).toBe(true);
});
