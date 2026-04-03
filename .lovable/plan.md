

## Diagnostic

The `/fr/guides` page is empty because `usePosts("fr")` queries Supabase, which returns `[]` (the posts table has very few rows and none match `lang=fr`). Unlike `useTools()` and `useCategories()` which initialize state with static fallback data, `usePosts()` initializes with an empty array and has **no fallback** to the local JSON files (`posts-fr.json` / `posts-en.json`).

This is not caused by the LangContext fix — the LangContext works correctly. The root cause is that `usePosts` never had a local fallback, and either the Supabase data was wiped or was never fully seeded.

## Plan

**File: `src/hooks/useSupabaseData.ts`**

1. Import `postsFr` from `@/data/posts-fr.json` and `postsEn` from `@/data/posts-en.json` at the top of the file.

2. In `usePosts(lang)`: after the Supabase query, if the result is empty (either error or `data.length === 0`), fall back to the matching local JSON file. Map the local posts through `mapPost` to normalize the shape.

3. In `usePostBySlug(slug, lang)`: similarly, if Supabase returns no result, look up the post in the local JSON fallback by slug.

This mirrors the existing pattern used by `useToolBySlug` (which already falls back to `staticTools`). No other files are touched.

