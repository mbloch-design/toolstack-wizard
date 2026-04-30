import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";

const TOOL_LOGOS = [
  { name: "Figma",   domain: "figma.com" },
  { name: "Notion",  domain: "notion.so" },
  { name: "Slack",   domain: "slack.com" },
  { name: "HubSpot", domain: "hubspot.com" },
  { name: "Zapier",  domain: "zapier.com" },
  { name: "Asana",   domain: "asana.com" },
  { name: "Linear",  domain: "linear.app" },
  { name: "Airtable",domain: "airtable.com" },
];

const HeroSection = ({ toolCount }: { toolCount: number }) => {
  const { lang, t, prefix } = useLang();

  return (
    <section className="relative overflow-hidden bg-[#080c14]">
      {/* Subtle radial glow — cold blue-violet */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,hsl(var(--primary)/0.10)_0%,transparent_65%)]" />

      {/* Ghost number — typographic background element */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden"
      >
        <span
          className="font-['DM_Mono'] font-black text-white leading-none whitespace-nowrap"
          style={{ fontSize: "clamp(120px, 28vw, 320px)", opacity: 0.025, letterSpacing: "-0.04em" }}
        >
          847€
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-24 pt-32 text-center md:pb-32 md:pt-40">

        {/* Eyebrow — editorial lines */}
        <div className="mb-10 flex items-center gap-4 text-[11px] uppercase tracking-[0.22em] text-white/35">
          <span className="h-px w-10 bg-white/20" />
          {t("Diagnostic SaaS · Indépendant · Gratuit", "SaaS Diagnostic · Independent · Free")}
          <span className="h-px w-10 bg-white/20" />
        </div>

        {/* Headline — three-line editorial mix */}
        <h1 className="leading-none tracking-[-0.04em]">
          <span
            className="block text-white/40 font-extralight"
            style={{ fontSize: "clamp(2.6rem, 7.5vw, 5.5rem)" }}
          >
            {t("Ta stack SaaS", "Your SaaS stack")}
          </span>
          <span
            className="block text-white font-black"
            style={{ fontSize: "clamp(2.6rem, 7.5vw, 5.5rem)" }}
          >
            {t("coûte trop cher.", "costs too much.")}
          </span>
          <span
            className="mt-3 block text-[hsl(var(--primary))] font-light"
            style={{ fontSize: "clamp(1.6rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            {t("On trouve où couper.", "We help you cut the fat.")}
          </span>
        </h1>

        {/* Stat anchor */}
        <p className="mt-8 text-white/35 text-sm leading-relaxed">
          <span className="font-['DM_Mono'] text-[1.35rem] font-bold text-white/80">847€</span>
          {" "}{t("économisés en moyenne · ", "saved on average · ")}
          <span className="font-['DM_Mono']">{toolCount}</span>
          {" "}{t("outils analysés", "tools analyzed")}
        </p>

        {/* CTAs */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-[15px] font-semibold text-[#080c14] shadow-[0_0_40px_hsl(var(--primary)/0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_60px_hsl(var(--primary)/0.35)]"
          >
            {t("Analyser ma stack — gratuit", "Analyze my stack — free")}
          </Link>
          <Link
            to={`${prefix}/tools`}
            className="text-sm text-white/35 hover:text-white/65 transition-colors underline-offset-4 hover:underline"
          >
            {t("Explorer les outils →", "Browse tools →")}
          </Link>
        </div>

        {/* Trust line */}
        <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-white/20">
          {t(
            "Freelances · Solopreneurs · Fondateurs · Résultats en 3 min",
            "Freelancers · Solopreneurs · Founders · Results in 3 min"
          )}
        </p>

        {/* Tool logos strip */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            {TOOL_LOGOS.map((tool) => (
              <div
                key={tool.domain}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/5"
                title={tool.name}
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${tool.domain}&sz=64`}
                  alt={tool.name}
                  className="h-5 w-5 rounded object-contain opacity-60"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">
            Figma · Notion · Slack · HubSpot · Zapier · {t(`et ${toolCount - 8} autres`, `and ${toolCount - 8} more`)}
          </p>
        </div>

      </div>

      {/* Bottom fade to page background */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
