/**
 * Genere src/data/nativePrices.ts depuis src/data/pricing_truth.csv.
 *
 * Pourquoi un module TypeScript plutot qu'un import direct du CSV : le CSV est
 * lu via `?raw`, une syntaxe propre a Vite. Le prerendu (vite.config.ts) tourne
 * sous Node avant que l'application n'existe et ne sait pas la resoudre. Un
 * module TS s'importe des deux cotes, comme src/data/stacks.ts.
 *
 * Seules les lignes attestees sont retenues : une devise explicite et une date
 * de verification. Le reste du catalogue n'a pas de devise native connue, et on
 * ne la devine pas.
 */
import { readFile, writeFile } from "node:fs/promises";

const SOURCE = "src/data/pricing_truth.csv";
const OUTPUT = "src/data/nativePrices.ts";

function parseCsv(input) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i += 1; } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const [headers, ...rows] = parseCsv(await readFile(SOURCE, "utf8"));
const col = (name) => headers.indexOf(name);
const iId = col("id");
const iAmount = col("price_original");
const iCurrency = col("price_original_currency");
const iVerified = col("verified_on");
const iStatus = col("verification_status");

const entries = [];
let skipped = 0;
for (const row of rows) {
  const id = row[iId];
  const amount = Number(row[iAmount]);
  const currency = row[iCurrency];
  const verifiedOn = row[iVerified];
  if (!id || !Number.isFinite(amount) || amount <= 0) { skipped += 1; continue; }
  if (currency !== "EUR" && currency !== "USD" && currency !== "GBP") { skipped += 1; continue; }
  if (!verifiedOn) { skipped += 1; continue; }
  entries.push({ id, amount, currency, verifiedOn, status: row[iStatus] || "" });
}
entries.sort((a, b) => a.id.localeCompare(b.id));

const body = entries
  .map((e) => `  ${JSON.stringify(e.id)}: { amount: ${e.amount}, currency: "${e.currency}", verifiedOn: "${e.verifiedOn}" },`)
  .join("\n");

const out = `// Genere par scripts/gen-native-prices.mjs depuis src/data/pricing_truth.csv.
// Ne pas editer a la main : relancer le script apres avoir verifie un tarif.
//
// Chaque entree est un prix releve sur la page officielle de l'editeur, avec sa
// devise reelle et la date du releve. C'est la seule source de devise native
// consideree comme attestee.

export type NativePriceRecord = {
  amount: number;
  currency: "EUR" | "USD" | "GBP";
  verifiedOn: string;
};

export const NATIVE_PRICES: Record<string, NativePriceRecord> = {
${body}
};
`;

await writeFile(OUTPUT, out);
const byCurrency = entries.reduce((acc, e) => ({ ...acc, [e.currency]: (acc[e.currency] || 0) + 1 }), {});
console.log(`${OUTPUT} ecrit : ${entries.length} prix attestes (${JSON.stringify(byCurrency)}), ${skipped} ligne(s) ignoree(s)`);
