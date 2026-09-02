import { useLang } from "@/hooks/useLang";
import Breadcrumb from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { useMemo, useEffect } from "react";
import { setSeoTags, setHreflang, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";

/**
 * Methodology — long-form editorial piece, voice-led.
 *
 * Reuses .ab-* (long-form article) classes from About — same format, same
 * pattern. The original content (problem → convictions → proof table →
 * CARS framework → closing) is kept intact; only the surrounding chrome
 * (cards, icons, colored panels) is replaced with prose typography.
 */
const MethodologyPage = () => {
  const { t, lang } = useLang();
  const { tools } = useToolSummaries();

  const stats = useMemo(() => {
    const ferme = tools.filter((tool: any) => tool.prescription_quality === "ferme").length;
    const verified = tools.filter((tool: any) => tool.pricing_v5?.verified_on).length;
    return { tools: tools.length, ferme, verified };
  }, [tools]);

  const now = new Date();
  const monthFr = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const monthEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const stamp = lang === "fr"
    ? `Méthodologie · ${monthFr[now.getMonth()]} ${now.getFullYear()}`
    : `Methodology · ${monthEn[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    const title = t(
      "Méthodologie | ToolTrim — Diagnostic, pas annuaire",
      "Methodology | ToolTrim — Diagnosis, not directory",
    );
    const desc = t(
      "La plupart des comparateurs SaaS vous vendent de l'information. Pas un diagnostic. Voici pourquoi ToolTrim part du contexte, pas du catalogue.",
      "Most SaaS comparators sell you information. Not a diagnosis. Here's why ToolTrim starts from context, not from a catalog.",
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
  }, [lang, t]);

  const contrastRows: Array<{ them: string; us: string }> = lang === "fr"
    ? [
        { them: "Lister les outils", us: "Analyser votre stack réelle" },
        { them: "Prix génériques copiés-collés", us: "Prix vérifiés sur les pages officielles" },
        { them: "Recommandations globales", us: "Adaptées à votre TJM et à votre profil" },
        { them: "Aucune détection de doublon", us: "Doublons identifiés outil par outil" },
        { them: "Affilié aux résultats", us: "100 % indépendant, sans accord commercial" },
      ]
    : [
        { them: "List the tools", us: "Analyze your actual stack" },
        { them: "Generic copy-pasted pricing", us: "Pricing verified on official pages" },
        { them: "Global recommendations", us: "Tailored to your day rate and profile" },
        { them: "No duplicate detection", us: "Duplicates flagged tool by tool" },
        { them: "Affiliated to the results", us: "100% independent, no commercial deal" },
      ];

  const cars = [
    { letter: "C", word: "Context",     desc: t("Poser le terrain : ce que font les autres outils.", "Set the ground: what other tools do.") },
    { letter: "A", word: "Accusation",  desc: t("Nommer le manque, sans détour.", "Name the gap, without detour.") },
    { letter: "R", word: "Remedy",      desc: t("Présenter la réponse — ici, le diagnostic contextuel.", "Present the answer — here, contextual diagnosis.") },
    { letter: "S", word: "Statement",   desc: t("Affirmer la position et inviter à l'action.", "Assert the position and invite to act.") },
  ];

  return (
    <div className="ab-page">

      {/* ── Hero — shared pattern ───────────────────────── */}
      <section className="tt-page-hero">
        <div className="tt-page-hero-inner">
          <div className="ab-hero-meta">
            <Breadcrumb items={[{ label: t("Méthodologie", "Methodology") }]} />
            <time className="cp-hero-checked" dateTime={now.toISOString().slice(0, 10)}>{stamp}</time>
          </div>

          <span className="tt-page-hero-eyebrow">{t("Méthodologie", "Methodology")}</span>
          <h1 className="tt-page-hero-title">
            {t("Un annuaire vend de l'information. On vend un diagnostic.", "A directory sells information. We sell a diagnosis.")}
          </h1>
          <p className="tt-page-hero-desc">
            {t(
              "Cette page n'explique pas comment ToolTrim fonctionne en interne. Elle explique pourquoi un annuaire ne pouvait pas faire le travail — et ce qu'on a dû construire à la place.",
              "This page doesn't explain how ToolTrim works internally. It explains why a directory couldn't do the job — and what we had to build instead.",
            )}
          </p>
        </div>
      </section>

      {/* ── Article body ────────────────────────────────── */}
      <article className="ab-article">
        <div className="ab-container">

          {/* Lede */}
          <p className="ab-lede">
            {t(
              "La différence entre une liste et un diagnostic, c'est le contexte",
              "The difference between a list and a diagnosis is context",
            )}
            <span className="ab-endmark" aria-hidden="true" />
          </p>

          {/* ── Le problème ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Un annuaire ne sait pas qui vous êtes.", "A directory doesn't know who you are.")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Un annuaire vous dit que Notion existe et coûte 16 €/mois. Il ne sait pas que vous payez aussi Coda, que vous êtes seul, et que l'un des deux dort depuis 4 mois.",
                  "A directory tells you Notion exists and costs €16/month. It doesn't know you also pay for Coda, that you work alone, and that one of the two has been dormant for 4 months.",
                )}
              </p>
              <p>
                {t(
                  "C'est pour ça qu'on n'écrit pas un annuaire de plus. La fonction n'est pas de lister, c'est de trancher.",
                  "That's why we don't write another directory. The job isn't to list, it's to give verdicts.",
                )}
              </p>
            </div>
          </section>

          {/* ── Trois principes ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Trois principes non négociables.", "Three non-negotiable principles.")}</h2>
            <ol className="ab-rules">
              <li>
                <strong>{t("Le contexte change tout.", "Context changes everything.")}</strong>{" "}
                {t(
                  "Un outil recommandé à un DSI de 50 personnes est souvent inutile pour un freelance. On ne recommande qu'après avoir compris qui vous êtes — métier, TJM, stack en place, contraintes.",
                  "A tool recommended to a 50-person IT department is often useless for a freelancer. We only recommend after understanding who you are — role, day rate, current stack, constraints.",
                )}
              </li>
              <li>
                <strong>{t("L'indépendance n'est pas optionnelle.", "Independence isn't optional.")}</strong>{" "}
                {t(
                  "Aucun accord d'affiliation ne biaise nos recommandations. Si un outil moins cher fait le travail, on le dit — même si on ne touche rien dessus.",
                  "No affiliate deal biases our recommendations. If a cheaper tool does the job, we say so — even if we earn nothing from it.",
                )}
              </li>
              <li>
                <strong>{t("Une recommandation sans chiffre n'en est pas une.", "A recommendation without a number isn't one.")}</strong>{" "}
                {t(
                  "« Vous pouvez couper cet outil » ne suffit pas. On chiffre l'économie exacte, on vérifie le prix sur la page officielle, on identifie le remplaçant.",
                  "\"You can cut this tool\" isn't enough. We quantify the exact saving, verify the price on the official page, and name the replacement.",
                )}
              </li>
            </ol>
          </section>

          {/* ── La preuve par le contraste ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Annuaire vs diagnostic.", "Directory vs diagnosis.")}</h2>
            <p className="ab-prose">
              {t(
                "Côte à côte, sur cinq critères concrets :",
                "Side by side, on five concrete criteria:",
              )}
            </p>
            <div className="me-contrast" role="table" aria-label={t("Annuaire vs diagnostic", "Directory vs diagnosis")}>
              <div className="me-contrast-head" role="row">
                <span className="me-contrast-head-col me-contrast-head-col--them" role="columnheader">
                  {t("Ce que fait un annuaire", "What a directory does")}
                </span>
                <span className="me-contrast-head-col me-contrast-head-col--us" role="columnheader">
                  {t("Ce que fait ToolTrim", "What ToolTrim does")}
                </span>
              </div>
              {contrastRows.map((row, i) => (
                <div key={i} className="me-contrast-row" role="row">
                  <span className="me-contrast-them" role="cell">{row.them}</span>
                  <span className="me-contrast-us" role="cell">{row.us}</span>
                </div>
              ))}
            </div>

            <p className="me-stats" aria-label={t("Chiffres clés", "Key numbers")}>
              <span>{stats.tools} {t("outils suivis", "tools tracked")}</span>
              <span className="me-stats-sep" aria-hidden="true">·</span>
              <span>{stats.verified} {t("prix vérifiés", "verified prices")}</span>
              <span className="me-stats-sep" aria-hidden="true">·</span>
              <span>{stats.ferme} {t("verdicts fermes", "firm verdicts")}</span>
            </p>
          </section>

          {/* ── Comment on calcule la note ── */}
          <section className="ab-section" id="notation">
            <h2 className="ab-section-title">{t("Comment on calcule la note ToolTrim.", "How the ToolTrim score is calculated.")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "La note sur 5 affichée sur une fiche outil n'est pas une moyenne d'avis clients : c'est une analyse éditoriale, notée sur cinq critères factuels, chacun noté de 1 à 5 à partir d'une preuve citée (documentation officielle, page tarifs, avis vérifiés, comparatif concurrent) — jamais au ressenti.",
                  "The score out of 5 shown on a tool page isn't an average of customer reviews: it's an editorial analysis, graded on five factual criteria, each scored 1 to 5 from a cited piece of evidence (official documentation, pricing page, verified reviews, competitor comparison) — never from feel.",
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
                {t(
                  "Les cinq notes sont ensuite moyennées. Tant qu'un critère n'a pas de preuve suffisante, il reste vide et la fiche affiche à la place une note provisoire basée sur des signaux plus généraux (type d'outil, présence d'IA native, etc.) — jamais une moyenne inventée sur des critères manquants.",
                  "The five scores are then averaged. Until a criterion has enough evidence, it stays unrated and the page shows a provisional score based on broader signals instead (tool type, native AI features...) — never an average computed over missing criteria.",
                )}
              </p>
              <p>
                {t(
                  "Les paliers de lecture (Mauvais, Médiocre, Moyen, Très bon, Excellent) reprennent la convention de bandes utilisée par Trustpilot pour son TrustScore. Chaque preuve citée par critère reste visible directement dans la section \"Notre avis\" de la fiche.",
                  "The reading bands (Bad, Poor, Average, Great, Excellent) follow the band convention Trustpilot uses for its TrustScore. Every cited piece of evidence per criterion stays visible directly in the tool page's \"Our verdict\" section.",
                )}
              </p>
            </div>
          </section>

          {/* ── CARS — framework, prose-led, no colored panel ── */}
          <section className="ab-section">
            <h2 className="ab-section-title">{t("Le framework derrière cette page : CARS.", "The framework behind this page: CARS.")}</h2>
            <div className="ab-prose">
              <p>
                {t(
                  "Modèle rhétorique formalisé par le linguiste John Swales (1990) pour décrire comment un chercheur « crée de l'espace » pour sa propre contribution : montrer que les approches existantes ne couvrent pas son angle, puis occuper ce vide.",
                  "A rhetorical model formalized by linguist John Swales (1990) to describe how a researcher \"creates space\" for their own contribution: show that existing approaches don't cover their angle, then occupy that gap.",
                )}
              </p>
              <p>{t("Adapté en copywriting produit, CARS devient :", "Applied to product copywriting, CARS becomes:")}</p>
            </div>

            <dl className="me-cars">
              {cars.map((b) => (
                <div key={b.letter} className="me-cars-row">
                  <dt className="me-cars-letter">{b.letter}</dt>
                  <div className="me-cars-body">
                    <p className="me-cars-word">{b.word}</p>
                    <p className="me-cars-desc">{b.desc}</p>
                  </div>
                </div>
              ))}
            </dl>

            <p className="me-cars-aside">
              {t(
                "Si vous avez lu jusqu'ici, vous venez de traverser les quatre mouvements. C'est volontaire.",
                "If you've read this far, you just walked through all four moves. That's intentional.",
              )}
            </p>
          </section>

        </div>
      </article>
    </div>
  );
};

export default MethodologyPage;
