import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const origin=process.env.R11_ORIGIN||'http://127.0.0.1:8093';
const browser=await chromium.launch({headless:true});const results=[];
try{
 for(const route of ['/fr/r11-route-inexistante','/en/tool/r11-inexistant','/fr/guide/r11-inexistant','/en/explorer/around/r11-inexistant','/fr/search?q=notion','/en/search?q=notion','/fr/back-office','/en/back-office','/fr/tool/notion','/en/tool/notion/pricing','/fr/explorer/around/notion','/en/tools?utm_source=r11','/fr/guide/stack-redactrice-freelance','/en/guide/stack-freelance-writer','/fr/cart','/en/panier','/fr/outils/notion','/en/plugins/figma','/fr/comparatif/notion-vs-figma','/en/comparatif/canva-vs-photoshop-elements']){
  const context=await browser.newContext();await context.addInitScript(()=>localStorage.setItem('tooltrim-analytics-consent',JSON.stringify({version:1,choice:'refused',decidedAt:Date.now(),expiresAt:Date.now()+3600000})));
  await context.route(/supabase\.co/,r=>r.abort());await context.route(/google-analytics\.com|googletagmanager\.com|datafa\.st|_vercel\/insights/,r=>r.abort());
  const page=await context.newPage();const response=await page.goto(origin+route,{waitUntil:'domcontentloaded'});await page.locator(/\/(search|back-office)(\?|$)/.test(route)?'main':'h1').first().waitFor();
  // Wait until React mount effects have replaced generic client-only metadata.
  if (!route.includes('r11-') && !route.includes('/back-office') && !route.includes('/comparatif/')) await page.waitForFunction(()=>!!document.querySelector('link[rel="canonical"]')&&document.title!=='ToolTrim');
  const data=await page.evaluate(()=>({pathname:location.pathname,title:document.title,canonical:[...document.querySelectorAll('link[rel="canonical"]')].map(x=>x.href),robots:[...document.querySelectorAll('meta[name="robots"]')].map(x=>x.content),hreflang:[...document.querySelectorAll('link[hreflang]')].map(x=>({lang:x.hreflang,href:x.href})),h1:document.querySelector('h1')?.textContent,description:document.querySelector('meta[name="description"]')?.content,jsonLd:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent))}));
  const missing=route.includes('r11-inexistant')||route.includes('r11-route-inexistante');const noindex=missing||/\/(search|back-office)(\?|$)/.test(route)||route.includes('utm_source')||route.includes('/comparatif/');
  assert.equal(response.status(),missing?404:200,route);if(noindex)assert(data.robots.some(x=>x.includes('noindex')),route+' noindex');
  else if(!route.includes('/plugins/') && !route.includes('/back-office')){assert.equal(data.canonical.length,1,route);assert.equal(data.canonical[0],'https://tooltrim.com'+data.pathname,route);}
  if(route.includes('/guide/stack-'))assert(data.description?.length>20,route+' description');
  results.push({route,status:response.status(),...data,jsonLd:data.jsonLd.length});await context.close();
 }
 fs.writeFileSync('docs/proofs/r11-indexation-2026-10-15/browser-check.json',JSON.stringify({measuredAt:new Date().toISOString(),origin,kind:'local Vercel routing simulation plus real Chromium hydration',results},null,2));console.log(`PASS ${results.length} route checks with real Chromium hydration`);
} finally {await browser.close();}
