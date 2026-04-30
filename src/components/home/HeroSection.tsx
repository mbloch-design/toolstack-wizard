import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "lucide-react";

const LOGOS = [
  // Left cluster
  { domain: "figma.com",     x: 4,  y: 12, size: 44, opacity: 0.7,  dur: 9,  delay: 0   },
  { domain: "notion.so",     x: 11, y: 32, size: 38, opacity: 0.45, dur: 12, delay: 3.5 },
  { domain: "slack.com",     x: 3,  y: 55, size: 44, opacity: 0.6,  dur: 10, delay: 1.2 },
  { domain: "hubspot.com",   x: 13, y: 75, size: 36, opacity: 0.35, dur: 14, delay: 5   },
  { domain: "zapier.com",    x: 5,  y: 88, size: 42, opacity: 0.55, dur: 8,  delay: 2.5 },
  // Right cluster
  { domain: "linear.app",    x: 88, y: 10, size: 40, opacity: 0.55, dur: 11, delay: 1   },
  { domain: "airtable.com",  x: 82, y: 30, size: 46, opacity: 0.75, dur: 9,  delay: 4   },
  { domain: "intercom.com",  x: 91, y: 52, size: 38, opacity: 0.4,  dur: 13, delay: 0.5 },
  { domain: "stripe.com",    x: 83, y: 72, size: 44, opacity: 0.65, dur: 10, delay: 3   },
  { domain: "loom.com",      x: 90, y: 88, size: 36, opacity: 0.45, dur: 15, delay: 2   },
  // Top
  { domain: "asana.com",     x: 32, y: 4,  size: 38, opacity: 0.4,  dur: 12, delay: 6   },
  { domain: "calendly.com",  x: 62, y: 5,  size: 40, opacity: 0.5,  dur: 10, delay: 1.8 },
  // Bottom
  { domain: "github.com",    x: 35, y: 91, size: 40, opacity: 0.45, dur: 11, delay: 4.5 },
  { domain: "atlassian.com", x: 63, y: 90, size: 36, opacity: 0.35, dur: 9,  delay: 0.8 },
];

const DRIFTS = ["drift-a", "drift-b", "drift-c"];

const KEYFRAMES = `
  @keyframes drift-a {
    0%,100% { transform: translate(0,0) rotate(0deg); }
    30%     { transform: translate(4px,-16px) rotate(1deg); }
    65%     { transform: translate(-3px,8px) rotate(-0.7deg); }
  }
  @keyframes drift-b {
    0%,100% { transform: translate(0,0) rotate(0deg); }
    40%     { transform: translate(-5px,14px) rotate(-1.2deg); }
    75%     { transform: translate(3px,-10px) rotate(0.9deg); }
  }
  @keyframes drift-c {
    0%,100% { transform: translate(0,0) rotate(0deg); }
    25%     { transform: translate(6px,-8px) rotate(0.5deg); }
    55%     { transform: translate(-4px,12px) rotate(-0.8deg); }
    80%     { transform: translate(2px,-6px) rotate(0.3deg); }
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
      style={{ minHeight: "clamp(600px, 90vh, 860px)" }}
    >
      <style>{KEYFRAMES}</style>

      {/* Noise grain overlay — très léger, comme Cursor */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />

      {/* Radial glow — bleu froid centré, très discret */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 65% 55% at 50% 45%, hsl(224 76% 60% / 0.10) 0%, transparent 70%)",
        }}
      />

      {/* Floating logos — desktop uniquement */}
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
              className="flex items-center justify-center rounded-2xl border border-border bg-card"
              style={{
                width: logo.size,
                height: logo.size,
                boxShadow: "0 2px 12px hsl(224 76% 60% / 0.08), 0 1px 3px hsl(0 0% 0% / 0.4)",
              }}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${logo.domain}&sz=64`}
                alt=""
                width={Math.round(logo.size * 0.5)}
                height={Math.round(logo.size * 0.5)}
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

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
            {t("Diagnostic SaaS · Indépendant · Gratuit", "SaaS Diagnostic · Independent · Free")}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="max-w-2xl font-extrabold text-foreground"
          style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.6rem)", lineHeight: 1.06, letterSpacing: "-0.035em" }}
        >
          {t("Ta stack SaaS", "Your SaaS stack")}<br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(130deg, hsl(224 76% 72%) 0%, hsl(224 76% 55%) 100%)" }}
          >
            {t("coûte trop cher.", "costs too much.")}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-5 max-w-md text-[1.05rem] leading-relaxed text-muted-foreground">
          {t(
            "Doublons, dormants, inutiles — détectés en 5 min. Tu récupères 847€/an en moyenne.",
            "Duplicates, dormant, wasted — detected in 5 min. Save 847€/yr on average."
          )}
        </p>

        {/* CTA */}
        <div className="mt-9 flex flex-col items-center gap-3">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-[15px] font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5"
            style={{ boxShadow: "0 0 30px hsl(224 76% 60% / 0.35), 0 4px 12px hsl(0 0% 0% / 0.3)" }}
          >
            {t("Analyser ma stack — gratuit", "Analyze my stack — free")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-muted-foreground/50">
            {t(`Sans inscription · 5 min · ${toolCount} outils`, `No signup · 5 min · ${toolCount} tools`)}
          </p>
        </div>

        {/* Mobile logos */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 md:hidden">
          {LOGOS.slice(0, 8).map((logo) => (
            <div key={logo.domain} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card">
              <img
                src={`https://www.google.com/s2/favicons?domain=${logo.domain}&sz=64`}
                alt=""
                className="h-5 w-5 rounded object-contain"
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
