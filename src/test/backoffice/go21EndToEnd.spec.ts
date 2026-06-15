// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { BackofficeSession } from "@/lib/backofficeApi";
import { buildBackofficePilotage } from "@/lib/backofficePilotage";
import { validateDiagnosticEmailContent } from "../../../supabase/functions/_shared/email-quality";
import { buildAdminAlertDigest, type AdminAlertInputRow } from "../../../supabase/functions/_shared/admin-alerts";

function session(overrides: Partial<BackofficeSession>): BackofficeSession {
  return {
    session_id: "00000000-0000-4000-8000-000000000900",
    created_at: "2026-05-28T09:00:00.000Z",
    updated_at: null,
    completed_at: "2026-05-28T09:30:00.000Z",
    abandoned_at: null,
    last_client_seen_at: "2026-05-28T09:30:00.000Z",
    resumed_at: null,
    recovery_state: null,
    action_state: { completed_action_ids: [], recovered_savings: 0 },
    diagnostic_context: { persona_confidence: "unsure", stack_goal: "reduce_costs" },
    first_name: "Maya",
    email: "maya@example.com",
    persona: "FREELANCE",
    language: "fr",
    source: "diagnostic",
    funnel_version: "go21-test",
    last_step_id: 8,
    health_score: 38,
    health_label: "Fragile",
    stack_total_cost: 260,
    estimated_waste: 145,
    optimized_cost: 115,
    annual_savings: 1740,
    actions_completed: 0,
    stack_profile: "overlap_heavy",
    stack_maturity: "fragile",
    primary_risk: "duplicate_ai_tools",
    risk_flags: null,
    functional_coverage: null,
    diagnostic_insights: {
      confidence: { score: 42 },
      calibration: {
        score: 48,
        reviewRequired: true,
        flags: [{ id: "persona_uncertain", severity: "high" }],
      },
    },
    admin_tags: null,
    admin_note: null,
    admin_updated_at: null,
    event_count: 10,
    last_event_at: "2026-05-28T09:30:00.000Z",
    max_step_seen: 8,
    email_jobs_count: 1,
    email_sent_count: 0,
    email_failed_count: 1,
    last_email_job_at: "2026-05-28T09:32:00.000Z",
    ...overrides,
  };
}

function alertRow(input: BackofficeSession): AdminAlertInputRow {
  return {
    session_id: input.session_id,
    created_at: input.created_at,
    first_name: input.first_name,
    email: input.email,
    persona: input.persona,
    stack_profile: input.stack_profile,
    completed_at: input.completed_at,
    abandoned_at: input.abandoned_at,
    last_step_id: input.last_step_id,
    health_score: input.health_score,
    estimated_waste: input.estimated_waste,
    annual_savings: input.annual_savings,
    email_jobs_count: input.email_jobs_count,
    email_sent_count: input.email_sent_count,
    email_failed_count: input.email_failed_count,
    diagnostic_context: input.diagnostic_context,
    diagnostic_insights: input.diagnostic_insights,
  };
}

describe("GO21 - Recette end-to-end back-office", () => {
  it("relie diagnostic, email quality, pilotage et alerte admin", () => {
    const criticalSession = session({});
    const pilotage = buildBackofficePilotage([criticalSession]);
    const ctaUrl = "https://tooltrim.com/results/session-token";
    const emailQuality = validateDiagnosticEmailContent({
      subject: "Ton diagnostic ToolTrim est pret",
      html: `<p>Ton rapport est pret avec les actions prioritaires.</p><p>Economies estimees: 1740 euros par an.</p><a href="${ctaUrl}">Ouvrir</a>`,
      text: `Ton rapport est pret avec les actions prioritaires.\nEconomies estimees: 1740 euros par an.\n${ctaUrl}`,
      ctaUrl,
    });
    const digest = buildAdminAlertDigest([alertRow(criticalSession)], { now: "2026-05-28T10:00:00.000Z" });

    expect(pilotage.rows[0].lane).toBe("email");
    expect(pilotage.rows[0].priorityLabel).toMatch(/critical|high/);
    expect(emailQuality.status).toBe("passed");
    expect(digest.rows[0].sessionId).toBe(criticalSession.session_id);
    expect(digest.summary.email).toBe(1);
  });
});
