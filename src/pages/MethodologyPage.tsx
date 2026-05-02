import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { useTools } from "@/hooks/useSupabaseData";
import { useMemo, useEffect } from "react";
import { setSeoTags, setHreflang, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { Check, X, Target, Scale, Calculator, BookOpen } from "lucide-react";
import PageHero from "@/components/PageHero";

const MethodologyPage = () => {
  const { t, prefix, lang } = useLang();
  const { tools } = useTools();

  const stats = useMemo(() => {
    const ferme = tools.filter(t => t.prescription_quality === "ferme").length;
    const verified = tools.filter(t => t.pricing_v5?.verified_on).length;
    return { tools: tools.length, ferme, verified };
  }, [tools]);

  useEffect(() => {
    const title = t(
      "Méthodologie | ToolTrim — Diagnostic, pas annuaire",
      "Methodology | ToolTrim — Diagnosis, not directory"
    );
    const desc = t(
      "La plupart des comparateurs SaaS vous vendent de l'information. Pas un diagnostic. Voici pourquoi ToolTrim part du contexte, pas du catalogue.",
      "Most SaaS comparators sell you information. Not a diagnosis. Here's why ToolTrim starts from context, not from a catalog."
    );
    setSeoTags({ title, description: desc, url: `${SEO_BASE}/${lang}/methodology`, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/methodology`);
    setJsonLd("methodology-jsonld", {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: title,
      url: `${SEO_BASE}/${lang}/methodology`,
      description: desc,
      author: { "@type": "Person", name: "Équipe ToolTrim", url: `${SEO_BASE}/methodology` },
      publisher: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
    });
    return () => cleanupSeo(["methodology-jsonld"]);
  }, [lang, stats.tools]);

  // Contrast table rows
  const contrastRows: Array<{ them: string; us: string }> = lang === "fr"
    ? [
        { them: "Lister les outils", us: "Analyser votre stack réelle" },
        { them: "Prix génériques copiés-collés", us: "Prix vérifiés sur les pages officielles" },
        { them: "Recommandations globales", us: "Adaptées à votre TJM et à votre profil" },
        { them: "Aucune détection de doublon", us: "Doublons identifiés outil par outil" },
        { them: "Affilié aux résultats", us: "100% indépendant, sans accord commercial" },
      ]
    : [
        { them: "List the tools", us: "Analyze your actual stack" },
        { them: "Generic copy-pasted pricing", us: "Pricing verified on official pages" },
        { them: "Global recommendations", us: "Tailored to your day rate and profile" },
        { them: "No duplicate detection", us: "Duplicates flagged tool by tool" },
        { them: "Affiliated to the results", us: "100% independent, no commercial deal" },
      ];

  return (
    <div>
      <PageHero
        breadcrumb={[{ label: t("Méthodologie", "Methodology") }]}
        eyebrow={t("Méthodologie", "Methodology")}
        icon={<BookOpen className="h-3.5 w-3.5" />}
        title={
          lang === "fr" ? (
            <>La plupart des comparateurs SaaS vous vendent <span className="text-primary">de l'information. Pas un diagnostic.</span></>
          ) : (
            <>Most SaaS comparators sell you <span className="text-primary">information. Not a diagnosis.</span></>
          )
        }
        description={t(
          "Cette page n'explique pas comment ToolTrim fonctionne en interne. Elle explique pourquoi un annuaire ne pouvait pas faire le travail — et ce qu'on a dû construire à la place.",
          "This page doesn't explain how ToolTrim works internally. It explains why a directory couldn't do the job — and what we had to build instead."
        )}
        stats={[
          { value: stats.tools, label: t("outils suivis", "tracked tools"), tone: "primary" },
          { value: stats.verified, label: t("prix vérifiés", "verified prices") },
          { value: stats.ferme, label: t("verdicts fermes", "strong verdicts") },
        ]}
        maxWidth="narrow"
      />

      <div className="container mx-auto max-w-4xl px-6 py-16 md:py-20">

        {/* Bloc 1 — Le problème avec les annuaires */}
        <section className="rounded-2xl border border-border bg-card p-8 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            {t("Le problème", "The problem")}
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            {t("Un annuaire ne sait pas qui vous êtes.", "A directory doesn't know who you are.")}
          </h2>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-foreground">
            <p>
              {t(
                "Un annuaire vous dit que Notion existe et coûte 16 €/mois.",
                "A directory tells you Notion exists and costs €16/month."
              )}
            </p>
            <p className="text-muted-foreground">
              {t(
                "Il ne sait pas que vous payez aussi Coda, que vous êtes seul, et que l'un des deux dort depuis 4 mois.",
                "It doesn't know you also pay for Coda, that you work alone, and that one of the two has been dormant for 4 months."
              )}
            </p>
            <p className="font-semibold">
              {t(
                "La différence entre une liste et un diagnostic, c'est le contexte.",
                "The difference between a list and a diagnosis is context."
              )}
            </p>
          </div>
        </section>

        {/* Bloc 2 — Les 3 principes */}
        <section className="mt-16">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            {t("Nos convictions", "Our convictions")}
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl mb-8">
            {t("Trois principes non négociables.", "Three non-negotiable principles.")}
          </h2>
          <div className="space-y-5">
            {[
              {
                num: "①",
                icon: Target,
                title: t("Le contexte change tout", "Context changes everything"),
                body: t(
                  "Un outil recommandé à un DSI de 50 personnes est souvent inutile pour un freelance. ToolTrim ne recommande qu'après avoir compris qui vous êtes — métier, TJM, stack en place, contraintes.",
                  "A tool recommended to a 50-person IT department is often useless for a freelancer. ToolTrim only recommends after understanding who you are — role, day rate, current stack, constraints."
                ),
              },
              {
                num: "②",
                icon: Scale,
                title: t("L'indépendance n'est pas optionnelle", "Independence isn't optional"),
                body: t(
                  "Aucun accord d'affiliation ne biaise nos recommandations. Si un outil moins cher fait le travail, on le dit — même si on ne touche rien dessus.",
                  "No affiliate deal biases our recommendations. If a cheaper tool does the job, we say so — even if we earn nothing from it."
                ),
              },
              {
                num: "③",
                icon: Calculator,
                title: t("Une recommandation sans chiffre n'en est pas une", "A recommendation without a number isn't one"),
                body: t(
                  "« Vous pouvez couper cet outil » ne suffit pas. On chiffre l'économie exacte, on vérifie le prix sur la page officielle, on identifie le remplaçant.",
                  "\"You can cut this tool\" isn't enough. We quantify the exact saving, verify the price on the official page, and name the replacement."
                ),
              },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="rounded-2xl border border-border bg-card p-6 md:p-8">
                  <div className="flex items-start gap-5">
                    <div className="flex shrink-0 items-baseline gap-2">
                      <span className="font-mono text-2xl font-bold text-primary">{p.num}</span>
                      <Icon className="h-5 w-5 text-primary/60" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold tracking-tight">{p.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bloc 3 — La preuve par le contraste */}
        <section className="mt-16">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            {t("La preuve", "The proof")}
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl mb-6">
            {t("Annuaire vs diagnostic.", "Directory vs diagnosis.")}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-2 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <X className="h-3.5 w-3.5" />
                {t("Ce que fait un annuaire", "What a directory does")}
              </div>
              <div className="flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-primary border-l border-border">
                <Check className="h-3.5 w-3.5" />
                {t("Ce que fait ToolTrim", "What ToolTrim does")}
              </div>
            </div>
            {contrastRows.map((row, i) => (
              <div key={i} className={`grid grid-cols-2 ${i < contrastRows.length - 1 ? "border-b border-border" : ""}`}>
                <div className="px-5 py-4 text-sm text-muted-foreground line-through decoration-muted-foreground/40">
                  {row.them}
                </div>
                <div className="px-5 py-4 text-sm font-medium text-foreground border-l border-border">
                  {row.us}
                </div>
              </div>
            ))}
          </div>

          {/* Stats inline */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { value: `${stats.tools}`, label: t("Outils analysés", "Tools analyzed") },
              { value: `${stats.verified}`, label: t("Prix vérifiés", "Prices verified") },
              { value: `${stats.ferme}`, label: t("Recommandations fermes", "Firm recommendations") },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                <p className="font-mono text-2xl font-bold text-primary">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bloc 4 — Framework CARS */}
        <section className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              {t("Le framework derrière cette page", "The framework behind this page")}
            </p>
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            {t("CARS — Create A Research Space", "CARS — Create A Research Space")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {t(
              "Modèle rhétorique formalisé par le linguiste John Swales (1990) pour décrire comment un chercheur « crée de l'espace » pour sa propre contribution : montrer que les approches existantes ne couvrent pas son angle, puis occuper ce vide.",
              "A rhetorical model formalized by linguist John Swales (1990) to describe how a researcher \"creates space\" for their own contribution: show that existing approaches don't cover their angle, then occupy that gap."
            )}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t(
              "Adapté en copywriting produit, CARS devient :",
              "Applied to product copywriting, CARS becomes:"
            )}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { letter: "C", word: t("Context", "Context"), desc: t("Poser le terrain : ce que font les autres outils.", "Set the ground: what other tools do.") },
              { letter: "A", word: t("Accusation", "Accusation"), desc: t("Nommer le manque, sans détour.", "Name the gap, without detour.") },
              { letter: "R", word: t("Remedy", "Remedy"), desc: t("Présenter la réponse — ici, le diagnostic contextuel.", "Present the answer — here, contextual diagnosis.") },
              { letter: "S", word: t("Statement", "Statement"), desc: t("Affirmer la position et inviter à l'action.", "Assert the position and invite to act.") },
            ].map((b) => (
              <div key={b.letter} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-primary">{b.letter}</span>
                  <span className="font-heading text-base font-bold">{b.word}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm italic leading-relaxed text-muted-foreground">
            {t(
              "Si vous avez lu jusqu'ici, vous venez de traverser les quatre mouvements. C'est volontaire.",
              "If you've read this far, you just walked through all four moves. That's intentional."
            )}
          </p>
        </section>

        {/* Clôture */}
        <section className="mt-16 text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">
            {lang === "fr" ? (
              <>Vous méritez un diagnostic.<br /><em className="text-primary italic">Pas une liste.</em></>
            ) : (
              <>You deserve a diagnosis.<br /><em className="text-primary italic">Not a list.</em></>
            )}
          </h2>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to={`${prefix}/selector`}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("Lancer mon analyse →", "Start my analysis →")}
            </Link>
            <span className="text-xs text-muted-foreground">
              {t("3 minutes · gratuit · sans inscription", "3 minutes · free · no signup")}
            </span>
          </div>
        </section>

      </div>
    </div>
  );
};

export default MethodologyPage;
