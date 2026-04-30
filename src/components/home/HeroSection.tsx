import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import { Search } from "lucide-react";

// Featured tool slugs — shown as chips by default
const FEATURED_SLUGS = [
  "figma", "notion", "slack", "hubspot", "zapier",
  "stripe", "linear", "asana", "airtable", "loom",
  "intercom", "calendly",
];

// Background floating logos — purely decorative
const BG_LOGOS = [
  { domain: "figma.com",     x: 4,  y: 14, size: 36, opacity: 0.12, dur: 9,  delay: 0   },
  { domain: "notion.so",     x: 10, y: 36, size: 30, opacity: 0.09, dur: 12, delay: 3.5 },
  { domain: "slack.com",     x: 3,  y: 60, size: 36, opacity: 0.11, dur: 10, delay: 1.2 },
  { domain: "hubspot.com",   x: 12, y: 80, size: 28, opacity: 0.08, dur: 14, delay: 5   },
  { domain: "zapier.com",    x: 5,  y: 90, size: 34, opacity: 0.10, dur: 8,  delay: 2.5 },
  { domain: "linear.app",    x: 88, y: 12, size: 32, opacity: 0.10, dur: 11, delay: 1   },
  { domain: "airtable.com",  x: 83, y: 33, size: 38, opacity: 0.13, dur: 9,  delay: 4   },
  { domain: "intercom.com",  x: 90, y: 55, size: 30, opacity: 0.08, dur: 13, delay: 0.5 },
  { domain: "stripe.com",    x: 84, y: 75, size: 36, opacity: 0.11, dur: 10, delay: 3   },
  { domain: "loom.com",      x: 91, y: 90, size: 28, opacity: 0.09, dur: 15, delay: 2   },
  { domain: "asana.com",     x: 34, y: 5,  size: 30, opacity: 0.08, dur: 12, delay: 6   },
  { domain: "calendly.com",  x: 64, y: 6,  size: 32, opacity: 0.10, dur: 10, delay: 1.8 },
  { domain: "github.com",    x: 37, y: 92, size: 32, opacity: 0.09, dur: 11, delay: 4.5 },
  { domain: "atlassian.com", x: 63, y: 91, size: 28, opacity: 0.07, dur: 9,  delay: 0.8 },
];

const DRIFTS = ["drift-a", "drift-b", "drift-c"];

const KEYFRAMES = `
  @keyframes drift-a {
    0%,100% { transform: translate(0,0); }
    35%     { transform: translate(3px,-14px); }
    70%     { transform: translate(-2px,7px); }
  }
  @keyframes drift-b {
    0%,100% { transform: translate(0,0); }
    40%     { transform: translate(-4px,12px); }
    75%     { transform: translate(2px,-9px); }
  }
  @keyframes drift-c {
    0%,100% { transform: translate(0,0); }
    28%     { transform: translate(5px,-7px); }
    58%     { transform: translate(-3px,10px); }
    82%     { transform: translate(1px,-5px); }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-float] { animation: none !important; }
  }
`;

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

  // Build featured chips from slug list
  const featuredTools = useMemo(() => {
    if (!tools.length) return [];
    const bySlug = new Map(tools.map((tool) => [tool.slug || tool.id, tool]));
    return FEATURED_SLUGS.flatMap((slug) => {
      const tool = bySlug.get(slug);
      return tool ? [tool] : [];
    });
  }, [tools]);

  // Search results when query is active
  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return tools
      .filter((tool) =>
        tool.name.toLowerCase().includes(q) ||
        (tool.slug || tool.id).toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, tools]);

  const displayedTools = query.length >= 2 ? searchResults : featuredTools;

  const handleToolClick = (tool: any) => {
    const slug = tool.slug || tool.id;
    navigate(`${prefix}/selector?from=${slug}`);
  };

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && displayedTools.length > 0) {
      handleToolClick(displayedTools[0]);
    }
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "clamp(600px, 90vh, 860px)" }}
    >
      <style>{KEYFRAMES}</style>

      {/* Grid structurel — colonnes visibles */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Logos flottants — décoratifs, très discrets */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block select-none"
        aria-hidden
      >
        {BG_LOGOS.map((logo, i) => (
          <div
            key={logo.domain}
            data-float
            style={{
              position: "absolute",
              left: `${logo.x}%`,
              top: `${logo.y}%`,
              opacity: logo.opacity,
              animation: `${DRIFTS[i % 3]} ${logo.dur}s ease-in-out ${logo.delay}s infinite`,
              willChange: "transform",
            }}
          >
            <div
              className="flex items-center justify-center rounded-lg border border-border bg-card"
              style={{
                width: logo.size,
                height: logo.size,
                boxShadow: "0 1px 6px hsl(0 0% 0% / 0.3)",
              }}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${logo.domain}&sz=64`}
                alt=""
                width={Math.round(logo.size * 0.48)}
                height={Math.round(logo.size * 0.48)}
                className="rounded object-contain"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Contenu central */}
      <div className="relative z-10 flex min-h-[inherit] flex-col items-center justify-center px-6 py-20 text-center">

        {/* Eyebrow — monospace brut */}
        <p className="label-section mb-8 tracking-widest">
          <span className="text-primary/60 mr-2">//</span>
          {t("diagnostic SaaS · indépendant · gratuit", "saas diagnostic · independent · free")}
        </p>

        {/* Headline — brutaliste, poids maximal */}
        <h1
          className="max-w-2xl"
          style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 0.98 }}
        >
          <span className="text-foreground">
            {t("Ta stack SaaS", "Your SaaS stack")}
          </span>
          <br />
          <span className="text-primary">
            {t("te coûte trop cher.", "is costing you too much.")}
          </span>
        </h1>

        {/* Sous-titre — mono, petit, dense */}
        <p
          className="mx-auto mt-7 max-w-sm font-mono"
          style={{
            fontSize: "0.8rem",
            color: "hsl(var(--muted-foreground) / 0.65)",
            lineHeight: 1.8,
            letterSpacing: "0.01em",
          }}
        >
          {t(
            "→ commence par ton outil le plus cher — le diagnostic fait le reste.",
            "→ start with your most expensive tool — the diagnostic does the rest."
          )}
        </p>

        {/* Zone interactive */}
        <div className="mt-10 w-full max-w-lg">

          {/* Search input — brutal */}
          <div className="relative mb-5">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder={t("quel outil veux-tu analyser ?", "which tool do you want to analyze?")}
              className="w-full border-2 bg-card py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none font-mono transition-colors duration-150"
              style={{
                borderRadius: "2px",
                borderColor: "hsl(var(--border))",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
            />
          </div>

          {/* Tool chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {displayedTools.length > 0 ? (
              displayedTools.map((tool) => {
                const domain = getToolDomain(tool);
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className="group inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 text-xs font-mono text-foreground cursor-pointer transition-colors duration-100"
                    style={{ borderRadius: "2px" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary))";
                      (e.currentTarget as HTMLElement).style.color = "hsl(var(--primary))";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "";
                      (e.currentTarget as HTMLElement).style.color = "";
                    }}
                  >
                    {domain && (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                        alt=""
                        width={14}
                        height={14}
                        className="rounded-sm object-contain opacity-80 group-hover:opacity-100"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {tool.name}
                  </button>
                );
              })
            ) : query.length >= 2 ? (
              <p
                className="text-sm"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
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
            className="mt-5"
            style={{
              fontSize: "0.72rem",
              color: "hsl(var(--muted-foreground) / 0.4)",
              letterSpacing: "0.04em",
            }}
          >
            {t(
              `Sans inscription · ${toolCount} outils couverts`,
              `No signup · ${toolCount} tools covered`
            )}
          </p>
        </div>

        {/* Logos mobile — fallback visuel */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 md:hidden">
          {BG_LOGOS.slice(0, 8).map((logo) => (
            <div
              key={logo.domain}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${logo.domain}&sz=64`}
                alt=""
                className="h-4 w-4 rounded object-contain"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
