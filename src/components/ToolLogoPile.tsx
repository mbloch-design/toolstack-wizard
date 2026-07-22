import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";

type LogoPileTool = Pick<Tool, "name"> & Partial<Pick<Tool, "id" | "slug" | "websiteUrl" | "affiliateLink" | "logo">>;

interface ToolLogoPileProps {
  tools: Array<LogoPileTool | null | undefined>;
  totalCount?: number;
  max?: number;
  size?: "sm" | "md";
  ariaLabel: string;
  moreLabel?: (count: number) => string;
  className?: string;
}

/**
 * Shared compact avatar pile for non-interactive product-logo summaries.
 * Individual tools remain identifiable through their title while the final
 * circle reports tools that do not fit in the visible pile.
 */
export default function ToolLogoPile({
  tools,
  totalCount,
  max = 5,
  size = "md",
  ariaLabel,
  moreLabel,
  className = "",
}: ToolLogoPileProps) {
  const resolved = tools.filter((tool): tool is LogoPileTool => Boolean(tool));
  const visible = resolved.slice(0, max);
  const remaining = Math.max(0, (totalCount ?? resolved.length) - visible.length);
  const logoSize = size === "sm" ? 24 : 30;

  if (visible.length === 0 && remaining === 0) return null;

  return (
    <div className={`tlp tlp--${size}${className ? ` ${className}` : ""}`} role="list" aria-label={ariaLabel}>
      {visible.map((tool, index) => (
        <span
          key={tool.slug || tool.id || `${tool.name}-${index}`}
          className="tlp-item"
          role="listitem"
          title={tool.name}
        >
          <ToolLogo tool={tool} size={logoSize} className="tlp-mark" />
        </span>
      ))}
      {remaining > 0 && (
        <span className="tlp-item tlp-more" role="listitem" aria-label={moreLabel?.(remaining) ?? `${remaining} more tools`}>
          +{remaining}
        </span>
      )}
    </div>
  );
}
