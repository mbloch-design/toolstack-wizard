import { expect, it } from 'vitest';
import config from '../../vercel.json';

it('permits only the official Kit video on its two overview routes and keeps the global frame block', () => {
  const globalIndex = config.headers.findIndex(rule => rule.source === '/(.*)');
  const kitIndex = config.headers.findIndex(rule => rule.source === '/:lang(fr|en)/tool/kit');
  expect(kitIndex).toBeGreaterThan(globalIndex);
  const policy = (index: number) => config.headers[index].headers.find(h => h.key === 'Content-Security-Policy')?.value;
  expect(policy(globalIndex)).toContain("frame-src 'none'");
  expect(policy(kitIndex)).toContain('frame-src https://fast.wistia.net/embed/iframe/z0e60vz71d;');
  expect(policy(kitIndex)).toContain("object-src 'none'");
});
