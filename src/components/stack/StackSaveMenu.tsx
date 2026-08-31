import { useMemo, useState, type FormEvent } from "react";
import { Bookmark, BookmarkCheck, Check, FolderPlus, LayoutGrid } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import { getNeedIcon } from "@/lib/needIcons";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import type { StackNeed, StackToolEntry, StackToolIntent } from "@/lib/stackState";

const BOARD_THUMB_LIMIT = 3;
const MAX_COLLECTIONS_SHOWN = 3;

interface StackSaveMenuProps {
  lang: string;
  needs: StackNeed[];
  toolEntries: StackToolEntry[];
  pinned: boolean;
  currentIntent: StackToolIntent | null;
  currentNeedIds: string[];
  suggestedNeedId?: string;
  onCreateNeed: (label: string) => string | null;
  onSave: (needIds: string[], intent: StackToolIntent) => void;
  onRemove: () => void;
  t: (fr: string, en: string) => string;
}

/**
 * Save-to-collection popover body. Every row is a complete, one-click
 * action — save (or unsave), then the popover closes and the trigger
 * button shows the result; there's no separate multi-select + confirm
 * step. Lives inside <PopoverContent>, which handles positioning,
 * dismissal and focus.
 */
export function StackSaveMenu({
  lang,
  needs,
  toolEntries,
  pinned,
  currentIntent,
  currentNeedIds = [],
  suggestedNeedId,
  onCreateNeed,
  onSave,
  onRemove,
  t,
}: StackSaveMenuProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  const { tools } = useToolSummaries();
  const toolBySlug = useMemo(() => {
    const map = new Map<string, ToolSummary>();
    for (const tool of tools) map.set(tool.slug || tool.id, tool);
    return map;
  }, [tools]);

  const needPreviewTools = useMemo(() => {
    const map = new Map<string, ToolSummary[]>();
    for (const need of needs) {
      const preview: ToolSummary[] = [];
      for (const entry of toolEntries) {
        if (preview.length >= BOARD_THUMB_LIMIT) break;
        if (!entry.needIds.includes(need.id)) continue;
        const tool = toolBySlug.get(entry.toolSlug);
        if (tool) preview.push(tool);
      }
      map.set(need.id, preview);
    }
    return map;
  }, [needs, toolEntries, toolBySlug]);

  // Collections you've actually used, nothing else — an empty category
  // doesn't narrow the choice, it's just another name to read.
  const activeNeeds = needs
    .filter((need) => (needPreviewTools.get(need.id)?.length ?? 0) > 0)
    .sort((a, b) => (a.id === suggestedNeedId ? -1 : b.id === suggestedNeedId ? 1 : 0))
    .slice(0, MAX_COLLECTIONS_SHOWN);

  function toggleStack() {
    if (pinned && currentIntent === "stack") {
      onRemove();
      return;
    }
    onSave(currentNeedIds, "stack");
  }

  function toggleWishlist() {
    if (pinned && currentIntent === "wishlist") {
      onRemove();
      return;
    }
    onSave(currentNeedIds, "wishlist");
  }

  function addToCollection(needId: string) {
    const next = currentNeedIds.includes(needId) ? currentNeedIds : [...currentNeedIds, needId];
    onSave(next, "stack");
  }

  function createBoard(event: FormEvent) {
    event.preventDefault();
    const needId = onCreateNeed(newBoardName);
    if (!needId) return;
    onSave([...currentNeedIds, needId], "stack");
  }

  return (
    <div className="stack-save-menu">
      <div className={`stack-save-menu-quick${pinned && currentIntent === "stack" ? " is-selected" : ""}`}>
        <button type="button" className="stack-save-menu-quick-main" onClick={toggleStack}>
          <span className="stack-save-board-thumb-icon"><LayoutGrid size={16} aria-hidden /></span>
          <span>{t("Ma stack", "My stack")}</span>
        </button>
        {/* Wishlist, icon-only on purpose: "I don't have this yet, but it's
            tempting — set it aside to reconsider later" doesn't need a
            label, the bookmark itself is the whole idea, same as the
            reference's save toggle on its default board row. */}
        <button
          type="button"
          className={`stack-save-menu-wishlist${pinned && currentIntent === "wishlist" ? " is-selected" : ""}`}
          onClick={toggleWishlist}
          aria-pressed={pinned && currentIntent === "wishlist"}
          aria-label={pinned && currentIntent === "wishlist" ? t("Dans mes envies", "On my wishlist") : t("À essayer plus tard", "Try later")}
          title={pinned && currentIntent === "wishlist" ? t("Dans mes envies", "On my wishlist") : t("À essayer plus tard", "Try later")}
        >
          {pinned && currentIntent === "wishlist" ? <BookmarkCheck size={17} aria-hidden /> : <Bookmark size={17} aria-hidden />}
        </button>
      </div>

      {activeNeeds.length > 0 && (
        <div className="stack-save-menu-list" role="list">
          {activeNeeds.map((need) => {
            const selected = currentNeedIds.includes(need.id);
            const needLabel = lang === "en" ? need.labelEn : need.labelFr;
            const previewTools = needPreviewTools.get(need.id) || [];
            const NeedIcon = getNeedIcon(need.id);
            return (
              <button key={need.id} type="button" role="checkbox" aria-checked={selected} className={selected ? "is-selected" : ""} onClick={() => addToCollection(need.id)}>
                <span className="stack-save-board-thumb">
                  <span className="stack-save-board-thumb-icon"><NeedIcon size={16} aria-hidden /></span>
                  {previewTools.length > 0 && (
                    <span className="stack-save-board-thumb-tools">
                      {previewTools.slice(0, 2).map((tool) => (
                        <ToolLogo key={tool.id || tool.slug} tool={tool} size={14} />
                      ))}
                    </span>
                  )}
                </span>
                <span>{needLabel}</span>
                {selected && <Check size={15} aria-hidden />}
              </button>
            );
          })}
        </div>
      )}

      {isCreating ? (
        <form className="stack-save-menu-create" onSubmit={createBoard}>
          <input autoFocus maxLength={60} value={newBoardName} onChange={(event) => setNewBoardName(event.target.value)} placeholder={t("Nom de la collection", "Collection name")} />
          <button type="submit" disabled={!newBoardName.trim()}>{t("Créer", "Create")}</button>
        </form>
      ) : (
        <button type="button" className="stack-save-menu-create-trigger" onClick={() => setIsCreating(true)}>
          <FolderPlus size={16} aria-hidden />
          {t("Nouvelle collection", "New collection")}
        </button>
      )}
    </div>
  );
}

export default StackSaveMenu;
