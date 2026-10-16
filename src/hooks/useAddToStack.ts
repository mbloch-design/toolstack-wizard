import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { findStackLogo, flyToStack, showStackAddedToast } from "@/lib/stackAddStory";

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
  const { pinTool, unpinTool } = useStackPins();
  const [flyingSlug, setFlyingSlug] = useState<string | null>(null);

  const addToStack = useCallback((slug: string, name: string, { origin, logoFrom, needIds = [], onAdded }: AddToStackOptions = {}) => {
    setFlyingSlug(slug);
    const logoSrc = findStackLogo(logoFrom ?? origin);
    flyToStack(origin, () => {
      if (needIds.length) pinTool(slug, needIds);
      else pinTool(slug);
      setFlyingSlug(null);
      onAdded?.();
      showStackAddedToast({
        name,
        logoSrc,
        addedLabel: t("ajouté à ma stack", "added to your stack") as string,
        undoLabel: t("Annuler", "Undo") as string,
        viewLabel: t("Voir", "View") as string,
        onUndo: () => unpinTool(slug),
        onView: () => navigate(`${prefix}/ma-stack?outil=${encodeURIComponent(slug)}`),
      });
    }, logoSrc);
  }, [navigate, pinTool, prefix, t, unpinTool]);

  /** Removal after the user confirmed it; the pill offers to put it back. */
  const removeFromStack = useCallback((slug: string, name: string, logoSrc = "") => {
    unpinTool(slug);
    showStackAddedToast({
      name,
      logoSrc,
      addedLabel: t("retiré de ma stack", "removed from your stack") as string,
      undoLabel: t("Annuler", "Undo") as string,
      viewLabel: t("Voir", "View") as string,
      onUndo: () => pinTool(slug),
      onView: () => navigate(`${prefix}/ma-stack`),
    });
  }, [navigate, pinTool, prefix, t, unpinTool]);

  return { addToStack, removeFromStack, flyingSlug };
}
