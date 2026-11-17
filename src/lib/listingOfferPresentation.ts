import type { ListingOffer } from "./publisherCatalogApi";

type Translate = (fr: string, en: string) => string;

export function listingOfferLabel(offer: ListingOffer, t: Translate) {
  return offer === "standard_badge"
    ? t("Revue standard · Gratuite avec badge", "Standard review · Free with a badge")
    : t("Fiche prioritaire · 29 $ US une fois, sans badge", "Priority listing · US$29 once, no badge");
}

export function listingCommercialLabel(offer: ListingOffer, status: string, t: Translate) {
  if (offer === "standard_badge") {
    if (status === "satisfied") return t("Badge vérifié", "Badge verified");
    if (status === "verifying") return t("Vérification du badge en cours", "Badge verification in progress");
    if (status === "issue") return t("Badge à vérifier avec ToolTrim", "Badge needs attention");
    return t("Badge à installer et à vérifier", "Badge required");
  }
  if (status === "satisfied") return t("Paiement confirmé", "Payment confirmed");
  if (status === "verifying") return t("Vérification du paiement en cours", "Payment verification in progress");
  if (status === "issue") return t("Paiement à vérifier avec ToolTrim", "Payment needs attention");
  return t("Paiement requis", "Payment required");
}
