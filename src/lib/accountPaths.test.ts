import { afterEach, describe, expect, it, vi } from 'vitest';
import { accountPath, safeAccountReturnTo } from './accountPaths';

describe('account navigation', () => {
  it('maps the two exact localized account route families', () => {
    expect(['signin', 'signup', 'callback', 'reset', 'settings'].map(kind => accountPath('fr', kind as Parameters<typeof accountPath>[1]))).toEqual(['/fr/connexion', '/fr/inscription', '/fr/connexion/retour', '/fr/compte/reinitialiser', '/fr/compte/parametres']);
    expect(['signin', 'signup', 'callback', 'reset', 'settings'].map(kind => accountPath('en', kind as Parameters<typeof accountPath>[1]))).toEqual(['/en/sign-in', '/en/sign-up', '/en/sign-in/callback', '/en/account/reset-password', '/en/account/settings']);
  });
  it.each(['https://evil.invalid/fr/tools', '//evil.invalid/fr/tools', '/fr/unknown', '/fr/connexion/retour?code=secret', '/en/account/reset-password', '/fr/compte/reinitialiser', '/fr/tools\\evil', '/fr/%2e%2e/unknown'])('rejects unsafe or looping return %s', input => {
    expect(safeAccountReturnTo(input, 'fr', 'https://tooltrim.test')).toBe('/fr/ma-stack');
  });
  it('keeps known same-origin content and removes auth transport even mixed with navigation state', () => {
    expect(safeAccountReturnTo('https://tooltrim.test/en/tool/notion?tab=plans&code=secret&access_token=secret&refresh_token=secret&type=recovery#access_token=secret', 'fr', 'https://tooltrim.test')).toBe('/en/tool/notion?tab=plans');
    expect(safeAccountReturnTo('/fr/tools?category=design#results', 'en', 'https://tooltrim.test')).toBe('/fr/tools?category=design#results');
    expect(safeAccountReturnTo('/en/account/settings', 'en', 'https://tooltrim.test')).toBe('/en/account/settings');
  });
});

afterEach(() => vi.unstubAllEnvs());
it('keeps provider flags disabled unless explicitly true', async () => {
  for (const value of ['', 'false', '1', 'TRUE', 'true']) {
    vi.resetModules(); vi.stubEnv('VITE_ACCOUNT_GOOGLE_ENABLED', value); vi.stubEnv('VITE_ACCOUNT_GITHUB_ENABLED', value);
    const flags = await import('../config/features');
    expect(flags.ACCOUNT_GOOGLE_ENABLED).toBe(value === 'true'); expect(flags.ACCOUNT_GITHUB_ENABLED).toBe(value === 'true');
  }
});
