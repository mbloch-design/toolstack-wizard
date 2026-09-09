const cases = [
  ["http://tooltrim.com/fr/tool/notion/prix", "https://tooltrim.com/fr/tool/notion/prix", 1],
  ["https://www.tooltrim.com/fr/tool/notion/prix", "https://tooltrim.com/fr/tool/notion/prix", 1],
  ["https://tooltrim.com/fr/article/chatgpt-plus-utile", "https://tooltrim.com/fr/guide/chatgpt-plus-utile-ou-inutile", 1],
  ["https://tooltrim.com/fr/tool/anthropic", "https://tooltrim.com/fr/tool/claude", 1],
  ["https://tooltrim.com/fr/tool/motion-app", "https://tooltrim.com/fr/tool/motion", 1],
  ["https://tooltrim.com/en/tool/anchor-spotify", "https://tooltrim.com/en/tool/spotify-for-podcasters", 1],
  ["https://tooltrim.com/en/tool/notion/prix", "https://tooltrim.com/en/tool/notion/pricing", 1],
];

const failures = [];
for (const [start, expected, maxHops] of cases) {
  let current = start;
  const chain = [];
  for (let hop = 0; hop < 5; hop += 1) {
    const response = await fetch(current, { redirect: "manual", headers: { "user-agent": "ToolTrim-SEO-Validator/1.0" } });
    chain.push(`${response.status} ${current}`);
    if (response.status < 300 || response.status >= 400) {
      if (response.status !== 200) failures.push(`${start}: final status ${response.status}`);
      if (current !== expected) failures.push(`${start}: ended at ${current}, expected ${expected}`);
      break;
    }
    current = new URL(response.headers.get("location"), current).href;
  }
  const redirects = chain.filter((entry) => entry.startsWith("3")).length;
  if (redirects > maxHops) failures.push(`${start}: ${redirects} redirects (max ${maxHops})`);
  console.log(`${start} -> ${current} (${redirects} redirect${redirects === 1 ? "" : "s"})`);
}

if (failures.length) {
  console.error(`Production redirect validation failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`Production redirect validation PASS: ${cases.length} representative host, locale and legacy-route cases.`);
