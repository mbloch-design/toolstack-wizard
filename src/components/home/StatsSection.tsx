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
    <section className="border-b border-border bg-secondary/30 py-14 px-6">
      <div className="mx-auto grid max-w-[1100px] items-stretch gap-0 md:grid-cols-4">
        {/* Hero stat */}
        <div className="flex flex-col justify-center border-b border-border pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
            {t("Économies identifiées en moyenne", "Average savings identified")}
          </p>
          <p className="mt-3 text-6xl font-extrabold tracking-[-4px] leading-none">
            <span ref={counterRef}>0</span>
            <span className="text-primary font-bold">€</span>
          </p>
          <p className="mt-2.5 max-w-[210px] text-[13px] leading-relaxed text-muted-foreground">
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
        ].map((s, i) => (
          <div
            key={i}
            className={`flex flex-col justify-center px-8 py-6 md:py-0 ${
              i < 2 ? "border-b border-border md:border-b-0 md:border-r" : ""
            }`}
          >
            <p className="text-4xl font-bold tracking-[-1.5px]">{s.value}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.label}</p>
            <span className="mt-2.5 inline-flex w-fit items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-primary">
              {s.chip}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
