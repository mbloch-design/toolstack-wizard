import type { BackofficeSession } from "@/lib/backofficeApi";

export type PilotageLane = "email" | "quality" | "recovery" | "value" | "watch";

export type PilotageRow = {
  sessionId: string;
  createdAt: string;
  firstName: string | null;
  email: string | null;
  persona: string | null;
  profile: string | null;
  status: "new" | "active" | "completed" | "abandoned";
  lane: PilotageLane;
  priorityScore: number;
  priorityLabel: "critical" | "high" | "medium" | "low";
  actionFr: string;
  actionEn: string;
  reasonsFr: string[];
  reasonsEn: string[];
  monthlyWaste: number;
  annualSavings: number;
  healthScore: number | null;
  emailFailedCount: number;
  emailSentCount: number;
  emailJobsCount: number;
  reviewRequired: boolean;
  personaConfidence: string | null;
  stackGoal: string | null;
};

export type PilotageSummary = {
  total: number;
  critical: number;
  high: number;
  reviewRequired: number;
  recovery: number;
  emailIssues: number;
  monthlyWaste: number;
  annualSavings: number;
};

export type PilotageResult = {
  rows: PilotageRow[];
  summary: PilotageSummary;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function textValue(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSessionStatus(session: BackofficeSession): PilotageRow["status"] {
  if (session.abandoned_at) return "abandoned";
  if (session.completed_at) return "completed";
  if ((session.last_step_id || 0) > 0) return "active";
  return "new";
}

function getSessionConfidenceScore(session: BackofficeSession) {
  const insights = asRecord(session.diagnostic_insights);
  const confidence = asRecord(insights?.confidence);
  const score = confidence?.score;
  return typeof score === "number" && Number.isFinite(score) ? score : null;
}

function getSessionCalibration(session: BackofficeSession) {
  const insights = asRecord(session.diagnostic_insights);
  const calibration = asRecord(insights?.calibration);
  const flags = Array.isArray(calibration?.flags)
    ? calibration.flags.map(asRecord).filter((flag): flag is Record<string, unknown> => !!flag)
    : [];
  const score = calibration?.score;
  return {
    score: typeof score === "number" && Number.isFinite(score) ? score : null,
    reviewRequired: calibration?.reviewRequired === true,
    highFlags: flags.filter((flag) => flag.severity === "high").length,
    mediumFlags: flags.filter((flag) => flag.severity === "medium").length,
  };
}

function getSessionContext(session: BackofficeSession) {
  const context = asRecord(session.diagnostic_context);
  return {
    personaConfidence: textValue(context, "persona_confidence"),
    stackGoal: textValue(context, "stack_goal"),
  };
}

function getReviewRequired(session: BackofficeSession) {
  const calibration = getSessionCalibration(session);
  const confidenceScore = getSessionConfidenceScore(session);
  return (
    calibration.reviewRequired ||
    calibration.score == null ||
    confidenceScore == null ||
    confidenceScore < 60 ||
    calibration.highFlags > 0
  );
}

function getPriorityLabel(score: number): PilotageRow["priorityLabel"] {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function getLane(
  session: BackofficeSession,
  status: PilotageRow["status"],
  reviewRequired: boolean,
  monthlyWaste: number
): PilotageLane {
  if (session.email_failed_count > 0 || (session.completed_at && session.email_jobs_count > 0 && session.email_sent_count === 0)) {
    return "email";
  }
  if (reviewRequired) return "quality";
  if (status === "abandoned" || status === "active") return "recovery";
  if (monthlyWaste >= 100 || numberValue(session.annual_savings) >= 1200) return "value";
  return "watch";
}

function getLaneAction(lane: PilotageLane) {
  const actions: Record<PilotageLane, { fr: string; en: string }> = {
    email: { fr: "Reparer ou relancer l'email", en: "Fix or retry email" },
    quality: { fr: "Verifier la calibration", en: "Review calibration" },
    recovery: { fr: "Relancer la session", en: "Recover session" },
    value: { fr: "Prioriser le suivi valeur", en: "Prioritize value follow-up" },
    watch: { fr: "Surveiller", en: "Watch" },
  };
  return actions[lane];
}

function buildReasons(session: BackofficeSession, status: PilotageRow["status"], reviewRequired: boolean) {
  const reasonsFr: string[] = [];
  const reasonsEn: string[] = [];
  const monthlyWaste = numberValue(session.estimated_waste);
  const calibration = getSessionCalibration(session);
  const confidenceScore = getSessionConfidenceScore(session);
  const { personaConfidence } = getSessionContext(session);

  if (session.email_failed_count > 0) {
    reasonsFr.push("Email en erreur");
    reasonsEn.push("Email failed");
  }
  if (session.completed_at && session.email_jobs_count > 0 && session.email_sent_count === 0) {
    reasonsFr.push("Rapport non envoye");
    reasonsEn.push("Report not sent");
  }
  if (reviewRequired) {
    reasonsFr.push("Revue humaine conseillee");
    reasonsEn.push("Human review advised");
  }
  if (calibration.highFlags > 0) {
    reasonsFr.push(`${calibration.highFlags} flag(s) critique(s)`);
    reasonsEn.push(`${calibration.highFlags} critical flag(s)`);
  }
  if (confidenceScore != null && confidenceScore < 60) {
    reasonsFr.push("Confiance basse");
    reasonsEn.push("Low confidence");
  }
  if (personaConfidence === "unsure" || personaConfidence === "hybrid") {
    reasonsFr.push(personaConfidence === "unsure" ? "Persona incertaine" : "Persona hybride");
    reasonsEn.push(personaConfidence === "unsure" ? "Uncertain persona" : "Hybrid persona");
  }
  if (status === "abandoned") {
    reasonsFr.push("Tunnel abandonne");
    reasonsEn.push("Abandoned funnel");
  } else if (status === "active") {
    reasonsFr.push("Tunnel en cours");
    reasonsEn.push("Funnel in progress");
  }
  if (monthlyWaste >= 100) {
    reasonsFr.push("Valeur economique elevee");
    reasonsEn.push("High economic value");
  }
  if (reasonsFr.length === 0) {
    reasonsFr.push("Pas d'alerte majeure");
    reasonsEn.push("No major alert");
  }

  return { reasonsFr, reasonsEn };
}

function scoreSession(session: BackofficeSession, status: PilotageRow["status"], reviewRequired: boolean) {
  const monthlyWaste = numberValue(session.estimated_waste);
  const healthScore = typeof session.health_score === "number" ? session.health_score : null;
  const confidenceScore = getSessionConfidenceScore(session);
  const calibration = getSessionCalibration(session);
  const { personaConfidence } = getSessionContext(session);
  let score = 0;

  score += Math.min(30, Math.round(monthlyWaste / 10));
  if (healthScore != null) score += Math.max(0, Math.round((70 - healthScore) / 2));
  if (session.email_failed_count > 0) score += 35;
  if (session.completed_at && session.email_jobs_count > 0 && session.email_sent_count === 0) score += 25;
  if (reviewRequired) score += 25;
  score += calibration.highFlags * 15 + calibration.mediumFlags * 7;
  if (confidenceScore != null && confidenceScore < 60) score += 15;
  if (status === "abandoned") score += 18;
  if (status === "active") score += 10;
  if (personaConfidence === "unsure") score += 10;
  if (personaConfidence === "hybrid") score += 5;

  return Math.min(100, score);
}

export function buildBackofficePilotage(sessions: BackofficeSession[]): PilotageResult {
  const rows = sessions.map((session) => {
    const status = getSessionStatus(session);
    const monthlyWaste = numberValue(session.estimated_waste);
    const reviewRequired = getReviewRequired(session);
    const lane = getLane(session, status, reviewRequired, monthlyWaste);
    const priorityScore = scoreSession(session, status, reviewRequired);
    const action = getLaneAction(lane);
    const reasons = buildReasons(session, status, reviewRequired);
    const context = getSessionContext(session);

    return {
      sessionId: session.session_id,
      createdAt: session.created_at,
      firstName: session.first_name,
      email: session.email,
      persona: session.persona,
      profile: session.stack_profile,
      status,
      lane,
      priorityScore,
      priorityLabel: getPriorityLabel(priorityScore),
      actionFr: action.fr,
      actionEn: action.en,
      reasonsFr: reasons.reasonsFr,
      reasonsEn: reasons.reasonsEn,
      monthlyWaste,
      annualSavings: numberValue(session.annual_savings),
      healthScore: session.health_score,
      emailFailedCount: session.email_failed_count,
      emailSentCount: session.email_sent_count,
      emailJobsCount: session.email_jobs_count,
      reviewRequired,
      personaConfidence: context.personaConfidence,
      stackGoal: context.stackGoal,
    };
  }).sort(
    (a, b) =>
      b.priorityScore - a.priorityScore ||
      b.monthlyWaste - a.monthlyWaste ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const summary = rows.reduce<PilotageSummary>(
    (acc, row) => {
      acc.total += 1;
      if (row.priorityLabel === "critical") acc.critical += 1;
      if (row.priorityLabel === "high") acc.high += 1;
      if (row.reviewRequired) acc.reviewRequired += 1;
      if (row.lane === "recovery") acc.recovery += 1;
      if (row.lane === "email") acc.emailIssues += 1;
      acc.monthlyWaste += row.monthlyWaste;
      acc.annualSavings += row.annualSavings;
      return acc;
    },
    {
      total: 0,
      critical: 0,
      high: 0,
      reviewRequired: 0,
      recovery: 0,
      emailIssues: 0,
      monthlyWaste: 0,
      annualSavings: 0,
    }
  );

  return { rows, summary };
}
