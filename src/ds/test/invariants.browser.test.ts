import { afterEach, describe, expect, it } from "vitest";
import { brokenWords, overflowing, splitUnits } from "./invariants";

const mount = (html: string) => { const el = document.createElement("div"); el.innerHTML = html; document.body.append(el); return el; };
afterEach(() => { document.body.innerHTML = ""; });

describe("layout invariants", () => {
  it("finds a word split across two lines", () => {
    const el = mount(`<p style="width:40px;overflow-wrap:anywhere;font:16px sans-serif">Vercel</p>`);
    expect(brokenWords(el)).toEqual(["Vercel"]);
  });
  it("accepts a name that wraps between words", () => {
    const el = mount(`<p style="width:90px;font:16px sans-serif">Adobe Illustrator</p>`);
    expect(brokenWords(el)).toEqual([]);
  });
  it("finds an amount separated from its unit", () => {
    const el = mount(`<p style="width:30px;font:16px sans-serif"><span data-nowrap>100 %</span></p>`);
    expect(splitUnits(el)).toEqual(["100 %"]);
  });
  it("keeps a smaller unit on the line of its figure", () => {
    const el = mount(`<p style="font:64px/1 sans-serif;white-space:nowrap"><span data-nowrap>58 €<small style="font-size:16px">/mois</small></span></p>`);
    expect(splitUnits(el)).toEqual([]);
    expect(brokenWords(el)).toEqual([]);
  });
  it("finds a child sticking out of its box", () => {
    const el = mount(`<div style="width:100px"><span style="display:block;width:140px">x</span></div>`);
    expect(overflowing(el)).toHaveLength(1);
  });
  it("ignores decoration positioned on purpose", () => {
    const el = mount(`<div style="width:100px;position:relative"><span style="position:absolute;left:-8px;width:140px">x</span></div>`);
    expect(overflowing(el)).toEqual([]);
  });
});
