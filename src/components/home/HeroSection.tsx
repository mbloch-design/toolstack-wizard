import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { Search } from "lucide-react";
import { getToolDomain } from "@/lib/toolUtils";

const FEATURED_SLUGS = [
  "figma", "notion", "slack", "hubspot", "zapier",
  "stripe", "linear", "asana", "airtable", "loom",
  "intercom", "calendly",
];

const BRAND_ICONS: Record<string, string> = {
  airtable: "airtable",
  asana: "asana",
  calendly: "calendly",
  figma: "figma",
  hubspot: "hubspot",
  intercom: "intercom",
  linear: "linear",
  loom: "loom",
  notion: "notion",
  slack: "slack",
  stripe: "stripe",
  zapier: "zapier",
};

const BRAND_COLORS: Record<string, string> = {
  airtable: "18BFFF",
  asana: "F06A6A",
  calendly: "006BFF",
  figma: "F24E1E",
  hubspot: "FF5C35",
  intercom: "0A7CFF",
  linear: "5E6AD2",
  loom: "625DF5",
  notion: "111111",
  slack: "4A154B",
  stripe: "635BFF",
  zapier: "FF4F00",
};

const getBrandIcon = (key?: string) => {
  if (!key) return "";
  const normalized = key.replace(/^www\./, "").split(".")[0].toLowerCase();
  const icon = BRAND_ICONS[normalized];
  if (!icon) return "";
  return `https://cdn.simpleicons.org/${icon}/${BRAND_COLORS[normalized] || "111111"}`;
};

// Floating brand marks. We avoid Google favicon, which can emit noisy 404s.
// floatDelay = continuous bob offset, revealDelay = staggered entrance
type FloatingLogo = {
  domain: string;
  label: string;
  top: string;
  left?: string;
  right?: string;
  size: number;
  floatDuration: string;
  floatDelay: string;
  revealDelay: string;
};

const FLOAT_LOGOS: FloatingLogo[] = [
  { domain: "notion.so", label: "Notion", top: "12%", left: "5%", size: 56, floatDuration: "4.4s", floatDelay: "0s", revealDelay: "0.15s" },
  { domain: "hubspot.com", label: "HubSpot", top: "44%", left: "2%", size: 72, floatDuration: "5.1s", floatDelay: "1.2s", revealDelay: "0.45s" },
  { domain: "stripe.com", label: "Stripe", top: "74%", left: "6%", size: 58, floatDuration: "4.7s", floatDelay: "2.0s", revealDelay: "0.75s" },
  { domain: "figma.com", label: "Figma", top: "10%", right: "5%", size: 72, floatDuration: "4.9s", floatDelay: "0.5s", revealDelay: "0.10s" },
  { domain: "zapier.com", label: "Zapier", top: "46%", right: "2%", size: 60, floatDuration: "5.3s", floatDelay: "1.7s", revealDelay: "0.50s" },
  { domain: "linear.app", label: "Linear", top: "76%", right: "5%", size: 64, floatDuration: "4.2s", floatDelay: "0.9s", revealDelay: "0.80s" },
  { domain: "airtable.com", label: "Airtable", top: "4%", left: "22%", size: 44, floatDuration: "3.9s", floatDelay: "1.5s", revealDelay: "0.30s" },
  { domain: "intercom.com", label: "Intercom", top: "4%", right: "22%", size: 44, floatDuration: "4.6s", floatDelay: "0.3s", revealDelay: "0.20s" },
];

const HeroSection = ({ toolCount }: { toolCount: number }) => {
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
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
        (t.name ?? "").toLowerCase().includes(q) ||
        (t.slug || t.id || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, tools]);

  const displayedTools = query.length >= 2 ? searchResults : featuredTools;

  const handleToolClick = (tool: ToolSummary) => {
    navigate(`${prefix}/selector?from=${tool.slug || tool.id}`);
  };

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && displayedTools.length > 0) handleToolClick(displayedTools[0]);
  };

  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6 overflow-hidden -mt-[88px] pt-[88px]"
      style={{ minHeight: "clamp(580px, 88vh, 860px)" }}
    >
      {/* Mesh gradient background — blurry blue/white blobs */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: [
            "radial-gradient(ellipse 70% 60% at 52% 28%, rgba(255,255,255,0.92) 0%, transparent 62%)",
            "radial-gradient(ellipse 58% 52% at 2% 2%, hsl(214 72% 86% / 0.85) 0%, transparent 58%)",
            "radial-gradient(ellipse 52% 48% at 98% 95%, hsl(220 65% 87% / 0.80) 0%, transparent 55%)",
            "radial-gradient(ellipse 44% 40% at 10% 92%, hsl(210 60% 89% / 0.65) 0%, transparent 52%)",
            "radial-gradient(ellipse 40% 36% at 92% 8%, hsl(218 68% 88% / 0.70) 0%, transparent 50%)",
            "hsl(214 52% 93%)",
          ].join(", "),
        }}
      />

      {/* Floating tool icons — desktop only */}
      {/* Wrapper: continuous float (translateY) — img: one-shot reveal (scale+opacity) */}
      {FLOAT_LOGOS.map((logo, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none absolute hidden xl:block"
          style={{
            top: logo.top,
            left: logo.left,
            right: logo.right,
            width: logo.size,
            height: logo.size,
            animation: `float ${logo.floatDuration} ease-in-out ${logo.floatDelay} infinite`,
          }}
        >
          <img
            src={getBrandIcon(logo.domain)}
            alt=""
            loading="eager"
            width={logo.size}
            height={logo.size}
            className="rounded-2xl bg-card p-3 ring-1 ring-border"
            style={{
              width: logo.size,
              height: logo.size,
              objectFit: "contain",
              /* Spring reveal: cubic-bezier overshoot gives a pop feel */
              animation: `logo-reveal 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${logo.revealDelay} both`,
              boxShadow: "0 8px 28px hsl(0 0% 0% / 0.20), 0 2px 6px hsl(0 0% 0% / 0.10)",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
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

        {/* Main headline */}
        <h1 className="ts-h1">
          {t("Ta stack SaaS", "Your SaaS stack")}
          <br />
          <span className="text-primary">
            {t("te coûte trop cher.", "is costing you too much.")}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto mt-5 max-w-md"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: "1.125rem",
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
            style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}
          />
          <input
            id="home-tool-search"
            name="home-tool-search"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder={t("Rechercher un outil…", "Search for a tool…")}
            className="w-full rounded-lg border bg-card py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-150"
            style={{
              borderColor: "hsl(var(--border))",
              fontFamily: 'Inter, system-ui, sans-serif',
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
                const iconUrl = getBrandIcon(tool.slug || tool.id || getToolDomain(tool));
                return (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer transition-all duration-150"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
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
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt=""
                      width={13}
                      height={13}
                      className="h-[13px] w-[13px] shrink-0 rounded-sm object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-sm bg-secondary text-[8px] font-bold text-foreground"
                      aria-hidden="true"
                    >
                      {(tool.name || "?").charAt(0).toUpperCase()}
                    </span>
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
        <p className="ts-mono-badge mt-6" style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}>
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
