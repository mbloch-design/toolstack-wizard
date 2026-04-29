import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { useTools } from "@/hooks/useSupabaseData";
import { useMemo, useEffect } from "react";
import { setSeoTags, setHreflang, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { Shield, BarChart3, Ban, Eye, Clock, AlertTriangle, Quote } from "lucide-react";

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
      "Notre méthode | ToolTrim — Prix vérifiés, recommandations sans biais",
      "Our methodology | ToolTrim — Verified pricing, unbiased recommendations"
    );
    const desc = t(
      "ToolTrim est construit par un freelance indépendant qui a lui-même perdu des centaines d'euros en abonnements inutiles. Voici comment on vérifie les prix et produit des recommandations honnêtes.",
      "ToolTrim is built by an independent freelancer who lost hundreds of euros in unused subscriptions. Here's how we verify pricing and produce honest recommendations."
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

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto max-w-4xl">

        {/* Hero — founder story */}
        <div className="text-center">
          <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent-foreground mb-6">
            {t("Méthodologie", "Methodology")}
          </span>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight md:text-5xl">
            {t(
              <>Construit par un freelance<br /><em className="text-primary italic">qui en avait marre</em></>,
              <>Built by a freelancer<br /><em className="text-primary italic">who'd had enough</em></>
            )}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t(
              "ToolTrim est né d'un constat simple : je payais plus de 300€/mois pour des outils dont j'utilisais 20% des fonctionnalités. Personne ne proposait une analyse honnête, sans affiliation. Alors j'ai construit ça.",
              "ToolTrim came from a simple observation: I was paying over €300/month for tools I used at 20% capacity. Nobody offered an honest, unaffiliated analysis. So I built this."
            )}
          </p>
        </div>

        {/* Pull quote */}
        <blockquote className="mt-12 rounded-2xl border-l-4 border-primary bg-primary/5 px-8 py-6">
          <Quote className="h-5 w-5 text-primary/40 mb-3" />
          <p className="text-base font-medium leading-relaxed text-foreground italic">
            {t(
              "\"Le problème avec les comparatifs SaaS, c'est que tous ceux qui les font ont un accord d'affiliation avec les outils qu'ils recommandent. Moi, non.\"",
              "\"The problem with SaaS comparisons is that everyone who writes them has an affiliate deal with the tools they recommend. I don't.\""
            )}
          </p>
          <footer className="mt-3 text-sm text-muted-foreground">— {t("Fondateur, ToolTrim", "Founder, ToolTrim")}</footer>
        </blockquote>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-6 rounded-2xl border border-border bg-card p-8">
          {[
            { value: `${stats.tools}`, label: t("Outils analysés", "Tools analyzed") },
            { value: `${stats.verified}`, label: t("Prix vérifiés manuellement", "Manually verified prices") },
            { value: `${stats.ferme}`, label: t("Recommandations fermes", "Firm recommendations") },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-mono text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="mt-16 space-y-8">

          {/* 1. Prix */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <Eye className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold">
                  {t("Comment on vérifie les prix", "How we verify pricing")}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(
                    "Chaque prix est relevé directement sur la page officielle de l'outil — pas depuis un blog, pas depuis un agrégateur. On stocke l'URL source et la date de vérification pour chaque fiche.",
                    "Every price is taken directly from the tool's official page — not from a blog, not from an aggregator. We store the source URL and verification date on every tool page."
                  )}
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    t("Prix de départ par utilisateur, facturation mensuelle", "Starting price per user, monthly billing"),
                    t("3 niveaux de fiabilité : officiel explicite, officiel contextuel, faible (signalé)", "3 reliability levels: explicit official, contextual official, low (flagged)"),
                    t("Mise à jour régulière — la date est visible sur chaque fiche outil", "Regular updates — the date is visible on every tool page"),
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 2. Recommandations */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <BarChart3 className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold">
                  {t("Comment on produit les recommandations", "How we produce recommendations")}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(
                    "Une recommandation n'est affichée que si plusieurs conditions sont réunies : prix vérifié, outils fonctionnellement substituables, et économie réelle calculable. Quand les données sont insuffisantes, on ne prescrit pas — on le dit.",
                    "A recommendation is only shown when several conditions are met: verified price, functionally substitutable tools, and a calculable real saving. When data is insufficient, we don't prescribe — we say so."
                  )}
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    t(`${stats.ferme} outils ont une recommandation ferme — les autres affichent « pas de verdict »`, `${stats.ferme} tools have a firm recommendation — others show "no verdict"`),
                    t("Pas de recommandation si les outils couvrent des usages différents", "No recommendation if tools cover different use cases"),
                    t("Pas d'économie affichée si elle ne peut pas être vérifiée", "No savings shown if they can't be verified"),
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 3. Ce qu'on ne fait pas */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <Ban className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold">
                  {t("Ce que ToolTrim ne fait pas", "What ToolTrim doesn't do")}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(
                    "C'est peut-être la partie la plus importante. L'indépendance, ça se prouve par ce qu'on refuse, pas par ce qu'on affirme.",
                    "This might be the most important section. Independence is proven by what you refuse, not by what you claim."
                  )}
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    t("Aucun accord d'affiliation avec les outils analysés", "No affiliate deals with any analyzed tool"),
                    t("Aucun contenu sponsorisé — personne ne peut payer pour apparaître en « recommandé »", "No sponsored content — nobody can pay to appear as 'recommended'"),
                    t("Aucune comparaison entre des outils qui ne sont pas substituables", "No comparisons between tools that aren't substitutable"),
                    t("Aucune économie affichée qu'on ne peut pas chiffrer avec des données vérifiées", "No savings displayed that we can't quantify with verified data"),
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 4. Mise à jour */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <Clock className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold">
                  {t("Fraîcheur des données", "Data freshness")}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(
                    "Les prix SaaS changent souvent — parfois sans préavis. On actualise régulièrement les fiches et on affiche la date de dernière vérification sur chaque outil. Si vous constatez un prix incorrect, signalez-le — on corrige sous 48h.",
                    "SaaS pricing changes often — sometimes without notice. We regularly update tool pages and display the last verification date on each one. If you spot incorrect pricing, report it — we'll fix it within 48h."
                  )}
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    t("Date de vérification visible sur chaque fiche outil", "Verification date visible on every tool page"),
                    t("Les outils avec prix peu fiables sont signalés explicitement", "Tools with low-reliability pricing are explicitly flagged"),
                    t("Erreur à signaler : contact@tooltrim.com", "Report errors: contact@tooltrim.com"),
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Trust block */}
        <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-12">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">
                {t("Pourquoi vous pouvez nous faire confiance", "Why you can trust us")}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t(
                  "ToolTrim est construit par un freelance indépendant confronté au même problème que vous. Pas de VC, pas d'accord commercial, pas de pression pour favoriser un outil plutôt qu'un autre. Les recommandations viennent des données — et quand les données manquent, on le dit clairement plutôt que d'inventer un verdict.",
                  "ToolTrim is built by an independent freelancer facing the same problem as you. No VC, no commercial deals, no pressure to favor one tool over another. Recommendations come from data — and when data is missing, we say so clearly rather than inventing a verdict."
                )}
              </p>
              <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
                <span>{t("Prix incorrect ? → contact@tooltrim.com", "Incorrect price? → contact@tooltrim.com")}</span>
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
            to={`${prefix}/tools`}
            className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
          >
            {t("Voir les 314 outils", "Browse 314 tools")}
          </Link>
        </div>

      </div>
    </div>
  );
};

export default MethodologyPage;
