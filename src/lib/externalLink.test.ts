import { describe, expect, it } from "vitest";
import { safeExternalUrl } from "./externalLink";

describe("safeExternalUrl", () => {
  it("accepts absolute HTTP and HTTPS links", () => {
    expect(safeExternalUrl("https://example.com/pricing")).toBe("https://example.com/pricing");
    expect(safeExternalUrl("http://example.com")).toBe("http://example.com/");
  });

  it("rejects text, relative paths and unsafe protocols", () => {
    expect(safeExternalUrl(" rapports).")).toBeUndefined();
    expect(safeExternalUrl(" grammaire et clarté.")).toBeUndefined();
    expect(safeExternalUrl("/fr/tools")).toBeUndefined();
    expect(safeExternalUrl("javascript:alert(1)")).toBeUndefined();
  });
});
