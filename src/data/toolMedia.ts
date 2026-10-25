export interface CuratedToolImage {
  src: string;
  altFr: string;
  altEn: string;
  sourceUrl: string;
}

/** Official product visuals used when the catalogue has no suitable gallery. */
const TOOL_MEDIA_IMAGES: Record<string, CuratedToolImage[]> = {
  uniqode: [
    {
      src: "https://cdn.prod.website-files.com/6669ecc72092c5122374cf32/6a8c4403b958209bc9d0d300_physical-to-digital-1.webp",
      altFr: "Visuel officiel Uniqode : création d’un QR code personnalisé sur tablette.",
      altEn: "Official Uniqode visual: creating a branded QR code on a tablet.",
      sourceUrl: "https://www.uniqode.com/",
    },
    {
      src: "https://cdn.prod.website-files.com/6669ecc72092c5122374cf32/6a8c440114aee70e970df39f_physical-to-digital-2.webp",
      altFr: "Visuel officiel Uniqode : affiche avec QR code et suivi des scans.",
      altEn: "Official Uniqode visual: a poster QR code with scan tracking.",
      sourceUrl: "https://www.uniqode.com/",
    },
    {
      src: "https://cdn.prod.website-files.com/6669ecc72092c5122374cf32/6a8c44000e6f46d3014b38eb_physical-to-digital-3.webp",
      altFr: "Visuel officiel Uniqode : tableau d’analyse du parcours après scan.",
      altEn: "Official Uniqode visual: analytics for the journey after a scan.",
      sourceUrl: "https://www.uniqode.com/",
    },
  ],
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
