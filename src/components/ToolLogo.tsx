import type { Tool } from "@/data/types";
import { useEffect, useMemo, useState } from "react";
import { getToolLogoSources } from "@/lib/toolLogos";

type LogoTool = Pick<Tool, "name"> & Partial<Pick<Tool, "id" | "slug" | "websiteUrl" | "affiliateLink" | "logo">>;

interface ToolLogoProps {
  tool: LogoTool;
  size?: number;
  className?: string;
  /** Above-the-fold logos (e.g. page hero) load eagerly for a faster LCP. */
  eager?: boolean;
}

const ToolLogo = ({ tool, size = 32, className = "", eager = false }: ToolLogoProps) => {
  const sources = useMemo(() => getToolLogoSources(tool, size <= 32 ? 32 : size <= 64 ? 64 : 128), [tool, size]);
  const sourceKey = sources.join("|");
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[sourceIndex];

  useEffect(() => {
    setSourceIndex(0);
  }, [sourceKey]);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className={`shrink-0 rounded-lg bg-card object-contain ring-1 ring-border/50 ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size, padding: Math.max(2, Math.round(size * 0.14)) }}
        onError={() => setSourceIndex((index) => index + 1)}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-hidden="true"
    >
      {(tool.name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
};

export default ToolLogo;
