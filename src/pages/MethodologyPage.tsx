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

      {/* ── Article body: wide site grid (sticky TOC + capped reading
          column), same ga-body-grid pattern as guide articles, replacing
          the old lone 720px column centered in the full page width. ── */}
      <article className="ab-article">
        <div className="ga-body-grid">

          <aside className="ga-toc-col">
            <p className="ga-toc-label">{t("Sommaire", "Contents")}</p>
            <nav className="ga-toc-nav">
              <a href="#probleme" className="ga-toc-link">{t("Le problème", "The problem")}</a>
              <a href="#principes" className="ga-toc-link">{t("Nos principes", "Our principles")}</a>
              <a href="#contraste" className="ga-toc-link">{t("Annuaire vs diagnostic", "Directory vs diagnosis")}</a>
              <a href="#notation" className="ga-toc-link">{t("Comment on note", "How we score")}</a>
              <a href="#cars" className="ga-toc-link">{t("Le framework CARS", "The CARS framework")}</a>
            </nav>
          </aside>

          <article>

          {/* Lede */}
          <p className="ab-lede">
            {t(
              "La différence entre une liste et un diagnostic, c'est le contexte",
              "The difference between a list and a diagnosis is context",
            )}
            <span className="ab-endmark" aria-hidden="true" />
          </p>

          {/* ── Le problème ── */}
          <section className="ab-section" id="probleme">
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
          <section className="ab-section" id="principes">
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
          <section className="ab-section" id="contraste">
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
                  "La question qu'on se pose n'est jamais « est-ce un bon produit dans l'absolu ? ». C'est : est-ce que cet outil facilite vraiment ta journée, est-ce que tu y gagnes à l'utiliser, est-ce que ça vaut le coup d'y investir du temps ou de l'argent, et est-ce que cet investissement est à la hauteur du gain réel. La note sur 5 est la réponse chiffrée à ces quatre questions, jamais une moyenne d'avis clients.",
                  "The question we're answering is never \"is this a good product in the abstract?\". It's: does this tool actually make your day easier, do you gain from using it, is it worth investing time or money in, and is that investment proportional to the real gain. The score out of 5 is the numeric answer to those four questions, never an average of customer reviews.",
                )}
              </p>
              <p>
                {t(
                  "On note cinq critères factuels, chacun de 1 à 5 à partir d'une preuve citée (documentation officielle, page tarifs, avis vérifiés, comparatif concurrent), jamais au ressenti. Deux raccourcis tentants n'en font volontairement pas partie : le nombre d'avantages/inconvénients rédigés sur la fiche (ça mesure l'effort d'écriture d'un éditeur, pas la qualité du produit) et la présence d'un plan gratuit (c'est un choix de modèle économique, pas un indicateur de qualité : un excellent outil payant ne doit pas être pénalisé, un outil médiocre avec un plan gratuit généreux ne doit pas être avantagé).",
                  "We grade five factual criteria, each 1 to 5 from a cited piece of evidence (official documentation, pricing page, verified reviews, competitor comparison), never from feel. Two tempting shortcuts are deliberately left out: the number of pros/cons written on a page (that measures an editor's writing effort, not product quality) and the presence of a free plan (a pricing-model choice, not a quality signal: a great paid-only tool shouldn't be penalized, and a mediocre tool with a generous free tier shouldn't be rewarded for it).",
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

            <h3 className="me-axis-detail-title">
              {t("Ce qu'on regarde concrètement, critère par critère.", "What we actually look at, criterion by criterion.")}
            </h3>
            <ol className="ab-rules">
              <li>
                <strong>{t("Valeur ajoutée.", "Added value.")}</strong>{" "}
                {t(
                  "Le temps ou l'argent réellement économisé par rapport à un usage sans l'outil, rapporté à son coût, pas le gain en absolu. Un gain de deux heures par mois sur un outil à 80 €/mois n'obtient pas la même note qu'un gain équivalent sur un outil à 10 €/mois. Preuve recherchée : temps annoncé ou mesuré, témoignages chiffrés, comparaison avant/après documentée.",
                  "The time or money actually saved compared to not using the tool, relative to its cost, not the gain in absolute terms. Saving two hours a month on an €80/month tool doesn't earn the same score as the same saving on a €10/month tool. Evidence sought: stated or measured time savings, quantified testimonials, a documented before/after comparison.",
                )}
              </li>
              <li>
                <strong>{t("Simplicité.", "Simplicity.")}</strong>{" "}
                {t(
                  "Uniquement la friction de démarrage (combien de temps et quelle compétence pour un premier résultat utile), pas la richesse fonctionnelle globale. Un outil no-code utilisable en cinq minutes note haut même s'il plafonne vite ; un outil qui exige un développeur dédié note bas même si le résultat final est excellent, parce que ce plafond-là est le rôle du critère puissance, pas de celui-ci.",
                  "Only the startup friction (how much time and skill for a first useful result), not the overall feature depth. A no-code tool usable in five minutes scores high even if it plateaus quickly; a tool that requires a dedicated developer scores low even if the end result is excellent, because that ceiling is the performance criterion's job, not this one's.",
                )}
              </li>
              <li>
                <strong>{t("Utilisation.", "Fit for purpose.")}</strong>{" "}
                {t(
                  "Est-ce que l'outil tient la promesse affichée sur sa page produit, dans des conditions d'usage réelles, sans qu'il faille bricoler un contournement ou ajouter un autre outil pour compléter. On compare ce qui est vendu à ce qui est documenté comme limite : cons, avis vérifiés, changelog, écarts constatés entre deux plans.",
                  "Whether the tool delivers on the promise stated on its product page, under real usage conditions, without needing a workaround or another tool to fill the gap. We compare what's sold against what's documented as a limit: cons, verified reviews, changelog entries, gaps observed between plans.",
                )}
              </li>
              <li>
                <strong>{t("Puissance.", "Performance.")}</strong>{" "}
                {t(
                  "Une fois que l'outil fait ce qu'il promet, jusqu'où peut-il aller : profondeur technique, plafond de capacité, position face aux meilleurs de sa catégorie. Quand un comparatif concurrent existe, on s'en sert ; sans preuve comparative, la note reste prudente (moyenne du marché), jamais optimiste par défaut.",
                  "Once the tool does what it promises, how far it can go: technical depth, capability ceiling, standing against the best in its category. When a competitor comparison exists, we use it; without comparative evidence, the score stays conservative (market average), never optimistic by default.",
                )}
              </li>
              <li>
                <strong>{t("Réversibilité.", "Reversibility.")}</strong>{" "}
                {t(
                  "Si l'outil ne convient plus, peut-on repartir avec ses données sans y laisser du travail ? On cherche une fonctionnalité produit d'export en libre-service (pas seulement un droit RGPD générique accessible sur demande), une API, et un format réutilisable ailleurs.",
                  "If the tool stops working for you, can you leave with your data intact, without losing the work put in? We look for a self-service export feature in the product (not just a generic RGPD right available on request), an API, and a format usable elsewhere.",
                )}
              </li>
            </ol>

            <div className="ab-prose">
              <p>
                {t(
                  "Les cinq notes sont ensuite moyennées. Tant qu'un critère n'a pas de preuve suffisante, il reste vide et la fiche affiche à la place une note provisoire basée sur des signaux plus généraux (type d'outil, présence d'IA native, etc.), jamais une moyenne inventée sur des critères manquants.",
                  "The five scores are then averaged. Until a criterion has enough evidence, it stays unrated and the page shows a provisional score based on broader signals instead (tool type, native AI features...), never an average computed over missing criteria.",
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
          <section className="ab-section" id="cars">
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

          </article>
        </div>
      </article>
    </div>
  );
};

export default MethodologyPage;
