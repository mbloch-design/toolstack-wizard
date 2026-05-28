// @vitest-environment node
import { describe, expect, it } from "vitest";
import { runDiagnostic } from "@/utils/scoring";
import { GO14_DIAGNOSTIC_DATA, GO14_SCENARIOS } from "@/test/diagnostic/go14Fixtures";

describe("GO15 - Signaux onboarding/persona", () => {
  it("remonte un persona incertain dans les insights et la calibration", () => {
    const base = GO14_SCENARIOS.find((scenario) => scenario.id === "theo-fragile-confidence");
    expect(base).toBeTruthy();

    const result = runDiagnostic(
      {
        ...base!.sessionState,
        personaConfidence: "unsure",
        stackGoal: "simplify",
      },
      GO14_DIAGNOSTIC_DATA
    );

    const signalIds = result.insights.answerSignals.map((signal) => signal.id);
    const calibrationFlagIds = result.insights.calibration.flags.map((flag) => flag.id);

    expect(signalIds).toContain("onboarding_persona_uncertain");
    expect(signalIds).toContain("onboarding_goal_simplify");
    expect(calibrationFlagIds).toContain("onboarding_persona_uncertain");
    expect(result.insights.calibration.reviewRequired).toBe(true);
  });

  it("garde un profil clair comme signal faible non bloquant", () => {
    const base = GO14_SCENARIOS.find((scenario) => scenario.id === "sofia-lean-healthy");
    expect(base).toBeTruthy();

    const result = runDiagnostic(
      {
        ...base!.sessionState,
        personaConfidence: "clear",
        stackGoal: "quality",
      },
      GO14_DIAGNOSTIC_DATA
    );

    const signalIds = result.insights.answerSignals.map((signal) => signal.id);
    const calibrationFlagIds = result.insights.calibration.flags.map((flag) => flag.id);

    expect(signalIds).toContain("onboarding_goal_quality");
    expect(calibrationFlagIds).not.toContain("onboarding_persona_uncertain");
    expect(result.insights.calibration.reviewRequired).toBe(false);
  });
});
