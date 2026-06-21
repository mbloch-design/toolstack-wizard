import { Link } from "react-router-dom";
import type { Tool, Category } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";
import { Check } from "lucide-react";
import { formatPriceLabel } from "@/lib/toolUtils";

interface Props {
  tool: Tool;
  category: Category | undefined;
  alternatives: Tool[];
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
}

/**
 * Alternative cards: description + top pro + price, complementing the
 * comparison table above (which owns the shared heading/intro/category
 * link — this just adds the card grid for each alternative).
 */
export default function ToolAlternativesSection({ tool, alternatives, prefix, lang, t }: Props) {
  if (alternatives.length === 0) return null;

  const freeAlts = alternatives.filter(a => a.defaultMonthlyPrice === 0);
  const cheaperAlts = alternatives.filter(a => a.defaultMonthlyPrice > 0 && a.defaultMonthlyPrice < tool.defaultMonthlyPrice);

  return (
    <section className="space-y-4">
      {/* Semantic sub-links for internal linking */}
      {(freeAlts.length > 0 || cheaperAlts.length > 0) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {freeAlts.length > 0 && (
            <span className="rounded-full bg-keep/10 text-keep px-3 py-1 font-medium">
              {freeAlts.length} {t("alternatives gratuites", "free alternatives")}
            </span>
          )}
          {cheaperAlts.length > 0 && (
            <span className="rounded-full bg-optimize/10 text-optimize px-3 py-1 font-medium">
              {cheaperAlts.length} {t("alternatives moins chères", "cheaper alternatives")}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {alternatives.map((alt) => (
          <Link key={alt.id} to={`${prefix}/tool/${alt.slug}`}
            className="group rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
            <div className="flex items-start gap-3">
              <ToolLogo tool={alt} size={32} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold group-hover:text-primary truncate">{alt.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatPriceLabel(alt, alt.defaultMonthlyPrice, t)}
                  {alt.defaultMonthlyPrice < tool.defaultMonthlyPrice && alt.defaultMonthlyPrice > 0 && (
                    <span className="ml-1 text-keep">
                      (−{Math.round(tool.defaultMonthlyPrice - alt.defaultMonthlyPrice)}€)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {lang === "en" && alt.shortDescriptionEn ? alt.shortDescriptionEn : alt.shortDescription}
            </p>
            {alt.pros?.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-keep">
                <Check className="h-3 w-3" /> {lang === "en" && alt.prosEn?.[0] ? alt.prosEn[0] : alt.pros[0]}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
