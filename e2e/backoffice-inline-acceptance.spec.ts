import { test, expect, control, dismissConsent } from "./fixtures/accounts";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { DEPRECATED_TOOL_SLUGS } from "../src/lib/toolVisibility";

const toolsIndex: { slug: string; id: string }[] = JSON.parse(
  readFileSync("src/data/tools_index.json", "utf8"),
);
const activeVocabulary = toolsIndex.filter(
  (tool) => !DEPRECATED_TOOL_SLUGS.has(tool.slug || tool.id),
);

async function openWorkspace(page: Page, lang: "fr" | "en") {
  await page.goto(`/${lang}/back-office`);
  await dismissConsent(page);
  await page
    .getByLabel(lang === "fr" ? "E-mail administrateur" : "Admin email", {
      exact: true,
    })
    .fill("admin@example.invalid");
  await page
    .getByLabel(lang === "fr" ? "Mot de passe" : "Password", { exact: true })
    .fill("fixture-password");
  await page
    .locator(".ba-login")
    .getByRole("button", {
      name: lang === "fr" ? "Se connecter" : "Sign in",
      exact: true,
    })
    .click();
  if ((page.viewportSize()?.width ?? 1280) <= 640) await page.getByRole("button", { name: lang === "fr" ? "Ouvrir le menu" : "Open menu" }).click();
  await page
    .getByRole("button", {
      name: lang === "fr" ? "Fiches" : "Records",
      exact: true,
    })
    .click();
}
const field = (page: Page, path: string) =>
  page
    .locator(`[data-catalog-path="${path}"]`)
    .locator("input, textarea, select")
    .first();
async function expandSettings(page: Page) {
  // Opening native summaries exercises first-open mounting and the full vocabulary.
  for (const summary of await page
    .locator("[data-catalog-settings] > summary")
    .all()) {
    if (
      !(await summary.evaluate(
        (node) => (node.parentElement as HTMLDetailsElement).open,
      ))
    )
      await summary.click();
    if (await summary.evaluate((node) => !!node.closest(".td-hero-card"))) {
      expect(
        await summary.evaluate((node) => {
          const settings = node.parentElement!;
          const grid = settings.parentElement!;
          return (
            Math.abs(
              settings.getBoundingClientRect().width -
                grid.getBoundingClientRect().width,
            ) < 2
          );
        }),
        "Hero translations must span the identity grid, including the logo column",
      ).toBe(true);
      expect(
        await page.locator(".td-hero-card").evaluate((card) => {
          const identity = card.querySelector(".td-hero-identity-grid")!;
          return (
            identity.getBoundingClientRect().bottom <=
            card.getBoundingClientRect().bottom + 1
          );
        }),
      ).toBe(true);
    }
  }
}

for (const lang of ["fr", "en"] as const)
  for (const width of [390, 768, 1440]) {
    test(`raw fiche acceptance ${lang} ${width}: complete vocabulary, input and durable reload`, async ({
      page,
      request,
    }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 1000 });
      await control(request, "reset", {
        representativeCatalog: true,
        users: [{ email: "admin@example.invalid" }],
      });
      const source = await control(request, "catalog-state");
      await openWorkspace(page, lang);
      const timings: object[] = [];
      for (const slug of ["notion", "attio", "asana", "chronokura"]) {
        const raw = source.tools.find(
          (item: { slug: string }) => item.slug === slug,
        );
        await page
          .getByRole("button", {
            name: `${lang === "fr" ? "Édition directe" : "Direct editing"} · ${raw.name}`,
            exact: true,
          })
          .click();
        await expect(field(page, "name")).toHaveValue(raw.name);
        const path = lang === "fr" ? "shortDescription" : "shortDescriptionEn";
        await expect(field(page, path)).toHaveValue(raw[path] ?? "");
        if (slug === "notion") {
          const planPath = lang === "fr" ? "pricing_v5.plans.0" : "pricing_v5En.plans.0";
          const amount = field(page, `${planPath}.nativeAmount`);
          const currency = field(page, `${planPath}.nativeCurrency`);
          const amountBox = (await amount.boundingBox())!;
          const currencyBox = (await currency.boundingBox())!;
          expect(currencyBox.x).toBeCloseTo(amountBox.x, 0);
          expect(currencyBox.y).toBeGreaterThanOrEqual(amountBox.y + amountBox.height);
        }
        // Merely opening the actual record must not populate translations, observations or drafts.
        expect(
          (await control(request, "catalog-state")).drafts.some(
            (d: { slug: string }) => d.slug === slug,
          ),
        ).toBe(false);
        await expandSettings(page);
        await expect(field(page, "host_app").locator("option")).toHaveCount(
          activeVocabulary.length + 1,
        );
        const input = field(page, path);
        await input.focus();
        await input.selectText();
        const text = `Acceptance ${lang} ${slug}`;
        await input.evaluate((node) => {
          const samples: number[] = [];
          (window as any).__catalogInputPaint = samples;
          let start = 0;
          node.addEventListener("beforeinput", () => {
            start = performance.now();
          });
          node.addEventListener("input", () => {
            const began = start;
            requestAnimationFrame(() =>
              samples.push(performance.now() - began),
            );
          });
        });
        const start = Date.now();
        await page.keyboard.type(text);
        await expect(input).toHaveValue(text);
        await expect(input).toBeFocused();
        const typingWallMs = Date.now() - start;
        const eventToPaintMs = await page.evaluate(async () => {
          await new Promise(requestAnimationFrame);
          const samples = (
            (window as any).__catalogInputPaint as number[]
          ).sort((a, b) => a - b);
          return {
            samples: samples.length,
            median: samples[Math.floor(samples.length / 2)],
            p95: samples[Math.floor(samples.length * 0.95)],
            max: samples.at(-1),
          };
        });
        timings.push({
          slug,
          width,
          lang,
          typingWallMs,
          eventToPaintMs,
          options: await page.locator("[data-catalog-editor] option").count(),
        });
        await expect(
          page.locator("[data-catalog-toolbar] [role=status]"),
        ).toHaveText(lang === "fr" ? "Brouillon enregistré" : "Draft saved");
        const saved = (await control(request, "catalog-state")).drafts.find(
          (d: { slug: string }) => d.slug === slug,
        );
        expect(saved.value).toEqual({ ...raw, [path]: text });
        await page.reload();
        await expect(field(page, path)).toHaveValue(text);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (slug === "notion" && width !== 768) {
          expect(page.viewportSize()?.width).toBe(width);
          for (const [area, locator] of [
            ["top", page.locator(".td-hero-card")],
            ["pricing", page.locator(".td-pricing")],
          ] as const) {
            await locator.scrollIntoViewIfNeeded();
            await page.screenshot({
              path: test
                .info()
                .outputPath(`${slug}-${lang}-${width}-${area}-viewport.png`),
              animations: "disabled",
            });
          }
          await page
            .locator("[data-catalog-settings] > summary")
            .filter({
              hasText:
                lang === "fr"
                  ? "Écosystème et contenus associés"
                  : "Ecosystem and related content",
            })
            .click();
          await field(page, "host_app").scrollIntoViewIfNeeded();
          await page.screenshot({
            path: test
              .info()
              .outputPath(`${slug}-${lang}-${width}-advanced-viewport.png`),
            animations: "disabled",
          });
        }
        await page
          .getByRole("button", {
            name: lang === "fr" ? "Retour aux fiches" : "Back to records",
            exact: true,
          })
          .click();
      }
      console.info(
        JSON.stringify({
          rawCatalogue: toolsIndex.length,
          activeVocabulary: activeVocabulary.length,
          fullVocabularyInput: timings,
        }),
      );
      expect(
        (await control(request, "state")).requests.filter(
          (r: { method: string; path: string }) =>
            r.method === "POST" && r.path === "/api/backoffice-catalog",
        ),
      ).toEqual([]);
    });
  }

test("missing families: first additions, collection order/focus, interleaved undo, IME and durable raw reload", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 768, height: 1100 });
  await control(request, "reset", {
    representativeCatalog: true,
    users: [{ email: "admin@example.invalid" }],
  });
  await openWorkspace(page, "fr");
  await page
    .getByRole("button", {
      name: "Édition directe · Empty fixture",
      exact: true,
    })
    .click();
  await expandSettings(page);
  // Lists are created in their business blocks; undo merges into the latest draft.
  const gallery = page.locator('[data-catalog-path="galleryImages"]');
  await gallery
    .getByRole("button", { name: "Ajouter Galerie", exact: true })
    .click();
  await field(page, "galleryImages.0").fill("https://example.invalid/one.webp");
  await gallery
    .getByRole("button", { name: "Ajouter Galerie", exact: true })
    .click();
  await field(page, "galleryImages.1").fill("https://example.invalid/two.webp");
  await field(page, "galleryImages.1").focus();
  await gallery
    .getByRole("button", { name: "Monter", exact: true })
    .nth(1)
    .click();
  await expect(field(page, "galleryImages.0")).toBeFocused();
  await expect(field(page, "galleryImages.0")).toHaveValue(
    "https://example.invalid/two.webp",
  );
  await gallery
    .getByRole("button", { name: "Retirer Galerie", exact: true })
    .click();
  await field(page, "longDescription").fill("Première analyse détaillée.");
  await gallery
    .getByRole("button", {
      name: "Annuler le retrait de la liste",
      exact: true,
    })
    .click();
  await page
    .locator('[data-catalog-path="pros"]')
    .getByRole("button", {
      name: "Ajouter Points forts · français",
      exact: true,
    })
    .click();
  await field(page, "pros.0").fill("Premier avantage vérifié");
  await page
    .locator('[data-catalog-path="covers"]')
    .getByRole("button", {
      name: "Ajouter Fonctionnalités couvertes",
      exact: true,
    })
    .click();
  await field(page, "covers.0").selectOption({ index: 1 });
  await page
    .locator('[data-catalog-path="relevantFor"]')
    .getByRole("button", { name: "Ajouter Publics · français", exact: true })
    .click();
  await field(page, "relevantFor.0").fill("Petite équipe");
  await page
    .getByRole("button", { name: "Ajouter Verdict · français", exact: true })
    .click();
  await field(page, "verdict.threshold").fill("Tester ce besoin précis");
  await page
    .locator('[data-catalog-path="relations"]')
    .getByRole("button", { name: "Ajouter Relations", exact: true })
    .click();
  await field(page, "relations.0.targetToolId").selectOption("notion");
  await field(page, "relations.0.kind").fill("complement");
  await page
    .getByRole("button", { name: "Ajouter Cycle de vie", exact: true })
    .click();
  await field(page, "lifecycle.status").fill("active");
  await gallery
    .getByRole("button", { name: "Retirer cet élément", exact: true })
    .first()
    .click();
  await field(page, "name").fill("Empty fixture edited");
  await gallery
    .getByRole("button", { name: "Annuler le retrait", exact: true })
    .click();
  await expect(field(page, "name")).toHaveValue("Empty fixture edited");
  await expect(field(page, "galleryImages.0")).toHaveValue(
    "https://example.invalid/two.webp",
  );
  await field(page, "websiteUrl").fill("https://example.invalid/official");
  await field(page, "category").selectOption("productivity");
  await page
    .getByRole("button", { name: "Ajouter Notation ToolTrim", exact: true })
    .click();
  await field(page, "toolTrimRating.puissance").fill("4");
  await page
    .getByRole("button", { name: "Ajouter Référencement", exact: true })
    .click();
  await field(page, "seo.presentationTitleFr").fill("Titre de recette");
  await page
    .getByRole("button", { name: "Ajouter une offre", exact: true })
    .click();
  await field(page, "pricing_v5.plans.0.displayName").fill("Essai sur devis");
  await field(page, "pricing_v5.plans.0.priceStatus").selectOption("quote");
  const description = field(page, "shortDescription");
  await description.dispatchEvent("compositionstart");
  await description.fill("日本語の説明");
  // A composition must not write an incomplete text snapshot.
  await description.dispatchEvent("compositionend", { data: "日本語の説明" });
  await expect(description).toHaveValue("日本語の説明");
  await expect(page.locator("[data-catalog-toolbar] [role=status]")).toHaveText(
    "Brouillon enregistré",
  );
  const snapshot = (await control(request, "catalog-state")).drafts[0].value;
  expect(snapshot.customUnknown).toEqual({ preserve: true });
  expect(snapshot.galleryImages).toEqual([
    "https://example.invalid/two.webp",
    "https://example.invalid/one.webp",
  ]);
  expect(snapshot.pricing_v5.plans[0]).toMatchObject({
    priceStatus: "quote",
    nativeAmount: null,
    isFree: false,
  });
  await page.reload();
  await expect(field(page, "shortDescription")).toHaveValue("日本語の説明");
  await expandSettings(page);
  await expect(field(page, "seo.presentationTitleFr")).toHaveValue(
    "Titre de recette",
  );
  // Browser layout at 200% equivalent viewport, dark and reduced-motion preferences.
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await field(page, "shortDescription").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: test.info().outputPath("missing-families-dark-390-viewport.png"),
    animations: "disabled",
  });
});

test("draft preview shows the current price and returns to the same editor", async ({ page, request }) => {
  await control(request, "reset", { representativeCatalog: true, users: [{ email: "admin@example.invalid" }] });
  await openWorkspace(page, "fr");
  await page.getByRole("button", { name: "Édition directe · Notion", exact: true }).click();
  const editor = page.locator("[data-catalog-editor]");
  await expect(editor.getByRole("heading", { level: 1, name: "Notion" })).toBeVisible();
  await expect(editor.getByRole("link", { name: /Tarifs officiels|Visiter Notion|Comparer les alternatives/ })).toHaveCount(0);
  const amount = field(page, "pricing_v5.plans.1.nativeAmount");
  await amount.fill("123");
  await page.getByRole("button", { name: "Aperçu", exact: true }).click();
  const preview = page.getByTestId("catalog-live-preview");
  await expect(preview.getByRole("button", { name: "Revenir à l’édition" })).toBeFocused();
  const video = preview.locator(".tg-video-poster").first();
  await expect(video).toBeDisabled();
  await expect(preview.locator("iframe, video")).toHaveCount(0);
  await preview.getByRole("button", { name: "Prix", exact: true }).click();
  await expect(preview).toContainText("123");
  await preview.getByRole("button", { name: "Revenir à l’édition" }).click();
  await expect(amount).toHaveValue("123");
  await expect(page.getByRole("button", { name: "Aperçu", exact: true })).toBeFocused();
});
