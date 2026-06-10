import { useState, useMemo, useRef, useEffect } from "react";
import type { DiagnosticResult, Tool, Prescription } from "@/types/diagnostic";
import { AlertTriangle, CheckCircle2, ChevronRight, CircleDollarSign, CircleDot, LayoutGrid, List, X } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";


interface Props {
  result: DiagnosticResult;
  allTools: Tool[];
  t: (fr: string, en: string) => string;
}

type BubbleStatus = "doublon" | "dormant" | "pricing" | "ok" | "neutral";
type ViewMode = "bubbles" | "list";
type FilterStatus = "all" | "doublon" | "dormant" | "pricing" | "ok";

interface BubbleData {
  tool: Tool;
  status: BubbleStatus;
  prescription?: Prescription;
  x: number;
  y: number;
  r: number;
}

function getStatus(tool: Tool, allPrescriptions: Prescription[]): { status: BubbleStatus; prescription?: Prescription } {
  const p = allPrescriptions.find((pr) => pr.toolId === tool.id);
  if (p && (p.type === "doublon" || p.type === "doublon-ia")) return { status: "doublon", prescription: p };
  if (p && p.type === "dormant") return { status: "dormant", prescription: p };
  if (p && p.type === "pricing-tier") return { status: "pricing", prescription: p };
  if (tool.price === 0 || tool.force_silence) return { status: "neutral" };
  return { status: "ok" };
}

const STATUS_COLORS: Record<BubbleStatus, string> = {
  doublon: "hsl(var(--destructive))",
  dormant: "hsl(25 95% 53%)",
  pricing: "hsl(217 91% 60%)",
  ok: "hsl(var(--keep))",
  neutral: "hsl(var(--muted-foreground) / 0.3)",
};

function packCircles(items: { tool: Tool; status: BubbleStatus; prescription?: Prescription }[], width: number, height: number): BubbleData[] {
  const maxPrice = Math.max(...items.map((i) => i.tool.price), 1);
  const minR = 20, maxR = 50;

  const bubbles: BubbleData[] = items.map((item) => {
    const priceFactor = item.tool.price <= 0 ? 0.15 : Math.log(item.tool.price + 1) / Math.log(maxPrice + 1);
    const r = minR + priceFactor * (maxR - minR);
    return { ...item, x: width / 2 + (Math.random() - 0.5) * width * 0.5, y: height / 2 + (Math.random() - 0.5) * height * 0.4, r };
  });

  for (let iter = 0; iter < 120; iter++) {
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i], b = bubbles[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = a.r + b.r + 3;
        if (dist < minDist) {
          const push = (minDist - dist) / 2;
          const nx = dx / dist, ny = dy / dist;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
        }
      }
      const b = bubbles[i];
      b.x += (width / 2 - b.x) * 0.01;
      b.y += (height / 2 - b.y) * 0.01;
      b.x = Math.max(b.r + 2, Math.min(width - b.r - 2, b.x));
      b.y = Math.max(b.r + 2, Math.min(height - b.r - 2, b.y));
    }
  }
  return bubbles;
}

// ─── Slide-in panel ───
function SlidePanel({ bubble, result, t, onClose }: { bubble: BubbleData; result: DiagnosticResult; t: Props["t"]; onClose: () => void }) {
  const { tool, status, prescription } = bubble;

  const actionLabel = prescription?.verdict === "cancel"
    ? t("Décider", "Decide")
    : prescription?.verdict === "downgrade"
    ? t("Vérifier le plan", "Review plan")
    : t("Clarifier", "Clarify");

  const actionColor = prescription?.verdict === "cancel"
    ? "bg-destructive text-white"
    : prescription?.verdict === "downgrade"
    ? "bg-blue-600 text-white"
    : "bg-orange-500 text-white";

  return (
    <div className="fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <ToolLogo tool={tool} size={32} className="rounded-lg" />
          <div>
            <p className="font-semibold text-sm text-foreground">{tool.name}</p>
            <p className="text-xs font-['DM_Mono'] text-muted-foreground">{tool.price}€/{t("mois", "mo")}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            status === "doublon" ? "bg-destructive/10 text-destructive" :
            status === "dormant" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
            status === "pricing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
            "bg-[hsl(var(--keep))]/10 text-[hsl(var(--keep))]"
          }`}>
            {status === "doublon" ? t("Chevauchement", "Overlap") :
             status === "dormant" ? t("Peu utilisé", "Low usage") :
             status === "pricing" ? t("Plan à vérifier", "Plan to review") :
             t("RAS", "Looks fine")}
          </span>
        </div>

        {/* Explanation */}
        {prescription && (
          <p className="text-sm text-foreground leading-relaxed">{prescription.message}</p>
        )}

        {/* Savings */}
        {prescription && prescription.savingsEstimate > 0 && (
          <div className="bg-[hsl(var(--keep))]/5 border border-[hsl(var(--keep))]/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{t("Potentiel récupérable", "Recoverable potential")}</p>
            <p className="text-xl font-bold font-['DM_Mono'] text-[hsl(var(--keep))]">
              {prescription.savingsEstimate}€<span className="text-sm font-normal text-muted-foreground">/{t("mois", "mo")}</span>
            </p>
          </div>
        )}

        {/* Downgrade info */}
        {tool.downgrade_plan?.available && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs">
            <p className="text-blue-700 dark:text-blue-300">
              {t("Plan alternatif", "Alternative plan")}: <strong>{tool.downgrade_plan.plan}</strong> → {tool.downgrade_plan.toPrice}€
            </p>
          </div>
        )}

        {prescription?.pricingContext && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900/60 dark:bg-blue-900/20 dark:text-blue-200">
            <p className="font-semibold">{t("Variable pricing", "Pricing variable")}</p>
            <p className="mt-1">
              {prescription.pricingContext.currentPlan && (
                <span>{t("Plan actuel", "Current plan")}: <strong>{prescription.pricingContext.currentPlan}</strong>. </span>
              )}
              {prescription.pricingContext.targetPlan && (
                <span>{t("À tester", "To test")}: <strong>{prescription.pricingContext.targetPlan}</strong>.</span>
              )}
            </p>
            {prescription.pricingContext.sourceDomain && (
              <p className="mt-1 text-blue-700/80 dark:text-blue-200/80">
                {t("Source prix", "Pricing source")}: {prescription.pricingContext.sourceDomain}
              </p>
            )}
          </div>
        )}

        {/* Action button */}
        {prescription && (
          <button className={`w-full py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 ${actionColor}`}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashGaspillage({ result, allTools, t }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 700, h: 420 });
  const [selected, setSelected] = useState<BubbleData | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("bubbles");
  const [filter, setFilter] = useState<FilterStatus>("all");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ w: Math.max(400, width), h: Math.max(320, Math.min(450, width * 0.55)) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const allPrescriptions = useMemo(
    () => [...result.prescriptions.phase1, ...result.prescriptions.phase2, ...result.prescriptions.phase3],
    [result.prescriptions]
  );

  const items = useMemo(
    () => result.sessionState.selectedTools.map((tool) => ({ tool, ...getStatus(tool, allPrescriptions) })),
    [result.sessionState.selectedTools, allPrescriptions]
  );

  // Summary counts
  const counts = useMemo(() => {
    const doublons = items.filter((i) => i.status === "doublon");
    const dormants = items.filter((i) => i.status === "dormant");
    const pricing = items.filter((i) => i.status === "pricing");
    const oks = items.filter((i) => i.status === "ok");
    return {
      doublons: doublons.length,
      doublonsSavings: doublons.reduce((s, i) => s + (i.prescription?.savingsEstimate ?? 0), 0),
      dormants: dormants.length,
      dormantsSavings: dormants.reduce((s, i) => s + (i.prescription?.savingsEstimate ?? 0), 0),
      pricing: pricing.length,
      pricingSavings: pricing.reduce((s, i) => s + (i.prescription?.savingsEstimate ?? 0), 0),
      oks: oks.length,
    };
  }, [items]);

  const filteredItems = useMemo(
    () => filter === "all" ? items : items.filter((i) => i.status === filter),
    [items, filter]
  );

  const bubbles = useMemo(() => packCircles(filteredItems, dims.w, dims.h), [filteredItems, dims]);

  const pills: { key: FilterStatus; Icon: typeof AlertTriangle; label: string; count: number; savings?: number; cls: string; activeCls: string }[] = [
    {
      key: "doublon", Icon: AlertTriangle,
      label: `${counts.doublons} ${t("chevauchement(s)", "overlap(s)")}`,
      count: counts.doublons, savings: counts.doublonsSavings,
      cls: "border-destructive/30 text-destructive",
      activeCls: "bg-destructive/10 border-destructive text-destructive",
    },
    {
      key: "dormant", Icon: CircleDot,
      label: `${counts.dormants} ${t("peu utilisé(s)", "low-usage")}`,
      count: counts.dormants, savings: counts.dormantsSavings,
      cls: "border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400",
      activeCls: "bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/30 dark:border-orange-600 dark:text-orange-400",
    },
    {
      key: "pricing", Icon: CircleDollarSign,
      label: `${counts.pricing} ${t("plan(s) à vérifier", "plan(s) to review")}`,
      count: counts.pricing, savings: counts.pricingSavings,
      cls: "border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-300",
      activeCls: "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300",
    },
    {
      key: "ok", Icon: CheckCircle2,
      label: `${counts.oks} ${t("sans signal", "clear")}`,
      count: counts.oks,
      cls: "border-[hsl(var(--keep))]/30 text-[hsl(var(--keep))]",
      activeCls: "bg-[hsl(var(--keep))]/10 border-[hsl(var(--keep))] text-[hsl(var(--keep))]",
    },
  ];

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase text-primary">{t("Points à revoir", "Points to review")}</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {t("Où la stack demande un arbitrage ?", "Where does the stack need a decision?")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t(
            "Cette vue ne dit pas que tes choix sont mauvais. Elle met en lumière les endroits où deux outils font peut-être le même travail, ou où un abonnement dort.",
            "This view does not say your choices are bad. It highlights where two tools may do the same job, or where a subscription is idle."
          )}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {pills.map((pill) => (
          <button
            key={pill.key}
            onClick={() => setFilter(filter === pill.key ? "all" : pill.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              filter === pill.key ? pill.activeCls : `${pill.cls} hover:opacity-80`
            }`}
          >
            <pill.Icon className="h-3.5 w-3.5" />
            <span>{pill.label}</span>
            {pill.savings != null && pill.savings > 0 && (
              <span className="font-['DM_Mono']">· {pill.savings}€</span>
            )}
          </button>
        ))}
        {/* View toggle */}
        <div className="ml-auto flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("bubbles")}
            className={`p-1.5 ${viewMode === "bubbles" ? "bg-muted" : "hover:bg-muted/50"}`}
            title={t("Vue bulles", "Bubble view")}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 ${viewMode === "list" ? "bg-muted" : "hover:bg-muted/50"}`}
            title={t("Vue liste", "List view")}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Bubble view ─── */}
      {viewMode === "bubbles" && (
        <div ref={containerRef} className="relative bg-muted/30 rounded-xl border border-border overflow-hidden">
          <svg width={dims.w} height={dims.h} viewBox={`0 0 ${dims.w} ${dims.h}`} className="w-full">
            {bubbles.map((b) => (
              <g
                key={b.tool.id}
                onClick={() => setSelected(selected?.tool.id === b.tool.id ? null : b)}
                onMouseEnter={() => setHoveredId(b.tool.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={b.x} cy={b.y} r={b.r}
                  fill={STATUS_COLORS[b.status]}
                  opacity={hoveredId === b.tool.id ? 0.9 : 0.65}
                  stroke={selected?.tool.id === b.tool.id ? "hsl(var(--foreground))" : "transparent"}
                  strokeWidth={2}
                  className="transition-opacity duration-200"
                />
                {b.r > 22 && (
                  <>
                    <text x={b.x} y={b.y - 3} textAnchor="middle" className="fill-white text-[10px] font-semibold pointer-events-none select-none" fontSize="10">
                      {b.tool.name.length > 9 ? b.tool.name.slice(0, 8) + "…" : b.tool.name}
                    </text>
                    <text x={b.x} y={b.y + 10} textAnchor="middle" className="fill-white/70 text-[9px] font-['DM_Mono'] pointer-events-none select-none" fontSize="9">
                      {b.tool.price > 0 ? `${b.tool.price}€` : t("Gratuit", "Free")}
                    </text>
                  </>
                )}
              </g>
            ))}
          </svg>

          {/* Hover tooltip */}
          {hoveredId && !selected && (() => {
            const b = bubbles.find((bub) => bub.tool.id === hoveredId);
            if (!b) return null;
            return (
              <div className="absolute z-10 bg-card border border-border rounded-lg shadow px-3 py-1.5 pointer-events-none text-xs" style={{ left: Math.min(b.x + b.r + 8, dims.w - 120), top: b.y - 16 }}>
                <span className="font-medium text-foreground">{b.tool.name}</span>
                <span className="text-muted-foreground ml-1.5 font-['DM_Mono']">{b.tool.price}€</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── List view ─── */}
      {viewMode === "list" && (
        <div className="space-y-1">
          {filteredItems
            .sort((a, b) => (b.prescription?.savingsEstimate ?? 0) - (a.prescription?.savingsEstimate ?? 0))
            .map((item) => (
              <button
                key={item.tool.id}
                onClick={() => setSelected(selected?.tool.id === item.tool.id ? null : { ...item, x: 0, y: 0, r: 0 })}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                  item.status === "doublon" ? "border-l-4 border-l-destructive border-border" :
                  item.status === "dormant" ? "border-l-4 border-l-orange-500 border-border" :
                  item.status === "pricing" ? "border-l-4 border-l-blue-500 border-border" :
                  "border-border"
                } hover:bg-muted/50`}
              >
                <ToolLogo tool={item.tool} size={32} className="rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.tool.name}</p>
                  {item.prescription && (
                    <p className="text-xs text-muted-foreground truncate">{item.prescription.message}</p>
                  )}
                </div>
                <span className="text-xs font-['DM_Mono'] text-muted-foreground shrink-0">{item.tool.price}€</span>
                {item.prescription && item.prescription.savingsEstimate > 0 && (
                  <span className="text-xs font-bold font-['DM_Mono'] text-[hsl(var(--keep))] shrink-0">
                    +{item.prescription.savingsEstimate}€
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>
            ))}
        </div>
      )}

      {/* ─── Slide-in panel ─── */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelected(null)} />
          <SlidePanel bubble={selected} result={result} t={t} onClose={() => setSelected(null)} />
        </>
      )}
    </div>
  );
}
