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
          const interval = setInterval(() => {
            start = Math.min(start + step, target);
            el.textContent = Math.round(start).toLocaleString("fr-FR");
            if (start >= target) clearInterval(interval);
          }, 16);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [counted]);

  const subStats = [
    {
      value: `${toolCount}+`,
      label: t(`outils analysés sur ${categoryCount} catégories métier`, `tools analyzed across ${categoryCount} categories`),
      chip: t("base vivante", "live database"),
    },
    {
      value: "0",
      label: t("accord d'affiliation qui biaise nos recommandations", "affiliate deal biasing our recommendations"),
      chip: t("100% indépendant", "100% independent"),
    },
    {
      value: "2,3",
      label: t("outils à couper ou swapper identifiés en moyenne", "tools to cut or swap identified on average"),
      chip: t("par analyse", "per analysis"),
    },
    {
      value: "<3",
      label: t("minutes pour obtenir votre diagnostic complet", "minutes to get your complete diagnostic"),
      chip: t("temps réel", "real-time"),
    },
  ];

  return (
    <section className="py-24 px-6 border-t border-border" style={{ background: "hsl(var(--background))" }}>
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="label-section mb-4">{t("Économies identifiées", "Savings identified")}</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.6rem)", fontWeight: 600, letterSpacing: "-0.022em" }}>
            {t("Des chiffres, ", "Numbers, ")}
            <em className="text-primary not-italic">{t("pas des promesses", "not promises")}</em>
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">

          {/* Hero stat — billboard */}
          <div
            className="md:row-span-2 border border-border bg-card flex flex-col justify-center items-center text-center p-10 md:p-12"
            style={{ borderRadius: "2px" }}
          >
            <p className="label-section mb-5" style={{ color: "hsl(224 76% 68%)" }}>
              {t("Économies identifiées en moyenne", "Average savings identified")}
            </p>
            <p
              className="num-brutal leading-none text-primary"
              style={{ fontSize: "clamp(4.5rem, 12vw, 7rem)", fontWeight: 800, letterSpacing: "-0.05em" }}
            >
              <span ref={counterRef}>0</span>€
            </p>
            <p className="mt-5 max-w-[240px] text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("par freelance et par an, sur des abonnements déjà actifs.", "per freelancer per year, on already active subscriptions.")}
            </p>
          </div>

          {/* Sub-stat cards */}
          {subStats.map((s, i) => (
            <div
              key={i}
              className="bg-card border border-border p-7 flex flex-col justify-between cursor-default"
              style={{ borderRadius: "2px" }}
            >
              <div>
                <p
                  className="num-brutal text-primary leading-none"
                  style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
                >
                  {s.value}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
              </div>
              <span
                className="mt-5 inline-flex w-fit items-center border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-mono tracking-wide text-primary"
                style={{ borderRadius: "2px" }}
              >
                {s.chip}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
