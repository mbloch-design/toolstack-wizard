// @vitest-environment jsdom
import { act, fireEvent } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { PinToolButton } from "@/components/PinToolButton";

const { pinTool, navigate } = vi.hoisted(() => ({ pinTool: vi.fn(), navigate: vi.fn() }));
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("@/hooks/useStackPins", () => ({
  useStackPins: () => ({ state: { pinnedToolSlugs: [] }, pinTool }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), custom: vi.fn(), dismiss: vi.fn() } }));

it("keeps prerendered add disabled until hydration, then handles the first click without replacing the button", async () => {
  const element = <PinToolButton slug="figma" label="Figma" t={(fr) => fr} />;
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  document.body.append(container);
  const button = container.querySelector("button")!;
  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    expect(button.disabled).toBe(true);
    button.click();
    expect(pinTool).not.toHaveBeenCalled();
    await act(async () => {
      root = hydrateRoot(container, element, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(container.querySelector("button")).toBe(button);
    expect(button.disabled).toBe(false);
    expect(errors).toEqual([]);
    fireEvent.click(button);
    expect(pinTool).toHaveBeenCalledExactlyOnceWith("figma");
    expect(navigate).not.toHaveBeenCalled();
  } finally {
    await act(async () => root?.unmount());
    container.remove();
  }
});
