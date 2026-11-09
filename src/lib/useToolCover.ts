import { useEffect, useMemo, useRef, useState } from "react";
import type { Tool } from "@/data/types";
import { isToolCoverBlocked } from "@/lib/toolImageBlocklist";

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
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const showImage = Boolean(resolved && !failed);
  const quality: CardImageQuality = showImage && resolved ? resolved.quality : "fallback";
  const loading = showImage && !loaded;
  const check = (image: HTMLImageElement) => { if (image.naturalWidth < 320 || image.naturalHeight < 160) setFailed(true); else setLoaded(true); };

  useEffect(() => { setFailed(false); setLoaded(false); }, [resolved?.src]);
  // A cached (or lazily loaded) image can be complete before React attaches onLoad,
  // which would leave the cover stuck in its loading state.
  useEffect(() => {
    if (!resolved || loaded || failed) return;
    const image = imgRef.current;
    if (image?.complete) check(image);
  }, [resolved, loaded, failed]);

  return { src: showImage ? resolved?.src : undefined, quality, loading, imgRef,
    onLoad: (event: React.SyntheticEvent<HTMLImageElement>) => check(event.currentTarget),
    onError: () => { setFailed(true); setLoaded(false); } };
}
