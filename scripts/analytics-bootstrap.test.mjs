import { expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { JSDOM, ResourceLoader, VirtualConsole } from 'jsdom';
import { isSensitiveAnalyticsUrl } from '../src/lib/analyticsPrivacy.ts';
const html = await readFile('index.html', 'utf8');
async function boot(url, referrer = 'https://tooltrim.com/en/tools', bootstrap = 'ok') {
 const loads = [], payloads = [];
 class LocalBootstrap extends ResourceLoader {
  fetch(url) {
   loads.push(url);
   if (new URL(url).pathname === '/analytics-bootstrap.js') {
    if (bootstrap === 'missing') return null;
    return Promise.resolve(bootstrap === 'broken' ? Buffer.from('throw new Error("fixture bootstrap failed");') : readFileSync('public/analytics-bootstrap.js'));
   }
   // Any unexpected third-party injection is recorded and never executed.
   return null;
  }
 }
 const dom = new JSDOM(html, { url, referrer, runScripts: 'dangerously', resources: new LocalBootstrap(), virtualConsole: new VirtualConsole(), beforeParse(window) { window.fakePayloads = payloads; } });
 await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
 const result = { loads, payloads, storage: JSON.stringify({ ...dom.window.sessionStorage, ...dom.window.localStorage }), href: dom.window.location.href, blocked: dom.window.__tooltrimAnalyticsPrivateDocument };
 if (bootstrap === 'ok') expect(result.blocked).toBe(isSensitiveAnalyticsUrl(url, true) || isSensitiveAnalyticsUrl(referrer, true));
 dom.window.close(); return result;
}
it.each(['/fr/connexion', '/fr/inscription', '/fr/connexion/retour', '/fr/compte/reinitialiser', '/fr/compte/parametres', '/en/sign-in', '/en/sign-up', '/en/sign-in/callback', '/en/account/reset-password', '/en/account/settings'])('omits raw tracker before it can read private initial document %s', async route => {
 const result = await boot('https://tooltrim.com' + route + '?returnTo=fixture-nested-secret#access_token=fixture-secret&refresh_token=fixture-refresh');
 expect(result.loads.filter(url => new URL(url).pathname.endsWith('.js')).every(url => new URL(url).origin === 'https://tooltrim.com')).toBe(true);
 expect(result.blocked).toBe(true);
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
it('explicitly clears the privacy latch on ordinary public documents without injecting trackers', async () => {
 const result = await boot('https://tooltrim.com/en/tool/notion?utm_campaign=public');
 expect(result.blocked).toBe(false);
 expect(result.loads.filter(url => new URL(url).pathname.endsWith('.js')).every(url => new URL(url).origin === 'https://tooltrim.com')).toBe(true);
 expect(result.payloads).toEqual([]);
 expect(result.storage).toBe('{}');
});

it('loads the first-party privacy guard as the first script without third-party injection', async () => {
 const result = await boot('https://tooltrim.com/en/tool/notion');
 expect(result.loads.filter(url => new URL(url).pathname.endsWith('.js'))).toEqual(['https://tooltrim.com/analytics-bootstrap.js']);
});
it.each(['missing', 'broken'])('never loads a raw tracker if the external bootstrap is %s', async failure => {
 const result = await boot('https://tooltrim.com/en/tool/notion', 'https://tooltrim.com/en/tools', failure);
 expect(result.loads[0]).toBe('https://tooltrim.com/analytics-bootstrap.js');
 expect(result.payloads).toEqual([]); expect(result.storage).not.toContain('fake-tracker-url');
});
it('blocks following application execution until the delayed external guard has inspected the initial Auth URL', async () => {
 let release;
 class DelayedBootstrap extends ResourceLoader {
  fetch(url) {
   if (new URL(url).pathname !== '/analytics-bootstrap.js') return null;
   return new Promise(resolve => { release = () => resolve(readFileSync('public/analytics-bootstrap.js')); });
  }
 }
 // A following classic probe represents application execution; unlike JSDOM modules it actually runs.
 const probedHtml = html.replace(/(<script\b[^>]*>[\s\S]*?<\/script>)/i, '$1<script>window.appLatch = window.__tooltrimAnalyticsPrivateDocument;window.applicationStarted = true;history.replaceState({}, "", "/en/tool/notion");</script>');
 const dom = new JSDOM(probedHtml, { url: 'https://tooltrim.com/en/sign-in/callback#access_token=fixture-secret', runScripts: 'dangerously', resources: new DelayedBootstrap(), virtualConsole: new VirtualConsole() });
 try {
  const loaded = new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  expect(dom.window.applicationStarted).toBeUndefined();
  expect(dom.window.location.hash).toContain('fixture-secret');
  release(); await loaded;
  expect(dom.window.applicationStarted).toBe(true); expect(dom.window.appLatch).toBe(true);
  expect(dom.window.__tooltrimAnalyticsPrivateDocument).toBe(true); expect(dom.window.location.pathname).toBe('/en/tool/notion');
 } finally { release?.(); dom.window.close(); }
});

it('keeps the private latch true if initial referrer inspection throws', async () => {
 const bootstrap = await readFile('public/analytics-bootstrap.js', 'utf8');
 const dom = new JSDOM('', { url: 'https://tooltrim.com/en/tool/notion', runScripts: 'outside-only' });
 try {
  Object.defineProperty(dom.window.document, 'referrer', { configurable: true, get() { throw new Error('fixture unavailable referrer'); } });
  dom.window.eval(bootstrap);
  expect(dom.window.__tooltrimAnalyticsPrivateDocument).toBe(true);
  expect(dom.window.document.querySelectorAll('script')).toHaveLength(0);
 } finally { dom.window.close(); }
});
