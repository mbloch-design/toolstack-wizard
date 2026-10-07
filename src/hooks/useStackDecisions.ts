import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useStackPins } from "@/hooks/useStackPins";
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
import { normalizeStackDecisions } from "@/lib/stackDecisions";
import type { Currency } from "@/lib/currencyRates";

const KEY = "tooltrim-ma-stack-decisions-v1";
const listeners = new Set<() => void>();
let memory: Record<string, StackDecision> | null = null;
let persistedRaw: string | null | undefined;
const EMPTY: Record<string, StackDecision> = {};

function read(): Record<string, StackDecision> {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (memory && raw === persistedRaw) return memory;
    let parsed: unknown;
    try { parsed = JSON.parse(raw || "{}"); } catch { parsed = {}; }
    memory = normalizeStackDecisions(parsed);
    persistedRaw = raw;
  } catch {
    memory ??= {};
  }
  return memory as Record<string, StackDecision>;
}
function write(next: Record<string, StackDecision>) {
  memory = next;
  try {
    const raw = JSON.stringify(next);
    window.localStorage.setItem(KEY, raw);
    persistedRaw = raw;
  } catch { /* session only */ }
  listeners.forEach((listener) => listener());
}

function handleStorage(event: StorageEvent) {
  if (event.key !== KEY && event.key !== null) return;
  try { if (event.storageArea && event.storageArea !== window.localStorage) return; } catch { return; }
  read();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0 && typeof window !== "undefined") window.addEventListener("storage", handleStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
  };
}

export const pairKey = (a: string, b: string) => [a, b].sort().join("|");

type Source = "stack" | "compare" | "sheet";

export function useStackDecisions(t: (fr: string, en: string) => string, formatSaving: (amount: number) => string, currency: Currency) {
  const decisions = useSyncExternalStore(
    subscribe,
    () => (typeof window === "undefined" ? EMPTY : read()),
    () => EMPTY,
  );
  const { state, pinTool, unpinTool, restoreTool } = useStackPins();

  const forget = (key: string) => {
    const { [key]: _, ...rest } = read();
    write(rest);
  };

  /** Removes `removed` (and adds `kept` when replacing), records the decision, offers undo. */
  function decide(kind: StackDecision["kind"], kept: { slug: string; name: string }, removed: { slug: string; name: string } | null, saving: number, source: Source, note?: string) {
    const keyBoth = pairKey(kept.slug, removed?.slug || "");
    trackEvent("stack_decision", { kind, source, kept: kept.slug, removed: removed?.slug, saving: Math.round(saving) });
    if (kind === "keep-both" || !removed) {
      write({ ...read(), [keyBoth]: { kind: "keep-both", kept: kept.slug, saving: 0, savingCurrency: currency, at: new Date().toISOString() } });
      toast(note || t("Noté : vous gardez les deux.", "Noted: you keep both."), {
        duration: 5000,
        action: { label: t("Annuler", "Undo"), onClick: () => { forget(keyBoth); trackEvent("stack_decision_undo", { kind, source }); } },
      });
      return;
    }
    const index = state.toolEntries.findIndex((entry) => entry.toolSlug === removed.slug);
    const entry = state.toolEntries[index];
    if (kind === "replace") pinTool(kept.slug);
    unpinTool(removed.slug);
    write({ ...read(), [keyBoth]: { kind, kept: kept.slug, removed: removed.slug, saving, savingCurrency: currency, at: new Date().toISOString() } });
    const message = kind === "replace"
      ? t(`${removed.name} remplacé par ${kept.name}.`, `${removed.name} replaced with ${kept.name}.`)
      : t(`${removed.name} retiré, vous gardez ${kept.name}.`, `${removed.name} removed, you keep ${kept.name}.`);
    toast(message, {
      description: saving > 0 ? t(`${formatSaving(saving)} en moins dans votre budget.`, `${formatSaving(saving)} less in your budget.`) : undefined,
      duration: 7000,
      action: {
        label: t("Annuler", "Undo"),
        onClick: () => {
          if (entry) restoreTool(entry, index);
          if (kind === "replace") unpinTool(kept.slug);
          forget(keyBoth);
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
