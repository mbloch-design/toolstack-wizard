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
    <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Semantic sub-links for internal linking */}
      {(freeAlts.length > 0 || cheaperAlts.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {freeAlts.length > 0 && (
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted)" }}>
              <strong style={{ color: "hsl(var(--keep))" }}>{freeAlts.length}</strong> {t("alternatives gratuites", "free alternatives")}
            </span>
          )}
          {cheaperAlts.length > 0 && (
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted)" }}>
              <strong style={{ color: "hsl(var(--optimize))" }}>{cheaperAlts.length}</strong> {t("alternatives moins chères", "cheaper alternatives")}
            </span>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {alternatives.map((alt) => (
          <Link
            key={alt.id}
            to={`${prefix}/tool/${alt.slug}`}
            className="td-tile"
            style={{ alignItems: "flex-start" }}
          >
            <ToolLogo tool={alt} size={32} className="rounded-lg shrink-0" />
            <div className="td-tile-body">
              <p className="td-tile-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {alt.name}
              </p>
              <p className="td-tile-sub" style={{ whiteSpace: "normal", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {lang === "en" && alt.shortDescriptionEn ? alt.shortDescriptionEn : alt.shortDescription}
              </p>
              <p style={{ marginTop: 6, fontFamily: "var(--font-mono, ui-monospace)", fontSize: 11, color: "var(--color-muted)" }}>
                {formatPriceLabel(alt, alt.defaultMonthlyPrice, t)}
                {alt.defaultMonthlyPrice < tool.defaultMonthlyPrice && alt.defaultMonthlyPrice > 0 && (
                  <span style={{ marginLeft: 4, color: "hsl(var(--keep))" }}>
                    (−{Math.round(tool.defaultMonthlyPrice - alt.defaultMonthlyPrice)}€)
                  </span>
                )}
              </p>
              {alt.pros?.length > 0 && (
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-ui)", fontSize: 12, color: "hsl(var(--keep))" }}>
                  <Check style={{ width: 12, height: 12, flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {lang === "en" && alt.prosEn?.[0] ? alt.prosEn[0] : alt.pros[0]}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
