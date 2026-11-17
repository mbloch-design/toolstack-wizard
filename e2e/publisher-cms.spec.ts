import { Buffer } from "node:buffer";
import type { Page } from "@playwright/test";
import type { ProductDraft } from "../src/lib/publisherCatalog";
import { test, expect, control, dismissConsent, signOut } from "./fixtures/accounts";

const tool = { id: "fixture-tool", slug: "publisher-fixture", name: "Publisher Fixture", canEdit: true };
const language = { shortDescription: null, productDescription: null, features: [], useCases: [] };

async function signIn(page: Page, lang: "fr" | "en", email: string) {
  await page.getByRole("link", { name: lang === "fr" ? "Se connecter" : "Sign in", exact: true }).first().click();
  await page.getByRole("button", { name: lang === "fr" ? "Continuer avec l’e-mail" : "Continue with email", exact: true }).click();
  await page.getByLabel(lang === "fr" ? "Adresse e-mail" : "Email address", { exact: true }).fill(email);
  await page.getByLabel(lang === "fr" ? "Mot de passe" : "Password", { exact: true }).fill("fixture-password");
  await page.locator(".ac-form").getByRole("button", { name: lang === "fr" ? "Se connecter" : "Sign in", exact: true }).click();
}

for (const { width, lang } of [{ width: 390, lang: "fr" }, { width: 768, lang: "en" }, { width: 1280, lang: "en" }] as const) {
  test(`publisher facts at ${width}px (${lang})`, async ({ page, request }) => {
    const ownerEmail = "editor@example.invalid";
    const guestEmail = "other@example.invalid";
    await control(request, "seed", { email: ownerEmail });
    await control(request, "seed", { email: guestEmail });
    const { accounts } = await control(request, "state");
    const owner = accounts.find((account: { email: string }) => account.email === ownerEmail).id;
    let value: ProductDraft = {
      schemaVersion: 1, name: tool.name, websiteUrl: "https://example.org",
      localized: { fr: language, en: language }, plans: [], media: [], classificationProposals: [], integrations: [],
    };
    let revision = 1;
    let submitted = false;
    let writes = 0;

    await page.route(/\/api\/(?:publisher-catalog|publisher-contributions|listing-requests)(?:\?|$)/, async (route) => {
      const req = route.request();
      const token = req.headers().authorization?.slice("Bearer ".length);
      const userId = token && JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")).sub;
      const url = new URL(req.url());
      if (!userId) return route.fulfill({ status: 401, json: { error: { code: "ACCOUNT_SESSION_INVALID" } } });
      if (url.pathname === "/api/listing-requests") return route.fulfill({ json: { listings: [], claims: [] } });
      if (!url.searchParams.has("tool")) return route.fulfill({ json: { tools: userId === owner ? [tool] : [] } });
      if (userId !== owner) return route.fulfill({ status: 403, json: { error: { code: "CMS_ACCESS_DENIED" } } });
      if (url.pathname === "/api/publisher-contributions") {
        const submission = { id: "fixture-proposal", status: "submitted", version: revision, submittedAt: new Date().toISOString() };
        if (req.method() === "POST") {
          expect(req.postDataJSON()).toEqual({ brandId: "brand", version: revision });
          submitted = true;
          return route.fulfill({ json: { submission } });
        }
        return route.fulfill({ json: { submissions: submitted ? [submission] : [] } });
      }
      if (req.method() === "PUT") {
        expect(req.postDataJSON().version).toBe(revision);
        value = req.postDataJSON().value;
        writes++;
        revision++;
      }
      return route.fulfill({ json: { draft: { brandId: "brand", version: revision, updatedAt: new Date().toISOString(), canEdit: true, value } } });
    });

    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${lang}/publisher`);
    await dismissConsent(page);
    await signIn(page, lang, ownerEmail);
    await expect(page).toHaveURL(new RegExp(`/${lang}/publisher$`));
    await page.getByRole("link", { name: lang === "fr" ? "Modifier la fiche" : "Edit listing" }).click();
    const edit = page.getByRole("button", { name: lang === "fr" ? "Modifier la présentation" : "Edit overview" });
    await edit.focus();
    await page.keyboard.press("Enter");
    const description = page.getByRole("textbox", { name: lang === "fr" ? "Description du produit" : "Product description", exact: true });
    await description.fill(lang === "fr" ? "Produit pour les petites équipes." : "Product for small teams.");
    await page.getByRole("button", { name: lang === "fr" ? "Enregistrer le brouillon" : "Save draft" }).click();
    await expect(page.getByText(lang === "fr" ? "Brouillon enregistré." : "Draft saved.")).toBeVisible();
    expect(writes).toBe(1);
    expect(value.localized[lang].productDescription).toContain(lang === "fr" ? "Produit" : "Product");
    await expect(page.getByRole("textbox", { name: /verdict|rating|notation/i })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);

    await page.reload();
    await expect(page.getByText(lang === "fr" ? "Produit pour les petites équipes." : "Product for small teams.")).toBeVisible();
    await page.getByRole("button", { name: lang === "fr" ? "Envoyer à ToolTrim" : "Send to ToolTrim" }).click();
    await page.getByRole("button", { name: lang === "fr" ? "Confirmer l’envoi" : "Confirm submission" }).click();
    await expect(page.getByText(lang === "fr" ? "Envoyée" : "Submitted", { exact: true })).toBeVisible();

    if (width === 1280) {
      await signOut(page, lang);
      await page.goto(`/${lang}/publisher/tools/${tool.slug}`);
      await expect(page.getByText("Product for small teams.")).toHaveCount(0);
      await signIn(page, lang, guestEmail);
      await expect(page.getByRole("alert")).toContainText("Your account cannot access this listing.");
      await expect(page.getByText("Product for small teams.")).toHaveCount(0);
    }
  });
}

test("publisher creates a standard application, supplies the badge and confirms a specific product revision", async ({ page, request }) => {
  const email = "new-publisher@example.invalid";
  await control(request, "seed", { email });
  const timestamp = "2026-11-17T13:00:00Z";
  const listing = {
    id: "f6ce53d9-5fa1-49cb-bc56-6d61d536df03", name: "New Product", websiteUrl: "https://publisher.example.org",
    slug: "new-product", offer: "standard_badge", status: "draft", version: 1, createdAt: timestamp,
    updatedAt: timestamp, commercialStatus: "pending", representationStatus: "pending", deliveryStatus: "unpublished",
    representativeRole: "", notes: "",
  };
  let created = false;
  const productRevision = {
    id: "factual-version-1", hash: "facts-hash", value: {
      schemaVersion: 1, name: listing.name, websiteUrl: listing.websiteUrl,
      localized: { fr: language, en: { ...language, shortDescription: "Product facts to confirm." } },
      plans: [], media: [], classificationProposals: [], integrations: [],
    },
  };
  let confirmation: { decision: string; note: string; productRevisionId: string } | null = null;
  await page.route(/\/api\/(?:publisher-catalog|listing-requests|listing-checkout|listing-review)(?:\?|$)/, async (route) => {
    const req = route.request();
    expect(req.headers().authorization).toMatch(/^Bearer /);
    const url = new URL(req.url());
    const body = req.method() === "POST" ? req.postDataJSON() : null;
    if (url.pathname === "/api/publisher-catalog") return route.fulfill({ json: { tools: [] } });
    if (url.pathname === "/api/listing-review") {
      if (body) {
        expect(body).toEqual({ action: "respondFactualReview", id: listing.id, version: listing.version,
          hash: productRevision.hash, productRevisionId: productRevision.id, decision: "confirm", note: "" });
        listing.status = "ready";
        listing.version++;
        confirmation = { decision: "confirm", note: "", productRevisionId: productRevision.id };
      }
      return route.fulfill({ json: { review: { listing, productRevision, editorialRevision: null, confirmation } } });
    }
    if (url.pathname === "/api/listing-checkout") {
      expect(body.listingId).toBe(listing.id);
      if (body.action === "checkBadge") listing.commercialStatus = "satisfied";
      return route.fulfill({ json: { state: listing.commercialStatus === "satisfied" ? "present" : "unchecked" } });
    }
    if (!body) return route.fulfill({ json: url.searchParams.has("id") ? { listing } : { listings: created ? [listing] : [], claims: [] } });
    if (body.action === "lookup") return route.fulfill({ json: { candidates: [] } });
    if (body.action === "create") {
      expect(body).toMatchObject({ name: listing.name, websiteUrl: listing.websiteUrl, offer: "standard_badge", locale: "en" });
      expect(body.idempotencyKey).toBeTruthy();
      created = true;
    } else if (body.action === "save") {
      expect(body.version).toBe(listing.version);
      listing.representativeRole = body.representativeRole;
      listing.version++;
    } else if (body.action === "submit") {
      expect(body.version).toBe(listing.version);
      expect(listing.representativeRole).toBe("Founder");
      expect(listing.commercialStatus).toBe("satisfied");
      listing.status = "submitted";
      listing.version++;
    }
    return route.fulfill({ json: { listing } });
  });

  await page.goto("/en/publisher");
  await dismissConsent(page);
  await signIn(page, "en", email);
  await page.getByRole("textbox", { name: "Tool name" }).fill(listing.name);
  await page.getByRole("textbox", { name: "Official website" }).fill(listing.websiteUrl);
  await page.getByRole("button", { name: "Search ToolTrim" }).click();
  await page.getByRole("button", { name: "Create application" }).click();
  await page.getByRole("button", { name: "Verify badge" }).click();
  await expect(page.getByText("Badge detected", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Your role with the tool" }).fill("Founder");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("button", { name: "Send to ToolTrim" }).click();
  await expect(page.getByText("Submitted to ToolTrim", { exact: true })).toBeVisible();
  listing.status = "facts_to_review";
  listing.version++;
  await page.reload();
  await expect(page.getByText("Product facts to confirm.")).toBeVisible();
  await page.getByRole("button", { name: "Confirm product facts" }).click();
  await page.getByRole("button", { name: "Send my response" }).click();
  await expect(page.getByText("You confirmed the facts for this version.")).toBeVisible();
  await expect(page.getByText("Unpublished", { exact: true })).toBeVisible();
});
