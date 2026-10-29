import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const root = resolve(process.cwd());
const pages = ["src/pages/BackOfficePage.tsx", ...readdirSync(resolve(root, "src/components/backoffice")).filter(name => name.endsWith(".tsx") && !name.includes(".test.")).map(name => `src/components/backoffice/${name}`)];
describe("backoffice shared UI ownership", () => {
  it.each(pages)("%s has no former UI ownership", path => {
    const source = readFileSync(resolve(root, path), "utf8");
    expect(source).not.toMatch(/components\/stack\/StackKit|\b(?:mk-|ac-|ms-page|ba-button|ms-account-)/);
    expect(source).not.toMatch(/<(?:input|select|textarea)\b/);
    // Only dashboard metric tiles and catalogue selection rows remain business controls.
    const rawButtons = [...source.matchAll(/<button\b[\s\S]*?>/g)].map(match => match[0]);
    for (const button of rawButtons) expect(button).toMatch(/bo-(?:metric|catalog-list-row)/);
    expect(source).not.toMatch(/<a\b/);
  });
  it.each(["backoffice.css", "backoffice-history.css"])("%s uses foundation tokens directly", path => {
    const css = readFileSync(resolve(root, "src/styles/components", path), "utf8");
    expect(css).not.toContain("!important");
    expect(css).not.toMatch(/--(?:ms-|ap-)|\.(?:mk-|ac-|ba-)|\.bo-button\s*\{|\.bo-[^{]*(?:input|select|textarea)\b[^{]*\{[^}]*\b(?:background|color|font|border|padding):/);
  });
});
