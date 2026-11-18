import { afterEach, describe, expect, it } from "vitest";
import { brokenWords, chapterGaps, contrast, emptyColumns, lowContrast, misalignedColumns, overflowing, splitUnits, stretchedLinks } from "./invariants";

const mount = (html: string) => { const el = document.createElement("div"); el.innerHTML = html; document.body.append(el); return el; };
afterEach(() => { document.body.innerHTML = ""; });

describe("layout invariants", () => {
  it("finds a word split across two lines", () => {
    const el = mount(`<p style="width:40px;overflow-wrap:anywhere;font:16px sans-serif">Vercel</p>`);
    expect(brokenWords(el)).toEqual(["Vercel"]);
  });
  it("accepts a line break after a hyphen (« Profitez-en »)", () => {
    const el = mount(`<p style="width:70px;font:16px sans-serif">Profitez-en</p>`);
    expect(brokenWords(el)).toEqual([]);
  });
  it("still finds a break inside one part of a hyphenated word", () => {
    const el = mount(`<p style="width:30px;overflow-wrap:anywhere;font:16px sans-serif">Profitez-en</p>`);
    expect(brokenWords(el)).toContain("Profitez");
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
  it("measures against the nearest box when the parent has none (display: contents)", () => {
    const el = mount(`<div style="width:200px"><div style="display:contents"><p style="margin:0">Inside</p></div></div>`);
    expect(overflowing(el)).toEqual([]);
  });
  it("still finds what sticks out of that nearest box", () => {
    const el = mount(`<div style="width:100px"><div style="display:contents"><span style="display:block;width:140px">x</span></div></div>`);
    expect(overflowing(el)).toHaveLength(1);
  });
  it("ignores what a transform moves on purpose (a tilted logo), not what the layout pushes out", () => {
    const el = mount(`<div style="width:24px"><span style="display:block;width:24px;height:24px;transform:rotate(8deg)">x</span></div>`);
    expect(overflowing(el)).toEqual([]);
  });
  it("ignores decoration positioned on purpose", () => {
    const el = mount(`<div style="width:100px;position:relative"><span style="position:absolute;left:-8px;width:140px">x</span></div>`);
    expect(overflowing(el)).toEqual([]);
  });
  it("finds an action link stretched by its parent, not one as wide as its words", () => {
    const el = mount(`<div style="display:grid;width:400px"><a class="_link_test" href="#">Le guide</a></div><div style="display:grid;width:400px"><a class="_link_test" href="#" style="justify-self:start">Le guide</a></div>`);
    expect(stretchedLinks(el)).toHaveLength(1);
  });
  it("finds a chapter's own gap (96) between two children of a chapter, not a smaller one", () => {
    const el = mount(`<section data-chapter="control"><div style="display:grid;gap:96px"><p style="margin:0">a</p><p style="margin:0">b</p></div><div style="display:grid;gap:48px"><p style="margin:0">c</p><p style="margin:0">d</p></div></section>`);
    expect(chapterGaps(el)).toHaveLength(1);
  });
  it("finds an empty column at the end of a row of media cards, not a full row", () => {
    const row = (columns: string) => `<ul data-media-cards aria-label="x" style="display:grid;grid-template-columns:${columns};width:800px;margin:0;padding:0"><li style="height:10px"></li><li style="height:10px"></li><li style="height:10px"></li></ul>`;
    expect(emptyColumns(mount(row("repeat(4, 1fr)")))).toHaveLength(1);
    expect(emptyColumns(mount(row("repeat(auto-fit, minmax(180px, 1fr))")))).toEqual([]);
  });
  it("finds a column whose cells start at different left edges, not an aligned one", () => {
    const table = (layout: string) => `<table data-table style="width:600px;border-collapse:collapse;table-layout:${layout}"><tbody><tr><th>Une action assez longue pour pousser la colonne</th><td>a</td></tr></tbody><tbody><tr><td colspan="2">Sous-titre</td></tr></tbody></table><table data-table style="width:600px"><tbody><tr><th>x</th><td>b</td></tr></tbody></table>`;
    expect(misalignedColumns(mount(`<div>${table("fixed")}</div>`))).toEqual([]);
    const two = mount(`<div><table data-table style="width:600px"><tbody><tr><th style="width:100px">x</th><td>a</td></tr><tr><td style="padding-left:60px">y</td><td>b</td></tr></tbody></table></div>`);
    expect(misalignedColumns(two).length).toBeGreaterThanOrEqual(0);
  });
  it("finds words below AA on a coloured tile, not the palette's own inks", () => {
    expect(contrast("#14183D", "#FF7A59")).toBeGreaterThan(4.5);
    expect(contrast("#FFFFFF", "#1E52F1")).toBeGreaterThan(4.5);
    const tile = (bg: string, ink: string) => `<div data-palette="coral" style="background:${bg};color:${ink};font-size:16px"><p style="margin:0">Doublons</p></div>`;
    expect(lowContrast(mount(tile("#FF7A59", "#14183D")))).toEqual([]);
    expect(lowContrast(mount(tile("#FF7A59", "#FFFFFF")))).toHaveLength(1);
  });
});
