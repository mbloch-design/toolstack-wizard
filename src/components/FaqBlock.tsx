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

export default function FaqBlock({
  eyebrow: _eyebrow,
  title,
  description: _description,
  items,
  stats: _stats,
  openCount = 1,
  className = "",
}: FaqBlockProps) {
  return (
    <div className={`mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[340px_1fr] lg:gap-16 ${className}`}>
      <h2 className="font-display text-[clamp(2.3rem,4.2vw,4.2rem)] font-bold leading-[1.02] tracking-tight text-foreground">
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
