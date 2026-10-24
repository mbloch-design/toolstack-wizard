import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ToolLogo from "./ToolLogo";

describe("ToolLogo deferred loading", () => {
  let top: number;

  beforeEach(() => {
    vi.useFakeTimers();
    top = 8000;
    // A silent observer reproduces the environment that needs the safety net.
    vi.stubGlobal("IntersectionObserver", class {
      observe() {}
      disconnect() {}
    });
    vi.spyOn(HTMLImageElement.prototype, "getBoundingClientRect").mockImplementation(() => ({
      top, bottom: top + 32, left: 0, right: 32, width: 32, height: 32,
      x: 0, y: top, toJSON() {},
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("keeps an offscreen logo lazy after the observer grace period", () => {
    render(<ToolLogo tool={{ name: "Notion", slug: "notion" }} />);
    const logo = screen.getByRole("img");
    const originalSource = logo.getAttribute("src");
    act(() => vi.advanceTimersByTime(6000));
    expect(logo).toHaveAttribute("loading", "lazy");
    expect(logo).toHaveAttribute("src", originalSource);
  });

  it("recovers a visible logo when the observer never reports", () => {
    top = 100;
    render(<ToolLogo tool={{ name: "Notion", slug: "notion" }} />);
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("img")).toHaveAttribute("loading", "eager");
  });

  it("recovers on scroll when an offscreen logo becomes visible", () => {
    render(<ToolLogo tool={{ name: "Notion", slug: "notion" }} />);
    act(() => vi.advanceTimersByTime(4000));
    top = 100;
    fireEvent.scroll(window);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "eager");
  });
});
