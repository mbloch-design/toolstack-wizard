import { beforeEach, it, expect, vi } from "vitest";
let readCatalog: typeof import("../../api/_backoffice-catalog-github").readCatalog;
let publishCatalog: typeof import("../../api/_backoffice-catalog-github").publishCatalog;
const head = "a".repeat(40),
  tree = "b".repeat(40),
  blob = "c".repeat(40),
  commit = "d".repeat(40);
const tools = [{ id: "one", slug: "one", name: "One" }];
const fetcher = vi.fn();
beforeEach(async () => {
  vi.resetModules();
  ({ readCatalog, publishCatalog } = await import("../../api/_backoffice-catalog-github"));
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

it("reuses an immutable catalogue while still checking main on every read", async () => {
  fetcher.mockResolvedValueOnce(json({ object: { sha: head } }))
    .mockResolvedValueOnce(json({ tree: { sha: tree } }))
    .mockResolvedValueOnce(new Response(JSON.stringify(tools)))
    .mockResolvedValueOnce(json({ object: { sha: head } }));
  await readCatalog();
  expect((await readCatalog()).tools).toEqual(tools);
  expect(fetcher).toHaveBeenCalledTimes(4);
});
it("loads the new catalogue immediately when main changes", async () => {
  const changed = [{ id: "one", slug: "one", name: "Updated" }];
  fetcher.mockResolvedValueOnce(json({ object: { sha: head } }))
    .mockResolvedValueOnce(json({ tree: { sha: tree } }))
    .mockResolvedValueOnce(new Response(JSON.stringify(tools)))
    .mockResolvedValueOnce(json({ object: { sha: commit } }))
    .mockResolvedValueOnce(json({ tree: { sha: blob } }))
    .mockResolvedValueOnce(new Response(JSON.stringify(changed)));
  await readCatalog();
  expect(await readCatalog()).toMatchObject({ headSha: commit, tools: changed });
});
it("does not hide a failed head check behind a cached catalogue", async () => {
  fetcher.mockResolvedValueOnce(json({ object: { sha: head } }))
    .mockResolvedValueOnce(json({ tree: { sha: tree } }))
    .mockResolvedValueOnce(new Response(JSON.stringify(tools)))
    .mockResolvedValueOnce(json({}, 401));
  await readCatalog();
  await expect(readCatalog()).rejects.toMatchObject({ status: 503 });
});
it("retries a failed download instead of caching its rejection", async () => {
  fetcher.mockResolvedValueOnce(json({ object: { sha: head } }))
    .mockResolvedValueOnce(json({ tree: { sha: tree } }))
    .mockResolvedValueOnce(new Response("invalid json"))
    .mockResolvedValueOnce(json({ object: { sha: head } }))
    .mockResolvedValueOnce(json({ tree: { sha: tree } }))
    .mockResolvedValueOnce(new Response(JSON.stringify(tools)));
  await expect(readCatalog()).rejects.toMatchObject({ status: 503 });
  expect((await readCatalog()).tools).toEqual(tools);
});

it("shares a pending download for concurrent readers of the same commit", async () => {
  fetcher.mockImplementation(async (url: string) => {
    if (url.includes("git/ref/heads/")) return json({ object: { sha: head } });
    if (url.includes("git/commits/")) return json({ tree: { sha: tree } });
    return new Response(JSON.stringify(tools));
  });
  const sources = await Promise.all([readCatalog(), readCatalog(), readCatalog()]);
  expect(sources.map((s) => s.tools[0].name)).toEqual(["One", "One", "One"]);
  expect(fetcher.mock.calls.filter(([url]) => url.includes("contents/"))).toHaveLength(1);
});
