import { beforeEach, it, expect, vi } from "vitest";
import {
  readCatalog,
  publishCatalog,
} from "../../api/_backoffice-catalog-github";
const head = "a".repeat(40),
  tree = "b".repeat(40),
  blob = "c".repeat(40),
  commit = "d".repeat(40);
const tools = [{ id: "one", slug: "one", name: "One" }];
const fetcher = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetcher);
  vi.stubEnv("BACKOFFICE_GITHUB_TOKEN", "server-only");
  fetcher.mockReset();
});
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });
it("reads the large catalogue as raw content pinned to a verified SHA", async () => {
  fetcher
    .mockResolvedValueOnce(json({ object: { sha: head } }))
    .mockResolvedValueOnce(json({ tree: { sha: tree } }))
    .mockResolvedValueOnce(new Response(JSON.stringify(tools)));
  const source = await readCatalog();
  expect(source.tools).toEqual(tools);
  expect(fetcher.mock.calls[2][0]).toContain("ref=" + head);
  expect(fetcher.mock.calls[2][1].headers.Accept).toContain("raw");
});
it("publishes one blob/tree/commit with a non-forced ref update", async () => {
  fetcher
    .mockResolvedValueOnce(json({ sha: blob }))
    .mockResolvedValueOnce(json({ sha: tree }))
    .mockResolvedValueOnce(json({ sha: commit }))
    .mockResolvedValueOnce(json({ object: { sha: commit } }))
    .mockResolvedValueOnce(json({ object: { sha: commit } }));
  expect(
    await publishCatalog(
      { headSha: head, treeSha: tree, tools, text: JSON.stringify(tools) },
      [{ ...tools[0], name: "Edited" }],
    ),
  ).toMatchObject({ commitSha: commit });
  const patch = fetcher.mock.calls.find(([, init]) => init.method === "PATCH");
  expect(JSON.parse(patch![1].body)).toEqual({ sha: commit, force: false });
});
it("reconciles a timed out reference update by verifying the resulting SHA", async () => {
  fetcher
    .mockResolvedValueOnce(json({ sha: blob }))
    .mockResolvedValueOnce(json({ sha: tree }))
    .mockResolvedValueOnce(json({ sha: commit }))
    .mockRejectedValueOnce(new Error("timeout"))
    .mockResolvedValueOnce(json({ object: { sha: commit } }));
  expect(
    await publishCatalog(
      { headSha: head, treeSha: tree, tools, text: "[]" },
      tools,
    ),
  ).toMatchObject({ commitSha: commit });
});
it("fails closed on a competing ref and never retries with force", async () => {
  fetcher
    .mockResolvedValueOnce(json({ sha: blob }))
    .mockResolvedValueOnce(json({ sha: tree }))
    .mockResolvedValueOnce(json({ sha: commit }))
    .mockResolvedValueOnce(json({}, 422))
    .mockResolvedValueOnce(json({ object: { sha: head } }));
  await expect(
    publishCatalog({ headSha: head, treeSha: tree, tools, text: "[]" }, tools),
  ).rejects.toMatchObject({ status: 409 });
});
