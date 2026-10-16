import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpFixture } from "./http";

const llmsFull = `# ToolTrim canonical tool catalogue
# Records: 1

[
  {
    "name": "Notion",
    "slug": "notion",
    "url_fr": "https://tooltrim.com/fr/tool/notion",
    "url_en": "https://tooltrim.com/en/tool/notion",
    "pricing": { "free": "Plan gratuit", "paid": "Dès 9,50 €/mois" },
    "description_fr": "Espace de travail tout-en-un.",
    "price_verified_on": "2026-09-25",
    "verdict_fr": { "score": "3.6/5", "label": "Très bon", "keep_if": "Tu es seul", "avoid_if": "Tu fais de la BI lourde", "strengths": ["Export ouvert"], "weaknesses": ["Crédits IA en plus"] }
  }
]
`;

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(llmsFull, { status: 200 })));
});
afterEach(() => { vi.unstubAllGlobals(); });

const call = async (query: Record<string, string>, method = "GET") => {
  const { default: handler } = await import("../../api/tool-md");
  const h = httpFixture(undefined, method);
  h.req.query = query;
  h.req.headers.host = "tooltrim.com";
  let sent = "";
  const end = h.res.end.bind(h.res);
  (h.res as any).end = (chunk?: any) => { if (chunk) sent += String(chunk); return end(chunk); };
  await handler(h.req, h.res);
  return { status: h.res.statusCode, type: h.res.getHeader("Content-Type"), body: sent };
};

describe("tool-md", () => {
  it("renders the published facts and verdict as Markdown", async () => {
    const r = await call({ lang: "fr", slug: "notion" });
    expect(r.status).toBe(200);
    expect(String(r.type)).toContain("text/markdown");
    expect(r.body).toContain("# Notion");
    expect(r.body).toContain("**Note ToolTrim** : 3.6/5 (Très bon)");
    expect(r.body).toContain("**Prix vérifié le** : 25 septembre 2026");
    expect(r.body).toContain("## Points faibles");
    expect(r.body).toContain("jamais influencée par un paiement");
  });

  it("answers 404 for an unknown tool and 400 for a malformed slug", async () => {
    expect((await call({ lang: "fr", slug: "nope" })).status).toBe(404);
    expect((await call({ lang: "fr", slug: "../etc" })).status).toBe(400);
    expect((await call({ lang: "de", slug: "notion" })).status).toBe(400);
  });

  it("refuses non-read methods", async () => {
    expect((await call({ lang: "fr", slug: "notion" }, "POST")).status).toBe(405);
  });

  it("degrades to 503 when the catalogue cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    expect((await call({ lang: "fr", slug: "notion" })).status).toBe(503);
  });
});
