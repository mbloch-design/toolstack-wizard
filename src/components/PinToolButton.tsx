import { useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck } from "@/lib/icons";
import { toast } from "sonner";
import { useStackPins } from "@/hooks/useStackPins";
import { useLang } from "@/hooks/useLang";

interface PinToolButtonProps {
  slug: string;
  label: string;
  t: (fr: string, en: string) => string;
  compact?: boolean;
  inline?: boolean;
  labelMode?: "icon" | "short" | "full";
}

export function PinToolButton({ slug, label, t, compact = false, inline = false, labelMode }: PinToolButtonProps) {
  const { prefix } = useLang();
  const navigate = useNavigate();
  const { state, pinTool } = useStackPins();
  const pinned = state.pinnedToolSlugs.includes(slug);
  const mode = labelMode ?? (compact ? "icon" : "full");
  const buttonLabel = pinned
    ? t("Dans ma stack", "In my stack")
    : mode === "full" ? t("Ajouter à ma stack", "Add to my stack") : t("Ajouter", "Add");

  return (
    <button
      type="button"
      className={`pin-tool-button${pinned ? " pin-tool-button--active" : ""}${compact ? " pin-tool-button--compact" : ""}${inline ? " pin-tool-button--inline" : ""}${mode === "icon" ? " pin-tool-button--icon" : ""}${mode === "full" ? " pin-tool-button--full" : ""}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (pinned) {
          navigate(`${prefix}/ma-stack?outil=${encodeURIComponent(slug)}`);
        } else {
          pinTool(slug);
          toast.success(t(`${label} ajouté à ma stack.`, `${label} added to your stack.`));
        }
      }}
      aria-label={pinned ? t(`Voir ${label} dans ma stack`, `View ${label} in my stack`) : t(`Ajouter ${label} à ma stack`, `Add ${label} to my stack`)}
      title={buttonLabel}
    >
      {pinned ? <BookmarkCheck size={compact ? 14 : 16} aria-hidden /> : <Bookmark size={compact ? 14 : 16} aria-hidden />}
      {mode !== "icon" && <span className="pin-tool-button-text">{buttonLabel}</span>}
    </button>
  );
}

export default PinToolButton;
