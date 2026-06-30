import { jsPDF } from "npm:jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Tool {
  id: string;
  name: string;
  price: number;
  priceCurrency?: string;
  catalogMonthlyPrice?: number;
  catalogMonthlyPriceCurrency?: string;
  category: string;
  tool_type: string;
  usage: string;
}

interface Prescription {
  toolId: string;
  type: string;
  verdict: string;
  message: string;
  savingsEstimate: number;
}

interface LocalizedDiagnosticItem {
  id?: string;
  labelFr?: string;
  labelEn?: string;
  summaryFr?: string;
  summaryEn?: string;
  actionFr?: string;
  actionEn?: string;
}

interface DiagnosticRiskFlag extends LocalizedDiagnosticItem {
  severity?: "low" | "medium" | "high";
  detailFr?: string;
  detailEn?: string;
  impactMonthly?: number;
}

interface DiagnosticFocusArea extends LocalizedDiagnosticItem {
  priority?: "low" | "medium" | "high";
}

interface AiDiagnosticActorSummary {
  toolName?: string;
  hostToolName?: string;
  sourceLabelFr?: string;
  sourceLabelEn?: string;
  accessLabelFr?: string;
  accessLabelEn?: string;
  commercialContractName?: string;
  allowanceLabelFr?: string;
  allowanceLabelEn?: string;
  variableMonthlyCost?: number;
  capabilityLabelsFr?: string[];
  capabilityLabelsEn?: string[];
  frequencyLabelFr?: string;
  frequencyLabelEn?: string;
}

interface AiDiagnosticActorRole {
  objectiveLabelFr?: string;
  objectiveLabelEn?: string;
  sourceLabelFr?: string;
  sourceLabelEn?: string;
  capabilityLabelsFr?: string[];
  capabilityLabelsEn?: string[];
}

interface AiDiagnosticGlobalActorSummary extends AiDiagnosticActorSummary {
  objectiveCount?: number;
  roles?: AiDiagnosticActorRole[];
}

interface AiDiagnosticWorkflowSummary {
  objectiveLabelFr?: string;
  objectiveLabelEn?: string;
  actors?: AiDiagnosticActorSummary[];
}

interface AiDiagnosticFinding extends DiagnosticRiskFlag {
  reviewRecommended?: boolean;
}

interface DiagnosticAiAnalysis {
  objectiveCount?: number;
  actorCount?: number;
  actorOccurrenceCount?: number;
  capabilityCount?: number;
  globalActors?: AiDiagnosticGlobalActorSummary[];
  workflows?: AiDiagnosticWorkflowSummary[];
  findings?: AiDiagnosticFinding[];
}

interface DiagnosticInsights {
  profile?: LocalizedDiagnosticItem | null;
  maturity?: LocalizedDiagnosticItem | null;
  primaryRisk?: DiagnosticRiskFlag | null;
  riskFlags?: DiagnosticRiskFlag[] | null;
  focusAreas?: DiagnosticFocusArea[] | null;
  aiAnalysis?: DiagnosticAiAnalysis | null;
  metrics?: Record<string, number> | null;
}

interface ReportPayload {
  lang: "fr" | "en";
  firstName: string;
  persona: string;
  healthScore: number;
  healthLabel: string;
  stackTotalCost: number;
  estimatedWaste: number;
  optimizedCost: number;
  annualSavings: number;
  hoursRecoverable: number;
  selectedTools: Tool[];
  toolScores: Record<string, { pertinence: number; valueIndex: number; scoreFinal: number }>;
  prescriptions: { phase1: Prescription[]; phase2: Prescription[]; phase3: Prescription[] };
  insights?: DiagnosticInsights;
  recommendations: { id: string; name: string; price: number; priceCurrency?: string; catalogMonthlyPrice?: number; catalogMonthlyPriceCurrency?: string; category: string }[];
}

function humanizeId(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function localizedField(
  item: LocalizedDiagnosticItem | DiagnosticRiskFlag | null | undefined,
  field: "label" | "summary" | "action" | "detail",
  locale: "fr" | "en"
) {
  if (!item) return "";
  const suffix = locale === "en" ? "En" : "Fr";
  const key = `${field}${suffix}` as keyof (LocalizedDiagnosticItem & DiagnosticRiskFlag);
  const fallbackKey = `${field}${locale === "en" ? "Fr" : "En"}` as keyof (LocalizedDiagnosticItem & DiagnosticRiskFlag);
  const value = item[key] || item[fallbackKey];
  return typeof value === "string" ? value : "";
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100).replace(".", ",");
}

function formatMoney(value: number, currency?: string) {
  const formatted = formatNumber(value);
  if (currency === "USD") return `${formatted}$`;
  if (currency === "EUR") return `${formatted}€`;
  if (currency) return `${formatted} ${currency}`;
  return formatted;
}

function toolCurrency(tool: Pick<Tool, "priceCurrency" | "catalogMonthlyPriceCurrency">) {
  return tool.priceCurrency || tool.catalogMonthlyPriceCurrency;
}

function formatToolMonthlyPrice(tool: Pick<Tool, "price" | "priceCurrency" | "catalogMonthlyPriceCurrency">, t: (fr: string, en: string) => string) {
  if (tool.price <= 0) return t("Gratuit", "Free");
  const currency = toolCurrency(tool);
  const suffix = currency ? "" : ` · ${t("devise à vérifier", "currency to verify")}`;
  return `${formatMoney(tool.price, currency)}/${t("mois", "mo")}${suffix}`;
}

function formatMonthlyTotal(tools: Pick<Tool, "price" | "priceCurrency" | "catalogMonthlyPriceCurrency">[], t: (fr: string, en: string) => string) {
  const totals = new Map<string, number>();
  let unknown = 0;

  for (const tool of tools) {
    if (tool.price <= 0) continue;
    const currency = toolCurrency(tool);
    if (!currency) {
      unknown += tool.price;
      continue;
    }
    totals.set(currency, (totals.get(currency) || 0) + tool.price);
  }

  const parts = Array.from(totals.entries()).map(([currency, amount]) => formatMoney(amount, currency));
  if (unknown > 0) parts.push(`${formatMoney(unknown)} ${t("à vérifier", "to verify")}`);
  return parts.length > 0 ? parts.join(" + ") : formatMoney(0);
}

function formatPrescriptionTotal(
  prescriptions: Prescription[],
  tools: Tool[],
  t: (fr: string, en: string) => string,
  multiplier = 1
) {
  const toolMap = new Map(tools.map((tool) => [tool.id, tool]));
  const totals = new Map<string, number>();
  let unknown = 0;

  for (const prescription of prescriptions) {
    if (prescription.savingsEstimate <= 0) continue;
    const tool = toolMap.get(prescription.toolId);
    const currency = tool ? toolCurrency(tool) : undefined;
    const amount = prescription.savingsEstimate * multiplier;
    if (!currency) {
      unknown += amount;
      continue;
    }
    totals.set(currency, (totals.get(currency) || 0) + amount);
  }

  const parts = Array.from(totals.entries()).map(([currency, amount]) => formatMoney(Math.round(amount), currency));
  if (unknown > 0) parts.push(`${formatMoney(Math.round(unknown))} ${t("à vérifier", "to verify")}`);
  return parts.length > 0 ? parts.join(" + ") : formatMoney(0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: ReportPayload = await req.json();
    const { lang } = payload;
    const t = (fr: string, en: string) => lang === "fr" ? fr : en;
    const allPrescriptions = [
      ...payload.prescriptions.phase1,
      ...payload.prescriptions.phase2,
      ...payload.prescriptions.phase3,
    ];
    const capturedBudgetLabel = formatMonthlyTotal(payload.selectedTools, t);
    const possibleSavingsLabel = formatPrescriptionTotal(allPrescriptions, payload.selectedTools, t);
    const annualSavingsLabel = formatPrescriptionTotal(allPrescriptions, payload.selectedTools, t, 12);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const H = 297;
    const M = 20; // margin
    const CW = W - 2 * M; // content width

    // Colors
    const NAVY = [26, 35, 64] as const;
    const ORANGE = [212, 88, 26] as const;
    const GREEN = [26, 107, 60] as const;
    const RED = [160, 32, 32] as const;
    const GRAY = [120, 120, 130] as const;
    const LIGHT_BG = [245, 245, 248] as const;

    function scoreColor(score: number): readonly [number, number, number] {
      if (score >= 65) return GREEN;
      if (score >= 35) return [26, 90, 138] as const;
      return RED;
    }

    function addFooter(page: number) {
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(`tooltrim.com — ${t("Rapport diagnostic", "Diagnostic Report")}`, M, H - 10);
      doc.text(`${page}`, W - M, H - 10, { align: "right" });
    }

    function checkPageBreak(y: number, needed: number): number {
      if (y + needed > H - 20) {
        addFooter(doc.getNumberOfPages());
        doc.addPage();
        return 25;
      }
      return y;
    }

    // ─── PAGE 1: COVER ─────────────────────────────────────────
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, H, "F");

    // Logo text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("tooltrim", W / 2, 80, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(t("Rapport de diagnostic", "Diagnostic Report"), W / 2, 95, { align: "center" });

    // Orange accent line
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(1.5);
    doc.line(W / 2 - 30, 105, W / 2 + 30, 105);

    // User info
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(payload.firstName, W / 2, 130, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Persona: ${payload.persona}`, W / 2, 140, { align: "center" });

    // Health score circle
    const cx = W / 2;
    const cy = 180;
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.circle(cx, cy, 22);
    const hColor = payload.healthScore >= 65 ? GREEN : payload.healthScore >= 35 ? ORANGE : RED;
    doc.setFillColor(...hColor);
    doc.circle(cx, cy, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(`${payload.healthScore}`, cx, cy + 3, { align: "center" });
    doc.setFontSize(9);
    doc.text(payload.healthLabel, cx, cy + 12, { align: "center" });

    // Key metrics
    doc.setFontSize(11);
    doc.setTextColor(200, 200, 210);
    const metricsY = 220;
    doc.text(t("Coût total stack", "Total stack cost"), W / 2, metricsY, { align: "center" });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`${capturedBudgetLabel}/${t("mois", "mo")}`, W / 2, metricsY + 8, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(200, 200, 210);
    doc.text(t("Économies possibles", "Potential savings"), W / 2, metricsY + 22, { align: "center" });
    doc.setTextColor(...ORANGE);
    doc.setFontSize(16);
    doc.text(`${possibleSavingsLabel}/${t("mois", "mo")}`, W / 2, metricsY + 30, { align: "center" });

    // Date
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 165);
    doc.text(new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      year: "numeric", month: "long", day: "numeric"
    }), W / 2, H - 25, { align: "center" });

    addFooter(1);

    // ─── PAGE 2: EXECUTIVE SUMMARY ─────────────────────────────
    doc.addPage();
    let y = 25;

    doc.setTextColor(...NAVY);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(t("Résumé exécutif", "Executive Summary"), M, y);
    y += 12;

    // Summary boxes
    const boxes = [
      { label: t("Score de santé", "Health Score"), value: `${payload.healthScore}/100`, color: hColor },
      { label: t("Coût actuel", "Current Cost"), value: `${capturedBudgetLabel}/${t("mois", "mo")}`, color: NAVY },
      { label: t("Gains possibles", "Potential gains"), value: `${possibleSavingsLabel}/${t("mois", "mo")}`, color: GREEN },
      { label: t("Projection annuelle", "Annual projection"), value: annualSavingsLabel, color: ORANGE },
    ];

    const boxW = (CW - 15) / 4;
    boxes.forEach((box, i) => {
      const bx = M + i * (boxW + 5);
      doc.setFillColor(...LIGHT_BG);
      doc.roundedRect(bx, y, boxW, 28, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(box.label, bx + boxW / 2, y + 10, { align: "center" });
      doc.setFontSize(14);
      doc.setTextColor(...(box.color as [number, number, number]));
      doc.setFont("helvetica", "bold");
      doc.text(box.value, bx + boxW / 2, y + 22, { align: "center" });
    });
    y += 38;

    // Tool count & hours
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(`${payload.selectedTools.length} ${t("outils analysés", "tools analyzed")} • ${payload.hoursRecoverable}h ${t("récupérables/mois", "recoverable/mo")}`, M, y);
    y += 10;

    // ToolTrim intelligence read
    if (payload.insights) {
      const profileLabel = localizedField(payload.insights.profile, "label", lang) || humanizeId(payload.insights.profile?.id);
      const profileSummary = localizedField(payload.insights.profile, "summary", lang);
      const maturityLabel = localizedField(payload.insights.maturity, "label", lang) || humanizeId(payload.insights.maturity?.id);
      const primaryRisk = payload.insights.primaryRisk || payload.insights.riskFlags?.[0] || null;
      const primaryRiskLabel = localizedField(primaryRisk, "label", lang) || humanizeId(primaryRisk?.id);
      const primaryRiskAction = localizedField(primaryRisk, "action", lang);
      const focusAreas = Array.isArray(payload.insights.focusAreas) ? payload.insights.focusAreas.slice(0, 3) : [];
      const profileSummaryLines = profileSummary ? doc.splitTextToSize(profileSummary, CW - 10) as string[] : [];
      const primaryRiskActionLines = primaryRiskAction ? doc.splitTextToSize(primaryRiskAction, CW - 10) as string[] : [];
      const focusLines = focusAreas.map((focus) => {
        const label = localizedField(focus, "label", lang) || humanizeId(focus.id);
        const action = localizedField(focus, "action", lang);
        const text = `• ${label}${action ? ` — ${action}` : ""}`;
        return doc.splitTextToSize(text, CW - 14) as string[];
      });
      const insightBoxH =
        30 +
        profileSummaryLines.length * 4 +
        (primaryRiskLabel ? 5 + Math.max(primaryRiskActionLines.length, 1) * 4 : 0) +
        (focusLines.length > 0 ? 10 + focusLines.reduce((sum, lines) => sum + Math.max(lines.length, 1) * 4 + 3, 0) : 0);

      y = checkPageBreak(y, insightBoxH + 8);
      doc.setFillColor(...LIGHT_BG);
      doc.roundedRect(M, y, CW, insightBoxH, 3, 3, "F");

      let iy = y + 8;
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(t("Lecture ToolTrim", "ToolTrim Read"), M + 5, iy);
      iy += 7;

      doc.setFontSize(12);
      doc.setTextColor(...NAVY);
      doc.setFont("helvetica", "bold");
      doc.text(profileLabel || payload.healthLabel, M + 5, iy, { maxWidth: 85 });

      if (maturityLabel) {
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.setFont("helvetica", "normal");
        doc.text(`${t("Maturité", "Maturity")}: ${maturityLabel}`, M + CW - 5, iy, { align: "right", maxWidth: 70 });
      }
      iy += 7;

      if (profileSummary) {
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.setFont("helvetica", "normal");
        doc.text(profileSummaryLines, M + 5, iy);
        iy += profileSummaryLines.length * 4;
        iy += 2;
      }

      if (primaryRiskLabel) {
        doc.setFontSize(9);
        doc.setTextColor(...ORANGE);
        doc.setFont("helvetica", "bold");
        doc.text(`${t("Risque principal", "Primary risk")}: ${primaryRiskLabel}`, M + 5, iy, { maxWidth: CW - 10 });
        iy += 5;
        if (primaryRiskAction) {
          doc.setFontSize(8);
          doc.setTextColor(...GRAY);
          doc.setFont("helvetica", "normal");
          doc.text(primaryRiskActionLines, M + 5, iy);
          iy += primaryRiskActionLines.length * 4;
        }
      }

      if (focusAreas.length > 0) {
        iy += 4;
        doc.setFontSize(9);
        doc.setTextColor(...NAVY);
        doc.setFont("helvetica", "bold");
        doc.text(t("Priorités fonctionnelles", "Functional priorities"), M + 5, iy);
        iy += 6;

        for (const lines of focusLines) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...GRAY);
          doc.text(lines, M + 7, iy);
          iy += Math.max(lines.length, 1) * 4 + 3;
        }
      }

      y += insightBoxH + 10;
    }

    const aiAnalysis = payload.insights?.aiAnalysis;
    if (
      aiAnalysis &&
      (Number(aiAnalysis.actorCount || 0) > 0 || (aiAnalysis.findings || []).length > 0)
    ) {
      const globalActors = (aiAnalysis.globalActors || []).slice(0, 5);
      const aiFindings = (aiAnalysis.findings || [])
        .filter((finding) => finding.reviewRecommended)
        .slice(0, 3);
      const actorLines = globalActors.length > 0
        ? globalActors.map((actor) => {
          const source = lang === "en"
            ? actor.sourceLabelEn || actor.sourceLabelFr || ""
            : actor.sourceLabelFr || actor.sourceLabelEn || "";
          const access = lang === "en"
            ? actor.accessLabelEn || actor.accessLabelFr || ""
            : actor.accessLabelFr || actor.accessLabelEn || "";
          const host = actor.hostToolName && actor.hostToolName !== actor.toolName
            ? ` ${t("dans", "in")} ${actor.hostToolName}`
            : "";
          const contract = actor.commercialContractName
            ? ` · ${actor.commercialContractName}`
            : "";
          const allowance = lang === "en"
            ? actor.allowanceLabelEn || actor.allowanceLabelFr || ""
            : actor.allowanceLabelFr || actor.allowanceLabelEn || "";
          const variableCost = Number(actor.variableMonthlyCost || 0) > 0
            ? ` · +${actor.variableMonthlyCost} €/mois`
            : "";
          const roles = (actor.roles || []).map((role) => {
            const objective = lang === "en"
              ? role.objectiveLabelEn || role.objectiveLabelFr || ""
              : role.objectiveLabelFr || role.objectiveLabelEn || "";
            const capabilities = lang === "en"
              ? role.capabilityLabelsEn || role.capabilityLabelsFr || []
              : role.capabilityLabelsFr || role.capabilityLabelsEn || [];
            const roleSource = lang === "en"
              ? role.sourceLabelEn || role.sourceLabelFr || ""
              : role.sourceLabelFr || role.sourceLabelEn || "";
            return `${objective}${roleSource ? ` (${roleSource})` : ""}: ${capabilities.join(", ") || t("rôle à préciser", "role to clarify")}`;
          }).join(" • ");
          return doc.splitTextToSize(
            `• ${actor.toolName || t("IA", "AI")}${host} (${source}${access ? ` · ${access}` : ""}${contract}${allowance ? ` · ${allowance}` : ""}${variableCost}) — ${roles}`,
            CW - 14
          ) as string[];
        })
        : (aiAnalysis.workflows || []).slice(0, 4).map((workflow) => {
            const objective = lang === "en"
              ? workflow.objectiveLabelEn || workflow.objectiveLabelFr || ""
              : workflow.objectiveLabelFr || workflow.objectiveLabelEn || "";
            const actors = (workflow.actors || [])
              .map((actor) => actor.toolName || t("IA", "AI"))
              .join(", ");
            return doc.splitTextToSize(`• ${objective} — ${actors}`, CW - 14) as string[];
          });
      const findingLines = aiFindings.map((finding) => {
        const label = localizedField(finding, "label", lang) || humanizeId(finding.id);
        const action = localizedField(finding, "action", lang);
        return doc.splitTextToSize(`• ${label}${action ? ` — ${action}` : ""}`, CW - 14) as string[];
      });
      const aiBoxH =
        24 +
        actorLines.reduce((sum, lines) => sum + Math.max(lines.length, 1) * 4 + 3, 0) +
        (findingLines.length > 0
          ? 10 + findingLines.reduce((sum, lines) => sum + Math.max(lines.length, 1) * 4 + 3, 0)
          : 0);

      y = checkPageBreak(y, aiBoxH + 8);
      doc.setFillColor(244, 241, 255);
      doc.roundedRect(M, y, CW, aiBoxH, 3, 3, "F");
      let ay = y + 8;
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(t("Lecture IA", "AI read"), M + 5, ay);
      ay += 7;
      doc.setFontSize(11);
      doc.setTextColor(...NAVY);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${Number(aiAnalysis.objectiveCount || 0)} ${t("étape(s)", "step(s)")} • ${Number(aiAnalysis.actorCount || 0)} ${t("acteur(s)", "actor(s)")} • ${Number(aiAnalysis.capabilityCount || 0)} ${t("capacité(s)", "capability or capabilities")}`,
        M + 5,
        ay
      );
      ay += 7;

      for (const lines of actorLines) {
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.setFont("helvetica", "normal");
        doc.text(lines, M + 7, ay);
        ay += Math.max(lines.length, 1) * 4 + 3;
      }

      if (findingLines.length > 0) {
        ay += 2;
        doc.setFontSize(9);
        doc.setTextColor(...ORANGE);
        doc.setFont("helvetica", "bold");
        doc.text(t("Points à cadrer", "Points to frame"), M + 5, ay);
        ay += 6;
        for (const lines of findingLines) {
          doc.setFontSize(8);
          doc.setTextColor(...GRAY);
          doc.setFont("helvetica", "normal");
          doc.text(lines, M + 7, ay);
          ay += Math.max(lines.length, 1) * 4 + 3;
        }
      }

      y += aiBoxH + 10;
    }

    // Prescriptions summary
    const cancels = allPrescriptions.filter(p => p.verdict === "cancel").length;
    const reviews = allPrescriptions.filter(p => p.verdict === "review").length;
    const downgrades = allPrescriptions.filter(p => p.verdict === "downgrade").length;

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(M, y, CW, 22, 3, 3, "F");
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(t("Actions identifiées", "Identified Actions"), M + 5, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(`🔴 ${cancels} ${t("annulations", "cancellations")}  •  🟠 ${reviews} ${t("à revoir", "to review")}  •  🔵 ${downgrades} ${t("downgrades", "downgrades")}`, M + 5, y);
    y += 16;

    // Category breakdown
    doc.setTextColor(...NAVY);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(t("Répartition par catégorie", "Category Breakdown"), M, y);
    y += 8;

    const catMap = new Map<string, { count: number; cost: number; tools: Tool[] }>();
    for (const tool of payload.selectedTools) {
      const cat = tool.category || "other";
      const e = catMap.get(cat) || { count: 0, cost: 0, tools: [] };
      e.count++;
      e.cost += tool.price;
      e.tools.push(tool);
      catMap.set(cat, e);
    }
    const cats = Array.from(catMap.entries()).sort((a, b) => b[1].cost - a[1].cost);
    const maxCost = Math.max(...cats.map(c => c[1].cost), 1);

    for (const [cat, data] of cats) {
      y = checkPageBreak(y, 10);
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(cat, M, y + 4, { maxWidth: 35 });
      // bar
      const barX = M + 38;
      const barW = CW - 70;
      doc.setFillColor(230, 230, 235);
      doc.roundedRect(barX, y, barW, 5, 2, 2, "F");
      doc.setFillColor(...ORANGE);
      doc.roundedRect(barX, y, barW * (data.cost / maxCost), 5, 2, 2, "F");
      doc.setTextColor(...NAVY);
      doc.setFont("helvetica", "bold");
      doc.text(formatMonthlyTotal(data.tools, t), M + CW - 25, y + 4, { align: "right", maxWidth: 44 });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      doc.text(`(${data.count})`, M + CW, y + 4, { align: "right" });
      y += 9;
    }

    addFooter(2);

    // ─── PAGE 3+: TOOL-BY-TOOL ANALYSIS ────────────────────────
    doc.addPage();
    let pageNum = 3;
    y = 25;

    doc.setTextColor(...NAVY);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(t("Analyse outil par outil", "Tool-by-Tool Analysis"), M, y);
    y += 12;

    const sortedTools = [...payload.selectedTools].sort((a, b) => {
      const sa = payload.toolScores[a.id]?.scoreFinal ?? 50;
      const sb = payload.toolScores[b.id]?.scoreFinal ?? 50;
      return sa - sb; // worst first
    });

    for (const tool of sortedTools) {
      y = checkPageBreak(y, 32);
      const score = payload.toolScores[tool.id];
      const scoreFinal = score?.scoreFinal ?? 50;
      const sc = scoreColor(scoreFinal);

      // Tool card background
      doc.setFillColor(...LIGHT_BG);
      doc.roundedRect(M, y, CW, 26, 3, 3, "F");

      // Score badge
      doc.setFillColor(...sc);
      doc.roundedRect(M + 2, y + 3, 18, 18, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${scoreFinal}`, M + 11, y + 14, { align: "center" });

      // Tool name & category
      doc.setTextColor(...NAVY);
      doc.setFontSize(11);
      doc.text(tool.name, M + 25, y + 10);
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(`${tool.category || "—"} • ${tool.tool_type} • ${formatToolMonthlyPrice(tool, t)}`, M + 25, y + 17);

      // Prescription if any
      const pres = allPrescriptions.find(p => p.toolId === tool.id);
      if (pres) {
        const verdictColor = pres.verdict === "cancel" ? RED : pres.verdict === "downgrade" ? ORANGE : [26, 90, 138] as const;
        doc.setTextColor(...verdictColor);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        const verdictLabel = pres.verdict === "cancel" ? t("ANNULER", "CANCEL") :
          pres.verdict === "downgrade" ? t("DOWNGRADE", "DOWNGRADE") : t("À REVOIR", "REVIEW");
        doc.text(`${verdictLabel} — ${pres.message}`, M + CW - 5, y + 10, { align: "right", maxWidth: 70 });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...GRAY);
        doc.text(`-${formatPrescriptionTotal([pres], payload.selectedTools, t)}/${t("mois", "mo")}`, M + CW - 5, y + 17, { align: "right" });
      }

      y += 30;
    }

    addFooter(pageNum);

    // ─── RECOMMENDATIONS PAGE ──────────────────────────────────
    if (payload.recommendations.length > 0) {
      doc.addPage();
      pageNum++;
      y = 25;

      doc.setTextColor(...NAVY);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(t("Recommandations", "Recommendations"), M, y);
      y += 12;

      doc.setFontSize(10);
      doc.setTextColor(...GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(t(
        "Ces outils pourraient optimiser ta stack :",
        "These tools could optimize your stack:"
      ), M, y);
      y += 10;

      for (const rec of payload.recommendations.slice(0, 6)) {
        y = checkPageBreak(y, 18);
        doc.setFillColor(...LIGHT_BG);
        doc.roundedRect(M, y, CW, 14, 2, 2, "F");
        doc.setFillColor(...GREEN);
        doc.roundedRect(M + 2, y + 2, 10, 10, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("NEW", M + 7, y + 9, { align: "center" });

        doc.setTextColor(...NAVY);
        doc.setFontSize(10);
        doc.text(rec.name, M + 16, y + 9);
        doc.setTextColor(...GRAY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`${rec.category || "—"} • ${formatToolMonthlyPrice(rec, t)}`, M + 16 + doc.getTextWidth(rec.name) + 4, y + 9);
        y += 18;
      }

      addFooter(pageNum);
    }

    // ─── CHECKLIST PAGE ────────────────────────────────────────
    doc.addPage();
    pageNum++;
    y = 25;

    doc.setTextColor(...NAVY);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(t("Checklist d'actions", "Action Checklist"), M, y);
    y += 12;

    const urgencyGroups = [
      {
        label: t("🔴 MAINTENANT", "🔴 NOW"),
        items: [...payload.prescriptions.phase1, ...payload.prescriptions.phase3.filter(p => p.type === "doublon" || p.type === "doublon-ia")],
      },
      {
        label: t("🟠 CETTE SEMAINE", "🟠 THIS WEEK"),
        items: [...payload.prescriptions.phase2, ...payload.prescriptions.phase3.filter(p => p.type === "dormant")],
      },
    ];

    for (const group of urgencyGroups) {
      if (group.items.length === 0) continue;
      y = checkPageBreak(y, 14);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NAVY);
      doc.text(group.label, M, y);
      y += 7;

      for (const item of group.items) {
        y = checkPageBreak(y, 10);
        const toolName = payload.selectedTools.find(t => t.id === item.toolId)?.name ?? item.toolId;

        // Checkbox
        doc.setDrawColor(...GRAY);
        doc.setLineWidth(0.3);
        doc.rect(M, y - 3, 4, 4);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...NAVY);
        const verdictTag = item.verdict === "cancel" ? t("Annuler", "Cancel") :
          item.verdict === "downgrade" ? "Downgrade" : t("Vérifier", "Review");
        doc.text(`${verdictTag} ${toolName}`, M + 7, y);
        doc.setTextColor(...GRAY);
        doc.text(`-${formatPrescriptionTotal([item], payload.selectedTools, t)}/${t("mois", "mo")}`, M + CW, y, { align: "right" });
        y += 8;
      }
      y += 5;
    }

    // Sparring partner closing
    y = checkPageBreak(y, 30);
    y += 5;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(M, y, CW, 25, 3, 3, "F");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "italic");
    doc.text(t(
      `"${payload.firstName}, commence par les actions MAINTENANT. Revois ta stack dans 3 mois."`,
      `"${payload.firstName}, start with the NOW actions. Review your stack in 3 months."`
    ), M + 5, y + 10, { maxWidth: CW - 10 });
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(t("— Ton sparring partner", "— Your sparring partner"), M + 5, y + 19);

    addFooter(pageNum);

    // Generate output
    const pdfBytes = doc.output("arraybuffer");

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tooltrim-diagnostic-${payload.firstName.toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({ error: "PDF generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
