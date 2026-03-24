import { useLang } from "@/hooks/useLang";
import { Star } from "lucide-react";

interface Testimonial {
  quote: string;
  quoteEn: string;
  role: string;
  roleEn: string;
  initials: string;
  saving: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "J'avais 3 abonnements IA en parallèle sans m'en rendre compte. ToolTrim m'a fait économiser 80€/mois en 5 minutes.",
    quoteEn: "I had 3 AI subscriptions running in parallel without realizing. ToolTrim saved me €80/mo in 5 minutes.",
    role: "UX Designer · Freelance",
    roleEn: "UX Designer · Freelancer",
    initials: "S.L.",
    saving: "−960€/an",
  },
  {
    quote: "On utilisait HubSpot Pro alors qu'on était 3. Le rapport ToolTrim nous a orientés vers Brevo — même résultat, 5x moins cher.",
    quoteEn: "We were using HubSpot Pro with just 3 people. The ToolTrim report pointed us to Brevo — same result, 5x cheaper.",
    role: "Fondateur SaaS · Early-stage",
    roleEn: "SaaS Founder · Early-stage",
    initials: "T.R.",
    saving: "−2 040€/an",
  },
  {
    quote: "Le Stack Health Score a convaincu mon associé qu'on avait un problème. On a coupé 4 outils le jour même.",
    quoteEn: "The Stack Health Score convinced my partner we had a problem. We cut 4 tools that same day.",
    role: "Directrice des Opérations · PME",
    roleEn: "Operations Director · SMB",
    initials: "C.M.",
    saving: "−3 600€/an",
  },
  {
    quote: "Notion, Coda et Airtable en même temps... ToolTrim a identifié le doublon que je refusais de voir depuis 2 ans.",
    quoteEn: "Notion, Coda, and Airtable at the same time... ToolTrim identified the overlap I'd been ignoring for 2 years.",
    role: "Chef de projet digital · Agence",
    roleEn: "Digital Project Manager · Agency",
    initials: "M.D.",
    saving: "−1 440€/an",
  },
];

const TestimonialsSection = () => {
  const { lang, t } = useLang();

  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-[1100px]">
        <div className="text-center mb-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary mb-3">
            {t("Témoignages", "Testimonials")}
          </p>
          <h2 className="text-[36px] font-extrabold tracking-[-2px]">
            {t("Ils ont optimisé leur stack", "They optimized their stack")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-muted-foreground/60 leading-relaxed">
            {t(
              "Des freelances et fondateurs qui ont réduit leurs abonnements inutiles.",
              "Freelancers and founders who cut their unnecessary subscriptions."
            )}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {TESTIMONIALS.map((t_item, i) => (
            <div
              key={i}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-md"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-0.5">
                {[...Array(5)].map((_, si) => (
                  <Star key={si} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm leading-relaxed text-foreground/80">
                "{lang === "en" ? t_item.quoteEn : t_item.quote}"
              </p>

              {/* Author + saving */}
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {t_item.initials}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{t_item.initials}</p>
                    <p className="text-[11px] text-muted-foreground/60">{lang === "en" ? t_item.roleEn : t_item.role}</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {t_item.saving}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
