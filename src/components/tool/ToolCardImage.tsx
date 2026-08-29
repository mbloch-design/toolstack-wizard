import { useEffect, useMemo, useState } from "react";
import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";

type ToolCardImageTool = Pick<Tool, "name"> & Partial<Pick<Tool, "id" | "slug" | "websiteUrl" | "affiliateLink" | "logo" | "ogImageUrl">>;

type CardImageQuality = "curated" | "og" | "fallback";

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
 * Shared cover-image panel for every tool card on the site (ToolCard,
 * ToolCardEditorial, homepage featured/AI carousels): OG image when the
 * tool has one, otherwise a centered logo on the same panel background —
 * so the shape stays identical whether or not a screenshot exists yet.
 */
export default function ToolCardImage({ tool, logoSize = 40, className = "", overlay, overlayMode = "hover" }: {
  tool: ToolCardImageTool;
  logoSize?: number;
  className?: string;
  /** Optional content absolutely-positioned over the image, revealed by the
   *  consumer's own hover/focus state (e.g. ToolCardEditorial's description
   *  + CTA) — keeps hover-only info from ever changing the card's height. */
  overlay?: React.ReactNode;
  /** Hover overlays carry explanatory copy. Static overlays are reserved for
   * short, factual chips such as price or editorial status. */
  overlayMode?: "hover" | "static";
}) {
  const resolved = useMemo(() => normalizeCardImageUrl(tool.ogImageUrl), [tool.ogImageUrl]);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showImage = Boolean(resolved && !failed);
  const quality: CardImageQuality = showImage && resolved ? resolved.quality : "fallback";
  const loading = showImage && !loaded;

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [resolved?.src]);

  return (
    <div
      className={`tc-image tc-image--${quality}${loading ? " is-loading" : ""}${className ? ` ${className}` : ""}`}
      data-image-quality={quality}
      data-image-state={loading ? "loading" : quality === "fallback" ? "fallback" : "ready"}
    >
      {showImage ? (
        <img
          src={resolved?.src}
          alt={`${tool.name} — aperçu`}
          loading="lazy"
          decoding="async"
          width={800}
          height={420}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth < 320 || image.naturalHeight < 160) {
              setFailed(true);
              return;
            }
            setLoaded(true);
          }}
          onError={() => {
            setFailed(true);
            setLoaded(false);
          }}
        />
      ) : (
        <div className="tc-image-fallback">
          <ToolLogo tool={tool} size={logoSize} />
        </div>
      )}
      {overlay && <div className={`tc-image-overlay tc-image-overlay--${overlayMode}`}>{overlay}</div>}
    </div>
  );
}
