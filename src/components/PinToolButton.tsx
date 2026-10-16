import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bookmark, BookmarkCheck } from "@/lib/icons";
import { useStackPins } from "@/hooks/useStackPins";
import { useAddToStack } from "@/hooks/useAddToStack";
import { findStackLogo } from "@/lib/stackAddStory";

interface PinToolButtonProps {
  slug: string;
  label: string;
  t: (fr: string, en: string) => string;
  compact?: boolean;
  inline?: boolean;
  labelMode?: "icon" | "short" | "full";
  /** Selector of the element the add flight starts from (e.g. the tool
   *  page's hero logo); defaults to the surrounding card. */
  flyFrom?: string;
}

/**
 * Add-to-stack toggle used across the site. Off: one click runs the shared
 * add story (flight to "Ma stack", confirmation). On: a click asks for a
 * quick confirmation before removing, then offers Undo.
 */
export function PinToolButton({ slug, label, t, compact = false, inline = false, labelMode, flyFrom }: PinToolButtonProps) {
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setInteractive(true), []);
  const { state } = useStackPins();
  const { addToStack, removeFromStack, flyingSlug } = useAddToStack();
  const pinned = state.pinnedToolSlugs.includes(slug) || flyingSlug === slug;
  const mode = labelMode ?? (compact ? "icon" : "full");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [confirmAt, setConfirmAt] = useState<{ top: number; left: number } | null>(null);
  const buttonLabel = pinned
    ? t("Dans ma stack", "In my stack")
    : mode === "full" ? t("Ajouter à ma stack", "Add to my stack") : t("Ajouter", "Add");

  // Where the tool's logo lives (for the confirmation pill).
  const logoSource = () => (flyFrom ? document.querySelector(flyFrom) : null)
    || buttonRef.current?.closest("[data-stack-origin], article, li")
    || null;

  useEffect(() => {
    if (!confirmAt) return;
    const close = () => setConfirmAt(null);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { close(); buttonRef.current?.focus(); } };
    const onPointer = (event: PointerEvent) => {
      if (!(event.target as Element).closest(".stack-confirm")) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [confirmAt]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={!interactive}
        aria-pressed={pinned}
        aria-expanded={pinned ? Boolean(confirmAt) : undefined}
        className={`pin-tool-button${pinned ? " pin-tool-button--active" : ""}${compact ? " pin-tool-button--compact" : ""}${inline ? " pin-tool-button--inline" : ""}${mode === "icon" ? " pin-tool-button--icon" : ""}${mode === "full" ? " pin-tool-button--full" : ""}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (flyingSlug === slug) return;
          if (pinned) {
            const rect = event.currentTarget.getBoundingClientRect();
            setConfirmAt(confirmAt ? null : { top: rect.bottom + 8, left: Math.min(window.innerWidth - 16, rect.right) });
          } else {
            addToStack(slug, label, { origin: event.currentTarget, logoFrom: logoSource() });
          }
        }}
        aria-label={pinned ? t(`Retirer ${label} de ma stack`, `Remove ${label} from my stack`) : t(`Ajouter ${label} à ma stack`, `Add ${label} to my stack`)}
        data-tip={pinned ? t("Retirer de ma stack", "Remove from my stack") : t("Ajouter à ma stack", "Add to my stack")}
      >
        {pinned ? <BookmarkCheck size={compact ? 14 : 16} aria-hidden /> : <Bookmark size={compact ? 14 : 16} aria-hidden />}
        {mode !== "icon" && (
          <span className="pin-tool-button-text">
            {/* When added, hover/focus swaps the label to the action it
                performs (like "Following" → "Unfollow"). */}
            <span className="pin-tool-button-state">{buttonLabel}</span>
            {pinned && <span className="pin-tool-button-hint" aria-hidden>{mode === "full" ? t("Retirer de ma stack", "Remove from my stack") : t("Retirer", "Remove")}</span>}
          </span>
        )}
      </button>
      {confirmAt && createPortal(
        <div
          className="stack-confirm"
          role="dialog"
          aria-label={t(`Retirer ${label} de ma stack ?`, `Remove ${label} from my stack?`)}
          ref={(node) => { if (node) { node.style.top = `${confirmAt.top}px`; node.style.left = `${confirmAt.left}px`; } }}
        >
          <p>{t(`Retirer ${label} de ma stack ?`, `Remove ${label} from my stack?`)}</p>
          <div>
            <button type="button" className="stack-confirm-keep" onClick={() => { setConfirmAt(null); buttonRef.current?.focus(); }} autoFocus>
              {t("Garder", "Keep")}
            </button>
            <button
              type="button"
              className="stack-confirm-remove"
              onClick={() => {
                setConfirmAt(null);
                removeFromStack(slug, label, findStackLogo(logoSource()));
                buttonRef.current?.focus();
              }}
            >
              {t("Retirer", "Remove")}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

export default PinToolButton;
