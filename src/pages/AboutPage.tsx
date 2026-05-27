import { useLang } from "@/hooks/useLang";
import Breadcrumb from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { useToolSummaries, useCategories } from "@/hooks/useSupabaseData";
import { useMemo, useEffect } from "react";
import { setSeoTags, setHreflang, setJsonLd, cleanupSeo } from "@/lib/seo";

/**
 * About — editorial manifesto, not a SaaS "about us" page.
 *
 * Long-form prose, voice-led. No icon cards, no stats boxes, no
 * accent-colored callouts. The page IS a written piece — the brand
 * speaking in first person. Stripe Press / Substack masthead pattern.
 *
 * Signatures: editorial date stamp (matches hero stamps elsewhere),
 * endmark (▪) closing the manifesto pull-quote, single quiet CTA.
 */
const AboutPage = () => {
  const { t, prefix, lang } = useLang();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();

  const stats = useMemo(() => ({
    tools: tools.length,
    categories: categories.length,
  }), [tools, categories]);

  const now = new Date();
  const monthFr = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const monthEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const stamp = lang === "fr"
    ? `Manifeste · ${monthFr[now.getMonth()]} ${now.getFullYear()}`
    : `Manifesto · ${monthEn[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    const title = t(
      "Manifeste ToolTrim — Verdicts éditoriaux, pas annuaire",
      "ToolTrim Manifesto — Editorial verdicts, not a directory",
    );
    const desc = t(
      "ToolTrim n'est pas un annuaire. C'est un édito. On tranche là où les comparateurs restent neutres, pour les freelances qui veulent une stack juste — pas une stack longue.",
      "ToolTrim isn't a directory. It's an editorial. We give verdicts where generic comparison sites stay neutral, for freelancers who want a tight stack — not a long one.",
    );
    setSeoTags({ title, description: desc, url: `https://tooltrim.com/${lang}/about` });
    setHreflang(`/${lang}/about`);
    setJsonLd("about-jsonld", {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "ToolTrim",
      url: `https://tooltrim.com/${lang}/about`,
      description: desc,
    });
    return () => cleanupSeo(["about-jsonld"]);
  }, [lang, t]);

  return (
    <div className="ab-page">

      {/* ── Hero — manifesto headline ─────────────────────── */}
      <section className="tt-page-hero">
        <div className="tt-page-hero-inner">
          <div className="ab-hero-meta">
            <Breadcrumb items={[{ label: t("Manifeste", "Manifesto") }]} />
            <time className="cp-hero-checked" dateTime={now.toISOString().slice(0, 10)}>{stamp}</time>
          </div>

          <span className="tt-page-hero-eyebrow">{t("Manifeste", "Manifesto")}</span>
          <h1 className="tt-page-hero-title">
            {t("Choisir, c'est éliminer.", "Choosing is eliminating.")}
          </h1>
          <p className="tt-page-hero-desc">
            {t(
              "ToolTrim n'est pas un annuaire. C'est un édito. On tranche là où les comparateurs restent neutres.",
              "ToolTrim isn't a directory. It's an editorial. We give verdicts where comparison sites stay neutral.",
            )}
          </p>
        </div>
      </section>

      {/* ── Article body ──────────────────────────────────── */}
      <article className="ab-article">
        <div className="ab-container">

          {/* Lede — editorial pull-quote with endmark */}
          <p className="ab-lede">
            {t(
              "Les comparateurs SaaS vendent l'enthousiasme. Chaque outil y est « génial », chaque catégorie a « 40 alternatives à découvrir ». Nous, on tranche",
              "Generic SaaS comparison sites sell enthusiasm. Every tool is \"amazing\", every category has \"40 alternatives worth discovering\". We give verdicts",
            )}
            <span className="ab-endmark" aria-hidden="true" />
          </p>

          {/* ── Pourquoi ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Pourquoi on existe", "Why we exist")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Les freelances et fondateurs solo ne manquent pas d'options. Ils manquent de décisions. Entre Notion et Airtable, entre Cursor et Copilot, entre Make et Zapier, le marché vous laisse seul devant 40 onglets ouverts.",
                  "Freelancers and solo founders don't lack options. They lack decisions. Between Notion and Airtable, between Cursor and Copilot, between Make and Zapier, the market leaves you alone with 40 open tabs.",
                )}
              </p>
              <p>
                {t(
                  "Ce n'est pas un problème de découverte. C'est un problème de jugement. Les annuaires comme G2 ou Capterra ne tranchent jamais — ils ne peuvent pas, leur modèle économique vit du nombre d'inscriptions. Nous, on peut.",
                  "It's not a discovery problem. It's a judgment problem. Directories like G2 or Capterra never give verdicts — they can't, their business model lives off listings. We can.",
                )}
              </p>
            </div>
          </section>

          {/* ── Comment ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Comment on travaille", "How we work")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  `Aujourd'hui, ${stats.tools} outils audités sur ${stats.categories} catégories. Pour chacun : prix réel (pas le tarif marketing), profil cible (solo, équipe, agence), alternatives gratuites identifiées, verdict en une phrase.`,
                  `Today, ${stats.tools} tools audited across ${stats.categories} categories. For each: real pricing (not the marketing tier), target profile (solo, team, agency), free alternatives identified, verdict in one sentence.`,
                )}
              </p>
              <p>
                {t(
                  "Notre méthode est publique. Chaque verdict est daté, chaque source est citée. Quand un outil change de prix, le verdict est réécrit. Quand un nouveau concurrent rend une recommandation obsolète, la page est mise à jour.",
                  "Our methodology is public. Every verdict is dated, every source is cited. When a tool changes price, the verdict is rewritten. When a new competitor makes a recommendation obsolete, the page is updated.",
                )}
              </p>
              <p>
                <Link to={`${prefix}/methodology`} className="ab-inline-link">
                  {t("Lire la méthodologie complète", "Read the full methodology")}
                </Link>
              </p>
            </div>
          </section>

          {/* ── Règles éditoriales ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Quatre règles", "Four rules")}</h2>
            <ol className="ab-rules">
              <li>
                <strong>{t("Prescription, pas catalogue.", "Prescription, not catalog.")}</strong>{" "}
                {t(
                  "Un verdict par outil, pas un score à 5 étoiles. Garder, remplacer ou supprimer.",
                  "One verdict per tool, not a 5-star score. Keep, replace, or drop.",
                )}
              </li>
              <li>
                <strong>{t("Transparence totale.", "Full transparency.")}</strong>{" "}
                {t(
                  "Sources citées, prix vérifiés, liens affiliés signalés. Zéro contenu sponsorisé.",
                  "Sources cited, prices verified, affiliate links flagged. Zero sponsored content.",
                )}
              </li>
              <li>
                <strong>{t("Indépendance éditoriale.", "Editorial independence.")}</strong>{" "}
                {t(
                  "Aucun éditeur ne paie pour apparaître. Le scoring vit dans le code, pas dans les commerciaux.",
                  "No vendor pays to appear. Scoring lives in code, not in sales relationships.",
                )}
              </li>
              <li>
                <strong>{t("Moins, mieux.", "Less, better.")}</strong>{" "}
                {t(
                  "Notre mission est de réduire votre stack, pas de l'agrandir. Une recommandation par défaut, jamais quatre.",
                  "Our job is to shrink your stack, not grow it. One default recommendation, never four.",
                )}
              </li>
            </ol>
          </section>

          {/* ── Argent ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Comment on gagne de l'argent", "How we make money")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Liens affiliés sur les outils que nous recommandons déjà. C'est tout. Le lien affilié n'influence jamais le verdict — il l'accompagne quand le verdict existe.",
                  "Affiliate links on tools we already recommend. That's it. The affiliate link never influences the verdict — it accompanies it when the verdict exists.",
                )}
              </p>
              <p>
                {t(
                  "Pas de sponsoring. Pas de placement. Pas d'outils mis en avant contre paiement. Si un outil paie pour être recommandé ailleurs, c'est probablement une raison pour qu'il ne le soit pas ici.",
                  "No sponsorship. No placement. No tools featured against payment. If a tool pays to be recommended elsewhere, that's probably a reason it isn't here.",
                )}
              </p>
              <p>
                <Link to={`${prefix}/transparency`} className="ab-inline-link">
                  {t("Politique de transparence complète", "Full transparency policy")}
                </Link>
              </p>
            </div>
          </section>

          {/* ── Qui ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Qui c'est, « on »", "Who is \"we\"")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Un projet indépendant. Pas une équipe de 20, pas une startup, pas un fonds. Une rédaction — au sens journalistique du terme — qui s'occupe des verdicts, des sources, et des mises à jour.",
                  "An independent project. Not a 20-person team, not a startup, not a fund. A newsroom — in the journalistic sense — taking care of verdicts, sources, and updates.",
                )}
              </p>
              <p>
                {t(
                  "On utilise nous-mêmes les outils qu'on recommande. Quand on remplace un outil de notre stack, ça finit en page. Quand un de nos verdicts vieillit mal, on l'écrit en haut de la page.",
                  "We use the tools we recommend ourselves. When we replace a tool in our own stack, it ends up on a page. When a verdict ages badly, we say so at the top of the page.",
                )}
              </p>
            </div>
          </section>

          {/* ── CTA quiet ── */}
          <div className="ab-cta">
            <Link to={`${prefix}/selector`} className="tt-button-primary">
              {t("Auditer ma stack →", "Audit my stack →")}
            </Link>
            <Link to={`${prefix}/methodology`} className="ab-cta-secondary">
              {t("Voir la méthodologie", "See the methodology")}
            </Link>
          </div>

        </div>
      </article>
    </div>
  );
};

export default AboutPage;
