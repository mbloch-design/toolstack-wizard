import { expect, test, type Page } from "playwright/test";

const APP_URL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8080";
const STACK_URL = `${APP_URL}/fr/ma-stack`;
const STORAGE_KEY = "tooltrim-ma-stack-mvp-v2";
const BACKUP_KEY = `${STORAGE_KEY}-backup`;
const ADDED_AT = "2026-01-01T00:00:00.000Z";

type Need = {
  id: string;
  labelFr: string;
  labelEn: string;
  order: number;
  source: "suggested" | "custom";
};

type Entry = {
  toolSlug: string;
  needIds: string[];
  addedAt: string;
  assignmentMode: "pending" | "auto" | "manual";
};

type StackState = {
  version: 2;
  needs: Need[];
  toolEntries: Entry[];
  pinnedToolSlugs: string[];
};

const DEFAULT_NEEDS: Need[] = [
  { id: "ia", labelFr: "Travailler avec l'IA", labelEn: "Work with AI", order: 10, source: "suggested" },
  { id: "organisation", labelFr: "Organiser mon travail", labelEn: "Organize my work", order: 20, source: "suggested" },
  { id: "design", labelFr: "Créer des visuels", labelEn: "Create visuals", order: 30, source: "suggested" },
  { id: "automation", labelFr: "Automatiser mes tâches", labelEn: "Automate my tasks", order: 40, source: "suggested" },
  { id: "marketing", labelFr: "Faire connaître mon activité", labelEn: "Promote my business", order: 50, source: "suggested" },
  { id: "vente", labelFr: "Vendre et suivre mes clients", labelEn: "Sell and manage clients", order: 60, source: "suggested" },
  { id: "finance", labelFr: "Gérer mes finances", labelEn: "Manage my finances", order: 70, source: "suggested" },
  { id: "dev", labelFr: "Développer mes produits", labelEn: "Build my products", order: 80, source: "suggested" },
];

function entry(toolSlug: string, needIds: string[], assignmentMode: Entry["assignmentMode"] = "manual"): Entry {
  return { toolSlug, needIds, assignmentMode, addedAt: ADDED_AT };
}

function stack(entries: Entry[] = [], customNeeds: Need[] = []): StackState {
  const needs = [...DEFAULT_NEEDS, ...customNeeds]
    .sort((a, b) => a.order - b.order)
    .map((need, index) => ({ ...need, order: (index + 1) * 10 }));
  return {
    version: 2,
    needs,
    toolEntries: entries,
    pinnedToolSlugs: entries.map((item) => item.toolSlug),
  };
}

async function openStack(page: Page, initialState = stack()) {
  await page.addInitScript(({ backupKey, initialState, storageKey }) => {
    if (sessionStorage.getItem("tooltrim-ma-stack-e2e-seeded")) return;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(backupKey);
    localStorage.setItem(storageKey, JSON.stringify(initialState));
    sessionStorage.setItem("tooltrim-ma-stack-e2e-seeded", "1");
  }, { backupKey: BACKUP_KEY, initialState, storageKey: STORAGE_KEY });
  await page.goto(STACK_URL);
  await expect(page.getByRole("heading", { name: "Ma stack", exact: true })).toBeVisible();
}

async function storedStack(page: Page): Promise<StackState> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), STORAGE_KEY);
}

function board(page: Page, name: string) {
  return page.getByRole("region", { name, exact: true });
}

async function openNeedsManager(page: Page) {
  await page.locator('.stack-page-toolbar--overview summary[aria-label="Plus d’options"]').click();
  await page.getByRole("button", { name: "Gérer les besoins", exact: true }).click();
  return page.getByRole("dialog", { name: "Gérer les besoins" });
}

test.describe("Ma stack — parcours essentiels MVP", () => {
  test("1. stack vide → ajout global → classement automatique → vue d'ensemble", async ({ page }) => {
    await openStack(page);
    await expect(page.getByText("Votre vue d'ensemble est vide", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Ajouter un premier outil", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Ajouter à Ma stack" });
    await picker.getByRole("searchbox", { name: /Rechercher un outil/ }).fill("ChatGPT");
    await picker.getByRole("button", { name: "Ajouter ChatGPT à ma stack", exact: true }).click();
    await expect(picker.getByRole("button", { name: "Ajouter ChatGPT à ma stack", exact: true })).toBeDisabled();
    await picker.getByRole("button", { name: "Fermer", exact: true }).click();

    await expect(page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true })).toBeVisible();
    await expect.poll(async () => (await storedStack(page)).toolEntries[0]).toMatchObject({
      toolSlug: "chatgpt",
      needIds: ["ia"],
      assignmentMode: "auto",
    });
  });

  test("2. ajout depuis un besoin → outil visible dans le bon lot", async ({ page }) => {
    await openStack(page, stack([entry("chatgpt", ["ia"])]));
    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();

    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Ajouter des outils IA" });
    await picker.getByRole("searchbox", { name: /Rechercher un outil/ }).fill("Claude");
    await picker.getByRole("button", { name: "Ajouter Claude à ma stack", exact: true }).click();
    await picker.getByRole("button", { name: "Fermer", exact: true }).click();

    await expect(page.getByRole("main", { name: /Détail Travailler avec l'IA/ }).getByRole("link", { name: /Claude/ })).toBeVisible();
    await expect.poll(async () => (await storedStack(page)).toolEntries.find((item) => item.toolSlug === "claude")?.needIds).toEqual(["ia"]);
  });

  test("3. outil incertain → À ranger → correction", async ({ page }) => {
    await openStack(page, stack([entry("circle", [])]));
    const unassigned = board(page, "À ranger");
    await expect(unassigned).toBeVisible();
    await unassigned.getByRole("button", { name: "Examiner les outils à ranger", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Circle" });
    await dialog.getByRole("checkbox", { name: "Faire connaître mon activité", exact: true }).check();
    await dialog.getByRole("button", { name: "Enregistrer le rangement", exact: true }).click();

    await expect(board(page, "Faire connaître mon activité")).toBeVisible();
    await expect(board(page, "À ranger")).toHaveCount(0);
    await expect.poll(async () => (await storedStack(page)).toolEntries[0].needIds).toEqual(["marketing"]);
  });

  test("4. multi-affectation → plusieurs besoins, un outil et un coût uniques", async ({ page }) => {
    await openStack(page, stack([entry("chatgpt", ["ia", "design"])]));
    await expect(page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ouvrir Créer des visuels", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();
    await expect(page.getByLabel("Coût mensuel estimé : 17 €/mois", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Retour à Ma stack", exact: true }).click();
    await page.getByRole("button", { name: "Ouvrir Créer des visuels", exact: true }).click();
    await expect(page.getByLabel("Coût mensuel estimé : 17 €/mois", { exact: true })).toBeVisible();

    const persisted = await storedStack(page);
    expect(persisted.pinnedToolSlugs).toEqual(["chatgpt"]);
    expect(persisted.toolEntries).toHaveLength(1);
  });

  test("5. rechargement → besoins, ordre et affectations conservés", async ({ page }) => {
    const needA: Need = { id: "custom-a", labelFr: "Besoin A", labelEn: "Besoin A", order: 90, source: "custom" };
    const needB: Need = { id: "custom-b", labelFr: "Besoin B", labelEn: "Besoin B", order: 100, source: "custom" };
    await openStack(page, stack([
      entry("chatgpt", ["ia"]),
      entry("circle", ["custom-a"]),
    ], [needA, needB]));

    const manager = await openNeedsManager(page);
    await manager.getByRole("button", { name: "Monter Besoin B", exact: true }).click();
    await manager.getByRole("button", { name: "Fermer", exact: true }).click();

    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();
    await page.getByRole("button", { name: "Modifier ChatGPT", exact: true }).click();
    const assignment = page.getByRole("dialog", { name: "ChatGPT" });
    await assignment.getByRole("checkbox", { name: "Créer des visuels", exact: true }).check();
    await assignment.getByRole("button", { name: "Enregistrer le rangement", exact: true }).click();
    await page.getByRole("button", { name: "Retour à Ma stack", exact: true }).click();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Ma stack", exact: true })).toBeVisible();
    const persisted = await storedStack(page);
    expect(persisted.toolEntries.find((item) => item.toolSlug === "chatgpt")?.needIds).toEqual(["ia", "design"]);
    expect(persisted.needs.findIndex((need) => need.id === "custom-b")).toBeLessThan(
      persisted.needs.findIndex((need) => need.id === "custom-a"),
    );
    await expect(page.getByRole("button", { name: "Ouvrir Créer des visuels", exact: true })).toBeVisible();
  });

  test("6. retrait d'un besoin → outil conservé dans Ma stack", async ({ page }) => {
    await openStack(page, stack([entry("chatgpt", ["ia", "design"])]));
    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();
    await page.getByRole("button", { name: "Modifier ChatGPT", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "ChatGPT" });
    await dialog.getByRole("checkbox", { name: "Travailler avec l'IA", exact: true }).uncheck();
    await dialog.getByRole("button", { name: "Enregistrer le rangement", exact: true }).click();

    await expect(page.getByRole("button", { name: "Ouvrir Créer des visuels", exact: true })).toBeVisible();
    const persisted = await storedStack(page);
    expect(persisted.pinnedToolSlugs).toEqual(["chatgpt"]);
    expect(persisted.toolEntries[0].needIds).toEqual(["design"]);
  });

  test("7. suppression de Ma stack → outil et affectations supprimés", async ({ page }) => {
    await openStack(page, stack([entry("chatgpt", ["ia"])]));
    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();
    await page.getByRole("button", { name: "Modifier ChatGPT", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "ChatGPT" });
    page.once("dialog", (confirmation) => confirmation.accept());
    await dialog.locator('summary[aria-label="Plus d’options"]').click();
    await dialog.getByRole("button", { name: "Supprimer de Ma stack", exact: true }).click();

    await expect(page.getByText("Votre vue d'ensemble est vide", { exact: true })).toBeVisible();
    const persisted = await storedStack(page);
    expect(persisted.pinnedToolSlugs).toEqual([]);
    expect(persisted.toolEntries).toEqual([]);
  });

  test("8. besoin personnalisé supprimé → outils orphelins renvoyés dans À ranger", async ({ page }) => {
    const customNeed: Need = {
      id: "custom-formation",
      labelFr: "Créer une formation",
      labelEn: "Create a course",
      order: 90,
      source: "custom",
    };
    await openStack(page, stack([entry("circle", [customNeed.id])], [customNeed]));
    const manager = await openNeedsManager(page);
    await manager.getByRole("button", { name: "Supprimer le besoin Créer une formation", exact: true }).click();
    await manager.getByRole("button", { name: "Fermer", exact: true }).click();

    await expect(board(page, "À ranger")).toBeVisible();
    const persisted = await storedStack(page);
    expect(persisted.pinnedToolSlugs).toEqual(["circle"]);
    expect(persisted.toolEntries[0].needIds).toEqual([]);
    expect(persisted.needs.some((need) => need.id === customNeed.id)).toBe(false);
  });
});
