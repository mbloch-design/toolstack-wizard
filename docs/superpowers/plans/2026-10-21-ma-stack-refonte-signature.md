# Refonte Ma Stack, direction Signature + Decision Engine : plan d'implémentation

> **Pour l'agent qui exécute :** suivre superpowers:executing-plans (ou subagent-driven-development), tâche par tâche, cases à cocher. Branche `design/ma-stack-refonte`, worktree `/Users/mike/toolstack-worktrees/ms-refonte`. Aucun push ni merge sans validation de Michael.

**Objectif :** remplacer le hero de Ma Stack par un diagnostic (phrase-verdict + file des prochaines décisions) posé sur l'identité ToolTrim (panneau crème, carte des outils par domaine, trait de coupe entre outils qui se recoupent), sans perdre aucune fonction, donnée, traduction ni interaction.

**Architecture :** la logique du verdict et de la file sort de `CartPage.tsx` dans une fonction pure testée (`src/lib/stackDiagnosis.ts`). Deux composants de présentation la consomment : `StackAreaMap` (carte par domaine, remplace la constellation `sg-cluster` sur cette page seulement) et `StackDecisionQueue` (remplace le bandeau `ms-calibrate`). Le CSS va dans `src/index.css`, section Ma Stack, en remplaçant les règles devenues mortes au lieu d'empiler de nouvelles surcharges.

**Stack :** React 18, TypeScript, Vite, CSS `@layer components` (préfixe `ms-`), Vitest + Testing Library (jsdom), Playwright.

**Référence visuelle :** exploration du 21/10/2026, branches `design/ma-stack-dir-c` (base) et `design/ma-stack-dir-b` (verdict, file). Planches dans `/Users/mike/toolstack-worktrees/planches/`.

---

## Décisions de design (validées ou à confirmer)

| # | Décision | Statut |
|---|---|---|
| D1 | Base C : panneau crème, carte par domaine avec logos réels et noms, couleur de domaine reprise dans la barre des chiffres, trait de coupe sur les paires, liseré de couleur sur les cartes outils (plus de fond pastel). | Validé |
| D2 | Phrase-verdict de B en grand dans le hero ; le H1 « Mes outils » / « My tools » reste un vrai `h1`, en surtitre, pour la sémantique et le test e2e `mon-stack-v1`. | Validé |
| D3 | File des prochaines décisions de B : confirmer les freemium, trancher les paires, saisir les prix manquants. Elle remplace le bandeau `ms-calibrate` (mêmes boutons « Aucun » / « Indiquer lesquels »). | Validé |
| D4 | La file n’est **pas** un panneau sombre : cartes blanches sur le crème, numéro orange uniquement pour l’étape des paires. Le sombre de B contredit la sobriété de `PRODUCT.md`. | Validé (21/10) |
| D5 | Le bloc chiffres `.ms-hero-stats` est conservé (utilisé par `e2e/pricing-audit-regressions.spec.ts`), avec libellés courts ; la phrase de coût de B est supprimée pour ne pas répéter les chiffres. | Validé (21/10) |
| D6 | Pastille orange sur la carte seulement pour les outils d'une paire **non tranchée** ; quand toutes les paires sont tranchées, plus aucune pastille. | Validé |
| D7 | Mobile : surtitre, verdict, chiffres, bouton Explorer, file, puis carte (la décision avant l'inventaire). | Validé |
| D8 | Page vide inchangée dans son contenu ; seule la recherche passe dans le panneau crème (rendu C). | Validé |

---

## Fichiers

| Fichier | Rôle |
|---|---|
| Créer `src/lib/stackDiagnosis.ts` | Fonction pure : étapes de décision et texte du verdict FR/EN. |
| Créer `src/test/ma-stack/stackDiagnosis.test.ts` | Tests unitaires de la fonction. |
| Créer `src/components/stack/StackAreaMap.tsx` | Carte des outils par domaine (boutons qui ouvrent la fiche). |
| Créer `src/components/stack/StackDecisionQueue.tsx` | File des prochaines décisions. |
| Créer `src/test/ma-stack/StackHeroParts.test.tsx` | Tests des deux composants (jsdom). |
| Modifier `src/pages/CartPage.tsx` | Hero : surtitre, verdict, chiffres, carte, file ; suppression de la constellation et du bandeau sur cette page. |
| Modifier `src/components/stack/StackBudgetBreakdown.tsx` | Attribut `data-group` sur les groupes freemium / prix à vérifier (styles). |
| Modifier `src/index.css` | Section Ma Stack : nouvelles règles `ms-hero`, `ms-map`, `ms-queue`, paires, budget, cartes ; retrait des règles mortes. |
| Créer `e2e/ma-stack-hero.spec.ts` | Parcours verdict / file / carte en FR/EN à 390 et 1440 px. |
| Modifier `docs/DESIGN_SYSTEM.md`, `docs/MA_STACK_ROADMAP.md`, `docs/TODO.md`, `docs/CHANGELOG_AI.md` | Référence et suivi. |

`src/lib/heroCluster.ts` et les règles `sg-cluster` restent : `StackDetailPage` les utilise.

---

### Tâche 1 : fonction de diagnostic

**Fichiers :** créer `src/lib/stackDiagnosis.ts`, `src/test/ma-stack/stackDiagnosis.test.ts`.

- [ ] **Étape 1 : écrire le test qui échoue**

```ts
// src/test/ma-stack/stackDiagnosis.test.ts
import { describe, expect, it } from "vitest";
import { stackDiagnosis, stackVerdict } from "@/lib/stackDiagnosis";
import type { ToolSummary } from "@/hooks/useSupabaseData";

const tool = (id: string) => ({ id, slug: id, name: id, categoryId: "x", pricing: { free: "", paid: "" } } as ToolSummary);

describe("stackDiagnosis", () => {
  it("orders the steps by what changes the result: freemium, pairs, prices", () => {
    const d = stackDiagnosis({ pairs: 4, amountToReview: 0, unreviewedFreemium: [tool("Canva"), tool("Slack")], unknownPrice: [tool("Stripe")] });
    expect(d.steps.map((s) => s.kind)).toEqual(["freemium", "pairs", "prices"]);
    expect(d.settled).toBe(false);
  });
  it("drops the steps that have nothing to do", () => {
    const d = stackDiagnosis({ pairs: 0, amountToReview: 0, unreviewedFreemium: [], unknownPrice: [tool("Stripe")] });
    expect(d.steps.map((s) => s.kind)).toEqual(["prices"]);
  });
  it("is settled when nothing is left", () => {
    expect(stackDiagnosis({ pairs: 0, amountToReview: 0, unreviewedFreemium: [], unknownPrice: [] }).settled).toBe(true);
  });
});

describe("stackVerdict", () => {
  it("says how many pairs are left, singular and plural, in both languages", () => {
    expect(stackVerdict(1, "fr")).toBe("1 doublon possible à trancher.");
    expect(stackVerdict(4, "fr")).toBe("4 doublons possibles à trancher.");
    expect(stackVerdict(1, "en")).toBe("1 possible overlap to settle.");
    expect(stackVerdict(4, "en")).toBe("4 possible overlaps to settle.");
  });
  it("says there is nothing to settle", () => {
    expect(stackVerdict(0, "fr")).toBe("Aucun doublon à trancher.");
    expect(stackVerdict(0, "en")).toBe("No overlap to settle.");
  });
});
```

- [ ] **Étape 2 : vérifier l'échec**

Commande : `npx vitest run --config vitest.ma-stack.config.ts src/test/ma-stack/stackDiagnosis.test.ts`
Attendu : FAIL, module `@/lib/stackDiagnosis` introuvable.

- [ ] **Étape 3 : implémentation minimale**

```ts
// src/lib/stackDiagnosis.ts
import type { ToolSummary } from "@/hooks/useSupabaseData";

// The decisions left on a stack, in the order they change the result:
// freemium plans set the cost and the overlaps, then the pairs, then the
// prices nobody has entered yet.
export type DecisionStep =
  | { kind: "freemium"; tools: ToolSummary[] }
  | { kind: "pairs"; count: number; amountToReview: number }
  | { kind: "prices"; tools: ToolSummary[] };

export interface StackDiagnosis { steps: DecisionStep[]; settled: boolean }

export function stackDiagnosis(input: { pairs: number; amountToReview: number; unreviewedFreemium: ToolSummary[]; unknownPrice: ToolSummary[] }): StackDiagnosis {
  const steps: DecisionStep[] = [];
  if (input.unreviewedFreemium.length > 0) steps.push({ kind: "freemium", tools: input.unreviewedFreemium });
  if (input.pairs > 0) steps.push({ kind: "pairs", count: input.pairs, amountToReview: input.amountToReview });
  if (input.unknownPrice.length > 0) steps.push({ kind: "prices", tools: input.unknownPrice });
  return { steps, settled: steps.length === 0 };
}

export function stackVerdict(pairs: number, lang: "fr" | "en"): string {
  if (pairs === 0) return lang === "fr" ? "Aucun doublon à trancher." : "No overlap to settle.";
  const s = pairs > 1 ? "s" : "";
  return lang === "fr" ? `${pairs} doublon${s} possible${s} à trancher.` : `${pairs} possible overlap${s} to settle.`;
}
```

- [ ] **Étape 4 : vérifier le succès**

Commande : `npx vitest run --config vitest.ma-stack.config.ts src/test/ma-stack/stackDiagnosis.test.ts`
Attendu : 5 tests PASS.

- [ ] **Étape 5 : commit**

```bash
git add src/lib/stackDiagnosis.ts src/test/ma-stack/stackDiagnosis.test.ts
git commit -m "feat(ma-stack): stack diagnosis steps and verdict"
```

---

### Tâche 2 : carte par domaine

**Fichiers :** créer `src/components/stack/StackAreaMap.tsx`, ajouter au fichier `src/test/ma-stack/StackHeroParts.test.tsx`.

- [ ] **Étape 1 : test qui échoue**

```tsx
// src/test/ma-stack/StackHeroParts.test.tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import StackAreaMap from "@/components/stack/StackAreaMap";
import type { ToolSummary } from "@/hooks/useSupabaseData";

const tool = (id: string) => ({ id, slug: id, name: id, categoryId: "x", pricing: { free: "", paid: "" } } as ToolSummary);
afterEach(cleanup);

describe("StackAreaMap", () => {
  const figma = tool("Figma"), canva = tool("Canva"), slack = tool("Slack");
  const territories = [{ id: "create", label: "Créer", tools: [figma, canva], groups: [] }, { id: "talk", label: "Communiquer", tools: [slack], groups: [] }];
  const overlaps = new Map([[figma.id, [canva]], [canva.id, [figma]]]);

  it("lists every tool by name under its area, as a group named for the stack", () => {
    render(<StackAreaMap territories={territories} overlapsById={overlaps} colorOf={() => "#2563eb"} lang="fr" onSelect={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Mes outils par domaine" })).toBeTruthy();
    expect(screen.getByText("Créer")).toBeTruthy();
    for (const name of ["Figma", "Canva", "Slack"]) expect(screen.getByRole("button", { name: new RegExp(`^${name}`) })).toBeTruthy();
  });
  it("names the overlap for screen readers and marks only tools in a pair", () => {
    const { container } = render(<StackAreaMap territories={territories} overlapsById={overlaps} colorOf={() => "#2563eb"} lang="en" onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Figma, overlaps Canva" })).toBeTruthy();
    expect(container.querySelectorAll(".ms-map-mark")).toHaveLength(2);
  });
  it("opens the tool on click", () => {
    const onSelect = vi.fn();
    render(<StackAreaMap territories={territories} overlapsById={overlaps} colorOf={() => "#2563eb"} lang="fr" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /^Slack/ }));
    expect(onSelect).toHaveBeenCalledWith("Slack");
  });
});
```

- [ ] **Étape 2 : vérifier l'échec**

Commande : `npx vitest run --config vitest.ma-stack.config.ts src/test/ma-stack/StackHeroParts.test.tsx`
Attendu : FAIL, module introuvable.

- [ ] **Étape 3 : implémentation**

```tsx
// src/components/stack/StackAreaMap.tsx
import ToolLogo from "@/components/ToolLogo";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { toolKey } from "@/lib/stackView";

type Territory = { id: string; label: string; tools: ToolSummary[] };
interface Props {
  territories: Territory[];
  overlapsById: Map<string, ToolSummary[]>;
  colorOf: (areaId: string) => string;
  lang: "fr" | "en";
  onSelect: (slug: string) => void;
}

// The stack as a map: one row per area, its colour shared with the budget,
// each tool by name. A tool still in an unsettled pair carries the trim mark.
export default function StackAreaMap({ territories, overlapsById, colorOf, lang, onSelect }: Props) {
  const fr = lang === "fr";
  return <div className="ms-map" role="group" aria-label={fr ? "Mes outils par domaine" : "My tools by area"}>
    {territories.map((territory) => <div key={territory.id} className="ms-map-row">
      <span className="ms-map-area"><i style={{ background: colorOf(territory.id) }} aria-hidden="true" />{territory.id === "assist" ? (fr ? "IA" : "AI") : territory.label}</span>
      <span className="ms-map-apps">{territory.tools.map((tool) => {
        const pairs = overlapsById.get(tool.id) || [];
        const names = pairs.map((other) => other.name).join(", ");
        return <button key={tool.id} type="button" className="ms-map-app" onClick={() => onSelect(toolKey(tool))}
          aria-label={pairs.length ? (fr ? `${tool.name}, recoupe ${names}` : `${tool.name}, overlaps ${names}`) : tool.name}>
          <span className="ms-map-logo"><ToolLogo tool={tool} size={32} />{pairs.length > 0 && <span className="ms-map-mark" aria-hidden="true" />}</span>
          <span className="ms-map-name" aria-hidden="true">{tool.name}</span>
        </button>;
      })}</span>
    </div>)}
  </div>;
}
```

`toolKey` renvoie `tool.slug || tool.id` (`src/lib/stackView.ts:7`) : dans le test, `tool("Slack")` donne bien `"Slack"`.

- [ ] **Étape 4 : vérifier le succès** (même commande, 3 tests PASS)

- [ ] **Étape 5 : commit**

```bash
git add src/components/stack/StackAreaMap.tsx src/test/ma-stack/StackHeroParts.test.tsx
git commit -m "feat(ma-stack): area map of the stack"
```

---

### Tâche 3 : file des prochaines décisions

**Fichiers :** créer `src/components/stack/StackDecisionQueue.tsx`, compléter `src/test/ma-stack/StackHeroParts.test.tsx`.

- [ ] **Étape 1 : tests qui échouent** (ajouter au fichier existant)

```tsx
import StackDecisionQueue from "@/components/stack/StackDecisionQueue";
import { stackDiagnosis } from "@/lib/stackDiagnosis";

describe("StackDecisionQueue", () => {
  const handlers = () => ({ onSkipFreemium: vi.fn(), onPickFreemium: vi.fn(), onSeePairs: vi.fn(), onEnterPrice: vi.fn() });
  const full = stackDiagnosis({ pairs: 4, amountToReview: 0, unreviewedFreemium: [tool("Canva"), tool("Slack")], unknownPrice: [tool("Stripe")] });

  it("numbers the three steps under one heading", () => {
    render(<StackDecisionQueue diagnosis={full} lang="fr" {...handlers()} />);
    expect(screen.getByRole("heading", { name: "Prochaines décisions" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Confirmer 2 freemium")).toBeTruthy();
    expect(screen.getByText("Trancher 4 paires")).toBeTruthy();
    expect(screen.getByText("Saisir 1 prix")).toBeTruthy();
  });
  it("keeps the freemium answers of the former banner", () => {
    const h = handlers();
    render(<StackDecisionQueue diagnosis={full} lang="fr" {...h} />);
    fireEvent.click(screen.getByRole("button", { name: "Aucun" }));
    fireEvent.click(screen.getByRole("button", { name: "Indiquer lesquels" }));
    expect(h.onSkipFreemium).toHaveBeenCalledOnce();
    expect(h.onPickFreemium).toHaveBeenCalledOnce();
  });
  it("leads to the pairs and to the first tool without a price", () => {
    const h = handlers();
    render(<StackDecisionQueue diagnosis={full} lang="en" {...h} />);
    fireEvent.click(screen.getByRole("link", { name: "See the pairs" }));
    fireEvent.click(screen.getByRole("button", { name: "Enter the price of Stripe" }));
    expect(h.onSeePairs).toHaveBeenCalledOnce();
    expect(h.onEnterPrice).toHaveBeenCalledWith("Stripe");
  });
  it("says when nothing is left to settle", () => {
    render(<StackDecisionQueue diagnosis={stackDiagnosis({ pairs: 0, amountToReview: 0, unreviewedFreemium: [], unknownPrice: [] })} lang="fr" {...handlers()} />);
    expect(screen.getByText("Rien à trancher")).toBeTruthy();
  });
});
```

- [ ] **Étape 2 : vérifier l'échec** (FAIL, module introuvable)

- [ ] **Étape 3 : implémentation**

```tsx
// src/components/stack/StackDecisionQueue.tsx
import type { StackDiagnosis } from "@/lib/stackDiagnosis";
import { toolKey } from "@/lib/stackView";

interface Props {
  diagnosis: StackDiagnosis;
  lang: "fr" | "en";
  onSkipFreemium: () => void;
  onPickFreemium: () => void;
  onSeePairs: () => void;
  onEnterPrice: (slug: string) => void;
}

// What is left to decide, in the order it changes the result. Replaces the
// freemium banner: the same two answers live in the first step.
export default function StackDecisionQueue({ diagnosis, lang, onSkipFreemium, onPickFreemium, onSeePairs, onEnterPrice }: Props) {
  const fr = lang === "fr";
  return <section className="ms-queue" aria-labelledby="ms-queue-title">
    <h2 id="ms-queue-title">{fr ? "Prochaines décisions" : "Next decisions"}</h2>
    <ol>
      {diagnosis.steps.map((step) => {
        if (step.kind === "freemium") return <li key="freemium" className="ms-queue-step">
          <p><strong>{fr ? `Confirmer ${step.tools.length} freemium` : `Confirm ${step.tools.length} freemium`}</strong>
            {fr ? "Comptés 0 €. Vous en payez certains ? Votre coût et vos doublons en dépendent." : "Counted as free. Do you pay for some? Your cost and duplicates depend on it."}</p>
          <div className="ms-queue-actions">
            <button type="button" className="ms-queue-quiet" onClick={onSkipFreemium}>{fr ? "Aucun" : "None"}</button>
            <button type="button" className="ms-queue-go" onClick={onPickFreemium}>{fr ? "Indiquer lesquels" : "Pick them"}</button>
          </div>
        </li>;
        if (step.kind === "pairs") return <li key="pairs" className="ms-queue-step ms-queue-step--alert">
          <p><strong>{fr ? `Trancher ${step.count} paire${step.count > 1 ? "s" : ""}` : `Settle ${step.count} pair${step.count > 1 ? "s" : ""}`}</strong>
            {fr ? "Garder l’un, l’autre, ou les deux en connaissance de cause." : "Keep one, the other, or both on purpose."}</p>
          <div className="ms-queue-actions"><a className="ms-queue-go" href="#ms-overlaps" onClick={(event) => { event.preventDefault(); onSeePairs(); }}>{fr ? "Voir les paires" : "See the pairs"}</a></div>
        </li>;
        const first = step.tools[0];
        return <li key="prices" className="ms-queue-step">
          <p><strong>{fr ? `Saisir ${step.tools.length} prix` : `Enter ${step.tools.length} price${step.tools.length > 1 ? "s" : ""}`}</strong>
            {fr ? `${step.tools.map((tool) => tool.name).join(", ")} : aucun prix mensuel vérifié au catalogue.` : `${step.tools.map((tool) => tool.name).join(", ")}: no checked monthly price in the catalogue.`}</p>
          <div className="ms-queue-actions"><button type="button" className="ms-queue-go" onClick={() => onEnterPrice(toolKey(first))}
            aria-label={fr ? `Saisir le prix de ${first.name}` : `Enter the price of ${first.name}`}>{fr ? "Saisir" : "Enter"}</button></div>
        </li>;
      })}
      {diagnosis.settled && <li className="ms-queue-step ms-queue-step--done"><p><strong>{fr ? "Rien à trancher" : "Nothing to settle"}</strong>
        {fr ? "Votre stack ne présente ni doublon ni prix manquant." : "Your stack shows no overlap and no missing price."}</p></li>}
    </ol>
  </section>;
}
```

Note : le lien « Voir les paires » porte la flèche en CSS (`::after`), pour que son nom accessible reste « Voir les paires ».

- [ ] **Étape 4 : vérifier le succès** (7 tests PASS dans le fichier)

- [ ] **Étape 5 : commit**

```bash
git add src/components/stack/StackDecisionQueue.tsx src/test/ma-stack/StackHeroParts.test.tsx
git commit -m "feat(ma-stack): next decisions queue"
```

---

### Tâche 4 : intégration dans `CartPage`

**Fichiers :** modifier `src/pages/CartPage.tsx`, `src/components/stack/StackBudgetBreakdown.tsx`.

- [ ] **Étape 1 : imports et données**

Ajouter les imports `StackAreaMap`, `StackDecisionQueue`, `stackDiagnosis`, `stackVerdict`. Retirer l'import `HERO_CLUSTER_SLOTS` et les constantes `heroOrder`, `heroApps`, `heroOverflow` si plus rien ne les lit (vérifier avec `grep -n "heroApps\|heroOverflow\|heroOrder" src/pages/CartPage.tsx`). Avant le `return`, calculer :

```tsx
  const unknownTools = selectedTools.filter((tool) => toolMonthlyCost(tool, plans.isPaid, lang).kind === "unknown");
  const diagnosis = stackDiagnosis({ pairs: overlapPairs, amountToReview: overlapScore.doubleTotal, unreviewedFreemium: unreviewed, unknownPrice: unknownTools });
  // The map marks only tools still in an unsettled pair (decided pairs leave scoreOverlapPairs).
  const pairedById = useMemo(() => {
    const map = new Map<string, ToolSummary[]>();
    for (const { a, b } of overlapScore.pairs) { map.set(a.id, [...(map.get(a.id) || []), b]); map.set(b.id, [...(map.get(b.id) || []), a]); }
    return map;
  }, [overlapScore]);
```

Placer le `useMemo` avec les autres hooks (la page n'a pas de `return` anticipé). `overlapScore.pairs` est un `ScoredPair[]` qui expose `a` et `b` (`StackOverlapPairs.tsx:44`), et les paires « garder les deux » en sont déjà exclues.

- [ ] **Étape 2 : hero**

Dans `<header className="sg-hero sg-hero--cluster ms-hero…">`, remplacer la classe par `ms-hero` (la page n'utilise plus `sg-hero--cluster`), puis :
- remplacer `<span className="sg-hero-pill">` + `<h1>` par `<h1 className="ms-hero-kicker">{t("Mes outils", "My tools")}</h1>` quand la stack n'est pas vide, et garder le grand `<h1>` actuel pour la page vide ;
- juste sous le surtitre, si `!empty` : `<p className="ms-hero-verdict">{stackVerdict(overlapPairs, lang)}</p>` ;
- supprimer `<p className="sg-lead">` quand la stack n'est pas vide (le verdict et les chiffres le remplacent ; texte conservé pour la page vide) ;
- garder `<dl className="sg-stats ms-hero-stats">` tel quel (contenu et libellés inchangés) ;
- garder le lien Explorer avec la même classe et le même nom accessible ;
- remplacer le bloc `sg-cluster` par `<StackAreaMap territories={mapTerritories} overlapsById={pairedById} colorOf={colorOf} lang={lang} onSelect={selectTool} />` ;
- en dernier enfant du header, si `!empty` : `<StackDecisionQueue diagnosis={diagnosis} lang={lang} onSkipFreemium={…} onPickFreemium={() => setFreemiumSheet(true)} onSeePairs={() => jumpTo("ms-overlaps")} onEnterPrice={selectTool} />`, avec pour `onSkipFreemium` exactement le corps actuel du bouton « Aucun » du bandeau (`plans.markReviewed(...)` + `trackEvent("stack_freemium_answer", …, quick: true)`).

- [ ] **Étape 3 : retirer le bandeau**

Supprimer le bloc `{unreviewed.length > 0 && <aside className="ms-calibrate" …>…</aside>}` et son commentaire (sa logique vit dans la file).

- [ ] **Étape 4 : budget**

Dans `StackBudgetBreakdown.tsx`, ajouter `data-group={group.key}` sur `<div className="ms-budget-other">`.

- [ ] **Étape 5 : contrôles**

Commandes :
- `npx tsc --noEmit -p tsconfig.app.json` → aucune erreur nouvelle sur `CartPage.tsx`
- `npm run test:ma-stack` → toutes les suites PASS (198 + 12 nouveaux tests)
- `npx eslint src/pages/CartPage.tsx src/components/stack src/lib/stackDiagnosis.ts` → aucune erreur, aucun import inutilisé

- [ ] **Étape 6 : commit**

```bash
git add src/pages/CartPage.tsx src/components/stack/StackBudgetBreakdown.tsx
git commit -m "feat(ma-stack): diagnosis hero with area map and decision queue"
```

---

### Tâche 5 : styles

**Fichier :** `src/index.css`, section Ma Stack (`@layer components`).

- [ ] **Étape 1 : retirer les règles mortes**

Vérifier puis supprimer : règles `.ms-page .ms-calibrate*` (≈ l. 34300-34310 et l'animation `ms-calibrate-in`, plus sa variante `prefers-reduced-motion`) ; `.ms-page .ms-hero button.sg-cluster-app` ; `.ms-page .ms-hero .sg-cluster` du bloc mobile. Contrôle : `grep -rn "ms-calibrate" src e2e` ne doit plus rien renvoyer côté composants (les classes `ms-calibrate-skip` / `-go` ne sont plus utilisées ; la file a ses propres classes).

- [ ] **Étape 2 : ajouter la section, en tokens du design system**

Reprendre le rendu validé de `design/ma-stack-dir-c` (`src/pages/ma-stack-direction.css`), renommé sans `.ms-dir-c` et sans `!important`, sur ces bases :
- panneau `.ms-page .ms-hero` : `display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 560px); grid-template-areas: "copy map" "queue queue"; gap: 40px 56px; padding: 56px; border-radius: var(--tt-radius-lg); background: var(--color-surface-soft);` ;
- `.ms-hero-kicker` : `--tt-size-kicker`, 600, `letter-spacing: .08em`, majuscules, `--color-text-meta` ;
- `.ms-hero-verdict` : police brand, `clamp(44px, 5.2vw, 80px)/.96`, `letter-spacing: -.055em`, `text-wrap: balance`, `max-width: 13ch` ;
- `.ms-map`, `.ms-map-row`, `.ms-map-area`, `.ms-map-app`, `.ms-map-logo`, `.ms-map-mark` : rendu C itération 2 (pastille 10 px `--color-alert`, cible de clic ≥ 44 px de haut via le padding de `.ms-map-app`, focus `outline: 2px solid hsl(var(--ring))`) ;
- `.ms-queue` : `grid-area: queue`, liste en 3 colonnes ≥ 1024 px, cartes blanches (`--tt-surface-radius-info`), numéro en compteur CSS dans une pastille cerclée, orange plein pour `.ms-queue-step--alert` ; lien « Voir les paires » avec `::after { content: " ↓"; }` ;
- paires : trait de coupe (`.ms-pair-icons::before`, `border-top: 1.5px dashed var(--color-alert)`), pastille `⇄` orange ;
- budget : anneau masqué quand la légende n'a qu'une ligne (`:has(> li:only-child)`), freemium en pastilles (`[data-group="free"]`) ;
- cartes outils : fond blanc, liseré `inset 0 3px 0 var(--tool-accent)` en desktop, `inset 3px 0 0` sur mobile, plus de lavis pastel ;
- mobile ≤ 760 px : `grid-template-areas: "copy" "queue" "map";` (décision D7).

Règle : aucune taille de police codée en dur quand un `--tt-size-*` couvre le cas (`DESIGN_SYSTEM.md`, « Interdiction »).

- [ ] **Étape 3 : contrôle visuel**

Lancer le serveur (`preview_start` « tooltrim » ou `npx vite --port 5184` dans le worktree), puis le script de capture de l'exploration (`shoot2.mjs`, stack de 10 outils) à 1440 et 390 px, page vide et page remplie. Comparer aux planches C et B. Vérifier : pas de débordement horizontal, pas de collision de libellés dans `.ms-hero-stats`, file lisible, carte pleine largeur sur mobile.

- [ ] **Étape 4 : commit**

```bash
git add src/index.css
git commit -m "style(ma-stack): signature hero, area map, decision queue"
```

---

### Tâche 6 : parcours e2e

**Fichier :** créer `e2e/ma-stack-hero.spec.ts` (même préambule que `e2e/mon-stack-v1.spec.ts` : Supabase et analytics bloqués, consentement refusé, graine `tooltrim-ma-stack-mvp-v3`).

- [ ] **Étape 1 : écrire le scénario**

```ts
import { test, expect } from "@playwright/test";
const key = "tooltrim-ma-stack-mvp-v3";
const slugs = ["chatgpt", "claude", "notion", "figma", "canva", "slack", "zapier", "make", "stripe", "pennylane"];
const seed = { version: 3, needs: [], pinnedToolSlugs: slugs, toolEntries: slugs.map((toolSlug) => ({ toolSlug, needIds: [], intent: "stack", addedAt: "2026-10-21T00:00:00.000Z", assignmentMode: "pending" })) };

test.beforeEach(async ({ page }) => {
  await page.route("**/*supabase.co/**", (route) => route.abort());
  await page.route(/google-analytics\.com|googletagmanager\.com|vercel-insights\.com|vercel-scripts\.com|_vercel\/insights/, (route) => route.abort());
  await page.addInitScript(([k, s]) => { localStorage.setItem(k, s); localStorage.setItem("tooltrim-analytics-consent", JSON.stringify({ version: 1, choice: "refused", decidedAt: Date.now(), expiresAt: Date.now() + 3600000 })); }, [key, JSON.stringify(seed)] as const);
});

for (const lang of ["fr", "en"] as const) for (const width of [390, 1440]) {
  test(`hero diagnosis ${lang} ${width}px`, async ({ page }) => {
    const fr = lang === "fr";
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${lang}/ma-stack`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: fr ? "Mes outils" : "My tools" })).toBeVisible();
    await expect(page.locator(".ms-hero-verdict")).toHaveText(fr ? /doublons? possibles? à trancher\.$/ : /possible overlaps? to settle\.$/);
    const queue = page.getByRole("region", { name: fr ? "Prochaines décisions" : "Next decisions" });
    await expect(queue.getByRole("listitem")).not.toHaveCount(0);
    // The map opens the tool sheet.
    await page.getByRole("group", { name: fr ? "Mes outils par domaine" : "My tools by area" }).getByRole("button").first().click();
    await expect(page.locator(".ms-tool-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    // The freemium step still opens the freemium sheet.
    await queue.getByRole("button", { name: fr ? "Indiquer lesquels" : "Pick them", exact: true }).click();
    await expect(page.locator(".ms-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
}
```

Ajouter le fichier à la commande `test:e2e:ma-stack` de `package.json`.

- [ ] **Étape 2 : lancer le nouveau scénario et les scénarios Ma Stack existants**

Commande : `npx playwright test e2e/ma-stack-hero.spec.ts e2e/mon-stack-v1.spec.ts e2e/stack-explorer-journey.spec.ts e2e/stack-discovery-feed.spec.ts e2e/stack-budget.spec.ts e2e/pricing-audit-regressions.spec.ts e2e/technical-audit-regressions.spec.ts e2e/stack-analytics.spec.ts e2e/accessibility.spec.ts e2e/responsive-shell.spec.ts`
Attendu : tout PASS. `technical-audit-regressions` cherche le bouton « Indiquer lesquels » : il existe toujours (dans la file). Si une assertion dépend de l'ancien bandeau (`.ms-calibrate`), mettre à jour le sélecteur, pas le comportement.

- [ ] **Étape 3 : commit**

```bash
git add e2e/ma-stack-hero.spec.ts package.json
git commit -m "test(ma-stack): e2e for diagnosis hero, map and queue"
```

---

### Tâche 7 : revue design, build et documentation

- [ ] **Étape 1 : revue design** (règle projet : toute UI passe par `design-superpowers:design-review` avant livraison). Corriger les points bloquants, consigner les autres dans `docs/TODO.md`.
- [ ] **Étape 2 : build complet** `npm run build` → PASS, sans hausse notable du poids HTML (comparer à la dernière mesure de `docs/ROADMAP.md`).
- [ ] **Étape 3 : documentation**
  - `docs/DESIGN_SYSTEM.md` : section « Ma Stack, hero diagnostic » (structure, carte par domaine, file, trait de coupe, règle de la pastille, mobile).
  - `docs/MA_STACK_ROADMAP.md` : entrée datée en tête (ce qui change, ce qui est vérifié, ce qui ne l'est pas : essais utilisateurs R9 toujours reportés).
  - `docs/TODO.md` : appariement Stripe / Pennylane « Comptabilité » à revoir ; dette CSS (269 tailles de police, `--radius-2xl` défini deux fois) ; mode sombre non vérifié.
  - `docs/CHANGELOG_AI.md` : livraison.
- [ ] **Étape 4 : commit** `docs(ma-stack): signature hero reference and follow-up`
- [ ] **Étape 5 : point d'arrêt.** Présenter captures et résultats ; ne pas pousser, ne pas fusionner, ne pas déployer sans validation.

---

## Hors périmètre

- Section Recoupements, Budget et liste d'outils : seulement le restyle C (pas de nouvelle logique).
- Explorer, fiche outil (`StackToolSheet`), feuille freemium : inchangés.
- `StackDetailPage` et sa constellation `sg-cluster` : inchangés.
- Mode sombre : non prioritaire (`AGENTS.md`), dette notée.

## Nettoyage après validation

Retirer les worktrees d'exploration `ms-dir-a/b/c` et leurs branches, le clone `evalrepo` du scratchpad, arrêter les serveurs Vite 5181 à 5183. Conserver `planches/` jusqu'à la fin de la refonte.
