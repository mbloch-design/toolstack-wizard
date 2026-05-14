import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  const { t, prefix } = useLang();

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-28">

        {/* Inner container — centered, constrained */}
        <div className="mx-auto max-w-2xl text-center">

          <span className="section-tag mb-6">{t("Prêt ?", "Ready?")}</span>

          <h2 className="ts-h1">
            {t("Combien", "How much")}
            <br />
            <span className="text-primary">{t("payez-vous de trop ?", "are you overpaying?")}</span>
          </h2>

          <p
            className="mx-auto mt-6 max-w-sm text-sm leading-relaxed"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {t(
              "La moyenne est 847€/an. Pour certains profils, c'est le double. Découvrez le vôtre en moins de 3 minutes.",
              "The average is €847/yr. For some profiles, it's double. Discover yours in under 3 minutes."
            )}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={`${prefix}/selector`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
            >
              {t("Analyser ma stack gratuitement", "Analyze my stack for free")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <p className="ts-mono-badge mt-4 uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}>
            {t("Sans inscription · Sans carte bancaire · Résultats immédiats", "No signup · No credit card · Instant results")}
          </p>

        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
