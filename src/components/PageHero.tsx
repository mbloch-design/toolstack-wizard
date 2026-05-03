import type { ReactNode } from "react";
import Breadcrumb from "@/components/Breadcrumb";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type HeroStat = {
  icon?: ReactNode;
  value: ReactNode;
  label: ReactNode;
  tone?: "default" | "primary" | "positive";
};

interface PageHeroProps {
  breadcrumb: BreadcrumbItem[];
  eyebrow: string;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  stats?: HeroStat[];
  children?: ReactNode;
  maxWidth?: "normal" | "narrow" | "article" | "wide" | "xl";
}

export default function PageHero({
  breadcrumb,
  eyebrow,
  icon,
  title,
  description,
  actions,
  stats,
  children,
  maxWidth = "normal",
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(hsl(var(--border) / 0.72) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 100% 90% at 50% 0%, black 18%, transparent 82%)",
          WebkitMaskImage: "radial-gradient(ellipse 100% 90% at 50% 0%, black 18%, transparent 82%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--primary) / 0.06) 0%, transparent 48%), radial-gradient(ellipse 70% 55% at 0% 0%, hsl(var(--primary) / 0.08) 0%, transparent 62%)",
        }}
      />

      <div className={`relative mx-auto px-6 py-10 md:py-14 ${
        maxWidth === "narrow"
          ? "max-w-4xl"
          : maxWidth === "article"
            ? "max-w-7xl"
            : maxWidth === "wide"
              ? "max-w-[103rem]"
              : maxWidth === "xl"
                ? "max-w-7xl"
              : "max-w-7xl"
      }`}>
        <div className="mb-5">
          <Breadcrumb items={breadcrumb} />
        </div>

        <div className={maxWidth === "article" ? "max-w-3xl lg:ml-[260px]" : maxWidth === "wide" || maxWidth === "xl" ? "max-w-4xl" : "max-w-3xl"}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
            {icon}
            {eyebrow}
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.06] tracking-[-0.035em] text-foreground md:text-6xl">
            {title}
          </h1>

          {description && (
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              {description}
            </p>
          )}

          {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}

          {stats && stats.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {stats.map((stat, index) => (
                <div key={index} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm">
                  {stat.icon}
                  <span
                    className={
                      stat.tone === "primary"
                        ? "font-semibold text-primary"
                        : stat.tone === "positive"
                          ? "font-semibold text-keep"
                          : "font-semibold text-foreground"
                    }
                  >
                    {stat.value}
                  </span>
                  <span className="text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {children && (
          <div className={maxWidth === "article" ? "mt-8 max-w-3xl lg:ml-[260px]" : "mt-8"}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
