import { describe, expect, it } from "vitest";
import { shortRelationReason } from "@/lib/toolExploration";

describe("shortRelationReason", () => {
  it("drops the source name the page title already gives", () => {
    expect(shortRelationReason("Alternative au catalogue à Adobe Photoshop · Retouche photo", "Adobe Photoshop")).toBe("Alternative · Retouche photo");
    expect(shortRelationReason("Usage commun avec Adobe Photoshop · Design visuel", "Adobe Photoshop")).toBe("Même usage · Design visuel");
    expect(shortRelationReason("Même usage qu'Airtable · Base de données", "Airtable")).toBe("Même usage · Base de données");
    expect(shortRelationReason("Extension d'Airtable", "Airtable")).toBe("Extension");
    expect(shortRelationReason("Same use as Airtable · Database", "Airtable")).toBe("Same use · Database");
    expect(shortRelationReason("Catalogue alternative to Notion · Notes", "Notion")).toBe("Alternative · Notes");
    expect(shortRelationReason("", "Notion")).toBe("");
  });
});
