export interface CuratedToolImage {
  src: string;
  altFr: string;
  altEn: string;
  sourceUrl: string;
}

/** Official product visuals used when the catalogue has no suitable gallery. */
const TOOL_MEDIA_IMAGES: Record<string, CuratedToolImage[]> = {
  newbi: [
    {
      src: "https://www.newbi.fr/sectionNewGov1.png",
      altFr: "Tableau de bord Newbi avec soldes bancaires, transactions et suivi de trésorerie.",
      altEn: "Newbi dashboard showing bank balances, transactions, and cash flow.",
      sourceUrl: "https://www.newbi.fr/",
    },
    {
      src: "https://www.newbi.fr/lp/factures/newbi-editeur-facture.png",
      altFr: "Éditeur de facture Newbi avec sélection du client et informations de facturation.",
      altEn: "Newbi invoice editor with client selection and invoice details.",
      sourceUrl: "https://www.newbi.fr/produits/factures",
    },
    {
      src: "https://www.newbi.fr/lp/factures/facture-preview.png",
      altFr: "Aperçu d’une facture créée dans Newbi, avec lignes, TVA et total TTC.",
      altEn: "Preview of an invoice created in Newbi, with line items, VAT, and total.",
      sourceUrl: "https://www.newbi.fr/produits/factures",
    },
  ],
};

export function getToolMediaImages(slug: string | undefined): CuratedToolImage[] {
  return slug ? TOOL_MEDIA_IMAGES[slug] ?? [] : [];
}
