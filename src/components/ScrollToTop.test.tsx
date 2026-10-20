import { act, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
vi.mock("@/lib/scroll", () => ({ getScrollTop: () => 0, onScroll: () => () => {}, scrollToTop: vi.fn(), scrollToY: vi.fn() }));
afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ""; });
it.each(["#access_token=fake&refresh_token=fake", "#%E0%A4%A"])("handles non-anchor fragment %s without throwing", hash => {
  vi.useFakeTimers();
  render(<MemoryRouter initialEntries={[`/en/ma-stack${hash}`]}><ScrollToTop /></MemoryRouter>);
  expect(() => act(() => vi.runOnlyPendingTimers())).not.toThrow();
});
it.each([["#section", "section"], ["#plan%3Aannual%2Eprice", "plan:annual.price"]])("scrolls safely to %s", (hash, id) => {
  vi.useFakeTimers(); const anchor = document.createElement("div"); anchor.id = id;
  const scroll = vi.fn(); anchor.scrollIntoView = scroll; document.body.append(anchor);
  render(<MemoryRouter initialEntries={[`/en/ma-stack${hash}`]}><ScrollToTop /></MemoryRouter>);
  act(() => vi.runOnlyPendingTimers()); expect(scroll).toHaveBeenCalledWith({ block: "start" });
});
it("cancels queued anchor work on unmount", () => {
  vi.useFakeTimers(); const anchor = document.createElement("div"); anchor.id = "section";
  const scroll = vi.fn(); anchor.scrollIntoView = scroll; document.body.append(anchor);
  const view = render(<MemoryRouter initialEntries={["/en/ma-stack#section"]}><ScrollToTop /></MemoryRouter>);
  view.unmount(); act(() => vi.runOnlyPendingTimers()); expect(scroll).not.toHaveBeenCalled();
});
