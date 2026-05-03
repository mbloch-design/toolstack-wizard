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
    photo: portrait4,
  },
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
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24">

        {/* Header */}
        <div className="mb-12 flex items-end justify-between gap-8">
          <div>
            <p className="label-section mb-3">{t("Témoignages", "Testimonials")}</p>
            <h2
              className="font-display"
              style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", fontWeight: 700, letterSpacing: "-0.025em" }}
            >
              {t("Ils ont repris le contrôle ", "They took back control ")}
              <span className="text-primary">{t("de leur stack.", "of their stack.")}</span>
            </h2>
          </div>

          {/* Dot indicators — desktop */}
          <div className="hidden md:flex items-center gap-2 shrink-0 pb-1">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIsAnimating(true); setActive(i); setTimeout(() => setIsAnimating(false), 500); }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === active ? "w-8 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3 items-stretch">

            {/* Main card */}
            <div
              key={active}
              className="rounded-xl bg-card border border-border overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <div className="grid md:grid-cols-[220px_1fr] h-full">

                {/* Photo */}
                <div className="relative h-48 md:h-full overflow-hidden">
                  <img
                    src={item.photo}
                    alt={`${item.initials} — ${lang === "en" ? item.roleEn : item.role}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    width={512}
                    height={512}
                  />
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col justify-between">
                  <div>
                    {/* Saving badge — DM Mono, primary-tinted */}
                    <span
                      className="inline-block mb-6"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "0.7rem",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "hsl(var(--primary))",
                        background: "hsl(var(--primary) / 0.1)",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "0.375rem",
                        border: "1px solid hsl(var(--primary) / 0.2)",
                      }}
                    >
                      {item.saving}
                    </span>

                    <blockquote
                      className="font-display leading-snug text-foreground"
                      style={{
                        fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
                        fontWeight: 500,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      "{lang === "en" ? item.quoteEn : item.quote}"
                    </blockquote>
                  </div>

                  <div className="mt-8 pt-5 border-t border-border">
                    <p className="text-sm font-semibold text-foreground">{item.initials}</p>
                    <p className="mt-0.5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {lang === "en" ? item.roleEn : item.role}
                    </p>
                    <p
                      className="mt-1"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "0.62rem",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "hsl(var(--muted-foreground) / 0.5)",
                      }}
                    >
                      {lang === "en" ? item.contextEn : item.context}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next card peek */}
            <div
              className="hidden lg:flex rounded-xl bg-card border border-border overflow-hidden cursor-pointer transition-opacity duration-200 opacity-40 hover:opacity-75"
              onClick={() => navigate("next")}
            >
              <div className="flex flex-col items-center justify-center w-full p-6 text-center gap-3">
                <img
                  src={nextItem.photo}
                  alt={nextItem.initials}
                  className="h-16 w-16 rounded-lg object-cover"
                  loading="lazy"
                  width={512}
                  height={512}
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{nextItem.initials}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {lang === "en" ? nextItem.roleEn : nextItem.role}
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.65rem",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "hsl(var(--primary))",
                    background: "hsl(var(--primary) / 0.1)",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid hsl(var(--primary) / 0.2)",
                  }}
                >
                  {nextItem.saving}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation — arrows + mobile dots */}
          <div className="mt-6 flex items-center justify-between">
            {/* Mobile dots */}
            <div className="flex md:hidden items-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setIsAnimating(true); setActive(i); setTimeout(() => setIsAnimating(false), 500); }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === active ? "w-8 bg-primary" : "w-1.5 bg-border"
                  }`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
            <div className="hidden md:block" />

            {/* Arrows */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate("prev")}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:text-primary cursor-pointer"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("next")}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:text-primary cursor-pointer"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
