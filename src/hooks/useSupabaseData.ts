import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tool, Category } from "@/data/types";
import categoriesIndexJson from "@/data/categories_index.json";
import toolsIndexJson from "@/data/tools_index.json";
import { getToolLogoUrl as resolveToolLogoUrl } from "@/lib/toolLogos";

// Pre-resolved tool data injected by the SSR build step (see entry-server.tsx),
// so useToolBySlug can skip its loading state when the markup was already
// server-rendered for this exact slug — avoids a hydration-time spinner flash.
export const SsrToolContext = createContext<Tool | undefined>(undefined);

// Same idea, for the small "related guides" list ToolDetailPage shows in its
// desktop sidebar: usePosts() below has no static fallback (posts start at
// []), so that block goes from absent to present once its fetch resolves —
// a guaranteed, deterministic layout shift on every load of an SSR'd tool
// page. Pre-computed server-side and passed through here instead.
export const SsrRelatedPostsContext = createContext<Pick<Post, "slug" | "title" | "readTime">[] | undefined>(undefined);

// Same idea, for ComparePage (see entry-server.tsx's renderComparePage) - so
// useToolPair can skip its loading state when the pair was already
// server-rendered for this exact slugA/slugB.
export const SsrComparePairContext = createContext<{ toolA: Tool; toolB: Tool } | undefined>(undefined);

// Same idea, for GuideDetailPage (see entry-server.tsx's renderGuidePage) - so
// usePostBySlug can skip its client-only fetch when the post was already
// server-rendered for this exact slug/lang.
export const SsrPostContext = createContext<Post | undefined>(undefined);

// Static fallback data (synchronous — available on first render)
const staticCategories: Category[] = (categoriesIndexJson as any[]).map((c: any) => ({
  id: c.id,
  slug: c.slug,
  name: asLocalizedText(c.name, c.id, "fr"),
  nameEn: asLocalizedText(c.nameEn, asLocalizedText(c.name, c.id, "en"), "en"),
  description: asLocalizedText(c.description, "", "fr"),
  descriptionEn: asLocalizedText(c.descriptionEn, asLocalizedText(c.description, "", "en"), "en"),
  tools: c.tools,
}));

function asLocalizedText(value: unknown, fallback = "", locale: "fr" | "en" = "fr"): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate = record[locale] ?? record.fr ?? record.en ?? record.name ?? record.label;
    if (candidate != null && candidate !== value) return asLocalizedText(candidate, fallback, locale);
    const firstText = Object.values(record).find((item) => typeof item === "string");
    if (firstText) return firstText;
  }
  return fallback;
}

function mapToolFromJson(t: any): Tool {
  return {
    id: asLocalizedText(t.id, ""),
    slug: asLocalizedText(t.slug || t.id, ""),
    name: asLocalizedText(t.name, asLocalizedText(t.id, ""), "fr"),
    categoryId: asLocalizedText(t.category || t.categoryId, ""),
    shortDescription: asLocalizedText(t.shortDescription || t.short_description, "", "fr"),
    shortDescriptionEn: asLocalizedText(t.shortDescriptionEn || t.short_description_en || t.shortDescription || t.short_description, "", "en"),
    longDescription: asLocalizedText(t.longDescription || t.long_description, "", "fr"),
    longDescriptionEn: asLocalizedText(t.longDescriptionEn || t.long_description_en || t.longDescription || t.long_description, "", "en"),
    pricing: t.pricing || t.pricingTiers || { free: "", paid: "" },
    pricingEn: t.pricingEn || t.pricing_en || null,
    defaultMonthlyPrice: t.defaultMonthlyPrice || t.default_monthly_price || 0,
    verdict: t.verdict || { keepIf: [], avoidIf: [], threshold: "" },
    verdictEn: t.verdictEn || t.verdict_en || null,
    pros: t.pros || [],
    prosEn: t.prosEn || t.pros_en || null,
    cons: t.cons || [],
    consEn: t.consEn || t.cons_en || null,
    useCases: t.useCases || t.use_cases || [],
    useCasesEn: t.useCasesEn || t.use_cases_en || null,
    covers: t.covers || [],
    relevantFor: t.relevantFor || t.relevant_for || [],
    personas: t.personas || [],
    affiliateLink: asLocalizedText(t.affiliateLink || t.affiliate_link, ""),
    websiteUrl: asLocalizedText(t.websiteUrl || t.website_url || t.affiliateLink || t.affiliate_link, ""),
    logo: asLocalizedText(t.logo, ""),
    ogImageUrl: t.ogImageUrl || t.og_image_url || null,
    galleryImages: t.galleryImages || t.gallery_images || [],
    soloRelevance: t.soloRelevance || t.solo_relevance || "",
    teamRelevance: t.teamRelevance || t.team_relevance || "",
    alternatives: t.alternatives || [],
    seo: t.seo || null,
    articles: t.articles || [],
    timeGainedHoursPerMonth: t.timeGainedHoursPerMonth ?? t.time_gained_hours_per_month ?? undefined,
    freeAlternative: t.freeAlternative || t.free_alternative || null,
    tool_type: t.tool_type || "satellite",
    substitutable: t.substitutable ?? true,
    host_app: t.host_app || null,
    bundle_parent: t.bundle_parent || null,
    verticals: t.verticals || [],
    functional_needs: t.functional_needs || t.covers || [],
    ia_use_case: t.ia_use_case || null,
    betterAlternative: t.betterAlternative || t.better_alternative || null,
    migrationGuide: t.migrationGuide || t.migration_guide || null,
    downgradePlan: t.downgradePlan || t.downgrade_plan || null,
    prescription_quality: t.prescription_quality || "silence",
    prescription_output: t.prescription_output || null,
    prescription_block_reasons: t.prescription_block_reasons || [],
    prescription_context_questions: t.prescription_context_questions || [],
    substitution_cluster_v2: t.substitution_cluster_v2 || null,
    pricing_v5: t.pricing_v5 || null,
    decision_policy_v3: t.decision_policy_v3 || null,
    toolTrimRating: t.toolTrimRating || null,
  };
}

async function loadLocalTools(): Promise<Tool[]> {
  const module = await import("@/data/tools_v4.json");
  return (module.default as unknown[]).map(mapToolFromJson);
}

const localToolShardPromises = new Map<string, Promise<Tool[]>>();

function getToolShardKey(slug: string): string {
  const firstCharacter = slug.trim().toLowerCase().charAt(0);
  return /^[a-z0-9]$/.test(firstCharacter) ? firstCharacter : "other";
}

async function loadLocalTool(slug: string): Promise<Tool | null> {
  // Vite serves source files directly in development. Production uses the
  // compact catalogue shards emitted after the client build, so navigating to
  // one fiche never downloads and parses all 1,171 tools.
  if (import.meta.env.DEV) {
    const tools = await loadLocalTools();
    return tools.find((tool) => tool.slug === slug || tool.id === slug) || null;
  }

  const shardKey = getToolShardKey(slug);
  let pending = localToolShardPromises.get(shardKey);
  if (!pending) {
    pending = fetch(`/assets/tool-catalog/${shardKey}.json`, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Catalogue shard ${shardKey}: HTTP ${response.status}`);
        return response.json() as Promise<unknown[]>;
      })
      .then((tools) => tools.map(mapToolFromJson));
    localToolShardPromises.set(shardKey, pending);
  }

  try {
    const tools = await pending;
    return tools.find((tool) => tool.slug === slug || tool.id === slug) || null;
  } catch (error) {
    // Do not poison the session cache after a transient CDN/network failure;
    // the remote request can still render the fiche and a later navigation can retry.
    localToolShardPromises.delete(shardKey);
    console.warn(`Catalogue shard ${shardKey} unavailable`, error);
    return null;
  }
}

export type ToolSummary = Pick<
  Tool,
  | "id"
  | "slug"
  | "name"
  | "categoryId"
  | "shortDescription"
  | "shortDescriptionEn"
  | "pricing"
  | "defaultMonthlyPrice"
  | "affiliateLink"
  | "websiteUrl"
  | "ogImageUrl"
  | "logo"
  | "covers"
  | "pros"
  | "prosEn"
  | "tool_type"
  | "host_app"
  | "bundle_parent"
  | "substitution_cluster_v2"
  | "functional_needs"
  | "verticals"
  | "prescription_quality"
  | "relevantFor"
  | "freeAlternative"
  | "substitutable"
  | "betterAlternative"
> & {
  compareMonthlyPrice?: number | null;
  // Date de publication, utilisée pour trier la section Nouveautés de l'accueil.
  // Absente des fiches statiques du bundle : optionnelle, les fiches sans date
  // sont reléguées en fin de tri plutôt que remontées par hasard.
  publishedAt?: string | null;
  // Modèle de rattachement : works_with alimente les pages hôtes et le filtre
  // « Fonctionne avec », form_factor décide de la famille de route.
  worksWith?: string[];
  formFactor?: string | null;
};

// Fiches doublons consolidées (301 → canonique dans vercel.json). On les retire
// des listings/cartes pour ne pas afficher plusieurs fiches du même produit.
// Canonique Adobe = adobe-creative-cloud.
const DEPRECATED_TOOL_SLUGS = new Set([
  "adobe", "adobe-cc",
  // Alias/features/combos consolidés vers la fiche canonique du produit (301 dans vercel.json).
  "capcut-ai", "clickup-ai", "excel-copilot", "streamelements-widgets", "gsc", "gorgias-helpscout",
  // Feature sans produit autonome ni parent fiché.
  "youtube-live",
  // Produit fermé (shieldapp.ai affiche « Shield is winding down »).
  "shield",
  // Recatégorisation placeholder (preuve HTTP) : URL morte ou domaine parké/générique,
  // + 4 combos/doublons redirigés 301 (voir vercel.json).
  "affiliate-dashboards", "affiliate-tools", "archive-tools", "bots-discord", "canva-kits", "canva-templates",
  "capcut-templates", "caption-tools", "chart-tools", "chatgpt-pour-brouillons-non-juridiques", "comfyui-workflows", "content-credentials-tools",
  "emoji-sticker-packs", "figma-templates", "form-apps", "frame-guides", "gaming-overlays", "krea",
  "krea-selon-metier", "lighting-kits", "lightroom-presets", "link-in-bio", "link-in-bio-tools", "map-tools",
  "media-kit-templates", "meme-templates", "mobile-gimbal-apps", "mockup-plugins", "music-libraries", "newsletter-referral-tools",
  "overlays", "pennylane-ai-selon-dispo", "pennylane-ou-indy", "pennylane-qonto", "presets", "presets-lightroom",
  "prompt-libraries", "recipe-card-templates", "review-tools", "scheduling-tools", "screen-capture-tools", "screenshot-tools",
  "shared-cloud-folders", "social-schedulers", "stock-footage", "subtitle-tools", "teleprompter-apps", "templates",
  "templates-ugc", "utm-builders", "webflow-framer", "webhooks", "workout-templates", "zapier-make",
  "gamma-ai", "adcreative", "inbound",
  "magicbrief", "modo", "opusclip",
  "webxr", "topaz-video",
  "relume-ai", "pageai", "liquid-web-partner-program", "are-na", "invision", "specify", "dovetail-ai", "shield-app", "seo-mode", "ga4", "sql", "wunderlist",
  "openai", "anthropic", "motion-app", "anchor-spotify", "descript", "flux", "kling-ai", "magnific-ai", "otter", "figma-weave", "elgato-stream-deck", "around", "monday", "fig-terminal", "reclaim-ai", "legifrance-pro", "captaindoc", "sendinblue", "clearbit", "quickbooks-online", "lemonsqueezy",
]);

const staticToolSummaries: ToolSummary[] = (toolsIndexJson as any[]).map((t: any) => ({
  id: asLocalizedText(t.id || t.slug, ""),
  slug: asLocalizedText(t.slug || t.id, ""),
  name: asLocalizedText(t.name, asLocalizedText(t.id, ""), "fr"),
  categoryId: asLocalizedText(t.categoryId || t.category, ""),
  shortDescription: asLocalizedText(t.shortDescription || t.short_description, "", "fr"),
  shortDescriptionEn: asLocalizedText(t.shortDescriptionEn || t.short_description_en || t.shortDescription || t.short_description, "", "en"),
  pricing: t.pricing || { free: "", paid: "" },
  defaultMonthlyPrice: Number(t.defaultMonthlyPrice ?? t.default_monthly_price ?? 0) || 0,
  affiliateLink: asLocalizedText(t.affiliateLink || t.affiliate_link, ""),
  websiteUrl: asLocalizedText(t.websiteUrl || t.website_url || t.affiliateLink || t.affiliate_link, ""),
  ogImageUrl: asLocalizedText(t.ogImageUrl || t.og_image_url, ""),
  logo: asLocalizedText(t.logo, ""),
  covers: t.covers || [],
  pros: t.pros || [],
  prosEn: t.prosEn || t.pros_en || null,
  tool_type: t.tool_type || "satellite",
  host_app: t.host_app || null,
  bundle_parent: t.bundle_parent || null,
  substitution_cluster_v2: t.substitution_cluster_v2 || null,
  functional_needs: t.functional_needs || [],
  verticals: t.verticals || [],
  prescription_quality: t.prescription_quality || null,
  relevantFor: t.relevantFor || t.relevant_for || [],
  freeAlternative: t.freeAlternative || t.free_alternative || null,
  substitutable: t.substitutable ?? true,
  betterAlternative: t.betterAlternative || t.better_alternative || null,
  compareMonthlyPrice: Number(t.compareMonthlyPrice ?? t.pricing_v5?.compare_price_monthly_eur) || null,
})).filter((t) => !DEPRECATED_TOOL_SLUGS.has(t.slug));

function mapSupabaseCat(c: any): Category {
  const localFallback = staticCategories.find((category) => category.id === c.id);
  return {
    id: c.id,
    slug: c.slug || localFallback?.slug || c.id,
    name: asLocalizedText(c.name, localFallback?.name || c.id, "fr"),
    nameEn: asLocalizedText(c.name_en ?? c.nameEn ?? c.name, localFallback?.nameEn || localFallback?.name || c.id, "en"),
    description: asLocalizedText(c.description, localFallback?.description || "", "fr"),
    descriptionEn: asLocalizedText(c.description_en ?? c.descriptionEn ?? c.description, localFallback?.descriptionEn || localFallback?.description || "", "en"),
    tools: localFallback?.tools,
  };
}

function mergeById<T extends { id: string }>(localItems: T[], remoteItems: T[]): T[] {
  const merged = new Map<string, T>();
  localItems.forEach((item) => merged.set(item.id, item));
  remoteItems.forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
}

export interface Post {
  id: number; slug: string; lang: string; title: string; excerpt: string;
  date: string; category: string; toolId: string | null; content: string;
  tags: string[]; readTime: string; thumbnail: string | null;
  seo: { metaTitle?: string; metaDescription?: string; keywords?: string } | null;
}

const localPostsCache = new Map<string, Post[]>();
const localPostsPromises = new Map<string, Promise<Post[]>>();

function mapPost(p: any): Post {
  return {
    id: p.id, slug: p.slug, lang: p.lang, title: p.title, excerpt: p.excerpt || "",
    date: p.date, category: p.category || "", toolId: p.tool_id || p.toolId || null,
    content: p.content || "", tags: p.tags || [], readTime: p.read_time || p.readTime || "",
    thumbnail: p.thumbnail || null,
    seo: p.seo || null,
  };
}

export async function loadLocalPosts(lang: string): Promise<Post[]> {
  const cached = localPostsCache.get(lang);
  if (cached) return cached;

  const pending = localPostsPromises.get(lang);
  if (pending) return pending;

  const promise = (lang === "en"
    ? import("@/data/posts-en.json")
    : import("@/data/posts-fr.json"))
    .then((module) => {
      const posts = (module.default as any[]).map((post) => mapPost({
        ...post,
        lang: post.lang || lang,
      }));
      localPostsCache.set(lang, posts);
      localPostsPromises.delete(lang);
      return posts;
    })
    .catch((error) => {
      localPostsPromises.delete(lang);
      throw error;
    });

  localPostsPromises.set(lang, promise);
  return promise;
}

// Module-level, session-lifetime caches. Every ToolDetailPage mount (i.e.
// every tool-to-tool navigation) used to redo the full fetch + transform
// from scratch — same ~1100-row JSON map and Supabase round-trip every
// time. Content here doesn't change within a tab session, so cache once
// and reuse; a hard reload naturally clears these like any module state.
let _categoriesCache: Category[] | null = null;

export function useCategories() {
  // On an already-SSR'd tool page, the static data is from the same build
  // as the page itself — refreshing it on mount only swaps content after
  // it's already painted, causing a visible layout shift for no real
  // freshness gain. Skip the refresh there; every other page keeps it.
  const isSsrPage = useContext(SsrToolContext) !== undefined;
  const [categories, setCategories] = useState<Category[]>(_categoriesCache ?? staticCategories);
  const [loading, setLoading] = useState(!_categoriesCache && !isSsrPage);

  useEffect(() => {
    if (_categoriesCache || isSsrPage) return;
    (async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (!error && data && data.length > 0) {
        const merged = mergeById(staticCategories, data.map(mapSupabaseCat));
        _categoriesCache = merged;
        setCategories(merged);
      }
      setLoading(false);
    })();
  }, []);

  return { categories, loading };
}

/**
 * Targeted hook for pages that only need 1-2 specific tools (ComparePage).
 * Avoids loading the full 3.3MB tools_v4.json chunk just to look up two slugs.
 *
 * Strategy:
 *  1. Try Supabase with `.in('slug', [slugA, slugB])` — 2-row payload.
 *  2. If Supabase returns 0 results (offline, prerender, etc.), fall back
 *     to a lazy import of tools_v4.json and find the 2 entries there.
 *  3. Return `{ toolA, toolB, loading }` mapped through the same mapToolFromJson
 *     so consumers get exactly the same Tool shape as useTools().
 */
export function useToolPair(slugA: string | undefined | null, slugB: string | undefined | null) {
  const ssrPair = useContext(SsrComparePairContext);
  const ssrMatches = !!ssrPair &&
    (ssrPair.toolA.slug === slugA || ssrPair.toolA.id === slugA) &&
    (ssrPair.toolB.slug === slugB || ssrPair.toolB.id === slugB);
  const [toolA, setToolA] = useState<Tool | undefined>(ssrMatches ? ssrPair!.toolA : undefined);
  const [toolB, setToolB] = useState<Tool | undefined>(ssrMatches ? ssrPair!.toolB : undefined);
  const [loading, setLoading] = useState(!ssrMatches);

  useEffect(() => {
    if (!slugA || !slugB) { setLoading(false); return; }
    if (ssrMatches) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const findInList = (list: Tool[], key: string) =>
        list.find((t) => t.id === key || t.slug === key);

      // 1) Targeted Supabase query — ~2 rows
      try {
        const { data, error } = await supabase
          .from("tools")
          .select("*")
          .in("slug", [slugA, slugB]);

        if (cancelled) return;

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapToolFromJson);
          const a = findInList(mapped, slugA);
          const b = findInList(mapped, slugB);
          if (a && b) {
            setToolA(a); setToolB(b); setLoading(false);
            return;
          }
        }
      } catch { /* fall through to local */ }

      // 2) Fallback: fetch only the small local shards containing both tools.
      const [localA, localB] = await Promise.all([
        loadLocalTool(slugA),
        loadLocalTool(slugB),
      ]);
      if (cancelled) return;
      setToolA(localA || undefined);
      setToolB(localB || undefined);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [slugA, slugB]);

  return { toolA, toolB, loading };
}

let _toolsCache: Tool[] | null = null;

export function useTools() {
  const [tools, setTools] = useState<Tool[]>(_toolsCache ?? []);
  const [loading, setLoading] = useState(!_toolsCache);

  useEffect(() => {
    if (_toolsCache) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const localTools = await loadLocalTools();
      if (cancelled) return;
      setTools(localTools);

      const { data, error } = await supabase.from("tools").select("*").limit(5000);
      if (cancelled) return;
      const merged = (!error && data && data.length > 0) ? mergeById(localTools, data.map(mapToolFromJson)) : localTools;
      _toolsCache = merged;
      setTools(merged);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { tools, loading };
}

let _toolSummariesCache: ToolSummary[] | null = null;

interface RefreshOptions {
  refreshRemote?: boolean;
}

export function useToolSummaries({ refreshRemote = true }: RefreshOptions = {}) {
  // Same rationale as useCategories above: don't swap the alternatives/
  // summaries list out from under an already-painted SSR'd tool page.
  const isSsrPage = useContext(SsrToolContext) !== undefined;
  const [tools, setTools] = useState<ToolSummary[]>(_toolSummariesCache ?? staticToolSummaries);
  const [loading, setLoading] = useState(refreshRemote && !_toolSummariesCache && !isSsrPage);

  useEffect(() => {
    if (!refreshRemote || _toolSummariesCache || isSsrPage) return;
    (async () => {
      const { data, error } = await supabase
        .from("tools")
        .select("id, slug, name, category, short_description, short_description_en, pricing, default_monthly_price, affiliate_link, website_url, og_image_url, logo, covers, pros, pros_en, tool_type, host_app, bundle_parent, substitution_cluster_v2, functional_needs, verticals, prescription_quality, relevant_for, free_alternative, substitutable, better_alternative, published_at, works_with, form_factor")
        .limit(5000);

      if (!error && data && data.length > 0) {
        const remoteTools = data.map((t: any) => ({
          id: asLocalizedText(t.id, ""),
          slug: asLocalizedText(t.slug || t.id, ""),
          name: asLocalizedText(t.name, asLocalizedText(t.id, ""), "fr"),
          categoryId: asLocalizedText(t.category, ""),
          shortDescription: asLocalizedText(t.short_description, "", "fr"),
          shortDescriptionEn: asLocalizedText(t.short_description_en || t.short_description, "", "en"),
          pricing: t.pricing || { free: "", paid: "" },
          defaultMonthlyPrice: t.default_monthly_price || 0,
          affiliateLink: asLocalizedText(t.affiliate_link, ""),
          ogImageUrl: asLocalizedText(t.og_image_url, ""),
          covers: t.covers || [],
          pros: t.pros || [],
          prosEn: t.pros_en || t.pros || null,
          tool_type: t.tool_type || "satellite",
          host_app: t.host_app || null,
          bundle_parent: t.bundle_parent || null,
          websiteUrl: asLocalizedText(t.website_url || t.affiliate_link, ""),
          logo: asLocalizedText(t.logo, ""),
          substitution_cluster_v2: t.substitution_cluster_v2 || null,
          functional_needs: t.functional_needs || [],
          verticals: t.verticals || [],
          prescription_quality: t.prescription_quality || null,
          relevantFor: t.relevant_for || [],
          freeAlternative: t.free_alternative || null,
          substitutable: t.substitutable ?? true,
          betterAlternative: t.better_alternative || null,
          compareMonthlyPrice: Number(t.pricing_v5?.compare_price_monthly_eur) || null,
          publishedAt: t.published_at || null,
          worksWith: Array.isArray(t.works_with) ? t.works_with : [],
          formFactor: t.form_factor || null,
        }));
        const merged = mergeById(staticToolSummaries, remoteTools)
          .filter((t) => !DEPRECATED_TOOL_SLUGS.has(t.slug));
        _toolSummariesCache = merged;
        setTools(merged);
      }
      setLoading(false);
    })();
  }, [isSsrPage, refreshRemote]);

  return { tools, loading };
}

export function useToolBySlug(slug: string | undefined) {
  const ssrTool = useContext(SsrToolContext);
  const ssrMatches = !!ssrTool && (ssrTool.slug === slug || ssrTool.id === slug);
  const [tool, setTool] = useState<Tool | null>(ssrMatches ? ssrTool! : null);
  const [loading, setLoading] = useState(!ssrMatches);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    // SSR data is already as fresh as the last deploy (the build re-fetches
    // Supabase for every tool, see entry-server.tsx); re-fetching it again
    // client-side just for a mid-session freshness guarantee was costing a
    // full Supabase round-trip (~1.1s, confirmed in a real PageSpeed run)
    // sitting in the LCP-relevant critical request chain for no visible
    // benefit on a normal page view. Skip it when SSR already matches.
    if (ssrMatches) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      // Refresh remotely in parallel, but never keep client navigation behind
      // Supabase. The local catalogue is the immediate rendering source.
      const remoteToolPromise = (async (): Promise<Tool | null> => {
        const useCatalogProjection = import.meta.env.VITE_CATALOG_PROJECTION_FICHE !== "false";
        if (useCatalogProjection) {
          try {
            const { fetchProjectedTool } = await import("@/lib/catalogProjection");
            const projectedTool = await fetchProjectedTool(slug);
            if (projectedTool) return projectedTool;
          } catch (error) {
            console.warn("Fiche: projection catalog_api indisponible, fallback historique", error);
          }
        }

        let { data } = await supabase.from("tools").select("*").eq("slug", slug).maybeSingle();
        if (!data) ({ data } = await supabase.from("tools").select("*").eq("id", slug).maybeSingle());
        return data ? mapToolFromJson(data) : null;
      })();

      const localTool = await loadLocalTool(slug);
      if (cancelled) return;

      if (localTool) {
        setTool(localTool);
        setLoading(false);
      }

      const remoteTool = await remoteToolPromise;
      if (cancelled) return;

      if (remoteTool) setTool(remoteTool);
      else if (!localTool) setTool(null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { tool, loading };
}

export function usePosts(lang: string, { refreshRemote = true }: RefreshOptions = {}) {
  // On an SSR'd tool page, ToolDetailPage already has its relatedPosts
  // pre-computed server-side (see SsrRelatedPostsContext) and never reads
  // this hook's own `posts` value — so fetching the full posts dataset
  // (a ~70KB chunk + a Supabase query, both sitting in the critical
  // network chain) is pure waste there. Skip it entirely in that case.
  const skip = useContext(SsrRelatedPostsContext) !== undefined;
  const cachedLocalPosts = localPostsCache.get(lang) ?? [];
  const [posts, setPosts] = useState<Post[]>(cachedLocalPosts);
  const [loading, setLoading] = useState(!skip && cachedLocalPosts.length === 0);

  useEffect(() => {
    if (skip) return;
    let cancelled = false;

    (async () => {
      if (!localPostsCache.has(lang)) setLoading(true);

      // Start the remote refresh immediately, but never make local editorial
      // content wait for Supabase. This keeps guides usable when the project is
      // slow, paused or restricted by its egress quota.
      const remotePostsPromise = refreshRemote
        ? supabase
          .from("posts")
          .select("*")
          .eq("lang", lang)
          .order("date", { ascending: false })
        : null;
      const localPosts = await loadLocalPosts(lang);

      if (cancelled) return;

      setPosts(localPosts);
      setLoading(false);

      if (!remotePostsPromise) return;
      const { data, error } = await remotePostsPromise;
      if (cancelled) return;

      if (!error && data && data.length > 0) {
        const supabasePosts = data.map(mapPost);
        const supabaseSlugs = new Set(supabasePosts.map(p => p.slug));
        const merged = [...supabasePosts, ...localPosts.filter(p => !supabaseSlugs.has(p.slug))];
        merged.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        setPosts(merged);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lang, refreshRemote, skip]);

  return { posts, loading };
}

export function usePostBySlug(slug: string | undefined, lang: string, { refreshRemote = true }: RefreshOptions = {}) {
  // When the post was server-rendered for this exact slug (see renderGuidePage),
  // seed from the SSR context and skip the client fetch so hydration matches.
  const ssrPost = useContext(SsrPostContext);
  const ssrMatches = ssrPost !== undefined && ssrPost.slug === slug;
  const cachedPost = slug
    ? localPostsCache.get(lang)?.find((candidate) => candidate.slug === slug) ?? null
    : null;
  const initialPost = ssrMatches ? ssrPost : cachedPost;
  const [post, setPost] = useState<Post | null>(initialPost);
  const [loading, setLoading] = useState(!initialPost);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    if (ssrMatches) { setPost(ssrPost); setLoading(false); return; }
    if (cachedPost) { setPost(cachedPost); setLoading(false); return; }
    let cancelled = false;

    (async () => {
      setLoading(true);

      const remotePostPromise = refreshRemote
        ? supabase
          .from("posts")
          .select("*")
          .eq("slug", slug)
          .eq("lang", lang)
          .maybeSingle()
        : null;
      const localPosts = await loadLocalPosts(lang);
      if (cancelled) return;

      const localPost = localPosts.find((p) => p.slug === slug) || null;
      if (localPost) {
        setPost(localPost);
        setLoading(false);
      }

      if (!remotePostPromise) {
        setPost(localPost);
        setLoading(false);
        return;
      }
      const { data } = await remotePostPromise;
      if (cancelled) return;

      setPost(data ? mapPost(data) : localPost);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [cachedPost, slug, lang, refreshRemote, ssrMatches, ssrPost]);

  return { post, loading };
}

export function getToolLogoUrl(tool: Tool): string | null {
  return resolveToolLogoUrl(tool, 64);
}

export function getToolLogoUrlHD(tool: Tool): string | null {
  return resolveToolLogoUrl(tool, 128);
}
