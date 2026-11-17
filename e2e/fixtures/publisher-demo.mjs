// Loopback-only UX fixture. No calls to Supabase, Creem, GitHub or Vercel.
import { randomUUID } from "node:crypto";

export function createPublisherDemo() {
  const owner = "editeur@example.invalid";
  const brandId = randomUUID();
  const tools = [
    { id: "demo-atelier", slug: "atelier-demo", name: "Atelier Démo", canEdit: true },
    { id: "demo-boussole", slug: "boussole-demo", name: "Boussole Démo", canEdit: true },
  ];
  const timestamp = () => new Date().toISOString();
  const planText = (name) => ({ name, highlights: ["Projets partagés"], summary: null });
  const product = (name) => ({
    schemaVersion: 1, name, websiteUrl: "https://outil.example.invalid",
    localized: {
      fr: { shortDescription: "Un espace pour suivre les projets d’une petite équipe.", productDescription: "Organisez les tâches et les délais au même endroit.", features: [], useCases: [] },
      en: { shortDescription: "A workspace for small teams.", productDescription: null, features: [], useCases: [] },
    },
    plans: [{
      id: randomUUID(), planKey: "equipe", archived: false,
      localized: { fr: planText("Équipe"), en: planText("Team") },
      options: [{ id: randomUUID(), type: "paid", amount: "120", currency: "EUR", period: "year",
        unit: "par équipe", commitment: "annual_prepaid", tax: "unknown", market: "FR",
        offerLocale: null, sourceUrl: null, observedOn: null }],
    }],
    media: [], classificationProposals: [{ key: "functional_needs", values: ["productivite"] }], integrations: [],
  });
  const drafts = new Map(tools.map(({ id, name }) => [id, {
    brandId, canEdit: true, version: 1, updatedAt: timestamp(), value: product(name),
  }]));
  const submissions = [{
    id: randomUUID(), toolId: tools[1].id, name: tools[1].name,
    version: 1, status: "submitted", submittedAt: timestamp(), value: structuredClone(drafts.get(tools[1].id).value),
  }];
  const summary = ({ value, ...fields }) => fields;
  const paths = new Set(["/api/publisher-catalog", "/api/publisher-contributions", "/api/listing-requests",
    "/api/backoffice-contributions", "/api/backoffice-listings", "/api/catalog-media"]);
  return {
    paths,
    async handle({ req, url, input, user, server, send, fail, res }) {
      const { pathname: path, searchParams: query } = url;
      const method = req.method;
      const ok = (payload) => send(res, 200, payload);
      const error = (status, code) => fail(res, status, code);
      if (path.startsWith("/api/backoffice-")) {
        if (user.email !== "admin@example.invalid") return error(403, "CMS_ACCESS_DENIED");
        if (path === "/api/backoffice-listings") return ok({ claims: [], listings: [], brands: [], invitations: [] });
        if (query.get("mode") === "release-preview") return ok({
          manifest: { sourceHead: "0".repeat(40), legacyItems: [],
            items: submissions.filter(({ status }) => status === "approved").map(({ id, toolId, version }) => ({ approvalId: id, toolId, version })) },
          canDeliver: false, blocked: [],
        });
        if (query.get("mode") === "release-history") return ok({ history: [], canDeliver: false });
        if (query.has("mode")) return error(503, "CMS_RELEASE_DISABLED");
        const id = query.get("id");
        if (method === "GET" && !id) return ok({
          submissions: submissions.filter(({ status }) => ["submitted", "approved"].includes(status)).map(summary),
        });
        const item = submissions.find((row) => row.id === id);
        if (!item) return error(404, "CMS_SUBMISSION_NOT_FOUND");
        if (method === "GET") {
          const tool = tools.find(({ id }) => id === item.toolId);
          return ok({ submission: item, media: [], published: {
            slug: tool.slug, name: tool.name, websiteUrl: "https://outil.example.invalid",
            shortDescription: "Ancienne description de la fiche de démonstration.", shortDescriptionEn: null,
          } });
        }
        if (method !== "POST" || !(item.status === "submitted" && ["approved", "changes_requested", "rejected"].includes(input.status)
          || item.status === "approved" && input.status === "cancel_approval")) return error(409, "CMS_REVISION_CONFLICT");
        if (input.status !== "approved" && !input.note?.trim()) return error(400, "INVALID_CMS_REVIEW");
        item.status = input.status === "cancel_approval" ? "rejected" : input.status;
        item.reviewNote = input.note;
        return ok({ submission: summary(item) });
      }

      if (path === "/api/listing-requests" && method === "GET") return ok({ listings: [], claims: [] });
      if (path === "/api/publisher-catalog" && method === "GET" && !query.has("tool")) {
        return ok({ tools: user.email === owner ? tools : [] });
      }
      if (user.email !== owner) return error(403, "CMS_ACCESS_DENIED");
      const toolId = query.get("tool");
      const draft = drafts.get(toolId);
      if (!draft) return error(403, "CMS_ACCESS_DENIED");

      if (path === "/api/publisher-contributions") {
        const own = submissions.filter((item) => item.toolId === toolId);
        if (method === "GET") return ok({ submissions: own.map(summary).reverse() });
        if (method === "DELETE") {
          const item = own.find(({ id }) => id === query.get("id"));
          if (item?.status !== "submitted") return error(409, "CMS_REVISION_CONFLICT");
          item.status = "withdrawn";
          return ok({ submission: summary(item) });
        }
        if (method !== "POST") return error(405, "METHOD_NOT_ALLOWED");
        if (input.brandId !== brandId || input.version !== draft.version) return error(409, "CMS_REVISION_CONFLICT");
        if (own.some(({ status }) => ["submitted", "approved"].includes(status))) return error(409, "CMS_SUBMISSION_PENDING");
        const { validateProductDraft } = await server.ssrLoadModule("/src/lib/publisherCatalog.ts");
        const issues = validateProductDraft(draft.value, { phase: "submit", purpose: "update" });
        if (issues.length) return send(res, 400, { error: { code: "INVALID_PUBLISHER_DRAFT", issues } });
        const item = { id: randomUUID(), toolId, name: draft.value.name, version: draft.version,
          status: "submitted", submittedAt: timestamp(), value: structuredClone(draft.value) };
        submissions.push(item);
        return ok({ submission: summary(item) });
      }

      if (path !== "/api/publisher-catalog") return error(503, "DEMO_ACTION_UNAVAILABLE");
      if (method === "GET") return ok({ draft });
      if (input.brandId !== brandId || input.version !== draft.version) return error(409, "CMS_REVISION_CONFLICT");
      let value = structuredClone(draft.value);
      if (method === "PATCH" && input.action === "addPlan") {
        const id = randomUUID();
        value.plans.push({ id, planKey: "offer-" + id, archived: false,
          localized: { fr: { ...planText(""), highlights: [] }, en: { ...planText(""), highlights: [] } }, options: [] });
      } else if (method === "PATCH" && input.action === "addPriceOption") {
        const plan = value.plans.find((item) => item.id === input.planId);
        if (!plan) return error(404, "CMS_PLAN_NOT_FOUND");
        plan.options.push({ id: randomUUID(), type: "unknown", amount: null, currency: null, period: null, unit: null,
          commitment: null, tax: "unknown", market: null, offerLocale: null, sourceUrl: null, observedOn: null });
      } else if (method === "PUT") {
        value = input.value;
      } else return error(405, "METHOD_NOT_ALLOWED");
      const { validateProductDraft } = await server.ssrLoadModule("/src/lib/publisherCatalog.ts");
      const issues = validateProductDraft(value, { phase: "draft", purpose: "update" });
      if (issues.length) return send(res, 400, { error: { code: "INVALID_PUBLISHER_DRAFT", issues } });
      Object.assign(draft, { value, version: draft.version + 1, updatedAt: timestamp() });
      return ok({ draft });
    },
  };
}
