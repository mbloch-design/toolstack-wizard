import { useLang } from "@/hooks/useLang";
import { Check, X, Minus } from "lucide-react";

const DiffTable = ({ toolCount }: { toolCount: number }) => {
  const { t } = useLang();

  const rows = [
    { feature: t("Personnalisé par profil et TJM", "Personalized by profile and daily rate"), tt: true, ann: false, comp: false },
    { feature: t("Détection de doublons dans votre stack", "Duplicate detection in your stack"), tt: true, ann: false, comp: false },
    { feature: t("Économies estimées par outil", "Estimated savings per tool"), tt: true, ann: false, comp: false },
    { feature: t("Indépendant — aucune affiliation", "Independent — no affiliation"), tt: true, ann: false, comp: "partial" as const },
    { feature: "Stack Health Score", tt: true, ann: false, comp: false },
    { feature: t("Base d'outils vérifiés", "Verified tool database"), tt: `${toolCount}+`, ann: "500+", comp: t("variable", "varies") },
  ];

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">

        {/* Header */}
        <div className="mb-10">
          <p className="label-section mb-3">{t("Positionnement", "Positioning")}</p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", fontWeight: 700, letterSpacing: "-0.025em" }}
          >
            {t("Pas un annuaire. ", "Not a directory. ")}
            <span className="text-primary">{t("Un diagnostic.", "A diagnosis.")}</span>
          </h2>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">

          {/* Header row */}
          <div
            className="grid grid-cols-4 border-b border-border px-6 py-4"
            style={{ background: "hsl(var(--card))" }}
          >
            <span className="label-section">{t("Fonctionnalité", "Feature")}</span>
            {/* ToolTrim column — highlighted */}
            <div className="flex flex-col items-center gap-1">
              <span
                className="font-display text-primary"
                style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "-0.01em" }}
              >
                ToolTrim
              </span>
              <span
                className="rounded-full bg-primary/10 px-2 py-0.5"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "hsl(var(--primary))",
                }}
              >
                {t("vous", "you")}
              </span>
            </div>
            <span className="text-center label-section">{t("Annuaires", "Directories")}</span>
            <span className="text-center label-section">{t("Comparateurs", "Comparators")}</span>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-4 items-center border-b border-border last:border-b-0 px-6 py-4 transition-colors duration-100"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--primary) / 0.03)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {row.feature}
              </span>

              {/* ToolTrim */}
              <div className="flex justify-center">
                {typeof row.tt === "string" ? (
                  <span
                    className="font-display text-primary"
                    style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "-0.01em" }}
                  >
                    {row.tt}
                  </span>
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                    <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                  </div>
                )}
              </div>

              {/* Annuaires */}
              <div className="flex justify-center">
                {typeof row.ann === "string" ? (
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}>{row.ann}</span>
                ) : (
                  <X className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground) / 0.2)" }} />
                )}
              </div>

              {/* Comparateurs */}
              <div className="flex justify-center">
                {typeof row.comp === "string" ? (
                  row.comp === "partial" ? (
                    <Minus className="h-4 w-4" style={{ color: "hsl(38 80% 50% / 0.6)" }} />
                  ) : (
                    <span className="text-xs" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}>{row.comp}</span>
                  )
                ) : (
                  <X className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground) / 0.2)" }} />
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
