import { useState } from "react";
import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";

/**
 * Shared cover-image panel for every tool card on the site (ToolCard,
 * ToolCardEditorial, homepage featured/AI carousels): OG image when the
 * tool has one, otherwise a centered logo on the same panel background —
 * so the shape stays identical whether or not a screenshot exists yet.
 */
export default function ToolCardImage({ tool, logoSize = 40, className = "" }: {
  tool: Tool;
  logoSize?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = tool.ogImageUrl;
  const showImage = !!src && !failed;

  return (
    <div className={`tc-image${className ? ` ${className}` : ""}`}>
      {showImage ? (
        <img src={src as string} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="tc-image-fallback">
          <ToolLogo tool={tool} size={logoSize} />
        </div>
      )}
    </div>
  );
}
