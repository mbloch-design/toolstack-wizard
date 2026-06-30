import { describe, expect, it } from "vitest";
import { shouldBlockOptionalReportEmail } from "@/components/diagnostic/DiagStepPreVerdict";

describe("pre-verdict contracts", () => {
  it("does not block restitution when the optional email copy is checked but left empty", () => {
    expect(shouldBlockOptionalReportEmail(true, "")).toBe(false);
    expect(shouldBlockOptionalReportEmail(true, "   ")).toBe(false);
  });

  it("blocks only when the user typed an invalid email to receive a copy", () => {
    expect(shouldBlockOptionalReportEmail(true, "not-an-email")).toBe(true);
    expect(shouldBlockOptionalReportEmail(true, "sofia@example.com")).toBe(false);
    expect(shouldBlockOptionalReportEmail(false, "not-an-email")).toBe(false);
  });
});
