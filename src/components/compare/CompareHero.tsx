import { useLang } from "@/hooks/useLang";

const CompareHero = () => {
  const { lang, t } = useLang();

  return (
    <header className="pt-24 pb-12 md:pt-32 md:pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-widest mb-6">
            {t("Analyse experte", "Expert Analysis")}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
            {lang === "fr" ? (
              <>Prenez de meilleures <span className="text-primary italic">décisions SaaS.</span></>
            ) : (
              <>Make Smarter <span className="text-primary italic">SaaS Decisions.</span></>
            )}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
            {t(
              "Benchmarks côte à côte, transparence tarifaire et analyse de fonctionnalités pour votre stack technique.",
              "Side-by-side performance benchmarks, pricing transparency, and feature gap analysis for the modern tech stack."
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex -space-x-3">
            {["S", "M", "A"].map((letter, i) => (
              <div
                key={i}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-background bg-secondary flex items-center justify-center text-sm font-bold text-foreground"
              >
                {letter}
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("Approuvé par 24k+ CTOs", "Trusted by 24k+ CTOs")}
          </p>
        </div>
      </div>
    </header>
  );
};

export default CompareHero;
