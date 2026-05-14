import { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { Search } from "lucide-react";
import { getToolDomain } from "@/lib/toolUtils";
import ToolLogo from "@/components/ToolLogo";

/* ─────────────────────────────────────────────────────────────────────────────
   HeroSection — homepage hero, editorial redesign.
   No floating logos. No gradient. No dotted grid.
   Clean off-white surface, large typographic title, quiet search.
───────────────────────────────────────────────────────────────────────────── */

const FEATURED_SLUGS = [
  "figma", "notion", "slack", "hubspot", "zapier",
  "stripe", "linear", "framer", "airtable", "webflow",
  "intercom", "calendly",
];

const HeroSection = ({ toolCount }: { toolCount: number }) => {
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
  const navigate  = useNavigate();
  const [query, setQuery]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const featuredTools = useMemo(() => {
    if (!tools.length) return [];
    const bySlug = new Map(tools.map((t) => [t.slug || t.id, t]));
    return FEATURED_SLUGS.flatMap((slug) => {
      const tool = bySlug.get(slug);
      return tool ? [tool] : [];
    });
  }, [tools]);

  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return tools
      .filter(
        (t) =>
          (t.name ?? "").toLowerCase().includes(q) ||
          (t.slug || t.id || "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, tools]);

  const displayedTools = query.length >= 2 ? searchResults : featuredTools;

  const handleToolClick = (tool: ToolSummary) => {
    navigate(`${prefix}/selector?from=${tool.slug || tool.id}`);
  };

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && displayedTools.length > 0)
      handleToolClick(displayedTools[0]);
  };

  /* Free tools count — rough heuristic from tool data */
  const freeCount = useMemo(
    () => tools.filter((t) => (t as any).defaultMonthlyPrice === 0).length,
    [tools],
  );

  return (
    <section
      className="eh-root eh-root--centered"
      style={{ minHeight: "clamp(520px, 82vh, 800px)", display: "flex", alignItems: "center" }}
    >
      <div className="eh-container w-full" style={{ paddingTop: 80, paddingBottom: 72 }}>

        {/* Eyebrow */}
        <span className="eh-eyebrow" style={{ marginBottom: 28 }}>
          {t(
            "indépendant · gratuit · sans inscription",
            "independent · free · no account",
          )}
        </span>

        {/* Title */}
        <h1 className="eh-title">
          {t(
            <>Choisir les bons outils.<br />Sans empiler les abonnements.</>,
            <>Choose the right tools.<br />Without stacking subscriptions.</>,
          )}
        </h1>

        {/* Description */}
        <p className="eh-description">
          {t(
            "ToolTrim compare, organise et recommande les outils qui valent vraiment leur place dans ta stack.",
            "ToolTrim compares, organises and recommends the tools that genuinely earn their place in your stack.",
          )}
        </p>

        {/* CTA group */}
        <div className="eh-cta-group" style={{ justifyContent: "center", marginTop: 36 }}>
          <Link to={`${prefix}/selector`} className="eh-cta-primary eh-cta-primary--accent">
            {t("Analyser ma stack", "Analyze my stack")}
          </Link>
          <Link to={`${prefix}/tools`} className="eh-cta-secondary">
            {t("Explorer les outils", "Browse tools")}
          </Link>
        </div>

        {/* ── Search module ── */}
        <div className="eh-body" style={{ width: "100%", maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
          {/* Search input */}
          <div style={{ position: "relative" }}>
            <Search
              aria-hidden
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                width: 16,
                height: 16,
                color: "#6F6F68",
                flexShrink: 0,
              }}
            />
            <input
              id="home-tool-search"
              name="home-tool-search"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder={t(
                "Rechercher un outil, une alternative, une stack…",
                "Search a tool, an alternative, a stack…"
              )}
              style={{
                width: "100%",
                height: 54,
                paddingLeft: 46,
                paddingRight: 16,
                background: "#FFFFFF",
                border: "1px solid #DADAD4",
                borderRadius: 10,
                fontFamily: "var(--font-ui)",
                fontSize: 15,
                color: "#222222",
                outline: "none",
                transition: "border-color 160ms ease-out",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "hsl(var(--primary))";
                e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#DADAD4";
                e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
              }}
            />
          </div>

          {/* Tool chips */}
          {displayedTools.length > 0 && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                justifyContent: "center",
              }}
            >
              {displayedTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 32,
                    padding: "0 10px",
                    background: "#FFFFFF",
                    border: "1px solid #DADAD4",
                    borderRadius: 6,
                    fontFamily: "var(--font-ui)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#222222",
                    cursor: "pointer",
                    transition: "border-color 160ms ease-out",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#222222";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#DADAD4";
                  }}
                >
                  <ToolLogo tool={tool as any} size={14} />
                  {tool.name}
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && displayedTools.length === 0 && (
            <p
              style={{
                marginTop: 10,
                fontFamily: "var(--font-ui)",
                fontSize: 13,
                color: "#6F6F68",
                textAlign: "center",
              }}
            >
              {t("Aucun outil trouvé. ", "No tool found. ")}
              <button
                onClick={() => navigate(`${prefix}/selector`)}
                style={{
                  background: "none",
                  border: "none",
                  color: "hsl(var(--primary))",
                  fontSize: 13,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                {t("Lancer le diagnostic →", "Start diagnostic →")}
              </button>
            </p>
          )}
        </div>

        {/* Trust / data line */}
        {toolCount > 0 && (
          <p
            style={{
              marginTop: 28,
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              color: "#9A9A92",
              letterSpacing: "0.04em",
              textAlign: "center",
            }}
          >
            {toolCount.toLocaleString()}{" "}
            {t("outils couverts", "tools covered")}{" · "}
            {t("prix vérifiés", "verified pricing")}{" · "}
            {t("recommandations indépendantes", "independent recommendations")}
          </p>
        )}

      </div>
    </section>
  );
};

export default HeroSection;
