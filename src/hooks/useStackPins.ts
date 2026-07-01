import { useEffect, useState } from "react";

export const STACK_PINS_STORAGE_KEY = "tooltrim-stack-pins-preprod-v3";
const LEGACY_STACK_PINS_STORAGE_KEYS = [
  "tooltrim-stack-builder-preprod",
  "tooltrim-stack-pins-preprod",
  "tooltrim-stack-pins-preprod-v2",
];

export interface StackBoard {
  id: string;
  name: string;
  description: string;
  toolSlugs: string[];
}

export interface StackPinsState {
  pinnedToolSlugs: string[];
  activeBoardId: string;
  boards: StackBoard[];
}

const DEFAULT_STACK_PINS_STATE: StackPinsState = {
  pinnedToolSlugs: [],
  activeBoardId: "",
  boards: [],
};

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeState(value: Partial<StackPinsState> | null): StackPinsState {
  if (!value) {
    return DEFAULT_STACK_PINS_STATE;
  }

  const boards = Array.isArray(value.boards) ? value.boards.map((board, index) => ({
    id: board.id || createId(`board-${index}`),
    name: board.name || "Tableau sans nom",
    description: board.description || "",
    toolSlugs: Array.isArray(board.toolSlugs) ? Array.from(new Set(board.toolSlugs.filter(Boolean))) : [],
  })) : [];

  return {
    pinnedToolSlugs: Array.isArray(value.pinnedToolSlugs)
      ? Array.from(new Set(value.pinnedToolSlugs.filter(Boolean)))
      : [],
    activeBoardId: value.activeBoardId || boards[0]?.id || "",
    boards,
  };
}

function readStackPinsState(): StackPinsState {
  if (typeof window === "undefined") return DEFAULT_STACK_PINS_STATE;
  try {
    LEGACY_STACK_PINS_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    const raw = window.localStorage.getItem(STACK_PINS_STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw) as Partial<StackPinsState>) : DEFAULT_STACK_PINS_STATE;
  } catch {
    return DEFAULT_STACK_PINS_STATE;
  }
}

export function useStackPins() {
  const [state, setState] = useState<StackPinsState>(() => readStackPinsState());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STACK_PINS_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function pinTool(slug: string, boardId = state.activeBoardId) {
    setState((current) => ({
      ...current,
      pinnedToolSlugs: current.pinnedToolSlugs.includes(slug) ? current.pinnedToolSlugs : [...current.pinnedToolSlugs, slug],
      activeBoardId: current.activeBoardId || boardId || "main-board",
      boards: current.boards.length === 0
        ? [{ id: "main-board", name: "Mon premier tableau", description: "", toolSlugs: [slug] }]
        : current.boards.map((board) => {
          if (board.id !== (boardId || current.activeBoardId) || board.toolSlugs.includes(slug)) return board;
          return { ...board, toolSlugs: [...board.toolSlugs, slug] };
        }),
    }));
  }

  function unpinTool(slug: string) {
    setState((current) => ({
      ...current,
      pinnedToolSlugs: current.pinnedToolSlugs.filter((item) => item !== slug),
      boards: current.boards.map((board) => ({ ...board, toolSlugs: board.toolSlugs.filter((item) => item !== slug) })),
    }));
  }

  function toggleToolInBoard(slug: string, boardId = state.activeBoardId) {
    setState((current) => ({
      ...current,
      pinnedToolSlugs: current.pinnedToolSlugs.includes(slug) ? current.pinnedToolSlugs : [...current.pinnedToolSlugs, slug],
      activeBoardId: current.activeBoardId || boardId || "main-board",
      boards: current.boards.length === 0
        ? [{ id: "main-board", name: "Mon premier tableau", description: "", toolSlugs: [slug] }]
        : current.boards.map((board) => {
        if (board.id !== boardId) return board;
        const exists = board.toolSlugs.includes(slug);
        return { ...board, toolSlugs: exists ? board.toolSlugs.filter((item) => item !== slug) : [...board.toolSlugs, slug] };
      }),
    }));
  }

  function createBoard() {
    const nextId = createId("board");
    setState((current) => ({
      ...current,
      activeBoardId: nextId,
      boards: [...current.boards, { id: nextId, name: "Nouveau tableau", description: "Décris l'usage de ce stack.", toolSlugs: [] }],
    }));
  }

  function updateBoard(boardId: string, patch: Partial<Pick<StackBoard, "name" | "description">>) {
    setState((current) => ({
      ...current,
      boards: current.boards.map((board) => board.id === boardId ? { ...board, ...patch } : board),
    }));
  }

  function setActiveBoard(boardId: string) {
    setState((current) => ({ ...current, activeBoardId: boardId }));
  }

  return {
    state,
    activeBoard: state.boards.find((board) => board.id === state.activeBoardId) || state.boards[0],
    pinTool,
    unpinTool,
    toggleToolInBoard,
    createBoard,
    updateBoard,
    setActiveBoard,
  };
}
