import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { findStackLogo, flyToStack, showStackAddedToast } from "@/lib/stackAddStory";

import { getPersonalStackScope, getPersonalStackScopeEpoch } from "@/lib/personalStackStore";

interface AddToStackOptions {
  /** The clicked button: the flight starts there. */
  origin?: Element | null;
  /** Element holding the tool's logo, shown in the confirmation. */
  logoFrom?: Element | null;
  /** Explorer destination needs, kept for the legacy objective journeys. */
  needIds?: string[];
  /** Runs once the tool is actually in the stack (analytics…). */
  onAdded?: () => void;
}

/**
 * The single add-to-stack behaviour of the site: one click, the picture
 * flies to "Ma stack", the stack updates on landing, then a confirmation
 * with Undo and View. `flyingSlug` lets a button show "Added" during the
 * flight.
 */
export function useAddToStack() {
  const { prefix, t } = useLang();
  const navigate = useNavigate();
  const { pinTool, unpinTool, requestAddAccess } = useStackPins();
  const scope = getPersonalStackScope();
  const epoch = getPersonalStackScopeEpoch(scope);
  const isCurrentOwner = useCallback(() => getPersonalStackScope() === scope && getPersonalStackScopeEpoch(scope) === epoch, [scope, epoch]);
  const [flyingSlug, setFlyingSlug] = useState<string | null>(null);

  useEffect(() => setFlyingSlug(null), [scope, epoch]);

  const addToStack = useCallback((slug: string, name: string, { origin, logoFrom, needIds = [], onAdded }: AddToStackOptions = {}) => {
    if (!isCurrentOwner() || !requestAddAccess()) return false;
    setFlyingSlug(slug);
    const logoSrc = findStackLogo(logoFrom ?? origin);
    flyToStack(origin, () => {
      if (!isCurrentOwner()) return;
      setFlyingSlug(null);
      if (!pinTool(slug, needIds)) return;
      onAdded?.();
      showStackAddedToast({
        name,
        logoSrc,
        addedLabel: t("ajouté à ma stack", "added to your stack") as string,
        undoLabel: t("Annuler", "Undo") as string,
        viewLabel: t("Voir", "View") as string,
        onUndo: () => { if (isCurrentOwner()) unpinTool(slug); },
        onView: () => navigate(`${prefix}/ma-stack?outil=${encodeURIComponent(slug)}`),
      });
    }, logoSrc);
    return true;
  }, [isCurrentOwner, navigate, pinTool, prefix, requestAddAccess, t, unpinTool]);

  /** Removal after the user confirmed it; the pill offers to put it back. */
  const removeFromStack = useCallback((slug: string, name: string, logoSrc = "") => {
    if (!isCurrentOwner()) return;
    unpinTool(slug);
    showStackAddedToast({
      name,
      logoSrc,
      addedLabel: t("retiré de ma stack", "removed from your stack") as string,
      undoLabel: t("Annuler", "Undo") as string,
      viewLabel: t("Voir", "View") as string,
      onUndo: () => { if (isCurrentOwner()) pinTool(slug); },
      onView: () => navigate(`${prefix}/ma-stack`),
    });
  }, [isCurrentOwner, navigate, pinTool, prefix, t, unpinTool]);

  return { addToStack, removeFromStack, flyingSlug };
}
