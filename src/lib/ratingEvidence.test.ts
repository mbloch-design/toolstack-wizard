import { describe, expect, it } from "vitest";
import { splitRatingEvidence, collectRatingSources } from "./ratingEvidence";

describe("splitRatingEvidence", () => {
  it("groups shared sources and dates without dropping the additional source", () => {
    expect(collectRatingSources([
      "Carte. Source : drone-ops-mission.fr, 30 septembre 2026.",
      "Météo. Sources : drone-ops-mission.fr et /meteo-drone, 30 septembre 2026.",
    ])).toEqual([{ citations: ["drone-ops-mission.fr", "/meteo-drone"], date: "30 septembre 2026" }]);
  });
  it("moves a dated official source out of the visible finding", () => {
    expect(splitRatingEvidence("Carte et météo réunies. Source : drone-ops-mission.fr, 30 septembre 2026.")).toEqual({
      finding: "Carte et météo réunies.",
      source: "Source : drone-ops-mission.fr, 30 septembre 2026.",
    });
  });

  it("keeps findings without a trailing source intact", () => {
    expect(splitRatingEvidence("Qualité du briefing non testée.")).toEqual({
      finding: "Qualité du briefing non testée.",
      source: null,
    });
  });
});
