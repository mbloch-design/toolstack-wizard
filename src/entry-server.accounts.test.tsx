// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
for (const enabled of ["false", "true"]) it(`renders actual public Ma stack SSR with accounts=${enabled} for all four aliases`, async () => {
  vi.resetModules(); vi.stubEnv("VITE_STACK_ACCOUNT_ENABLED", enabled);
  const network = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("SSR must not call Auth or private APIs"));
  const { renderCartPage } = await import("./entry-server");
  for (const path of ["/fr/ma-stack", "/fr/my-stack", "/en/ma-stack", "/en/my-stack"]) {
    const html = await renderCartPage(path);
    expect(html.match(/<h1\b[^>]*>[^<]+<\/h1>/g)).toHaveLength(1);
    expect(html).toContain(path.startsWith("/en/") ? "My stack" : "Ma stack");
    expect(html).not.toContain("@example.");
    expect(html).not.toContain("requires StackAccountProvider");
  }
  expect(network).not.toHaveBeenCalled();
});
