import { useState, useCallback } from "react";
import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface ToolRow {
  name: string;
  emoji: string;
  price: number;
  verdict: "keep" | "cut" | "swap";
}

const DEMO_TOOLS: ToolRow[] = [
  { name: "Notion", emoji: "📝", price: 16, verdict: "keep" },
  { name: "Coda", emoji: "📋", price: 14, verdict: "cut" },
  { name: "Zapier", emoji: "⚡", price: 49, verdict: "swap" },
  { name: "Figma Pro", emoji: "🎨", price: 15, verdict: "keep" },
  { name: "Loom", emoji: "🎬", price: 12, verdict: "cut" },
];

const VERDICT_CONFIG = {
  keep: {
    label: { fr: "Garder ✓", en: "Keep ✓" },
    rowClass: "border-keep/30 bg-keep/5",
    badgeClass: "bg-keep/10 text-keep",
  },
  cut: {
    label: { fr: "Couper ✗", en: "Cut ✗" },
    rowClass: "border-destructive/30 bg-destructive/5",
    badgeClass: "bg-destructive/10 text-destructive",
  },
  swap: {
    label: { fr: "Swapper →", en: "Swap →" },
    rowClass: "border-amber-500/30 bg-amber-500/5",
    badgeClass: "bg-amber-500/10 text-amber-500",
  },
};

const ScannerDemo = () => {
  const { lang, t, prefix } = useLang();
  const [scanning, setScanning] = useState(false);
  const [scannedIndex, setScannedIndex] = useState(-1);
  const [done, setDone] = useState(false);

  const runScan = useCallback(() => {
    if (scanning) return;
    setScanning(true);
    setScannedIndex(-1);
    setDone(false);

    DEMO_TOOLS.forEach((_, i) => {
      setTimeout(() => {
        setScannedIndex(i);
        if (i === DEMO_TOOLS.length - 1) {
          setTimeout(() => {
            setDone(true);
            setScanning(false);
          }, 400);
        }
      }, (i + 1) * 600);
    });
  }, [scanning]);

  const progress = scanning || done
    ? Math.round(((scannedIndex + 1) / DEMO_TOOLS.length) * 100)
    : 0;

  return (
    <section className="py-20 px-6">
      <div className="mx-auto grid max-w-[1100px] items-center gap-16 md:grid-cols-2">
        {/* Copy */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary mb-4">
            {t("Démo interactive", "Interactive demo")}
          </p>
          <h2 className="text-4xl font-bold tracking-[-1.5px] leading-tight">
            {t(
              <>Voyez ce que l'analyse <span className="text-muted-foreground/25">fait vraiment</span></>,
              <>See what the analysis <span className="text-muted-foreground/25">really does</span></>
            )}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground/60">
            {t(
              "Pas un score générique. Une lecture outil par outil, calibrée sur votre profil.",
              "Not a generic score. A tool-by-tool reading, calibrated on your profile."
            )}
          </p>
          <div className="mt-7 flex flex-col gap-3">
            {[
              t(
                <><strong className="font-medium text-muted-foreground">Détection de doublons</strong> — si deux outils couvrent les mêmes fonctions, l'un est en trop.</>,
                <><strong className="font-medium text-muted-foreground">Duplicate detection</strong> — if two tools cover the same functions, one is redundant.</>
              ),
              t(
                <><strong className="font-medium text-muted-foreground">ROI relatif à votre TJM</strong> — 49€/mois pèse différemment selon votre chiffre d'affaires.</>,
                <><strong className="font-medium text-muted-foreground">ROI relative to your rate</strong> — €49/mo weighs differently depending on your revenue.</>
              ),
              t(
                <><strong className="font-medium text-muted-foreground">Alternatives gratuites</strong> — pour chaque outil flaggé, une option concrète.</>,
                <><strong className="font-medium text-muted-foreground">Free alternatives</strong> — for every flagged tool, a concrete option.</>
              ),
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[13px] text-muted-foreground/60">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scanner card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
          {/* Mac title bar */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-keep/60" />
            <span className="mx-auto text-xs text-muted-foreground/40">ToolTrim — Stack Scanner</span>
          </div>

          <div className="p-5">
            {/* Tool rows */}
            <div className="flex flex-col gap-2">
              {DEMO_TOOLS.map((tool, i) => {
                const isScanned = scannedIndex >= i;
                const isScanning = scannedIndex === i - 1 && scanning;
                const config = VERDICT_CONFIG[tool.verdict];

                return (
                  <div
                    key={tool.name}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] transition-all duration-300 ${
                      isScanned
                        ? config.rowClass
                        : isScanning
                        ? "border-primary bg-primary/5"
                        : "border-border bg-secondary/50"
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-sm">
                      {tool.emoji}
                    </span>
                    <span className="flex-1 font-medium text-muted-foreground">{tool.name}</span>
                    <span className="text-xs text-muted-foreground/40">{tool.price}€/m</span>
                    <span
                      className={`ml-auto rounded px-2 py-0.5 text-[11px] font-medium transition-all duration-300 ${
                        isScanned ? config.badgeClass : "bg-secondary text-muted-foreground/30"
                      }`}
                    >
                      {isScanned ? config.label[lang as "fr" | "en"] || config.label.fr : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress */}
            <div className="mt-4 border-t border-border pt-4">
              <div className="h-0.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2.5 flex justify-between text-[11px] text-muted-foreground/40">
                <span>
                  {scanning
                    ? t("Analyse en cours…", "Analyzing…")
                    : done
                    ? t("Analyse terminée", "Analysis complete")
                    : t("Prêt à analyser", "Ready to analyze")}
                </span>
                <span>{progress}%</span>
              </div>
            </div>

            {/* Summary */}
            {done && (
              <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 animate-in fade-in duration-300">
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("Outils à conserver", "Tools to keep")}</span>
                    <span className="text-keep font-medium">2 ✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("À couper (doublons)", "To cut (duplicates)")}</span>
                    <span className="text-destructive">2 — {t("économie", "savings")} 26€/m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("À swapper", "To swap")}</span>
                    <span className="text-amber-500">1 — {t("économie", "savings")} 39€/m</span>
                  </div>
                  <div className="flex justify-between border-t border-primary/20 pt-2 font-semibold">
                    <span className="text-muted-foreground">{t("Économie annuelle estimée", "Estimated annual savings")}</span>
                    <span className="text-primary">780€/{t("an", "yr")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scan button */}
            <button
              onClick={done ? undefined : runScan}
              disabled={scanning}
              className={`mt-3.5 w-full rounded-lg py-2.5 text-[13px] font-semibold transition-all ${
                done
                  ? "bg-primary/10 text-primary cursor-default"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              }`}
            >
              {scanning
                ? t("Analyse en cours…", "Analyzing…")
                : done
                ? t("Scan terminé ✓", "Scan complete ✓")
                : t("Lancer le scan →", "Start scan →")}
            </button>

            {done && (
              <Link
                to={`${prefix}/selector`}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-primary/20 py-2.5 text-[13px] font-medium text-primary transition-all hover:bg-primary/5"
              >
                {t("Analyser MA stack →", "Analyze MY stack →")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScannerDemo;
