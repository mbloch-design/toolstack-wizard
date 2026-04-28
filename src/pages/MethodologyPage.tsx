import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { useMemo, useEffect } from "react";
import { setSeoTags, setHreflang, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { Shield, BarChart3, Ban, Eye, Clock, AlertTriangle } from "lucide-react";

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
      "Notre méthode d'analyse | ToolTrim",
      "Our Analysis Method | ToolTrim"
    );
    const desc = t(
      "Comment ToolTrim vérifie les prix, évalue les alternatives et produit des recommandations actionnables pour votre stack SaaS.",
      "How ToolTrim verifies pricing, evaluates alternatives, and produces actionable recommendations for your SaaS stack."
    );
    setSeoTags({ title, description: desc, url: `${SEO_BASE}/${lang}/methodology`, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/methodology`);
    setJsonLd("methodology-jsonld", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      url: `${SEO_BASE}/${lang}/methodology`,
      description: desc,
      publisher: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
    });
    return () => cleanupSeo(["methodology-jsonld"]);
  }, [lang, stats.tools]);

  const sections = [
    {
      icon: Eye,
      title: t("Notre processus de vérification des prix", "Our pricing verification process"),
      content: [
        t("Chaque prix est issu de la page officielle de l'outil — pas d'un blog tiers ou d'un agrégateur.",
          "Each price comes from the tool's official page — not from a third-party blog or aggregator."),
        t(`URL source stockée par outil. ${stats.verified} outils ont un prix vérifié avec source.`,
          `Source URL stored per tool. ${stats.verified} tools have verified pricing with source.`),
        t("Date de vérification disponible sur chaque fiche. Dernière vérification : 13 mars 2026.",
          "Verification date available on each tool page. Last verification: March 13, 2026."),
        t("3 niveaux de fiabilité : official_explicit (prix affiché clairement), official_contextual (prix déduit du contexte), low (à confirmer).",
          "3 reliability levels: official_explicit (clearly displayed price), official_contextual (price inferred from context), low (to be confirmed)."),
      ],
    },
    {
      icon: BarChart3,
      title: t("Comment nous produisons nos recommandations", "How we produce our recommendations"),
      content: [
        t(`Une prescription n'est affichée que si 7 règles sont validées. ${stats.ferme} outils ont une prescription ferme.`,
          `A prescription is only displayed when 7 rules are validated. ${stats.ferme} tools have a firm prescription.`),
        t("Pas de prescription si le prix n'est pas vérifié sur la page officielle.",
          "No prescription if the price isn't verified on the official page."),
        t("Pas de prescription si les outils ne sont pas dans le même cluster fonctionnel (substitution_cluster_v2).",
          "No prescription if the tools are not in the same functional cluster (substitution_cluster_v2)."),
        t("Pas de prescription sur les outils métier non substituables (outil de production central).",
          "No prescription on non-substitutable business tools (core production tools)."),
      ],
    },
    {
      icon: Ban,
      title: t("Ce que nous ne faisons pas", "What we don't do"),
      content: [
        t("Nous ne recommandons pas un outil parce qu'il nous verse une commission.",
          "We don't recommend a tool because it pays us a commission."),
        t("Nous ne comparons pas des outils d'usages différents.",
          "We don't compare tools with different use cases."),
        t("Nous n'affichons pas une économie si nous ne pouvons pas la vérifier.",
          "We don't display savings we can't verify."),
      ],
    },
    {
      icon: Clock,
      title: t("Fréquence de mise à jour", "Update frequency"),
      content: [
        t("Prix mis à jour manuellement depuis les pages officielles.",
          "Prices updated manually from official pages."),
        t("Dernière vérification : 13 mars 2026.",
          "Last verification: March 13, 2026."),
        t("Les outils avec prix « low reliability » sont signalés explicitement.",
          "Tools with 'low reliability' pricing are explicitly flagged."),
      ],
    },
  ];

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center">
          <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground mb-6">
            {t("Méthodologie", "Methodology")}
          </span>
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
            {t("Comment ToolTrim vérifie les données", "How ToolTrim verifies data")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t(
              "Comment ToolTrim vérifie les prix, évalue les alternatives et produit des recommandations actionnables pour votre stack SaaS.",
              "How ToolTrim verifies pricing, evaluates alternatives, and produces actionable recommendations for your SaaS stack."
            )}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-6 rounded-2xl border border-border bg-card p-8">
          {[
            { value: `${stats.tools}`, label: t("Outils analysés", "Tools analyzed") },
            { value: `${stats.verified}`, label: t("Prix vérifiés", "Verified prices") },
            { value: `${stats.ferme}`, label: t("Prescriptions fermes", "Firm prescriptions") },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-mono text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="mt-16 space-y-10">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-border bg-card p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <section.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold">{section.title}</h2>
                  <ul className="mt-4 space-y-3">
                    {section.content.map((text, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* E-E-A-T trust signals */}
        <div className="mt-16 rounded-2xl border border-primary/20 bg-accent/30 p-8 md:p-12">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">
                {t("Notre engagement de confiance", "Our trust commitment")}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t(
                  "ToolTrim est développé par des praticiens du SaaS qui ont eux-mêmes géré des stacks d'outils à plusieurs milliers d'euros par mois. Les recommandations sont basées sur des données vérifiées, pas sur des opinions ou des affiliations commerciales.",
                  "ToolTrim is developed by SaaS practitioners who have themselves managed tool stacks costing thousands of euros per month. Recommendations are based on verified data, not opinions or commercial affiliations."
                )}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-primary" />
                {t("Signaler un prix incorrect → contact@tooltrim.com", "Report incorrect pricing → contact@tooltrim.com")}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Analyser ma stack →", "Analyze my stack →")}
          </Link>
          <Link
            to={`${prefix}/transparency`}
            className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
          >
            {t("Notre politique de transparence", "Our transparency policy")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MethodologyPage;
