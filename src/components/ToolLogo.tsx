import type { Tool } from "@/data/types";
import { useState } from "react";

type LogoTool = Pick<Tool, "name" | "websiteUrl" | "affiliateLink">;

interface ToolLogoProps {
  tool: LogoTool;
  size?: number;
  className?: string;
}

/** Extract domain from a URL for Google favicon */
function getLogoUrl(tool: LogoTool): string | null {
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return null;
  try {
    const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

const ToolLogo = ({ tool, size = 32, className = "" }: ToolLogoProps) => {
  const [failed, setFailed] = useState(false);
  const logoUrl = getLogoUrl(tool);

  if (!logoUrl || failed) {
    // Fallback: first letter in a colored circle — fixed size to prevent CLS
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        aria-hidden="true"
      >
        {(tool.name ?? "?").charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`Logo ${tool.name}`}
      width={size}
      height={size}
      loading="lazy"
      fetchPriority="low"
      className={`shrink-0 rounded-lg object-contain ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      onError={() => setFailed(true)}
    />
  );
};

export default ToolLogo;
