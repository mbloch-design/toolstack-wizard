import { useEffect, useMemo } from "react";
import { Link } from "@/lib/routerLinks";
import { Helmet } from "react-helmet-async";
import Breadcrumb from "@/components/Breadcrumb";
import GuideCover from "@/components/guide/GuideCover";
import BestOfCard from "@/components/guide/BestOfCard";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, SEO_BASE } from "@/lib/seo";
import { quickPicks, rankTools, type BestOfTool, type Lang, type RankedTool } from "@/lib/bestOfRanking";
import { ArrowRight, Check, ChevronDown, ShieldCheck, X, Cpu, AlertTriangle, Minus } from "@/lib/icons";
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

  const checkedLabel = latestCheck
    ? new Date(latestCheck).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" })
    : null;
  // Same table of contents as an article: the page sections, then each ranked tool.
  const toc = [
    { id: "gb-picks", text: t("Nos choix", "Our picks") },
    { id: "gb-table", text: t("Le comparatif", "The comparison") },
    ...rows.map((r) => ({ id: r.tool.slug, text: `${r.rank}. ${r.tool.name}` })),
    { id: "gb-method", text: t("Notre méthode", "How we rank") },
    { id: "gb-faq", text: t("Questions fréquentes", "FAQ") },
  ];
  // Three other rankings, starting after this one, so every page links onward.
  const others = BEST_OF_GUIDES.filter((g) => g.id !== guide.id);
  const start = Math.max(0, BEST_OF_GUIDES.findIndex((g) => g.id === guide.id)) % Math.max(1, others.length);
  const more = [...others.slice(start), ...others.slice(0, start)].slice(0, 3);

  return (
    <div className="ga-page gb-page">
      <Helmet>
        <link rel="canonical" href={canonicalHref} />
        <link rel="alternate" hrefLang="fr" href={frHref} />
        <link rel="alternate" hrefLang="en" href={enHref} />
        <link rel="alternate" hrefLang="x-default" href={enHref} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Same header as an article: title and standfirst, the tools as cover. */}
      <header className="ga-header">
        <div className="ga-container">
          <div className="ga-hero-split">
            <div className="ga-hero-main">
              <Breadcrumb items={[{ label: t("Guides", "Guides"), href: `/${lang}/guides` }, { label: L(guide.h1) }]} />
              <div className="ga-eyebrow-row">
                <span className="ga-eyebrow-item">{t("Classement", "Ranking")}</span>
                <span className="ga-eyebrow-item">{rows.length} {t("outils comparés", "tools compared")}</span>
                {checkedLabel ? <span className="ga-eyebrow-item">{t(`Prix vérifiés le ${checkedLabel}`, `Prices checked ${checkedLabel}`)}</span> : null}
              </div>
              <h1 className="ga-title">{L(guide.h1)}</h1>
              <p className="ga-standfirst">{L(guide.intro)}</p>
            </div>
            <GuideCover
              tools={rows.slice(0, 4).map((r) => ({ slug: r.tool.slug, name: r.tool.name, logo: r.tool.logo || undefined, websiteUrl: r.tool.websiteUrl || undefined, hasPricing: true }))}
              fallbackImage=""
              className="ga-hero-image"
              eager
            />
          </div>
        </div>
      </header>

      <div className="ga-body-outer">
        <div className="ga-body-grid">
          <article className="gb-article">
            <section id="gb-picks" className="gb-section" aria-labelledby="gb-picks-title">
              <h2 id="gb-picks-title" className="gb-h2">{t("Nos choix en bref", "Our picks at a glance")}</h2>
              <div className="gb-picks">
                {pickCards.filter((c) => c.row).map(({ key, label, row }) => (
                  <a key={key} href={`#${row!.tool.slug}`} className="gb-pick">
                    <ToolLogo tool={row!.tool as any} size={44} alt="" />
                    <span className="gb-pick-label">{label}</span>
                    <span className="gb-pick-name">{row!.tool.name}</span>
                    <span className="gb-pick-meta">
                      {key === "free" && row!.priceKind !== "free" ? t("Plan gratuit, puis ", "Free plan, then ") + priceLabel(row!, lang).replace(/^(Dès|From) /, (m) => m.toLowerCase()) : priceLabel(row!, lang)}
                      {row!.score != null ? ` · ${fmtScore(row!.score, lang)}` : ""}
                    </span>
                  </a>
                ))}
              </div>
              {guide.angle && (
                <aside className="gb-take">
                  <p className="gb-take-label">{t("L'avis ToolTrim", "The ToolTrim take")}</p>
                  <p className="gb-take-text">{L(guide.angle)}</p>
                </aside>
              )}
            </section>

            <section id="gb-table" className="gb-section" aria-labelledby="gb-table-title">
              <h2 id="gb-table-title" className="gb-h2">{t("Le comparatif", "The comparison")}</h2>
              <div className="gb-table-scroll">
                <table className="gb-table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">{t("Outil", "Tool")}</th>
                      <th scope="col">{t("Prix d'entrée", "Entry price")}</th>
                      <th scope="col">{t("Plan gratuit", "Free plan")}</th>
                      <th scope="col">{t("Note", "Score")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.tool.slug}>
                        <td className="gb-rank">{r.rank}</td>
                        <td>
                          <a href={`#${r.tool.slug}`} className="gb-table-tool">
                            <ToolLogo tool={r.tool as any} size={28} alt="" />
                            <span>
                              <span className="gb-table-name">{r.tool.name}</span>
                              {r.tool.tagline?.[lang] && <span className="gb-table-tagline">{r.tool.tagline[lang]}</span>}
                            </span>
                          </a>
                        </td>
                        <td>{priceLabel(r, lang)}</td>
                        <td>
                          {r.hasFreePlan
                            ? <Check className="gb-icon gb-yes" aria-label={t("Oui", "Yes")} />
                            : r.freeNonCommercialOnly
                              ? <span className="gb-table-tagline">{t("Non commercial seulement", "Non-commercial only")}</span>
                              : <Minus className="gb-icon gb-no" aria-label={t("Non", "No")} />}
                        </td>
                        <td className="gb-score">{fmtScore(r.score, lang)}</td>
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
              <section className="gb-section" aria-labelledby="gb-ai">
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

            {/* Each tool in the language of its own page: header, judgments,
                « keep it if / avoid it if » cards, the billing trap, the ways in. */}
            <section className="gb-section" aria-labelledby="gb-reviews">
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
                    <header className="gb-review-head">
                      <span className="gb-review-rank" aria-hidden="true">{r.rank}</span>
                      <ToolLogo tool={r.tool as any} size={52} alt="" />
                      <div className="gb-review-id">
                        <h3 className="gb-h3"><span className="sr-only">{r.rank}. </span>{r.tool.name}</h3>
                        {r.tool.tagline?.[lang] && <p className="gb-review-tagline">{r.tool.tagline[lang]}</p>}
                      </div>
                      <p className="gb-facts">
                        <span>{priceLabel(r, lang)}</span>
                        {r.score != null && <span>{fmtScore(r.score, lang)} · {r.scoreLabel}</span>}
                      </p>
                    </header>
                    {desc && <p className="gb-text">{desc}</p>}
                    {free && (r.hasFreePlan || r.freeNonCommercialOnly) && <p className="gb-text gb-muted">{free}</p>}
                    {(pros.length > 0 || cons.length > 0) && (
                      <div className="gb-proscons">
                        {pros.length > 0 && (
                          <div>
                            <p className="gb-kicker">{t("Points forts", "Strengths")}</p>
                            <ul className="gb-list">
                              {pros.map((p) => <li key={p}><Check className="gb-icon gb-yes" aria-hidden="true" />{p}</li>)}
                            </ul>
                          </div>
                        )}
                        {cons.length > 0 && (
                          <div>
                            <p className="gb-kicker">{t("Limites", "Limits")}</p>
                            <ul className="gb-list">
                              {cons.map((c) => <li key={c}><Minus className="gb-icon gb-no" aria-hidden="true" />{c}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {v && (v.keepIf?.[0] || v.avoidIf?.[0]) && (
                      <div className="gb-fit">
                        {v.keepIf?.[0] && (
                          <div className="gb-fit-card">
                            <p className="gb-kicker"><Check className="gb-icon" aria-hidden="true" />{t("Garde-le si", "Keep it if")}</p>
                            <p>{v.keepIf[0]}</p>
                          </div>
                        )}
                        {v.avoidIf?.[0] && (
                          <div className="gb-fit-card">
                            <p className="gb-kicker"><X className="gb-icon" aria-hidden="true" />{t("Évite-le si", "Avoid it if")}</p>
                            <p>{v.avoidIf[0]}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {trap && (
                      <p className="gb-trap"><AlertTriangle className="gb-icon" aria-hidden="true" /><span><strong>{t("Avant de payer", "Before you pay")}</strong> {trap}</span></p>
                    )}
                    <p className="gb-links">
                      <Link to={toolHref(r.tool.slug)} className="gb-link-primary">{t(`Voir la fiche ${r.tool.name}`, `See the ${r.tool.name} review`)}<ArrowRight className="gb-icon" aria-hidden="true" /></Link>
                      <Link to={toolHref(r.tool.slug, "pricing")}>{t("Tous les prix", "All prices")}</Link>
                      <Link to={toolHref(r.tool.slug, "alternatives")}>{t("Alternatives", "Alternatives")}</Link>
                    </p>
                  </article>
                );
              })}
            </section>

            <section id="gb-method" className="gb-section gb-method" aria-labelledby="gb-method-title">
              <h2 id="gb-method-title" className="gb-h2"><ShieldCheck className="gb-icon" aria-hidden="true" />{t("Notre méthode", "How we rank")}</h2>
              <p className="gb-text">
                {t(
                  "Le classement suit la note ToolTrim sur cinq axes, chacune appuyée par une source citée dans la fiche de l'outil. À note égale, l'outil le plus recherché passe devant. Les prix viennent de la page officielle de chaque éditeur, sans conversion. Les liens vers les éditeurs peuvent être affiliés ; ils ne changent ni la note ni la place.",
                  "The ranking follows the ToolTrim five-axis score, each axis backed by a source cited on the tool's page. When two scores tie, the more searched tool goes first. Prices come from each vendor's official page, never converted. Links to vendors may be affiliate links; they change neither the score nor the position.",
                )}
              </p>
            </section>

            <section id="gb-faq" className="gb-section" aria-labelledby="gb-faq-title">
              <h2 id="gb-faq-title" className="gb-h2">{t("Questions fréquentes", "Frequently asked questions")}</h2>
              <div className="gb-faq">
                {faqs.map((f, i) => (
                  <details key={f.question} className="gb-faq-item" open={i < 2}>
                    <summary>
                      <h3>{f.question}</h3>
                      <ChevronDown className="gb-icon" aria-hidden="true" />
                    </summary>
                    <p>{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </article>

          <aside className="ga-toc-col">
            <p className="ga-toc-label">{t("Sur cette page", "On this page")}</p>
            <nav className="ga-toc-nav" aria-label={t("Sur cette page", "On this page")}>
              {toc.map((item) => <a key={item.id} href={`#${item.id}`} className="ga-toc-link">{item.text}</a>)}
            </nav>
          </aside>
        </div>
      </div>

      {/* The same cards as on the guides index: every ranking links onward. */}
      <nav className="gb-more" aria-labelledby="gb-more-title">
        <div className="gb-more-inner">
          <div className="gi-section-head">
            <h2 id="gb-more-title">{t("Autres classements", "More rankings")}</h2>
            <Link to={`/${lang}/guides`} className="gb-more-all">{t("Tous les classements", "All rankings")}<ArrowRight className="gb-icon" aria-hidden="true" /></Link>
          </div>
          <div className="gi-bestof-grid">
            {more.map((g) => <BestOfCard key={g.id} guideId={g.id} lang={lang} />)}
          </div>
        </div>
      </nav>
    </div>
  );
}
