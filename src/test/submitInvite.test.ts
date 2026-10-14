import { describe, expect, it } from "vitest";
import { parseSubmitInvite } from "@/lib/submitInvite";

const parse = (query: string) => parseSubmitInvite(new URLSearchParams(query));

describe("parseSubmitInvite", () => {
  it("reads the tool name and normalises the site", () => {
    expect(parse("tool=GenCode&site=genspark.ai")).toEqual({ toolName: "GenCode", toolUrl: "https://genspark.ai" });
  });

  it("keeps the tool name without a site", () => {
    expect(parse("tool=%20GenCode%20")).toEqual({ toolName: "GenCode", toolUrl: "" });
  });

  it("ignores a missing, empty or unfilled merge-tag name", () => {
    expect(parse("")).toBeNull();
    expect(parse("tool=%20%20")).toBeNull();
    expect(parse("tool={{tool}}")).toBeNull();
    expect(parse("tool=%5Btool_name%5D")).toBeNull();
  });

  it("caps the length and strips control characters", () => {
    const invite = parse(`tool=${"A".repeat(200)}%0A`);
    expect(invite?.toolName).toHaveLength(60);
  });

  it("drops an invalid site but keeps the name", () => {
    expect(parse("tool=GenCode&site=javascript:alert(1)")).toEqual({ toolName: "GenCode", toolUrl: "" });
  });
});
