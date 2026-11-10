import { test, expect, control, dismissConsent } from "./fixtures/accounts";
async function openLegacy(page: import("@playwright/test").Page, name: string, lang: "fr" | "en") {
  const row = page.getByRole("listitem").filter({ has: page.getByRole("button", { name: `${lang === "fr" ? "Édition directe" : "Direct editing"} · ${name}`, exact: true }) });
  await row.getByText(lang === "fr" ? "Autres actions" : "More actions", { exact: true }).click();
  await row.getByRole("button", { name: `${lang === "fr" ? "Modifier" : "Edit"} ${name}`, exact: true }).click();
}
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
  if ((page.viewportSize()?.width ?? 1280) <= 640) await page.getByRole("button", { name: lang === "fr" ? "Ouvrir le menu" : "Open menu" }).click();
  await page
    .getByRole("button", {
      name: lang === "fr" ? "Fiches" : "Records",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: lang === "fr" ? "Fiches" : "Records",
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
      for (const name of ["Notion", "Figma"]) {
        await openLegacy(page, name, lang);
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
      if (width <= 640) await page.getByRole("button", { name: lang === "fr" ? "Ouvrir le menu" : "Open menu" }).click();
      await page
        .getByRole("button", {
          name: lang === "fr" ? "Fiches" : "Records",
          exact: true,
        })
        .click();
      const publish = page.getByRole("button", {
        name: lang === "fr" ? "Mettre en ligne (2)" : "Publish (2)",
        exact: true,
      });
      await expect(publish).toBeEnabled();
      await expect(publish).toHaveAttribute("data-variant", "primary");
      await publish.scrollIntoViewIfNeeded();
      await page.locator(".asv2-root").screenshot({
        path: test.info().outputPath(`${lang}-${width}-publish.png`),
      });
      await openLegacy(page, "Notion", lang);
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
          name: lang === "fr" ? "Mettre en ligne (0)" : "Publish (0)",
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
  await openLegacy(page, "Notion", "fr");
  const input = page.getByLabel("Description courte", { exact: true });
  await input.fill("Mes changements");
  await page.getByRole("button", { name: "Utilisateurs", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("avant de quitter");
  await expect(input).toHaveValue("Mes changements");
  await page.locator(".asv2-content").evaluate(el => { el.scrollTop = 0; });
  await page.getByRole("button", { name: "Me déconnecter", exact: true }).click();
  await expect(input).toHaveValue("Mes changements");
  await page.getByRole("link", { name: "Retour au site" }).click();
  await expect(page).toHaveURL(/\/fr\/back-office(?:\?view=catalog)?$/);
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
  await expect(page.getByText("Description française de test.", { exact: true })).toBeVisible();
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
  await openLegacy(page, "Notion", "fr");
  const input = page.getByLabel("Description courte", { exact: true });
  await input.fill("Texte à préserver");
  await page.goBack();
  await expect(page).toHaveURL(/\/fr\/back-office(?:\?view=catalog)?$/);
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

for (const lang of ["fr", "en"] as const)
  for (const width of [390, 1440])
    test(`direct fiche ${lang} ${width}: autosave, deep reopen and complete global review`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await control(request, "reset", {
        users: [{ email: "admin@example.invalid" }],
      });
      await login(page, lang);
      const direct = (name: string) =>
        page.getByRole("button", {
          name: `${lang === "fr" ? "Édition directe" : "Direct editing"} · ${name}`,
          exact: true,
        });
      const input = () =>
        page.getByLabel(
          lang === "fr"
            ? "Description courte · français"
            : "Short Description · English",
          { exact: true },
        );
      const back = () =>
        page.getByRole("button", {
          name: lang === "fr" ? "Retour aux fiches" : "Back to records",
          exact: true,
        });
      await direct("Notion").click();
      await expect(page).toHaveURL(
        new RegExp(
          `/${lang}/back-office\\?view=catalog&tool=notion&editor=inline`,
        ),
      );
      const editDescription = () => page.getByRole("button", { name: lang === "fr" ? "Modifier la description" : "Edit description", exact: true });
      const done = () => page.getByRole("button", { name: lang === "fr" ? "Terminer" : "Done", exact: true });
      await editDescription().click();
      await input().fill(`Draft ${lang} Notion`);
      await done().click();
      await page.getByRole("button", { name: lang === "fr" ? "Modifier l’identité" : "Edit identity", exact: true }).click();
      await page.getByLabel(lang === "fr" ? "Nom" : "Name", { exact: true }).fill("Notion edited");
      await done().click();
      await expect(page.locator("[data-catalog-toolbar] [role=status]")).toHaveText(
        lang === "fr" ? "Brouillon enregistré" : "Draft saved",
      );
      await page.reload();
      await expect(page.getByText(`Draft ${lang} Notion`, { exact: true })).toBeVisible();
      await expect(page.getByRole("navigation", { name: lang === "fr" ? "Sections de la fiche" : "Record sections" })).toBeVisible();
      await page.screenshot({ path: test.info().outputPath(`direct-${lang}-${width}.png`) });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await back().click();
      await direct("Figma").click();
      await editDescription().click();
      await input().fill(`Draft ${lang} Figma`);
      await done().click();
      await back().click();
      await page
        .getByRole("button", {
          name: new RegExp(lang === "fr" ? "^Mettre en ligne" : "^Publish \\("),
        })
        .click();
      const review = page.getByRole("region", {
        name: lang === "fr" ? "Modifications à publier" : "Changes to publish",
      });
      await expect(review).toContainText("Notion edited");
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
      await expect(page.locator(".bo-catalog > [role=status]")).toContainText(
        lang === "fr"
          ? "reconstruction du site doit encore"
          : "site rebuild must finish",
      );
      const calls = (await control(request, "state")).requests.filter(
        (r: { path: string; method: string }) =>
          r.path === "/api/backoffice-catalog" && r.method === "POST",
      );
      expect(calls).toHaveLength(1);
      expect(Object.keys(calls[0].input)).toEqual(["revision"]);
      // Raw personal/catalogue drafts never gain another browser persistence copy.
      expect(
        await page.evaluate(() =>
          Object.keys(localStorage).filter((k) =>
            /catalog.*draft|draft.*catalog/i.test(k),
          ),
        ),
      ).toEqual([]);
    });

test("direct fiche preserves pending text on autosave conflict and offers explicit recovery", async ({
  page,
  request,
}) => {
  await control(request, "reset", {
    users: [{ email: "admin@example.invalid" }],
  });
  await login(page, "fr");
  await page
    .getByRole("button", { name: "Édition directe · Notion", exact: true })
    .click();
  await control(request, "fault", {
    path: "/api/backoffice-catalog",
    method: "PUT",
    status: 409,
    code: "CATALOG_DRAFT_CONFLICT",
  });
  const input = page.getByLabel("Description courte · français", {
    exact: true,
  });
  await page.getByRole("button", { name: "Modifier la description", exact: true }).click();
  await input.fill("Pending conflict text");
  await page.getByRole("button", { name: "Terminer", exact: true }).click();
  await expect(page.locator("[data-catalog-editor] .bo-catalog-feedback[role=alert]")).toContainText(
    "changé ailleurs",
  );
  await expect(page.getByText("Pending conflict text", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Retour aux fiches", exact: true })
    .click();
  await expect(page.getByText("Pending conflict text", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Abandonner mes saisies", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Recharger la fiche", exact: true })
    .click();
  await expect(page.getByText("Description française de test.", { exact: true })).toBeVisible();
});

test('admin toolbar sign out and modified language click preserve pending catalogue text', async ({ page, request }) => {
  await control(request, 'reset', { users: [{ email: 'admin@example.invalid' }] });
  await login(page, 'fr');
  await openLegacy(page, "Notion", "fr");
  const input = page.getByLabel('Description courte', { exact: true });
  await input.fill('Saisie à conserver');
  const language = page.getByRole('link', { name: 'Site en français. Passer en anglais' });
  const prevented = await language.evaluate(el => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    let preventedByApp = false;
    document.addEventListener('click', click => { preventedByApp = click.defaultPrevented; click.preventDefault(); }, { once: true });
    el.dispatchEvent(event);
    return preventedByApp;
  });
  expect(prevented).toBe(false);
  const modifier = await page.evaluate(() => /Mac/.test(navigator.platform) ? 'Meta' : 'Control');
  const popupPromise = page.context().waitForEvent('page');
  await language.click({ modifiers: [modifier] });
  const popup = await popupPromise;
  await popup.close();
  await expect(input).toHaveValue('Saisie à conserver');
  await expect(page).toHaveURL(/\/fr\/back-office/);
  await page.locator('.asv2-content').evaluate(el => { el.scrollTop = 0; });
  await page.getByRole('button', { name: 'Me déconnecter', exact: true }).click();
  await expect(page.getByText(/Certaines modifications ne sont pas enregistrées/)).toBeVisible();
  await expect(input).toHaveValue('Saisie à conserver');
  await page.getByRole('button', { name: 'Continuer mes modifications' }).click();
  await page.getByRole('button', { name: 'Abandonner mes saisies' }).click();
  await language.click();
  await expect(page).toHaveURL(/\/en\/back-office\?view=catalog/);
});

test('mobile admin drawer traps initial reverse tab and explains a blocked section', async ({ page, request }) => {
  await control(request, 'reset', { users: [{ email: 'admin@example.invalid' }] });
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'fr');
  await openLegacy(page, "Notion", "fr");
  await page.getByLabel('Description courte', { exact: true }).fill('Saisie mobile');
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await dialog.getByRole('button', { name: 'Utilisateurs', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('avant de quitter');
  await expect(dialog).toBeVisible();
});

test('admin topbar exposes one guarded sign out for pending catalogue input', async ({ page, request }) => {
  await control(request, 'reset', { users: [{ email: 'admin@example.invalid' }] });
  await login(page, 'fr');
  await openLegacy(page, "Notion", "fr");
  const input = page.getByLabel('Description courte', { exact: true });
  await input.fill('Conserver avant déconnexion');
  await page.locator('.asv2-content').evaluate(el => { el.scrollTop = 0; });
  await page.getByRole('button', { name: 'Me déconnecter', exact: true }).click();
  await expect(page.getByText(/Certaines modifications ne sont pas enregistrées/)).toBeVisible();
  await expect(input).toHaveValue('Conserver avant déconnexion');
});

test('mobile admin drawer announces blocked navigation within the dialog', async ({ page, request }) => {
  await control(request, 'reset', { users: [{ email: 'admin@example.invalid' }] });
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'fr');
  await openLegacy(page, "Notion", "fr");
  await page.getByLabel('Description courte', { exact: true }).fill('Saisie à conserver');
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await dialog.getByRole('button', { name: 'Utilisateurs', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('avant de quitter', { timeout: 3000 });
});

test('mobile admin drawer explains blocked site and language links while keeping edits', async ({ page, request }) => {
  await control(request, 'reset', { users: [{ email: 'admin@example.invalid' }] });
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'fr');
  await openLegacy(page, "Notion", "fr");
  const input = page.getByLabel('Description courte', { exact: true });
  await input.fill('Brouillon à conserver');
  for (const name of ['Retour au site', 'English']) {
    await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await dialog.getByRole('link', { name, exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('avant de quitter', { timeout: 3000 });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/fr\/back-office\?view=catalog/);
    await dialog.getByRole('button', { name: 'Fermer le menu' }).click();
    await expect(input).toHaveValue('Brouillon à conserver');
  }
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  const modifier = await page.evaluate(() => /Mac/.test(navigator.platform) ? 'Meta' : 'Control');
  const popupPromise = page.context().waitForEvent('page');
  await dialog.getByRole('link', { name: 'English', exact: true }).click({ modifiers: [modifier] });
  const popup = await popupPromise;
  await popup.close();
  await expect(input).toHaveValue('Brouillon à conserver');
  await expect(page).toHaveURL(/\/fr\/back-office\?view=catalog/);
});
