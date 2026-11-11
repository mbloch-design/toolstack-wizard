import { useEffect } from "react";
import type { Tool } from "@/data/types";
import { setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getToolTutorials } from "@/data/toolTutorials";
import { toolFaqPageSchema, toolSoftwareApplicationSchema, toolWebPageSchema } from "@/lib/toolSchema";

interface Props {
  tool: Tool;
  category: unknown;
  displayPrice: number;
  /** null quand aucune verification tarifaire n'a eu lieu. */
  verifiedOn: string | null;
  alternatives: Tool[];
  lang: string;
  includeFaq?: boolean;
  canonicalUrl?: string;
}

/**
 * Balisage de la fiche outil : `WebPage`, `SoftwareApplication` + `Review`,
 * `FAQPage` et `VideoObject`.
 *
 * Les trois premiers viennent de `src/lib/toolSchema.ts`, appelé aussi par le
 * prérendu (`vite.config.ts`) : `setJsonLd` écrit dans le bloc prérendu par id,
 * donc deux constructeurs différents se remplaçaient l'un l'autre à
 * l'hydratation (FAQ de 4 questions au prérendu contre 5-6 visibles, puis
 * `Review.name` et `offers.url` effacés côté client). Un seul constructeur.
 *
 * `BreadcrumbList` n'est volontairement pas émis ici : le prérendu en pose un
 * pour chaque page, et l'ancien doublon se disputait la même URL.
 */
export default function ToolJsonLd({
  tool,
  displayPrice,
  verifiedOn,
  alternatives,
  lang,
  includeFaq = false,
  canonicalUrl: pageCanonicalUrl,
}: Props) {
  useEffect(() => {
    const canonicalUrl = pageCanonicalUrl || `${SEO_BASE}/${lang}/tool/${tool.slug || tool.id}`;

    setJsonLd("tool-webpage-jsonld", toolWebPageSchema({ tool, lang, url: canonicalUrl, verifiedOn }));
    // L'URL produit est résolue par le module partagé : le client ne peut plus
    // déclarer une autre URL que le prérendu sur la même fiche.
    setJsonLd("tool-software-jsonld", toolSoftwareApplicationSchema({ tool, lang, canonicalUrl }));

    // VideoObject : uniquement quand la vidéo curatée est visible sur la page
    // d'ensemble. L'interface et le balisage partagent les mêmes métadonnées.
    const tutorials = getToolTutorials(tool.slug || tool.id);
    const isOverview = canonicalUrl === `${SEO_BASE}/${lang}/tool/${tool.slug || tool.id}`;
    if (isOverview && tutorials.length > 0) {
      const videos = tutorials.map((tutorial) => ({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: lang === "en" ? tutorial.titleEn : tutorial.titleFr,
        description: lang === "en"
          ? `Official ${tool.name} tutorial published by ${tutorial.author}.`
          : `Tutoriel officiel ${tool.name} publié par ${tutorial.author}.`,
        thumbnailUrl: tutorial.posterUrl || `https://i.ytimg.com/vi/${tutorial.videoId}/hqdefault.jpg`,
        embedUrl: tutorial.provider === "wistia"
          ? `https://fast.wistia.net/embed/iframe/${tutorial.videoId}`
          : tutorial.provider === "native" ? undefined : `https://www.youtube-nocookie.com/embed/${tutorial.videoId}`,
        contentUrl: tutorial.provider === "native" ? tutorial.videoUrl : undefined,
        uploadDate: tutorial.publishedOn,
      }));
      setJsonLd("tool-video-jsonld", videos.length === 1 ? videos[0] : {
        "@context": "https://schema.org",
        "@graph": videos,
      });
    }

    // FAQPage — mêmes questions que la FAQ affichée, via buildToolFaqs.
    if (includeFaq) {
      setJsonLd("tool-faq-jsonld", toolFaqPageSchema({ tool, lang, displayPrice, verifiedOn, alternatives }));
    }

    return () => cleanupSeo(["tool-webpage-jsonld", "tool-software-jsonld", "tool-video-jsonld", "tool-faq-jsonld"]);
  }, [tool, displayPrice, verifiedOn, alternatives, lang, includeFaq, pageCanonicalUrl]);

  return null;
}
