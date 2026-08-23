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

export function relExterne(nature: NatureLien = "autre"): string {
  const regle = POLITIQUE[nature];
  return regle === "dofollow" ? BASE : `${regle} ${BASE}`;
}

/**
 * Cas des fiches outil : le CTA émet `affiliate_link` quand il existe, sinon
 * l'URL officielle. Le lien n'est rémunéré que dans le premier cas, donc
 * uniquement quand l'URL émise diffère de l'URL officielle.
 */
export function relPourLienOutil(
  hrefEmis: string | null | undefined,
  affiliateLink: string | null | undefined,
  websiteUrl: string | null | undefined,
): string {
  const href = (hrefEmis || "").trim();
  const affilie = (affiliateLink || "").trim();
  const officiel = (websiteUrl || "").trim();
  const estAffilie = !!href && !!affilie && href === affilie && affilie !== officiel;
  return relExterne(estAffilie ? "affilie" : "source");
}

/** Valeur brute pour les cas non-React (conversion markdown côté serveur). */
export const REL_ARTICLE = relExterne("article");
