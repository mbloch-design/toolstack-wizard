import { expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

it("keeps dated prices with the vendor's own period and preserves whether the core offer is free", () => {
  const root = mkdtempSync(path.join(tmpdir(), "tooltrim-native-prices-"));
  try {
    mkdirSync(path.join(root, "src/data"), { recursive: true });
    writeFileSync(path.join(root, "src/data/pricing_truth.csv"), [
      "id,price_original,price_original_currency,verified_on,verification_status,price_original_period,free_core_available",
      "freemium,20,USD,2026-03-13,official_explicit,monthly_public,True",
      "paid,15,EUR,2026-03-13,official_explicit,monthly_public,False",
      "annual,240,USD,2026-03-13,official_explicit,annual_public,False",
      "once,100,EUR,2026-03-13,official_explicit,once,False",
      "unknown-period,10,USD,2026-03-13,official_explicit,,False",
      "undated,20,USD,,official_explicit,monthly_public,True",
      "unsupported,20,JPY,2026-03-13,official_explicit,monthly_public,True",
    ].join("\n"));
    const result = spawnSync(process.execPath, [path.resolve("scripts/gen-native-prices.mjs")], { cwd: root, encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    const compiled = transpileModule(readFileSync(path.join(root, "src/data/nativePrices.ts"), "utf8"), { compilerOptions: { module: ModuleKind.CommonJS } }).outputText;
    const exported: { NATIVE_PRICES?: unknown } = {};
    runInNewContext(compiled, { exports: exported });
    expect(exported.NATIVE_PRICES).toEqual({
      annual: { amount: 240, currency: "USD", period: "annual", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: true },
      freemium: { amount: 20, currency: "USD", period: "monthly", freeCoreAvailable: true, verifiedOn: "2026-03-13", official: true },
      once: { amount: 100, currency: "EUR", period: "once", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: true },
      paid: { amount: 15, currency: "EUR", period: "monthly", freeCoreAvailable: false, verifiedOn: "2026-03-13", official: true },
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
