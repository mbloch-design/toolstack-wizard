import { useEffect, useState } from "react";

export const STACK_PINS_STORAGE_KEY = "tooltrim-tool-cart-mvp-v1";
const LEGACY_STACK_PINS_STORAGE_KEYS = [
  "tooltrim-tool-cart-v1",
  "tooltrim-stack-builder-preprod",
  "tooltrim-stack-pins-preprod",
  "tooltrim-stack-pins-preprod-v2",
  "tooltrim-stack-pins-preprod-v3",
];

export interface ToolCartState {
  pinnedToolSlugs: string[];
}

const DEFAULT_TOOL_CART_STATE: ToolCartState = {
  pinnedToolSlugs: [],
};

function normalizeState(value: Partial<ToolCartState> | null): ToolCartState {
  if (!value || !Array.isArray(value.pinnedToolSlugs)) return DEFAULT_TOOL_CART_STATE;
  return {
    pinnedToolSlugs: Array.from(new Set(value.pinnedToolSlugs.filter(Boolean))),
  };
}

function readToolCartState(): ToolCartState {
  if (typeof window === "undefined") return DEFAULT_TOOL_CART_STATE;
  try {
    LEGACY_STACK_PINS_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    const raw = window.localStorage.getItem(STACK_PINS_STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw) as Partial<ToolCartState>) : DEFAULT_TOOL_CART_STATE;
  } catch {
    return DEFAULT_TOOL_CART_STATE;
  }
}

let currentToolCartState: ToolCartState | null = null;
const subscribers = new Set<(state: ToolCartState) => void>();

function getCurrentToolCartState() {
  if (!currentToolCartState) currentToolCartState = readToolCartState();
  return currentToolCartState;
}

function commitToolCartState(nextState: ToolCartState) {
  currentToolCartState = normalizeState(nextState);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STACK_PINS_STORAGE_KEY, JSON.stringify(currentToolCartState));
  }
  subscribers.forEach((subscriber) => subscriber(currentToolCartState as ToolCartState));
}

function updateToolCartState(updater: (current: ToolCartState) => ToolCartState) {
  commitToolCartState(updater(getCurrentToolCartState()));
}

export function useStackPins() {
  const [state, setState] = useState<ToolCartState>(() => getCurrentToolCartState());

  useEffect(() => {
    subscribers.add(setState);
    setState(getCurrentToolCartState());

    function handleStorage(event: StorageEvent) {
      if (event.key !== STACK_PINS_STORAGE_KEY) return;
      try {
        currentToolCartState = normalizeState(event.newValue ? JSON.parse(event.newValue) as Partial<ToolCartState> : null);
      } catch {
        currentToolCartState = DEFAULT_TOOL_CART_STATE;
      }
      subscribers.forEach((subscriber) => subscriber(currentToolCartState as ToolCartState));
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      subscribers.delete(setState);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, []);

  function pinTool(slug: string) {
    updateToolCartState((current) => ({
      ...current,
      pinnedToolSlugs: current.pinnedToolSlugs.includes(slug) ? current.pinnedToolSlugs : [...current.pinnedToolSlugs, slug],
    }));
  }

  function unpinTool(slug: string) {
    updateToolCartState((current) => ({
      ...current,
      pinnedToolSlugs: current.pinnedToolSlugs.filter((item) => item !== slug),
    }));
  }

  function moveTool(slug: string, direction: -1 | 1) {
    updateToolCartState((current) => {
      const currentIndex = current.pinnedToolSlugs.indexOf(slug);
      if (currentIndex === -1) return current;
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= current.pinnedToolSlugs.length) return current;
      const pinnedToolSlugs = [...current.pinnedToolSlugs];
      const [item] = pinnedToolSlugs.splice(currentIndex, 1);
      pinnedToolSlugs.splice(nextIndex, 0, item);
      return { ...current, pinnedToolSlugs };
    });
  }

  function setToolOrder(slugs: string[]) {
    updateToolCartState((current) => {
      const knownSlugs = new Set(current.pinnedToolSlugs);
      const orderedSlugs = slugs.filter((slug) => knownSlugs.has(slug));
      const remainingSlugs = current.pinnedToolSlugs.filter((slug) => !orderedSlugs.includes(slug));
      return { ...current, pinnedToolSlugs: [...orderedSlugs, ...remainingSlugs] };
    });
  }

  function clearTools() {
    updateToolCartState((current) => ({ ...current, pinnedToolSlugs: [] }));
  }

  return {
    state,
    pinTool,
    unpinTool,
    moveTool,
    setToolOrder,
    clearTools,
  };
}
