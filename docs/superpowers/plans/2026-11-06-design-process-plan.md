# Refonte du process design : plan d'exécution

> **Pour les agents :** exécuter avec superpowers:executing-plans, tâche par tâche, en cochant les cases. Spec : `docs/superpowers/specs/2026-11-06-design-process-design.md`.

**Objectif :** poser le socle (Storybook, jetons, CSS Modules, Stylelint, invariants, tests visuels, CI, publication), puis le valider de bout en bout sur la carte Budget de Ma stack.

**Architecture :** les composants du système vivent dans `src/ds/<Nom>/`, avec leur `.module.css`, leurs données d'exemple, leurs stories et leurs tests. Seuls les jetons `--tt-*` restent globaux (`src/ds/tokens.css`, importé par le site et par Storybook). Storybook a sa propre config Vite, minimale, pour ne pas charger les 2 700 lignes de `vite.config.ts` (prérendu, SEO).

**Stack :** Storybook 10.6.3 (react-vite, addons docs, a11y, vitest), Vitest 4.1.11 en mode navigateur (`@vitest/browser-playwright` 4.1.11), Playwright 1.58.2, Stylelint 17.16.0, polices Fontsource 5.3.0. Versions exactes, publiées depuis plus de deux semaines au 06/11/2026 (Storybook 10.6.6 est sorti la veille : écarté).

**Règles de session :**
- Ne jamais commiter `.agents/`, `.claude/settings.json`, `.claude/skills/`, `skills-lock.json`, `.claude/launch.json`, `public/llms-full.txt`, ni les fichiers d'autres sessions. Toujours `git add` fichier par fichier.
- `npm run typecheck`, jamais `npx tsc -p .`.
- Aucun tiret cadratin dans les textes.

---

## Partie A : le socle

### Tâche A1 : dépendances

**Fichiers :** `package.json`, `package-lock.json`

- [ ] **Installer, versions exactes**

```bash
npm i -D --save-exact storybook@10.6.3 @storybook/react-vite@10.6.3 @storybook/addon-docs@10.6.3 @storybook/addon-a11y@10.6.3 @storybook/addon-vitest@10.6.3 @vitest/browser-playwright@4.1.11 @fontsource-variable/inter@5.3.0 @fontsource-variable/inter-tight@5.3.0 stylelint@17.16.0 stylelint-config-standard@40.0.0 stylelint-declaration-strict-value@1.12.1
```

- [ ] **Vérifier**

Run: `npm ls storybook vitest playwright --depth=0 && ls node_modules/@fontsource-variable/inter/files | grep -E "^inter-latin-(opsz|wght)-normal.woff2$"`
Attendu : storybook@10.6.3, vitest@4.1.11, un seul `playwright` en 1.58.2, et au moins `inter-latin-wght-normal.woff2`. Noter le fichier `opsz` s'il existe : il porte l'axe de taille optique servi par Google Fonts sur le site, à préférer en A3.

- [ ] **Vérifier que rien n'a cassé**

Run: `npm run typecheck && npm test`
Attendu : identiques à avant l'installation.

- [ ] **Commit** : `chore(ds): add Storybook 10.6.3, Vitest browser, Stylelint, Fontsource (exact versions)`

### Tâche A2 : extraire les jetons dans `src/ds/tokens.css`

**Fichiers :**
- Créer : `src/ds/tokens.css` (lignes 14 à 164 actuelles de `src/styles/tooltrim-system.css` : bloc « Tokens », bloc « Atomes : un token composite par atome », et leurs variantes `.dark`)
- Modifier : `src/styles/tooltrim-system.css` (ces lignes remplacées par `@import "../ds/tokens.css";`, placé avant toute règle)
- Modifier : `scripts/build-planche.mjs` (résoudre l'import pour la planche, tant qu'elle existe)
- Modifier : `scripts/validate-design-tokens.mjs:25` (ajouter `"src/ds/tokens.css"` à `CSS_FILES`)

- [ ] **Capturer l'état avant** : toutes les valeurs calculées `--tt-*` de `:root`, en clair et en sombre, sur `/fr/ma-stack` (serveur de dev lancé).

```js
// scratchpad: tokens-snapshot.mjs <sortie.json>
import { chromium } from "playwright";
const b = await chromium.launch(); const out = {};
for (const theme of ["light", "dark"]) {
  const p = await b.newPage();
  await p.goto("http://localhost:3000/fr/ma-stack", { waitUntil: "networkidle" });
  out[theme] = await p.evaluate((dark) => {
    document.documentElement.classList.toggle("dark", dark);
    const s = getComputedStyle(document.documentElement); const r = {};
    for (const sheet of document.styleSheets) { let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of rules) if (rule.style) for (const prop of rule.style) if (prop.startsWith("--tt-")) r[prop] = s.getPropertyValue(prop).trim(); }
    return r;
  }, theme === "dark");
  await p.close();
}
await b.close(); (await import("node:fs")).writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
```

Run: `node tokens-snapshot.mjs before.json`

- [ ] **Déplacer les lignes 14 à 164** dans `src/ds/tokens.css`, sans rien modifier, avec cet en-tête :

```css
/* Jetons ToolTrim : les seules valeurs globales du système.
   Lus par le site (via tooltrim-system.css) et par Storybook.
   Validés le 30/10/2026 ; une valeur ne change qu'après validation de Michael. */
```

- [ ] **Dans `build-planche.mjs`**, juste après la lecture des paramètres de `buildPlanche`, résoudre l'import :

```js
  system = system.replace('@import "../ds/tokens.css";', () => readFileSync(join(ROOT, "src/ds/tokens.css"), "utf8"));
```

- [ ] **Capturer l'état après et comparer**

Run: `node tokens-snapshot.mjs after.json && diff before.json after.json && echo IDENTIQUE`
Attendu : `IDENTIQUE`.

- [ ] **Contrôles**

Run: `npm run validate:design-tokens && npm run typecheck && npm run planche && grep -c "@import \"../ds/tokens.css\"" design-system/dist/systeme-tooltrim.html`
Attendu : la gate passe et le dernier compte vaut `0` (import résolu dans la planche).

- [ ] **Commit** : `refactor(ds): tokens in src/ds/tokens.css, imported by the system file (no visual change)`

### Tâche A3 : configuration Storybook

**Fichiers :**
- Créer : `.storybook/main.ts`, `.storybook/vite.config.ts`, `.storybook/preview.tsx`, `.storybook/fonts.css`
- Modifier : `package.json` (scripts), `.gitignore` (`storybook-static/`)

- [ ] **`.storybook/vite.config.ts`** : config minimale, sans les plugins de prérendu du site.

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "../src") } },
});
```

- [ ] **`.storybook/main.ts`**

```ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: { name: "@storybook/react-vite", options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } } },
  stories: ["../src/ds/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  staticDirs: [
    { from: "../public/fonts", to: "/fonts" },
    { from: "../node_modules/@fontsource-variable/inter/files", to: "/fonts/inter" },
    { from: "../node_modules/@fontsource-variable/inter-tight/files", to: "/fonts/inter-tight" },
  ],
  core: { disableTelemetry: true },
};
export default config;
```

- [ ] **`.storybook/fonts.css`** : les familles portent les noms exacts des jetons (`Inter`, `Inter Tight`, `Uncut Sans`). `font-display: block` pour des captures stables. Si A1 a trouvé `inter-latin-opsz-normal.woff2`, l'utiliser pour Inter à la place du fichier `wght`.

```css
@font-face { font-family: "Uncut Sans"; src: url("/fonts/UncutSans-Variable.woff2") format("woff2-variations"); font-weight: 300 700; font-display: block; }
@font-face { font-family: "Inter"; src: url("/fonts/inter/inter-latin-wght-normal.woff2") format("woff2-variations"); font-weight: 100 900; font-display: block; }
@font-face { font-family: "Inter Tight"; src: url("/fonts/inter-tight/inter-tight-latin-wght-normal.woff2") format("woff2-variations"); font-weight: 100 900; font-display: block; }
```

- [ ] **`.storybook/preview.tsx`** : langue et thème en barre d'outils, trois largeurs, a11y bloquante, fond de page du site.

```tsx
import type { Decorator, Preview } from "@storybook/react-vite";
import "./fonts.css";
import "../src/ds/tokens.css";

const withEnvironment: Decorator = (Story, context) => {
  const root = document.documentElement;
  root.classList.toggle("dark", context.globals.theme === "dark");
  root.lang = context.globals.lang;
  document.body.style.background = "var(--tt-bg)";
  document.body.style.color = "var(--tt-ink)";
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    lang: { description: "Langue", toolbar: { icon: "globe", items: [{ value: "fr", title: "Français" }, { value: "en", title: "English" }], dynamicTitle: true } },
    theme: { description: "Thème", toolbar: { icon: "mirror", items: [{ value: "light", title: "Clair" }, { value: "dark", title: "Sombre" }], dynamicTitle: true } },
  },
  initialGlobals: { lang: "fr", theme: "light" },
  decorators: [withEnvironment],
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    viewport: {
      options: {
        phone: { name: "390", styles: { width: "390px", height: "844px" } },
        tablet: { name: "768", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "1280", styles: { width: "1280px", height: "900px" } },
      },
    },
  },
};
export default preview;
```

- [ ] **Scripts `package.json`**

```json
"storybook": "storybook dev -p 6006 --no-open",
"build-storybook": "storybook build -o storybook-static",
```

- [ ] **Story témoin** `src/ds/_smoke/Smoke.stories.tsx` (supprimée en B6 quand Budget existe) :

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
const meta: Meta = { title: "Socle/Témoin" };
export default meta;
export const Typo: StoryObj = { render: () => <p style={{ font: "var(--tt-title-l-font)", margin: 0 }}>Budget mensuel</p> };
```

- [ ] **Vérifier**

Run: `npm run build-storybook 2>&1 | tail -3 && ls storybook-static/index.json storybook-static/fonts/UncutSans-Variable.woff2`
Attendu : build réussi, les deux fichiers présents. Puis lancer `npm run storybook` via preview_start (ajouter l'entrée à `.claude/launch.json` sans la commiter) et contrôler à l'écran que la story témoin est en Uncut Sans, en clair puis en sombre.

- [ ] **Commit** : `feat(ds): Storybook with its own Vite config, site fonts, language and theme toolbar`

### Tâche A4 : invariants de mise en page (TDD)

**Fichiers :**
- Créer : `src/ds/test/invariants.ts`, `src/ds/test/invariants.browser.test.ts`, `vitest.ds.config.ts`
- Modifier : `package.json` (`"test:ds": "vitest run --config vitest.ds.config.ts"`)

- [ ] **`vitest.ds.config.ts`** : deux projets en vrai navigateur, les tests unitaires des invariants et les stories.

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const browser = { enabled: true, headless: true, provider: playwright(), instances: [{ browser: "chromium" as const }] };

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    projects: [
      { extends: true, test: { name: "ds-unit", include: ["src/ds/**/*.browser.test.ts"], browser } },
      { extends: true, plugins: [storybookTest({ configDir: ".storybook" })], test: { name: "storybook", browser } },
    ],
  },
});
```

Le `vitest.config.ts` du site n'inclut que `*.{test,spec}.{ts,tsx}` en jsdom : ajouter `exclude: ["src/ds/**/*.browser.test.ts", "node_modules/**"]` pour qu'il ne les lance pas.

- [ ] **Test qui échoue d'abord** : `src/ds/test/invariants.browser.test.ts`

```ts
import { afterEach, describe, expect, it } from "vitest";
import { brokenWords, overflowing, splitUnits } from "./invariants";

const mount = (html: string) => { const el = document.createElement("div"); el.innerHTML = html; document.body.append(el); return el; };
afterEach(() => { document.body.innerHTML = ""; });

describe("layout invariants", () => {
  it("finds a word split across two lines", () => {
    const el = mount(`<p style="width:40px;overflow-wrap:anywhere;font:16px sans-serif">Vercel</p>`);
    expect(brokenWords(el)).toEqual(["Vercel"]);
  });
  it("accepts a name that wraps between words", () => {
    const el = mount(`<p style="width:90px;font:16px sans-serif">Adobe Illustrator</p>`);
    expect(brokenWords(el)).toEqual([]);
  });
  it("finds an amount separated from its unit", () => {
    const el = mount(`<p style="width:30px;font:16px sans-serif"><span data-nowrap>100 %</span></p>`);
    expect(splitUnits(el)).toEqual(["100 %"]);
  });
  it("finds a child sticking out of its box", () => {
    const el = mount(`<div style="width:100px"><span style="display:block;width:140px">x</span></div>`);
    expect(overflowing(el)).toHaveLength(1);
  });
});
```

Run: `npm run test:ds -- --project ds-unit`
Attendu : ÉCHEC, module `./invariants` introuvable.

- [ ] **Implémentation** : `src/ds/test/invariants.ts`

```ts
/** Distinct line tops of a range: one value means the text sits on one line. */
const lineTops = (range: Range) => new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));

/** Words (runs without any space, non-breaking spaces included) that the browser split over two lines. */
export function brokenWords(root: HTMLElement): string[] {
  const found: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    for (const match of node.data.matchAll(/\S+/g)) {
      const range = document.createRange();
      range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
      if (lineTops(range).size > 1) found.push(match[0]);
    }
  }
  return found;
}

/** Elements marked data-nowrap (an amount and its unit) that wrapped. */
export function splitUnits(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>("[data-nowrap]")].filter((el) => {
    const range = document.createRange(); range.selectNodeContents(el);
    return lineTops(range).size > 1;
  }).map((el) => el.textContent ?? "");
}

/** Descendants whose box goes past the root's left or right edge. */
export function overflowing(root: HTMLElement): HTMLElement[] {
  const box = root.getBoundingClientRect();
  return [...root.querySelectorAll<HTMLElement>("*")].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1);
  });
}

/** Run every invariant on a story's root; one readable failure lists them all. */
export function assertLayout(root: HTMLElement) {
  const problems = [
    ...brokenWords(root).map((w) => `mot coupé : « ${w} »`),
    ...splitUnits(root).map((u) => `unité séparée : « ${u} »`),
    ...overflowing(root).map((el) => `débordement : <${el.tagName.toLowerCase()} class="${el.className}">`),
  ];
  if (problems.length) throw new Error(problems.join("\n"));
}
```

Run: `npm run test:ds -- --project ds-unit`
Attendu : 4 tests passent.

- [ ] **Brancher les invariants sur toutes les stories** : dans `.storybook/preview.tsx`, ajouter un `play` global exécuté après chaque story.

```tsx
import { assertLayout } from "../src/ds/test/invariants";
// dans preview :
  async play({ canvasElement }) {
    await document.fonts.ready;
    assertLayout(canvasElement);
  },
```

Contrôle : ajouter temporairement à la story témoin `style={{ width: 30, overflowWrap: "anywhere" }}`. `npm run test:ds -- --project storybook` doit échouer avec « mot coupé ». Retirer, relancer : succès.

- [ ] **Commit** : `test(ds): layout invariants (broken words, split units, overflow) run on every story`

### Tâche A5 : Stylelint pour les modules

**Fichiers :** créer `.stylelintrc.json` et `src/ds/test/stylelint-violations.module.css.txt` (fichier témoin) ; script `"lint:ds": "stylelint \"src/ds/**/*.module.css\""`.

- [ ] **`.stylelintrc.json`**

```json
{
  "extends": ["stylelint-config-standard"],
  "plugins": ["stylelint-declaration-strict-value"],
  "rules": {
    "declaration-no-important": true,
    "selector-pseudo-class-disallowed-list": ["global"],
    "selector-class-pattern": "^[a-z][a-zA-Z0-9]*$",
    "scale-unlimited/declaration-strict-value": [
      ["/color$/", "fill", "stroke", "font", "font-size", "font-weight", "font-family", "letter-spacing", "line-height", "/^(margin|padding)/", "gap", "row-gap", "column-gap", "border-radius", "box-shadow"],
      { "ignoreValues": ["0", "inherit", "currentColor", "transparent", "none", "auto", "normal", "/^calc\\(.*var\\(--tt-/"], "ignoreFunctions": false, "disableFix": true }
    ]
  }
}
```

- [ ] **Témoin qui doit échouer** : copier le témoin en `src/ds/_smoke/bad.module.css` avec ce contenu, lancer, puis supprimer.

```css
.card { color: #1d1d1f; font-size: 15px; padding: 13px; border-radius: 9px; }
.name { font-weight: 700 !important; }
:global(.tt-tile) .card { gap: 4px; }
```

Run: `npm run lint:ds`
Attendu : ÉCHEC, avec au moins 7 erreurs (couleur, taille, espace, rayon, graisse, `!important`, `:global`). Supprimer le fichier, relancer : succès (aucun module encore).

- [ ] **Commit** : `chore(ds): Stylelint for module CSS, tokens only, no !important, no :global`

### Tâche A6 : tests visuels

**Fichiers :** créer `visual/playwright.visual.config.ts`, `visual/stories.visual.ts`, `visual/serve.mjs` ; scripts `"test:visual": "playwright test -c visual/playwright.visual.config.ts"`. Le dossier `visual/` est hors de `e2e/`, donc invisible pour `playwright.config.ts`.

- [ ] **`visual/serve.mjs`** : sert `storybook-static` sans dépendance.

```js
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const root = join(import.meta.dirname, "../storybook-static");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png" };
createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  try { const body = await readFile(join(root, path.endsWith("/") ? path + "index.html" : path)); res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(6007, "127.0.0.1");
```

- [ ] **`visual/playwright.visual.config.ts`**

```ts
import { defineConfig } from "playwright/test";
const local = !process.env.CI;
export default defineConfig({
  testDir: ".",
  testMatch: "stories.visual.ts",
  // Les références viennent du Linux de la CI. En local (macOS), on produit des captures à regarder, sans comparer.
  snapshotPathTemplate: local ? "{testDir}/__local__/{arg}{ext}" : "{testDir}/__screenshots__/{arg}{ext}",
  updateSnapshots: local ? "all" : "none",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:6007", reducedMotion: "reduce" },
  expect: { toHaveScreenshot: { animations: "disabled", maxDiffPixels: 0 } },
  webServer: { command: "node visual/serve.mjs", url: "http://127.0.0.1:6007/index.json", reuseExistingServer: !process.env.CI },
});
```

- [ ] **`visual/stories.visual.ts`** : chaque story, en 390, 768 et 1280, FR et EN, clair et sombre. Une story taguée `!visual` est ignorée.

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "playwright/test";

type Entry = { id: string; type: string; tags?: string[] };
const index = JSON.parse(readFileSync(join(import.meta.dirname, "../storybook-static/index.json"), "utf8")) as { entries: Record<string, Entry> };
const stories = Object.values(index.entries).filter((e) => e.type === "story" && !e.tags?.includes("!visual") && !e.id.startsWith("socle-"));

for (const story of stories) for (const width of [390, 768, 1280]) for (const lang of ["fr", "en"]) for (const theme of ["light", "dark"]) {
  test(`${story.id} ${width} ${lang} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=lang:${lang};theme:${theme}`);
    await page.locator("#storybook-root > *").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("#storybook-root")).toHaveScreenshot(`${story.id}--${width}-${lang}-${theme}.png`);
  });
}
```

- [ ] **Vérifier en local** (la story témoin est exclue par le préfixe `socle-` : le premier vrai passage aura lieu en B5)

Run: `npm run build-storybook && npm run test:visual`
Attendu : « No tests found » ou 0 test, sans erreur de config. Ajouter `visual/__local__/` et `visual/test-results/` à `.gitignore`.

- [ ] **Commit** : `test(ds): visual tests on every story, 3 widths, FR/EN, light/dark`

### Tâche A7 : CI

**Fichiers :** modifier `.github/workflows/preprod-ci.yml`, créer `.github/workflows/visual-baselines.yml`.

- [ ] **Job `design`** dans `preprod-ci.yml`, dans l'image officielle de Playwright, pour que le rendu des références soit toujours le même :

```yaml
  design:
    name: Design system
    runs-on: ubuntu-24.04
    container: mcr.microsoft.com/playwright:v1.58.2-noble
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - name: Module CSS uses tokens only
        run: npm run lint:ds
      - name: Invariants, a11y and story tests
        run: npm run test:ds
      - name: Build Storybook
        run: npm run build-storybook
      - name: Visual comparison
        run: npm run test:visual
        env: { CI: "true" }
      - if: failure()
        uses: actions/upload-artifact@v4
        with: { name: visual-diff, path: test-results/ }
```

- [ ] **`visual-baselines.yml`** : régénère les références sur une branche, uniquement à la main, après validation de Michael.

```yaml
name: Visual baselines
on:
  workflow_dispatch:
    inputs:
      note: { description: "Validation (ex. « Budget validé par Michael le 08/11 »)", required: true }
permissions: { contents: write }
jobs:
  update:
    runs-on: ubuntu-24.04
    container: mcr.microsoft.com/playwright:v1.58.2-noble
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 20, cache: npm }
      - run: npm ci && npm run build-storybook
      - run: npx playwright test -c visual/playwright.visual.config.ts --update-snapshots
        env: { CI: "true" }
      - run: |
          git config --global --add safe.directory "$GITHUB_WORKSPACE"
          git config user.name "github-actions[bot]"; git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add visual/__screenshots__
          git commit -m "test(ds): visual baselines, ${{ inputs.note }}" || echo "Rien à changer"
          git push
```

- [ ] **Vérifier** : pousser, puis `gh run list --workflow preprod-ci.yml --limit 1` jusqu'à la fin ; le job `design` doit être vert (aucune story visuelle encore).

- [ ] **Commit** : `ci(ds): design job in Playwright's image; manual baseline workflow`

### Tâche A8 : publication Vercel (avec Michael)

Le CLI Vercel n'est pas installé, et créer un projet engage le compte : c'est Michael qui le fait, ou qui m'y autorise.

- [ ] **Michael crée le projet** `tooltrim-design` sur le même dépôt, avec ces réglages :
  - Framework : Other
  - Build : `npm run build-storybook`
  - Output : `storybook-static`
  - Ignored Build Step : `git diff --quiet HEAD^ HEAD -- src/ds .storybook package.json`
  - Protection : Vercel Authentication sur toutes les URL si l'offre le permet, sinon aucun domaine de production et uniquement les URL de preview, qui sont protégées.
- [ ] **Vérifier** que le projet du site n'est pas touché : le build de production suivant de `tooltrim` passe et reste sous 852 Mio.
- [ ] Ajouter l'URL dans `docs/DESIGN_SYSTEM.md`.

### Tâche A9 : conventions écrites

**Fichiers :** `AGENTS.md` (section « Conventions CSS »), `docs/DESIGN_SYSTEM.md` (nouvelle section en tête).

- [ ] **`AGENTS.md`** : remplacer la règle « toutes les classes de design dans `@layer components` d'`index.css` » par :
  - un composant du système vit dans `src/ds/<Nom>/` (tsx, `.module.css`, fixtures, stories) ;
  - son CSS ne lit que des jetons `--tt-*` (Stylelint) ;
  - une page n'ajoute aucun style à un composant du système ;
  - `index.css` ne reçoit plus de nouvelle règle de design ; l'héritage y est retiré module par module.
- [ ] **`docs/DESIGN_SYSTEM.md`** : décrire le process en six étapes de la spec, l'URL Storybook, `npm run storybook`, `test:ds`, `lint:ds`, `test:visual`, et le workflow des références. Indiquer que la planche HTML est gelée et que les étiquettes `planche-validee-*` ne sont plus posées.
- [ ] **Commit** : `docs(ds): new design conventions and process`

---

## Partie B : pilote, la carte Budget

### Tâche B1 : brief (porte : validation de Michael avant toute ligne de code)

Brief proposé :

1. **Rôle** : dire combien coûte la stack par mois et par an, et à quel point ce chiffre est fiable.
2. **États** :
   - aucun prix connu (invitation à donner sa première formule) ;
   - total partiel avec N prix ou formules à confirmer ;
   - total complet ;
   - conversion de devise affichée ;
   - $ seul ou € seul (règle devise du 02/10).
3. **Données extrêmes** :
   - 1 outil à 100 % ;
   - 3 outils ;
   - 12 outils (les 5 premiers, puis « et 7 autres ») ;
   - noms longs : « Microsoft Dynamics 365 Finance and Operations », « CallTrackingMetrics » (le mot le plus long du catalogue) ;
   - montants de 0,99 à 1 249,00.
4. **Humour** : une seule ligne, selon la part du plus gros abonnement (« Pas de tyran dans la stack. », « Un seul abonnement, et il fait tout le travail. »).
5. **Actions** :
   - « Voir tout » ;
   - la ligne de confiance mène à la question suivante de la décision ;
   - « Préciser ma première formule » quand rien n'est connu.

- [x] Soumis à Michael le 06/11/2026. Validé, avec cette correction :

> « Le budget est avant tout la vue d'ensemble. Les autres modules sont principalement des questions ou des visualisations sous d'autres angles, où l'on rentre dans le détail. Je dois voir de manière macro : stack / budget. »

**Conséquence sur le brief :** la carte Budget montre la stack et son coût d'un coup d'œil :
- le total par mois et par an ;
- le nombre d'outils, payants et gratuits ;
- la stack elle-même en un rang de logos ;
- la fiabilité du chiffre ;
- une ligne d'humour.

Le détail outil par outil (la liste des parts, montants et pourcentages) sort de la carte : c'est le travail de la Répartition. Les données extrêmes restent valables pour la rangée de logos (1, 3, 12 outils) et pour les montants.

### Contrat de la carte Budget (issu du brief validé)

Composant de présentation : il reçoit des données déjà calculées et formatées, et porte ses propres textes FR/EN, humour compris. Aucun accès au magasin ni au catalogue.

```ts
export type BudgetTool = { id: string; name: string; slug?: string; logo?: string; paid: boolean };
export type BudgetProps = {
  lang: "fr" | "en";
  tools: BudgetTool[];                 // toute la stack, la plus chère d'abord
  monthly: string | null;              // total formaté (« 58 € »), null si aucun prix connu
  yearly: string | null;               // « 696 € »
  lead: { name: string; share: number } | null; // plus gros abonnement et sa part (0 à 100), pour la ligne d'humour
  unsure: { prices: number; plans: number };     // à confirmer
  rateDate: string | null;             // date du taux, déjà écrite (« 27 août 2026 »), si une conversion a eu lieu
  onConfirmNext?: () => void;          // ligne de confiance : ouvre la question suivante de la décision
  onStart?: () => void;                // rien de connu : « Préciser ma première formule »
};
```

Contenu, dans l'ordre de lecture :
1. Surtitre « Votre stack » / « Your stack ».
2. Le total « 58 € /mois », puis « **Soit 696 € par an.** » et une ligne d'humour selon `lead` :
   - 1 outil : « Un seul abonnement, et il fait tout le travail. » ;
   - part ≥ 50 % : « X en paie plus de la moitié à lui seul. » ;
   - part ≥ 75 % : « X en paie presque tout à lui seul. » ;
   - sinon : « Pas de tyran dans la stack. »
3. La stack : un rang de logos (8 au plus, puis « +N »), et « 12 outils · 9 payants · 3 gratuits ».
4. La fiabilité : « Budget renseigné », ou bien « 9 outils sur 12 renseignés · 3 prix à confirmer » en bouton.
5. La conversion, s'il y en a une.

Quand aucun prix n'est connu, le total est remplacé par « On fait les comptes ? » et le bouton « Préciser ma première formule ». Le rang de logos reste.

Hors carte : le détail outil par outil (Répartition) et la jauge Gardé / À examiner (Décision), sauf demande contraire de Michael à la revue.

### Tâche B2 : données d'exemple

**Fichier :** `src/ds/Budget/Budget.fixtures.ts`. Les outils réels ont un logo hébergé chez nous (`public/home-logos` : notion, figma, canva, chatgpt, airtable, calendly, loom, mailchimp, make, n8n, pipedrive, stripe). Deux noms extrêmes n'ont pas de logo local et testent le repli : « Microsoft Dynamics 365 Finance and Operations » et « CallTrackingMetrics ».

États : `one` (Vercel seul, 100 %), `three`, `twelve`, `longNames`, `partial` (3 prix et 1 formule à confirmer), `nothingKnown`, `converted` (USD vers EUR), `dollars`, `bigAmounts` (1 249,00 € par mois).

Storybook sert `public/home-logos` (ajout dans `staticDirs`), les stories passent `allowRemoteSources={false}` à `ToolLogo`, et le test visuel attend que toutes les images soient chargées.

### Tâche B3 : stories d'abord

**Fichier :** `src/ds/Budget/Budget.stories.tsx`, une story par état de B2. La langue vient de la barre d'outils (`context.globals.lang`). Elles échouent tant que `Budget.tsx` n'existe pas.

### Tâche B4 : composant

**Fichiers :** `src/ds/Budget/Budget.tsx`, `src/ds/Budget/Budget.module.css`. Les montants et leurs unités portent `data-nowrap`. On termine quand `lint:ds`, `test:ds`, `typecheck` et `npm test` passent, et que les captures locales des 9 états sont relues en 390, 768 et 1280, en FR et EN, en clair et en sombre.

### Tâche B5 : revue indépendante

Un sous-agent design-review qui n'a pas écrit le code reçoit seulement `visual/__local__/budget-*`, le brief et la liste de contrôle (coupures, vides, alignements, contrastes, langue, ton, hiérarchie). Je corrige ses constats ou je les soumets à Michael.

### Tâche B6 : validation de Michael

Storybook en ligne (A8) ou, d'ici là, captures envoyées. Après son accord : suppression de la story témoin, retrait de `--pass-with-no-tests`, lancement de « Visual baselines » avec sa note.

### Tâche B7 : intégration et retrait

`StackFindings` rend `<Budget>` à la place du bloc `data-card="price"` en calculant ses props (outils, totaux, `lead`, `unsure`, `rateDate`). La liste des parts quitte la carte. On retire les règles qui ne servent plus à personne (`tt-budget-*` ; `tt-trust` et `tt-ring` si plus personne ne les lit). `tt-share` et `tt-shares` restent jusqu'à la migration de la Répartition. Contrôles : `typecheck`, `npm test`, `test:ma-stack`, tests de StackFindings mis à jour, captures de la page en FR et EN, budget du build.

---

## Partie C : la Répartition

### C1 : brief (validé par Michael le 06/11/2026)

1. **Rôle** : montrer où va l'argent. C'est la vue détaillée qui suit la vue d'ensemble du Budget : par domaine d'abord, puis outil par outil, avec ce qui est en jeu (jauge Gardé / À examiner).
2. **États** :
   - un seul domaine ;
   - 2 à 5 domaines ;
   - 6 domaines ou plus (au-delà de 5, les plus petits regroupés en « Autres ») ;
   - avec ou sans montant à examiner ;
   - outils sans prix (signalés, hors calcul) ;
   - conversion de devise.
3. **Données extrêmes** :
   - 1 outil à 100 % ;
   - 12 outils sur 5 domaines ;
   - un domaine à 1 % ;
   - « Microsoft Dynamics 365 Finance and Operations » ;
   - de 0,99 à 1 100, en € et en $.
4. **Humour** : une ligne sous le titre, selon la concentration.
5. **Actions** : chaque domaine s'ouvre sur ses outils (montant, part du total), un seul à la fois, le plus gros ouvert d'office ; la jauge mène à la décision du doublon.

Choix validés : **A**, le détail par outil vit dans des domaines qui s'ouvrent ; **B**, la jauge se place en tête, sous le titre.

### Contrat

```ts
export type SplitTool = { id: string; name: string; slug?: string; logo?: string; amount: number };
export type SplitArea = { id: string; label: string; color: string; amount: number; tools: SplitTool[] };
export type SplitProps = {
  lang: "fr" | "en";
  areas: SplitArea[];                  // the component sorts them and groups the 6th onwards into « Autres »
  format: (amount: number) => string;  // the site's formatter, in the display currency
  unpriced: number;                    // tools without a price, left out of the figures
  rateDate: string | null;
  review: { amount: number; onReview: () => void } | null; // amount at stake in the duplicates
  localLogosOnly?: boolean;
};
```

La jauge devient un composant du système (`src/ds/CutGauge`), avec le dessin validé : encre pour ce qu'on garde, pointillé orange pour ce qui est à examiner, ciseaux du signe à la frontière. Les couleurs des domaines sont des jetons `--tt-area-*` (déplacés d'`index.css`, valeurs vérifiées identiques).

Étapes : fixtures, stories (`a-valider`), composants, `lint:ds`, `test:ds`, captures, revue indépendante, validation de Michael, références, intégration dans `StackFindings` et retrait de `CutGauge.tsx` ainsi que des règles `tt-split*`, `tt-cutgauge*` et `tt-share*`.
