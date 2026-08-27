export interface ToolTutorial {
  provider: "youtube";
  videoId: string;
  titleFr: string;
  titleEn: string;
  author: string;
  duration: string;
  sourceUrl: string;
  publishedOn?: string;
  verifiedOn: string;
}

/**
 * Curated official tutorials for priority tool pages.
 * Every entry must be checked against the provider's oEmbed endpoint.
 */
export const TOOL_TUTORIALS: Record<string, ToolTutorial[]> = {
  lottie: [{
    provider: "youtube", videoId: "mLYeuwfPy3g",
    titleFr: "Bien démarrer avec LottieFiles pour After Effects", titleEn: "Getting started with LottieFiles for Adobe After Effects",
    author: "LottieFiles", duration: "Tutoriel officiel",
    sourceUrl: "https://www.youtube.com/watch?v=mLYeuwfPy3g",
    verifiedOn: "2026-08-27",
  }],
  surveymonkey: [{
    provider: "youtube", videoId: "sdcDK5NT5FM",
    titleFr: "Créer un sondage avec SurveyMonkey", titleEn: "How to create a survey in SurveyMonkey",
    author: "SurveyMonkey", duration: "Tutoriel officiel",
    sourceUrl: "https://www.youtube.com/watch?v=sdcDK5NT5FM",
    publishedOn: "2025-09-29", verifiedOn: "2026-08-25",
  }],
  "react-router": [{
    provider: "youtube", videoId: "oTIJunBa6MA",
    titleFr: "Comprendre React Router", titleEn: "React Router complete tutorial",
    author: "Cosden Solutions", duration: "Tutoriel complet",
    sourceUrl: "https://www.youtube.com/watch?v=oTIJunBa6MA",
    publishedOn: "2024-01-31", verifiedOn: "2026-08-25",
  }],
  "adobe-premiere-pro": [{
    provider: "youtube", videoId: "-varpUzy9Pc",
    titleFr: "Bien démarrer avec Adobe Premiere Pro", titleEn: "How to get started with Adobe Premiere Pro",
    author: "Adobe Creative Cloud", duration: "Tutoriel officiel",
    sourceUrl: "https://www.youtube.com/watch?v=-varpUzy9Pc",
    verifiedOn: "2026-08-25",
  }],
  "magic-bullet": [{
    provider: "youtube", videoId: "GYTOkUY8nYo",
    titleFr: "Prise en main de Magic Bullet Looks", titleEn: "Magic Bullet Looks 101",
    author: "Maxon", duration: "Tutoriel officiel",
    sourceUrl: "https://www.youtube.com/watch?v=GYTOkUY8nYo",
    verifiedOn: "2026-08-25",
  }],
  "pixelmator-pro": [{
    provider: "youtube", videoId: "0jIPLgUS0IA",
    titleFr: "Découvrir l’interface de Pixelmator Pro", titleEn: "The beginner’s guide to Pixelmator Pro interface",
    author: "Pixelmator", duration: "Tutoriel officiel",
    sourceUrl: "https://www.youtube.com/watch?v=0jIPLgUS0IA",
    publishedOn: "2023-06-29", verifiedOn: "2026-08-25",
  }],
  "fredo6-bundle": [{
    provider: "youtube", videoId: "sbVJriPOcCg",
    titleFr: "Découvrir les extensions Fredo6", titleEn: "Fredo6 extensions overview",
    author: "SketchUp", duration: "Présentation",
    sourceUrl: "https://www.youtube.com/watch?v=sbVJriPOcCg",
    verifiedOn: "2026-08-25",
  }],
  "solid-inspector2": [{
    provider: "youtube", videoId: "wkj5RQn17Vs",
    titleFr: "Inspecter et réparer un solide dans SketchUp", titleEn: "Inspect and repair solids in SketchUp",
    author: "Thomas Thomassen", duration: "Tutoriel officiel",
    sourceUrl: "https://www.youtube.com/watch?v=wkj5RQn17Vs",
    verifiedOn: "2026-08-25",
  }],
  "topaz-video-ai": [{
    provider: "youtube", videoId: "zbX7x8Oo_Uc",
    titleFr: "Conseils et astuces pour Topaz Video AI", titleEn: "Topaz Video AI tutorials, tips and tricks",
    author: "Topaz Labs", duration: "11:08",
    sourceUrl: "https://www.youtube.com/watch?v=zbX7x8Oo_Uc",
    publishedOn: "2024-11-08", verifiedOn: "2026-08-25",
  }],
  "ae-animation-composer": [{
    provider: "youtube", videoId: "dbv78sGBBGA",
    titleFr: "Prise en main d’Animation Composer", titleEn: "Quick start with Animation Composer",
    author: "Mister Horse", duration: "Tutoriel officiel",
    sourceUrl: "https://www.youtube.com/watch?v=dbv78sGBBGA",
    publishedOn: "2020-11-25", verifiedOn: "2026-08-25",
  }],
  "ae-gifgun": [{
    provider: "youtube", videoId: "jrMexR2W2h8",
    titleFr: "Présentation de GifGun 2", titleEn: "GifGun 2 overview",
    author: "Pixels By Preston", duration: "Présentation",
    sourceUrl: "https://www.youtube.com/watch?v=jrMexR2W2h8",
    verifiedOn: "2026-08-25",
  }],
  "aescripts-flow": [{
    provider: "youtube", videoId: "olB5zSHfBr4",
    titleFr: "Les bases de Flow", titleEn: "Flow basic tutorial",
    author: "aescripts + aeplugins", duration: "Tutoriel officiel",
    sourceUrl: "https://www.youtube.com/watch?v=olB5zSHfBr4",
    publishedOn: "2016-09-19", verifiedOn: "2026-08-25",
  }],
  "corona-renderer": [{
    provider: "youtube", videoId: "sVDaxk91GGc",
    titleFr: "Bien démarrer avec Chaos Corona pour 3ds Max", titleEn: "Getting started with Chaos Corona for 3ds Max",
    author: "Chaos Corona", duration: "4:50",
    sourceUrl: "https://www.youtube.com/watch?v=sVDaxk91GGc",
    publishedOn: "2022-04-13", verifiedOn: "2026-08-25",
  }],
  logseq: [{
    provider: "youtube", videoId: "Vw-x7yTTO0s",
    titleFr: "Découvrir Logseq", titleEn: "Getting started with Logseq",
    author: "Logseq", duration: "Tutoriel",
    sourceUrl: "https://www.youtube.com/watch?v=Vw-x7yTTO0s",
    verifiedOn: "2026-08-25",
  }],
  "motion-array": [{
    provider: "youtube", videoId: "h-xHsei3FHQ",
    titleFr: "Créer plus vite avec Motion Array", titleEn: "Create faster with Motion Array",
    author: "Motion Array Tutorials", duration: "Présentation",
    sourceUrl: "https://www.youtube.com/watch?v=h-xHsei3FHQ",
    verifiedOn: "2026-08-25",
  }],
  "motion-bro": [{
    provider: "youtube", videoId: "JWOJBNEyEyU",
    titleFr: "Utiliser Motion Bro dans After Effects", titleEn: "How to use Motion Bro in After Effects",
    author: "Motion Bro", duration: "Tutoriel officiel",
    sourceUrl: "https://www.youtube.com/watch?v=JWOJBNEyEyU",
    publishedOn: "2022-05-25", verifiedOn: "2026-08-25",
  }],
  deel: [{
    provider: "youtube", videoId: "9vuekfsaYoo",
    titleFr: "Démo complète de la plateforme Deel", titleEn: "Deel end-to-end platform demo",
    author: "Deel", duration: "4:00",
    sourceUrl: "https://www.youtube.com/watch?v=9vuekfsaYoo",
    verifiedOn: "2026-08-24",
  }],
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
    publishedOn: "2020-12-01", verifiedOn: "2026-08-27",
  }, {
    provider: "youtube", videoId: "qaZC3XSAeR8",
    titleFr: "Du prompt au code avec Figma Make et Sites", titleEn: "From prompt to code with Figma Make and Sites",
    author: "Figma", duration: "Conférence officielle",
    sourceUrl: "https://www.youtube.com/watch?v=qaZC3XSAeR8",
    publishedOn: "2025-06-13", verifiedOn: "2026-08-27",
  }],
  canva: [{
    provider: "youtube", videoId: "V9LtRF6EbyY",
    titleFr: "Canva pour débutants : découvrir l’interface", titleEn: "Canva for beginners: opening Canva",
    author: "Canva", duration: "3:58",
    sourceUrl: "https://www.youtube.com/watch?v=V9LtRF6EbyY",
    publishedOn: "2021-08-01", verifiedOn: "2026-08-27",
  }],
  perplexity: [{
    provider: "youtube", videoId: "WMFLMSu2BaM",
    titleFr: "Recherche ou Computer : choisir le bon mode", titleEn: "Search vs Computer",
    author: "Perplexity", duration: "4:34",
    sourceUrl: "https://www.youtube.com/watch?v=WMFLMSu2BaM",
    verifiedOn: "2026-08-27",
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
