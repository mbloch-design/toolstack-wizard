import index from "@/data/tool_guides_index.json";

export interface ToolGuideRef {
  slug: string;
  title: string;
  date: string | null;
  category: string | null;
}

export interface GuideToolRef {
  slug: string;
  name: string;
  /** False when the tool has no verified pricing, so `/prix` would be empty. */
  hasPricing: boolean;
}

export interface GuideCoveredTool extends GuideToolRef {
  logo?: string;
  websiteUrl?: string;
}

export interface GuideRelatedRef {
  slug: string;
  title: string;
  thumbnail?: string;
  readTime?: string;
  category?: string;
  /** Lead tool, used as the card visual when the guide has no cover. */
  tool?: GuideCoveredTool;
}

type Index = {
  byTool: Record<string, { fr: ToolGuideRef[]; en: ToolGuideRef[] }>;
  byGuide: Record<string, GuideToolRef>;
  guideExtras?: Record<string, { tools: GuideCoveredTool[]; related: GuideRelatedRef[] }>;
};

const { byTool, byGuide, guideExtras = {} } = index as Index;

const normaliseLang = (lang: string): "fr" | "en" => (lang === "en" ? "en" : "fr");

/**
 * Guides covering a tool, freshest first. Generated at build time by
 * scripts/gen-tool-guides-index.mjs so the tool page never scans the
 * editorial catalogue at runtime.
 */
export function getGuidesForTool(toolSlug: string | undefined, lang: string): ToolGuideRef[] {
  if (!toolSlug) return [];
  return byTool[toolSlug]?.[normaliseLang(lang)] ?? [];
}

/** The catalogue tool a guide is about, resolved through the guide's `toolId`. */
export function getToolForGuide(guideSlug: string | undefined, lang: string): GuideToolRef | null {
  if (!guideSlug) return null;
  return byGuide[`${normaliseLang(lang)}:${guideSlug}`] ?? null;
}

/** Every catalogue tool a guide covers (toolId first, then tool slugs in its tags). */
export function getToolsForGuide(guideSlug: string | undefined, lang: string): GuideCoveredTool[] {
  if (!guideSlug) return [];
  return guideExtras[`${normaliseLang(lang)}:${guideSlug}`]?.tools ?? [];
}

/** Three guides to read next, ranked by shared tags. */
export function getRelatedGuides(guideSlug: string | undefined, lang: string): GuideRelatedRef[] {
  if (!guideSlug) return [];
  return guideExtras[`${normaliseLang(lang)}:${guideSlug}`]?.related ?? [];
}
