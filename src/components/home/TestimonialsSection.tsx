import { useState, useCallback, useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { ChevronLeft, ChevronRight } from "lucide-react";
import portrait1 from "@/assets/testimonials/portrait-1.jpg";
import portrait2 from "@/assets/testimonials/portrait-2.jpg";
import portrait3 from "@/assets/testimonials/portrait-3.jpg";
import portrait4 from "@/assets/testimonials/portrait-4.jpg";

interface Testimonial {
  quote: string;
  quoteEn: string;
  role: string;
  roleEn: string;
  initials: string;
  saving: string;
  context: string;
  contextEn: string;
  color: string;
  photo: string;
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
    color: "hsl(var(--primary))",
    photo: portrait1,
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
    color: "hsl(25, 80%, 52%)",
    photo: portrait2,
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
    color: "hsl(145, 60%, 36%)",
    photo: portrait3,
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
    color: "hsl(220, 70%, 45%)",
    photo: portrait4,
  },
];

const STATS = [
  { value: "92%", labelFr: "des utilisateurs estiment avoir gagné en efficacité", labelEn: "of users say they gained efficiency" },
  { value: "2,3", labelFr: "outils coupés ou swappés en moyenne", labelEn: "tools cut or swapped on average" },
  { value: "<3min", labelFr: "pour obtenir un diagnostic complet", labelEn: "to get a full diagnostic" },
  { value: "100%", labelFr: "des recommandations vérifiées par un humain", labelEn: "of recommendations verified by a human" },
];

const TestimonialsSection = () => {
  const { lang, t } = useLang();
  const [active, setActive] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const navigate = useCallback((direction: "prev" | "next") => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActive((p) =>
      direction === "next"
        ? p === TESTIMONIALS.length - 1 ? 0 : p + 1
        : p === 0 ? TESTIMONIALS.length - 1 : p - 1
    );
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  useEffect(() => {
    const timer = setInterval(() => navigate("next"), 8000);
    return () => clearInterval(timer);
  }, [navigate]);

  const item = TESTIMONIALS[active];
  const nextIdx = active === TESTIMONIALS.length - 1 ? 0 : active + 1;
  const nextItem = TESTIMONIALS[nextIdx];

  return (
    <section className="py-24 bg-secondary/30">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Header — Elevo style */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div className="max-w-lg">
            <h2 className="text-4xl md:text-[44px] font-extrabold tracking-[-1.5px] leading-[1.1] text-foreground">
              {t("Ils ont repris le contrôle de leur stack.", "They took back control of their stack.")}
            </h2>
          </div>
          <div className="flex flex-wrap gap-8">
            {STATS.slice(0, 2).map((s, i) => (
              <div key={i} className="text-right">
                <p className="text-3xl md:text-4xl font-extrabold tracking-[-1.5px] text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[180px] leading-relaxed">
                  {lang === "en" ? s.labelEn : s.labelFr}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel — photo card + peek */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-stretch">
            {/* Main card */}
            <div
              key={active}
              className="rounded-2xl bg-card border border-border overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <div className="grid md:grid-cols-[240px_1fr] h-full">
                {/* Photo column */}
                <div className="relative h-48 md:h-full overflow-hidden">
                  <img
                    src={item.photo}
                    alt={`${item.initials} - ${lang === "en" ? item.roleEn : item.role}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    width={512}
                    height={512}
                  />
                </div>

                {/* Content */}
                <div className="p-8 md:p-10 flex flex-col justify-between">
                  <div>
                    <span
                      className="inline-block rounded-full px-3.5 py-1 text-xs font-bold text-white mb-6"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.saving}
                    </span>

                    <blockquote className="text-lg md:text-xl font-medium leading-relaxed tracking-[-0.3px] text-foreground">
                      "{lang === "en" ? item.quoteEn : item.quote}"
                    </blockquote>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border">
                    <p className="text-sm font-semibold text-foreground">{item.initials}</p>
                    <p className="text-sm text-muted-foreground">{lang === "en" ? item.roleEn : item.role}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{lang === "en" ? item.contextEn : item.context}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next card peek */}
            <div
              className="hidden lg:flex rounded-2xl bg-card/60 border border-border/50 overflow-hidden cursor-pointer opacity-50 hover:opacity-70 transition-opacity"
              onClick={() => navigate("next")}
            >
              <div className="flex flex-col items-center justify-center w-full p-6 text-center">
                <img
                  src={nextItem.photo}
                  alt={nextItem.initials}
                  className="h-20 w-20 rounded-full object-cover mb-4"
                  loading="lazy"
                  width={512}
                  height={512}
                />
                <p className="text-sm font-semibold text-foreground">{nextItem.initials}</p>
                <p className="text-xs text-muted-foreground mt-1">{lang === "en" ? nextItem.roleEn : nextItem.role}</p>
                <span
                  className="inline-block rounded-full px-3 py-0.5 text-[11px] font-bold text-white mt-3"
                  style={{ backgroundColor: nextItem.color }}
                >
                  {nextItem.saving}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setIsAnimating(true); setActive(i); setTimeout(() => setIsAnimating(false), 500); }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active ? "w-8 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/40"
                  }`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("prev")}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate("next")}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="mt-16 pt-10 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <div key={i}>
              <p className="text-2xl md:text-3xl font-extrabold tracking-[-1px] text-foreground">{stat.value}</p>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {lang === "en" ? stat.labelEn : stat.labelFr}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
