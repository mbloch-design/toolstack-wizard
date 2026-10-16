import { describe, expect, it } from "vitest";
import { getFeatureLabel } from "./featureLabels";

describe("compliance feature label", () => {
  it("translates the technical catalogue key into French", () => {
    expect(getFeatureLabel("security-compliance", "fr")).toBe("Conformité et sécurité");
  });
  it("keeps an English label on English pages", () => {
    expect(getFeatureLabel("security-compliance", "en")).toBe("Security and compliance");
  });
});
