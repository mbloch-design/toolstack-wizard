// @vitest-environment node
import { createElement } from "react";
import type { Tool } from "@/data/types";
import { afterEach, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
for (const enabled of ["false", "true"]) it(`renders actual public Ma stack SSR with accounts=${enabled} for all four aliases`, async () => {
  vi.resetModules(); vi.stubEnv("VITE_STACK_ACCOUNT_ENABLED", enabled);
  const network = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("SSR must not call Auth or private APIs"));
  // The future shared account entry consumes the real context from inside the shell.
  // Wrap the actual shell so every direct SSR renderer exercises the ownership boundary.
  vi.doMock("@/components/v2shell/AppShellV2", async importOriginal => {
    const real = await importOriginal<typeof import("@/components/v2shell/AppShellV2")>();
    const { useStackAccount } = await import("@/hooks/useStackAccount");
    return { ...real, default: function AccountShellProbe(props: Parameters<typeof real.default>[0]) {
      const account = useStackAccount();
      expect(account.user).toBeNull(); expect(account.authBusy).toBe(false); expect(account.authInitialized).toBe(false);
      return createElement(real.default, props);
    } };
  });
  vi.doMock("@/routes/detailPages", () => import("@/routes/detailPages.server"));
  const { renderCartPage, renderHomePage, renderToolPage } = await import("./entry-server");
  for (const path of ["/fr/ma-stack", "/fr/my-stack", "/en/ma-stack", "/en/my-stack"]) {
    const html = await renderCartPage(path);
    expect(html.match(/<h1\b[^>]*>(?:(?!<\/h1>)[\s\S])+<\/h1>/g)).toHaveLength(1);
    expect(html).toContain(path.startsWith("/en/") ? "My stack" : "Ma stack");
    expect(html).not.toContain("@example.");
    expect(html).not.toContain("requires StackAccountProvider");
  }
  const home = await renderHomePage("/fr");
  expect(home.match(/<h1\b/g)).toHaveLength(1);
  const tool: Tool = { id: 'notion', slug: 'notion', name: 'Notion', categoryId: 'organisation', shortDescription: 'Notes et projets', pricing: { free: 'Gratuit', paid: 'Payant' }, defaultMonthlyPrice: 10, verdict: { keepIf: [], avoidIf: [], threshold: '' }, pros: [], cons: [], relevantFor: [], affiliateLink: '', tool_type: 'gestion', substitutable: true, verticals: [], functional_needs: [], prescription_quality: 'oui' };
  const detail = await renderToolPage("/fr/tool/notion", tool, "fr");
  expect(detail.html.match(/<h1\b/g)).toHaveLength(1); expect(detail.html).toContain('Notion');
  expect(network).not.toHaveBeenCalled();
}, 20000);
