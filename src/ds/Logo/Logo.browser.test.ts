import { describe, expect, it } from "vitest";
import { initials } from "./Logo";

describe("logo initials", () => {
  it("takes the first two words", () => expect(initials("Microsoft Dynamics 365 Finance and Operations")).toBe("MD"));
  it("takes the capitals of one word", () => expect(initials("CallTrackingMetrics")).toBe("CT"));
  it("takes the first two letters of a plain word", () => expect(initials("Vercel")).toBe("Ve"));
  it("never returns nothing", () => expect(initials("")).toBe("?"));
});
