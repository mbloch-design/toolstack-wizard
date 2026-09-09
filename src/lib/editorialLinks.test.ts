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

  it("does not expose the retired selector", () => {
    const offenders = POST_FILES.filter((file) =>
      fs.readFileSync(path.resolve(process.cwd(), file), "utf8").includes("/selector"),
    );

    expect(offenders).toEqual([]);
  });

  it("does not expose the legacy query-based tool Explorer route", () => {
    const legacyLinks = POST_FILES.flatMap((file) => {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
      return [...content.matchAll(/\/(?:fr|en)\/explorer\?type=outil(?:&amp;|&)source=/g)].map(
        () => file,
      );
    });

    expect(legacyLinks).toEqual([]);
  });

  it("links directly to each localized Claude comparison guide", () => {
    const redirectedGuideLinks = POST_FILES.flatMap((file) => {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
      return [
        "/fr/guide/claude-vs-chatgpt-deepseek",
        "/en/guide/claude-vs-chatgpt-2026-lequel-choisir-business",
      ].filter((url) => content.includes(url)).map((url) => `${file}: ${url}`);
    });

    expect(redirectedGuideLinks).toEqual([]);
  });

  it("does not expose unlocalized or renamed catalogue links", () => {
    const forbidden = [
      /(?:^|[^a-z])\/tool\/(?:obsidian|todoist|google-drive|notion|clickup|linear|airtable)(?=[)"?\s])/,
      /\/(?:fr|en)\/category\/(?:creation|ai-general|automation)(?=[)"?\s])/,
      /\/(?:fr|en)\/tool\/(?:anthropic|descript)(?=[)"?\s])/,
      /\/(?:fr|en)\/tool\/claap(?=[)"?\s])/,
      /\/(?:fr|en)\/tool\/convertkit(?=[)"?\s])/,
      /\/(?:fr|en)\/stacks\/(?:nocode-app-builder|ai-visual-aggregator|product-analytics-aggregator)(?=[)"?\s])/,
    ];
    const offenders = POST_FILES.flatMap((file) => {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
      return forbidden.filter((pattern) => pattern.test(content)).map((pattern) => `${file}: ${pattern}`);
    });

    expect(offenders).toEqual([]);
  });

  it("does not expose guide links without a locale", () => {
    const offenders = POST_FILES.filter((file) =>
      /\]\(\/(?:guide|methodologie)(?:\/|\))/.test(
        fs.readFileSync(path.resolve(process.cwd(), file), "utf8"),
      ),
    );

    expect(offenders).toEqual([]);
  });
});
