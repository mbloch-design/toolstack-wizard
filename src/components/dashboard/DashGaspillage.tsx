import { useState, useMemo, useRef, useEffect } from "react";
import type { DiagnosticResult, Tool, Prescription } from "@/types/diagnostic";
import { X } from "lucide-react";

interface Props {
  result: DiagnosticResult;
  allTools: Tool[];
  t: (fr: string, en: string) => string;
}

type BubbleStatus = "doublon" | "dormant" | "ok" | "neutral";

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
  if (tool.price === 0 || tool.force_silence) return { status: "neutral" };
  return { status: "ok" };
}

const STATUS_COLORS: Record<BubbleStatus, string> = {
  doublon: "hsl(var(--destructive))",
  dormant: "hsl(25 95% 53%)",
  ok: "hsl(var(--keep))",
  neutral: "hsl(var(--muted-foreground) / 0.3)",
};

// Simple circle packing (force-directed placement)
function packCircles(items: { tool: Tool; status: BubbleStatus; prescription?: Prescription }[], width: number, height: number): BubbleData[] {
  const maxPrice = Math.max(...items.map((i) => i.tool.price), 1);
  const minR = 18, maxR = 55;

  const bubbles: BubbleData[] = items.map((item) => {
    const priceFactor = item.tool.price <= 0 ? 0.15 : Math.log(item.tool.price + 1) / Math.log(maxPrice + 1);
    const r = minR + priceFactor * (maxR - minR);
    return {
      ...item,
      x: width / 2 + (Math.random() - 0.5) * width * 0.5,
      y: height / 2 + (Math.random() - 0.5) * height * 0.4,
      r,
    };
  });

  // Simple repulsion iterations
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
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
      // Gravity toward center
      const b = bubbles[i];
      b.x += (width / 2 - b.x) * 0.01;
      b.y += (height / 2 - b.y) * 0.01;
      // Bounds
      b.x = Math.max(b.r + 2, Math.min(width - b.r - 2, b.x));
      b.y = Math.max(b.r + 2, Math.min(height - b.r - 2, b.y));
    }
  }

  return bubbles;
}

function DetailCard({ bubble, result, t, onClose }: { bubble: BubbleData; result: DiagnosticResult; t: Props["t"]; onClose: () => void }) {
  const { tool, status, prescription } = bubble;
  const allP = [...result.prescriptions.phase1, ...result.prescriptions.phase2, ...result.prescriptions.phase3];
  const relatedDoublons = allP.filter(
    (p) => (p.type === "doublon" || p.type === "doublon-ia") && p.toolId !== tool.id && p.message.includes(tool.name)
  );

  const statusBadge = {
    doublon: { label: t("Doublon", "Duplicate"), cls: "bg-destructive/10 text-destructive" },
    dormant: { label: t("Fantôme", "Ghost"), cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    ok: { label: t("Optimisé", "Optimized"), cls: "bg-[hsl(var(--keep))]/10 text-[hsl(var(--keep))]" },
    neutral: { label: t("Neutre", "Neutral"), cls: "bg-muted text-muted-foreground" },
  }[status];

  return (
    <div className="absolute top-4 right-4 z-20 w-72 bg-card border border-border rounded-xl shadow-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-foreground text-sm">{tool.name}</p>
          <p className="text-xs font-['DM_Mono'] text-muted-foreground">{tool.price}€/{t("mois", "mo")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.cls}`}>{statusBadge.label}</span>
          <button onClick={onClose} className="p-0.5 hover:bg-muted rounded"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {prescription && (
        <>
          <p className="text-xs text-muted-foreground">{prescription.message}</p>
          {prescription.savingsEstimate > 0 && (
            <p className="text-xs font-['DM_Mono'] text-destructive">
              {t("Économie si annulé", "Savings if cancelled")}: {prescription.savingsEstimate}€/{t("mois", "mo")} ({prescription.savingsEstimate * 12}€/{t("an", "yr")})
            </p>
          )}
        </>
      )}

      {relatedDoublons.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("Chevauchement avec", "Overlaps with")}: {relatedDoublons.map((d) => d.toolId).join(", ")}
        </p>
      )}
    </div>
  );
}

export default function DashGaspillage({ result, allTools, t }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 700, h: 450 });
  const [selected, setSelected] = useState<BubbleData | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ w: Math.max(400, width), h: Math.max(350, Math.min(500, width * 0.6)) });
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

  const bubbles = useMemo(() => packCircles(items, dims.w, dims.h), [items, dims]);

  const legend: { status: BubbleStatus; emoji: string; labelFr: string; labelEn: string; actionFr: string; actionEn: string }[] = [
    { status: "doublon", emoji: "🔴", labelFr: "Doublon", labelEn: "Duplicate", actionFr: "Annuler ou Downgrade", actionEn: "Cancel or Downgrade" },
    { status: "dormant", emoji: "🟠", labelFr: "Fantôme", labelEn: "Ghost", actionFr: "À vérifier", actionEn: "Review" },
    { status: "ok", emoji: "🟢", labelFr: "Optimisé", labelEn: "Optimized", actionFr: "Garder", actionEn: "Keep" },
    { status: "neutral", emoji: "⚪", labelFr: "Neutre", labelEn: "Neutral", actionFr: "Aucune", actionEn: "None" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">{t("Carte du gaspillage", "Waste Map")}</h2>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {legend.map((l) => (
          <div key={l.status} className="flex items-center gap-1.5">
            <span>{l.emoji}</span>
            <span className="font-medium text-foreground">{t(l.labelFr, l.labelEn)}</span>
            <span>— {t(l.actionFr, l.actionEn)}</span>
          </div>
        ))}
      </div>

      {/* Bubble SVG */}
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
                opacity={hoveredId === b.tool.id ? 0.9 : 0.7}
                stroke={selected?.tool.id === b.tool.id ? "hsl(var(--foreground))" : "transparent"}
                strokeWidth={2}
                className="transition-opacity duration-200"
              />
              {b.r > 22 && (
                <text
                  x={b.x} y={b.y - 4} textAnchor="middle"
                  className="fill-white text-[10px] font-medium pointer-events-none select-none"
                  fontSize="10"
                >
                  {b.tool.name.length > 10 ? b.tool.name.slice(0, 9) + "…" : b.tool.name}
                </text>
              )}
              {b.r > 22 && (
                <text
                  x={b.x} y={b.y + 10} textAnchor="middle"
                  className="fill-white/80 text-[9px] font-['DM_Mono'] pointer-events-none select-none"
                  fontSize="9"
                >
                  {b.tool.price > 0 ? `${b.tool.price}€` : t("Gratuit", "Free")}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredId && !selected && (() => {
          const b = bubbles.find((bub) => bub.tool.id === hoveredId);
          if (!b) return null;
          return (
            <div
              className="absolute z-10 bg-card border border-border rounded-lg shadow px-3 py-1.5 pointer-events-none text-xs"
              style={{ left: b.x + b.r + 8, top: b.y - 16 }}
            >
              <span className="font-medium text-foreground">{b.tool.name}</span>
              <span className="text-muted-foreground ml-1.5 font-['DM_Mono']">{b.tool.price}€</span>
            </div>
          );
        })()}

        {/* Detail card */}
        {selected && <DetailCard bubble={selected} result={result} t={t} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}
