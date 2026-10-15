import { describe, it, expect } from 'vitest';
import postcss from 'postcss';
import { legacyCssCascade } from './legacy-css-cascade.mjs';

describe('ToolTrim CSS cascade during Tailwind 4 migration', () => {
  it('keeps base, component and utility precedence before unlayered editorial overrides', async () => {
    const css = '.editorial { color: black } @layer utilities { .text { color: blue } } @layer components { .editorial { color: red } } @layer base { body { margin: 0 } } @layer components { @media (min-width: 768px) { .editorial { padding: 8px } } }';
    const result = await postcss([legacyCssCascade()]).process(css, { from: undefined });
    const root = postcss.parse(result.css);
    expect(root.nodes.map(n => n.selector || n.name)).toEqual(['body', '.editorial', 'media', '.text', '.editorial']);
    expect(root.last.toString()).toContain('color: black');
    expect(root.nodes[2].params).toBe('(min-width: 768px)');
    expect(root.nodes[2].first.selector).toBe('.editorial');
  });
  it('places theme defaults first and retains unrelated layers and property registration', async () => {
    const result = await postcss([legacyCssCascade()]).process('@layer theme,base,components,utilities; @property --x { syntax: "*"; inherits: false } @layer theme { :root { --x: 1 } } @layer vendor { .vendor { color: red } } :root { --x: 2 }', { from: undefined });
    const root = postcss.parse(result.css);
    expect(root.first.selector).toBe(':root');
    expect(root.first.first.value.trim()).toBe('1');
    expect(root.last.first.value.trim()).toBe('2');
    expect(root.nodes.some(n => n.name === 'property')).toBe(true);
    expect(root.nodes.some(n => n.name === 'layer' && n.params === 'vendor')).toBe(true);
    expect(root.nodes.some(n => n.name === 'layer' && !n.nodes)).toBe(false);
  });
});
