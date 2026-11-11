import { useEffect, useRef, useState } from "react";
import Button, { IconButton } from "@/ds/Button/Button";
import Confirm from "@/ds/Confirm/Confirm";
import { Bookmark, BookmarkCheck } from "@/lib/icons";
import { useStackPins } from "@/hooks/useStackPins";
import { useAddToStack } from "@/hooks/useAddToStack";
import { findStackLogo } from "@/lib/stackAddStory";
import { getPersonalStackScope, getPersonalStackScopeEpoch } from "@/lib/personalStackStore";

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
  const { state, requestAddAccess } = useStackPins();
  const { addToStack, removeFromStack, flyingSlug } = useAddToStack();
  const pinned = state.pinnedToolSlugs.includes(slug) || flyingSlug === slug;
  const mode = labelMode ?? (compact ? "icon" : "full");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const scope = getPersonalStackScope();
  const epoch = getPersonalStackScopeEpoch(scope);
  useEffect(() => setConfirmOpen(false), [scope, epoch]);
  const buttonLabel = pinned
    ? t("Dans ma stack", "In my stack")
    : mode === "full" ? t("Ajouter à ma stack", "Add to my stack") : t("Ajouter", "Add");

  // Where the tool's logo lives (for the confirmation pill).
  const logoSource = () => (flyFrom ? document.querySelector(flyFrom) : null)
    || buttonRef.current?.closest("[data-stack-origin], article, li")
    || null;

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (flyingSlug === slug) return;
    if (pinned) setConfirmOpen((open) => !open);
    else {
      if (!requestAddAccess()) return;
      addToStack(slug, label, { origin: event.currentTarget, logoFrom: logoSource() });
    }
  };
  const name = pinned ? t(`Retirer ${label} de ma stack`, `Remove ${label} from my stack`) : t(`Ajouter ${label} à ma stack`, `Add ${label} to my stack`);
  const icon = pinned ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />;
  // The system's buttons (11/11/2026): a round one in icon mode (grey, pale green once in the stack), a pill otherwise.
  const button = mode === "icon"
    ? <IconButton ref={buttonRef} label={name} icon={icon} tone={pinned ? "done" : "grey"} size={compact ? 32 : 40} disabled={!interactive}
        aria-pressed={pinned} aria-expanded={pinned ? confirmOpen : undefined} data-pin-tool="" data-inline={inline || undefined} onClick={onClick} />
    : <Button ref={buttonRef} icon={icon} pressed={pinned} disabled={!interactive} aria-label={name} aria-expanded={pinned ? confirmOpen : undefined}
        data-pin-tool="" onClick={onClick}>{buttonLabel}</Button>;

  return (
    <Confirm open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) buttonRef.current?.focus(); }} anchor={button}
      question={t(`Retirer ${label} de ma stack ?`, `Remove ${label} from my stack?`)} keepLabel={t("Garder", "Keep")} actLabel={t("Retirer", "Remove")}
      onAct={() => removeFromStack(slug, label, findStackLogo(logoSource()))} />
  );
}

export default PinToolButton;
