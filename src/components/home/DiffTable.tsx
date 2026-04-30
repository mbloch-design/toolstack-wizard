import { useLang } from "@/hooks/useLang";
import { Check, X, Minus } from "lucide-react";

const DiffTable = ({ toolCount }: { toolCount: number }) => {
  const { t } = useLang();

  const rows = [
    { feature: t("Personnalisé par profil et TJM", "Personalized by profile and daily rate"), tt: true, ann: false, comp: false },
    { feature: t("Détection de doublons dans votre stack", "Duplicate detection in your stack"), tt: true, ann: false, comp: false },
    { feature: t("Économies estimées par outil", "Estimated savings per tool"), tt: true, ann: false, comp: false },
    { feature: t("Indépendant (pas d'affiliation)", "Independent (no affiliate)"), tt: true, ann: false, comp: "partial" as const },
    { feature: "Stack Health Score", tt: true, ann: false, comp: false },
    { feature: t("Base d'outils", "Tool database"), tt: `${toolCount}+`, ann: "500+", comp: "varies" },
  ];

  return (
    <section className="border-t border-border py-24 px-6">
      <div className="mx-auto max-w-6xl">

        <p className="label-section mb-3">{t("Positionnement", "Positioning")}</p>
        <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.6rem)", fontWeight: 600, letterSpacing: "-0.022em" }}>
          {t("Pas un annuaire. ", "Not a directory. ")}
          <em className="text-primary not-italic">{t("Un diagnostic.", "A diagnosis.")}</em>
        </h2>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border/40">
          {/* Header */}
          <div className="grid grid-cols-4 border-b border-border/40 px-5 py-3.5" style={{ background: "hsl(var(--secondary) / 0.5)" }}>
            <span className="label-section">{t("Fonctionnalité", "Feature")}</span>
            <span className="text-center text-xs font-semibold text-primary">ToolTrim</span>
            <span className="text-center label-section opacity-50">{t("Annuaires", "Directories")}</span>
            <span className="text-center label-section opacity-50">{t("Comparateurs", "Comparators")}</span>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-4 items-center border-b border-border/30 px-5 py-3.5 last:border-b-0 transition-colors duration-150 hover:bg-primary/3"
              style={{ transition: "background 150ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(224 76% 60% / 0.03)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{row.feature}</span>
              <div className="flex justify-center">
                {typeof row.tt === "string" ? (
                  <span className="text-xs font-semibold text-primary">{row.tt}</span>
                ) : (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex justify-center">
                {typeof row.ann === "string" ? (
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}>{row.ann}</span>
                ) : (
                  <X className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground) / 0.25)" }} />
                )}
              </div>
              <div className="flex justify-center">
                {typeof row.comp === "string" ? (
                  row.comp === "partial" ? (
                    <Minus className="h-4 w-4 text-amber-500/60" />
                  ) : (
                    <span className="text-xs" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}>{row.comp}</span>
                  )
                ) : (
                  <X className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground) / 0.25)" }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DiffTable;
