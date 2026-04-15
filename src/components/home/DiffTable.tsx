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
    <section className="border-t border-border py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary mb-2">
          {t("Positionnement", "Positioning")}
        </p>
        <h2 className="text-4xl font-extrabold tracking-[-1.5px] md:text-[44px]">
          {t("Pas un annuaire. ", "Not a directory. ")}<em className="text-primary italic">{t("Un diagnostic.", "A diagnosis.")}</em>
        </h2>

        <div className="mt-10 overflow-hidden rounded-xl border border-border">
          {/* Header */}
          <div className="grid grid-cols-4 border-b border-border bg-secondary/50 px-5 py-3.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
              {t("Fonctionnalité", "Feature")}
            </span>
            <span className="text-center text-xs font-semibold text-primary">ToolTrim</span>
            <span className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground/40">
              {t("Annuaires", "Directories")}
            </span>
            <span className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground/40">
              {t("Comparateurs", "Comparators")}
            </span>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-4 items-center border-b border-border px-5 py-3.5 last:border-b-0 transition-colors hover:bg-secondary/30"
            >
              <span className="text-[13px] text-muted-foreground">{row.feature}</span>
              <div className="flex justify-center">
                {typeof row.tt === "string" ? (
                  <span className="text-xs font-semibold text-primary">{row.tt}</span>
                ) : (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex justify-center">
                {typeof row.ann === "string" ? (
                  <span className="text-xs text-muted-foreground/40">{row.ann}</span>
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/25" />
                )}
              </div>
              <div className="flex justify-center">
                {typeof row.comp === "string" ? (
                  row.comp === "partial" ? (
                    <Minus className="h-4 w-4 text-amber-500/60" />
                  ) : (
                    <span className="text-xs text-muted-foreground/40">{row.comp}</span>
                  )
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/25" />
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
