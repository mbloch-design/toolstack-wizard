import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import {
  STACK_PERSONAS,
  STACKS,
  type StackPersona,
} from "@/data/stacks";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type StackListItem = (typeof STACKS)[number];
type StackFilterId = "all" | "creation" | "business" | "tech" | "ops" | "light" | "ia";

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const FILTER_PILLS: { id: StackFilterId; label: string; labelEn: string }[] = [
  { id: "all",      label: "Tous",          labelEn: "All" },
  { id: "creation", label: "Création",      labelEn: "Creative" },
  { id: "business", label: "Business",      labelEn: "Business" },
  { id: "tech",     label: "Tech",          labelEn: "Tech" },
  { id: "ops",      label: "Ops",           labelEn: "Ops" },
  { id: "light",    label: "Budget léger",  labelEn: "Lean budget" },
  { id: "ia",       label: "IA",            labelEn: "AI" },
];

const FEATURED_STACK_SLUGS = [
  "developpeur-freelance-shipper",
  "designer-freelance-solo",
  "consultant-b2b-propre",
  "createur-contenu-operateur",
  "ops-manager-fractional-coo",
  "freelance-solo-zero-bloat",
  "freelance",
  "agence-marketing",
  "solopreneur",
  "ecommerce",
  "startup-saas",
];

const PROFILE_RECOMMENDED_STACKS = [
  { persona: "content" as StackPersona,    slug: "createur-contenu-operateur" },
  { persona: "designer" as StackPersona,   slug: "designer-freelance-solo" },
  { persona: "dev" as StackPersona,        slug: "developpeur-freelance-shipper" },
  { persona: "consultant" as StackPersona, slug: "consultant-b2b-propre" },
  { persona: "ops" as StackPersona,        slug: "ops-manager-fractional-coo" },
  { persona: "solo" as StackPersona,       slug: "freelance-solo-zero-bloat" },
] as const;

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function personaLabel(persona: StackPersona, locale: "fr" | "en") {
  const item = STACK_PERSONAS.find((p) => p.value === persona);
  return locale === "fr" ? item?.label || persona : item?.labelEn || persona;
}

function stackMatchesFilter(stack: StackListItem, filter: StackFilterId): boolean {
  switch (filter) {
    case "all":      return true;
    case "creation": return stack.persona === "content" || stack.persona === "designer";
    case "business": return stack.persona === "consultant" || stack.persona === "solo";
    case "tech":     return stack.persona === "dev";
    case "ops":      return stack.persona === "ops";
    case "light":    return stack.monthlyBudget <= 50;
    case "ia":       return (
      stack.slug.includes("ia-generative") ||
      stack.slug.includes("ia-visuelle") ||
      stack.slug.includes("productivite-ia")
    );
    default: return true;
  }
}

function stackMatchesQuery(stack: StackListItem, query: string) {
  if (!query) return true;
  const text = [
    stack.title,
    stack.titleEn,
    stack.subtitle,
    stack.subtitleEn,
    stack.bestFor,
    stack.bestForEn,
    stack.risk,
    stack.riskEn,
    ...stack.tools.map((slot) => `${slot.role} ${slot.roleEn} ${slot.slug}`),
  ].join(" ").toLowerCase();
  return text.includes(query);
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
const StacksPage = () => {
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const [activeFilter, setActiveFilter] = useState<StackFilterId>("all");
  const [query, setQuery] = useState("");

  const toolBySlug = useMemo(
    () => new Map(tools.map((tool) => [tool.slug || tool.id, tool])),
    [tools],
  );

  const profileRecommendedStacks = PROFILE_RECOMMENDED_STACKS
    .map(({ persona, slug }) => ({
      persona,
      stack: STACKS.find((s) => s.slug === slug),
    }))
    .filter((item): item is { persona: StackPersona; stack: StackListItem } => Boolean(item.stack));

  const filteredStacks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STACKS
      .filter((stack) => stackMatchesFilter(stack, activeFilter) && stackMatchesQuery(stack, q))
      .sort((a, b) => {
        const ai = FEATURED_STACK_SLUGS.indexOf(a.slug);
        const bi = FEATURED_STACK_SLUGS.indexOf(b.slug);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return 0;
      });
  }, [activeFilter, query]);

  useEffect(() => {
    const title = lang === "fr"
      ? "Stacks SaaS types pour freelances | ToolTrim"
      : "SaaS stack templates for freelancers | ToolTrim";
    const description = lang === "fr"
      ? "Explorez des stacks SaaS sobres par profil freelance, budget et niveau de maturité. Des combinaisons d'outils pensées pour vendre, livrer et payer moins."
      : "Explore lean SaaS stack templates by freelance profile, budget, and maturity. Tool combinations designed to sell, deliver, and pay less.";
    setSeoTags({ title, description, url: `${SEO_BASE}/${lang}/stacks`, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/stacks`);
    setJsonLd("stacks-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: `${SEO_BASE}/${lang}/stacks`,
      numberOfItems: STACKS.length,
      hasPart: STACKS.map((stack) => ({
        "@type": "ItemList",
        name: lang === "fr" ? stack.title : stack.titleEn,
        itemListElement: stack.tools.map((slot, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: toolBySlug.get(slot.slug)?.name || slot.slug,
        })),
      })),
    });
    return () => cleanupSeo(["stacks-jsonld"]);
  }, [lang, toolBySlug]);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="eh-root">
        <div className="eh-container">
          <span className="eh-eyebrow">{t("Stacks types", "Stack templates")}</span>
          <h1 style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(3.5rem, 6vw, 6rem)",
            fontWeight: 600,
            letterSpacing: "-0.055em",
            lineHeight: 0.98,
            color: "#222222",
            maxWidth: 980,
            margin: "14px 0 24px",
          }}>
            {t("Comparer des stacks types.", "Compare stack templates.")}
            <br />
            {t("Pas collectionner des outils.", "Not collect tools.")}
          </h1>
          <p style={{
            fontFamily: "var(--font-ui)",
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: "-0.025em",
            lineHeight: 1.35,
            color: "#6F6F68",
            maxWidth: 640,
            margin: "0 0 32px",
          }}>
            {t(
              "Chaque stack part d'un contexte concret : profil, budget, usages, doublons probables et outils à challenger.",
              "Each stack starts from a concrete context: profile, budget, use cases, likely overlaps, and tools to challenge.",
            )}
          </p>
          <div className="eh-cta-group">
            <Link to={`${prefix}/selector`} className="eh-cta-primary">
              {t("Analyser ma stack", "Analyze my stack")}
            </Link>
            <a href="#profils" className="eh-cta-secondary">
              {t("Voir les profils", "View profiles")}
            </a>
          </div>
        </div>
      </section>

      {/* ── Commencer par ton profil ───────────────────────────────────────── */}
      <section id="profils" className="sk-section scroll-mt-20" style={{ background: "#F8F8F4" }}>
        <div className="sk-container">
          <span style={{
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "#6F6F68",
            display: "block",
            marginBottom: 10,
          }}>
            {t("Recommandées par profil", "Recommended by profile")}
          </span>
          <p style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(1.75rem, 3vw, 2.625rem)",
            fontWeight: 600,
            letterSpacing: "-0.055em",
            lineHeight: 0.98,
            color: "#222222",
            marginBottom: 32,
          }}>
            {t("Commence par la stack de ton métier", "Start with the stack for your role")}
          </p>
          <div className="sk-profiles-grid">
            {profileRecommendedStacks.map(({ persona, stack }) => {
              const title = lang === "fr" ? stack.title : stack.titleEn;
              const bestFor = lang === "fr" ? stack.bestFor : stack.bestForEn;
              return (
                <Link
                  key={persona}
                  to={`${prefix}/stacks/${stack.slug}`}
                  className="sk-profile-card"
                >
                  <p className="sk-profile-name">{personaLabel(persona, lang)}</p>
                  <p style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase" as const,
                    color: "#9A9A92",
                    margin: "4px 0 8px",
                  }}>
                    {title}
                  </p>
                  <p className="sk-profile-desc">{bestFor}</p>
                  <p style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#222222",
                    marginTop: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}>
                    {t("Voir la stack", "See stack")}
                    <span aria-hidden>→</span>
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Filtres + Liste ────────────────────────────────────────────────── */}
      <section id="stacks" className="sk-section scroll-mt-20">
        <div className="sk-container">

          {/* Filter pills */}
          <div className="gi-filter-bar" style={{ marginBottom: 32 }}>
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveFilter(pill.id)}
                className={`gi-filter-pill${activeFilter === pill.id ? " gi-filter-pill--active" : ""}`}
              >
                {lang === "fr" ? pill.label : pill.labelEn}
              </button>
            ))}
          </div>

          {/* Stack count + search */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap" as const,
          }}>
            <p style={{
              fontFamily: "var(--font-ui)",
              fontSize: 13,
              color: "#6F6F68",
              letterSpacing: "-0.01em",
            }}>
              {filteredStacks.length}&nbsp;{t("stacks", "stacks")}
            </p>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Rechercher…", "Search…")}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 14,
                height: 36,
                padding: "0 14px",
                border: "1px solid #DADAD4",
                borderRadius: 6,
                background: "#FFFFFF",
                color: "#222222",
                outline: "none",
                width: 220,
                letterSpacing: "-0.01em",
              }}
            />
          </div>

          {/* Stack cards */}
          {filteredStacks.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}>
              {filteredStacks.map((stack) => {
                const stackTools = stack.tools
                  .slice(0, 6)
                  .map((slot) => toolBySlug.get(slot.slug))
                  .filter(Boolean) as NonNullable<ReturnType<typeof toolBySlug.get>>[];
                const titleText = lang === "fr" ? stack.title : stack.titleEn;
                const subtitleText = lang === "fr" ? stack.subtitle : stack.subtitleEn;
                const riskText = lang === "fr" ? stack.risk : stack.riskEn;
                const personaText = personaLabel(stack.persona, lang);
                const budget = stack.monthlyBudget > 0
                  ? `≈ ${stack.monthlyBudget}€/mois`
                  : t("Gratuit", "Free");
                const isRecommended = PROFILE_RECOMMENDED_STACKS.some((p) => p.slug === stack.slug);

                return (
                  <Link
                    key={stack.id}
                    to={`${prefix}/stacks/${stack.slug}`}
                    className="sk-card"
                    style={{ marginBottom: 8 }}
                  >
                    {/* Header */}
                    <div className="sk-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase" as const,
                          color: "#9A9A92",
                        }}>
                          STACK
                        </span>
                        <span style={{ color: "#DADAD4", fontSize: 12 }}>·</span>
                        <span style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase" as const,
                          color: "#6F6F68",
                        }}>
                          {personaText}
                        </span>
                        {isRecommended && (
                          <>
                            <span style={{ color: "#DADAD4", fontSize: 12 }}>·</span>
                            <span style={{
                              fontFamily: "var(--font-ui)",
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase" as const,
                              color: "#FFFFFF",
                              background: "#222222",
                              padding: "2px 6px",
                              borderRadius: 3,
                            }}>
                              {t("Recommandée", "Recommended")}
                            </span>
                          </>
                        )}
                      </div>
                      <span style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#222222",
                        letterSpacing: "-0.02em",
                        whiteSpace: "nowrap" as const,
                      }}>
                        {budget}
                      </span>
                    </div>

                    {/* Title */}
                    <p className="sk-card-title">{titleText}</p>

                    {/* Subtitle */}
                    <p className="sk-card-desc">{subtitleText}</p>

                    {/* Risk snippet */}
                    {riskText && (
                      <p style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: 12,
                        color: "#9A9A92",
                        lineHeight: 1.45,
                        margin: "8px 0 0",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                      }}>
                        <span style={{ fontWeight: 600, color: "#6F6F68" }}>
                          {t("Risque", "Risk")} ·
                        </span>{" "}
                        {riskText}
                      </p>
                    )}

                    {/* Footer: tool logos + CTA */}
                    <div className="sk-card-footer">
                      {stackTools.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                          {stackTools.map((tool, i) => (
                            <div
                              key={tool.id}
                              title={tool.name}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "#FFFFFF",
                                border: "1px solid #E7E7E0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginLeft: i === 0 ? 0 : -6,
                                overflow: "hidden",
                                position: "relative" as const,
                                zIndex: stackTools.length - i,
                              }}
                            >
                              <ToolLogo tool={tool} size={18} />
                            </div>
                          ))}
                          {stack.tools.length > 6 && (
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "#F8F8F4",
                              border: "1px solid #E7E7E0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginLeft: -6,
                              fontFamily: "var(--font-ui)",
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#6F6F68",
                            }}>
                              +{stack.tools.length - 6}
                            </div>
                          )}
                        </div>
                      )}
                      <span className="sk-card-cta">
                        {t("Voir la stack", "See stack")}
                        <span aria-hidden> →</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: "48px 0",
              textAlign: "center" as const,
              borderTop: "1px solid #DADAD4",
            }}>
              <p style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: "#222222",
                marginBottom: 8,
              }}>
                {t("Aucune stack trouvée.", "No stack found.")}
              </p>
              <p style={{
                fontFamily: "var(--font-ui)",
                fontSize: 15,
                color: "#6F6F68",
              }}>
                {t("Essaie un autre filtre ou efface la recherche.", "Try another filter or clear the search.")}
              </p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default StacksPage;
