import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
// Avoid the old chrome's catalogue subscriptions while checking the real
// route boundary and the real current shell selected by that boundary.
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {} } }));
import { LangLayout } from "./App";

beforeEach(() => {
  vi.stubGlobal("localStorage", window.sessionStorage);
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} unobserve() {} });
});
afterEach(() => vi.unstubAllGlobals());
it.each(["fr", "en"])("uses the active product shell for the %s back-office route", lang => {
  const { container } = render(<MemoryRouter initialEntries={[`/${lang}/back-office`]}><Routes>
    <Route path="/:lang" element={<LangLayout />}><Route path="back-office" element={<h1>Accounts route</h1>} /></Route>
  </Routes></MemoryRouter>);
  expect(container.querySelector(".asv2-root .asv2-sidebar")).not.toBeNull();
  expect(container.querySelector(".asv2-workspace .asv2-content .asv2-main")).toContainElement(screen.getByRole("heading", { name: "Accounts route" }));
  expect(screen.getByRole("navigation", { name: lang === "fr" ? "Navigation principale" : "Main navigation" })).toBeInTheDocument();
  expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  expect(screen.getByRole("contentinfo").closest(".asv2-content")).not.toBeNull();
});
