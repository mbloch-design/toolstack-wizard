import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FaqItem = {
  question: string;
  answer: string;
  icon?: LucideIcon;
};

type FaqBlockProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: FaqItem[];
  stats?: { value: string; label: string }[];
  openCount?: number;
  className?: string;
};

type FaqSize = "default" | "compact";

export default function FaqBlock({
  eyebrow,
  title,
  description,
  items,
  stats: _stats,
  openCount = 1,
  className = "",
  size = "default",
}: FaqBlockProps & { size?: FaqSize }) {

  /* ── Compact mode: tool detail page ── */
  if (size === "compact") {
    return (
      <div className={`space-y-4 ${className}`}>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-foreground" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
          {title}
        </h2>
        {description && (
          <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}>
            {description}
          </p>
        )}

        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {items.map((item, index) => (
            <details key={`${item.question}-${index}`} className="group bg-card" open={index < openCount}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4">
                <h3 className="text-sm font-semibold leading-snug text-foreground pr-2">
                  {item.question}
                </h3>
                <ChevronDown className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-sm leading-7" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    );
  }

  /* ── Default mode: landing / home page — large editorial layout ── */
  return (
    <div className={`mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[340px_1fr] lg:gap-16 ${className}`}>
      <h2 className="tt-section-title">
        {title}
      </h2>

      <div className="divide-y divide-border border-y border-border lg:border-t-0">
        {items.map((item, index) => {
          return (
            <details key={`${item.question}-${index}`} className="group" open={index < openCount}>
              <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-start gap-6 py-6 md:py-8">
                <h3 className="max-w-3xl text-xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
                  {item.question}
                </h3>
                <span className="mt-1 flex h-8 w-8 items-center justify-center text-foreground transition-colors group-hover:text-primary">
                  <ChevronDown className="h-6 w-6 stroke-[2.2] transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <p className="-mt-3 max-w-3xl pb-8 text-base leading-7 text-muted-foreground md:text-lg">
                {item.answer}
              </p>
            </details>
          );
        })}
      </div>
    </div>
  );
}
