

## Conflict to surface first

The project memory `mem://features/seo/infrastructure` states: **"unified on www.tooltrim.io with 301 redirects"**. Items #1 and #4 of your request flip this to bare `tooltrim.io`. Acting on them will:
- Break the canonical convention site-wide (sitemap, JSON-LD, ~13 files all use `www.tooltrim.io`)
- Mismatch with hosting-level 301 (apex → www) and split signals during transition
- Force an update of `SEO_BASE`, the sitemap edge function, vite.config prerender, and ~10 page files — not "1 line"

**Recommendation**: keep `www.tooltrim.io` everywhere (industry standard, already coherent). Only items #2, #3, #5, and OG image refresh are clean wins. I'll ask before touching the domain.

## Plan (pending domain confirmation)

### 1. `<html lang>` dynamic (item #2) — already done ✅
`DynamicCanonical.tsx` line 44 already sets `<html lang={isEn ? "en" : "fr"} />` via Helmet. No change needed — will verify in preview that `/en/*` actually renders `lang="en"`.

### 2. Clean `index.html` (item #3)
Remove from static `<head>`:
- `og:title`, `og:description` (route-injected by `setSeoTags`)
- `og:url` (injected by `DynamicCanonical`)
- `twitter:title`, `twitter:description` (route-injected)

Keep: `og:type`, `og:image` (fallback for crawlers before JS), `og:locale`, `og:site_name`, `twitter:card`, `twitter:site`, `twitter:image`. These are safe defaults overwritten per route.

### 3. `og:url` per route (item #1)
Already correct — `DynamicCanonical` injects `<meta property="og:url" content={canonical} />` from current `pathname`. Will only swap base URL if you choose bare-domain.

### 4. `public/llms-full.txt` (item #5)
Generate from `src/data/tools_v10.json`. Top 50 tools selected by presence of verified `pricing_v5` then `defaultMonthlyPriceEUR`. Format (plain text wrapping JSON, per llms.txt convention):

```
# ToolTrim — Top 50 tools (verified pricing)
# Last verified: 2026-03-29
# Source: https://www.tooltrim.com

[
  {"name":"ChatGPT","slug":"chatgpt","price":20,"currency":"EUR","verdict":"keep","verified":"2026-03-29"},
  ...
]
```
Fields per tool: `name`, `slug`, `price`, `currency`, `verdict` (derived from `prescription_quality`), `verified`. Will reference it from `public/llms.txt` (already mentions this URL).

### 5. OG image PNG (item #6)
I cannot generate a real PNG in plan mode, but in default mode I will:
- Render the existing `og-image.svg` to `public/og-image.png` at 1200×630 via ImageMagick/sharp
- Update `OG_IMAGE` in `src/lib/seo.ts` → `https://[domain]/og-image.png`
- Update `index.html` OG/Twitter image refs (currently point to `picto-logo.svg`) → `og-image.png`
- Leave `picto-logo.svg` for `<link rel="icon">` only

### 6. `robots.txt` Sitemap line (item #4)
Only flip to bare domain if you confirm the domain switch. Otherwise keep `www`.

## Files touched
- `index.html` — remove duplicate OG/Twitter title+desc+url, swap image
- `src/lib/seo.ts` — OG_IMAGE → `.png` (and SEO_BASE only if confirmed)
- `public/og-image.png` — new (rendered from SVG)
- `public/llms-full.txt` — new
- `public/robots.txt` — only if domain switch confirmed

## Question before executing
The bare-domain switch (items #1 and #4) contradicts the established `www` canonical strategy. Which do you want?

**Option A (recommended)**: keep `www.tooltrim.io` everywhere. Skip items #1 and #4. Do items #2, #3, #5, #6.

**Option B**: full switch to bare `tooltrim.io`. I'll update `SEO_BASE`, sitemap function, vite.config prerender, all 10+ page files, robots.txt, and verify the apex→www 301 is removed/inverted at hosting level (you'll need to handle that part).

Confirm A or B and I execute.

