import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { setSeoTags, setHreflang, cleanupSeo } from "@/lib/seo";

/**
 * Transparency — long-form editorial piece, voice-led.
 * Reuses .ab-* (article) classes from About / Methodology. Same shape:
 * hero with date stamp, lede with endmark, 5 prose sections, quiet CTA.
 */
const TransparencyPage = () => {
  const { t, prefix, lang } = useLang();

  const now = new Date();
  const monthFr = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const monthEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const stamp = lang === "fr"
    ? `Transparence · ${monthFr[now.getMonth()]} ${now.getFullYear()}`
    : `Transparency · ${monthEn[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    const title = t(
      "Transparence | ToolTrim — Comment on se finance, ce qu'on refuse",
      "Transparency | ToolTrim — How we make money, what we refuse",
    );
    const desc = t(
      "Liens affiliés, oui. Influence sur le verdict, non. Voici exactement comment ToolTrim se finance, comment on note, et ce qu'on fait de vos données.",
      "Affiliate links, yes. Influence on the verdict, no. Here's exactly how ToolTrim makes money, how we score, and what we do with your data.",
    );
    setSeoTags({ title, description: desc, url: `https://tooltrim.com/${lang}/transparency` });
    setHreflang(`/${lang}/transparency`);
    return () => cleanupSeo([]);
  }, [lang, t]);

  return (
    <div className="ab-page">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="tt-page-hero">
        <div className="tt-page-hero-inner">
          <div className="ab-hero-meta">
            <nav className="cp-breadcrumb" aria-label="Breadcrumb">
              <Link to={prefix || "/fr"}>ToolTrim</Link>
              <span>/</span>
              <span>{t("Transparence", "Transparency")}</span>
            </nav>
            <time className="cp-hero-checked" dateTime={now.toISOString().slice(0, 10)}>{stamp}</time>
          </div>

          <span className="tt-page-hero-eyebrow">{t("Transparence", "Transparency")}</span>
          <h1 className="tt-page-hero-title">
            {t("Liens affiliés, oui. Influence sur le verdict, non.", "Affiliate links, yes. Influence on the verdict, no.")}
          </h1>
          <p className="tt-page-hero-desc">
            {t(
              "Un comparateur n'est crédible que s'il est lisible sur son modèle. Cette page explique exactement comment on gagne de l'argent, comment on note, et ce qu'on fait de vos données.",
              "A comparison site is only credible if it's readable on its business model. This page explains exactly how we make money, how we score, and what we do with your data.",
            )}
          </p>
        </div>
      </section>

      {/* ── Article body ──────────────────────────────────────── */}
      <article className="ab-article">
        <div className="ab-container">

          {/* Lede — the core commitment */}
          <p className="ab-lede">
            {t(
              "Nos recommandations ne sont jamais influencées par les commissions. Un outil sans lien affilié a autant de chances d'être recommandé qu'un outil avec",
              "Our recommendations are never influenced by commissions. A tool without an affiliate link has the same chance of being recommended as one with",
            )}
            <span className="ab-endmark" aria-hidden="true" />
          </p>

          {/* ── 1. Comment on est financé ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Comment on est financé", "How we make money")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Liens affiliés sur les outils qu'on recommande déjà. Quand vous souscrivez via un de ces liens, on touche une commission — sans surcoût pour vous. C'est notre seule source de revenu.",
                  "Affiliate links on the tools we already recommend. When you subscribe through one of these links, we receive a commission — at no extra cost to you. That's our only source of revenue.",
                )}
              </p>
              <p>
                {t(
                  "Les liens affiliés sont identifiés explicitement sur les fiches concernées. Ils ne sont jamais cachés derrière du texte neutre.",
                  "Affiliate links are explicitly identified on the relevant pages. They are never hidden behind neutral text.",
                )}
              </p>
            </div>
          </section>

          {/* ── 2. Ce qu'on refuse ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Ce qu'on refuse", "What we refuse")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Aucun éditeur SaaS ne paie pour apparaître dans le catalogue, être mieux positionné, ou recevoir un meilleur verdict. Le classement éditorial est strictement séparé du programme d'affiliation.",
                  "No SaaS vendor pays to appear in the catalog, be better positioned, or receive a better verdict. Editorial ranking is strictly separated from the affiliate program.",
                )}
              </p>
              <p>
                {t(
                  "Pas de placements payants, pas de « sponsorisé », pas de top-list sponsorisée déguisée en édito. Si un outil paie pour être recommandé sur d'autres sites, c'est probablement une raison pour qu'il ne le soit pas ici.",
                  "No paid placements, no \"sponsored\", no sponsored top-list dressed as editorial. If a tool pays to be recommended elsewhere, that's probably a reason it isn't here.",
                )}
              </p>
            </div>
          </section>

          {/* ── 3. Comment on collecte les prix ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Comment on collecte les prix", "How we collect prices")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Tous les prix proviennent directement des pages pricing officielles des éditeurs. Vérifiés à la main, à intervalles réguliers, avec date de vérification visible sur chaque fiche.",
                  "All prices come directly from vendors' official pricing pages. Manually verified, at regular intervals, with the verification date visible on each page.",
                )}
              </p>
              <p>
                {t(
                  "Unité standard : prix mensuel TTC en €. Quand un outil ne publie que le prix annuel, on le ramène au mensuel équivalent — la conversion est explicitée.",
                  "Standard unit: monthly price including tax in €. When a tool only publishes the annual price, we bring it back to the monthly equivalent — the conversion is shown.",
                )}
              </p>
            </div>
          </section>

          {/* ── 4. Comment on note ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Comment on note", "How we score")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Le moteur de diagnostic utilise des critères factuels : couverture fonctionnelle réelle, doublons dans la stack, prix relatif au marché, existence d'alternatives gratuites ou ouvertes.",
                  "The diagnostic engine uses factual criteria: actual functional coverage, stack duplicates, market-relative pricing, existence of free or open-source alternatives.",
                )}
              </p>
              <p>
                {t(
                  "Chaque recommandation est explicable : on peut pointer la raison exacte pour laquelle un outil est gardé, remplacé ou supprimé. Pas de score à 5 étoiles opaque.",
                  "Every recommendation is explainable: we can point to the exact reason a tool is kept, replaced, or dropped. No opaque 5-star score.",
                )}
              </p>
              <p>
                <Link to={`${prefix}/methodology`} className="ab-inline-link">
                  {t("Lire la méthodologie complète", "Read the full methodology")}
                </Link>
              </p>
            </div>
          </section>

          {/* ── 5. Données ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Ce qu'on fait de vos données", "What we do with your data")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Les données collectées via le diagnostic (email, outils sélectionnés, profil) ne sont jamais revendues à des tiers. Elles servent à générer votre rapport et, anonymisées, à améliorer les recommandations.",
                  "Data collected through the diagnostic (email, selected tools, profile) is never resold to third parties. It's used to generate your report and, anonymized, to improve recommendations.",
                )}
              </p>
              <p>
                {t(
                  "Vous pouvez demander la suppression de votre compte et de vos données à tout moment, sans justification.",
                  "You can request deletion of your account and data at any time, with no justification needed.",
                )}
              </p>
            </div>
          </section>

          {/* ── CTA ── */}
          <div className="ab-cta">
            <Link to={`${prefix}/contact`} className="tt-button-primary">
              {t("Une question ? Écris-nous →", "A question? Write to us →")}
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

export default TransparencyPage;
