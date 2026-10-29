import { describe, expect, it } from 'vitest';
import postcss from 'postcss';
import { createCriticalCssExtractor } from './compiled-critical-css.mjs';

const selectors = css => {
  const found = [];
  postcss.parse(css).walkRules(rule => found.push(rule.selector));
  return found;
};

describe('compiled critical CSS', () => {
  it('preserves source precedence regardless of HTML class or element order', () => {
    const extract = createCriticalCssExtractor('.b{color:blue}.unused{color:pink}.a{color:red}.b{color:green!important}');
    const expected = '.b{color:blue}.a{color:red}.b{color:green!important}';
    expect(extract('<div class="a b"></div>')).toBe(expected);
    expect(extract('<div class="b"></div><div class="a"></div>')).toBe(expected);
  });

  it('retains layer order and every nested conditional ancestor', () => {
    const css = '@layer theme,base,components;@layer components{@media(width<50rem){@supports(display:grid){@layer controls{.a:hover{display:grid}.unused{display:none}}}}}';
    expect(createCriticalCssExtractor(css)('<button class="a"></button>')).toBe('@layer theme,base,components;@layer components{@media(width<50rem){@supports(display:grid){@layer controls{.a:hover{display:grid}}}}}');
  });

  it('preserves compound, escaped, pseudo and contextual selectors conservatively', () => {
    const css = '.a.b:focus-visible{color:red}.group:hover .hover\\:text-red:hover{color:red}.w-\\[2\\.5rem\\]{width:2.5rem}.dark .a{color:white}.a:not(.disabled){opacity:1}.a:is(.b,.c){display:block}:is(.a,.b){margin:0}.unused{color:pink}';
    const result = createCriticalCssExtractor(css)("<div class='group a b hover:text-red w-[2.5rem]'></div>");
    expect(selectors(result)).toEqual(['.a.b:focus-visible', '.group:hover .hover\\:text-red:hover', '.w-\\[2\\.5rem\\]', '.dark .a', '.a:not(.disabled)', '.a:is(.b,.c)', ':is(.a,.b)']);
  });

  it('keeps compiled foundations, responsive tokens, font and animation dependencies', () => {
    const css = '@layer theme{:root{--color:red}.dark{--color:white}@media(width<40rem){:root{--gutter:1rem}}}@layer base{*,::before,::after{box-sizing:border-box}body{margin:0;color:var(--color)}}@font-face{font-family:ui;src:url("font.woff2")}@property --progress{syntax:"<number>";inherits:false;initial-value:0}@keyframes spin{to{transform:rotate(360deg)}}@layer components{.a{animation:spin 1s;color:var(--color)}.unused{color:pink}}';
    const result = createCriticalCssExtractor(css)('<p class="a">Hello</p>');
    expect(result).toBe(css.replace('.unused{color:pink}', ''));
    expect(result).not.toContain('@apply');
  });

  it('retains nested selectors and literal braces without parsing declarations as rules', () => {
    const css = '@layer components{.a{content:"}";&:hover{color:red}@media(width>40rem){& > span{content:"{"}}}.unused{color:pink}}';
    expect(createCriticalCssExtractor(css)('<div class="a"></div>')).toBe(css.replace('.unused{color:pink}', ''));
  });

  it('decodes HTML entities and CSS escapes without relying on double quoted classes', () => {
    const css = '.\\32 xl\\:flex{display:flex}.a\\&b{color:red}.plain{display:block}';
    expect(createCriticalCssExtractor(css)("<div class='2xl:flex a&amp;b'></div><i class=plain></i>")).toBe(css);
  });

  it('keeps selectors with class-free alternatives and negative-only conditions', () => {
    const css = '.missing,button{color:red}:not(.disabled){opacity:1}.a:has(.dynamic){color:blue}.unused{color:pink}';
    expect(createCriticalCssExtractor(css)('<button class="a"></button>')).toBe('.missing,button{color:red}:not(.disabled){opacity:1}.a:has(.dynamic){color:blue}');
  });

  it('keeps class-free alternatives inside selector functions and dynamic state', () => {
    const css = ':is(.missing,button){color:red}:where(.missing,*){opacity:1}:has(.dynamic){display:grid}.unused{color:pink}';
    expect(createCriticalCssExtractor(css)('<button></button>')).toBe(':is(.missing,button){color:red}:where(.missing,*){opacity:1}:has(.dynamic){display:grid}');
  });

  it('retains transitive custom property definitions in their conditional context', () => {
    const css = '.a{color:var(--accent)}@media(prefers-color-scheme:dark){.theme{--accent:var(--ink);--ink:white}}.unused{color:pink}';
    expect(createCriticalCssExtractor(css)('<div class="a"></div>')).toBe('.a{color:var(--accent)}@media(prefers-color-scheme:dark){.theme{--accent:var(--ink);--ink:white}}');
  });

  it('uses an ancestor class for tag subjects without shipping absent page families', () => {
    const css = '.article h2{color:red}.admin button:hover{color:pink}.article :is(.missing,button){display:block}';
    expect(createCriticalCssExtractor(css)('<main class="article"><h2>Title</h2></main>')).toBe('.article h2{color:red}.article :is(.missing,button){display:block}');
    expect(createCriticalCssExtractor(css)('')).toBe('');
  });

  it('does not pull unrelated scoped overrides when global token definitions are retained', () => {
    const css = ':root{--ink:black}@property --angle{syntax:"<angle>";inherits:false;initial-value:0deg}.a{color:var(--ink);rotate:var(--angle)}.unused{--ink:pink;--angle:90deg;color:pink}';
    expect(createCriticalCssExtractor(css)('<div class="a"></div>')).toBe(':root{--ink:black}@property --angle{syntax:"<angle>";inherits:false;initial-value:0deg}.a{color:var(--ink);rotate:var(--angle)}');
  });

  it('indexes one compiled sheet and isolates successive pages', () => {
    const extract = createCriticalCssExtractor('.a{color:red}.b{color:blue}');
    expect(extract('<div class="a"></div>')).toBe('.a{color:red}');
    expect(extract('<div class="b"></div>')).toBe('.b{color:blue}');
    expect(extract('')).toBe('');
  });

  it('does not ship unrelated component families for a small page', () => {
    const css = Array.from({ length: 1000 }, (_, i) => `.owner-${i}{color:red}`).join('');
    expect(createCriticalCssExtractor(css)('<main class="owner-42"></main>')).toBe('.owner-42{color:red}');
  });
  it('optionally coalesces owned class families to bound production CSS variants without reordering', () => {
    const css = '.td-title{color:red}.ga-title{color:green}.td-price{color:blue}';
    const extract = createCriticalCssExtractor(css, { coalesceFamilies: true });
    expect(extract('<main class="td-title"></main>')).toBe('.td-title{color:red}.td-price{color:blue}');
    expect(createCriticalCssExtractor(css)('<main class="td-title"></main>')).toBe('.td-title{color:red}');
  });

});
