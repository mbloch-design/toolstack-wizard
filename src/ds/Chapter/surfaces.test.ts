import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * The white sheet (Michael, 17/11/2026): the grey of the navigation (--tt-tile, --tt-chrome) is never a content
 * background in the agents section. A chapter, a section or an object sits on white; only small interface pieces the
 * system tints itself (a tag, a segmented control, a hovered menu entry) may carry it.
 */
const FILES = ["Chapter/Chapter.module.css", "AgentSheet/AgentSheet.module.css", "AgentHub/AgentHub.module.css", "AgentAccess/AgentAccess.module.css"];
const NAV_GREY = /var\(--tt-(tile|chrome)\)/;

const rules = (css: string) => [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim(), body }));

describe("the agents section stays on the white sheet", () => {
  for (const file of FILES) {
    it(`${file}: no navigation grey as a background`, () => {
      const css = readFileSync(join(__dirname, "..", file), "utf8");
      const offenders = rules(css).filter(({ selector, body }) => {
        if (/:hover/.test(selector)) return false;
        const background = body.match(/(?:^|;|\n)\s*background(?:-color)?\s*:\s*([^;]+)/)?.[1] ?? "";
        const shadowFill = /box-shadow\s*:\s*0 0 0 [^;]*var\(--tt-(tile|chrome)\)/.test(body);
        // composes: tile paints the grey unless the same rule sets another background.
        const composedTile = /composes:\s*tile\b/.test(body) && !background;
        return NAV_GREY.test(background) || shadowFill || composedTile;
      }).map(({ selector }) => selector);
      expect(offenders).toEqual([]);
    });
  }
});
