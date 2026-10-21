import { expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { JSDOM, ResourceLoader } from 'jsdom';
import { isSensitiveAnalyticsUrl } from '../src/lib/analyticsPrivacy.ts';
const html = await readFile('index.html', 'utf8');
async function boot(url, referrer = 'https://tooltrim.com/en/tools') {
 const loads = [], payloads = [];
 class LocalFakeTracker extends ResourceLoader {
  fetch(url) {
   loads.push(url);
   if (!url.startsWith('https://datafa.st/')) return null;
   return Promise.resolve(Buffer.from(`window.fakePayloads.push({href:location.href,referrer:document.referrer}); sessionStorage.setItem('fake-tracker-url',location.href);`));
  }
 }
 const dom = new JSDOM(html, { url, referrer, runScripts: 'dangerously', resources: new LocalFakeTracker(), beforeParse(window) { window.fakePayloads = payloads; } });
 await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
 const result = { loads, payloads, storage: JSON.stringify({ ...dom.window.sessionStorage, ...dom.window.localStorage }), href: dom.window.location.href, blocked: dom.window.__tooltrimAnalyticsPrivateDocument };
 expect(result.blocked).toBe(isSensitiveAnalyticsUrl(url, true) || isSensitiveAnalyticsUrl(referrer, true));
 dom.window.close(); return result;
}
it.each(['/fr/connexion', '/fr/inscription', '/fr/connexion/retour', '/fr/compte/reinitialiser', '/fr/compte/parametres', '/en/sign-in', '/en/sign-up', '/en/sign-in/callback', '/en/account/reset-password', '/en/account/settings'])('omits raw tracker before it can read private initial document %s', async route => {
 const result = await boot('https://tooltrim.com' + route + '?returnTo=fixture-nested-secret#access_token=fixture-secret&refresh_token=fixture-refresh');
 expect(result.loads.some(url => url.startsWith('https://datafa.st/'))).toBe(false);
 expect(result.payloads).toEqual([]); expect(result.storage).not.toContain('fixture');
 expect(result.href).toContain('access_token=fixture-secret'); // SDK transport is untouched.
});
it.each(['?ACCESS_TOKEN=fixture-secret', '?PaSsWoRd=fixture-secret', '?provider_token=fixture-secret', '#access_token=fixture-secret'])('omits tracker on public transport URL %s', async transport => {
 const result = await boot('https://tooltrim.com/en/tool/notion' + transport);
 expect(result.payloads).toEqual([]); expect(result.storage).not.toContain('fixture');
});
it('omits tracker when an initial referrer contains private transport', async () => {
 const result = await boot('https://tooltrim.com/en/tool/notion', 'https://tooltrim.com/en/sign-in/callback?code=fixture-referrer-secret');
 expect(result.payloads).toEqual([]); expect(result.storage).not.toContain('fixture');
});
it('continues to load the public tracker on ordinary public documents with campaign parameters', async () => {
 const result = await boot('https://tooltrim.com/en/tool/notion?utm_campaign=public');
 expect(result.loads.filter(url => url.startsWith('https://datafa.st/'))).toHaveLength(1);
 expect(result.payloads).toEqual([{ href: 'https://tooltrim.com/en/tool/notion?utm_campaign=public', referrer: 'https://tooltrim.com/en/tools' }]);
});
