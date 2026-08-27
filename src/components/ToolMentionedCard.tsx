import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";
import { ExternalLink } from "@/lib/icons";
import { Link } from "react-router-dom";

interface ToolMentionedCardProps {
  tool: Tool;
  prefix: string;
  compact?: boolean;
}

/** Small card showing a tool with logo, used in articles */
export function ToolMentionedCard({ tool, prefix, compact }: ToolMentionedCardProps) {
  const slug = tool.slug || tool.id;

  if (compact) {
    return (
      <Link
        to={`${prefix}/tool/${slug}`}
        className="group flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 transition-all hover:border-primary/30 hover:shadow-sm"
      >
        <ToolLogo tool={tool} size={20} />
        <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
          {tool.name}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={`${prefix}/tool/${slug}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <ToolLogo tool={tool} size={36} className="rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">
          {tool.name}
        </p>
        {tool.shortDescription && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {tool.shortDescription}
          </p>
        )}
      </div>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </Link>
  );
}

/** Horizontal strip of tool logos for article thumbnails */
export function ToolLogoStrip({
  tools,
  maxDisplay = 5,
}: {
  tools: Tool[];
  maxDisplay?: number;
}) {
  const display = tools.slice(0, maxDisplay);
  const remaining = tools.length - maxDisplay;

  return (
    <div className="flex items-center -space-x-1.5">
      {display.map((tool) => (
        <div
          key={tool.id}
          className="relative rounded-lg border-2 border-card bg-card shadow-sm"
        >
          <ToolLogo tool={tool} size={28} className="rounded-md" />
        </div>
      ))}
      {remaining > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-card bg-secondary text-[10px] font-bold text-muted-foreground shadow-sm">
          +{remaining}
        </div>
      )}
    </div>
  );
}
