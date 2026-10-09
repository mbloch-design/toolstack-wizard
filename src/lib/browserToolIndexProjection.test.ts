// @vitest-environment node
import { afterEach, expect, it } from "vitest";
import { build } from "vite";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { browserToolIndexProjection } from "../../scripts/lib/browser-tool-index";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

async function emittedRows(ssr = false) {
  const root = await mkdtemp(path.join(tmpdir(), "tooltrim-index-fixture-"));
  roots.push(root);
  await mkdir(path.join(root, "src/data"), { recursive: true });
  const rows = [
    { id: "notion", slug: "notion", name: "Notion", pricing: { free: "Trial, not a free tier", paid: "Custom pricing" }, pricingEn: { paid: "Price unknown" }, nativePrices: [{ amount: 35.9, currency: "USD", period: "annual" }], alternatives: ["figma"] },
    { id: "anthropic", slug: "anthropic", name: "Historical alias" },
    { id: "other", slug: "new-product", name: "Kept", unknownFutureField: { source: "attested" } },
    { id: "adobe-cc", name: "ID-only alias" },
  ];
  const source = JSON.stringify(rows);
  const file = path.join(root, "src/data/tools_index.json");
  await writeFile(file, source);
  await writeFile(path.join(root, "entry.js"), 'import rows from "./src/data/tools_index.json"; export default rows;');
  const output = await build({ configFile: false, root, logLevel: "silent", plugins: [browserToolIndexProjection()],
    build: { write: false, minify: false, ssr: ssr ? path.join(root, "entry.js") : undefined,
      rollupOptions: { input: path.join(root, "entry.js"), preserveEntrySignatures: "strict", output: { format: "es" } } } });
  if (Array.isArray(output) || !("output" in output)) throw new Error("Unexpected build output");
  const chunk = output.output.find(item => item.type === "chunk" && item.isEntry);
  if (!chunk || chunk.type !== "chunk") throw new Error("No fixture entry");
  const emitted = await import(`data:text/javascript;base64,${Buffer.from(chunk.code).toString("base64")}`);
  return { rows, emitted: emitted.default, sourceUntouched: await readFile(file, "utf8") === source };
}

it("omits historical aliases from browser bytes while retaining every visible field and source row", async () => {
  const { rows, emitted, sourceUntouched } = await emittedRows();
  expect(emitted).toEqual([rows[0], rows[2]]);
  expect(sourceUntouched).toBe(true);
});

it("keeps the full source index in the SSR bundle", async () => {
  const { rows, emitted, sourceUntouched } = await emittedRows(true);
  expect(emitted).toEqual(rows);
  expect(sourceUntouched).toBe(true);
});
