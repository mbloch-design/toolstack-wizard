import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

it("keeps the dormant Edge deletion endpoint disabled even with valid credentials", async () => {
  let handler!: (request: Request) => Promise<Response>;
  const deleteUser = vi.fn().mockResolvedValue({ error: null });
  const createClient = vi.fn().mockReturnValue({ auth: { getUser: async () => ({ data: { user: { id: "owner" } }, error: null }), admin: { deleteUser } } });
  const source = await readFile(new URL("../../supabase/functions/delete-account/index.ts", import.meta.url), "utf8");
  // VM loader substitutes only the remote SDK import; the actual request handler executes.
  runInNewContext(source.replace(/^import[^\n]*\n/gm, ""), {
    Deno: { serve: (value: typeof handler) => { handler = value; }, env: { get: () => "fixture" } },
    createClient, Response,
  });
  const response = await handler(new Request("http://localhost/legacy-delete", { method: "DELETE", headers: { Authorization: "Bearer fixture" } }));
  expect(response.status).toBe(410);
  expect(createClient).not.toHaveBeenCalled(); expect(deleteUser).not.toHaveBeenCalled();
});
