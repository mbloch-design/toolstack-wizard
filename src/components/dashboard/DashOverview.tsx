import { useMemo } from "react";
import type { DiagnosticResult, Prescription } from "@/types/diagnostic";
import { Share2, Download } from "lucide-react";

interface Props {
  result: DiagnosticResult;
  t: (fr: string, en: string) => string;
  onShare?: () => void;
}

// ─── Donut Chart SVG ────────────────────────────────────────────
function HealthDonut({ score, label, t }: { score: number; label: string; t: Props["t"] }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 80 ? "hsl(var(--keep))" :
    score >= 60 ? "hsl(45 93% 47%)" :
    score >= 40 ? "hsl(25 95% 53%)" :
    "hsl(var(--destructive))";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140" className="drop-shadow-sm">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          transform="rotate(-90 70 70)"
          className="transition-all duration-1000"
        />
        <text x="70" y="64" textAnchor="middle" className="fill-foreground text-2xl font-bold font-['DM_Mono']" fontSize="28">
          {score}
        </text>
        <text x="70" y="84" textAnchor="middle" className="fill-muted-foreground text-xs" fontSize="11">
          {label}
        </text>
      </svg>
      <p className="text-xs text-muted-foreground">{t("Santé de ta stack", "Stack health")}</p>
    </div>
  );
}

// ─── Sparring partner message builder ───────────────────────────
function buildSparringMessage(result: DiagnosticResult, t: Props["t"]): string {
  const { sessionState, prescriptions, estimatedWaste } = result;
  const { firstName, persona } = sessionState;
  const allP = [...prescriptions.phase1, ...prescriptions.phase3];
  const doublons = allP.filter((p) => p.type === "doublon" || p.type === "doublon-ia");
  const dormants = allP.filter((p) => p.type === "dormant");

  const parts: string[] = [];

  if (result.healthScore >= 80) {
    parts.push(t(
      `Belle stack ${firstName} ! Très peu de gaspillage détecté.`,
      `Great stack ${firstName}! Very little waste detected.`
    ));
  } else if (result.healthScore >= 60) {
    parts.push(t(
      `Tu as une bonne base ${firstName}.`,
      `You have a solid foundation ${firstName}.`
    ));
  } else {
    parts.push(t(
      `${firstName}, il y a du potentiel d'optimisation.`,
      `${firstName}, there's room for optimization.`
    ));
  }

  if (doublons.length > 0) {
    const topDoublon = doublons.sort((a, b) => b.savingsEstimate - a.savingsEstimate)[0];
    parts.push(t(
      `${doublons.length} doublon${doublons.length > 1 ? "s" : ""} repéré${doublons.length > 1 ? "s" : ""} — le plus gros : ${topDoublon.message}.`,
      `${doublons.length} duplicate${doublons.length > 1 ? "s" : ""} found — biggest: ${topDoublon.message}.`
    ));
  }

  if (dormants.length > 0) {
    parts.push(t(
      `${dormants.length} outil${dormants.length > 1 ? "s" : ""} fantôme${dormants.length > 1 ? "s" : ""} détecté${dormants.length > 1 ? "s" : ""}.`,
      `${dormants.length} ghost tool${dormants.length > 1 ? "s" : ""} detected.`
    ));
  }

  if (estimatedWaste > 50) {
    parts.push(t(
      `Tu pourrais récupérer ~${Math.round(estimatedWaste)}€/mois facilement.`,
      `You could save ~${Math.round(estimatedWaste)}€/month easily.`
    ));
  }

  return parts.join(" ");
}

// ─── Category breakdown ─────────────────────────────────────────
function CategoryBreakdown({ result, t }: Props) {
  const categories = useMemo(() => {
    const map = new Map<string, { count: number; cost: number; avgScore: number }>();
    for (const tool of result.sessionState.selectedTools) {
      const cat = tool.category || "other";
      const entry = map.get(cat) || { count: 0, cost: 0, avgScore: 0 };
      const score = result.toolScores.get(tool.id);
      entry.count++;
      entry.cost += tool.price;
      entry.avgScore += score?.scoreFinal ?? 50;
      map.set(cat, entry);
    }
    return Array.from(map.entries())
      .map(([cat, d]) => ({ cat, ...d, avgScore: Math.round(d.avgScore / d.count) }))
      .sort((a, b) => b.cost - a.cost);
  }, [result]);

  const maxCost = Math.max(...categories.map((c) => c.cost), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        {t("Répartition par catégorie", "Category breakdown")}
      </h3>
      {categories.map((c) => {
        const barColor =
          c.avgScore > 70 ? "bg-[hsl(var(--keep))]" :
          c.avgScore > 40 ? "bg-yellow-500" :
          "bg-destructive";
        return (
          <div key={c.cat} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-24 truncate capitalize">{c.cat}</span>
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${(c.cost / maxCost) * 100}%` }}
              />
            </div>
            <span className="text-xs font-['DM_Mono'] text-foreground w-16 text-right">
              {Math.round(c.cost)}€
            </span>
            <span className="text-xs text-muted-foreground w-8 text-right">{c.count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashOverview({ result, t, onShare }: Props) {
  const message = useMemo(() => buildSparringMessage(result, t), [result, t]);

  return (
    <div className="space-y-8">
      {/* Hero savings */}
      <div className="text-center space-y-2">
        <p className="text-4xl md:text-5xl font-bold font-['DM_Mono'] text-destructive">
          {Math.round(result.estimatedWaste)}€<span className="text-lg text-muted-foreground">/{t("mois", "mo")}</span>
        </p>
        <p className="text-muted-foreground text-sm">
          {t("d'économies possibles", "in potential savings")} — {t("soit", "i.e.")} <strong className="text-foreground font-['DM_Mono']">{Math.round(result.annualSavings)}€/{t("an", "yr")}</strong>
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-1">
          <span className="font-['DM_Mono']">{result.stackTotalCost}€</span>
          <span>→</span>
          <span className="font-['DM_Mono'] text-[hsl(var(--keep))] font-bold">{result.optimizedCost}€</span>
        </div>
      </div>

      {/* Sparring partner */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm text-foreground leading-relaxed">{message}</p>
        <p className="text-xs text-muted-foreground mt-3 italic">— {t("Ton sparring partner", "Your sparring partner")}</p>
      </div>

      {/* Donut + Projection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex justify-center">
          <HealthDonut score={result.healthScore} label={result.healthLabel} t={t} />
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <div>
                <p className="text-xs text-muted-foreground">{t("Économies annuelles", "Annual savings")}</p>
                <p className="text-lg font-bold font-['DM_Mono'] text-foreground">{Math.round(result.annualSavings)}€</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⏱️</span>
              <div>
                <p className="text-xs text-muted-foreground">{t("Heures récupérables", "Recoverable hours")}</p>
                <p className="text-lg font-bold font-['DM_Mono'] text-foreground">{result.hoursRecoverable}h/{t("mois", "mo")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <CategoryBreakdown result={result} t={t} />

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={onShare} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Share2 className="w-4 h-4" />
          {t("Partager mon audit", "Share my audit")}
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
          <Download className="w-4 h-4" />
          {t("Télécharger rapport", "Download report")}
        </button>
      </div>
    </div>
  );
}
