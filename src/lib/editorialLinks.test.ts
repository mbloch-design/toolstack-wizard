import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const POST_FILES = [
  "src/data/posts-fr.json",
  "src/data/posts-en.json",
  "public/data/posts-fr.json",
  "public/data/posts-en.json",
];

describe("editorial internal links", () => {
  it("does not expose ToolTrim's legacy /article/ routes", () => {
    const legacyLinks = POST_FILES.flatMap((file) => {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
      return [...content.matchAll(/https:\/\/tooltrim\.com\/(?:fr|en)\/article\/[^)\s"\\]+/g)].map(
        (match) => `${file}: ${match[0]}`,
      );
    });

    expect(legacyLinks).toEqual([]);
  });
});
