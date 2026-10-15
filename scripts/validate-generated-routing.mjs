import fs from 'node:fs';
import path from 'node:path';
import { match, compile } from 'path-to-regexp';

const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const redirects = config.redirects.filter(rule => !rule.has).map(rule => ({
  match: match(rule.source), destination: compile(rule.destination, { encode: encodeURIComponent }),
}));
const rewrites = config.rewrites.map(rule => ({ match: match(rule.source), destination: rule.destination }));
const failures = [];
const results = [];
const dist = path.resolve('dist');
if (!fs.existsSync(path.join(dist, 'sitemap.xml'))) throw new Error('Missing generated sitemap. Build before validating routes.');

function resolveRoute(pathname) {
  for (const rule of redirects) {
    const found = rule.match(pathname);
    if (found) return { status: 308, destination: rule.destination(found.params) };
  }
  const file = path.join(dist, pathname, 'index.html');
  if (fs.existsSync(file)) return { status: 200, destination: pathname };
  const rewrite = rewrites.find(rule => rule.match(pathname));
  if (rewrite && fs.existsSync(path.join(dist, rewrite.destination))) return { status: 200, destination: rewrite.destination };
  return { status: 404, destination: '/404.html' };
}

const urls = [...fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
for (const url of urls) {
  const pathname = new URL(url).pathname;
  const result = resolveRoute(pathname);
  if (result.status !== 200 || result.destination !== pathname) failures.push(`${pathname}: sitemap route is redirected, rewritten or absent`);
}

// Derive every explicit App route family; select a valid generated slug for
// parameterized families, and check its direct-request path in both locales.
const appSource = fs.readFileSync('src/App.tsx', 'utf8');
const routes = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map(m => m[1]).filter(p => p !== '*' && p !== '/:lang');
for (const lang of ['fr', 'en']) {
  for (const route of routes) {
    let pathname = route.startsWith('/') ? route : `/${lang}/${route}`;
    const slug = pathname.includes('/category/') ? 'gestion-projet'
      : pathname.includes('/stacks/') ? fs.readdirSync(path.join(dist, lang, 'stacks'))[0]
      : /\/(guide|blog|article|story)\//.test(pathname) ? 'stack-redactrice-freelance' : 'notion';
    pathname = pathname.replace(':slugPair', 'notion-vs-coda').replace(':slug', slug).replace(/\/\*$/, '').replace(':lang', lang);
    let current = pathname;
    const chain = [];
    for (let hop = 0; hop < 5; hop++) {
      const result = resolveRoute(current);
      chain.push({ pathname: current, ...result });
      if (result.status !== 308) break;
      current = result.destination;
    }
    if (chain.at(-1).status !== 200) failures.push(`${pathname}: declared App route cannot reach a generated page or allowed client shell`);
    results.push({ route: pathname, chain });
  }
}
for (const file of ['404.html', 'client-only.html']) {
  const html = fs.readFileSync(path.join(dist, file), 'utf8');
  const robots = [...html.matchAll(/<meta\s+name="robots"\s+content="([^"]+)"/gi)].map(m => m[1]);
  if (robots.length !== 1 || !robots[0].includes('noindex')) failures.push(`${file}: requires exactly one noindex directive`);
  if (/<link\s+rel="(?:canonical|alternate)"/i.test(html)) failures.push(`${file}: must not inherit canonical or hreflang from the homepage`);
}
for (const pathname of ['/fr/r11-route-inexistante', '/en/tool/r11-inexistant', '/fr/guide/r11-inexistant', '/en/explorer/around/r11-inexistant']) {
  if (resolveRoute(pathname).status !== 404) failures.push(`${pathname}: unknown static document must reach the 404`);
}
const report = { measuredAt: new Date().toISOString(), sitemapUrls: urls.length, appRouteCases: results.length, failures, results };
if (process.env.R11_ROUTE_REPORT) fs.writeFileSync(process.env.R11_ROUTE_REPORT, JSON.stringify(report, null, 2));
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Generated routing PASS: ${urls.length} sitemap URLs, ${results.length} App route cases, explicit noindex shells and unknown-route 404 contract.`);
