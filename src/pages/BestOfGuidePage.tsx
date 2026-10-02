import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Breadcrumb from "@/components/Breadcrumb";
import FaqBlock from "@/components/FaqBlock";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, SEO_BASE } from "@/lib/seo";
import { quickPicks, rankTools, type BestOfTool, type Lang, type RankedTool } from "@/lib/bestOfRanking";
import { ArrowRight, Check, HelpCircle, Layers, ShieldCheck, Sparkles, X, Cpu, AlertTriangle } from "@/lib/icons";
import config from "@/data/bestOfGuides.json";
import data from "@/data/bestOfGuidesData.json";

/**
 * Pages « meilleurs outils pour une intention », sous /:lang/guide/<slug>.
 *
 * Contenu éditorial dans src/data/bestOfGuides.json, données des outils dans
 * src/data/bestOfGuidesData.json (généré par scripts/gen-best-of-guides-data.mjs
 * depuis le catalogue). Le classement et les choix rapides sont calculés par
 * src/lib/bestOfRanking.ts : rien n'est classé à la main, aucun partenaire
 * n'influence l'ordre.
 *
 * Les routes sont déclarées avant /:lang/guide/:slug dans App.tsx.
 */

type Localized = { en: string; fr: string };
interface GuideConfig {
  id: string;
  slug: Localized;
  title: Localized;
  description: Localized;
  h1: Localized;
  intro: Localized;
  audience: Localized;
  angle?: Localized;
  ai?: { title: Localized; intro: Localized; notes: Record<string, Localized>; none: Localized };
  tools: string[];
}

export const BEST_OF_GUIDES = (config as { guides: GuideConfig[] }).guides;
const TOOLS = data as Record<string, BestOfTool>;

interface Props {
  guideId: string;
  lang: Lang;
}

const priceLabel = (row: RankedTool, lang: Lang) => {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  switch (row.priceKind) {
    case "free": return t("Gratuit", "Free");
    case "quote": return t("Prix non public", "Price not public");
    case "usage": return row.priceText ? t(`Dès ${row.priceText}, à l'usage`, `From ${row.priceText}, usage-based`) : t("À l'usage", "Usage-based");
    case "one_time": return t(`${row.priceText}, licence à vie`, `${row.priceText} one-time`);
    default: return t(`Dès ${row.priceText}/mois`, `From ${row.priceText}/mo`);
  }
};

const fmtScore = (score: number | null, lang: Lang) =>
  score == null ? "–" : `${lang === "fr" ? String(score).replace(".", ",") : score}/5`;

const joinNames = (names: string[], lang: Lang) =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} ${lang === "fr" ? "et" : "and"} ${names[names.length - 1]}`;

export default function BestOfGuidePage({ guideId, lang }: Props) {
  const guide = BEST_OF_GUIDES.find((g) => g.id === guideId)!;
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const L = (v: Localized) => v[lang];

  const rows = useMemo(() => rankTools(guide.tools.map((slug) => TOOLS[slug]).filter(Boolean), lang), [guide, lang]);
  const picks = useMemo(() => quickPicks(rows), [rows]);
  const latestCheck = useMemo(
    () => rows.map((r) => (lang === "en" ? r.tool.pricing_v5En : r.tool.pricing_v5)?.verified_on).filter(Boolean).sort().pop() as string | undefined,
    [rows, lang],
  );

  const canonicalHref = `${SEO_BASE}/${lang}/guide/${guide.slug[lang]}`;
  const frHref = `${SEO_BASE}/fr/guide/${guide.slug.fr}`;
  const enHref = `${SEO_BASE}/en/guide/${guide.slug.en}`;

  useEffect(() => {
    setSeoTags({ title: L(guide.title), description: L(guide.description), url: canonicalHref, type: "article", locale: lang === "fr" ? "fr_FR" : "en_US" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideId, lang]);

  const toolHref = (slug: string, sub?: "pricing" | "alternatives") =>
    `/${lang}/tool/${slug}${sub === "pricing" ? (lang === "fr" ? "/prix" : "/pricing") : sub === "alternatives" ? "/alternatives" : ""}`;

  // FAQ tirée des mêmes données que le classement, pour ne jamais contredire la page.
  const faqs = [
    picks.overall && {
      question: t(`Quel est le meilleur outil ${L(guide.audience)} ?`, `What is the best option ${L(guide.audience)}?`),
      answer: t(
        `${picks.overall.tool.name} arrive en tête de ce classement avec une note ToolTrim de ${fmtScore(picks.overall.score, lang)}. Le bon choix dépend toutefois de ton usage : chaque fiche détaille quand le garder et quand l'éviter.`,
        `${picks.overall.tool.name} tops this ranking with a ToolTrim score of ${fmtScore(picks.overall.score, lang)}. The right pick still depends on how you work: each entry states when to keep it and when to avoid it.`,
      ),
    },
    picks.free && {
      question: t("Existe-t-il une option gratuite ?", "Is there a free option?"),
      answer: t(
        `Oui. ${joinNames(rows.filter((r) => r.hasFreePlan).map((r) => r.tool.name), lang)} ${rows.filter((r) => r.hasFreePlan).length > 1 ? "proposent" : "propose"} un plan gratuit permanent. Le mieux noté d'entre eux ici est ${picks.free.tool.name}.`,
        `Yes. ${joinNames(rows.filter((r) => r.hasFreePlan).map((r) => r.tool.name), lang)} ${rows.filter((r) => r.hasFreePlan).length > 1 ? "offer" : "offers"} a permanent free plan. The best rated of them here is ${picks.free.tool.name}.`,
      ),
    },
    picks.budget && {
      question: t("Quelle est l'option payante la moins chère ?", "What is the cheapest paid option?"),
      answer: t(
        `${picks.budget.tool.name}, à partir de ${priceLabel(picks.budget, lang).replace(/^Dès /, "")}, d'après le prix publié par l'éditeur.`,
        `${picks.budget.tool.name}, ${priceLabel(picks.budget, lang).replace(/^From /, "from ")}, based on the price the vendor publishes.`,
      ),
    },
    {
      question: t("Comment ce classement est-il établi ?", "How is this ranking built?"),
      answer: t(
        "Chaque outil est noté sur cinq axes (valeur ajoutée, simplicité, utilisation, puissance, réversibilité), chaque note s'appuyant sur une source citée dans sa fiche. Les prix sont relevés sur la page officielle de l'éditeur, dans sa devise. Aucun éditeur ne paie pour sa place.",
        "Each tool is scored on five axes (added value, simplicity, day-to-day use, power, reversibility), each score backed by a source cited on its page. Prices are read on the vendor's official page, in its currency. No vendor pays for its position.",
      ),
    },
  ].filter(Boolean) as { question: string; answer: string }[];

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: L(guide.h1),
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: rows.length,
    itemListElement: rows.map((r) => ({ "@type": "ListItem", position: r.rank, name: r.tool.name, url: `${SEO_BASE}${toolHref(r.tool.slug)}` })),
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: L(guide.h1),
    description: L(guide.description),
    inLanguage: lang === "fr" ? "fr-FR" : "en-US",
    url: canonicalHref,
    ...(latestCheck ? { dateModified: latestCheck } : {}),
    author: { "@type": "Organization", name: "ToolTrim" },
    publisher: { "@type": "Organization", name: "ToolTrim" },
  };

  // Un même outil peut gagner deux titres (Blender : meilleur global et
  // gratuit) : une seule carte, avec les deux étiquettes.
  const pickCards: { key: string; label: string; row: RankedTool | null }[] = [];
  for (const card of [
    { key: "overall", label: t("Meilleur choix global", "Best overall"), row: picks.overall },
    { key: "free", label: t("Meilleur choix gratuit", "Best free option"), row: picks.free },
    { key: "budget", label: t("Le moins cher pour démarrer", "Cheapest to start"), row: picks.budget },
  ]) {
    if (!card.row) continue;
    const same = pickCards.find((c) => c.row === card.row);
    if (same) same.label += t(" et ", " and ") + card.label.charAt(0).toLowerCase() + card.label.slice(1);
    else pickCards.push(card);
  }

  return (
    <>
      <Helmet>
        <link rel="canonical" href={canonicalHref} />
        <link rel="alternate" hrefLang="fr" href={frHref} />
        <link rel="alternate" hrefLang="en" href={enHref} />
        <link rel="alternate" hrefLang="x-default" href={enHref} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="gb-wrap gb-crumbs">
        <Breadcrumb items={[{ label: t("Guides", "Guides"), href: `/${lang}/guides` }, { label: L(guide.h1) }]} />
      </div>

      <header className="gb-wrap gb-hero">
        <p className="gb-eyebrow">
          {t("Comparatif", "Comparison")} · {rows.length} {t("outils", "tools")}
          {latestCheck ? ` · ${t("prix vérifiés le", "prices checked on")} ${new Date(latestCheck).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" })}` : ""}
        </p>
        <h1 className="gb-title">{L(guide.h1)}</h1>
        <p className="gb-intro">{L(guide.intro)}</p>
      </header>

      <section className="gb-wrap gb-section" aria-labelledby="gb-picks">
        <h2 id="gb-picks" className="gb-h2">{t("Nos choix en bref", "Our picks at a glance")}</h2>
        <div className="gb-picks">
          {pickCards.filter((c) => c.row).map(({ key, label, row }) => (
            <a key={key} href={`#${row!.tool.slug}`} className="gb-pick">
              <span className="gb-pick-label">{label}</span>
              <span className="gb-pick-tool">
                <ToolLogo tool={row!.tool as any} size={32} className="gb-logo" />
                <span className="gb-pick-name">{row!.tool.name}</span>
              </span>
              <span className="gb-pick-meta">
                {key === "free" && row!.priceKind !== "free" ? t("Plan gratuit, puis ", "Free plan, then ") + priceLabel(row!, lang).replace(/^(Dès|From) /, (m) => m.toLowerCase()) : priceLabel(row!, lang)}
                {row!.score != null ? ` · ${fmtScore(row!.score, lang)}` : ""}
              </span>
            </a>
          ))}
        </div>
      </section>

      {guide.angle && (
        <section className="gb-wrap gb-section">
          <div className="gb-angle">
            <p className="gb-angle-label"><AlertTriangle className="gb-icon" aria-hidden="true" />{t("L'avis ToolTrim", "The ToolTrim take")}</p>
            <p className="gb-angle-text">{L(guide.angle)}</p>
          </div>
        </section>
      )}

      <section className="gb-wrap gb-section" aria-labelledby="gb-table">
        <h2 id="gb-table" className="gb-h2">{t("Le comparatif", "The comparison")}</h2>
        <div className="gb-table-scroll">
          <table className="gb-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">{t("Outil", "Tool")}</th>
                <th scope="col">{t("Prix d'entrée", "Entry price")}</th>
                <th scope="col">{t("Plan gratuit", "Free plan")}</th>
                <th scope="col">{t("Note ToolTrim", "ToolTrim score")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.tool.slug}>
                  <td className="gb-rank">{r.rank}</td>
                  <td>
                    <a href={`#${r.tool.slug}`} className="gb-table-tool">
                      <span className="gb-table-name">{r.tool.name}</span>
                      {r.tool.tagline?.[lang] && <span className="gb-table-tagline">{r.tool.tagline[lang]}</span>}
                    </a>
                  </td>
                  <td>{priceLabel(r, lang)}</td>
                  <td>
                    {r.hasFreePlan
                      ? <Check className="gb-icon gb-yes" aria-label={t("Oui", "Yes")} />
                      : r.freeNonCommercialOnly
                        ? <span className="gb-table-tagline">{t("Non commercial seulement", "Non-commercial only")}</span>
                        : <X className="gb-icon gb-no" aria-label={t("Non", "No")} />}
                  </td>
                  <td>{fmtScore(r.score, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="gb-note">
          {t(
            "Prix du plan de comparaison, tel que publié par l'éditeur, dans sa devise. Un prix annuel est ramené au mois.",
            "Price of the comparison plan, as published by the vendor, in its currency. Annual prices are shown per month.",
          )}
        </p>
      </section>

      {guide.ai && (
        <section className="gb-wrap gb-section" aria-labelledby="gb-ai">
          <h2 id="gb-ai" className="gb-h2"><Cpu className="gb-icon" aria-hidden="true" />{L(guide.ai.title)}</h2>
          <p className="gb-text">{L(guide.ai.intro)}</p>
          <ul className="gb-ai-list">
            {rows.map((r) => (
              <li key={r.tool.slug} className="gb-ai-item">
                <span className="gb-ai-name">{r.tool.name}</span>
                <span className="gb-ai-text">{guide.ai!.notes[r.tool.slug] ? L(guide.ai!.notes[r.tool.slug]) : L(guide.ai!.none)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="gb-wrap gb-section" aria-labelledby="gb-reviews">
        <h2 id="gb-reviews" className="gb-h2">{t("Le détail, outil par outil", "Tool by tool")}</h2>
        {rows.map((r) => {
          const v = lang === "en" ? r.tool.verdictEn : r.tool.verdict;
          const pros = (lang === "en" ? r.tool.prosEn : r.tool.pros) || [];
          const cons = (lang === "en" ? r.tool.consEn : r.tool.cons) || [];
          const desc = lang === "en" ? r.tool.shortDescriptionEn || r.tool.shortDescription : r.tool.shortDescription;
          const free = lang === "en" ? r.tool.pricingEn?.free : r.tool.pricing?.free;
          const trap = v?.billingTraps?.[0]?.text;
          return (
            <article key={r.tool.slug} id={r.tool.slug} className="gb-review">
              <div className="gb-review-head">
                <ToolLogo tool={r.tool as any} size={40} className="gb-logo" />
                <div>
                  <h3 className="gb-h3">{r.rank}. {r.tool.name}</h3>
                  {r.tool.tagline?.[lang] && <p className="gb-review-tagline">{r.tool.tagline[lang]}</p>}
                </div>
              </div>
              <p className="gb-facts">
                <span>{priceLabel(r, lang)}</span>
                {r.score != null && <span>{t("Note", "Score")} {fmtScore(r.score, lang)} · {r.scoreLabel}</span>}
              </p>
              {desc && <p className="gb-text">{desc}</p>}
              {free && (r.hasFreePlan || r.freeNonCommercialOnly) && <p className="gb-text gb-muted">{free}</p>}
              {(pros.length > 0 || cons.length > 0) && (
                <div className="gb-proscons">
                  {pros.length > 0 && (
                    <ul className="gb-list">
                      {pros.map((p) => <li key={p}><Check className="gb-icon gb-yes" aria-hidden="true" />{p}</li>)}
                    </ul>
                  )}
                  {cons.length > 0 && (
                    <ul className="gb-list">
                      {cons.map((c) => <li key={c}><X className="gb-icon gb-no" aria-hidden="true" />{c}</li>)}
                    </ul>
                  )}
                </div>
              )}
              {v && (v.keepIf?.[0] || v.avoidIf?.[0]) && (
                <dl className="gb-verdict">
                  {v.keepIf?.[0] && (<><dt>{t("Garde-le si", "Keep it if")}</dt><dd>{v.keepIf[0]}</dd></>)}
                  {v.avoidIf?.[0] && (<><dt>{t("Évite-le si", "Avoid it if")}</dt><dd>{v.avoidIf[0]}</dd></>)}
                  {trap && (<><dt>{t("Avant de payer", "Before you pay")}</dt><dd>{trap}</dd></>)}
                </dl>
              )}
              <p className="gb-links">
                <Link to={toolHref(r.tool.slug)}>{t("Fiche complète", "Full review")}</Link>
                <Link to={toolHref(r.tool.slug, "pricing")}>{t("Tous les prix", "All prices")}</Link>
                <Link to={toolHref(r.tool.slug, "alternatives")}>{t("Alternatives", "Alternatives")}</Link>
              </p>
            </article>
          );
        })}
      </section>

      <section className="gb-wrap gb-section" aria-labelledby="gb-method">
        <h2 id="gb-method" className="gb-h2"><ShieldCheck className="gb-icon" aria-hidden="true" />{t("Notre méthode", "How we rank")}</h2>
        <p className="gb-text">
          {t(
            "Le classement suit la note ToolTrim sur cinq axes, chacune appuyée par une source citée dans la fiche de l'outil. À note égale, l'outil le plus recherché passe devant. Les prix viennent de la page officielle de chaque éditeur, sans conversion. Les liens vers les éditeurs peuvent être affiliés ; ils ne changent ni la note ni la place.",
            "The ranking follows the ToolTrim five-axis score, each axis backed by a source cited on the tool's page. When two scores tie, the more searched tool goes first. Prices come from each vendor's official page, never converted. Links to vendors may be affiliate links; they change neither the score nor the position.",
          )}
        </p>
      </section>

      <section className="gb-wrap gb-section">
        <FaqBlock
          eyebrow={t("Questions fréquentes", "Frequently asked questions")}
          title={t("Questions fréquentes", "Frequently asked questions")}
          description={t("Les réponses reprennent les données du comparatif ci-dessus.", "Answers draw on the comparison data above.")}
          items={faqs.map((f, i) => ({ ...f, icon: [HelpCircle, Sparkles, Layers, ShieldCheck][i] || HelpCircle }))}
          openCount={2}
        />
      </section>

      <nav className="gb-wrap gb-section gb-more" aria-label={t("Autres comparatifs", "More comparisons")}>
        <h2 className="gb-h2">{t("Autres comparatifs", "More comparisons")}</h2>
        <ul className="gb-more-list">
          {BEST_OF_GUIDES.filter((g) => g.id !== guide.id).map((g) => (
            <li key={g.id}><Link to={`/${lang}/guide/${g.slug[lang]}`}>{g.h1[lang]}<ArrowRight className="gb-icon" aria-hidden="true" /></Link></li>
          ))}
        </ul>
      </nav>
    </>
  );
}
