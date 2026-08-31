import { useMemo, useState } from "react";
import { Bookmark, BookmarkCheck } from "@/lib/icons";
import { toast } from "sonner";
import { useStackPins } from "@/hooks/useStackPins";
import { useLang } from "@/hooks/useLang";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import StackSaveMenu from "@/components/stack/StackSaveMenu";

const EMPTY_NEED_IDS: string[] = [];

function suggestNeedId(slug: string, availableNeedIds: Set<string>) {
  const normalizedSlug = slug.toLowerCase();
  const candidates: Array<[string, RegExp]> = [
    ["ia", /ai|ia|gpt|claude|gemini|copilot|midjourney|llm/],
    ["design", /figma|design|photo|video|motion|lottie|bodymovin|canva|adobe|image/],
    ["automation", /zapier|make|n8n|automat|workflow/],
    ["marketing", /seo|marketing|social|newsletter|mailchimp|analytics/],
    ["vente", /crm|sales|stripe|shopify|hubspot|client/],
    ["finance", /finance|account|invoice|factur|bank|payroll/],
    ["dev", /github|gitlab|cursor|code|vercel|netlify|database|dev/],
  ];
  return candidates.find(([needId, pattern]) => availableNeedIds.has(needId) && pattern.test(normalizedSlug))?.[0]
    || (availableNeedIds.has("organisation") ? "organisation" : Array.from(availableNeedIds)[0]);
}

interface PinToolButtonProps {
  slug: string;
  label: string;
  t: (fr: string, en: string) => string;
  compact?: boolean;
  inline?: boolean;
  labelMode?: "icon" | "short" | "full";
}

export function PinToolButton({ slug, label, t, compact = false, inline = false, labelMode }: PinToolButtonProps) {
  const { lang } = useLang();
  const { state, saveToolSelection, unpinTool, createNeed } = useStackPins();
  const [open, setOpen] = useState(false);
  const entry = state.toolEntries.find((item) => item.toolSlug === slug);
  const pinned = !!entry;
  const suggestedNeedId = useMemo(
    () => suggestNeedId(slug, new Set(state.needs.map((need) => need.id))),
    [slug, state.needs],
  );
  const mode = labelMode ?? (compact ? "icon" : "full");
  const buttonLabel = pinned
    ? entry.intent === "wishlist"
      ? mode === "full" ? t("Dans Mes envies", "On my wishlist") : t("Mes envies", "Wishlist")
      : mode === "full" ? t("Dans ma stack", "In my stack") : t("Dans la stack", "In stack")
    : mode === "full" ? t("Ajouter à ma stack", "Add to my stack") : t("Ajouter", "Add");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`pin-tool-button${pinned ? " pin-tool-button--active" : ""}${entry?.intent === "wishlist" ? " pin-tool-button--wishlist" : ""}${compact ? " pin-tool-button--compact" : ""}${inline ? " pin-tool-button--inline" : ""}${mode === "icon" ? " pin-tool-button--icon" : ""}${mode === "full" ? " pin-tool-button--full" : ""}`}
          onClick={(event) => {
            // Only stop the click reaching an ancestor card link — must not
            // preventDefault() here, Radix's own trigger toggle bails out
            // when the click event arrives already defaultPrevented.
            event.stopPropagation();
          }}
          aria-pressed={pinned}
          aria-label={pinned ? t(`Modifier l’enregistrement de ${label}`, `Edit saved ${label}`) : t(`Ajouter ${label}`, `Add ${label}`)}
          title={pinned ? t("Modifier l’enregistrement", "Edit saved tool") : t("Ajouter à ma stack", "Add to stack")}
        >
          {pinned ? <BookmarkCheck size={compact ? 14 : 16} aria-hidden /> : <Bookmark size={compact ? 14 : 16} aria-hidden />}
          {mode !== "icon" && <span className="pin-tool-button-text">{buttonLabel}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="stack-save-popover"
        side="bottom"
        align="end"
        sideOffset={8}
        onClick={(event) => event.stopPropagation()}
      >
        <StackSaveMenu
          lang={lang}
          needs={state.needs}
          toolEntries={state.toolEntries}
          pinned={pinned}
          currentIntent={entry?.intent ?? null}
          currentNeedIds={entry?.needIds || EMPTY_NEED_IDS}
          suggestedNeedId={suggestedNeedId}
          onCreateNeed={createNeed}
          onSave={(needIds, intent) => {
            saveToolSelection(slug, needIds, intent);
            setOpen(false);
            toast.success(intent === "stack"
              ? t(`${label} a été ajouté à votre stack.`, `${label} was added to your stack.`)
              : t(`${label} a été ajouté à Mes envies.`, `${label} was added to your wishlist.`));
          }}
          onRemove={() => {
            unpinTool(slug);
            setOpen(false);
            toast.success(t(`${label} a été retiré de vos sélections.`, `${label} was removed from your saved tools.`));
          }}
          t={t}
        />
      </PopoverContent>
    </Popover>
  );
}

export default PinToolButton;
