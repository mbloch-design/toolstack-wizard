// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import ToolGallery from "./ToolGallery";

afterEach(() => vi.restoreAllMocks());
it("renders native fetch priority without a React 18 unknown-prop warning", () => {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const html = renderToString(<ToolGallery images={["/preview.png"]} toolName="Tool" />);
  expect(html).toContain('fetchpriority="high"');
  expect(errors).not.toHaveBeenCalled();
});
