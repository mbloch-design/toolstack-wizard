import type { Plugin } from "vite";
import { DEPRECATED_TOOL_SLUGS } from "../../src/lib/toolVisibility";

export function browserToolIndexProjection(): Plugin {
  let ssrBuild = false;
  return {
    name: "browser-tool-index-projection",
    apply: "build",
    enforce: "pre",
    configResolved(config) { ssrBuild = !!config.build.ssr; },
    transform(code, id, options) {
      if (ssrBuild || options?.ssr || !id.replace(/\\/g, "/").endsWith("/src/data/tools_index.json")) return;
      const rows: { id?: string; slug?: string }[] = JSON.parse(code);
      if (!Array.isArray(rows)) throw new Error("Browser tool index must be an array");
      // Leave JSON for Vite's own JSON plugin. No fields or source files are
      // changed; the SSR bundle and other index consumers keep the full input.
      return { code: JSON.stringify(rows.filter(row => !DEPRECATED_TOOL_SLUGS.has(row.slug || row.id || ""))), map: null };
    },
  };
}
