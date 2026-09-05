/**
 * Politique des liens sortants — POINT DE DÉCISION UNIQUE.
 *
 * Toute la stratégie tient dans la table POLITIQUE ci-dessous. Pour changer
 * d'avis, on modifie UNE ligne ici : aucun composant n'écrit `rel` à la main.
 * Avant ce module la valeur était dupliquée dans huit fichiers, tous en
 * dofollow — dont les liens affiliés, ce qui contrevient aux consignes Google.
 *
 * `noopener noreferrer` est ajouté systématiquement : c'est une protection
 * contre le détournement d'onglet, sans effet SEO. L'un ne remplace pas
 * l'autre.
 */

/** Nature du lien, et non l'endroit d'où il part. */
export type NatureLien =
  /** Lien affilié ou rémunéré. `sponsored` est EXIGÉ par Google sur tout lien
   *  payé — ne pas rebasculer en dofollow, ce n'est pas un arbitrage SEO mais
   *  une question de conformité. */
  | "affilie"
  /** Site officiel du produit, page tarifaire, source citée. C'est ici que se
   *  joue l'arbitrage : citer sa source en dofollow appuie la crédibilité
   *  éditoriale, mais transmet de l'autorité à ~1000 domaines. */
  | "source"
  /** Lien inséré dans le corps d'un article ou d'un guide. */
  | "article"
  /** Tout le reste : partage social, outils tiers, liens de service. */
  | "autre";

const POLITIQUE: Record<NatureLien, "dofollow" | "nofollow" | "sponsored"> = {
  affilie: "sponsored",
  source: "nofollow",
  article: "nofollow",
  autre: "nofollow",
};

const BASE = "noopener noreferrer";
const DOMAINES_EDITORIAUX_DOFOLLOW = new Set([
  "franklymail.com",
  "www.franklymail.com",
  "loyzia.com",
  "www.loyzia.com",
  "snappack.io",
  "www.snappack.io",
  "happia.fr",
  "www.happia.fr",
  "klark.app",
  "www.klark.app",
  "stellaflow.com",
  "www.stellaflow.com",
  "vulko.fr",
  "www.vulko.fr",
  "charik.app",
  "www.charik.app",
  "getorlo.app",
  "www.getorlo.app",
  "glyphe.eu",
  "www.glyphe.eu",
]);

function estLienEditorialDofollow(url: string): boolean {
  try {
    return DOMAINES_EDITORIAUX_DOFOLLOW.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function relExterne(nature: NatureLien = "autre"): string {
  const regle = POLITIQUE[nature];
  return regle === "dofollow" ? BASE : `${regle} ${BASE}`;
}

/**
 * Détection d'un lien rémunéré à la FORME de l'URL, indépendamment du champ
 * qui la porte.
 *
 * Deux motifs, parce qu'un seul ne suffit pas :
 *  - le paramètre de requête (`?via=`, `?ref=`, `?fpr=`…), le cas courant ;
 *  - le domaine de plateforme d'affiliation, où le tracking est dans le
 *    sous-domaine ou le chemin. C'est ainsi que le lien PartnerStack de Lusha
 *    (`partnerstack.lusha.com/sghwggbyjyc2-omvn4r`) échappait à une recherche
 *    par paramètre.
 *
 * Sert de filet : si une URL de ce type se retrouve dans `website_url` au lieu
 * de `affiliate_link`, elle sera quand même marquée `sponsored`. Un lien payé
 * non déclaré est une infraction aux consignes Google, quel que soit le champ
 * de la base où il a atterri.
 */
const PARAM_TRACKING = /[?&](via|ref|referral|aff|affiliate|fpr|partner|sponsor|rfsn|tap_a|tap_s|lmref|irclickid|deal|promo)=/i;
const PLATEFORMES_AFFILIATION = /(^|\.)(partnerstack|impact|shareasale|cj|awin|refersion|tapfiliate|firstpromoter|affilae|lemonsqueezy|gumroad)\.(com|net|io)|partnerstack\.[a-z0-9-]+\.com/i;

export function estLienRemunere(url: string | null | undefined): boolean {
  const u = (url || "").trim();
  if (!u) return false;
  return PARAM_TRACKING.test(u) || PLATEFORMES_AFFILIATION.test(u);
}

/**
 * Cas des fiches outil : le CTA émet `affiliate_link` quand il existe, sinon
 * l'URL officielle. Le lien est rémunéré si l'URL émise est le lien affilié
 * déclaré, OU si sa forme trahit un tracking quel que soit le champ d'origine.
 */
export function relPourLienOutil(
  hrefEmis: string | null | undefined,
  affiliateLink: string | null | undefined,
  websiteUrl: string | null | undefined,
): string {
  const href = (hrefEmis || "").trim();
  const affilie = (affiliateLink || "").trim();
  const officiel = (websiteUrl || "").trim();
  const declareAffilie = !!href && !!affilie && href === affilie && affilie !== officiel;
  const remunere = declareAffilie || estLienRemunere(href);
  if (!remunere && estLienEditorialDofollow(href)) return BASE;
  return relExterne(remunere ? "affilie" : "source");
}

/** Valeur brute pour les cas non-React (conversion markdown côté serveur). */
export const REL_ARTICLE = relExterne("article");
