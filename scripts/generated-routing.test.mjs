import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import { match } from 'path-to-regexp';
const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const rewriteFor = pathname => config.rewrites.find(rule => match(rule.source)(pathname))?.destination;
describe('generated route fallback contract',()=>{
 it('defines deployable response headers and marks private account routes noindex',()=>{
  for (const rule of config.headers) {
   for (const header of rule.headers) {
    expect(typeof header.key, `header name for ${rule.source}`).toBe('string');
    expect(typeof header.value, `header value for ${rule.source}`).toBe('string');
   }
  }
  const responseHeaders = pathname => config.headers.filter(rule => match(rule.source)(pathname)).flatMap(rule => rule.headers);
  for (const route of ['/fr/connexion', '/fr/inscription', '/fr/connexion/retour', '/fr/compte/reinitialiser', '/fr/compte/parametres', '/en/sign-in', '/en/sign-up', '/en/sign-in/callback', '/en/account/reset-password', '/en/account/settings']) {
   expect(responseHeaders(route)).toContainEqual({key:'X-Robots-Tag',value:'noindex, nofollow'});
  }
  expect(responseHeaders('/fr/tool/notion').some(header => header.key === 'X-Robots-Tag')).toBe(false);
 });
 it('serves only exact localized private account paths',()=>{
  for(const route of ['/fr/connexion', '/fr/inscription', '/fr/connexion/retour', '/fr/compte/reinitialiser', '/fr/compte/parametres', '/en/sign-in', '/en/sign-up', '/en/sign-in/callback', '/en/account/reset-password', '/en/account/settings']) expect(rewriteFor(route),route).toBe('/client-only.html');
  for(const route of ['/fr/compte/inconnu','/en/account/unknown','/en/connexion','/fr/sign-in','/fr/compte/parametres/extra']) expect(rewriteFor(route),route).toBeUndefined();
 });
 it('leaves unknown localized pages and missing catalogue documents to the static 404',()=>{
  for(const route of ['/fr/r11-route-inexistante','/en/r11-route-inexistante','/fr/tool/r11-inexistant','/en/guide/r11-inexistant','/fr/explorer/around/r11-inexistant','/en/tool/notion/faux','/fr/assets/missing.js']) expect(rewriteFor(route),route).toBeUndefined();
 });
 it('keeps search and private client routes usable without claiming to be the homepage',()=>{
  for(const route of ['/fr/search','/en/search','/fr/back-office','/en/back-office','/submit','/fr/comparatif/notion-vs-figma','/en/comparatif/canva-vs-photoshop-elements'])expect(rewriteFor(route),route).toBe('/client-only.html');
 });
 it('keeps host pages client rendered without the homepage canonical',()=>{
  for(const route of ['/fr/plugins/figma','/en/libraries/react','/fr/mcp/claude'])expect(rewriteFor(route),route).toBe('/client-only.html');
 });
 it('does not intercept prerendered routes or parameter variants',()=>{
  for(const route of ['/fr/tool/notion','/en/explorer/around/notion','/fr/tools','/en/submit','/fr/explorer','/en/ma-stack'])expect(rewriteFor(new URL(route+'?utm_source=test','https://tooltrim.com').pathname),route).toBeUndefined();
 });
 it('keeps direct cart aliases and localized outils redirects',()=>{
  for(const source of ['/:lang(fr|en)/cart','/:lang(fr|en)/panier','/:lang(fr|en)/v2','/:lang(fr|en)/outils/:slug'])expect(config.redirects.some(r=>r.source===source),source).toBe(true);
 });
});
