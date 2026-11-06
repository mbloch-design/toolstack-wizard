import { describe, expect, it } from "vitest";
import { displayFigure } from "./figure";

describe("display figures", () => {
  it("widens the thousands space of French amounts", () => expect(displayFigure("1 249 €")).toBe("1 249 €"));
  it("leaves English amounts as they are", () => expect(displayFigure("€1,249")).toBe("€1,249"));
});
