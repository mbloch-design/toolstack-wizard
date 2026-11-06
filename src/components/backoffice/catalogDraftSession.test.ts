import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CatalogDraftSession } from "./catalogDraftSession";
import { catalogCapabilities } from "@/lib/catalogPolicy";
const tool = {
  id: "notion",
  slug: "notion",
  name: "Notion",
  category: "productivity",
  shortDescription: "Before",
  research: { keep: true },
};
const detail = {
  tool,
  published: tool,
  version: 0,
  baseHash: "base",
  draft: null,
  conflict: false,
  capabilities: catalogCapabilities({ isAdmin: true }),
};
const save = vi.fn();
let session: CatalogDraftSession;
beforeEach(() => {
  vi.useFakeTimers();
  save.mockReset();
  session = new CatalogDraftSession(save);
  session.adopt(detail);
  save.mockImplementation(async (input) => ({
    ...detail,
    tool: input.value,
    version: input.version + 1,
  }));
});
afterEach(() => vi.useRealTimers());
it("coalesces multiple fields after 1000ms idle as one snapshot preserving unknown data", async () => {
  session.change("notion", [
    { path: ["name"], value: "New name" },
    { path: ["shortDescription"], value: "New copy" },
  ]);
  await vi.advanceTimersByTimeAsync(999);
  expect(save).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(save).toHaveBeenCalledOnce();
  expect(save.mock.calls[0][0].value).toEqual({
    ...tool,
    name: "New name",
    shortDescription: "New copy",
  });
  expect(session.dirty).toBe(false);
});
it("acks only sent data and queues the latest snapshot with the returned version", async () => {
  let resolve!: (v: typeof detail) => void;
  save.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  session.change("notion", [{ path: ["name"], value: "First" }]);
  await vi.advanceTimersByTimeAsync(1000);
  session.change("notion", [{ path: ["name"], value: "Latest" }]);
  await vi.advanceTimersByTimeAsync(1000);
  expect(save).toHaveBeenCalledOnce();
  resolve({ ...detail, tool: { ...tool, name: "First" }, version: 1 });
  await vi.advanceTimersByTimeAsync(0);
  expect(session.get("notion")?.value.name).toBe("Latest");
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1][0]).toMatchObject({
    version: 1,
    value: { name: "Latest" },
  });
});
it.each([401, 403, 409, 503])(
  "retains text after %s and retries explicitly without force",
  async (status) => {
    save.mockRejectedValueOnce({ status });
    session.change("notion", [{ path: ["name"], value: "Kept" }]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(session.get("notion")?.value.name).toBe("Kept");
    expect(session.get("notion")?.error).toMatchObject({ status });
    await vi.advanceTimersByTimeAsync(10000);
    expect(save).toHaveBeenCalledOnce();
    if (status !== 409) {
      await session.flush();
      expect(session.dirty).toBe(false);
    } else await expect(session.flush()).rejects.toMatchObject({ status: 409 });
  },
);
it("keeps unsafe input locally, saves incomplete safe drafts and defaults to no grants", async () => {
  session.change("notion", [
    { path: ["websiteUrl"], value: "javascript:alert(1)" },
  ]);
  await vi.advanceTimersByTimeAsync(1000);
  expect(save).not.toHaveBeenCalled();
  expect(session.get("notion")?.value.websiteUrl).toBe("javascript:alert(1)");
  session.change("notion", [{ path: ["websiteUrl"], value: "" }]);
  await session.flush();
  expect(save).toHaveBeenCalledOnce();
  session.adopt({
    ...detail,
    tool: { ...tool, slug: "other" },
    published: { ...tool, slug: "other" },
    capabilities: undefined,
  });
  session.change("other", [{ path: ["name"], value: "Denied" }]);
  expect(session.get("other")?.value.name).toBe("Notion");
});
it("flushes every modified record and preserves memory across suspend, clears on account change", async () => {
  session.setOwner("one");
  session.adopt({
    ...detail,
    tool: { ...tool, slug: "figma" },
    published: { ...tool, slug: "figma" },
  });
  session.change("notion", [{ path: ["name"], value: "N" }]);
  session.change("figma", [{ path: ["name"], value: "F" }]);
  session.suspend();
  await vi.advanceTimersByTimeAsync(1000);
  expect(save).not.toHaveBeenCalled();
  session.setOwner("one");
  await session.flush();
  expect(save).toHaveBeenCalledTimes(2);
  session.change("notion", [{ path: ["name"], value: "private" }]);
  session.setOwner("two");
  expect(session.get("notion")).toBeUndefined();
  await vi.advanceTimersByTimeAsync(1000);
  expect(save).toHaveBeenCalledTimes(2);
});
