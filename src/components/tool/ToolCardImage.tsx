import { useState } from "react";
import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";

type ToolCardImageTool = Pick<Tool, "name"> & Partial<Pick<Tool, "id" | "slug" | "websiteUrl" | "affiliateLink" | "logo" | "ogImageUrl">>;

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
  const [failed, setFailed] = useState(false);
  const src = tool.ogImageUrl;
  const showImage = !!src && !failed;

  return (
    <div className={`tc-image${className ? ` ${className}` : ""}`}>
      {showImage ? (
        <img src={src as string} alt={`${tool.name} — aperçu`} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="tc-image-fallback">
          <ToolLogo tool={tool} size={logoSize} />
        </div>
      )}
      {overlay && <div className={`tc-image-overlay tc-image-overlay--${overlayMode}`}>{overlay}</div>}
    </div>
  );
}
