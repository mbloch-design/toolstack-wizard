import ToolLogo from "@/components/ToolLogo";
import { useToolCover, type ToolCoverTool } from "@/lib/useToolCover";

/**
 * Shared cover-image panel for every tool card on the site (ToolCard,
 * ToolCardEditorial, homepage featured/AI carousels): OG image when the
 * tool has one, otherwise a centered logo on the same panel background —
 * so the shape stays identical whether or not a screenshot exists yet.
 */
export default function ToolCardImage({ tool, logoSize = 40, className = "", overlay, overlayMode = "hover", allowRemoteLogoSources = true }: {
  tool: ToolCoverTool;
  logoSize?: number;
  className?: string;
  allowRemoteLogoSources?: boolean;
  /** Optional content absolutely-positioned over the image, revealed by the
   *  consumer's own hover/focus state (e.g. ToolCardEditorial's description
   *  + CTA) — keeps hover-only info from ever changing the card's height. */
  overlay?: React.ReactNode;
  /** Hover overlays carry explanatory copy. Static overlays are reserved for
   * short, factual chips such as price or editorial status. */
  overlayMode?: "hover" | "static";
}) {
  const { src, quality, loading, imgRef, onLoad, onError } = useToolCover(tool);

  return (
    <div
      className={`tc-image tc-image--${quality}${loading ? " is-loading" : ""}${className ? ` ${className}` : ""}`}
      data-image-quality={quality}
      data-image-state={loading ? "loading" : quality === "fallback" ? "fallback" : "ready"}
    >
      {src ? (
        <img
          ref={imgRef}
          src={src}
          alt={`${tool.name} — aperçu`}
          loading="lazy"
          decoding="async"
          width={800}
          height={420}
          onLoad={onLoad}
          onError={onError}
        />
      ) : (
        <div className="tc-image-fallback">
          <ToolLogo tool={tool} size={logoSize} allowRemoteSources={allowRemoteLogoSources} />
        </div>
      )}
      {overlay && <div className={`tc-image-overlay tc-image-overlay--${overlayMode}`}>{overlay}</div>}
    </div>
  );
}
