import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { setSeoTags, setHreflang, cleanupSeo } from "@/lib/seo";
import { ShieldCheck, Link2, Ban, FileCheck, Scale, Heart } from "lucide-react";
import PageHero from "@/components/PageHero";

const TransparencyPage = () => {
  const { t, prefix, lang } = useLang();

  useEffect(() => {
    const title = t(
      "Transparence — Comment ToolTrim se finance",
      "Transparency — How ToolTrim is funded"
    );
    const desc = t(
      "Découvrez comment ToolTrim fonctionne : liens affiliés déclarés, zéro contenu sponsorisé, indépendance éditoriale totale.",
      "Learn how ToolTrim works: declared affiliate links, zero sponsored content, full editorial independence."
    );
    setSeoTags({ title, description: desc, url: `https://tooltrim.com/${lang}/transparency` });
    setHreflang(`/${lang}/transparency`);
    return () => cleanupSeo([]);
  }, [lang]);

  const principles = [
    {
      icon: Link2,
      title: t("Liens affiliés déclarés", "Declared affiliate links"),
      desc: t(
        "Certains outils contiennent un lien affilié. Si vous souscrivez via ce lien, nous recevons une commission — sans surcoût pour vous. Ces liens sont toujours clairement identifiés.",
        "Some tools contain an affiliate link. If you subscribe via this link, we receive a commission — at no extra cost to you. These links are always clearly identified."
      ),
    },
    {
      icon: Ban,
      title: t("Zéro placement payant", "Zero paid placement"),
      desc: t(
        "Aucun éditeur SaaS ne paie pour apparaître dans notre catalogue, être mieux positionné ou recevoir un meilleur verdict. Notre classement est 100% éditorialement indépendant.",
        "No SaaS vendor pays to appear in our catalog, be better positioned, or receive a better verdict. Our ranking is 100% editorially independent."
      ),
    },
    {
      icon: FileCheck,
      title: t("Prix vérifiés à la source", "Source-verified pricing"),
      desc: t(
        "Tous les prix affichés proviennent directement des pages pricing officielles des éditeurs. Nous utilisons le prix mensuel TTC en €, vérifié manuellement.",
        "All displayed prices come directly from vendors' official pricing pages. We use the monthly price including tax in €, manually verified."
      ),
    },
    {
      icon: Scale,
      title: t("Scoring objectif et documenté", "Objective, documented scoring"),
      desc: t(
        "Notre moteur de diagnostic utilise des critères factuels : couverture fonctionnelle, doublons dans la stack, prix relatif, et existence d'alternatives. Chaque recommandation est explicable.",
        "Our diagnostic engine uses factual criteria: functional coverage, stack duplicates, relative pricing, and existence of alternatives. Every recommendation is explainable."
      ),
    },
    {
      icon: ShieldCheck,
      title: t("Aucune donnée revendue", "No data resold"),
      desc: t(
        "Les données collectées via le diagnostic (email, outils sélectionnés) ne sont jamais revendues à des tiers. Elles servent uniquement à améliorer nos recommandations.",
        "Data collected through the diagnostic (email, selected tools) is never resold to third parties. It is only used to improve our recommendations."
      ),
    },
    {
      icon: Heart,
      title: t("Un projet par et pour les freelances", "A project by and for freelancers"),
      desc: t(
        "ToolTrim est né de notre propre frustration face au suréquipement SaaS. Nous voulons aider la communauté freelance à reprendre le contrôle de ses dépenses logicielles.",
        "ToolTrim was born from our own frustration with SaaS over-tooling. We want to help the freelance community take back control of their software spending."
      ),
    },
  ];

  return (
    <div>
      <PageHero
        breadcrumb={[{ label: t("Transparence", "Transparency") }]}
        eyebrow={t("Transparence", "Transparency")}
        icon={<ShieldCheck className="h-3.5 w-3.5" />}
        title={
          <>
            {t("Comment ToolTrim", "How ToolTrim")} <span className="text-primary">{t("se finance", "is funded")}</span>
          </>
        }
        description={t(
          "Nous croyons qu'un comparateur ne peut être crédible que s'il est transparent sur son modèle économique. Voici exactement comment ToolTrim fonctionne.",
          "We believe a comparator can only be credible if it's transparent about its business model. Here's exactly how ToolTrim works."
        )}
        maxWidth="narrow"
      />

      <div className="container mx-auto max-w-4xl px-6 py-16 md:py-20">

        {/* Key commitment */}
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
          <p className="text-xl font-bold text-foreground">
            {t(
              "🎯 Nos recommandations ne sont jamais influencées par les commissions.",
              "🎯 Our recommendations are never influenced by commissions."
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              "Un outil sans lien affilié a autant de chances d'être recommandé qu'un outil avec.",
              "A tool without an affiliate link has the same chance of being recommended as one with."
            )}
          </p>
        </div>

        {/* Principles grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {principles.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <p.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            {t("Des questions sur notre fonctionnement ?", "Questions about how we work?")}
          </p>
          <Link
            to={`${prefix}/contact`}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Contactez-nous →", "Contact us →")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TransparencyPage;
