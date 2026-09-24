import ToolLogo from "@/components/ToolLogo";
import brandColors from "@/data/brandColors.json";
import type { GuideCoveredTool } from "@/lib/toolGuides";

const BRAND = brandColors as Record<string, string>;

/**
 * A guide's visual: its own cover image when it has one, otherwise the tools
 * it covers, each on its brand tint. Shared by the guide page hero and the
 * guides index so an article looks the same everywhere it appears.
 *
 * Variants live in data attributes, not classes: the build emits one critical
 * CSS file per distinct class set, and variant classes multiplied those files.
 */
export default function GuideCover({
  thumbnail,
  tools,
  fallbackImage,
  size = "large",
  eager = false,
  className = "",
}: {
  thumbnail?: string | null;
  tools: GuideCoveredTool[];
  fallbackImage: string;
  size?: "large" | "small";
  eager?: boolean;
  className?: string;
}) {
  if (thumbnail || tools.length === 0) {
    return (
      <div className={`ga-cover-image ${className}`}>
        <img src={thumbnail || fallbackImage} alt="" loading={eager ? "eager" : "lazy"} decoding="async" />
      </div>
    );
  }
  const shown = tools.slice(0, 4);
  const iconSize = size === "large" ? (shown.length === 1 ? 128 : 96) : (shown.length === 1 ? 80 : 56);
  return (
    <div className={`ga-cover ${className}`} data-count={shown.length} data-size={size} aria-hidden="true">
      {shown.map((tool) => (
        <span
          key={tool.slug}
          className="ga-cover-tile"
          style={BRAND[tool.slug] ? { background: `color-mix(in srgb, ${BRAND[tool.slug]} 18%, #FFFFFF)` } : undefined}
        >
          <ToolLogo tool={tool} size={iconSize} className="ga-cover-icon" />
          {size === "large" ? <span className="ga-cover-name">{tool.name}</span> : null}
        </span>
      ))}
    </div>
  );
}
