import { test, expect, control, dismissConsent } from "./fixtures/accounts";
async function login(page: import("@playwright/test").Page, lang: "fr" | "en") {
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
  await page
    .getByRole("button", {
      name: lang === "fr" ? "Fiches" : "Records",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: lang === "fr" ? "Fiches du catalogue" : "Catalogue records",
      exact: true,
    }),
  ).toBeVisible();
}
for (const lang of ["fr", "en"] as const)
  for (const width of [390, 1440])
    test(`catalogue editor ${lang} ${width}: durable drafts, preview and one global publication`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await control(request, "reset", {
        users: [{ email: "admin@example.invalid" }],
      });
      await login(page, lang);
      const edit = (name: string) =>
        page.getByRole("button", {
          name: `${lang === "fr" ? "Modifier" : "Edit"} ${name}`,
          exact: true,
        });
      for (const name of ["Notion", "Figma"]) {
        await edit(name).click();
        const editor = page.getByRole("region", {
          name: lang === "fr" ? "Modifier la fiche" : "Edit record",
          exact: true,
        });
        await editor
          .getByLabel(
            lang === "fr" ? "Description courte" : "Short description",
            { exact: true },
          )
          .fill(`Texte modifié pour ${name}`);
        await editor
          .getByRole("button", {
            name: lang === "fr" ? "Aperçu" : "Preview",
            exact: true,
          })
          .click();
        await expect(editor.getByTestId("catalog-preview")).toContainText(
          `Texte modifié pour ${name}`,
        );
        await editor
          .getByRole("button", {
            name: lang === "fr" ? "Revenir à l’édition" : "Back to editing",
            exact: true,
          })
          .click();
        await editor
          .getByRole("button", {
            name: lang === "fr" ? "Enregistrer le brouillon" : "Save draft",
            exact: true,
          })
          .click();
        await expect(page.getByRole("status")).toContainText(
          lang === "fr" ? "Brouillon enregistré" : "Draft saved",
        );
      }
      await page.reload();
      await page
        .getByRole("button", {
          name: lang === "fr" ? "Fiches" : "Records",
          exact: true,
        })
        .click();
      const publish = page.getByRole("button", {
        name:
          lang === "fr"
            ? "Publier toutes les modifications (2)"
            : "Publish all changes (2)",
        exact: true,
      });
      await expect(publish).toBeEnabled();
      await expect(publish).toHaveAttribute("data-variant", "primary");
      await page.locator(".bo-catalog-publishbar").scrollIntoViewIfNeeded();
      await page.locator(".asv2-root").screenshot({
        path: test.info().outputPath(`${lang}-${width}-publish.png`),
      });
      await edit("Notion").click();
      await expect(
        page.getByLabel(
          lang === "fr" ? "Description courte" : "Short description",
          { exact: true },
        ),
      ).toHaveValue("Texte modifié pour Notion");
      await page.locator(".asv2-root").screenshot({
        path: test.info().outputPath(`${lang}-${width}-editor.png`),
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await publish.click();
      const review = page.getByRole("region", {
        name: lang === "fr" ? "Modifications à publier" : "Changes to publish",
      });
      await expect(review).toContainText("Notion");
      await expect(review).toContainText("Figma");
      const before = (await control(request, "state")).requests;
      expect(
        before.filter(
          (r: { path: string; method: string }) =>
            r.path === "/api/backoffice-catalog" && r.method === "POST",
        ),
      ).toHaveLength(0);
      await review
        .getByRole("button", {
          name:
            lang === "fr"
              ? "Confirmer la publication de 2 fiches"
              : "Confirm publication of 2 records",
          exact: true,
        })
        .click();
      await expect(page.getByRole("status")).toContainText(
        lang === "fr" ? "Commit envoyé" : "Commit sent",
      );
      await expect(
        page.getByRole("button", {
          name:
            lang === "fr"
              ? "Publier toutes les modifications (0)"
              : "Publish all changes (0)",
          exact: true,
        }),
      ).toBeDisabled();
      const calls = (await control(request, "state")).requests.filter(
        (r: { path: string; method: string }) =>
          r.path === "/api/backoffice-catalog" && r.method === "POST",
      );
      expect(calls).toHaveLength(1);
      expect(calls[0].input).toEqual({ revision: 2 });
      await expect(
        page.getByRole("complementary", { includeHidden: true }),
      ).toHaveCount(1);
    });
test("catalogue retains text on conflict and prevents leaving through workspace navigation and site links", async ({
  page,
  request,
}) => {
  await control(request, "reset", {
    users: [{ email: "admin@example.invalid" }],
  });
  await login(page, "fr");
  await page
    .getByRole("button", { name: "Modifier Notion", exact: true })
    .click();
  const input = page.getByLabel("Description courte", { exact: true });
  await input.fill("Mes changements");
  await page.getByRole("button", { name: "Utilisateurs", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("avant de quitter");
  await expect(input).toHaveValue("Mes changements");
  await page.locator(".bo-account-toolbar .bo-signout").click();
  await expect(input).toHaveValue("Mes changements");
  await page.locator('a[href="/fr/tools"]').first().click();
  await expect(page).toHaveURL(/\/fr\/back-office$/);
  await expect(input).toHaveValue("Mes changements");
  await control(request, "fault", {
    path: "/api/backoffice-catalog",
    method: "PUT",
    status: 409,
    code: "CATALOG_DRAFT_CONFLICT",
  });
  await page
    .getByRole("button", { name: "Enregistrer le brouillon", exact: true })
    .click();
  await expect(page.locator(".bo-catalog [role=alert]")).toContainText(
    "modifié",
  );
  await expect(input).toHaveValue("Mes changements");
  await page
    .getByRole("button", { name: "Abandonner mes saisies", exact: true })
    .click();
  await expect(input).toHaveValue("Description française de test.");
  await page.getByRole("button", { name: "Utilisateurs", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Utilisateurs", exact: true }),
  ).toBeVisible();
});
test("browser Back and Forward preserve unsaved edits before returning to another app route", async ({
  page,
  request,
}) => {
  await control(request, "reset", {
    users: [{ email: "admin@example.invalid" }],
  });
  await login(page, "fr");
  await page.evaluate(() => {
    history.replaceState({ ...history.state, idx: 0 }, "", "/fr/tools");
    history.pushState({ ...history.state, idx: 1 }, "", "/fr/back-office");
  });
  await page
    .getByRole("button", { name: "Modifier Notion", exact: true })
    .click();
  const input = page.getByLabel("Description courte", { exact: true });
  await input.fill("Texte à préserver");
  await page.goBack();
  await expect(page).toHaveURL(/\/fr\/back-office$/);
  await expect(input).toHaveValue("Texte à préserver");
  await expect(page.locator(".bo-catalog [role=alert]")).toContainText(
    "enregistrées",
  );
  await page
    .getByRole("button", { name: "Abandonner mes saisies", exact: true })
    .click();
  await page.goBack();
  await expect(page).toHaveURL(/\/fr\/tools$/);
});
