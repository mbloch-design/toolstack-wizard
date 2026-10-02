import { describe, expect, it } from "vitest";
import { relPourLienOutil, safeExternalUrl } from "./externalLink";

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

describe("relPourLienOutil", () => {
  it.each(["https://drone-ops-mission.fr/", "https://www.drone-ops-mission.fr/"])(
    "keeps the Drone Ops Mission official link dofollow: %s",
    (url) => {
      expect(relPourLienOutil(url, "", url)).toBe("noopener noreferrer");
    },
  );

  it.each(["https://novadesko.com/", "https://www.convoscore.com/"])(
    "marks the official website link as nofollow: %s",
    (url) => {
      expect(relPourLienOutil(url, "", url)).toBe("nofollow noopener noreferrer");
    },
  );

  it("keeps Viso's direct official link dofollow when no affiliate URL is configured", () => {
    expect(relPourLienOutil("https://viso.ai/", "", "https://viso.ai/"))
      .toBe("noopener noreferrer");
  });

  it.each(["https://nicklaunches.com/", "https://www.nicklaunches.com/"])(
    "keeps the Nick Launches official link dofollow: %s",
    (url) => {
      expect(relPourLienOutil(url, "", url)).toBe("noopener noreferrer");
    },
  );
});
