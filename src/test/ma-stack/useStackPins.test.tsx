// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStackPins } from "@/hooks/useStackPins";
import {
  STACK_STATE_STORAGE_KEY,
  createDefaultToolCartState,
  pinToolInState,
  saveToolCartState,
} from "@/lib/stackState";

class TestStorage implements Storage {
  private values = new Map<string, string>();
  readonly quotaBlocked: boolean;

  constructor(quotaBlocked = false) {
    this.quotaBlocked = quotaBlocked;
  }

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    if (this.quotaBlocked) throw new DOMException("Quota exceeded", "QuotaExceededError");
    this.values.set(key, value);
  }
}

describe("useStackPins persistence", () => {
  it("keeps a failed write in memory and still accepts a later cross-tab update", () => {
    const blockedStorage = new TestStorage(true);
    Object.defineProperty(window, "localStorage", { configurable: true, value: blockedStorage });
    const { result } = renderHook(() => useStackPins());

    act(() => result.current.pinTool("notion", ["organisation"]));

    expect(result.current.state.pinnedToolSlugs).toEqual(["notion"]);
    expect(result.current.persistenceStatus).toMatchObject({
      state: "degraded",
      source: "memory",
      issue: "storage-write-failed",
    });

    const healthyStorage = new TestStorage();
    const remoteState = pinToolInState(createDefaultToolCartState(), "figma", ["design"]);
    saveToolCartState(healthyStorage, remoteState);
    Object.defineProperty(window, "localStorage", { configurable: true, value: healthyStorage });

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", {
        key: STACK_STATE_STORAGE_KEY,
        newValue: healthyStorage.getItem(STACK_STATE_STORAGE_KEY),
      }));
    });

    expect(result.current.state.pinnedToolSlugs).toEqual(["figma"]);
    expect(result.current.persistenceStatus).toMatchObject({ state: "ok", source: "current" });
  });
});
