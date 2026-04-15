import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  const { t, prefix } = useLang();

  return (
    <section className="border-t border-border py-24 px-6 text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary mb-5">
        {t("Prêt ?", "Ready?")}
      </p>
      <h2 className="text-4xl font-extrabold tracking-[-1.5px] md:text-[44px]">
        {t("Combien", "How much")}
        <br />
        <em className="text-primary italic">{t("payez-vous de trop ?", "are you overpaying?")}</em>
      </h2>
      <p className="mx-auto mt-4 max-w-[440px] text-base leading-relaxed text-muted-foreground/60">
        {t(
          "La moyenne est 847€/an. Pour certains profils, c'est le double. Découvrez le vôtre en moins de 3 minutes.",
          "The average is €847/yr. For some profiles, it's double. Discover yours in under 3 minutes."
        )}
      </p>
      <Link
        to={`${prefix}/selector`}
        className="mt-9 inline-flex items-center gap-2 rounded-[10px] bg-primary px-9 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
      >
        {t("Analyser ma stack gratuitement", "Analyze my stack for free")} <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="mt-4 text-xs text-muted-foreground/40">
        {t(
          "Sans inscription · Sans carte bancaire · Résultats immédiats",
          "No signup · No credit card · Instant results"
        )}
      </p>
    </section>
  );
};

export default FinalCTA;
