import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

// Read-only lab measurement. No backend writes; saved selections are fictional
// and confined to disposable contexts. Do not persist headers or response bodies.
const base = process.env.CATALOG_MEASURE_BASE || 'https://tooltrim.com';
const output = resolve(process.env.CATALOG_MEASURE_OUTPUT || 'output/tooltrim-catalog-loading-2026-10-08');
const repeats = Number(process.env.CATALOG_MEASURE_REPEATS || 3);
if (!Number.isInteger(repeats) || repeats < 1 || repeats > 10) throw new Error('CATALOG_MEASURE_REPEATS must be an integer from 1 to 10');
const cases = [
  { name: 'fiche-fr', path: '/fr/tool/notion', action: 'tool' },
  { name: 'listing-fr', path: '/fr/tools', action: 'listing' },
  { name: 'category-fr', path: '/fr/category/communication', action: 'category' },
  { name: 'stack-empty-fr', path: '/fr/ma-stack', action: 'empty' },
  { name: 'stack-saved-fr', path: '/fr/ma-stack', action: 'saved' },
];
const slugs = ['figma', 'canva', 'slack', 'notion'];
const saved = JSON.stringify({ version: 3, needs: [], pinnedToolSlugs: slugs,
  toolEntries: slugs.map(toolSlug => ({ toolSlug, needIds: [], intent: 'stack', assignmentMode: 'auto', addedAt: '2026-10-08T00:00:00.000Z' })) });
const safeUrl = value => { const u = new URL(value); return u.origin + u.pathname; };
const group = url => /supabase\.co\/rest\/v1\/tools$/.test(url) ? 'remote-tools'
  : /supabase\.co\/rest\/v1\//.test(url) ? 'remote-other'
  : /\/assets\/tool-catalog\//.test(url) ? 'tool-shard'
  : /\/assets\/stack-catalog\//.test(url) ? 'stack-shard'
  : /\/assets\/tools_v4-/.test(url) ? 'full-tools'
  : /\/assets\/data-tool-index-/.test(url) ? 'tool-summary-index'
  : /\/assets\/data-category-index-/.test(url) ? 'category-index'
  : /\/assets\/data-stack-index-/.test(url) ? 'stack-index'
  : /\/assets\/catalog-shared-/.test(url) ? 'catalog-helpers'
  : /\/assets\/useSupabaseData-/.test(url) ? 'summary-and-hooks-js'
  : /\/assets\/data-posts-(fr|en)-/.test(url) ? 'posts-js'
  : 'other';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const profile of ['desktop', 'mobile-cpu4']) for (const scenario of cases) for (let sample = 0; sample < repeats; sample++) {
    const context = await browser.newContext({ viewport: { width: profile === 'desktop' ? 1440 : 390, height: 1000 } });
    await context.addInitScript(({ saved, useSaved }) => {
      localStorage.setItem('tooltrim-analytics-consent', 'refused');
      if (useSaved && !localStorage.getItem('tooltrim-ma-stack-mvp-v3')) localStorage.setItem('tooltrim-ma-stack-mvp-v3', saved);
      window.__catalogLongTasks = [];
      new PerformanceObserver(list => window.__catalogLongTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true });
    }, { saved, useSaved: scenario.action === 'saved' });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    if (profile !== 'desktop') await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let requests = new Map();
    let redirects = [];
    let errors = [];
    page.on('pageerror', e => errors.push(e.message));
    cdp.on('Network.requestWillBeSent', e => {
      if (e.redirectResponse) redirects.push({ url: safeUrl(e.redirectResponse.url), status: e.redirectResponse.status,
        transferredBytes: e.redirectResponse.encodedDataLength, group: group(safeUrl(e.redirectResponse.url)), type: e.type, redirect: true });
      requests.set(e.requestId, { url: safeUrl(e.request.url), group: group(safeUrl(e.request.url)), type: e.type,
        started: e.timestamp, decodedBodyBytes: 0,
        initiator: e.initiator.stack?.callFrames?.slice(0, 3).map(f => ({ url: f.url ? safeUrl(f.url) : '', line: f.lineNumber, function: f.functionName })) || [] });
    });
    cdp.on('Network.responseReceived', e => {
      const r = requests.get(e.requestId); if (!r) return;
      Object.assign(r, { status: e.response.status, responseAt: e.timestamp, fromDiskCache: !!e.response.fromDiskCache,
        fromServiceWorker: !!e.response.fromServiceWorker, encoding: e.response.headers['content-encoding'] || '',
        cacheControl: e.response.headers['cache-control'] || '' });
    });
    cdp.on('Network.dataReceived', e => { const r = requests.get(e.requestId); if (r) r.decodedBodyBytes += e.dataLength; });
    cdp.on('Network.loadingFinished', e => { const r = requests.get(e.requestId); if (r) Object.assign(r, { finished: e.timestamp, transferredBytes: e.encodedDataLength }); });
    cdp.on('Network.loadingFailed', e => { const r = requests.get(e.requestId); if (r) r.failure = e.errorText; });
    async function capture(cache) {
      requests = new Map(); redirects = []; errors = [];
      const navigationStarted = performance.now();
      await page.goto(base + scenario.path, { waitUntil: 'domcontentloaded' });
      const actionStartedMs = performance.now() - navigationStarted;
      let action;
      if (scenario.action === 'tool') {
        action = 'open-pricing-tab';
        await expect(page.locator('.td-tool-subnav')).toHaveClass(/td-reveal/);
        await page.locator('.td-tool-subnav a[href="/fr/tool/notion/prix"]').click();
        await expect(page.locator('.td-tool-subnav a[href="/fr/tool/notion/prix"]')).toHaveAttribute('aria-current', 'page');
      } else if (scenario.action === 'listing') {
        action = 'open-filter-panel';
        await page.locator('.tt-pill--more').click();
        await expect(page.locator('.tt-filter-panel')).toBeVisible();
      } else if (scenario.action === 'category') {
        action = 'open-filter-panel';
        await page.locator('.tt-pill--more').click();
        await expect(page.locator('.tt-filter-panel')).toBeVisible();
      } else if (scenario.action === 'empty') {
        action = 'search-notion';
        await page.locator('.ms-search input').fill('Notion');
        await expect(page.locator('.ms-results')).toContainText('Notion');
      } else {
        action = 'open-saved-tool-inspector';
        await expect(page.locator('.ms-tool')).toHaveCount(4);
        await page.locator('.ms-tool').filter({ has: page.locator('.ms-card-id strong', { hasText: 'Figma' }) }).click();
        await expect(page.locator('.ms-tool-sheet')).toBeVisible();
      }
      const actionDoneMs = performance.now() - navigationStarted;
      const documentRequests = [...requests.values()].filter(r => r.type === 'Document');
      if (documentRequests.length !== 1) throw new Error(`Unexpected document navigation: ${scenario.name}, ${documentRequests.length} requests`);
      // Bounded observation includes background refreshes and lazy detail loads.
      await page.waitForTimeout(4000);
      const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return { observedUntilMs: performance.now(), domContentLoadedMs: nav.domContentLoadedEventEnd,
          documentResponseEndMs: nav.responseEnd, longTasks: window.__catalogLongTasks,
          resourceTiming: performance.getEntriesByType('resource').filter(e => /tool-catalog|stack-catalog|tools_v4|useSupabaseData|data-tool-index|data-stack-index|data-category-index|catalog-shared|data-posts-|supabase.co.*rest\/v1\/tools/.test(e.name)).map(e => ({ url: new URL(e.name).origin + new URL(e.name).pathname, startTime: e.startTime, responseEnd: e.responseEnd, transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, decodedBodySize: e.decodedBodySize })) };
      });
      const resources = [...redirects, ...[...requests.values()].map(r => ({ ...r, elapsedMs: r.finished ? (r.finished - r.started) * 1000 : null }))];
      const catalogFailures = resources.filter(r => r.group !== 'other' && (r.failure || r.status >= 400)).map(r => ({ url: r.url, status: r.status, failure: r.failure }));
      const unfinishedCatalogRequests = resources.filter(r => r.group !== 'other' && !r.redirect && !r.failure && r.finished == null).map(r => r.url);
      const result = { scenario: scenario.name, route: scenario.path, profile, sample, cache, action,
        actionStartedMs, actionDoneMs, actionElapsedMs: actionDoneMs - actionStartedMs, ...metrics,
        documentRequests: documentRequests.length,
        catalogFailures, unfinishedCatalogRequests,
        savedStateUnchanged: scenario.action !== 'saved' || await page.evaluate(() => localStorage.getItem('tooltrim-ma-stack-mvp-v3')) === saved,
        errors, resources };
      results.push(result);
      await writeFile(resolve(output, 'measurements.json'), JSON.stringify({ complete: false, measuredAt: new Date().toISOString(), base, browser: browser.version(), repeats, networkThrottling: false, results }, null, 2) + '\n');
      console.log(JSON.stringify({ scenario: result.scenario, profile, sample, cache, readyMs: Math.round(actionDoneMs), errors: errors.length, resources: resources.length,
        catalog: resources.filter(r => r.group !== 'other').map(r => ({ group: r.group, bytes: r.transferredBytes, status: r.status })) }));
    }
    try {
      await capture('cold');
      if (profile === 'desktop' && sample === 0 && scenario.action !== 'category') await capture('warm-same-context');
    } finally { await context.close(); }
  }
  await writeFile(resolve(output, 'measurements.json'), JSON.stringify({ complete: true, measuredAt: new Date().toISOString(), base, browser: browser.version(), repeats, networkThrottling: false, results }, null, 2) + '\n');
} finally { await browser.close(); }
