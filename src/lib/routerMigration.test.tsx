import { Suspense, createElement } from "react";
import { renderToString } from "react-dom/server";
import * as Router from "react-router-dom";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { AppRoutes } from "@/App";

// Isolate page content; the application's real route tree and redirects run.
vi.mock("@/pages/HomePageV2", () => ({ default: () => null }));
vi.mock("@/routes/detailPages", () => ({ ArticleFacturation: () => null, ComparePage: () => null, GuideDetailPage: () => null, ToolDetailPage: () => null }));
vi.mock("@/components/v2shell/AppShellV2", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/pages/CartPage", () => ({ default: () => <p>Stack destination</p> }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
afterEach(cleanup);
function CurrentPath() { return <output data-testid="current-path">{useLocation().pathname}</output>; }

describe("retired routes under the current router", () => {
  for (const lang of ["fr", "en"]) for (const family of ["diagnostic", "selector"]) for (const suffix of ["", "/step", "/step/details"]) {
    it(`${lang}/${family}${suffix} stays on the language's Ma Stack route`, async () => {
      render(<MemoryRouter initialEntries={[`/${lang}/${family}${suffix}`]}>
        <CurrentPath /><Suspense fallback={null}><AppRoutes /></Suspense>
      </MemoryRouter>);
      await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent(`/${lang}/ma-stack`));
      expect(await screen.findByText("Stack destination")).toBeVisible();
    });
  }
});

it("renders localized SSR links through the supported root StaticRouter export", () => {
  expect(Router.StaticRouter).toBeTypeOf("function");
  const html = renderToString(createElement(Router.StaticRouter, { location: "/en/tool/notion" },
    createElement(Router.Link, { to: "/en/tool/notion/pricing" }, "Pricing")));
  expect(html).toContain('href="/en/tool/notion/pricing"');
  expect(html).toContain("Pricing");
});
