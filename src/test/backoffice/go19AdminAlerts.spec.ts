// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildAdminAlertDigest, type AdminAlertInputRow } from "../../../supabase/functions/_shared/admin-alerts";

function row(overrides: Partial<AdminAlertInputRow>): AdminAlertInputRow {
  return {
    session_id: "00000000-0000-4000-8000-000000000001",
    created_at: "2026-05-28T10:00:00.000Z",
    first_name: "Alex",
    email: "alex@example.com",
    persona: "SOLO",
    stack_profile: "lean",
    completed_at: null,
    abandoned_at: null,
    last_step_id: 0,
    health_score: 80,
    estimated_waste: 20,
    annual_savings: 240,
    email_jobs_count: 0,
    email_sent_count: 0,
    email_failed_count: 0,
    diagnostic_context: { persona_confidence: "clear" },
    diagnostic_insights: {
      confidence: { score: 90 },
      calibration: { score: 88, reviewRequired: false, flags: [] },
    },
    ...overrides,
  };
}

describe("GO19 - Alertes admin back-office", () => {
  it("genere un digest seulement pour les priorites hautes et critiques", () => {
    const digest = buildAdminAlertDigest(
      [
        row({ session_id: "00000000-0000-4000-8000-000000000010" }),
        row({
          session_id: "00000000-0000-4000-8000-000000000020",
          completed_at: "2026-05-28T11:00:00.000Z",
          email_jobs_count: 1,
          email_failed_count: 1,
          estimated_waste: 140,
          annual_savings: 1680,
          health_score: 40,
        }),
      ],
      { now: "2026-05-28T12:00:00.000Z" }
    );

    expect(digest.rows).toHaveLength(1);
    expect(digest.rows[0].lane).toBe("email");
    expect(digest.summary.email).toBe(1);
    expect(digest.textFr).toContain("Email en erreur");
  });

  it("classe les revues qualite dans les alertes", () => {
    const digest = buildAdminAlertDigest([
      row({
        session_id: "00000000-0000-4000-8000-000000000030",
        diagnostic_context: { persona_confidence: "unsure" },
        diagnostic_insights: {
          confidence: { score: 35 },
          calibration: { score: 42, reviewRequired: true, flags: [{ id: "conflict", severity: "high" }] },
        },
      }),
    ]);

    expect(digest.rows[0].lane).toBe("quality");
    expect(digest.rows[0].reasonsFr).toContain("Revue humaine conseillee");
    expect(digest.htmlFr).toContain("Verifier la calibration");
  });
});
