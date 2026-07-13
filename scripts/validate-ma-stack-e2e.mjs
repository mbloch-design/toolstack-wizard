#!/usr/bin/env node
import { spawn } from "node:child_process";
import process from "node:process";
import { chromium } from "playwright";

const APP_URL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8080";
const STACK_URL = `${APP_URL}/fr/ma-stack`;
const STORAGE_KEY = "tooltrim-ma-stack-mvp-v2";
const BACKUP_KEY = `${STORAGE_KEY}-backup`;
const ADDED_AT = "2026-01-01T00:00:00.000Z";

const DEFAULT_NEEDS = [
  { id: "ia", labelFr: "Travailler avec l'IA", labelEn: "Work with AI", order: 10, source: "suggested" },
  { id: "organisation", labelFr: "Organiser mon travail", labelEn: "Organize my work", order: 20, source: "suggested" },
  { id: "design", labelFr: "Créer des visuels", labelEn: "Create visuals", order: 30, source: "suggested" },
  { id: "automation", labelFr: "Automatiser mes tâches", labelEn: "Automate my tasks", order: 40, source: "suggested" },
  { id: "marketing", labelFr: "Faire connaître mon activité", labelEn: "Promote my business", order: 50, source: "suggested" },
  { id: "vente", labelFr: "Vendre et suivre mes clients", labelEn: "Sell and manage clients", order: 60, source: "suggested" },
  { id: "finance", labelFr: "Gérer mes finances", labelEn: "Manage my finances", order: 70, source: "suggested" },
  { id: "dev", labelFr: "Développer mes produits", labelEn: "Build my products", order: 80, source: "suggested" },
];

function entry(toolSlug, needIds, assignmentMode = "manual") {
  return { toolSlug, needIds, assignmentMode, addedAt: ADDED_AT };
}

function stack(entries = [], customNeeds = []) {
  const needs = [...DEFAULT_NEEDS, ...customNeeds]
    .sort((a, b) => a.order - b.order)
    .map((need, index) => ({ ...need, order: (index + 1) * 10 }));
  return { version: 2, needs, toolEntries: entries, pinnedToolSlugs: entries.map((item) => item.toolSlug) };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  try {
    const response = await fetch(APP_URL);
    if (response.ok) return null;
  } catch {
    // Start the local server below.
  }

  const server = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1"], {
    cwd: process.cwd(),
    detached: false,
    stdio: "ignore",
  });
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const response = await fetch(APP_URL);
      if (response.ok) return server;
    } catch {
      // Retry while Vite starts.
    }
  }
  server.kill("SIGTERM");
  throw new Error(`Le serveur local ne répond pas sur ${APP_URL}`);
}

async function createScenario(browser, initialState = stack(), viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(({ backupKey, initialState, storageKey }) => {
    if (sessionStorage.getItem("tooltrim-ma-stack-e2e-seeded")) return;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(backupKey);
    localStorage.setItem(storageKey, JSON.stringify(initialState));
    sessionStorage.setItem("tooltrim-ma-stack-e2e-seeded", "1");
  }, { backupKey: BACKUP_KEY, initialState, storageKey: STORAGE_KEY });
  await page.goto(STACK_URL, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Ma stack", exact: true }).waitFor();
  return { context, page, pageErrors };
}

async function persisted(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), STORAGE_KEY);
}

async function until(check, message, timeout = 8000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error(message);
}

async function closeScenario(scenario) {
  assert(scenario.pageErrors.length === 0, `Erreur JavaScript navigateur : ${scenario.pageErrors.join(" | ")}`);
  await scenario.context.close();
}

async function openNeedsManager(page) {
  await page.locator('.stack-page-toolbar--overview summary[aria-label="Plus d’options"]').click();
  await page.getByRole("button", { name: "Gérer les besoins", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Gérer les besoins" });
  await dialog.waitFor();
  return dialog;
}

const checks = [];
const argValue = (name, fallback) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1] || fallback;
const startAt = Math.max(1, Number(argValue("start", process.env.MA_STACK_E2E_START || 1)));
const endAt = Math.min(9, Number(argValue("end", process.env.MA_STACK_E2E_END || 9)));
let runIndex = 0;
async function run(label, task) {
  runIndex += 1;
  if (runIndex < startAt || runIndex > endAt) return;
  await task();
  checks.push(label);
  console.log(`[OK] ${label}`);
}

const server = await waitForServer();
const browser = await chromium.launch({ headless: true });

try {
  await run("1. ajout global et rangement automatique", async () => {
    const scenario = await createScenario(browser);
    const { page } = scenario;
    await page.getByRole("button", { name: "Ajouter un premier outil", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Ajouter à Ma stack" });
    const search = picker.getByRole("searchbox");
    assert(await search.evaluate((element) => element === document.activeElement), "La recherche doit recevoir le focus initial");
    await search.fill("ChatGPT");
    const add = picker.getByRole("button", { name: "Ajouter ChatGPT à ma stack", exact: true });
    await add.click();
    await until(() => add.isDisabled(), "La ligne ChatGPT doit rester visible avec l’état Ajouté");
    await picker.getByRole("button", { name: "Fermer", exact: true }).click();
    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).waitFor();
    await until(async () => (await persisted(page)).toolEntries[0]?.assignmentMode === "auto", "ChatGPT doit être rangé automatiquement");
    const saved = await persisted(page);
    assert(saved.toolEntries[0].needIds.join() === "ia", "ChatGPT doit être rangé dans IA");
    await closeScenario(scenario);
  });

  await run("2. ajout contextuel dans un besoin", async () => {
    const scenario = await createScenario(browser, stack([entry("chatgpt", ["ia"])]));
    const { page } = scenario;
    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Ajouter des outils IA" });
    await picker.getByRole("searchbox").fill("Claude");
    await picker.getByRole("button", { name: "Ajouter Claude à ma stack", exact: true }).click();
    await picker.getByRole("button", { name: "Fermer", exact: true }).click();
    await page.getByRole("link", { name: /Claude/ }).waitFor();
    assert((await persisted(page)).toolEntries.find((item) => item.toolSlug === "claude")?.needIds.join() === "ia", "Claude doit être rangé dans IA");
    await closeScenario(scenario);
  });

  await run("3. À ranger puis correction", async () => {
    const scenario = await createScenario(browser, stack([entry("circle", [])]));
    const { page } = scenario;
    const unassigned = page.getByRole("region", { name: "À ranger", exact: true });
    await unassigned.getByRole("button", { name: "Examiner les outils à ranger", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Circle" });
    await dialog.getByRole("checkbox", { name: "Faire connaître mon activité", exact: true }).check();
    await dialog.getByRole("button", { name: "Enregistrer le rangement", exact: true }).click();
    await page.getByRole("region", { name: "Faire connaître mon activité", exact: true }).waitFor();
    assert((await persisted(page)).toolEntries[0].needIds.join() === "marketing", "Circle doit quitter À ranger pour Marketing");
    await closeScenario(scenario);
  });

  await run("4. multi-affectation avec coût unique", async () => {
    const scenario = await createScenario(browser, stack([entry("chatgpt", ["ia", "design"])]));
    const { page } = scenario;
    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();
    await page.getByLabel("Coût mensuel estimé : 17 €/mois", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Retour à Ma stack", exact: true }).click();
    await page.getByRole("button", { name: "Ouvrir Créer des visuels", exact: true }).click();
    await page.getByLabel("Coût mensuel estimé : 17 €/mois", { exact: true }).waitFor();
    const saved = await persisted(page);
    assert(saved.pinnedToolSlugs.length === 1 && saved.toolEntries.length === 1, "Un outil multi-besoins doit rester unique");
    await closeScenario(scenario);
  });

  await run("5. rechargement, ordre et affectations conservés", async () => {
    const needA = { id: "custom-a", labelFr: "Besoin A", labelEn: "Besoin A", order: 90, source: "custom" };
    const needB = { id: "custom-b", labelFr: "Besoin B", labelEn: "Besoin B", order: 100, source: "custom" };
    const scenario = await createScenario(browser, stack([entry("chatgpt", ["ia"]), entry("circle", ["custom-a"])], [needA, needB]));
    const { page } = scenario;
    const manager = await openNeedsManager(page);
    await manager.getByRole("button", { name: "Monter Besoin B", exact: true }).click();
    await manager.getByRole("button", { name: "Fermer", exact: true }).click();
    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();
    await page.getByRole("button", { name: "Modifier ChatGPT", exact: true }).click();
    const assignment = page.getByRole("dialog", { name: "ChatGPT" });
    await assignment.getByRole("checkbox", { name: "Créer des visuels", exact: true }).check();
    await assignment.getByRole("button", { name: "Enregistrer le rangement", exact: true }).click();
    await page.reload({ waitUntil: "networkidle" });
    const saved = await persisted(page);
    assert(saved.toolEntries.find((item) => item.toolSlug === "chatgpt")?.needIds.join() === "ia,design", "La multi-affectation doit survivre au reload");
    assert(saved.needs.findIndex((need) => need.id === "custom-b") < saved.needs.findIndex((need) => need.id === "custom-a"), "L’ordre des besoins doit survivre au reload");
    await closeScenario(scenario);
  });

  await run("6. retrait d’un besoin sans retirer l’outil", async () => {
    const scenario = await createScenario(browser, stack([entry("chatgpt", ["ia", "design"])]));
    const { page } = scenario;
    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();
    await page.getByRole("button", { name: "Modifier ChatGPT", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "ChatGPT" });
    await dialog.getByRole("checkbox", { name: "Travailler avec l'IA", exact: true }).uncheck();
    await dialog.getByRole("button", { name: "Enregistrer le rangement", exact: true }).click();
    const saved = await persisted(page);
    assert(saved.pinnedToolSlugs.join() === "chatgpt" && saved.toolEntries[0].needIds.join() === "design", "ChatGPT doit rester dans Ma stack et dans Design");
    await closeScenario(scenario);
  });

  await run("7. suppression complète d’un outil", async () => {
    const scenario = await createScenario(browser, stack([entry("chatgpt", ["ia"])]));
    const { page } = scenario;
    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();
    await page.getByRole("button", { name: "Modifier ChatGPT", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "ChatGPT" });
    page.once("dialog", (confirmation) => confirmation.accept());
    await dialog.locator('summary[aria-label="Plus d’options"]').click();
    await dialog.getByRole("button", { name: "Supprimer de Ma stack", exact: true }).click();
    await page.getByText("Votre vue d'ensemble est vide", { exact: true }).waitFor();
    const saved = await persisted(page);
    assert(saved.pinnedToolSlugs.length === 0 && saved.toolEntries.length === 0, "L’outil supprimé ne doit laisser aucune affectation");
    await closeScenario(scenario);
  });

  await run("8. suppression d’un besoin renvoie ses outils dans À ranger", async () => {
    const customNeed = { id: "custom-formation", labelFr: "Créer une formation", labelEn: "Create a course", order: 90, source: "custom" };
    const scenario = await createScenario(browser, stack([entry("circle", [customNeed.id])], [customNeed]));
    const { page } = scenario;
    const manager = await openNeedsManager(page);
    await manager.getByRole("button", { name: "Supprimer le besoin Créer une formation", exact: true }).click();
    await manager.getByRole("button", { name: "Fermer", exact: true }).click();
    await page.getByRole("region", { name: "À ranger", exact: true }).waitFor();
    const saved = await persisted(page);
    assert(saved.pinnedToolSlugs.join() === "circle" && saved.toolEntries[0].needIds.length === 0, "L’outil orphelin doit rester dans Ma stack et revenir dans À ranger");
    await closeScenario(scenario);
  });

  await run("9. clavier et responsive 320–1440 px", async () => {
    const scenario = await createScenario(browser, stack([entry("chatgpt", ["ia"])]));
    const { page } = scenario;
    await page.getByRole("button", { name: "Ouvrir Travailler avec l'IA", exact: true }).click();
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 1, `Débordement horizontal de ${overflow}px à ${width}px`);
      if (width <= 390) {
        const card = await page.locator(".stack-role-tool-card").first().boundingBox();
        const edit = await page.getByRole("button", { name: "Modifier ChatGPT", exact: true }).boundingBox();
        assert(card && card.height >= 110 && card.height <= 130, `Carte mobile hors cible à ${width}px`);
        assert(edit && edit.width >= 44 && edit.height >= 44, `Cible tactile trop petite à ${width}px (${edit ? `${edit.width}×${edit.height}` : "absente"})`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Ajouter des outils IA" });
    const search = picker.getByRole("searchbox");
    assert(await search.evaluate((element) => element === document.activeElement), "Le focus initial du picker doit être la recherche");
    const overlayOrder = await page.evaluate(() => ({
      picker: Number.parseInt(getComputedStyle(document.querySelector(".stack-tool-picker-backdrop")).zIndex, 10),
      navigation: Number.parseInt(getComputedStyle(document.querySelector(".asv2-bottomnav")).zIndex, 10),
    }));
    assert(overlayOrder.picker > overlayOrder.navigation, "Le sélecteur mobile doit recouvrir la navigation fixe");
    await page.keyboard.press("Escape");
    assert(!(await picker.isVisible()), "Échap doit fermer le picker");
    await closeScenario(scenario);
  });
} finally {
  await browser.close();
  if (server) server.kill("SIGTERM");
}

console.log(`\nMa stack E2E verdict: PASS (${checks.length} parcours exécutés, ${startAt}–${endAt})`);
