import { Bookmark, BookmarkCheck } from "lucide-react";
import { useStackPins } from "@/hooks/useStackPins";

interface PinToolButtonProps {
  slug: string;
  label: string;
  t: (fr: string, en: string) => string;
  compact?: boolean;
  inline?: boolean;
  labelMode?: "icon" | "short" | "full";
}

export function PinToolButton({ slug, label, t, compact = false, inline = false, labelMode }: PinToolButtonProps) {
  const { state, pinTool, unpinTool } = useStackPins();
  const pinned = state.pinnedToolSlugs.includes(slug);
  const mode = labelMode ?? (compact ? "icon" : "full");
  const buttonLabel = pinned
    ? mode === "full" ? t("Dans ma stack", "In my stack") : t("Dans la stack", "In stack")
    : mode === "full" ? t("Ajouter à ma stack", "Add to my stack") : t("Ajouter", "Add");

  return (
    <button
      type="button"
      className={`pin-tool-button${pinned ? " pin-tool-button--active" : ""}${compact ? " pin-tool-button--compact" : ""}${inline ? " pin-tool-button--inline" : ""}${mode === "icon" ? " pin-tool-button--icon" : ""}${mode === "full" ? " pin-tool-button--full" : ""}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (pinned) {
          unpinTool(slug);
        } else {
          pinTool(slug);
        }
      }}
      aria-pressed={pinned}
      aria-label={pinned ? t(`Retirer ${label} de ma stack`, `Remove ${label} from my stack`) : t(`Ajouter ${label} à ma stack`, `Add ${label} to my stack`)}
      title={pinned ? t("Retirer de ma stack", "Remove from my stack") : t("Ajouter à ma stack", "Add to my stack")}
    >
      {pinned ? <BookmarkCheck size={compact ? 14 : 16} aria-hidden /> : <Bookmark size={compact ? 14 : 16} aria-hidden />}
      {mode !== "icon" && <span className="pin-tool-button-text">{buttonLabel}</span>}
    </button>
  );
}

export default PinToolButton;
