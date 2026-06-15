export type AdminAlertLane = "email" | "quality" | "recovery" | "value" | "watch";
export type AdminAlertPriority = "critical" | "high" | "medium" | "low";

export type AdminAlertInputRow = {
  session_id: string;
  created_at: string;
  first_name?: string | null;
  email?: string | null;
  persona?: string | null;
  stack_profile?: string | null;
  completed_at?: string | null;
  abandoned_at?: string | null;
  last_step_id?: number | null;
  health_score?: number | null;
  estimated_waste?: number | null;
  annual_savings?: number | null;
  email_jobs_count?: number | null;
  email_sent_count?: number | null;
  email_failed_count?: number | null;
  diagnostic_context?: Record<string, unknown> | null;
  diagnostic_insights?: Record<string, unknown> | null;
};

export type AdminAlertRow = {
  sessionId: string;
  createdAt: string;
  contact: string;
  email: string | null;
  persona: string | null;
  profile: string | null;
  lane: AdminAlertLane;
  priority: AdminAlertPriority;
  priorityScore: number;
  actionFr: string;
  actionEn: string;
  reasonsFr: string[];
  reasonsEn: string[];
  monthlyWaste: number;
  annualSavings: number;
  healthScore: number | null;
};

export type AdminAlertDigest = {
  generatedAt: string;
  rows: AdminAlertRow[];
  summary: {
    total: number;
    critical: number;
    high: number;
    email: number;
    quality: number;
    recovery: number;
    value: number;
    monthlyWaste: number;
    annualSavings: number;
  };
  subjectFr: string;
  subjectEn: string;
  textFr: string;
  textEn: string;
  htmlFr: string;
  htmlEn: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function money(value: number) {
  return `${Math.round(value)}€`;
}

function getStatus(row: AdminAlertInputRow) {
  if (row.abandoned_at) return "abandoned";
  if (row.completed_at) return "completed";
  if ((row.last_step_id || 0) > 0) return "active";
  return "new";
}

function getCalibration(row: AdminAlertInputRow) {
  const insights = asRecord(row.diagnostic_insights);
  const calibration = asRecord(insights?.calibration);
  const confidence = asRecord(insights?.confidence);
  const flags = Array.isArray(calibration?.flags)
    ? calibration.flags.map(asRecord).filter((flag): flag is Record<string, unknown> => !!flag)
    : [];
  const confidenceScore = confidence?.score;
  const calibrationScore = calibration?.score;
  return {
    reviewRequired: calibration?.reviewRequired === true,
    confidenceScore: typeof confidenceScore === "number" ? confidenceScore : null,
    calibrationScore: typeof calibrationScore === "number" ? calibrationScore : null,
    highFlags: flags.filter((flag) => flag.severity === "high").length,
    mediumFlags: flags.filter((flag) => flag.severity === "medium").length,
  };
}

function getContext(row: AdminAlertInputRow) {
  const context = asRecord(row.diagnostic_context);
  const value = context?.persona_confidence;
  return typeof value === "string" ? value : null;
}

function getReviewRequired(row: AdminAlertInputRow) {
  const calibration = getCalibration(row);
  return (
    calibration.reviewRequired ||
    calibration.calibrationScore == null ||
    calibration.confidenceScore == null ||
    calibration.confidenceScore < 60 ||
    calibration.highFlags > 0
  );
}

function getPriorityLabel(score: number): AdminAlertPriority {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function getLane(row: AdminAlertInputRow, reviewRequired: boolean, monthlyWaste: number): AdminAlertLane {
  const status = getStatus(row);
  if (numberValue(row.email_failed_count) > 0 || (row.completed_at && numberValue(row.email_jobs_count) > 0 && numberValue(row.email_sent_count) === 0)) {
    return "email";
  }
  if (reviewRequired) return "quality";
  if (status === "abandoned" || status === "active") return "recovery";
  if (monthlyWaste >= 100 || numberValue(row.annual_savings) >= 1200) return "value";
  return "watch";
}

function scoreRow(row: AdminAlertInputRow, reviewRequired: boolean) {
  const monthlyWaste = numberValue(row.estimated_waste);
  const healthScore = typeof row.health_score === "number" ? row.health_score : null;
  const calibration = getCalibration(row);
  const status = getStatus(row);
  const personaConfidence = getContext(row);
  let score = 0;

  score += Math.min(30, Math.round(monthlyWaste / 10));
  if (healthScore != null) score += Math.max(0, Math.round((70 - healthScore) / 2));
  if (numberValue(row.email_failed_count) > 0) score += 35;
  if (row.completed_at && numberValue(row.email_jobs_count) > 0 && numberValue(row.email_sent_count) === 0) score += 25;
  if (reviewRequired) score += 25;
  score += calibration.highFlags * 15 + calibration.mediumFlags * 7;
  if (calibration.confidenceScore != null && calibration.confidenceScore < 60) score += 15;
  if (status === "abandoned") score += 18;
  if (status === "active") score += 10;
  if (personaConfidence === "unsure") score += 10;
  if (personaConfidence === "hybrid") score += 5;

  return Math.min(100, score);
}

function reasons(row: AdminAlertInputRow, reviewRequired: boolean) {
  const status = getStatus(row);
  const calibration = getCalibration(row);
  const personaConfidence = getContext(row);
  const monthlyWaste = numberValue(row.estimated_waste);
  const fr: string[] = [];
  const en: string[] = [];

  if (numberValue(row.email_failed_count) > 0) {
    fr.push("Email en erreur");
    en.push("Email failed");
  }
  if (row.completed_at && numberValue(row.email_jobs_count) > 0 && numberValue(row.email_sent_count) === 0) {
    fr.push("Rapport non envoye");
    en.push("Report not sent");
  }
  if (reviewRequired) {
    fr.push("Revue humaine conseillee");
    en.push("Human review advised");
  }
  if (calibration.highFlags > 0) {
    fr.push("Flag critique");
    en.push("Critical flag");
  }
  if (status === "abandoned") {
    fr.push("Tunnel abandonne");
    en.push("Abandoned funnel");
  }
  if (monthlyWaste >= 100) {
    fr.push("Valeur economique elevee");
    en.push("High economic value");
  }
  if (personaConfidence === "unsure" || personaConfidence === "hybrid") {
    fr.push(personaConfidence === "unsure" ? "Persona incertaine" : "Persona hybride");
    en.push(personaConfidence === "unsure" ? "Uncertain persona" : "Hybrid persona");
  }

  return { fr, en };
}

function actionForLane(lane: AdminAlertLane) {
  const map: Record<AdminAlertLane, { fr: string; en: string }> = {
    email: { fr: "Relancer ou corriger l'email", en: "Retry or fix the email" },
    quality: { fr: "Verifier la calibration", en: "Review the calibration" },
    recovery: { fr: "Relancer la session", en: "Recover the session" },
    value: { fr: "Prioriser le suivi valeur", en: "Prioritize value follow-up" },
    watch: { fr: "Surveiller", en: "Watch" },
  };
  return map[lane];
}

function rowToText(row: AdminAlertRow, locale: "fr" | "en") {
  const reasonsText = (locale === "fr" ? row.reasonsFr : row.reasonsEn).join(", ");
  const action = locale === "fr" ? row.actionFr : row.actionEn;
  return [
    `${row.priorityScore} ${row.priority.toUpperCase()} - ${row.contact}`,
    `${row.lane} - ${action}`,
    reasonsText,
    `${money(row.monthlyWaste)}/mois - ${money(row.annualSavings)}/an`,
    row.email || row.sessionId,
  ].join(" | ");
}

function buildHtml(rows: AdminAlertRow[], locale: "fr" | "en") {
  const title = locale === "fr" ? "Alertes back-office ToolTrim" : "ToolTrim back-office alerts";
  const intro = locale === "fr"
    ? "Voici les priorites critiques et hautes detectees automatiquement."
    : "Here are the critical and high priorities detected automatically.";
  const items = rows.map((row) => {
    const action = locale === "fr" ? row.actionFr : row.actionEn;
    const reasonsText = (locale === "fr" ? row.reasonsFr : row.reasonsEn).join(", ");
    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:700;">${row.priorityScore}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(row.contact)}<br><span style="color:#6b7280;">${escapeHtml(row.email || row.sessionId)}</span></td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(row.lane)}<br><span style="color:#6b7280;">${escapeHtml(action)}</span></td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(reasonsText)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${money(row.monthlyWaste)}/mois<br><span style="color:#6b7280;">${money(row.annualSavings)}/an</span></td>
      </tr>
    `;
  }).join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:24px;color:#111827;">
      <h1 style="font-size:22px;margin:0 0 8px;">${title}</h1>
      <p style="color:#374151;">${intro}</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;text-align:left;">
            <th style="padding:8px;">Score</th>
            <th style="padding:8px;">Contact</th>
            <th style="padding:8px;">Decision</th>
            <th style="padding:8px;">Raisons</th>
            <th style="padding:8px;">Valeur</th>
          </tr>
        </thead>
        <tbody>${items}</tbody>
      </table>
    </div>
  `;
}

export function buildAdminAlertDigest(inputRows: AdminAlertInputRow[], options?: { now?: string; limit?: number }): AdminAlertDigest {
  const generatedAt = options?.now || new Date().toISOString();
  const limit = Math.max(1, Math.min(50, options?.limit || 12));
  const rows = inputRows
    .map((row) => {
      const monthlyWaste = numberValue(row.estimated_waste);
      const reviewRequired = getReviewRequired(row);
      const lane = getLane(row, reviewRequired, monthlyWaste);
      const priorityScore = scoreRow(row, reviewRequired);
      const reasonList = reasons(row, reviewRequired);
      const action = actionForLane(lane);
      return {
        sessionId: row.session_id,
        createdAt: row.created_at,
        contact: row.first_name || "Sans nom",
        email: row.email || null,
        persona: row.persona || null,
        profile: row.stack_profile || null,
        lane,
        priority: getPriorityLabel(priorityScore),
        priorityScore,
        actionFr: action.fr,
        actionEn: action.en,
        reasonsFr: reasonList.fr,
        reasonsEn: reasonList.en,
        monthlyWaste,
        annualSavings: numberValue(row.annual_savings),
        healthScore: row.health_score ?? null,
      };
    })
    .filter((row) => row.priority === "critical" || row.priority === "high")
    .sort((a, b) => b.priorityScore - a.priorityScore || b.monthlyWaste - a.monthlyWaste)
    .slice(0, limit);

  const summary = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.priority === "critical") acc.critical += 1;
      if (row.priority === "high") acc.high += 1;
      if (row.lane === "email") acc.email += 1;
      if (row.lane === "quality") acc.quality += 1;
      if (row.lane === "recovery") acc.recovery += 1;
      if (row.lane === "value") acc.value += 1;
      acc.monthlyWaste += row.monthlyWaste;
      acc.annualSavings += row.annualSavings;
      return acc;
    },
    { total: 0, critical: 0, high: 0, email: 0, quality: 0, recovery: 0, value: 0, monthlyWaste: 0, annualSavings: 0 }
  );

  const textFr = [
    `Alertes ToolTrim - ${summary.total} priorite(s)`,
    `Critiques: ${summary.critical} | Hautes: ${summary.high} | Email: ${summary.email} | Qualite: ${summary.quality}`,
    ...rows.map((row) => rowToText(row, "fr")),
  ].join("\n");
  const textEn = [
    `ToolTrim alerts - ${summary.total} priority item(s)`,
    `Critical: ${summary.critical} | High: ${summary.high} | Email: ${summary.email} | Quality: ${summary.quality}`,
    ...rows.map((row) => rowToText(row, "en")),
  ].join("\n");

  return {
    generatedAt,
    rows,
    summary,
    subjectFr: `ToolTrim - ${summary.critical} critique(s), ${summary.high} haute(s)`,
    subjectEn: `ToolTrim - ${summary.critical} critical, ${summary.high} high`,
    textFr,
    textEn,
    htmlFr: buildHtml(rows, "fr"),
    htmlEn: buildHtml(rows, "en"),
  };
}
