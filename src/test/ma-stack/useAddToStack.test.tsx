// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useAddToStack } from "@/hooks/useAddToStack";

const mocks = vi.hoisted(() => ({
  scope: "owner-a", epoch: 0,
  access: vi.fn(), pin: vi.fn(), unpin: vi.fn(), fly: vi.fn(), toast: vi.fn(), navigate: vi.fn(),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/hooks/useLang", () => ({ useLang: () => ({ prefix: "/fr", t: (fr: string) => fr }) }));
vi.mock("@/hooks/useStackPins", () => ({ useStackPins: () => ({
  requestAddAccess: mocks.access, pinTool: mocks.pin, unpinTool: mocks.unpin,
}) }));
vi.mock("@/lib/personalStackStore", () => ({
  getPersonalStackScope: () => mocks.scope, getPersonalStackScopeEpoch: () => mocks.epoch,
}));
vi.mock("@/lib/stackAddStory", () => ({
  findStackLogo: () => "logo.png", flyToStack: mocks.fly, showStackAddedToast: mocks.toast,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.scope = "owner-a";
  mocks.epoch = 0;
  mocks.access.mockReturnValue(true);
  mocks.pin.mockReturnValue(true);
});

it("refuses an unauthenticated add before animation or any success", () => {
  mocks.access.mockReturnValue(false);
  const { result } = renderHook(useAddToStack);
  expect(result.current.addToStack("figma", "Figma")).toBe(false);
  expect(mocks.fly).not.toHaveBeenCalled();
  expect(mocks.pin).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
});

it.each(["scope", "epoch"])("discards a delayed add when the owner's %s changes", (field) => {
  const onAdded = vi.fn();
  const { result, rerender } = renderHook(useAddToStack);
  act(() => { result.current.addToStack("figma", "Figma", { onAdded }); });
  const land = mocks.fly.mock.calls[0][1];
  if (field === "scope") mocks.scope = "owner-b";
  else mocks.epoch++;
  rerender();
  act(() => land());
  expect(result.current.flyingSlug).toBeNull();
  expect(mocks.pin).not.toHaveBeenCalled();
  expect(onAdded).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
});

it("suppresses success and analytics when pinning is refused at landing", () => {
  const onAdded = vi.fn();
  const { result } = renderHook(useAddToStack);
  act(() => { result.current.addToStack("figma", "Figma", { onAdded }); });
  mocks.pin.mockReturnValue(false);
  act(() => mocks.fly.mock.calls[0][1]());
  expect(result.current.flyingSlug).toBeNull();
  expect(onAdded).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
});

it("honours the destination and prevents a previous owner's add Undo from changing the current stack", () => {
  const onAdded = vi.fn();
  const { result } = renderHook(useAddToStack);
  act(() => { result.current.addToStack("figma", "Figma", { needIds: ["private-need"], onAdded }); });
  act(() => mocks.fly.mock.calls[0][1]());
  expect(mocks.pin).toHaveBeenCalledWith("figma", ["private-need"]);
  expect(onAdded).toHaveBeenCalledOnce();
  const undo = mocks.toast.mock.calls[0][0].onUndo;
  mocks.epoch++;
  undo();
  expect(mocks.unpin).not.toHaveBeenCalled();
});

it("prevents a previous owner's removal Undo from adding to the current stack", () => {
  const { result } = renderHook(useAddToStack);
  act(() => result.current.removeFromStack("figma", "Figma"));
  expect(mocks.unpin).toHaveBeenCalledWith("figma");
  const undo = mocks.toast.mock.calls[0][0].onUndo;
  mocks.scope = "owner-b";
  undo();
  expect(mocks.pin).not.toHaveBeenCalled();
});
