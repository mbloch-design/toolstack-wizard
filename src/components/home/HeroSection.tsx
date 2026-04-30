import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "lucide-react";

const TOOL_LOGOS = [
  { name: "Figma",    domain: "figma.com" },
  { name: "Notion",   domain: "notion.so" },
  { name: "Slack",    domain: "slack.com" },
  { name: "HubSpot",  domain: "hubspot.com" },
  { name: "Zapier",   domain: "zapier.com" },
  { name: "Asana",    domain: "asana.com" },
  { name: "Linear",   domain: "linear.app" },
  { name: "Airtable", domain: "airtable.com" },
];

const HeroSection = ({ toolCount }: { toolCount: number }) => {
  const { lang, t, prefix } = useLang();

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-24 md:pb-28 md:pt-36">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
            {t("Indépendant · Gratuit · Résultats en 3 min", "Independent · Free · Results in 3 min")}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-extrabold text-foreground leading-[0.95] tracking-[-0.04em]"
          style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
        >
          {t("Ta stack SaaS", "Your SaaS stack")}<br />
          <span className="text-primary">{t("coûte trop cher.", "costs too much.")}</span>
        </h1>

        {/* Subheadline */}
        <p
          className="mt-6 text-muted-foreground leading-relaxed max-w-xl"
          style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}
        >
          {t(
            "On détecte les doublons, les outils dormants et les abonnements inutiles. Tu récupères en moyenne ",
            "We detect duplicates, dormant tools and unnecessary subscriptions. You recover on average "
          )}
          <strong className="text-foreground font-semibold">847€/an</strong>
          {t(" — en 5 minutes.", " — in 5 minutes.")}
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2.5 rounded-xl bg-foreground px-7 py-3.5 text-[15px] font-semibold text-background shadow-sm transition-all hover:opacity-85 hover:-translate-y-0.5"
          >
            {t("Analyser ma stack gratuitement", "Analyze my stack for free")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to={`${prefix}/tools`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("Explorer les outils →", "Browse tools →")}
          </Link>
        </div>

        {/* Social proof — tool logos */}
        <div className="mt-16 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest">
            {t(`${toolCount} outils analysés`, `${toolCount} tools analyzed`)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {TOOL_LOGOS.map((tool) => (
              <div
                key={tool.domain}
                title={tool.name}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card shadow-sm"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${tool.domain}&sz=64`}
                  alt={tool.name}
                  className="h-5 w-5 rounded object-contain"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            ))}
            <span className="text-sm text-muted-foreground/50 ml-1">+{toolCount - 8}</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
