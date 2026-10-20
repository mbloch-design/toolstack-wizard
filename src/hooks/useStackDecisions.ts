import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { pinToolInState, unpinToolInState } from "@/lib/stackState";
import { readPersonalStack, updatePersonalStack, subscribePersonalStack, getServerPersonalStack, getPersonalStackScope, getPersonalStackScopeEpoch } from "@/lib/personalStackStore";
import { trackEvent } from "@/lib/analytics";

/**
 * Décisions prises sur des recoupements de Ma stack, depuis la stack ou depuis
 * un comparatif : c'est la suite des CTA sortants (« Comparer »), qui
 * referme la boucle « je compare, je décide, ma stack en tient compte ».
 *
 * - keep-both : les deux restent, la paire ne compte plus dans « payé en
 *   double » (la personne a jugé qu'ils ne font pas le même travail).
 * - keep-one : les deux étaient dans la stack, l'un est retiré.
 * - replace : seul l'un était dans la stack, il est remplacé par l'autre.
 *
 * Chaque retrait est annulable (toast), et l'annulation efface la décision.
 * Stockage local, comme la stack ; mesure sans donnée personnelle.
 */

export type { StackDecision } from "@/lib/stackDecisions";
import type { StackDecision } from "@/lib/stackDecisions";
import type { Currency } from "@/lib/currencyRates";

const read = () => readPersonalStack().decisions;
const getServerDecisions = () => getServerPersonalStack().decisions;

export const pairKey = (a: string, b: string) => [a, b].sort().join("|");

type Source = "stack" | "compare" | "sheet";

export function useStackDecisions(t: (fr: string, en: string) => string, formatSaving: (amount: number) => string, currency: Currency) {
  const decisions = useSyncExternalStore(
    subscribePersonalStack,
    read,
    getServerDecisions,
  );

  const forget = (key: string) => {
    updatePersonalStack(current => {
      const { [key]: _, ...rest } = current.decisions;
      return { ...current, decisions: rest };
    });
  };

  /** Removes `removed` (and adds `kept` when replacing), records the decision, offers undo. */
  function decide(kind: StackDecision["kind"], kept: { slug: string; name: string }, removed: { slug: string; name: string } | null, saving: number, source: Source, note?: string) {
    const scope = getPersonalStackScope();
    const epoch = getPersonalStackScopeEpoch(scope);
    const keyBoth = pairKey(kept.slug, removed?.slug || "");
    trackEvent("stack_decision", { kind, source, kept: kept.slug, removed: removed?.slug, saving: Math.round(saving) });
    if (kind === "keep-both" || !removed) {
      updatePersonalStack(current => ({ ...current, decisions: { ...current.decisions, [keyBoth]: { kind: "keep-both", kept: kept.slug, saving: 0, savingCurrency: currency, at: new Date().toISOString() } } }));
      toast(note || t("Noté : vous gardez les deux.", "Noted: you keep both."), {
        duration: 5000,
        action: { label: t("Annuler", "Undo"), onClick: () => { if (getPersonalStackScope() !== scope || getPersonalStackScopeEpoch(scope) !== epoch) return; forget(keyBoth); trackEvent("stack_decision_undo", { kind, source }); } },
      });
      return;
    }
    const state = readPersonalStack().selection;
    const index = state.toolEntries.findIndex((entry) => entry.toolSlug === removed.slug);
    const entry = state.toolEntries[index];
    if (kind === "replace") trackEvent("add_to_stack", { tool_slug: kept.slug });
    updatePersonalStack(current => ({
      ...current,
      selection: unpinToolInState(kind === "replace" ? pinToolInState(current.selection, kept.slug) : current.selection, removed.slug),
      decisions: { ...current.decisions, [keyBoth]: { kind, kept: kept.slug, removed: removed.slug, saving, savingCurrency: currency, at: new Date().toISOString() } },
    }));
    const message = kind === "replace"
      ? t(`${removed.name} remplacé par ${kept.name}.`, `${removed.name} replaced with ${kept.name}.`)
      : t(`${removed.name} retiré, vous gardez ${kept.name}.`, `${removed.name} removed, you keep ${kept.name}.`);
    toast(message, {
      description: saving > 0 ? t(`${formatSaving(saving)} en moins dans votre budget estimé. Abonnement à résilier séparément.`, `${formatSaving(saving)} less in your estimated budget. Cancel the subscription separately.`) : undefined,
      duration: 7000,
      action: {
        label: t("Annuler", "Undo"),
        onClick: () => {
          // Toasts can outlive the page and the signed-in account.
          if (getPersonalStackScope() !== scope || getPersonalStackScopeEpoch(scope) !== epoch) return;
          updatePersonalStack(current => {
            let selection = current.selection;
            if (entry && !selection.toolEntries.some(item => item.toolSlug === entry.toolSlug)) {
              const toolEntries = [...selection.toolEntries];
              toolEntries.splice(Math.min(index, toolEntries.length), 0, entry);
              selection = { ...selection, toolEntries, pinnedToolSlugs: toolEntries.map(item => item.toolSlug) };
            }
            if (kind === "replace") selection = unpinToolInState(selection, kept.slug);
            const { [keyBoth]: _, ...rest } = current.decisions;
            return { ...current, selection, decisions: rest };
          });
          trackEvent("stack_decision_undo", { kind, source });
        },
      },
    });
  }

  /** Clears a "keep both" so the pair is reviewed again. */
  function reopen(a: string, b: string) {
    forget(pairKey(a, b));
  }

  return { decisions, decide, reopen };
}
