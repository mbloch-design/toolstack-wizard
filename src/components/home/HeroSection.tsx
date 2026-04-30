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
  { name: "Intercom", domain: "intercom.com" },
  { name: "Stripe",   domain: "stripe.com" },
];

const HeroSection = ({ toolCount }: { toolCount: number }) => {
  const { lang, t, prefix } = useLang();

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:pt-28">

        {/* Eyebrow — minimal, all-caps, muted */}
        <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
          {t("Diagnostic SaaS · Indépendant · Gratuit", "SaaS Diagnostic · Independent · Free")}
        </p>

        {/* Headline — left-aligned, fills viewport width, brutal scale */}
        <h1 className="font-black leading-[0.92] tracking-[-0.045em] text-foreground"
          style={{ fontSize: "clamp(3.2rem, 8.5vw, 7.5rem)" }}>
          {t("Ta stack SaaS", "Your SaaS stack")}<br />
          <em className="not-italic text-primary">{t("coûte trop cher.", "costs too much.")}</em>
        </h1>

        {/* Divider + bottom row — creates visual break */}
        <div className="mt-10 border-t border-border pt-8 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-end">

          {/* Left — punchy stat + subtext */}
          <div className="space-y-2">
            <p className="font-black text-foreground" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", letterSpacing: "-0.03em" }}>
              <span className="text-primary">847€</span>
              {t(" récupérés en moyenne.", " recovered on average.")}
            </p>
            <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
              {t(
                "Doublons, outils dormants, abonnements inutiles — on les détecte en 5 minutes.",
                "Duplicates, dormant tools, unnecessary subscriptions — we detect them in 5 minutes."
              )}
            </p>
          </div>

          {/* Right — CTA */}
          <div className="flex flex-col gap-3 items-start md:items-end">
            <Link
              to={`${prefix}/selector`}
              className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-4 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 whitespace-nowrap"
            >
              {t("Analyser ma stack", "Analyze my stack")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-muted-foreground/50">
              {t("Gratuit · Sans inscription · 5 minutes", "Free · No signup · 5 minutes")}
            </p>
          </div>

        </div>

        {/* Tool logos — horizontal strip, treated as a design element */}
        <div className="mt-12 flex items-center gap-4">
          <span className="shrink-0 text-[11px] uppercase tracking-widest text-muted-foreground/40">
            {toolCount}
          </span>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-1.5">
            {TOOL_LOGOS.map((tool) => (
              <div
                key={tool.domain}
                title={tool.name}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${tool.domain}&sz=64`}
                  alt={tool.name}
                  className="h-4 w-4 rounded object-contain"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            ))}
          </div>
          <div className="h-px flex-1 bg-border" />
          <span className="shrink-0 text-[11px] uppercase tracking-widest text-muted-foreground/40">
            {t("outils", "tools")}
          </span>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
