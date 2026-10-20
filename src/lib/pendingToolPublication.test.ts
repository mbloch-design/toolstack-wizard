import { describe, expect, it } from 'vitest';
import tools from '@/data/tools_v4.json';
import index from '@/data/tools_index.json';
import { relPourLienOutil } from './externalLink';

describe('completed tool publication', () => {
  it.each([
    ['viralsnap', 'https://getviralsnap.com/'],
    ['sprokl', 'https://getsprokl.com/'],
  ])('publishes %s once with bilingual content and nofollow', (slug, url) => {
    const matches = tools.filter(t => t.slug === slug);
    expect(matches).toHaveLength(1);
    const tool = matches[0];
    expect(tool.websiteUrl).toBe(url);
    expect(tool.longDescription.length).toBeGreaterThan(100);
    expect(tool.longDescriptionEn.length).toBeGreaterThan(100);
    expect(index.some(t => t.slug === slug)).toBe(true);
    expect(relPourLienOutil(url, '', url)).toBe('nofollow noopener noreferrer');
  });
});
