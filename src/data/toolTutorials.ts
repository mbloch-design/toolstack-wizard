export interface ToolTutorial {
  provider: "youtube";
  videoId: string;
  titleFr: string;
  titleEn: string;
  author: string;
  duration: string;
  sourceUrl: string;
  publishedOn: string;
  verifiedOn: string;
}

/**
 * Curated official tutorials for priority tool pages.
 * Every entry must be checked against the provider's oEmbed endpoint.
 */
export const TOOL_TUTORIALS: Record<string, ToolTutorial[]> = {
  notion: [{
    provider: "youtube", videoId: "aA7si7AmPkY",
    titleFr: "Formation Notion : les bases", titleEn: "Notion training: the basics",
    author: "Notion", duration: "8:16",
    sourceUrl: "https://www.youtube.com/watch?v=aA7si7AmPkY",
    publishedOn: "2020-06-16", verifiedOn: "2026-07-28",
  }],
  figma: [{
    provider: "youtube", videoId: "dXQ7IHkTiMM",
    titleFr: "Débuter sur Figma : explorer ses idées", titleEn: "Figma for beginners: explore ideas",
    author: "Figma", duration: "15:50",
    sourceUrl: "https://www.youtube.com/watch?v=dXQ7IHkTiMM",
    publishedOn: "2020-12-01", verifiedOn: "2026-07-28",
  }],
  canva: [{
    provider: "youtube", videoId: "V9LtRF6EbyY",
    titleFr: "Canva pour débutants : découvrir l’interface", titleEn: "Canva for beginners: opening Canva",
    author: "Canva", duration: "3:58",
    sourceUrl: "https://www.youtube.com/watch?v=V9LtRF6EbyY",
    publishedOn: "2021-08-01", verifiedOn: "2026-07-28",
  }],
  loom: [{
    provider: "youtube", videoId: "eSMiGNzJwtg",
    titleFr: "Bien démarrer avec Loom", titleEn: "How to get started with Loom",
    author: "Loom", duration: "4:41",
    sourceUrl: "https://www.youtube.com/watch?v=eSMiGNzJwtg",
    publishedOn: "2021-11-04", verifiedOn: "2026-07-28",
  }],
  linear: [{
    provider: "youtube", videoId: "9Q5BoiIFBiY",
    titleFr: "Introduction à Linear", titleEn: "Intro to Linear",
    author: "Linear", duration: "4:01",
    sourceUrl: "https://www.youtube.com/watch?v=9Q5BoiIFBiY",
    publishedOn: "2025-06-09", verifiedOn: "2026-07-28",
  }],
};

export function getToolTutorials(slug: string | undefined): ToolTutorial[] {
  return slug ? TOOL_TUTORIALS[slug] || [] : [];
}
