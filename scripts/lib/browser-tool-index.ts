import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { DEPRECATED_TOOL_SLUGS } from "../../src/lib/toolVisibility";

const virtualPrefix = "\0browser-tool-index:";
type Row = { id?: string; slug?: string; [key: string]: unknown };

/** Build-only transport: every importer still receives the same array of objects. */
export function browserToolIndexProjection(): Plugin {
  let ssrBuild = false;
  return {
    name: "browser-tool-index-projection",
    apply: "build",
    enforce: "pre",
    configResolved(config) { ssrBuild = !!config.build.ssr; },
    async resolveId(source, importer, options) {
      if (ssrBuild || options?.ssr || !source.endsWith("tools_index.json")) return;
      const resolved = await this.resolve(source, importer, { skipSelf: true });
      if (!resolved || !resolved.id.replace(/\\/g, "/").endsWith("/src/data/tools_index.json")) return;
      // A JS suffix bypasses Vite's JSON parser; the original path remains in
      // the id so the existing manual chunk and preload policy still apply.
      return virtualPrefix + resolved.id + ".js";
    },
    load(id) {
      if (!id.startsWith(virtualPrefix)) return;
      const sourcePath = id.slice(virtualPrefix.length, -3);
      this.addWatchFile(sourcePath);
      const rows: Row[] = JSON.parse(readFileSync(sourcePath, "utf8"));
      if (!Array.isArray(rows)) throw new Error("Browser tool index must be an array");

      const schemas: string[][] = [];
      const schemaIds = new Map<string, number>();
      const packed = rows
        .filter(row => !DEPRECATED_TOOL_SLUGS.has(row.slug || row.id || ""))
        .map(row => {
          const keys = Object.keys(row);
          const signature = JSON.stringify(keys);
          let schema = schemaIds.get(signature);
          if (schema === undefined) {
            schema = schemas.length;
            schemaIds.set(signature, schema);
            schemas.push(keys);
          }
          // Keep absent keys absent, explicit nulls, nested values and key order.
          return [schema, ...keys.map(key => row[key])];
        });
      return {
        // Keep packed tables inside the call, so only reconstructed records
        // remain reachable through the module's exported binding.
        code: `export default ((keys,rows)=>rows.map(row=>Object.fromEntries(keys[row[0]].map((key,index)=>[key,row[index+1]]))))(${JSON.stringify(schemas)},${JSON.stringify(packed)});`,
        map: null,
      };
    },
  };
}
