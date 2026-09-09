import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "dist");
const failures = [];
const titles = new Set();
let audited = 0;

for (const lang of ["fr", "en"]) {
  const familyRoot = path.join(root, lang, "explorer", "around");
  if (!fs.existsSync(familyRoot)) continue;
  for (const slug of fs.readdirSync(familyRoot)) {
    const file = path.join(familyRoot, slug, "index.html");
    if (!fs.existsSync(file)) continue;
    audited += 1;
    const html = fs.readFileSync(file, "utf8");
    const url = `https://tooltrim.com/${lang}/explorer/around/${slug}`;
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim();
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    const related = new Set(
      [...html.matchAll(new RegExp(`href="/${lang}/explorer/around/([^"?#]+)`, "g"))].map((match) => match[1]),
    );
    const rootStart = html.indexOf('<div id="root">');
    const payloadStart = html.indexOf('<script id="__SSR', rootStart);
    const rootMarkup = rootStart >= 0
      ? html.slice(rootStart, payloadStart >= 0 ? payloadStart : html.indexOf("</body>", rootStart))
      : "";
    const visibleText = rootMarkup
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!title || titles.has(`${lang}:${title}`)) failures.push(`${url}: missing or duplicate title`);
    if (title) titles.add(`${lang}:${title}`);
    if (canonical !== url) failures.push(`${url}: canonical mismatch`);
    if (h1Count !== 1) failures.push(`${url}: expected one H1, got ${h1Count}`);
    if (visibleText.length < 800) failures.push(`${url}: thin SSR text (${visibleText.length} characters)`);
    if (related.size < 3) failures.push(`${url}: fewer than 3 crawlable related-tool paths`);
  }
}

if (failures.length) {
  console.error(`Explorer SEO audit failed: ${failures.length} issue(s) across ${audited} pages.`);
  failures.slice(0, 50).forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Explorer SEO audit PASS: ${audited} pages have unique titles, self-canonicals, one H1, substantial SSR text and crawlable related paths.`);
