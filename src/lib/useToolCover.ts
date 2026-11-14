import { useEffect, useMemo, useRef, useState } from "react";
import type { Tool } from "@/data/types";
import { isToolCoverBlocked } from "@/lib/toolImageBlocklist";
import cardThumbs from "@/data/cardThumbs.json";

/** Light thumbnails (720 px WebP on Cloudflare R2, scripts/card-thumbs.ts), when the site knows where they live. */
const THUMBS_BASE = (import.meta.env.VITE_CARD_THUMBS_BASE as string | undefined)?.replace(/\/$/, "") || "";
const THUMBS = cardThumbs as Record<string, string>;
// Only worth a preconnect when the thumbnails live on another host (in production they come through /thumbs on
// the site's own domain, vercel.json); a relative base has no origin of its own.
export const CARD_THUMBS_ORIGIN = /^https?:\/\//.test(THUMBS_BASE) && typeof location !== "undefined" && new URL(THUMBS_BASE).origin !== location.origin
  ? new URL(THUMBS_BASE).origin : "";

export type ToolCoverTool = Pick<Tool, "name"> & Partial<Pick<Tool, "id" | "slug" | "websiteUrl" | "affiliateLink" | "logo" | "ogImageUrl">>;

export type CardImageQuality = "curated" | "og" | "fallback";

function normalizeCardImageUrl(value?: string | null): { src: string; quality: Exclude<CardImageQuality, "fallback"> } | null {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw, "https://tooltrim.com");
    if (url.hostname === "tooltrim.com" || url.hostname === "www.tooltrim.com") {
      const pathname = url.pathname.startsWith("/public/") ? url.pathname.slice(7) : url.pathname;
      return {
        src: `${pathname}${url.search}`,
        quality: pathname.startsWith("/og-screenshots/") ? "curated" : "og",
      };
    }
    return { src: url.href, quality: "og" };
  } catch {
    return null;
  }
}

/**
 * Which picture stands for a tool: its curated screenshot or OG image, unless blocklisted (bot check,
 * parked domain, blank page), too small or broken; then the logo. Shared by every cover on the site.
 */
export function useToolCover(tool: ToolCoverTool) {
  const blocked = isToolCoverBlocked(tool);
  const resolved = useMemo(() => (blocked ? null : normalizeCardImageUrl(tool.ogImageUrl)), [blocked, tool.ogImageUrl]);
  const thumb = THUMBS_BASE && resolved ? THUMBS[tool.slug || tool.id || ""] : undefined;
  // The thumbnail first; if it does not answer, the original screenshot; then the logo.
  const [thumbFailed, setThumbFailed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const showImage = Boolean(resolved && !failed);
  const quality: CardImageQuality = showImage && resolved ? resolved.quality : "fallback";
  const loading = showImage && !loaded;
  const check = (image: HTMLImageElement) => { if (image.naturalWidth < 320 || image.naturalHeight < 160) setFailed(true); else setLoaded(true); };

  useEffect(() => { setFailed(false); setThumbFailed(false); setLoaded(false); }, [resolved?.src]);
  // A cached (or lazily loaded) image can be complete before React attaches onLoad,
  // which would leave the cover stuck in its loading state.
  useEffect(() => {
    if (!resolved || loaded || failed) return;
    const image = imgRef.current;
    if (image?.complete) check(image);
  }, [resolved, loaded, failed]);

  const usingThumb = Boolean(thumb) && !thumbFailed;
  return { src: showImage ? (usingThumb ? `${THUMBS_BASE}/${thumb}` : resolved?.src) : undefined,
    // The 360 px sibling of the thumbnail (scripts/card-thumbs.ts): srcset for 1x screens and the card's glow.
    srcSmall: showImage && usingThumb ? `${THUMBS_BASE}/${thumb!.replace(/\.webp$/, "-360.webp")}` : undefined,
    quality, loading, imgRef,
    onLoad: (event: React.SyntheticEvent<HTMLImageElement>) => check(event.currentTarget),
    onError: () => { if (usingThumb) setThumbFailed(true); else setFailed(true); setLoaded(false); } };
}
