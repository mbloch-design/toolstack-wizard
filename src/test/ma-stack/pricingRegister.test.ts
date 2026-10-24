import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Guard of the repository price register (src/data/pricing_truth.csv), the
 * Supabase-independent source of attested entry prices. A row is only
 * accepted if it can be traced back to the vendor: official https source,
 * verification date, a real currency (never a converted amount) and the
 * vendor's own billing period.
 */
function rows() {
  const text = readFileSync(path.resolve("src/data/pricing_truth.csv"), "utf8");
  const parsed: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i += 1; } else quoted = !quoted; }
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell); if (row.some(Boolean)) parsed.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); parsed.push(row); }
  const [headers, ...body] = parsed;
  return body.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

describe("price register", () => {
  const register = rows();

  it("has one row per tool", () => {
    const ids = register.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(register.map((row) => [row.id, row] as const))("%s is traceable to the vendor", (_id, row) => {
    expect(row.source_url).toMatch(/^https:\/\//);
    expect(row.verified_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(["EUR", "USD", "GBP"]).toContain(row.price_original_currency);
    expect(["monthly_public", "annual_public", "one_time", "once"]).toContain(row.price_original_period);
    // 0 is a real answer (free core, per-transaction pricing), not a gap.
    expect(Number(row.price_original)).toBeGreaterThanOrEqual(0);
  });
});
