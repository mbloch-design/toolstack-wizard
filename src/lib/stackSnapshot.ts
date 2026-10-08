import type { Currency } from "@/lib/currencyRates";

/**
 * Ma stack's last figures, written by the page itself and read by the footer:
 * a visitor who has a stack sees it again at the end of every page, without
 * the footer loading the catalogue. Local only, like the stack.
 */
export interface StackSnapshot {
  tools: number; monthly: number; double: number; currency: Currency; at: string;
  /** The costliest tools, for the card's logos (slug and name only). */
  top?: { slug: string; name: string }[];
}

const KEY = "tooltrim-ma-stack-snapshot-v1";

export function readStackSnapshot(): StackSnapshot | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) || "null");
    return value && typeof value.tools === "number" && value.tools > 0 && typeof value.monthly === "number" ? value as StackSnapshot : null;
  } catch {
    return null;
  }
}

export function writeStackSnapshot(snapshot: StackSnapshot | null) {
  try {
    if (snapshot) window.localStorage.setItem(KEY, JSON.stringify(snapshot));
    else window.localStorage.removeItem(KEY);
  } catch { /* the footer simply shows the default invitation */ }
}
