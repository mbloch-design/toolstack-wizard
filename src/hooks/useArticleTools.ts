import { useMemo } from "react";
import type { Tool } from "@/data/types";
import type { Post } from "@/hooks/useSupabaseData";

type ArticleTool = Pick<Tool, "id" | "slug" | "name" | "websiteUrl" | "affiliateLink">;

/**
 * Extracts tools mentioned in a post by matching tool names in content/title/tags.
 * Returns matched Tool objects sorted by relevance (title match first).
 */
export function useArticleTools<T extends ArticleTool>(post: Post | null, tools: T[]): T[] {
  return useMemo(() => {
    if (!post || tools.length === 0) return [];

    const matched = new Map<string, { tool: T; score: number }>();
    const searchText = `${post.title} ${post.excerpt} ${post.content}`.toLowerCase();
    const tagText = (post.tags || []).join(" ").toLowerCase();

    for (const tool of tools) {
      const name = tool.name.toLowerCase();
      // Skip very short names to avoid false positives
      if (name.length < 3) continue;

      let score = 0;

      // Check title (highest weight)
      if (post.title.toLowerCase().includes(name)) score += 10;
      // Check tags
      if (tagText.includes(name)) score += 5;
      // Check content body
      if (searchText.includes(name)) score += 2;
      // Exact tool_id match
      if (post.toolId && post.toolId === tool.id) score += 20;

      if (score > 0) {
        matched.set(tool.id, { tool, score });
      }
    }

    return Array.from(matched.values())
      .sort((a, b) => b.score - a.score)
      .map((m) => m.tool)
      .slice(0, 8);
  }, [post, tools]);
}

/**
 * Generates a deterministic gradient based on the article slug/category.
 */
export function getArticleGradient(slug: string, category?: string): string {
  // Hash the slug to pick gradient colors
  let hash = 0;
  const str = slug + (category || "");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const gradients = [
    "from-blue-500/20 via-indigo-500/10 to-purple-500/5",
    "from-cyan-500/20 via-blue-500/10 to-indigo-500/5",
    "from-violet-500/20 via-purple-500/10 to-pink-500/5",
    "from-emerald-500/15 via-teal-500/10 to-cyan-500/5",
    "from-amber-500/15 via-orange-500/10 to-red-500/5",
    "from-rose-500/15 via-pink-500/10 to-purple-500/5",
    "from-sky-500/20 via-blue-500/10 to-violet-500/5",
    "from-indigo-500/20 via-blue-500/10 to-cyan-500/5",
  ];

  return gradients[Math.abs(hash) % gradients.length];
}
