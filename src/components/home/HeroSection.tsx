import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "lucide-react";

const TOOL_LOGOS = [
  { name: "Figma",     domain: "figma.com" },
  { name: "Notion",    domain: "notion.so" },
  { name: "Slack",     domain: "slack.com" },
  { name: "HubSpot",   domain: "hubspot.com" },
  { name: "Zapier",    domain: "zapier.com" },
  { name: "Asana",     domain: "asana.com" },
  { name: "Linear",    domain: "linear.app" },
  { name: "Airtable",  domain: "airtable.com" },
  { name: "Intercom",  domain: "intercom.com" },
  { name: "Stripe",    domain: "stripe.com" },
  { name: "Loom",      domain: "loom.com" },
  { name: "Calendly",  domain: "calendly.com" },
];

const HeroSection = ({ toolCount }: { toolCount: number }) => {
  const { lang, t, prefix } = useLang();

  return (
    <section className="relative overflow-hidden">
      {/* Subtle background radial — uses theme variables, safe cross-browser */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--primary) / 0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center md:pb-28 md:pt-36">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
            {t("Diagnostic SaaS · 100% indépendant · Gratuit", "SaaS Diagnostic · 100% independent · Free")}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-extrabold tracking-tight text-foreground"
          style={{ fontSize: "clamp(2.6rem, 6.5vw, 5rem)", lineHeight: 1.05, letterSpacing: "-0.035em" }}
        >
          {t("Ta stack SaaS te coûte", "Your SaaS stack")}<br />
          {lang === "fr" ? (
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 100%)" }}
            >
              bien trop cher.
            </span>
          ) : (
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 100%)" }}
            >
              way too much.
            </span>
          )}
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t(
            "Doublons, outils dormants, abonnements inutiles — on détecte tout en 5 minutes. Sans inscription.",
            "Duplicates, dormant tools, wasted subscriptions — detected in 5 minutes. No signup required."
          )}
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
          >
            {t("Analyser ma stack — c'est gratuit", "Analyze my stack — it's free")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Stats pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {[
            { value: "847€", label: t("économisés en moyenne", "saved on average") },
            { value: `${toolCount}`, label: t("outils couverts", "tools covered") },
            { value: "< 5 min", label: t("pour un résultat", "for a result") },
          ].map(({ value, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2">
              <span className="font-bold text-foreground text-sm">{value}</span>
              <span className="text-muted-foreground/70 text-xs">{label}</span>
            </div>
          ))}
        </div>

        {/* Tool logos strip */}
        <div className="mt-14 flex flex-col items-center gap-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/40">
            {t("Parmi les outils analysés", "Among the tools analyzed")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {TOOL_LOGOS.map((tool) => (
              <div
                key={tool.domain}
                title={tool.name}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-transform hover:scale-110"
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
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
