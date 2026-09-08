import postsFrJson from "@/data/posts-fr.json";
import postsEnJson from "@/data/posts-en.json";
import type { Post } from "@/hooks/useSupabaseData";

function normalisePosts(source: unknown[], lang: "fr" | "en"): Post[] {
  return source.map((post, index) => {
    const value = post as Omit<Post, "id" | "lang"> & { id?: number; lang?: string };
    return {
      ...value,
      id: value.id ?? index + 1,
      lang: value.lang || lang,
    } as Post;
  });
}

const POSTS = {
  fr: normalisePosts(postsFrJson, "fr"),
  en: normalisePosts(postsEnJson, "en"),
} as const;

/** Synchronous build snapshot used only by the lazy-loaded Guides index. */
export function getGuidePosts(lang: string): Post[] {
  return lang === "en" ? POSTS.en : POSTS.fr;
}
