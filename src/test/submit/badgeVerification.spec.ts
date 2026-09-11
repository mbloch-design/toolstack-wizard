import { describe, expect, it } from "vitest";
import { containsVisibleLinkedBadge } from "../../../api/_badge-verification";

const pageUrl = new URL("https://example.com/partners");

describe("submission badge verification", () => {
  it("accepts the official badge nested in a ToolTrim link", () => {
    expect(containsVisibleLinkedBadge(`
      <a target="_blank" href="https://tooltrim.com/?utm_source=example">
        <img src="https://tooltrim.com/tooltrim-badge.svg" alt="Discover ToolTrim">
      </a>
    `, pageUrl)).toBe(true);
  });

  it("rejects separate link and image elements", () => {
    expect(containsVisibleLinkedBadge(`
      <a href="https://tooltrim.com">ToolTrim</a>
      <img src="https://tooltrim.com/tooltrim-badge.svg" alt="Discover ToolTrim">
    `, pageUrl)).toBe(false);
  });

  it("rejects deceptive hosts and inline-hidden badges", () => {
    expect(containsVisibleLinkedBadge(`
      <a href="https://example.com/tooltrim.com"><img src="https://tooltrim.com/tooltrim-badge.svg"></a>
    `, pageUrl)).toBe(false);
    expect(containsVisibleLinkedBadge(`
      <a href="https://tooltrim.com" style="display:none"><img src="https://tooltrim.com/tooltrim-badge.svg"></a>
    `, pageUrl)).toBe(false);
  });
});
