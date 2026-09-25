import { useEffect, useMemo, useRef, useState } from "react";
import { fitBrandedTitle } from "@/lib/seoTitle";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpDown, Search, X } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, cleanupSeo, hasNonCanonicalSearchParams, SEO_BASE } from "@/lib/seo";
import ToolLogo from "@/components/ToolLogo";
import { FEATURED_COMPARISONS } from "@/data/comparisons";
import { useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";
import CatalogToolbar from "@/components/catalog/CatalogToolbar";
import Breadcrumb from "@/components/Breadcrumb";
import brandColors from "@/data/brandColors.json";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function findTool(tools: ToolSummary[], idOrSlug: string): ToolSummary | undefined {
  return tools.find(t => t.id === idOrSlug || t.slug === idOrSlug);
}

function getComparisonSummary(
  comparison: (typeof FEATURED_COMPARISONS)[number],
  lang: "fr" | "en",
): string {
  return lang === "fr" ? comparison.summary : comparison.summaryEn;
}

/* ─── Category detection ─────────────────────────────────────────────────── */
type CompareCategoryId = "all" | "ia" | "productivite" | "design" | "web" | "automatisation" | "crm" | "marketing" | "finance" | "communication";
type CompareSortId = "featured" | "name";

// First match wins, so the more specific families come first. Everything
// unmatched used to fall into "Productivity" (Mailchimp, Slack, Stripe…).
const CATEGORY_KEYWORDS: [Exclude<CompareCategoryId, "all">, string[]][] = [
  ["ia", ["chatgpt", "claude", "gemini", "copilot", "cursor", "midjourney", "deepseek", "firefly", "grammarly", "prowritingaid", "perplexity"]],
  ["automatisation", ["zapier", "make", "albato"]],
  ["crm", ["pipedrive", "salesforce", "zoho", "close-vs", "vs-close", "capsule", "hubspot"]],
  ["marketing", ["mailchimp", "brevo", "getresponse", "kit", "moosend", "hootsuite", "later", "socialbee", "sendible", "semrush", "similarweb", "unbounce", "instapage", "leadpages"]],
  ["finance", ["stripe", "paypal", "razorpay", "quickbooks", "freshbooks", "dubsado", "honeybook", "toggl", "clockify", "timecamp", "time-doctor"]],
  ["communication", ["slack", "teams", "front", "tidio", "zendesk", "loom", "vimeo", "typeform", "tally", "surveysparrow"]],
  ["web", ["webflow", "squarespace", "wix", "wordpress", "shopify", "woocommerce", "framer", "vercel", "replit"]],
  ["design", ["figma", "canva", "visme", "prezi", "pitch"]],
  ["productivite", ["notion", "asana", "clickup", "linear", "jira", "trello", "todoist", "basecamp", "wrike", "hive", "smartsuite", "obsidian", "coda", "dropbox", "drive", "box"]],
];

function getSlugCategory(slugPair: string): CompareCategoryId {
  const hit = CATEGORY_KEYWORDS.find(([, keys]) => keys.some((k) => slugPair.includes(k)));
  return hit ? hit[0] : "productivite";
}

const COMPARE_CATEGORY_FILTERS: { id: CompareCategoryId; label: string; labelEn: string }[] = [
  { id: "all",            label: "Tous",          labelEn: "All" },
  { id: "ia",             label: "IA",            labelEn: "AI" },
  { id: "productivite",   label: "Productivité",  labelEn: "Productivity" },
  { id: "automatisation", label: "Automatisation",labelEn: "Automation" },
  { id: "crm",            label: "CRM / Ventes",  labelEn: "CRM / Sales" },
  { id: "marketing",      label: "Marketing",     labelEn: "Marketing" },
  { id: "design",         label: "Design",        labelEn: "Design" },
  { id: "web",            label: "Sites web",     labelEn: "Websites" },
  { id: "communication",  label: "Communication", labelEn: "Communication" },
  { id: "finance",        label: "Finance & temps", labelEn: "Finance & time" },
];

/* (ToolInput + ToolInputProps removed — replaced by single search field) */

/* ─── Main component ─────────────────────────────────────────────────────── */
const ComparesIndexPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools, loading } = useToolSummaries();

  /* Single search query + category filter — also accept ?q= and ?cat= URL params
     so deep-links from the navbar (e.g. "Alternative à Notion") pre-fill the field. */
  const [searchParams, setSearchParams] = useSearchParams();
  const isValidCat = (v: string | null): v is CompareCategoryId =>
    COMPARE_CATEGORY_FILTERS.some((f) => f.id === v);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [categoryFilter, setCategoryFilter] = useState<CompareCategoryId>(
    () => (isValidCat(searchParams.get("cat")) ? (searchParams.get("cat") as CompareCategoryId) : "all"),
  );
  const [sortBy, setSortBy] = useState<CompareSortId>("featured");

  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();
  /* Sync state changes back to the URL (replaceState so back-button isn't polluted) */
  useEffect(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (categoryFilter !== "all") next.set("cat", categoryFilter);
    setSearchParams(next, { replace: true });
  }, [query, categoryFilter, setSearchParams]);

  /* Resolved comparison list */
  const resolvedComparisons = useMemo(() =>
    FEATURED_COMPARISONS.map(c => ({
      ...c,
      toolAData: findTool(tools, c.toolA),
      toolBData: findTool(tools, c.toolB),
    })).filter(c => c.toolAData && c.toolBData)
      // "make-vs-zapier" and "zapier-vs-make" are both published pages, but
      // listing both read as a duplicate: keep the first of each pair.
      .filter((c, i, all) => all.findIndex(o => [o.toolA, o.toolB].sort().join("|") === [c.toolA, c.toolB].sort().join("|")) === i),
    [tools],
  );

  /* Filtered listing — single text query (matches either tool's name) + category */
  const filteredComparisons = useMemo(() => {
    let result = resolvedComparisons;
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(c =>
        (c.toolAData?.name ?? "").toLowerCase().includes(q) ||
        (c.toolBData?.name ?? "").toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter(c => getSlugCategory(c.slugPair) === categoryFilter);
    }
    if (sortBy === "name") {
      result = [...result].sort((a, b) =>
        `${a.toolAData?.name ?? ""} ${a.toolBData?.name ?? ""}`.localeCompare(
          `${b.toolAData?.name ?? ""} ${b.toolBData?.name ?? ""}`,
          lang,
        ),
      );
    }
    return result;
  }, [resolvedComparisons, query, categoryFilter, sortBy, lang]);

  /* If query has no matches, surface a few related comparisons */
  const relatedComparisons = useMemo(() => {
    if (filteredComparisons.length > 0 || !query.trim()) return [];
    return resolvedComparisons.slice(0, 4);
  }, [filteredComparisons.length, query, resolvedComparisons]);

  /* SEO */
  useEffect(() => {
    const year = new Date().getFullYear();
    const title = t(
      // Same as the prerendered title (vite.config.ts).
      fitBrandedTitle(`Comparatifs d'outils SaaS ${year}`),
      fitBrandedTitle(`SaaS tool comparisons ${year}`),
    );
    const desc = t(
      "Des comparatifs clairs pour comprendre les différences, les limites et le bon choix selon ton usage.",
      "Clear comparisons to understand differences, limitations and the right choice for your use case.",
    );
    const url = `${SEO_BASE}/${lang}/comparatifs`;
    setSeoTags({ title, description: desc, url, locale: lang === "fr" ? "fr_FR" : "en_US" });
    if (hasNonCanonicalSearchParams(searchParams)) setNoindex();
    setHreflang(`/${lang}/comparatifs`);
    setJsonLd("compares-index-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title, description: desc, url,
      publisher: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      inLanguage: lang,
    });
    return () => cleanupSeo(["compares-index-jsonld"]);
  }, [lang, t, searchParams]);

  // Unfiltered and in editorial order, the page is shelves by theme; any
  // filter, search or A to Z sort shows one flat list instead.
  const showShelves = categoryFilter === "all" && !query.trim() && sortBy === "featured";
  type Resolved = (typeof resolvedComparisons)[number];
  // One pick per theme (the first of each), so the band is not four AI duels.
  const featuredComparisons = COMPARE_CATEGORY_FILTERS
    .filter((f) => f.id !== "all")
    .map((f) => filteredComparisons.find((c) => getSlugCategory(c.slugPair) === f.id))
    .filter((c): c is Resolved => Boolean(c))
    .slice(0, 4);
  const brandOf = (tool: ToolSummary) => (brandColors as Record<string, string>)[tool.slug || tool.id];
  const renderRow = (c: Resolved) => {
    const a = c.toolAData!, b = c.toolBData!;
    return (
      <Link to={`${prefix}/comparatif/${c.slugPair}`} className="cix-row">
        <span className="cix-pair" aria-hidden="true">
          <ToolLogo tool={a} size={44} className="cix-pair-icon" />
          <ToolLogo tool={b} size={44} className="cix-pair-icon cix-pair-icon--second" />
        </span>
        <span className="cix-row-title">{a.name} <span>vs</span> {b.name}</span>
      </Link>
    );
  };
  const renderFeatured = (c: Resolved) => {
    const a = c.toolAData!, b = c.toolBData!;
    const half = (tool: ToolSummary) => { const brand = brandOf(tool); return brand ? { background: `color-mix(in srgb, ${brand} 16%, #FFFFFF)` } : undefined; };
    return (
      <Link to={`${prefix}/comparatif/${c.slugPair}`} className="cix-feature">
        <span className="cix-feature-art" aria-hidden="true">
          <span style={half(a)}><ToolLogo tool={a} size={64} className="cix-feature-icon" /></span>
          <span style={half(b)}><ToolLogo tool={b} size={64} className="cix-feature-icon cix-feature-icon--second" /></span>
          <span className="cix-feature-vs">vs</span>
        </span>
        <span className="cix-feature-copy">
          <span className="cix-feature-title">{a.name} vs {b.name}</span>
          <span className="cix-feature-sub">{getComparisonSummary(c, lang)}</span>
        </span>
      </Link>
    );
  };

  {/* useToolSummaries() seeds `tools` synchronously from the bundled JSON
      fallback (see staticToolSummaries), so real data is already there even
      while `loading` is still true — only block on it when there's nothing
      to show yet. Gating on `loading` alone left this page stuck on the
      spinner forever during SSR, where the effect that flips it false never
      runs. */}
  if (loading && tools.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ width: 32, height: 32, borderRadius: "var(--radius-circle)", border: "3px solid var(--color-border)", borderTopColor: "var(--color-text)", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div className="tt-catalog-page min-h-screen">

      {/* ── Listing section ───────────────────────────────────────────────── */}
      <section className="cix-section">
        <div className="cix-container">

          <header className="tt-catalog-compact-header cix-hero">
            <Breadcrumb
              items={categoryFilter !== "all"
                ? [{ label: t("Comparatifs", "Comparisons") as string, href: `${prefix}/comparatifs` }, { label: (lang === "fr" ? COMPARE_CATEGORY_FILTERS.find((f) => f.id === categoryFilter)?.label : COMPARE_CATEGORY_FILTERS.find((f) => f.id === categoryFilter)?.labelEn) || categoryFilter }]
                : [{ label: t("Comparatifs", "Comparisons") as string }]}
            />
            <h1 className="tt-catalog-compact-title cix-hero-title">{t("Comparatifs", "Comparisons")}</h1>
          </header>

          {/* Search-results feedback only — the default editorial title was a
              second H1-ish header the other catalog pages don't have; dropped
              it so the header is just the shared compact header. */}
          {query.trim() && (
            <div className="cix-listing-header">
              <p className="cix-listing-title">
                {t(`Résultats pour "${query.trim()}"`, `Results for "${query.trim()}"`)}
              </p>
            </div>
          )}

          <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

          <CatalogToolbar
            className="cix-toolbar"
            stuck={toolbarStuck}
            navLabel={t("Filtrer par catégorie", "Filter by category") as string}
            pills={COMPARE_CATEGORY_FILTERS.map((filter) => ({
              id: filter.id,
              label: (lang === "fr" ? filter.label : filter.labelEn) as string,
              active: categoryFilter === filter.id,
              onClick: () => setCategoryFilter(filter.id),
            }))}
            panelTitle={t("Trier", "Sort") as string}
            closeLabel={t("Fermer", "Close") as string}
            moreLabel={t("Trier", "Sort") as string}
            clearLabel={t("Réinitialiser", "Reset") as string}
            sort={{
              value: sortBy,
              options: [
                { value: "featured", label: t("Sélection", "Featured") as string },
                { value: "name", label: t("A → Z", "A → Z") as string },
              ],
              onChange: (value) => setSortBy(value as CompareSortId),
              ariaLabel: t("Trier par", "Sort by") as string,
              title: t("Trier les comparatifs", "Sort comparisons") as string,
            }}
          />


          {/* Reversed pairs (make-vs-zapier next to zapier-vs-make) are hidden
              from the visual list but are published pages: keep a crawlable
              link to each, as the paginated grid used to. */}
          <nav aria-hidden="true" className="sk-crawler-links">
            {FEATURED_COMPARISONS.filter((c) => !resolvedComparisons.some((r) => r.slugPair === c.slugPair)).map((c) => (
              <a key={c.slugPair} href={`${prefix}/comparatif/${c.slugPair}`} tabIndex={-1}>{c.slugPair.replace(/-/g, " ")}</a>
            ))}
          </nav>

          {filteredComparisons.length > 0 ? (
            showShelves ? (
              <>
                {/* Featured: four face-offs in the brand colours of each pair. */}
                <section className="cix-featured" aria-labelledby="cix-featured-title">
                  <h2 id="cix-featured-title" className="sk-group-title">{t("À la une", "Featured")}</h2>
                  <ul className="cix-featured-grid">
                    {featuredComparisons.map((c) => (
                      <li key={c.slugPair}>{renderFeatured(c)}</li>
                    ))}
                  </ul>
                </section>
                {/* Every comparison, shelved by theme: two icons and "A vs B". */}
                {COMPARE_CATEGORY_FILTERS.filter((f) => f.id !== "all").map((cat) => {
                  const items = filteredComparisons.filter((c) => getSlugCategory(c.slugPair) === cat.id);
                  if (!items.length) return null;
                  return (
                    <section key={cat.id} className="cix-shelf" aria-labelledby={`cix-shelf-${cat.id}`}>
                      <h2 id={`cix-shelf-${cat.id}`} className="sk-group-title">{lang === "fr" ? cat.label : cat.labelEn}<span className="cix-shelf-count">{items.length}</span></h2>
                      <ul className="cix-list">{items.map((c) => <li key={c.slugPair}>{renderRow(c)}</li>)}</ul>
                    </section>
                  );
                })}
              </>
            ) : (
              <ul className="cix-list cix-list--flat">{filteredComparisons.map((c) => <li key={c.slugPair}>{renderRow(c)}</li>)}</ul>
            )
          ) : (
            <div className="cix-empty">
              <p className="cix-empty-title">
                {query.trim()
                  ? t(`Pas encore de comparatif sur "${query.trim()}".`, `No comparison on "${query.trim()}" yet.`)
                  : t("Aucun comparatif trouvé.", "No comparison found.")}
              </p>
              <p className="cix-empty-desc">
                {t("Voici les plus consultés en attendant :", "Most-read in the meantime:")}
              </p>
              <div className="cix-empty-chips">
                {(relatedComparisons.length > 0 ? relatedComparisons : resolvedComparisons.slice(0, 4)).map((c) => (
                  <Link
                    key={c.slugPair}
                    to={`${prefix}/comparatif/${c.slugPair}`}
                    className="cix-suggestion-chip"
                  >
                    {c.toolAData!.name} vs {c.toolBData!.name}
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { setQuery(""); setCategoryFilter("all"); }}
                className="cix-empty-reset"
              >
                {t("Voir tous les comparatifs", "See all comparisons")}
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default ComparesIndexPage;
