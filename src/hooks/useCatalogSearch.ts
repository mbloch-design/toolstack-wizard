import { useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/data/types";
import type { Post, ToolSummary } from "@/hooks/useSupabaseData";
import type {
  CatalogSearchDocument,
  CatalogSearchEngine,
  CatalogSearchHit,
} from "@/lib/catalogSearch";

type SearchStatus = "idle" | "loading" | "ready" | "error";

type UseCatalogSearchInput = {
  query: string;
  tools: ToolSummary[];
  categories: Category[];
  posts: Post[];
  lang: "fr" | "en" | string;
  limit?: number;
};

export function useCatalogSearch({
  query,
  tools,
  categories,
  posts,
  lang,
  limit = 24,
}: UseCatalogSearchInput) {
  const [hits, setHits] = useState<CatalogSearchHit[] | null>(null);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const engineRef = useRef<Promise<CatalogSearchEngine> | null>(null);

  const documents = useMemo(
    () => buildDocuments(tools, categories, posts, lang),
    [categories, lang, posts, tools],
  );

  useEffect(() => {
    engineRef.current = null;
    setHits(null);
  }, [documents]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    const timer = window.setTimeout(async () => {
      try {
        if (!engineRef.current) {
          engineRef.current = import("@/lib/catalogSearch").then(({ createCatalogSearchEngine }) =>
            createCatalogSearchEngine(documents),
          );
        }
        const engine = await engineRef.current;
        const nextHits = await engine.search(term, limit);
        if (!cancelled) {
          setHits(nextHits);
          setStatus("ready");
        }
      } catch (error) {
        console.warn("Recherche locale enrichie indisponible, fallback textuel conservé.", error);
        if (!cancelled) {
          setHits(null);
          setStatus("error");
        }
      }
    }, 90);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [documents, limit, query]);

  return { hits, status };
}

function buildDocuments(
  tools: ToolSummary[],
  categories: Category[],
  posts: Post[],
  lang: string,
): CatalogSearchDocument[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const toolDocuments = tools.map((tool): CatalogSearchDocument => {
    const category = categoryById.get(tool.categoryId);
    const localizedDescription = lang === "en" ? tool.shortDescriptionEn : tool.shortDescription;
    const categoryLabel = cleanText(lang === "en" ? category?.nameEn || category?.name : category?.name);
    const pricing = flattenText(tool.pricing);
    const searchableFields = [
      tool.name,
      tool.slug,
      tool.slug?.replaceAll("-", " "),
      localizedDescription,
      tool.shortDescription,
      tool.shortDescriptionEn,
      category?.name,
      category?.nameEn,
      tool.functional_needs,
      tool.covers,
      tool.relevantFor,
      tool.verticals,
      tool.pros,
      tool.prosEn,
      tool.host_app,
      pricing,
    ];

    return {
      id: `tool-${tool.id}`,
      kind: "tool",
      entityId: tool.id,
      slug: tool.slug || tool.id,
      label: tool.name,
      meta: categoryLabel,
      searchText: flattenText(searchableFields),
    };
  });

  const categoryDocuments = categories.map((category): CatalogSearchDocument => ({
    id: `category-${category.id}`,
    kind: "category",
    entityId: category.id,
    slug: category.slug,
    label: cleanText(lang === "en" ? category.nameEn || category.name : category.name),
    meta: lang === "en" ? "Category" : "Catégorie",
    searchText: flattenText([
      category.name,
      category.nameEn,
      category.description,
      category.descriptionEn,
    ]),
  }));

  const guideDocuments = posts.map((post): CatalogSearchDocument => ({
    id: `guide-${post.id}`,
    kind: "guide",
    entityId: post.id,
    slug: post.slug,
    label: post.title,
    meta: post.readTime || (lang === "en" ? "Guide" : "Guide"),
    searchText: flattenText([post.title, post.excerpt, post.tags, post.category]),
  }));

  return [...toolDocuments, ...categoryDocuments, ...guideDocuments];
}

function flattenText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(flattenText).filter(Boolean).join(" ");
  if (typeof value === "object") return Object.values(value).map(flattenText).filter(Boolean).join(" ");
  return "";
}

function cleanText(value: unknown): string {
  return flattenText(value)
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\uFE0F/g, "")
    .trim();
}
