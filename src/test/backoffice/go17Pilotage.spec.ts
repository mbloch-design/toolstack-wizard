// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { BackofficeSession } from "@/lib/backofficeApi";
import { buildBackofficePilotage } from "@/lib/backofficePilotage";

function session(overrides: Partial<BackofficeSession>): BackofficeSession {
  return {
    session_id: "00000000-0000-4000-8000-000000000001",
    created_at: "2026-05-28T10:00:00.000Z",
    updated_at: null,
    completed_at: null,
    abandoned_at: null,
    last_client_seen_at: null,
    resumed_at: null,
    recovery_state: null,
    action_state: null,
    diagnostic_context: {},
    first_name: "Alex",
    email: "alex@example.com",
    persona: "SOLO",
    language: "fr",
    source: "diagnostic",
    funnel_version: "go17-test",
    last_step_id: 0,
    health_score: null,
    health_label: null,
    stack_total_cost: null,
    estimated_waste: null,
    optimized_cost: null,
    annual_savings: null,
    actions_completed: null,
    stack_profile: null,
    stack_maturity: null,
    primary_risk: null,
    risk_flags: null,
    functional_coverage: null,
    diagnostic_insights: null,
    admin_tags: null,
    admin_note: null,
    admin_updated_at: null,
    event_count: 0,
    last_event_at: null,
    max_step_seen: null,
    email_jobs_count: 0,
    email_sent_count: 0,
    email_failed_count: 0,
    last_email_job_at: null,
    ...overrides,
  };
}

describe("GO17 - Back-office pilotage", () => {
  it("priorise les incidents email avant les sessions saines", () => {
    const result = buildBackofficePilotage([
      session({
        session_id: "00000000-0000-4000-8000-000000000010",
        completed_at: "2026-05-28T11:00:00.000Z",
        estimated_waste: 40,
        annual_savings: 480,
        health_score: 82,
        diagnostic_insights: {
          confidence: { score: 90 },
          calibration: { score: 88, reviewRequired: false, flags: [] },
        },
      }),
      session({
        session_id: "00000000-0000-4000-8000-000000000020",
        completed_at: "2026-05-28T11:30:00.000Z",
        estimated_waste: 120,
        annual_savings: 1440,
        health_score: 44,
        email_jobs_count: 1,
        email_sent_count: 0,
        email_failed_count: 1,
        diagnostic_insights: {
          confidence: { score: 85 },
          calibration: { score: 82, reviewRequired: false, flags: [] },
        },
      }),
    ]);

    expect(result.rows[0].lane).toBe("email");
    expect(result.rows[0].sessionId).toBe("00000000-0000-4000-8000-000000000020");
    expect(result.summary.emailIssues).toBe(1);
  });

  it("fait remonter les diagnostics a revoir", () => {
    const result = buildBackofficePilotage([
      session({
        session_id: "00000000-0000-4000-8000-000000000030",
        completed_at: "2026-05-28T12:00:00.000Z",
        diagnostic_context: { persona_confidence: "unsure", stack_goal: "simplify" },
        diagnostic_insights: {
          confidence: { score: 42 },
          calibration: {
            score: 50,
            reviewRequired: true,
            flags: [{ id: "low_confidence", severity: "high" }],
          },
        },
      }),
    ]);

    expect(result.rows[0].lane).toBe("quality");
    expect(result.rows[0].reviewRequired).toBe(true);
    expect(result.rows[0].reasonsFr).toContain("Persona incertaine");
    expect(result.summary.reviewRequired).toBe(1);
  });

  it("classe les abandons dans la file de relance", () => {
    const result = buildBackofficePilotage([
      session({
        session_id: "00000000-0000-4000-8000-000000000040",
        abandoned_at: "2026-05-28T12:30:00.000Z",
        last_step_id: 5,
        estimated_waste: 90,
        diagnostic_insights: {
          confidence: { score: 80 },
          calibration: { score: 78, reviewRequired: false, flags: [] },
        },
      }),
    ]);

    expect(result.rows[0].lane).toBe("recovery");
    expect(result.rows[0].reasonsEn).toContain("Abandoned funnel");
    expect(result.summary.recovery).toBe(1);
  });
});
