import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import { Search } from "lucide-react";

const FEATURED_SLUGS = [
  "figma", "notion", "slack", "hubspot", "zapier",
  "stripe", "linear", "asana", "airtable", "loom",
  "intercom", "calendly",
];

// Floating ambient logos — fixed positions, independent of tool data
const FLOAT_LOGOS = [
  // Left column
  { domain: "notion.so",    top: "16%", left: "3%",   size: 46, delay: "0s",    duration: "4.2s" },
  { domain: "figma.com",    top: "44%", left: "1.5%", size: 52, delay: "1.1s",  duration: "5s"   },
  { domain: "zapier.com",   top: "72%", left: "5%",   size: 38, delay: "2.2s",  duration: "4.6s" },
  // Right column
  { domain: "slack.com",    top: "20%", right: "3%",  size: 52, delay: "0.6s",  duration: "4.8s" },
  { domain: "hubspot.com",  top: "48%", right: "1.5%",size: 46, delay: "1.7s",  duration: "4.3s" },
  { domain: "stripe.com",   top: "74%", right: "6%",  size: 38, delay: "0.3s",  duration: "5.2s" },
  // Top corners
  { domain: "linear.app",   top: "8%",  left: "19%",  size: 36, delay: "0.9s",  duration: "3.8s" },
  { domain: "asana.com",    top: "8%",  right: "19%", size: 36, delay: "1.5s",  duration: "4.5s" },
];

function getToolDomain(tool: any): string {
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

const HeroSection = ({ toolCount }: { toolCount: number }) => {
  const { lang, t, prefix } = useLang();
  const { tools } = useTools();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
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
      .filter((t) =>
        t.name.toLowerCase().includes(q) ||
        (t.slug || t.id).toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, tools]);

  const displayedTools = query.length >= 2 ? searchResults : featuredTools;

  const handleToolClick = (tool: any) => {
    navigate(`${prefix}/selector?from=${tool.slug || tool.id}`);
  };

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && displayedTools.length > 0) handleToolClick(displayedTools[0]);
  };

  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6 overflow-hidden"
      style={{ minHeight: "clamp(580px, 88vh, 860px)" }}
    >
      {/* Subtle radial glow — vibe Linear/Vercel */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(224 76% 60% / 0.12) 0%, transparent 70%)",
        }}
      />

      {/* Floating tool logos — desktop only */}
      {FLOAT_LOGOS.map((logo, i) => (
        <div
          key={i}
          className="pointer-events-none absolute hidden xl:flex items-center justify-center rounded-xl border border-border bg-card"
          style={{
            top: logo.top,
            left: "left" in logo ? logo.left : undefined,
            right: "right" in logo ? logo.right : undefined,
            width: logo.size,
            height: logo.size,
            opacity: 0.55,
            animation: `float ${logo.duration} ease-in-out infinite`,
            animationDelay: logo.delay,
            boxShadow: "0 4px 16px hsl(0 0% 0% / 0.12)",
          }}
        >
          <img
            src={`https://www.google.com/s2/favicons?domain=${logo.domain}&sz=64`}
            alt=""
            aria-hidden
            width={logo.size * 0.52}
            height={logo.size * 0.52}
            loading="lazy"
            className="rounded-sm object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      ))}

      {/* Very subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--border) / 0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-3xl mx-auto">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs"
            style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em", color: "hsl(var(--muted-foreground))" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary"
              style={{ boxShadow: "0 0 6px hsl(var(--primary))" }}
            />
            {t("indépendant · gratuit · sans inscription", "independent · free · no signup")}
          </span>
        </div>

        {/* Main headline — Bricolage Grotesque */}
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(2.6rem, 6.5vw, 5.2rem)",
            fontWeight: 800,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            color: "hsl(var(--foreground))",
          }}
        >
          {t("Ta stack SaaS", "Your SaaS stack")}
          <br />
          <span style={{ color: "hsl(var(--primary))" }}>
            {t("te coûte trop cher.", "is costing you too much.")}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto mt-5 max-w-md"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.95rem",
            lineHeight: 1.65,
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {t(
            "Commence par ton outil le plus cher — le diagnostic détecte les doublons, les alternatives moins chères, et les abonnements à couper.",
            "Start with your most expensive tool — the diagnostic detects duplicates, cheaper alternatives, and subscriptions to cut."
          )}
        </p>

        {/* Search */}
        <div className="relative mt-8 max-w-lg mx-auto">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder={t("Rechercher un outil…", "Search for a tool…")}
            className="w-full rounded-lg border bg-card py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-150"
            style={{
              borderColor: "hsl(var(--border))",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.6)";
              e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--border))";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Tool chips */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {displayedTools.length > 0 ? (
            displayedTools.map((tool) => {
              const domain = getToolDomain(tool);
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer transition-all duration-150"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.5)";
                    (e.currentTarget as HTMLElement).style.background = "hsl(var(--accent))";
                    (e.currentTarget as HTMLElement).style.color = "hsl(var(--accent-foreground))";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "";
                    (e.currentTarget as HTMLElement).style.background = "";
                    (e.currentTarget as HTMLElement).style.color = "";
                  }}
                >
                  {domain && (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                      alt=""
                      width={13}
                      height={13}
                      className="rounded-sm object-contain opacity-80"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  {tool.name}
                </button>
              );
            })
          ) : query.length >= 2 ? (
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("Aucun outil trouvé. ", "No tool found. ")}
              <button
                onClick={() => navigate(`${prefix}/selector`)}
                className="text-primary underline underline-offset-2"
              >
                {t("Lancer le diagnostic →", "Start diagnostic →")}
              </button>
            </p>
          ) : null}
        </div>

        {/* Hint */}
        <p
          className="mt-6"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.68rem",
            letterSpacing: "0.06em",
            color: "hsl(var(--muted-foreground) / 0.45)",
          }}
        >
          {t(
            `${toolCount} outils couverts · aucune donnée stockée`,
            `${toolCount} tools covered · no data stored`
          )}
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
