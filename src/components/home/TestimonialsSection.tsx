import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  quoteEn: string;
  role: string;
  roleEn: string;
  initials: string;
  saving: string;
  context: string;
  contextEn: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "J'avais 3 abonnements IA en parallèle sans m'en rendre compte. ToolTrim m'a fait économiser 80€/mois en 5 minutes.",
    quoteEn: "I had 3 AI subscriptions running in parallel without realizing. ToolTrim saved me €80/mo in 5 minutes.",
    role: "UX Designer · Freelance",
    roleEn: "UX Designer · Freelancer",
    initials: "S.L.",
    saving: "−960€/an",
    context: "Stack de 8 outils · Analyse en 3 min",
    contextEn: "8-tool stack · 3 min analysis",
  },
  {
    quote: "On utilisait HubSpot Pro alors qu'on était 3. Le rapport ToolTrim nous a orientés vers Brevo — même résultat, 5x moins cher.",
    quoteEn: "We were using HubSpot Pro with just 3 people. The ToolTrim report pointed us to Brevo — same result, 5x cheaper.",
    role: "Fondateur SaaS · Early-stage",
    roleEn: "SaaS Founder · Early-stage",
    initials: "T.R.",
    saving: "−2 040€/an",
    context: "Stack de 12 outils · 4 doublons détectés",
    contextEn: "12-tool stack · 4 duplicates detected",
  },
  {
    quote: "Le Stack Health Score a convaincu mon associé qu'on avait un problème. On a coupé 4 outils le jour même.",
    quoteEn: "The Stack Health Score convinced my partner we had a problem. We cut 4 tools that same day.",
    role: "Directrice des Opérations · PME",
    roleEn: "Operations Director · SMB",
    initials: "C.M.",
    saving: "−3 600€/an",
    context: "Stack de 18 outils · Score initial 42/100",
    contextEn: "18-tool stack · Initial score 42/100",
  },
  {
    quote: "Notion, Coda et Airtable en même temps... ToolTrim a identifié le doublon que je refusais de voir depuis 2 ans.",
    quoteEn: "Notion, Coda, and Airtable at the same time... ToolTrim identified the overlap I'd been ignoring for 2 years.",
    role: "Chef de projet digital · Agence",
    roleEn: "Digital Project Manager · Agency",
    initials: "M.D.",
    saving: "−1 440€/an",
    context: "Stack de 14 outils · 3 swaps recommandés",
    contextEn: "14-tool stack · 3 swaps recommended",
  },
];

const TestimonialsSection = () => {
  const { lang, t } = useLang();
  const [active, setActive] = useState(0);

  const prev = () => setActive((p) => (p === 0 ? TESTIMONIALS.length - 1 : p - 1));
  const next = () => setActive((p) => (p === TESTIMONIALS.length - 1 ? 0 : p + 1));
  const item = TESTIMONIALS[active];

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
            {t("Témoignages", "Testimonials")}
          </span>
          <h2 className="text-4xl font-extrabold tracking-[-1.5px] md:text-[44px]">
            {t("Ils ont repris le contrôle", "They took back control")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground leading-relaxed">
            {t(
              "Des freelances et fondateurs qui ont identifié et coupé leurs abonnements inutiles.",
              "Freelancers and founders who identified and cut their unnecessary subscriptions."
            )}
          </p>
        </div>

        {/* Main testimonial — large editorial card */}
        <div className="relative rounded-2xl border border-border bg-card overflow-hidden" key={active}>
          <div className="grid md:grid-cols-[1fr_340px]">
            {/* Quote side */}
            <div className="p-8 md:p-12 flex flex-col justify-between">
              <div>
                <Quote className="h-8 w-8 text-primary/20 mb-6" />
                <blockquote className="text-xl md:text-2xl font-medium leading-relaxed tracking-[-0.5px] text-foreground animate-in fade-in duration-300">
                  "{lang === "en" ? item.quoteEn : item.quote}"
                </blockquote>
              </div>

              <div className="mt-8 flex items-center gap-4 pt-6 border-t border-border">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.initials}</p>
                  <p className="text-sm text-muted-foreground">{lang === "en" ? item.roleEn : item.role}</p>
                </div>
              </div>
            </div>

            {/* Stats side */}
            <div className="bg-secondary/40 p-8 md:p-10 flex flex-col justify-center gap-6 border-t md:border-t-0 md:border-l border-border">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                  {t("Économie réalisée", "Savings achieved")}
                </p>
                <p className="text-4xl font-extrabold tracking-[-2px] text-primary">{item.saving}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                  {t("Contexte", "Context")}
                </p>
                <p className="text-sm text-foreground font-medium">{lang === "en" ? item.contextEn : item.context}</p>
              </div>
              <div className="flex items-center gap-1">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === active ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/30"
                    }`}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={prev} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary" aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={next} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary" aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Summary stats row */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "92%", label: t("estiment avoir gagné en efficacité", "say they gained efficiency") },
            { value: "2,3", label: t("outils coupés ou swappés en moyenne", "tools cut or swapped on average") },
            { value: "<3min", label: t("pour obtenir un diagnostic complet", "to get a full diagnostic") },
            { value: "100%", label: t("des recommandations vérifiées par un humain", "of recommendations verified by a human") },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-extrabold tracking-[-1px] text-foreground">{stat.value}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
