import { describe, expect, it } from "vitest";
import { auditExplorerRelatedPaths } from "./explorer-related-paths.mjs";
describe("Explorer crawlable relations", () => {
  it("requires both audited Slack destinations", () => {
    expect(auditExplorerRelatedPaths("slack", ["discord", "microsoft-teams"])).toBeNull();
    expect(auditExplorerRelatedPaths("slack", ["discord"])).toMatch(/missing/);
    expect(auditExplorerRelatedPaths("slack", ["discord", "unrelated", "slack"])).toMatch(/missing/);
  });
  it("retains the three distinct destinations contract elsewhere", () => {
    expect(auditExplorerRelatedPaths("vercel", ["a", "b", "c"])).toBeNull();
    expect(auditExplorerRelatedPaths("vercel", ["a", "a", "b", "vercel"])).toMatch(/fewer/);
    expect(auditExplorerRelatedPaths("unaudited", ["a", "b"])).toMatch(/fewer/);
  });
});
