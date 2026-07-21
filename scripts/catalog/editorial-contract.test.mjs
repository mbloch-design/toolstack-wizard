import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateEditorial } from "./editorial-contract.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const good = () => JSON.parse(readFileSync(path.join(ROOT, "research", "tool-pages", "n8n.json"), "utf8")).editorial_drafts;

describe("editorial-contract — validateur", () => {
  it("accepte les éditoriaux research réels (fixtures)", () => {
    for (const s of ["n8n", "contra", "framer", "squarespace", "angular-material"]) {
      const d = JSON.parse(readFileSync(path.join(ROOT, "research", "tool-pages", `${s}.json`), "utf8")).editorial_drafts;
      expect(validateEditorial(d, { slug: s }).ok).toBe(true);
    }
  });

  it("rejette editorial absent", () => {
    expect(validateEditorial(null).ok).toBe(false);
  });

  it("rejette un montant/devise dans la prose", () => {
    const d = good(); d.fr.short_description = "Un outil à 20€/mois pour tester.";
    const r = validateEditorial(d); expect(r.ok).toBe(false); expect(r.errors.join(" ")).toMatch(/montant\/devise dans la prose/);
  });

  it("rejette un fait tarifaire dans pricing_guidance", () => {
    const d = good(); d.fr.pricing_guidance = { ...d.fr.pricing_guidance, native_amount: 20 };
    expect(validateEditorial(d).errors.join(" ")).toMatch(/pricing_guidance/);
  });

  it("rejette status != draft ou reviewed_by présent", () => {
    const d = good(); d.status = "published";
    expect(validateEditorial(d).errors.join(" ")).toMatch(/status/);
    const d2 = good(); d2.fr.reviewed_by = "ToolTrim — Mike";
    expect(validateEditorial(d2).errors.join(" ")).toMatch(/reviewed_by/);
  });

  it("rejette un champ obligatoire manquant et <3 pros", () => {
    const d = good(); d.en.verdict = null; d.fr.pros = ["un seul"];
    const r = validateEditorial(d); expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/en\.verdict manquant/);
    expect(r.errors.join(" ")).toMatch(/fr\.pros < 3/);
  });

  it("rejette une chaîne placeholder", () => {
    const d = good(); d.fr.long_description = "TODO: à rédiger. ".repeat(10);
    expect(validateEditorial(d).errors.join(" ")).toMatch(/placeholder/);
  });
});
