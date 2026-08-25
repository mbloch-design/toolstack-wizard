import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import type { StackNeed } from "@/lib/stackState";

interface StackNeedsManagerDialogProps {
  isOpen: boolean;
  lang: string;
  needs: StackNeed[];
  onClose: () => void;
  onCreate: (label: string) => string | null;
  onDelete: (needId: string) => void;
  onMove: (needId: string, direction: -1 | 1) => void;
  onRename: (needId: string, label: string) => void;
  t: (fr: string, en: string) => string;
}

export function StackNeedsManagerDialog({
  isOpen,
  lang,
  needs,
  onClose,
  onCreate,
  onDelete,
  onMove,
  onRename,
  t,
}: StackNeedsManagerDialogProps) {
  const [newNeedName, setNewNeedName] = useState("");
  const [editingNeedId, setEditingNeedId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const dialogRef = useRef<HTMLElement | null>(null);
  const createInputRef = useRef<HTMLInputElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => createInputRef.current?.focus());

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

  if (!isOpen) return null;

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!newNeedName.trim()) return;
    const needId = onCreate(newNeedName);
    if (needId) setNewNeedName("");
  }

  function beginRename(need: StackNeed) {
    setEditingNeedId(need.id);
    setEditingName(lang === "en" ? need.labelEn : need.labelFr);
  }

  function commitRename(needId: string) {
    if (editingName.trim()) onRename(needId, editingName);
    setEditingNeedId(null);
    setEditingName("");
  }

  function handleDelete(needId: string) {
    onDelete(needId);
    window.requestAnimationFrame(() => createInputRef.current?.focus());
  }

  return (
    <div className="stack-needs-manager-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        ref={dialogRef}
        className="stack-needs-manager"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stack-needs-manager-title"
      >
        <div className="stack-needs-manager-head">
          <div>
            <span>{t("Ma stack", "My stack")}</span>
            <h2 id="stack-needs-manager-title">{t("Organiser mes collections", "Organize my collections")}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t("Fermer", "Close")}>
            <X size={18} aria-hidden />
          </button>
        </div>

        <p className="stack-needs-manager-intro">
          {t(
            "Créez et ordonnez vos collections pour retrouver chaque outil au bon endroit. Les collections ToolTrim restent disponibles ; vous pouvez ajouter les vôtres.",
            "Create and order collections so every tool stays easy to find. ToolTrim collections remain available, and you can add your own.",
          )}
        </p>

        <form className="stack-needs-create" onSubmit={handleCreate}>
          <label htmlFor="stack-new-need">{t("Nouvelle collection", "New collection")}</label>
          <div>
            <input
              ref={createInputRef}
              id="stack-new-need"
              value={newNeedName}
              onChange={(event) => setNewNeedName(event.target.value)}
              placeholder={t("Ex. Suivi client", "e.g. Client follow-up")}
              maxLength={60}
            />
            <button type="submit" disabled={!newNeedName.trim()}>
              <Plus size={15} aria-hidden />
              {t("Créer", "Create")}
            </button>
          </div>
        </form>

        <div className="stack-needs-manager-list" role="list">
          {needs.map((need, index) => {
            const isEditing = editingNeedId === need.id;
            const label = lang === "en" ? need.labelEn : need.labelFr;
            return (
              <article key={need.id} className="stack-needs-manager-row" role="listitem">
                <div className="stack-needs-order-actions" aria-label={t(`Ordre de ${label}`, `Order ${label}`)}>
                  <button
                    type="button"
                    onClick={() => onMove(need.id, -1)}
                    disabled={index === 0}
                    aria-label={t(`Monter ${label}`, `Move ${label} up`)}
                  >
                    <ChevronUp size={15} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(need.id, 1)}
                    disabled={index === needs.length - 1}
                    aria-label={t(`Descendre ${label}`, `Move ${label} down`)}
                  >
                    <ChevronDown size={15} aria-hidden />
                  </button>
                </div>

                <div className="stack-needs-manager-row-copy">
                  {isEditing ? (
                    <input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") commitRename(need.id);
                        if (event.key === "Escape") setEditingNeedId(null);
                      }}
                      aria-label={t(`Nouveau nom de ${label}`, `New name for ${label}`)}
                      autoFocus
                      maxLength={60}
                    />
                  ) : (
                    <>
                      <strong>{label}</strong>
                      <span>{need.source === "custom" ? t("Personnalisé", "Custom") : t("Suggéré", "Suggested")}</span>
                    </>
                  )}
                </div>

                <div className="stack-needs-manager-row-actions">
                  {isEditing ? (
                    <button type="button" className="is-primary" onClick={() => commitRename(need.id)}>
                      {t("Valider", "Save")}
                    </button>
                  ) : need.source === "custom" ? (
                    <>
                      <button type="button" onClick={() => beginRename(need)} aria-label={t(`Renommer ${label}`, `Rename ${label}`)}>
                        <Pencil size={14} aria-hidden />
                      </button>
                      <button type="button" className="is-danger" onClick={() => handleDelete(need.id)} aria-label={t(`Supprimer la collection ${label}`, `Delete collection ${label}`)}>
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default StackNeedsManagerDialog;
