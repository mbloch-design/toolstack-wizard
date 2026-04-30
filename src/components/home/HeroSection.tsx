import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import { Search } from "lucide-react";

// Featured tool slugs — action chips
const FEATURED_SLUGS = [
  "figma", "notion", "slack", "hubspot", "zapier",
  "stripe", "linear", "asana", "airtable", "loom",
  "intercom", "calendly",
];

// Floating logos in the lower visual zone — scattered like Flim
const FLOAT_LOGOS = [
  { domain: "figma.com",     x: 8,   y: 18,  size: 52, delay: 0   },
  { domain: "notion.so",     x: 22,  y: 55,  size: 40, delay: 1.8 },
  { domain: "slack.com",     x: 6,   y: 72,  size: 48, delay: 3.2 },
  { domain: "hubspot.com",   x: 38,  y: 22,  size: 36, delay: 0.8 },
  { domain: "zapier.com",    x: 55,  y: 60,  size: 44, delay: 2.5 },
  { domain: "linear.app",    x: 70,  y: 15,  size: 40, delay: 1.2 },
  { domain: "airtable.com",  x: 80,  y: 45,  size: 52, delay: 4.0 },
  { domain: "intercom.com",  x: 88,  y: 72,  size: 36, delay: 0.4 },
  { domain: "stripe.com",    x: 45,  y: 80,  size: 48, delay: 3.0 },
  { domain: "loom.com",      x: 62,  y: 88,  size: 36, delay: 1.5 },
  { domain: "asana.com",     x: 18,  y: 88,  size: 40, delay: 2.0 },
  { domain: "calendly.com",  x: 92,  y: 28,  size: 44, delay: 0.6 },
  { domain: "github.com",    x: 32,  y: 42,  size: 36, delay: 2.8 },
  { domain: "atlassian.com", x: 75,  y: 88,  size: 40, delay: 1.0 },
];

const DRIFTS = ["drift-a", "drift-b", "drift-c"];

const KEYFRAMES = `
  @keyframes drift-a {
    0%,100% { transform: translate(0,0); }
    35%     { transform: translate(4px,-16px); }
    70%     { transform: translate(-3px,8px); }
  }
  @keyframes drift-b {
    0%,100% { transform: translate(0,0); }
    40%     { transform: translate(-5px,14px); }
    75%     { transform: translate(3px,-10px); }
  }
  @keyframes drift-c {
    0%,100% { transform: translate(0,0); }
    28%     { transform: translate(6px,-8px); }
    58%     { transform: translate(-4px,12px); }
    82%     { transform: translate(2px,-6px); }
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

  const featuredTools = useMemo(() => {
    if (!tools.length) return [];
    const bySlug = new Map(tools.map((tool) => [tool.slug || tool.id, tool]));
    return FEATURED_SLUGS.flatMap((slug) => {
      const tool = bySlug.get(slug);
      return tool ? [tool] : [];
    });
  }, [tools]);

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
    if (e.key === "Enter" && displayedTools.length > 0) handleToolClick(displayedTools[0]);
  };

  return (
    <div>
      <style>{KEYFRAMES}</style>

      {/* ── TOP SECTION: Asymmetric split — Left headline / Right action ── */}
      <section
        className="relative border-b border-border"
        style={{
          minHeight: "clamp(520px, 85vh, 820px)",
          backgroundImage:
            "linear-gradient(hsl(var(--border) / 0.7) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.7) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        {/* Off-white overlay to soften grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "hsl(var(--background) / 0.88)" }}
          aria-hidden
        />

        <div className="relative z-10 grid md:grid-cols-[1fr_1px_1fr] min-h-[inherit]">

          {/* LEFT — Headline géant */}
          <div className="flex flex-col justify-between px-8 py-14 md:px-14 md:py-16">

            {/* Eyebrow */}
            <p className="label-section">
              <span className="text-primary mr-2">▶</span>
              {t("diagnostic SaaS · indépendant · gratuit", "saas diagnostic · independent · free")}
            </p>

            {/* Giant headline — the visual statement */}
            <h1
              style={{
                fontSize: "clamp(3.2rem, 8.5vw, 8rem)",
                fontWeight: 700,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                color: "hsl(var(--foreground))",
              }}
            >
              {lang === "fr" ? (
                <>
                  Ta<br />
                  stack<br />
                  SaaS<br />
                  <span style={{ color: "hsl(var(--primary))" }}>coûte</span><br />
                  trop cher.
                </>
              ) : (
                <>
                  Your<br />
                  SaaS<br />
                  stack<br />
                  <span style={{ color: "hsl(var(--primary))" }}>costs</span><br />
                  too much.
                </>
              )}
            </h1>

            {/* Bottom count */}
            <p
              className="label-section"
              style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
            >
              {toolCount}+ {t("outils couverts", "tools covered")}
            </p>
          </div>

          {/* Vertical separator */}
          <div className="hidden md:block bg-border" />

          {/* RIGHT — Action zone */}
          <div className="flex flex-col justify-center px-8 py-14 md:px-14 md:py-16 border-t md:border-t-0 border-border">

            <p className="label-section mb-8">
              {t("COMMENCER LE DIAGNOSTIC", "START THE DIAGNOSTIC")}
            </p>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.78rem",
                lineHeight: 1.9,
                color: "hsl(var(--muted-foreground) / 0.65)",
                letterSpacing: "0.01em",
                marginBottom: "2rem",
                maxWidth: "340px",
              }}
            >
              {t(
                "→ commence par ton outil le plus cher.\nle diagnostic fait le reste.",
                "→ start with your most expensive tool.\nthe diagnostic does the rest."
              )}
            </p>

            {/* Search input */}
            <div className="relative mb-4">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: "hsl(var(--muted-foreground) / 0.35)" }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                placeholder={t(
                  "rechercher un outil...",
                  "search for a tool..."
                )}
                className="w-full border bg-card py-3.5 pl-11 pr-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 outline-none transition-colors duration-150"
                style={{
                  borderRadius: "2px",
                  borderColor: "hsl(var(--border))",
                  borderWidth: "1.5px",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--foreground))";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border))";
                }}
              />
            </div>

            {/* Tool chips */}
            <div className="flex flex-wrap gap-1.5">
              {displayedTools.length > 0 ? (
                displayedTools.map((tool) => {
                  const domain = getToolDomain(tool);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool)}
                      className="inline-flex items-center gap-1.5 border border-border bg-card px-3 py-1.5 text-xs font-mono text-foreground cursor-pointer transition-colors duration-100"
                      style={{ borderRadius: "2px" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "hsl(var(--foreground))";
                        (e.currentTarget as HTMLElement).style.background =
                          "hsl(var(--foreground))";
                        (e.currentTarget as HTMLElement).style.color =
                          "hsl(var(--background))";
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
                          width={12}
                          height={12}
                          className="object-contain opacity-70"
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
                  className="text-sm font-mono"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {t("Aucun résultat. ", "No result. ")}
                  <button
                    onClick={() => navigate(`${prefix}/selector`)}
                    className="underline underline-offset-2"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    {t("Lancer le diagnostic →", "Start diagnostic →")}
                  </button>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ── VISUAL ZONE: Floating logos on grid — like Flim's scattered images ── */}
      <section
        className="relative overflow-hidden border-b border-border hidden md:block"
        style={{
          height: "320px",
          background: "hsl(var(--secondary) / 0.4)",
        }}
      >
        {/* Grid bg on top of bg color */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border) / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />

        {FLOAT_LOGOS.map((logo, i) => (
          <div
            key={logo.domain}
            data-float
            className="absolute"
            style={{
              left: `${logo.x}%`,
              top: `${logo.y}%`,
              animation: `${DRIFTS[i % 3]} ${10 + (i % 5)}s ease-in-out ${logo.delay}s infinite`,
              willChange: "transform",
            }}
          >
            <div
              className="flex items-center justify-center border border-border bg-card shadow-sm"
              style={{
                width: logo.size,
                height: logo.size,
                borderRadius: "4px",
              }}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${logo.domain}&sz=64`}
                alt=""
                width={Math.round(logo.size * 0.5)}
                height={Math.round(logo.size * 0.5)}
                className="object-contain"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
        ))}

        {/* Centered overlay label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p
            className="label-section px-4 py-1.5 bg-background border border-border"
            style={{ borderRadius: "2px", letterSpacing: "0.12em" }}
          >
            {toolCount}+ {t("outils SaaS analysés", "SaaS tools analyzed")}
          </p>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
