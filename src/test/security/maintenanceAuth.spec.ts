// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// Execute the actual Deno entrypoints locally. Only the server listener and
// database/network boundary are mocked; no deployed function is called.
function loadMaintenanceHandler(name: string, expectedKey: string | undefined = "test-maintenance-key") {
  let handler!: (request: Request) => Promise<Response>;
  let clientsCreated = 0;
  let writes = 0;
  const client = {
    from() {
      const query = {
        select() { return query; },
        update() { writes += 1; return query; },
        upsert() { writes += 1; return query; },
        eq() { return query; },
        single() { return Promise.resolve({ data: null, error: null }); },
        then(resolveResult: (value: unknown) => unknown) {
          return Promise.resolve({ data: null, error: null, count: 0 }).then(resolveResult);
        },
      };
      return query;
    },
  };
  function load(path: string): Record<string, unknown> {
    const exports: Record<string, unknown> = {};
    const javascript = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    runInNewContext(javascript, {
      exports, Response, console,
      Deno: { env: { get: (key: string) => key === "SEED_ADMIN_KEY" ? expectedKey : "test-placeholder" } },
      require(id: string) {
        if (id.includes("/http/server.ts")) return { serve: (callback: typeof handler) => { handler = callback; } };
        if (id.includes("supabase-js")) return { createClient: () => { clientsCreated += 1; return client; } };
        if (id.startsWith(".")) return load(resolve(dirname(path), id));
        throw new Error(`Unexpected dependency: ${id}`);
      },
    });
    return exports;
  }
  load(resolve(process.cwd(), "supabase/functions", name, "index.ts"));
  return { handler, getActivity: () => ({ clientsCreated, writes }) };
}

describe.each(["enrich-tools", "seed-tools-enrichment"])("%s maintenance authorization", (name) => {
  it.each([
    ["GET", {}, 405],
    ["DELETE", { "x-admin-key": "test-maintenance-key" }, 405],
    ["POST", {}, 401],
    ["POST", { Authorization: "Bearer public-client-token" }, 401],
    ["POST", { "x-admin-key": "incorrect-key" }, 403],
  ] as const)("rejects %s with %j before creating a database client", async (method, headers, status) => {
    const { handler, getActivity } = loadMaintenanceHandler(name);
    const response = await handler(new Request("https://example.invalid/maintenance", { method, headers }));
    expect(response.status).toBe(status);
    expect(getActivity()).toEqual({ clientsCreated: 0, writes: 0 });
  });

  it("fails closed when the maintenance secret is not configured", async () => {
    const { handler, getActivity } = loadMaintenanceHandler(name, "");
    const response = await handler(new Request("https://example.invalid/maintenance", {
      method: "POST", headers: { "x-admin-key": "test-maintenance-key" },
    }));
    expect(response.status).toBe(503);
    expect(getActivity()).toEqual({ clientsCreated: 0, writes: 0 });
  });

  it("permits CORS preflight without any database activity", async () => {
    const { handler, getActivity } = loadMaintenanceHandler(name);
    const response = await handler(new Request("https://example.invalid/maintenance", { method: "OPTIONS" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("x-admin-key");
    expect(getActivity()).toEqual({ clientsCreated: 0, writes: 0 });
  });

  it("allows POST with the configured maintenance key to run the existing work", async () => {
    const { handler, getActivity } = loadMaintenanceHandler(name);
    const response = await handler(new Request("https://example.invalid/maintenance", {
      method: "POST", headers: { "x-admin-key": "test-maintenance-key" },
    }));
    expect(response.status).toBe(200);
    expect(getActivity().clientsCreated).toBe(1);
    expect(getActivity().writes).toBeGreaterThan(0);
    expect(await response.json()).toMatchObject({ success: true });
  });
});
