import { describe, expect, it } from "vitest";
import config from "../../vercel.json";

function cachePolicy(path: string) {
  return config.headers.filter((rule) => new RegExp(`^${rule.source}$`).test(path))
    .flatMap((rule) => rule.headers).filter((header) => header.key === "Cache-Control").map((header) => header.value);
}

describe("catalogue cache policies", () => {
  it.each(["/assets/tool-catalog/s17.json", "/assets/stack-catalog/a.json"])("requires revalidation of the stable catalogue URL %s", (path) => {
    expect(cachePolicy(path)).toEqual(["public, max-age=0, must-revalidate"]);
  });
  it("retains immutable caching for content-hashed application assets", () => {
    expect(cachePolicy("/assets/ToolsPage-Bq917q.js")).toEqual(["public, max-age=31536000, immutable"]);
  });
});
