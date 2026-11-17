// Loopback-only UX fixture. No calls to Supabase, Creem, GitHub or Vercel.
import { createHash, randomUUID } from "node:crypto";

export function createPublisherDemo() {
  const owner = "editeur@example.invalid";
  const brandId = randomUUID();
  const tools = [
    { id: "demo-boussole", slug: "boussole-demo", name: "Boussole Démo", canEdit: true },
  ];
  const timestamp = () => new Date().toISOString();
  const planText = (name) => ({ name, highlights: ["Projets partagés"], summary: null });
  const product = (name, websiteUrl = "https://outil.example.invalid") => ({
    schemaVersion: 1, name, websiteUrl,
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
    id: randomUUID(), toolId: tools[0].id, name: tools[0].name,
    version: 1, status: "submitted", submittedAt: timestamp(), value: structuredClone(drafts.get(tools[0].id).value),
  }];
  const seal = (value) => ({ id: randomUUID(), hash: createHash("sha256").update(JSON.stringify(value)).digest("hex") });
  const makeApplication = ({ id = randomUUID(), name, websiteUrl, slug, offer }) => ({
    listing: { id, name, websiteUrl, slug, offer, status: "draft", version: 1, createdAt: timestamp(), updatedAt: timestamp(),
      reservationExpiresAt: null, commercialStatus: "pending", representationStatus: "pending", deliveryStatus: "unpublished",
      representativeRole: "", notes: "", media: [] },
    productRevision: null, editorialRevision: null, confirmation: null, badgeUrl: null, approvalId: null,
  });
  const atelier = makeApplication({ id: "51910000-0000-4000-8000-000000000001",
    name: "Atelier Démo", websiteUrl: "https://atelier.example.invalid", slug: "atelier-demo", offer: "standard_badge" });
  Object.assign(atelier.listing, {
    status: "facts_to_review", commercialStatus: "satisfied", representativeRole: "Responsable produit",
    notes: "Atelier Démo centralise les tâches, les délais et le suivi des projets des petites équipes.",
  });
  atelier.badgeUrl = atelier.listing.websiteUrl + "/partenaires";
  const atelierFacts = product(atelier.listing.name, atelier.listing.websiteUrl);
  atelier.productRevision = { ...seal(atelierFacts), value: atelierFacts };
  const analysis = {
    category: "project-management",
    fields: { longDescription: "Atelier Démo privilégie le suivi quotidien des tâches. Le périmètre reste adapté aux petites équipes.",
      longDescriptionEn: "Atelier Demo prioritizes everyday task tracking and is suited to small teams.",
      pros: ["Suivi des tâches et des échéances au même endroit"], cons: ["Peu de fonctions de gestion de portefeuille"] },
  };
  atelier.editorialRevision = { ...seal(analysis), ...analysis };
  const priority = makeApplication({ id: "51910000-0000-4000-8000-000000000002",
    name: "Carnet Démo", websiteUrl: "https://carnet.example.invalid", slug: "carnet-demo", offer: "priority_paid" });
  Object.assign(priority.listing, { commercialStatus: "satisfied", representativeRole: "Responsable produit" });
  const applications = [atelier, priority];
  const creationKeys = new Map();
  const changeListing = (listing, changes) => Object.assign(listing, changes, { version: listing.version + 1, updatedAt: timestamp() });
  const summary = ({ value, ...fields }) => fields;
  const paths = new Set(["/api/publisher-catalog", "/api/publisher-contributions", "/api/listing-requests",
    "/api/listing-checkout", "/api/listing-review", "/api/backoffice-listing-review",
    "/api/backoffice-contributions", "/api/backoffice-listings", "/api/catalog-media"]);
  return {
    paths,
    async handle({ req, url, input, user, server, send, fail, res }) {
      const { pathname: path, searchParams: query } = url;
      const method = req.method;
      const ok = (payload) => send(res, 200, payload);
      const error = (status, code) => fail(res, status, code);
      const invalid = () => error(400, "INVALID_LISTING_REQUEST");
      const conflict = () => error(409, "LISTING_REVISION_CONFLICT");
      const admin = user.email === "admin@example.invalid";
      const ownsApplication = user.email === owner;
      const applicationId = query.get("id") ?? input?.id ?? input?.listingId;
      const review = applications.find(({ listing }) => listing.id === applicationId);
      const listing = review?.listing;

      if (path === "/api/backoffice-listing-review" || path === "/api/listing-review") {
        const adminReview = path === "/api/backoffice-listing-review";
        if (adminReview ? !admin : !ownsApplication) return error(403, "CMS_ACCESS_DENIED");
        if (!review) return error(404, "LISTING_NOT_FOUND");
        const result = () => {
          const { productRevision, confirmation } = review;
          return ok({ review: adminReview ? review : { listing, productRevision, confirmation, editorialRevision: null } });
        };
        if (method === "GET") return result();
        if (method !== "POST" || listing.version !== input.version || review.approvalId) return conflict();
        const { action } = input;
        if (!adminReview) {
          const { productRevisionId, hash, decision, note } = input;
          if (action !== "respondFactualReview" || listing.status !== "facts_to_review"
            || productRevisionId !== review.productRevision?.id || hash !== review.productRevision?.hash) return conflict();
          if (decision !== "confirm" && !(decision === "requestChanges" && note?.trim())) return invalid();
          review.confirmation = { decision, note, productRevisionId };
          changeListing(listing, { status: decision === "confirm" ? "ready" : "changes_requested" });
          return result();
        }
        const editable = ["submitted", "in_preparation", "changes_requested", "ready"].includes(listing.status);
        if (action === "prepareInitial" && editable) {
          const { parseProductDraft } = await server.ssrLoadModule("/src/lib/publisherCatalog.ts");
          const { draft } = parseProductDraft(input.value, { phase: "submit", purpose: "initial" });
          if (!draft || draft.websiteUrl !== listing.websiteUrl) return invalid();
          if (listing.version !== input.version) return conflict();
          review.productRevision = { ...seal(draft), value: draft };
          review.confirmation = null;
          changeListing(listing, { status: "in_preparation" });
        } else if (action === "requestFactualReview" && listing.status === "in_preparation" && input.productRevisionId === review.productRevision?.id) {
          changeListing(listing, { status: "facts_to_review" });
        } else if (action === "approveInitialEditorial" && (editable || listing.status === "facts_to_review")) {
          if (!input.category || !input.fields?.longDescription?.trim() || !input.fields?.longDescriptionEn?.trim()) return invalid();
          const { category, fields } = input;
          review.editorialRevision = { ...seal({ category, fields }), category, fields };
          changeListing(listing, {});
        } else if (action === "promoteInitial" && listing.status === "ready" && listing.commercialStatus === "satisfied"
          && review.confirmation?.decision === "confirm" && input.productRevisionId === review.productRevision?.id
          && input.editorialRevisionId === review.editorialRevision?.id && input.brandName?.trim() && input.brandDomain?.trim()) {
          const toolId = "demo-" + listing.slug;
          const { name, slug } = listing;
          review.approvalId = randomUUID();
          changeListing(listing, { representationStatus: "verified", toolId });
          tools.push({ id: toolId, name, slug, canEdit: true });
          drafts.set(toolId, { brandId, canEdit: true, version: 1, updatedAt: timestamp(), value: structuredClone(review.productRevision.value) });
          submissions.push({ id: review.approvalId, toolId, name, version: 1, status: "approved",
            submittedAt: timestamp(), value: structuredClone(review.productRevision.value) });
          return ok({ approval: { approvalId: review.approvalId, toolId, version: 1 } });
        } else return conflict();
        return result();
      }

      if (path.startsWith("/api/backoffice-")) {
        if (!admin) return error(403, "CMS_ACCESS_DENIED");
        if (path === "/api/backoffice-listings") return ok({ claims: [], brands: [], invitations: [],
          listings: applications.map(({ listing }) => listing)
            .filter(({ status, toolId, deliveryStatus }) => !toolId
              ? ["submitted", "in_preparation", "facts_to_review", "changes_requested", "ready"].includes(status)
              : status === "ready" && ["unpublished", "publishing"].includes(deliveryStatus))
            .map((row) => ({ ...row, confirmedEmail: owner })) });
        if (query.get("mode") === "release-preview") return ok({
          manifest: { sourceHead: "0".repeat(40), legacyItems: [],
            items: submissions.filter(({ status }) => status === "approved").map(({ id, toolId, name, version }) => ({ approvalId: id, toolId, name, version })) },
          newToolIds: applications.flatMap(({ listing }) => listing.toolId ? [listing.toolId] : []),
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

      if (path === "/api/listing-requests") {
        if (method === "GET" && !query.has("id")) return ok({ listings: ownsApplication ? applications.map(({ listing }) => listing) : [], claims: [] });
        if (!ownsApplication) return error(403, "CMS_ACCESS_DENIED");
        if (method === "GET") return listing ? ok({ listing }) : error(404, "LISTING_NOT_FOUND");
        if (method !== "POST") return error(405, "METHOD_NOT_ALLOWED");
        if (input.action === "lookup" || input.action === "create") {
          const { name, websiteUrl, offer, idempotencyKey } = input;
          let website;
          try { website = new URL(websiteUrl); } catch { return invalid(); }
          if (!name?.trim() || website.protocol !== "https:") return invalid();
          const matches = applications.filter(({ listing }) => listing.name.toLowerCase() === name.trim().toLowerCase()
            || new URL(listing.websiteUrl).hostname === website.hostname);
          if (input.action === "lookup") return ok({ candidates: matches.map(({ listing }) => ({ ...listing, kind: "listing" })) });
          if (creationKeys.has(idempotencyKey)) return ok({ listing: creationKeys.get(idempotencyKey) });
          if (!["priority_paid", "standard_badge"].includes(offer) || !idempotencyKey) return invalid();
          const slug = name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          if (!slug || matches.length || tools.some((tool) => tool.slug === slug) || applications.some(({ listing }) => listing.slug === slug)) return conflict();
          const application = makeApplication({ name: name.trim(), websiteUrl: website.href, slug, offer });
          applications.push(application);
          creationKeys.set(idempotencyKey, application.listing);
          return ok({ listing: application.listing });
        }
        if (!listing || listing.version !== input.version || !["draft", "changes_requested"].includes(listing.status)) return conflict();
        if (input.action === "save") changeListing(listing, { representativeRole: input.representativeRole, notes: input.notes });
        else if (input.action === "submit" && listing.commercialStatus === "satisfied" && listing.representativeRole?.trim()) {
          changeListing(listing, { status: "submitted" });
        } else if (input.action === "withdraw" && listing.commercialStatus === "pending") changeListing(listing, { status: "archived" });
        else return conflict();
        return ok({ listing });
      }
      if (path === "/api/listing-checkout") {
        if (!ownsApplication || !listing) return error(403, "CMS_ACCESS_DENIED");
        if (method !== "POST") return error(405, "METHOD_NOT_ALLOWED");
        const standard = listing.offer === "standard_badge";
        if (input.action === "checkBadge" && standard) {
          review.badgeUrl = listing.websiteUrl;
          changeListing(listing, { commercialStatus: "satisfied" });
        }
        const satisfied = listing.commercialStatus === "satisfied";
        if (["status", "reconcile", "checkBadge"].includes(input.action)) return ok({
          state: satisfied ? (standard ? "present" : "paid") : "unchecked",
        });
        if (input.action === "requestHistoricalReview" && !standard) return ok({ state: "review_required" });
        return error(503, "DEMO_CHECKOUT_DISABLED");
      }
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
