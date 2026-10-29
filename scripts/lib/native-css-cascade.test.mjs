import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { describe, expect, it } from 'vitest';

const entry = path.resolve('src/index.css');
const source = () => fs.readFileSync(entry, 'utf8');

describe('native owned cascade', () => {
  it('has a small explicit entry and no flattening postprocessor', () => {
    expect(source().length).toBeLessThan(12000);
    expect(fs.readFileSync('postcss.config.js', 'utf8')).not.toMatch(/legacyCssCascade|legacy-css-cascade/);
    expect(source()).toContain('@layer theme, base, components;');
    expect(fs.existsSync('scripts/lib/legacy-css-cascade.mjs')).toBe(false);
  });

  it('retains application specificity and important order in a native layer', async () => {
    const css = '@layer theme,base,components; @layer base{body{margin:0}} @layer components{.a.b{color:red!important}.a{color:black}.a.b{color:green!important}.a{color:blue}}';
    const result = await postcss([tailwind({ optimize: false })]).process(css, { from: entry });
    const root = postcss.parse(result.css);
    expect(root.nodes.some(n => n.type === 'atrule' && n.name === 'layer' && n.nodes)).toBe(true);
    const declarations=[];root.walkDecls('color',d=>declarations.push([d.value,!!d.important]));
    expect(declarations).toEqual([['red',true],['black',false],['green',true],['blue',false]]);
  });

  it('has unique unconditional foundation tokens, with contexts preserved', () => {
    const root = postcss.parse(fs.readFileSync('src/styles/foundations.css', 'utf8'));
    const seen = new Set();
    root.walkRules(rule => {
      if (![':root', '.dark'].includes(rule.selector)) return;
      if (rule.parent.type !== 'root') return;
      rule.walkDecls(/^--/, d => {
        const key = `${rule.selector}:${d.prop}`;
        expect(seen.has(key), `duplicate unconditional token ${key}`).toBe(false);
        seen.add(key);
      });
    });
    expect(seen.has(':root:--radius-2xl')).toBe(true);
    expect(root.toString()).toContain('(max-width: 767px)');
  });
  it('compiles the real entry with generated utilities and domain importance in the same native layer', async () => {
    const result = await postcss([tailwind({ optimize: false })]).process(source(), { from: entry });
    const root = postcss.parse(result.css);
    const rules = [];
    root.walkRules(rule => {
      let layer = null;
      for (let parent = rule.parent; parent; parent = parent.parent) {
        if (parent.type === 'atrule' && /keyframes$/.test(parent.name)) return;
        if (parent.type === 'atrule' && parent.name === 'layer') layer = parent.params;
      }
      expect(layer, `unowned emitted rule ${rule.selector}`).toBeTruthy();
      rules.push({ selector: rule.selector, layer });
    });
    const utility = rules.findIndex(rule => rule.selector === '.flex');
    const domain = rules.findLastIndex(rule => rule.selector === '.ms-page .mf .mf-grid');
    expect(utility).toBeGreaterThan(-1);
    expect(domain).toBeGreaterThan(utility);
    expect(rules[utility].layer).toBe('components');
    expect(rules[domain].layer).toBe('components');
    expect(rules.some(rule => rule.selector === '.ui-button' && rule.layer === 'components')).toBe(true);
  }, 30000);

});
