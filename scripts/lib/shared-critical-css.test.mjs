import { describe, it, expect } from 'vitest';
import postcss from 'postcss';
import { splitSharedCriticalCss } from './shared-critical-css.mjs';

describe('lossless shared critical CSS extraction', () => {
  it('shares a complete prefix across content pages while leaving a bare shell untouched', () => {
    const prefix='.nav{display:flex}.nav-logo{width:120px}';
    const suffix=':root{--font-ui:Inter}body{margin:0}';
    const values=[prefix+'.a{color:red}'+suffix,prefix+'.b{color:blue}'+suffix,suffix];
    const result=splitSharedCriticalCss(values,{minSharedBytes:1});
    expect(result.prefix).toBe(prefix);
    expect(result.suffix).toBe(suffix);
    expect(result.parts.map(p=>p.hasPrefix)).toEqual([true,true,false]);
    result.parts.forEach((p,i)=>expect((p.hasPrefix?result.prefix:'')+p.own+result.suffix).toBe(values[i]));
  });
  it('never splits a shared fragment in the middle of a selector or declaration', () => {
    const values=['.nav{color:red}.x{margin:0}:root{--x:1}', '.nav{color:blue}.y{margin:0}:root{--x:1}'];
    const result=splitSharedCriticalCss(values,{minSharedBytes:1});
    expect(result.prefix).toBe('');
    expect(result.suffix).toBe(':root{--x:1}');
    for(const [i,p]of result.parts.entries()){
      expect(p.own+result.suffix).toBe(values[i]);
      expect(()=>postcss.parse(p.own)).not.toThrow();
    }
  });
  it('does not add a request for tiny or already identical content', () => {
    const values=['.a{color:red}', '.a{color:red}'];
    const result=splitSharedCriticalCss(values);
    expect(result.prefix).toBe('');expect(result.suffix).toBe('');
    expect(result.parts.map(p=>p.own)).toEqual(values);
  });
});
