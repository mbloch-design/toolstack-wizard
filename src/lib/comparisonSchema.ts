import { affiliateComparisonGuides } from "../data/affiliateComparisonGuides";
import { activeCampaignKlaviyoGuides, chatgptClaudeGuides } from "../data/comparisonDecisionGuides";
import { pilotComparisonGuides } from "../data/comparisonDecisionGuidesPilot";
import { BATTLE_COMPARISON_DATA } from "../data/comparisonBattles";

/**
 * JSON-LD des comparatifs, construit une seule fois pour le prérendu
 * (`vite.config.ts`) et pour le client (`ComparePage`).
 *
 * Pourquoi un module partagé : les deux sorties avaient divergé. Le client
 * annonçait un `Article` avec `about`, le prérendu n'émettait qu'un
 * `BreadcrumbList` — donc Googlebot, qui lit le HTML prérendu, ne voyait ni
 * `Article`, ni auteur, ni `about` sur les pages comparatives, alors que c'est
 * la famille la plus transactionnelle du site. Deux constructions séparées
 * reproduisent ce défaut à la première modification : ici il n'y a plus qu'un
 * seul objet à faire évoluer.
 *
 * L'auteur est une `Person` nommée : un `Organization` en auteur ne dit rien
 * au titre d'E-E-A-T, alors que le fondateur est identifié publiquement.
 */

type Lang = "fr" | "en";

/** Champs de la fiche utiles au balisage. Les dates sont lues à l'exécution. */
export type ComparisonToolRef = {
  name: string;
  websiteUrl?: string | null;
};

export type ComparisonJsonLdInput = {
  base: string;
  lang: string;
  slugPair: string;
  title: string;
  description: string;
  toolA: ComparisonToolRef;
  toolB: ComparisonToolRef;
};

const AUTHOR_NAME = "Michael Bloch";
const AUTHOR_JOB_TITLE: Record<Lang, string> = {
  fr: "Directeur créatif",
  en: "Creative director",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** La première date ISO valide de la liste, tronquée au jour (ordre de confiance). */
function firstDate(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && ISO_DATE.test(candidate)) return candidate.slice(0, 10);
  }
  return undefined;
}

/** La plus récente des dates ISO valides, tronquée au jour. */
function latestDate(...candidates: unknown[]): string | undefined {
  const dates = candidates
    .filter((candidate): candidate is string => typeof candidate === "string" && ISO_DATE.test(candidate))
    .map((candidate) => candidate.slice(0, 10))
    .sort();
  return dates[dates.length - 1];
}

/**
 * Date de dernière modification de la donnée d'une fiche — même règle que le
 * `lastmod` du sitemap, pour qu'une page et son entrée de sitemap racontent la
 * même chose.
 */
function toolDataDate(tool: unknown): string | undefined {
  const value = (tool ?? {}) as {
    pricing_v5?: { verified_on?: string | null } | null;
    toolTrimRating?: { lastActivityVerifiedOn?: string | null } | null;
    research?: { researchedOn?: string | null } | null;
  };
  return latestDate(
    value.pricing_v5?.verified_on,
    value.toolTrimRating?.lastActivityVerifiedOn,
    value.research?.researchedOn,
  );
}

/**
 * Dates de publication et de modification d'un comparatif.
 *
 * Ordre de confiance : date de vérification du guide éditorial (celle affichée
 * sur la page), puis date du duel (`checkedAt` / `lastUpdatedAt`), puis date de
 * la donnée des deux fiches. Le millésime seul n'arrive qu'en dernier recours :
 * une date inventée serait pire qu'une date imprécise.
 */
export function comparisonDates(
  slugPair: string,
  lang: string,
  toolA: ComparisonToolRef,
  toolB: ComparisonToolRef,
): { datePublished: string; dateModified: string } {
  const language: Lang = lang === "en" ? "en" : "fr";
  const guide =
    affiliateComparisonGuides[slugPair]?.[language] ??
    pilotComparisonGuides[slugPair]?.[language] ??
    (slugPair === "chatgpt-vs-claude"
      ? chatgptClaudeGuides[language]
      : slugPair === "activecampaign-vs-klaviyo"
        ? activeCampaignKlaviyoGuides[language]
        : undefined);
  const battle = (
    BATTLE_COMPARISON_DATA as unknown as Record<
      string,
      { checkedAt?: string; lastUpdatedAt?: string } | undefined
    >
  )[slugPair];
  const fallback = latestDate(toolDataDate(toolA), toolDataDate(toolB)) ?? String(new Date().getFullYear());
  // Priorité, pas maximum : la date du guide est celle qui s'affiche sur la
  // page, elle doit donc être celle du balisage. Prendre la plus récente des
  // sources laissait une date de donnée plus fraîche écraser la relecture
  // éditoriale — le balisage disait alors autre chose que ce que lit le visiteur.
  return {
    datePublished: firstDate(guide?.checkedAt, battle?.checkedAt, fallback) ?? fallback,
    dateModified: firstDate(guide?.checkedAt, battle?.lastUpdatedAt, battle?.checkedAt, fallback) ?? fallback,
  };
}

/** Objet JSON-LD complet (`Article` + `BreadcrumbList`) d'un comparatif. */
export function comparisonJsonLd(input: ComparisonJsonLdInput): Record<string, unknown> {
  const { base, lang, slugPair, title, description, toolA, toolB } = input;
  const language: Lang = lang === "en" ? "en" : "fr";
  const url = `${base}/${lang}/comparatif/${slugPair}`;
  const { datePublished, dateModified } = comparisonDates(slugPair, lang, toolA, toolB);

  const article = {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: title,
    description,
    // `image` est une propriété requise par les consignes Article de Google.
    image: `${base}/og-image-v2.png`,
    url,
    datePublished,
    dateModified,
    inLanguage: lang,
    author: {
      "@type": "Person",
      name: AUTHOR_NAME,
      jobTitle: AUTHOR_JOB_TITLE[language],
      url: `${base}/${lang}/about`,
    },
    publisher: { "@type": "Organization", name: "ToolTrim", url: base },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    about: [toolA, toolB].map((tool) => ({
      "@type": "SoftwareApplication",
      name: tool.name,
      ...(tool.websiteUrl ? { url: tool.websiteUrl } : {}),
    })),
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ToolTrim", item: `${base}/${lang}` },
      {
        "@type": "ListItem",
        position: 2,
        name: language === "fr" ? "Comparatifs" : "Comparisons",
        item: `${base}/${lang}/comparatifs`,
      },
      { "@type": "ListItem", position: 3, name: `${toolA.name} vs ${toolB.name}`, item: url },
    ],
  };

  return { "@context": "https://schema.org", "@graph": [article, breadcrumb] };
}

/** Sérialisation sûre pour un `<script type="application/ld+json">`. */
export function comparisonJsonLdScript(input: ComparisonJsonLdInput): string {
  return JSON.stringify(comparisonJsonLd(input)).replace(/</g, "\\u003c");
}
