import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "lucide-react";

const HeroSection = ({ toolCount }: { toolCount: number }) => {
  const { lang, t, prefix } = useLang();

  return (
    <section className="relative overflow-hidden">
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary) / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)",
        }}
      />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,hsl(var(--primary)/0.12)_0%,transparent_70%)]" />

      <div className="relative z-10 flex flex-col items-center px-6 pb-16 pt-24 text-center md:pb-20 md:pt-32">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-primary">
            {t("Analyse de stack · Indépendant · <3 min", "Stack analysis · Independent · <3 min")}
          </span>
        </div>

        <h1 className="max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1] tracking-[-3px]">
          {lang === "fr" ? "Ton stack SaaS te" : "Your SaaS stack"}{" "}
          <span className="text-muted-foreground/25">{lang === "fr" ? "coûte trop cher." : "costs too much."}</span>
          <br />
          <span className="relative inline-block text-primary">
            {lang === "fr" ? "On t'aide à couper le gras." : "We help you cut the fat."}
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-primary to-transparent" />
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-[440px] text-[17px] leading-relaxed text-muted-foreground/60">
          {lang === "fr" ? (
            <>Scannez votre stack, découvrez ce que vous <strong className="font-medium text-muted-foreground">surpayez</strong>.</>
          ) : (
            <>Scan your stack, find what you're <strong className="font-medium text-muted-foreground">overpaying</strong>.</>
          )}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-7 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
          >
            {t("Analyser ma stack gratuitement", "Analyze my stack for free")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to={`${prefix}/tools`}
            className="inline-flex items-center gap-2 rounded-[10px] border border-border px-6 py-3.5 text-sm font-medium text-muted-foreground transition-all hover:border-muted-foreground/25 hover:text-foreground"
          >
            {t("Voir un exemple d'analyse", "See an example analysis")}
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground/40">
          <span className="h-px w-12 bg-border" />
          {t(
            "Freelances, solopreneurs, fondateurs · Résultats en 3 minutes · Sans inscription",
            "Freelancers, solopreneurs, founders · Results in 3 minutes · No signup"
          )}
          <span className="h-px w-12 bg-border" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
