import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "lucide-react";

const LOGOS = [
  { domain: "figma.com",     x: 4,  y: 12, size: 40, opacity: 0.6,  dur: 9,  delay: 0   },
  { domain: "notion.so",     x: 11, y: 35, size: 34, opacity: 0.38, dur: 12, delay: 3.5 },
  { domain: "slack.com",     x: 3,  y: 57, size: 40, opacity: 0.5,  dur: 10, delay: 1.2 },
  { domain: "hubspot.com",   x: 13, y: 77, size: 32, opacity: 0.3,  dur: 14, delay: 5   },
  { domain: "zapier.com",    x: 5,  y: 89, size: 38, opacity: 0.45, dur: 8,  delay: 2.5 },
  { domain: "linear.app",    x: 88, y: 10, size: 36, opacity: 0.45, dur: 11, delay: 1   },
  { domain: "airtable.com",  x: 82, y: 32, size: 42, opacity: 0.65, dur: 9,  delay: 4   },
  { domain: "intercom.com",  x: 91, y: 53, size: 34, opacity: 0.32, dur: 13, delay: 0.5 },
  { domain: "stripe.com",    x: 83, y: 73, size: 40, opacity: 0.55, dur: 10, delay: 3   },
  { domain: "loom.com",      x: 90, y: 89, size: 32, opacity: 0.38, dur: 15, delay: 2   },
  { domain: "asana.com",     x: 33, y: 5,  size: 34, opacity: 0.32, dur: 12, delay: 6   },
  { domain: "calendly.com",  x: 63, y: 6,  size: 36, opacity: 0.42, dur: 10, delay: 1.8 },
  { domain: "github.com",    x: 36, y: 91, size: 36, opacity: 0.38, dur: 11, delay: 4.5 },
  { domain: "atlassian.com", x: 62, y: 90, size: 32, opacity: 0.28, dur: 9,  delay: 0.8 },
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

const HeroSection = ({ toolCount }: { toolCount: number }) => {
  const { lang, t, prefix } = useLang();

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "clamp(580px, 88vh, 820px)" }}
    >
      <style>{KEYFRAMES}</style>

      {/* Glow bleu centré — très discret */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 55% 45% at 50% 46%, hsl(224 76% 60% / 0.08) 0%, transparent 65%)",
        }}
      />

      {/* Logos flottants — desktop */}
      <div className="pointer-events-none absolute inset-0 hidden md:block select-none" aria-hidden>
        {LOGOS.map((logo, i) => (
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
              className="flex items-center justify-center rounded-xl border border-border bg-card"
              style={{
                width: logo.size,
                height: logo.size,
                boxShadow: "0 1px 8px hsl(0 0% 0% / 0.35)",
              }}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${logo.domain}&sz=64`}
                alt=""
                width={Math.round(logo.size * 0.48)}
                height={Math.round(logo.size * 0.48)}
                className="rounded object-contain"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Contenu central */}
      <div className="relative z-10 flex min-h-[inherit] flex-col items-center justify-center px-6 py-24 text-center">

        {/* Label section */}
        <p className="label-section mb-6">
          {t("Diagnostic SaaS · Indépendant · Gratuit", "SaaS Diagnostic · Independent · Free")}
        </p>

        {/* Headline — 600, pas d'extrabold */}
        <h1
          className="max-w-xl text-foreground"
          style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)" }}
        >
          {t("Ta stack SaaS", "Your SaaS stack")}<br />
          <span className="text-primary">
            {t("te coûte trop cher.", "is costing you too much.")}
          </span>
        </h1>

        {/* Sous-titre — niveau 2 de la hiérarchie */}
        <p
          className="mx-auto mt-5 max-w-sm"
          style={{ fontSize: "0.95rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.7 }}
        >
          {t(
            "Doublons, dormants, inutiles — détectés en 5 min. 847€/an récupérés en moyenne.",
            "Duplicates, dormant, wasted — found in 5 min. 847€/yr saved on average."
          )}
        </p>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-2.5">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all duration-150 hover:opacity-90 hover:-translate-y-px"
            style={{ boxShadow: "0 0 20px hsl(224 76% 60% / 0.25), 0 2px 8px hsl(0 0% 0% / 0.3)" }}
          >
            {t("Analyser ma stack — gratuit", "Analyze my stack — free")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground) / 0.45)", letterSpacing: "0.04em" }}>
            {t(`Sans inscription · ${toolCount} outils couverts`, `No signup · ${toolCount} tools covered`)}
          </p>
        </div>

        {/* Logos mobile */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 md:hidden">
          {LOGOS.slice(0, 8).map((logo) => (
            <div key={logo.domain} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card">
              <img
                src={`https://www.google.com/s2/favicons?domain=${logo.domain}&sz=64`}
                alt=""
                className="h-4 w-4 rounded object-contain"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
