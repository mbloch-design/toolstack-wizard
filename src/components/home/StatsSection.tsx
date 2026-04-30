import { useEffect, useRef, useState } from "react";
import { useLang } from "@/hooks/useLang";

const StatsSection = ({ toolCount, categoryCount }: { toolCount: number; categoryCount: number }) => {
  const { t } = useLang();
  const counterRef = useRef<HTMLSpanElement>(null);
  const [counted, setCounted] = useState(false);

  useEffect(() => {
    const el = counterRef.current;
    if (!el || counted) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCounted(true);
          let start = 0;
          const target = 847;
          const step = target / (1200 / 16);
          const timer = setInterval(() => {
            start = Math.min(start + step, target);
            el.textContent = Math.round(start).toLocaleString("fr-FR");
            if (start >= target) clearInterval(timer);
          }, 16);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [counted]);

  const stats = [
    {
      value: `${toolCount}+`,
      label: t("outils couverts", "tools covered"),
      sub: t(`sur ${categoryCount} catégories`, `across ${categoryCount} categories`),
    },
    {
      value: "0",
      label: t("accord d'affiliation", "affiliate deal"),
      sub: t("100% indépendant", "100% independent"),
    },
    {
      value: "2,3",
      label: t("outils à couper", "tools to cut"),
      sub: t("identifiés par analyse", "identified per analysis"),
    },
    {
      value: "<3 min",
      label: t("pour votre diagnostic", "for your diagnostic"),
      sub: t("résultats instantanés", "instant results"),
    },
  ];

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">

        {/* Section header */}
        <div className="mb-12">
          <p className="label-section mb-3">{t("Économies identifiées", "Savings identified")}</p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", fontWeight: 700, letterSpacing: "-0.025em" }}
          >
            {t("Des chiffres, ", "Numbers, ")}
            <span className="text-primary">{t("pas des promesses.", "not promises.")}</span>
          </h2>
        </div>

        {/* ── HERO STAT ── */}
        <div
          className="relative rounded-xl border border-border bg-card overflow-hidden mb-4"
          style={{ padding: "clamp(2.5rem, 6vw, 4.5rem) clamp(2rem, 5vw, 4rem)" }}
        >
          {/* Background glow */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 55% 70% at 50% 110%, hsl(var(--primary) / 0.1) 0%, transparent 70%)",
            }}
          />

          <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">

            {/* Left: number */}
            <div>
              <p
                className="label-section mb-4"
                style={{ color: "hsl(var(--primary) / 0.8)" }}
              >
                {t("économies identifiées en moyenne", "average savings identified")}
              </p>

              <div className="flex items-start gap-2">
                <span
                  className="font-display leading-none text-foreground"
                  style={{
                    fontSize: "clamp(4rem, 11vw, 8rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.045em",
                    lineHeight: 0.95,
                  }}
                >
                  <span ref={counterRef}>0</span>
                </span>
                <span
                  className="font-display text-primary"
                  style={{
                    fontSize: "clamp(1.8rem, 4vw, 3.2rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    marginTop: "0.3em",
                  }}
                >
                  €
                </span>
              </div>

              <p
                className="mt-4 max-w-xs text-sm leading-relaxed"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {t(
                  "par freelance et par an, sur des abonnements déjà actifs.",
                  "per freelancer per year, on already active subscriptions."
                )}
              </p>
            </div>

            {/* Right: context pill */}
            <div className="hidden md:flex flex-col items-end gap-3 self-start pt-1">
              <div
                className="rounded-lg border border-border bg-background px-4 py-3 text-right"
              >
                <p
                  className="font-display text-foreground"
                  style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.025em" }}
                >
                  847€
                </p>
                <p
                  className="mt-0.5 text-xs"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.04em",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  {t("/ an / freelance", "/ year / freelancer")}
                </p>
              </div>
              <p
                className="label-section text-right"
                style={{ maxWidth: "160px", lineHeight: 1.6 }}
              >
                {t("moyenne sur analyses\ncomplétées", "average across\ncompleted analyses")}
              </p>
            </div>
          </div>
        </div>

        {/* ── 4-STAT STRIP — bordered grid, no card background noise ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 rounded-xl border border-border overflow-hidden">
          {stats.map((s, i) => (
            <div
              key={i}
              className="relative px-7 py-8 bg-card"
              style={{
                borderRight: i < stats.length - 1 ? "1px solid hsl(var(--border))" : undefined,
              }}
            >
              {/* Mobile: bottom border for first row */}
              {i < 2 && (
                <div
                  className="md:hidden absolute bottom-0 left-0 right-0 border-b border-border"
                />
              )}

              <p
                className="font-display text-foreground leading-none"
                style={{
                  fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                {s.value}
              </p>
              <p
                className="mt-2 text-sm font-medium"
                style={{ color: "hsl(var(--foreground) / 0.75)" }}
              >
                {s.label}
              </p>
              <p
                className="mt-0.5"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.65rem",
                  letterSpacing: "0.06em",
                  color: "hsl(var(--muted-foreground) / 0.6)",
                  textTransform: "uppercase",
                }}
              >
                {s.sub}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default StatsSection;
