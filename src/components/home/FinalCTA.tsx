import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  const { t, prefix } = useLang();

  return (
    <section className="border-t border-border py-28 px-6 text-center">
      <p className="label-section mb-5">{t("Prêt ?", "Ready?")}</p>
      <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 600, letterSpacing: "-0.022em" }}>
        {t("Combien", "How much")}
        <br />
        <em className="text-primary not-italic">{t("payez-vous de trop ?", "are you overpaying?")}</em>
      </h2>
      <p
        className="mx-auto mt-4 max-w-[440px] text-sm leading-relaxed"
        style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
      >
        {t(
          "La moyenne est 847€/an. Pour certains profils, c'est le double. Découvrez le vôtre en moins de 3 minutes.",
          "The average is €847/yr. For some profiles, it's double. Discover yours in under 3 minutes."
        )}
      </p>
      <Link
        to={`${prefix}/selector`}
        className="mt-9 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:-translate-y-px"
        style={{ boxShadow: "0 0 24px hsl(224 76% 60% / 0.3), 0 2px 12px hsl(0 0% 0% / 0.3)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px hsl(224 76% 60% / 0.45), 0 4px 20px hsl(0 0% 0% / 0.3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px hsl(224 76% 60% / 0.3), 0 2px 12px hsl(0 0% 0% / 0.3)";
        }}
      >
        {t("Analyser ma stack gratuitement", "Analyze my stack for free")}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <p className="mt-4 text-xs" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}>
        {t("Sans inscription · Sans carte bancaire · Résultats immédiats", "No signup · No credit card · Instant results")}
      </p>
    </section>
  );
};

export default FinalCTA;
