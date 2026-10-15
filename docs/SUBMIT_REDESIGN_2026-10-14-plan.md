# Refonte conversion /submit — plan d'implémentation

**Objectif :** appliquer le design approuvé dans `docs/SUBMIT_REDESIGN_2026-10-14.md` au hero, au comparatif de formules et à la preuve sociale de `SubmitToolPage.tsx`, sans toucher au moteur fonctionnel du formulaire (brouillons, Creem, vérification badge) ni aux libellés de boutons couverts par `src/test/submit-payment.test.tsx`.

**Architecture :** modifications ciblées dans `src/pages/SubmitToolPage.tsx` (JSX du hero, nouvelle section preuve sociale, markup des cartes de formule) et `src/index.css` (nouvelles classes `sp-*` pour le contraste fort / carte sombre), plus une fonction utilitaire pure pour sélectionner des logos réels depuis `src/data/tools_index.json`.

**Tech Stack :** React 18 + TS + Vite, CSS `@layer components`.

---

### Task 1 : fonction utilitaire "preuve sociale"

**Files:**
- Create: `src/lib/submitProofTools.ts`
- Test: `src/test/submitProofTools.test.ts`

- [ ] **Step 1 — écrire le test**
```ts
import { describe, expect, it } from "vitest";
import { pickProofTools } from "@/lib/submitProofTools";
import toolsIndex from "@/data/tools_index.json";

describe("pickProofTools", () => {
  it("returns only tools present in the real catalogue, with a logo and a slug", () => {
    const picked = pickProofTools(toolsIndex as any[], 10);
    expect(picked.length).toBeGreaterThan(0);
    expect(picked.length).toBeLessThanOrEqual(10);
    for (const tool of picked) {
      expect(typeof tool.name).toBe("string");
      expect(typeof tool.slug).toBe("string");
      expect(tool.name.length).toBeGreaterThan(0);
    }
  });

  it("never invents a tool: every result is referenced by slug in the source index", () => {
    const picked = pickProofTools(toolsIndex as any[], 10);
    const slugs = new Set((toolsIndex as any[]).map((entry) => entry.slug));
    for (const tool of picked) expect(slugs.has(tool.slug)).toBe(true);
  });
});
```

- [ ] **Step 2 — lancer le test, vérifier qu'il échoue**
Run: `npx vitest run src/test/submitProofTools.test.ts`
Expected: FAIL — `Cannot find module '@/lib/submitProofTools'`

- [ ] **Step 3 — implémenter**
```ts
// src/lib/submitProofTools.ts
type ToolsIndexEntry = { name?: string; slug?: string; logo?: string };
export type ProofTool = { name: string; slug: string };

/** Deterministic, no randomness: same build always shows the same row. */
export function pickProofTools(index: ToolsIndexEntry[], limit: number): ProofTool[] {
  const seen = new Set<string>();
  const picked: ProofTool[] = [];
  for (const entry of index) {
    if (!entry?.slug || !entry?.name) continue;
    if (seen.has(entry.slug)) continue;
    seen.add(entry.slug);
    picked.push({ name: entry.name, slug: entry.slug });
    if (picked.length >= limit) break;
  }
  return picked;
}
```

- [ ] **Step 4 — relancer le test**
Run: `npx vitest run src/test/submitProofTools.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5 — commit**
```bash
git add src/lib/submitProofTools.ts src/test/submitProofTools.test.ts
git commit -m "feat(submit): add deterministic real-tool picker for the proof row" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2 : CSS — carte "Pro" sombre, CTA noir, rangée de logos

**Files:**
- Modify: `src/index.css` (ajouter à la fin du bloc `sp-*`, vers la ligne ~22450 selon le grep précédent)

- [ ] **Step 1 — ajouter les classes**
```css
.sp-proof-row {
  display: flex;
  gap: 28px;
  align-items: center;
  overflow-x: auto;
  padding: 20px 0 8px;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent);
  mask-image: linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent);
}
.sp-proof-row-label {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-meta);
  margin: 0 0 4px;
}
.sp-proof-logo {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.82;
}
.sp-proof-logo span {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.sp-plan-card--highlight {
  background: #1D1D1F;
  border-color: #1D1D1F;
  color: #F6F5F4;
}
.sp-plan-card--highlight .sp-plan-price,
.sp-plan-card--highlight .sp-plan-name,
.sp-plan-card--highlight .sp-plan-desc,
.sp-plan-card--highlight .sp-plan-args li { color: #F6F5F4; }
.sp-plan-card--highlight .sp-plan-period,
.sp-plan-card--highlight .sp-plan-args li svg { color: #A9A9A2; }
.sp-plan-card--highlight .sp-plan-tag { background: #F6F5F4; color: #1D1D1F; }
.sp-plan-card--highlight .sp-plan-cta { background: #F6F5F4; color: #1D1D1F; }
.sp-plan-card--highlight .sp-plan-cta:hover { background: #FFFFFF; }
.sp-hero-cta-secondary {
  display: block;
  margin-top: 10px;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--color-text-meta);
  text-decoration: underline;
  text-underline-offset: 3px;
}
```

- [ ] **Step 2 — commit**
```bash
git add src/index.css
git commit -m "feat(submit): add dark pro-card and proof-row styles" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3 : hero — CTA unique noir, lien secondaire discret

**Files:**
- Modify: `src/pages/SubmitToolPage.tsx:376-379`

- [ ] **Step 1 — remplacer le bloc d'actions du hero**

Remplacer :
```tsx
          <div className="sp-hero-actions">
            <button type="button" className="tt-button-primary" onClick={() => choosePlan("paid", "hero")}>{t(`Publier ma fiche · ${price}`, `Publish my listing · ${price}`)}<ArrowRight size={16} /></button>
            <a className="sp-text-link" href="#submit-plans-title">{t("Ou choisir la formule gratuite avec badge", "Or choose the free option with a badge")}<ArrowRight size={15} /></a>
          </div>
```
par :
```tsx
          <div className="sp-hero-actions">
            <button type="button" className="tt-button-primary" onClick={() => choosePlan("paid", "hero")}>{t(`Publier ma fiche · ${price}`, `Publish my listing · ${price}`)}<ArrowRight size={16} /></button>
            <a className="sp-hero-cta-secondary" href="#submit-plans-title">{t("Ou la formule gratuite avec badge", "Or the free option with a badge")}</a>
          </div>
```

Note : `tt-button-primary` reste la classe existante — sa couleur noire/CTA est déjà conforme à la doctrine du design system (vérifier au Step 3 qu'elle rend bien `#1D1D1F`, pas bleu ; sinon ajouter `.sp-hero-actions .tt-button-primary { background: #1D1D1F; border-color: #1D1D1F; }` dans Task 2).

- [ ] **Step 2 — build**
Run: `npm run build`
Expected: build réussi, pas d'erreur TS/lint.

- [ ] **Step 3 — vérification visuelle du CTA**
Dans le navigateur de prévisualisation (`/fr/submit`), zoomer sur le bouton hero : couleur de fond attendue `#1D1D1F` (noir), pas de bleu. Si bleu détecté, ajouter l'override CSS mentionné au Step 1.

- [ ] **Step 4 — commit**
```bash
git add src/pages/SubmitToolPage.tsx
git commit -m "feat(submit): single dominant hero CTA, free plan demoted to a text link" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4 : rangée de preuve sociale (logos réels)

**Files:**
- Modify: `src/pages/SubmitToolPage.tsx` (imports en haut, et insertion juste après le bloc `sp-pitch` dans le `header className="sp-hero"`)

- [ ] **Step 1 — importer**
```tsx
import ToolLogo from "@/components/ToolLogo";
import { pickProofTools } from "@/lib/submitProofTools";
import toolsIndexRaw from "@/data/tools_index.json";
```
(`ToolLogo` est déjà importé plus haut dans le fichier — ne pas dupliquer l'import, juste ajouter les deux nouvelles lignes.)

- [ ] **Step 2 — calculer la sélection** (dans le corps du composant, avant le `return`)
```tsx
  const proofTools = pickProofTools(toolsIndexRaw as { name?: string; slug?: string }[], 10);
```

- [ ] **Step 3 — insérer la section**, juste après la fermeture de `<div className="sp-pitch">...</div>` et avant `<div className="sp-proof-line">` :
```tsx
      {proofTools.length > 0 && <div className="sp-proof-row" aria-label={t("Outils déjà publiés sur ToolTrim", "Tools already published on ToolTrim")}>
        <div>
          <p className="sp-proof-row-label">{t("Déjà publiés sur ToolTrim", "Already published on ToolTrim")}</p>
          <div style={{ display: "flex", gap: "28px" }}>
            {proofTools.map((tool) => (
              <Link key={tool.slug} to={`${prefix}/tool/${tool.slug}`} className="sp-proof-logo">
                <ToolLogo tool={{ name: tool.name, slug: tool.slug }} size={28} />
                <span>{tool.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>}
```

- [ ] **Step 4 — build**
Run: `npm run build`
Expected: build réussi.

- [ ] **Step 5 — vérification visuelle**
Ouvrir `/fr/submit` en preview, confirmer que la rangée affiche de vrais logos (pas de carrés vides), défile horizontalement sur mobile (375px).

- [ ] **Step 6 — commit**
```bash
git add src/pages/SubmitToolPage.tsx
git commit -m "feat(submit): add real-tool social proof row below the hero" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5 : vérification de non-régression

- [ ] **Step 1 — lancer la suite de tests submit existante**
Run: `npx vitest run src/test/submit-payment.test.tsx src/test/submit/badgeVerification.spec.ts`
Expected: tous PASS (les libellés de boutons n'ont pas changé).

- [ ] **Step 2 — vérification navigateur complète (desktop + mobile)**
Suivre le workflow de vérification standard : recharger `/fr/submit`, `read_console_messages` (pas d'erreur), `read_page` pour confirmer la hiérarchie, `resize_window` 375px pour le mobile, screenshot desktop + mobile.

- [ ] **Step 3 — build de production**
Run: `npm run build`
Expected: PASS, prerender inclus.

---

### Task 6 : mise à jour du changelog

**Files:**
- Modify: `docs/CHANGELOG_AI.md` (ajouter une entrée datée)
- Modify: `docs/TODO.md` (si un chantier /submit y est déjà référencé, le clore ou l'actualiser)

- [ ] **Step 1 — ajouter l'entrée et commit**
```bash
git add docs/CHANGELOG_AI.md docs/TODO.md
git commit -m "docs: log /submit conversion redesign" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
