import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Bookmark, Check, FolderPlus, Search, Sparkles, Trash2, X } from "lucide-react";
import type { StackNeed, StackToolIntent } from "@/lib/stackState";

interface StackSaveDialogProps {
  isOpen: boolean;
  label: string;
  lang: string;
  needs: StackNeed[];
  initialIntent: StackToolIntent;
  initialNeedIds: string[];
  suggestedNeedId?: string;
  onClose: () => void;
  onCreateNeed: (label: string) => string | null;
  onRemove?: () => void;
  onSave: (needIds: string[], intent: StackToolIntent) => void;
  t: (fr: string, en: string) => string;
}

export function StackSaveDialog({
  isOpen,
  label,
  lang,
  needs,
  initialIntent,
  initialNeedIds,
  suggestedNeedId,
  onClose,
  onCreateNeed,
  onRemove,
  onSave,
  t,
}: StackSaveDialogProps) {
  const [intent, setIntent] = useState<StackToolIntent>(initialIntent);
  const [selectedNeedIds, setSelectedNeedIds] = useState<string[]>(initialNeedIds);
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const dialogRef = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const initialSelectionRef = useRef({ initialIntent, initialNeedIds, suggestedNeedId });
  onCloseRef.current = onClose;
  initialSelectionRef.current = { initialIntent, initialNeedIds, suggestedNeedId };

  useEffect(() => {
    if (!isOpen) return;
    const initial = initialSelectionRef.current;
    setIntent(initial.initialIntent);
    setSelectedNeedIds(initial.initialNeedIds.length > 0 ? initial.initialNeedIds : initial.suggestedNeedId ? [initial.suggestedNeedId] : []);
    setQuery("");
    setIsCreating(false);
    setNewBoardName("");
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => searchRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute("hidden"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  const visibleNeeds = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(lang);
    if (!normalizedQuery) return needs;
    return needs.filter((need) => {
      const name = lang === "en" ? need.labelEn : need.labelFr;
      return name.toLocaleLowerCase(lang).includes(normalizedQuery);
    });
  }, [lang, needs, query]);

  if (!isOpen) return null;

  function toggleNeed(needId: string) {
    setSelectedNeedIds((current) => current.includes(needId)
      ? current.filter((id) => id !== needId)
      : [...current, needId]);
  }

  function createBoard(event: FormEvent) {
    event.preventDefault();
    const needId = onCreateNeed(newBoardName);
    if (!needId) return;
    setSelectedNeedIds((current) => Array.from(new Set([...current, needId])));
    setNewBoardName("");
    setIsCreating(false);
  }

  return createPortal((
    <div className="stack-save-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="stack-save-dialog" role="dialog" aria-modal="true" aria-labelledby="stack-save-title">
        <header className="stack-save-head">
          <h2 id="stack-save-title">{t(`Ajouter ${label} à une collection`, `Add ${label} to a collection`)}</h2>
          <button type="button" onClick={onClose} aria-label={t("Fermer", "Close")}><X size={19} aria-hidden /></button>
        </header>

        <div className="stack-save-intents" role="radiogroup" aria-label={t("Enregistrer dans", "Save to")}>
          <span>{t("Enregistrer dans", "Save to")}</span>
          <button type="button" role="radio" aria-checked={intent === "stack"} className={intent === "stack" ? "is-selected" : ""} onClick={() => setIntent("stack")}>
            <Check size={15} aria-hidden />
            <strong>{t("Ma stack", "My stack")}</strong>
          </button>
          <button type="button" role="radio" aria-checked={intent === "wishlist"} className={intent === "wishlist" ? "is-selected" : ""} onClick={() => setIntent("wishlist")}>
            <Bookmark size={15} aria-hidden />
            <strong>{t("À essayer", "Try later")}</strong>
          </button>
        </div>

        <label className="stack-save-search">
          <Search size={17} aria-hidden />
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Filtrer les collections…", "Filter collections…")} />
        </label>

        <div className="stack-save-board-list" role="list">
          {visibleNeeds.map((need) => {
            const selected = selectedNeedIds.includes(need.id);
            const suggested = need.id === suggestedNeedId;
            const needLabel = lang === "en" ? need.labelEn : need.labelFr;
            return (
              <button key={need.id} type="button" role="checkbox" aria-checked={selected} className={selected ? "is-selected" : ""} onClick={() => toggleNeed(need.id)}>
                <span className="stack-save-board-mark">{selected ? <Check size={16} aria-hidden /> : null}</span>
                <span className="stack-save-board-copy"><strong>{needLabel}</strong><small>{need.source === "custom" ? t("Collection personnelle", "Custom collection") : t("Collection ToolTrim", "ToolTrim collection")}</small></span>
                {suggested && <span className="stack-save-suggestion"><Sparkles size={13} aria-hidden />{t("Suggéré", "Suggested")}</span>}
              </button>
            );
          })}
          {visibleNeeds.length === 0 && <p className="stack-save-no-result">{t("Aucune collection ne correspond.", "No matching collection.")}</p>}
        </div>

        {isCreating && (
          <form className="stack-save-create" onSubmit={createBoard}>
            <label htmlFor="stack-save-new-board">{t("Nom de la nouvelle collection", "New collection name")}</label>
            <div><input id="stack-save-new-board" autoFocus maxLength={60} value={newBoardName} onChange={(event) => setNewBoardName(event.target.value)} placeholder={t("Ex. Outils client", "e.g. Client tools")} /><button type="submit" disabled={!newBoardName.trim()}>{t("Créer", "Create")}</button></div>
          </form>
        )}

        <footer className="stack-save-footer">
          <div className="stack-save-footer-left">
            <button type="button" className="stack-save-create-trigger" onClick={() => setIsCreating((current) => !current)}><FolderPlus size={18} aria-hidden />{t("Créer une nouvelle collection", "Create a new collection")}</button>
            {onRemove && <button type="button" className="stack-save-remove" onClick={onRemove}><Trash2 size={16} aria-hidden />{t("Retirer", "Remove")}</button>}
          </div>
          <button type="button" className="stack-save-confirm" onClick={() => onSave(selectedNeedIds, intent)} disabled={selectedNeedIds.length === 0}>{t("Terminer", "Done")}</button>
        </footer>
      </section>
    </div>
  ), document.body);
}

export default StackSaveDialog;
