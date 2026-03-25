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

  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
            {t("Économies identifiées", "Savings identified")}
          </span>
          <h2 className="text-4xl font-extrabold tracking-[-1.5px] md:text-[44px]">
            {t("Des chiffres, pas des promesses", "Numbers, not promises")}
          </h2>
        </div>

        {/* Stats grid — Elevo-style big numbers */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* Hero stat — large */}
          <div className="md:col-span-2 rounded-2xl border border-primary/20 bg-primary/5 p-10 flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-3">
              {t("Économies identifiées en moyenne", "Average savings identified")}
            </p>
            <p className="text-6xl md:text-7xl font-extrabold tracking-[-4px] leading-none">
              <span ref={counterRef}>0</span>
              <span className="text-primary">€</span>
            </p>
            <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
              {t(
                "par freelance et par an, sur des abonnements déjà actifs.",
                "per freelancer per year, on already active subscriptions."
              )}
            </p>
          </div>

          {/* Sub stats */}
          {[
            {
              value: `${toolCount}+`,
              label: t(`outils analysés sur ${categoryCount} catégories métier`, `tools analyzed across ${categoryCount} categories`),
              chip: t("base vivante", "live database"),
            },
            {
              value: "0",
              label: t(
                "accord d'affiliation qui biaise nos recommandations",
                "affiliate deal biasing our recommendations"
              ),
              chip: t("100% indépendant", "100% independent"),
            },
            {
              value: "2,3",
              label: t(
                "outils à couper ou swapper identifiés en moyenne",
                "tools to cut or swap identified on average"
              ),
              chip: t("par analyse", "per analysis"),
            },
            {
              value: "<3",
              label: t(
                "minutes pour obtenir votre diagnostic complet",
                "minutes to get your complete diagnostic"
              ),
              chip: t("temps réel", "real-time"),
            },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between transition-all hover:border-primary/20 hover:shadow-sm"
            >
              <div>
                <p className="text-4xl font-extrabold tracking-[-2px]">{s.value}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.label}</p>
              </div>
              <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary">
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
