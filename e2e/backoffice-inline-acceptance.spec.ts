import { test, expect, control, dismissConsent } from "./fixtures/accounts";
import type { Page } from "@playwright/test";
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
const editor = (page: Page) => page.locator("[data-catalog-editor]");
const done = (page: Page, lang: "fr" | "en" = "fr") => editor(page).getByRole("button", {
  name: lang === "fr" ? "Terminer" : "Done", exact: true,
});

for (const lang of ["fr", "en"] as const) {
  for (const width of [390, 768, 1280]) {
    test(`one-page fiche ${lang} ${width}: read, edit locally and reload durable data`, async ({ page, request }) => {
      await page.setViewportSize({ width, height: 900 });
      await control(request, "reset", { representativeCatalog: true, users: [{ email: "admin@example.invalid" }] });
      const source = await control(request, "catalog-state");
      await openWorkspace(page, lang);
      const raw = source.tools.find((row: {slug: string}) => row.slug === "notion");
      const path = lang === "fr" ? "shortDescription" : "shortDescriptionEn";
      await page.getByRole("button", { name: lang === "fr" ? "Édition directe · Notion" : "Direct editing · Notion" }).click();
      const edit = editor(page).getByRole("button", { name: lang === "fr" ? "Modifier la description" : "Edit description", exact: true });
      await expect(edit).toBeVisible();
      await expect(field(page, path)).toHaveCount(0);
      await expect(editor(page).getByText(raw[path], { exact: true })).toBeVisible();
      await edit.click();
      await field(page, path).fill("Input to discard");
      await editor(page).getByRole("button", { name: lang === "fr" ? "Annuler" : "Cancel", exact: true }).click();
      await expect(edit).toBeFocused();
      expect((await control(request, "catalog-state")).drafts).toEqual([]);
      await edit.click();
      await field(page, path).fill("Edited in the right block");
      await done(page, lang).click();
      await expect(editor(page).getByRole("status").filter({ hasText: lang === "fr" ? "Brouillon enregistré" : "Draft saved" })).toBeVisible();
      const saved = (await control(request, "catalog-state")).drafts.find((row: {slug:string}) => row.slug === "notion");
      expect(saved.value).toEqual({ ...raw, [path]: "Edited in the right block" });
      await page.reload();
      await expect(editor(page).getByText("Edited in the right block", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: test.info().outputPath(`one-page-${lang}-${width}.png`) });
    });
  }
}

test("offer actions and private price preview work on one page", async ({ page, request }) => {
  await control(request, "reset", { representativeCatalog: true, users: [{ email: "admin@example.invalid" }] });
  await openWorkspace(page, "fr");
  await page.getByRole("button", { name: "Édition directe · Notion", exact: true }).click();
  const pricing = editor(page).getByRole("region", { name: "Prix et offres" });
  await expect(pricing.getByRole("heading", { name: "Plus", exact: true })).toBeVisible();
  const add = pricing.getByRole("button", { name: "Ajouter une offre", exact: true });
  await add.click();
  await pricing.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(pricing.getByRole("heading", { name: "Nouvelle offre", exact: true })).toHaveCount(0);
  expect((await control(request, "catalog-state")).drafts).toEqual([]);
  await pricing.getByRole("button", { name: "Modifier Plus", exact: true }).click();
  const amount = field(page, "pricing_v5.plans.1.nativeAmount");
  await field(page, "pricing_v5.plans.1.priceStatus").selectOption("quote");
  await expect(amount).toHaveCount(0);
  await pricing.getByRole("button", { name: "Annuler", exact: true }).click();
  await pricing.getByRole("button", { name: "Modifier Plus", exact: true }).click();
  await amount.fill("123");
  await done(page).click();
  await expect(pricing.getByText(/123/).first()).toBeVisible();
  await editor(page).getByRole("button", { name: "Aperçu", exact: true }).click();
  const preview = page.getByTestId("catalog-live-preview");
  await expect(preview.getByRole("button", { name: "Revenir à l’édition" })).toBeFocused();
  await expect(preview.locator("iframe, video")).toHaveCount(0);
  await preview.getByRole("button", { name: "Prix", exact: true }).click();
  await expect(preview).toContainText("123");
  await preview.getByRole("button", { name: "Revenir à l’édition" }).click();
  await expect(editor(page).getByRole("button", { name: "Aperçu", exact: true })).toBeFocused();
});

test("tags add an existing identifier, undo a removal and cancel locally", async ({ page, request }) => {
  await control(request, "reset", { representativeCatalog: true, users: [{ email: "admin@example.invalid" }] });
  await openWorkspace(page, "fr");
  await page.getByRole("button", { name: "Édition directe · Notion", exact: true }).click();
  const usage = editor(page).getByRole("region", { name: "Usages et tags" });
  const edit = usage.getByRole("button", { name: /Modifier les usages|Ajouter des usages/ });
  const tags = usage.locator('[data-catalog-path="functional_needs"]');
  await edit.click();
  await tags.getByRole("button", { name: /Ajouter · Besoins fonctionnels/ }).click();
  const search = tags.getByRole("searchbox");
  await search.fill("terme totalement introuvable");
  await expect(tags.getByText("Aucun résultat.")).toBeVisible();
  await search.fill("");
  const results = tags.getByLabel("Suggestions");
  const label = (await results.getByRole("button").first().innerText()).trim();
  await results.getByRole("button", { name: label, exact: true }).click();
  await expect(results.getByRole("button", { name: label, exact: true })).toHaveCount(0);
  const remove = tags.getByRole("button", { name: "Retirer " + label, exact: true });
  await remove.click();
  await tags.getByRole("button", { name: "Annuler le retrait de " + label, exact: true }).click();
  await expect(remove).toBeVisible();
  await usage.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(edit).toBeFocused();
  expect((await control(request, "catalog-state")).drafts).toEqual([]);
});

test("navigation leaves a staged block open until it is applied or cancelled", async ({ page, request }) => {
  await control(request, "reset", { users: [{ email: "admin@example.invalid" }] });
  await openWorkspace(page, "fr");
  await page.getByRole("button", { name: "Édition directe · Notion", exact: true }).click();
  await editor(page).getByRole("button", { name: "Modifier la description", exact: true }).click();
  await field(page, "shortDescription").fill("Saisie à conserver");
  await editor(page).getByRole("button", { name: "Retour aux fiches", exact: true }).click();
  await expect(field(page, "shortDescription")).toHaveValue("Saisie à conserver");
  await expect(editor(page).getByRole("button", { name: "Aperçu", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Utilisateurs", exact: true }).click();
  await expect(field(page, "shortDescription")).toHaveValue("Saisie à conserver");
  await editor(page).getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(editor(page).getByText("Description française de test.", { exact: true })).toBeVisible();
  expect((await control(request, "catalog-state")).drafts).toEqual([]);
});
