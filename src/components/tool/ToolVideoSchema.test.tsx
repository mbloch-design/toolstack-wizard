import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import ToolJsonLd from './ToolJsonLd';
import tools from '@/data/tools_v4.json';

it('describes the visible Kit video as Wistia with its official poster, not YouTube', () => {
  const kit = tools.find(t => t.slug === 'kit');
  render(<ToolJsonLd tool={kit as any} category={undefined} displayPrice={0} verifiedOn={null} alternatives={[]} lang="en" canonicalUrl="https://tooltrim.com/en/tool/kit" />);
  const schema = JSON.parse(document.getElementById('tool-video-jsonld')?.textContent || '{}');
  expect(schema.embedUrl).toBe('https://fast.wistia.net/embed/iframe/z0e60vz71d');
  expect(schema.thumbnailUrl).toContain('wistia.com/deliveries/');
});
