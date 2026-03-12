import type { Tool } from "@/data/types";
import { useState } from "react";

interface ToolLogoProps {
  tool: Tool;
  size?: number;
  className?: string;
}

/** Extract domain from a URL for Clearbit logo */
function getLogoUrl(tool: Tool): string | null {
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return null;
  try {
    const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
    return `https://logo.clearbit.com/${domain}`;
  } catch {
    return null;
  }
}

const ToolLogo = ({ tool, size = 32, className = "" }: ToolLogoProps) => {
  const [failed, setFailed] = useState(false);
  const logoUrl = getLogoUrl(tool);

  if (!logoUrl || failed) {
    // Fallback: first letter in a colored circle
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        {tool.name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${tool.name} logo`}
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 rounded-lg object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
};

export default ToolLogo;
