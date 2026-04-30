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
    <section className="py-24 px-6" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Hero stat */}
          <div
            className="md:row-span-2 rounded-2xl border border-primary/20 flex flex-col justify-center items-center text-center p-10 md:p-12"
            style={{ background: "hsl(224 76% 60% / 0.07)" }}
          >
            <p className="label-section mb-5 text-primary">{t("Économies identifiées en moyenne", "Average savings identified")}</p>
            <p
              className="leading-none text-primary"
              style={{ fontSize: "clamp(4rem, 10vw, 6rem)", fontWeight: 600, letterSpacing: "-0.04em" }}
            >
              <span ref={counterRef}>0</span>€
            </p>
            <p className="mt-5 max-w-[260px] text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("par freelance et par an, sur des abonnements déjà actifs.", "per freelancer per year, on already active subscriptions.")}
            </p>
          </div>

          {/* Sub-stat cards */}
          {subStats.map((s, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-7 flex flex-col justify-between cursor-default transition-all duration-200"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px hsl(224 76% 60% / 0.12), 0 4px 16px hsl(0 0% 0% / 0.25)";
                (e.currentTarget as HTMLElement).style.borderColor = "hsl(224 76% 60% / 0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "";
                (e.currentTarget as HTMLElement).style.borderColor = "";
              }}
            >
              <div>
                <p
                  className="text-primary leading-none"
                  style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", fontWeight: 600, letterSpacing: "-0.03em" }}
                >
                  {s.value}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
              </div>
              <span className="mt-5 inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-medium tracking-wide text-primary">
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
