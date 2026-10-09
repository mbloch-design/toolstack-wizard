import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MemoryRouter, StaticRouter, useLocation } from "react-router-dom";
import { Link, NavLink } from "./routerLinks";
afterEach(cleanup);

it("keeps SSR links and active navigation without framework discovery markup", () => {
  const html = renderToString(<StaticRouter location="/fr/tools"><Link to="/en/tools">English</Link><NavLink to="/fr/tools">Tools</NavLink></StaticRouter>);
  expect(html).toContain('href="/en/tools"');
  expect(html).toContain('aria-current="page"');
  expect(html).not.toContain("data-discover");
});
it("forwards refs, props, router state and navigation", () => {
  const ref = createRef<HTMLAnchorElement>();
  function Destination() { const location = useLocation(); return <output>{location.pathname}:{(location.state as { from?: string })?.from}</output>; }
  render(<MemoryRouter><Link ref={ref} to="/fr/tools" state={{ from: "test" }} className="kept" aria-label="Browse">Tools</Link><Destination /></MemoryRouter>);
  expect(ref.current).toBe(screen.getByRole("link", { name: "Browse" }));
  expect(ref.current).toHaveClass("kept");fireEvent.click(ref.current!);
  expect(screen.getByText("/fr/tools:test")).toBeVisible();
});
