import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "lucide-react";

const INNER_LOGOS = [
  { name: "Figma",    domain: "figma.com" },
  { name: "Notion",   domain: "notion.so" },
  { name: "Slack",    domain: "slack.com" },
  { name: "HubSpot",  domain: "hubspot.com" },
  { name: "Zapier",   domain: "zapier.com" },
  { name: "Asana",    domain: "asana.com" },
];

const OUTER_LOGOS = [
  { name: "Linear",   domain: "linear.app" },
  { name: "Airtable", domain: "airtable.com" },
  { name: "Intercom", domain: "intercom.com" },
  { name: "Stripe",   domain: "stripe.com" },
  { name: "Loom",     domain: "loom.com" },
  { name: "Calendly", domain: "calendly.com" },
  { name: "GitHub",   domain: "github.com" },
  { name: "Jira",     domain: "atlassian.com" },
  { name: "Trello",   domain: "trello.com" },
];

const KEYFRAMES = `
  @keyframes orbit-cw  { from { transform: rotate(0deg);    } to { transform: rotate(360deg);  } }
  @keyframes orbit-ccw { from { transform: rotate(0deg);    } to { transform: rotate(-360deg); } }
  @media (prefers-reduced-motion: reduce) {
    [data-orbit] { animation-play-state: paused !important; }
  }
`;

interface OrbitProps {
  logos: typeof INNER_LOGOS;
  radius: number;
  duration: number;
  clockwise: boolean;
  logoSize?: number;
}

function OrbitRing({ logos, radius, duration, clockwise, logoSize = 40 }: OrbitProps) {
  const anim     = clockwise ? "orbit-cw"  : "orbit-ccw";
  const counterAnim = clockwise ? "orbit-ccw" : "orbit-cw";
  const half = logoSize / 2;

  return (
    <>
      {/* Orbit path — dashed circle */}
      <div
        className="absolute rounded-full"
        style={{
          width: radius * 2,
          height: radius * 2,
          left: "50%",
          top: "50%",
          marginLeft: -radius,
          marginTop: -radius,
          border: "1px dashed hsl(var(--border) / 0.35)",
          pointerEvents: "none",
        }}
      />

      {/* Rotating hub — all logos rotate together */}
      <div
        data-orbit
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 0,
          height: 0,
          animation: `${anim} ${duration}s linear infinite`,
          willChange: "transform",
        }}
      >
        {logos.map((tool, i) => {
          const angle = (i / logos.length) * 2 * Math.PI;
          const x = Math.round(Math.cos(angle) * radius);
          const y = Math.round(Math.sin(angle) * radius);
          return (
            <div
              key={tool.domain}
              data-orbit
              style={{
                position: "absolute",
                left: x - half,
                top: y - half,
                width: logoSize,
                height: logoSize,
                animation: `${counterAnim} ${duration}s linear infinite`,
                willChange: "transform",
              }}
            >
              <div className="flex h-full w-full items-center justify-center rounded-xl border border-border bg-card shadow-md">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${tool.domain}&sz=64`}
                  alt={tool.name}
                  width={logoSize * 0.52}
                  height={logoSize * 0.52}
                  className="rounded object-contain"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

const HeroSection = ({ toolCount }: { toolCount: number }) => {
  const { lang, t, prefix } = useLang();

  return (
    <section
      className="relative overflow-hidden flex items-center justify-center"
      style={{ minHeight: "clamp(560px, 90vh, 820px)" }}
    >
      <style>{KEYFRAMES}</style>

      {/* Subtle radial glow behind content */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 55% at 50% 50%, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Orbital rings — desktop only */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <OrbitRing logos={INNER_LOGOS} radius={230} duration={28} clockwise={true}  logoSize={42} />
        <OrbitRing logos={OUTER_LOGOS} radius={370} duration={44} clockwise={false} logoSize={38} />
      </div>

      {/* Center content */}
      <div className="relative z-10 max-w-2xl px-6 py-20 text-center">

        {/* Badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-1.5 shadow-sm backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
            {t("Diagnostic SaaS · 100% indépendant · Gratuit", "SaaS Diagnostic · 100% independent · Free")}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-extrabold tracking-tight text-foreground"
          style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)", lineHeight: 1.08, letterSpacing: "-0.035em" }}
        >
          {t("Ta stack SaaS", "Your SaaS stack")}<br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)) 20%, hsl(var(--primary) / 0.55) 100%)" }}
          >
            {t("coûte trop cher.", "costs too much.")}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground/80">
          {t(
            "Doublons, dormants, inutiles — on détecte tout. Tu récupères en moyenne 847€/an.",
            "Duplicates, dormant tools, wasted spend — we find it all. You save 847€/yr on average."
          )}
        </p>

        {/* CTA */}
        <div className="mt-9">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
          >
            {t("Analyser ma stack — gratuit", "Analyze my stack — free")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Trust line */}
        <p className="mt-4 text-xs text-muted-foreground/40">
          {t(
            `Sans inscription · Résultats en 5 min · ${toolCount} outils couverts`,
            `No signup · Results in 5 min · ${toolCount} tools covered`
          )}
        </p>

        {/* Mobile logos — visible only on small screens */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 md:hidden">
          {[...INNER_LOGOS, ...OUTER_LOGOS].slice(0, 8).map((tool) => (
            <div key={tool.domain} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
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
    </section>
  );
};

export default HeroSection;
