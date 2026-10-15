import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  document.head.querySelector('meta[name="tooltrim-http-status"]')?.remove();
  window.history.replaceState(null, '', '/');
  vi.resetModules();
});

describe('server 404 bootstrap', () => {
  it('retains the initial failed path without blocking navigation to a valid page', async () => {
    window.history.replaceState(null, '', '/fr/tool/missing');
    const meta = document.createElement('meta');meta.name='tooltrim-http-status';meta.content='404';document.head.appendChild(meta);
    vi.resetModules();
    const { isStaticNotFoundPath } = await import('./staticHttpError');
    expect(isStaticNotFoundPath('/fr/tool/missing')).toBe(true);
    window.history.replaceState(null, '', '/fr');
    expect(isStaticNotFoundPath('/fr')).toBe(false);
    expect(isStaticNotFoundPath('/fr/tool/notion')).toBe(false);
    expect(isStaticNotFoundPath('/fr/tool/missing')).toBe(true);
  });
  it('leaves ordinary prerendered and client-only pages under their existing router', async () => {
    window.history.replaceState(null, '', '/en/tool/notion');vi.resetModules();
    const { isStaticNotFoundPath } = await import('./staticHttpError');
    expect(isStaticNotFoundPath('/en/tool/notion')).toBe(false);
  });
});
