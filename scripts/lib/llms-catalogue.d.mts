export interface CatalogueTool {
  slug?: string;
  name?: string;
  websiteUrl?: string | null;
  affiliateLink?: string;
  categoryId?: string;
  pricing?: unknown;
  // Legacy input is deliberately ignored by the exporter, even if malformed.
  defaultMonthlyPrice?: unknown;
  shortDescription?: string;
  shortDescriptionEn?: string;
  freeAlternative?: string | null;
  betterAlternative?: string | null;
}
export interface ToolRecord {
  name: string | undefined;
  slug: string;
  url_fr: string;
  url_en: string;
  website: string | undefined;
  category: string | undefined;
  pricing: unknown;
  description_fr: string | undefined;
  description_en: string | undefined;
  alternatives: string[] | undefined;
}
export interface EditorialRecord {
  type: "guide" | "comparison";
  language: string;
  slug: string;
  url: string;
  title: string;
  summary: string | undefined;
}
export function toolRecords(tools: readonly CatalogueTool[]): ToolRecord[];
export function decodeEntities(value: string): string;
export function editorialUrls(xml: string): string[];
export function editorialRecord(url: string, html: string): EditorialRecord;
