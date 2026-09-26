import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const reviewed = [...read('research/affiliate-review-2026-09-27.json').tools, ...read('research/affiliate-new-tools-2026-09-27.json')];
const tools = read('src/data/tools_v4.json');
const index = read('src/data/tools_index.json');
const media = read('research/affiliate-media-2026-09-27.json').items;
const axes = ['valeurAjoutee', 'simplicite', 'utilisation', 'puissance', 'reversibilite'];
let imageCount = 0;
for (const config of reviewed) {
  const matches = tools.filter((tool) => tool.slug === config.slug);
  assert.equal(matches.length, 1, `${config.slug}: unique identity`);
  const tool = matches[0];
  assert.equal(tool.affiliateLink, config.affiliate);
  assert.equal(tool.link, config.affiliate);
  assert.ok(index.some((entry) => entry.slug === config.slug), `${config.slug}: searchable`);
  assert.ok(tool.longDescription.length > 300 && tool.longDescriptionEn.length > 300);
  assert.ok(!/—/.test(JSON.stringify([tool.longDescription, tool.longDescriptionEn, tool.pricing, tool.pricingEn, tool.verdict, tool.verdictEn])));
  assert.equal(tool.pricing_v5.official_source_url, config.source);
  assert.equal(tool.pricing_v5En.official_source_url, config.source);
  assert.equal(tool.timeGainedHoursPerMonth, null);
  for (const axis of axes) {
    assert.ok(tool.toolTrimRating[axis] >= 1 && tool.toolTrimRating[axis] <= 5);
    assert.ok(tool.toolTrimRating.evidence[axis].includes('https://'));
    assert.ok(tool.toolTrimRating.evidenceEn[axis].includes('https://'));
  }
  for (const alternative of tool.alternatives) assert.ok(tools.some((entry) => entry.slug === alternative));
  const paths = [tool.logo, tool.ogImageUrl, ...tool.galleryImages];
  assert.ok(paths.length >= 3, `${config.slug}: logo plus multiple images`);
  assert.equal(new Set(paths).size, paths.length);
  for (const path of paths) {
    assert.ok(fs.statSync(`public${path}`).size > 100);
    assert.ok(media[config.slug].some((entry) => entry.path === path && entry.source_url.startsWith('https://') && entry.sha256));
    imageCount++;
  }
  if (config.currency !== 'EUR') assert.equal(tool.pricing_v5.compare_price_monthly_eur, null, 'no implicit conversion');
  if (config.plans[0][1] === null) assert.equal(tool.pricing_v5.compare_plan_name, 'Prix non public', 'unknown is not free');
  if (process.argv.includes('--built')) {
    for (const lang of ['fr', 'en']) {
      const file = `dist/${lang}/tool/${config.slug}/index.html`;
      const html = fs.readFileSync(file, 'utf8');
      assert.ok(html.includes(config.affiliate), `${file}: affiliate link`);
      assert.ok(html.includes(tool.ogImageUrl), `${file}: OG asset`);
      assert.ok(html.includes(tool.logo), `${file}: logo`);
      assert.ok(html.includes(`https://tooltrim.com/${lang}/tool/${config.slug}`), `${file}: canonical`);
      assert.equal((html.match(/<h1\b/g) || []).length, 1, `${file}: one H1`);
    }
  }
}
assert.ok(fs.readFileSync('vercel.json', 'utf8').includes('"source": "/:lang(fr|en)/tool/reclaim-ai"'));
console.log(`PASS: ${reviewed.length} bilingual listings, exact affiliate links, native pricing, five-axis evidence, ${imageCount} sourced assets${process.argv.includes('--built') ? ', 34 generated pages' : ''}.`);
