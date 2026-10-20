import { describe, expect, it, vi } from "vitest";
import handler, { consentRequired } from "../../api/consent-region";

describe("consent region", () => {
  it("asks for consent in the EEA, the UK and Switzerland", () => {
    for (const country of ["FR", "de", "IS", "NO", "GB", "CH"]) expect(consentRequired(country)).toBe(true);
  });

  it("does not ask elsewhere", () => {
    for (const country of ["US", "CA", "IN", "BR", "JP"]) expect(consentRequired(country)).toBe(false);
  });

  it("asks when the country is missing or malformed", () => {
    for (const country of [undefined, "", "XX1", ["US"], "EU-FR"]) expect(consentRequired(country)).toBe(true);
  });

  it("answers without caching and without echoing the country", () => {
    const res = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    handler({ headers: { "x-vercel-ip-country": "US" } } as never, res as never);
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
    expect(res.json).toHaveBeenCalledWith({ consentRequired: false });
  });
});
