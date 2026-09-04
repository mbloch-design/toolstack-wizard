import { useLang } from "@/hooks/useLang";
import Breadcrumb from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { setSeoTags, setHreflang, cleanupSeo } from "@/lib/seo";

// Fixed section ids, same scroll-spy approach as MethodologyPage's TOC_IDS.
const TOC_IDS = ["financement", "refus", "prix", "notation", "donnees"] as const;

/**
 * Transparency — long-form editorial piece, voice-led.
 * Reuses .ab-* (article) classes from About / Methodology, and the same
 * sticky-TOC + reading-column grid (.ga-body-grid) as Methodology now that
 * this page carries five sections including a full ratings breakdown.
 */
const TransparencyPage = () => {
  const { t, prefix, lang } = useLang();

  const [activeHeading, setActiveHeading] = useState<string>(TOC_IDS[0]);
  useEffect(() => {
    setActiveHeading((current) => current || TOC_IDS[0]);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActiveHeading(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 1] },
    );
    TOC_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const now = new Date();
  const monthFr = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const monthEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const stamp = lang === "fr"
    ? `Transparence · ${monthFr[now.getMonth()]} ${now.getFullYear()}`
    : `Transparency · ${monthEn[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    const title = t(
      "Transparence | ToolTrim : comment on se finance, ce qu'on refuse",
      "Transparency | ToolTrim: how we make money, what we refuse",
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
            <Breadcrumb items={[{ label: t("Transparence", "Transparency") }]} />
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

      {/* ── Article body: sticky TOC + reading column, same ga-body-grid
          pattern as Methodology, now that this page holds five sections
          including a full ratings breakdown. ── */}
      <article className="ab-article">
        <div className="ga-body-grid">

          <aside className="ga-toc-col">
            <p className="ga-toc-label">{t("Sommaire", "Contents")}</p>
            <nav className="ga-toc-nav">
              {([
                ["financement", t("Comment on est financé", "How we make money")],
                ["refus", t("Ce qu'on refuse", "What we refuse")],
                ["prix", t("Comment on collecte les prix", "How we collect prices")],
                ["notation", t("Comment on note", "How we score")],
                ["donnees", t("Vos données", "Your data")],
              ] as const).map(([id, label]) => (
                <a key={id} href={`#${id}`} className={`ga-toc-link${activeHeading === id ? " ga-toc-link--active" : ""}`}>
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <article>

          {/* Lede — the core commitment */}
          <p className="ab-lede">
            {t(
              "Nos recommandations ne sont jamais influencées par les commissions. Un outil sans lien affilié a autant de chances d'être recommandé qu'un outil avec",
              "Our recommendations are never influenced by commissions. A tool without an affiliate link has the same chance of being recommended as one with",
            )}
            <span className="ab-endmark" aria-hidden="true" />
          </p>

          {/* ── 1. Comment on est financé ── */}
          <section className="ab-section" id="financement">
            <h2 className="ab-section-title">{t("Comment on est financé", "How we make money")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Liens affiliés sur les outils qu'on recommande déjà. Quand vous souscrivez via un de ces liens, on touche une commission, sans surcoût pour vous. C'est notre seule source de revenu.",
                  "Affiliate links on the tools we already recommend. When you subscribe through one of these links, we receive a commission, at no extra cost to you. That's our only source of revenue.",
                )}
              </p>
              <p>
                {t(
                  "Les liens affiliés sont identifiés explicitement sur les fiches concernées. Ils ne sont jamais cachés derrière du texte neutre.",
                  "Affiliate links are explicitly identified on the relevant pages. They are never hidden behind neutral text.",
                )}
              </p>
              <p>
                {t(
                  "Deuxième levier, plus récent : accélérer le passage dans notre file d'attente éditoriale. Deux façons d'y accéder : gratuite, contre l'ajout d'un badge ToolTrim sur le site de l'éditeur ; payante, plus rapide encore, sans rien à afficher en retour. Une mise en avant visuelle payante (badge et emplacement identifiés comme tels dans le catalogue) arrive prochainement, avec la même règle.",
                  "A second, more recent lever: speeding up the wait in our editorial queue. Two ways in: free, in exchange for the vendor adding a ToolTrim badge to their site; paid, even faster, with nothing to display in return. A paid visual placement (badge and slot clearly labeled as such in the catalog) is coming soon, under the same rule.",
                )}
              </p>
              <p>
                {t(
                  "Dans les trois cas (gratuit, accéléré, mis en avant), chaque fiche est revue individuellement, avec la même grille de preuve. Payer ou afficher un badge change le délai ou la visibilité, jamais le contenu ni la note.",
                  "In all three cases (free, accelerated, featured), every page is reviewed individually, against the same evidence grid. Paying or displaying a badge changes the timeline or the visibility, never the content or the score.",
                )}
              </p>
            </div>
          </section>

          {/* ── 2. Ce qu'on refuse ──
              Reworded to stay accurate once accelerated treatment and paid
              placement (disclosed above) are both live: the hard line was
              never "no paid anything", it's "no paid influence on organic
              ranking or the verdict". Keep that precise instead of a
              blanket "no paid placements" that a labeled paid slot would
              directly contradict. */}
          <section className="ab-section" id="refus">
            <h2 className="ab-section-title">{t("Ce qu'on refuse", "What we refuse")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Aucun éditeur SaaS ne paie pour apparaître dans le catalogue, améliorer son classement organique, ou recevoir un meilleur verdict. Le classement éditorial est strictement séparé du programme d'affiliation.",
                  "No SaaS vendor pays to appear in the catalog, improve their organic ranking, or receive a better verdict. Editorial ranking is strictly separated from the affiliate program.",
                )}
              </p>
              <p>
                {t(
                  "Aucun placement payant n'influence le classement organique ni la note. Pas de top-list sponsorisée déguisée en édito : un emplacement payant reste identifié comme tel, jamais confondu avec une recommandation. Si un outil paie pour être recommandé sur d'autres sites, c'est probablement une raison pour qu'il ne le soit pas ici.",
                  "No paid placement influences organic ranking or the score. No sponsored top-list disguised as editorial: a paid slot stays labeled as such, never confused with a recommendation. If a tool pays to be recommended elsewhere, that's probably a reason it isn't here.",
                )}
              </p>
            </div>
          </section>

          {/* ── 3. Comment on collecte les prix ── */}
          <section className="ab-section" id="prix">
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
                  "Unité de référence : prix mensuel en dollars US ($), la devise dans laquelle la plupart des éditeurs SaaS publient, la majorité étant internationaux. Convertible en euros via le sélecteur de devise du site. Quand un outil ne publie que le prix annuel, on le ramène au mensuel équivalent, calcul affiché.",
                  "Reference unit: monthly price in US dollars ($), the currency most SaaS vendors publish in, most of them being international. Convertible to euros via the site's currency switcher. When a tool only publishes the annual price, we bring it back to the monthly equivalent, with the calculation shown.",
                )}
              </p>
            </div>
          </section>

          {/* ── 4. Comment on note ──
              Two distinct things get scored on ToolTrim: the diagnostic
              engine (stack audit) and the per-tool rating out of 5 shown as
              stars on each tool page. This section used to only describe
              the former and claimed "no 5-star score" — which the star
              display now directly contradicts. Reuses the same five-axis
              grid (.me-cars) and copy as Methodology's #notation section so
              the two pages never drift apart on what the criteria are. */}
          <section className="ab-section" id="notation">
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
                  "La note sur 5 affichée sur chaque fiche outil suit la même logique : chaque recommandation est explicable, jamais une moyenne d'avis clients. On note cinq critères factuels, chacun à partir d'une preuve citée.",
                  "The score out of 5 shown on every tool page follows the same logic: every recommendation is explainable, never an average of customer reviews. We grade five factual criteria, each from a cited piece of evidence.",
                )}
              </p>
            </div>
            <dl className="me-cars">
              {[
                { letter: "1", word: t("Valeur ajoutée", "Added value"), desc: t("Le gain réel (temps, argent) rapporté à ce que l'outil coûte.", "The real gain (time, money) relative to what the tool costs.") },
                { letter: "2", word: t("Simplicité", "Simplicity"), desc: t("Le temps et la compétence nécessaires pour en tirer un premier résultat utile.", "The time and skill needed to get a first useful result.") },
                { letter: "3", word: t("Utilisation", "Fit for purpose"), desc: t("Le degré de réalisation de l'objectif que l'outil annonce, sans contournement.", "How fully the tool delivers on its stated promise, without workarounds.") },
                { letter: "4", word: t("Puissance", "Performance"), desc: t("La profondeur technique et le plafond de capacité face à sa catégorie.", "Technical depth and capability ceiling relative to its category.") },
                { letter: "5", word: t("Réversibilité", "Reversibility"), desc: t("La facilité à récupérer ses données et à partir si l'outil ne convient plus.", "How easily you can get your data out and leave if the tool stops working for you.") },
              ].map((b) => (
                <div key={b.letter} className="me-cars-row">
                  <dt className="me-cars-letter">{b.letter}</dt>
                  <div className="me-cars-body">
                    <p className="me-cars-word">{b.word}</p>
                    <p className="me-cars-desc">{b.desc}</p>
                  </div>
                </div>
              ))}
            </dl>
            <div className="ab-prose">
              <p>
                <Link to={`${prefix}/methodology#notation`} className="ab-inline-link">
                  {t("Lire le détail de chaque critère", "Read the detail on each criterion")}
                </Link>
              </p>
            </div>
          </section>

          {/* ── 5. Données ── */}
          <section className="ab-section" id="donnees">
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

          </article>
        </div>
      </article>
    </div>
  );
};

export default TransparencyPage;
