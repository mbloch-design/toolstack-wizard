import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => readFile(path.join(ROOT, ...parts), "utf8");

describe("contrat projection — union réelle des consommateurs actifs", () => {
  it("couvre les trois blocs éditoriaux effectivement consommés", async () => {
    const [detail, aiBlock, costBlock, a1, a5] = await Promise.all([
      read("src", "pages", "ToolDetailPage.tsx"),
      read("src", "components", "tool", "ToolAiBlock.tsx"),
      read("src", "components", "tool", "ToolCostBreakdownTable.tsx"),
      read("docs", "tool-catalog-migration", "contract-v3", "A1-contrat-canonique.sql.md"),
      read("docs", "tool-catalog-migration", "contract-v3", "A5-projection-publique.sql.md"),
    ]);
    expect(detail).toContain("gallery_images");
    expect(aiBlock).toMatch(/aiAngle/);
    expect(costBlock).toMatch(/costTable/);
    for (const column of ["gallery_images", "ai_angle", "pricing_guidance"]) {
      expect(a1).toMatch(new RegExp(`\\b${column}\\s+jsonb\\b`));
      expect(a5).toMatch(new RegExp(`\\bas ${column}\\b`));
    }
  });

  it("garde les faits de prix hors de pricing_guidance", async () => {
    const a5 = await read("docs", "tool-catalog-migration", "contract-v3", "A5-projection-publique.sql.md");
    const start = a5.indexOf("jsonb_strip_nulls(jsonb_build_object(");
    const end = a5.indexOf("end as pricing_guidance", start);
    const guidance = a5.slice(start, end);
    expect(guidance).toContain("'costTable'");
    expect(guidance).toContain("'usage_sensitive'");
    for (const factual of ["compare_price_monthly_eur", "official_source_url", "verified_on", "native_amount", "native_currency"]) {
      expect(guidance).not.toContain(`'${factual}'`);
    }
  });

  it("expose la première observation et la dernière reconfirmation", async () => {
    const [a4, a5] = await Promise.all([
      read("docs", "tool-catalog-migration", "contract-v3", "A4-regle-selection-prix.sql.md"),
      read("docs", "tool-catalog-migration", "contract-v3", "A5-projection-publique.sql.md"),
    ]);
    expect(a4).toMatch(/observed_on date, last_confirmed_on date/);
    expect(a4).toContain("pk.observed_on, pk.last_confirmed_on");
    expect(a5).toContain("as price_observed_on");
    expect(a5).toContain("as price_last_confirmed_on");
  });

  it("documente la compatibilité des relations sans les dupliquer", async () => {
    const a5 = await read("docs", "tool-catalog-migration", "contract-v3", "A5-projection-publique.sql.md");
    expect(a5).toMatch(/dérive aussi `relations`, `complements` et `integrates_with` depuis `relationships`/);
    expect(a5).toMatch(/aucune seconde relation n'est stockée en base/);
  });

  it("interdit une bascule canonical sans contenu FR/EN publié", async () => {
    const a1 = await read("docs", "tool-catalog-migration", "contract-v3", "A1-contrat-canonique.sql.md");
    expect(a1).toContain("validate_canonical_switch");
    expect(a1).toMatch(/count\(distinct ec\.lang\)[\s\S]*<> 2/);
    expect(a1).toContain("canonical switch requires published FR and EN editorial content");
    expect(a1).toContain("canonical switch requires one compare plan");
  });

  it("rend explicites les droits nécessaires au pipeline et aux vues sous RLS", async () => {
    const a1 = await read("docs", "tool-catalog-migration", "contract-v3", "A1-contrat-canonique.sql.md");
    expect(a1).toContain("grant select on public.tools to service_role");
    expect(a1).toContain("create policy catalog_owner_projection_read on public.tools");
    expect(a1).toContain("for select to catalog_owner using (content_status='published')");
  });

  it("le catalogue réel justifie la guidance canonique", async () => {
    const tools = JSON.parse(await read("src", "data", "tools_v4.json"));
    const guidanceKeys = [
      "billing_options", "cautions", "costTable", "costTableNoteFr", "costTableNoteEn",
      "minSeats", "price_reliability", "tcoExampleFr", "tcoExampleEn", "usage_sensitive",
    ];
    const count = tools.filter((tool) => guidanceKeys.some((key) => tool.pricing_v5?.[key] != null)).length;
    expect(count).toBeGreaterThan(0);
    expect(tools.some((tool) => tool.aiAngle != null || tool.seo?.aiAngle != null)).toBe(true);
  });
});
