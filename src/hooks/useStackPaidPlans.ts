import { useSyncExternalStore } from "react";
import type { Currency } from "@/lib/currencyRates";

/**
 * Outils freemium que la personne déclare payer, dans Ma stack. Par défaut un
 * outil freemium compte comme utilisé gratuitement (0) : c'est elle qui coche
 * « je paie la version payante ». Stockage local séparé de la sélection
 * (tooltrim-ma-stack-mvp-v3) pour ne pas toucher à son schéma ni à ses
 * migrations. Accès protégés : un navigateur qui bloque le stockage garde la
 * déclaration pour la session.
 *
 * `reviewed` retient les freemium sur lesquels la personne a déjà répondu :
 * la question ne se pose qu'une fois par outil, et revient seulement pour un
 * freemium ajouté depuis.
 *
 * `choices` retient le coût réel déclaré pour un outil (point 1 du recul
 * produit, 8 oct. 2026) : un plan du catalogue avec son nombre de places, ou
 * le montant que la personne paie vraiment. Il prime sur l'offre d'entrée.
 */

export type PlanChoice = {
  source: "plan" | "custom";
  /** Plan name when chosen from the catalogue. */
  label?: string;
  amount: number;
  currency: Currency;
  period: "monthly" | "annual";
  /** Number of seats when the plan is priced per user. */
  seats?: number;
  perSeat?: boolean;
};

function createStore(key: string) {
  const listeners = new Set<() => void>();
  let memory: string[] | null = null;
  const read = (): string[] => {
    if (memory) return memory;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      memory = Array.isArray(parsed) ? parsed.filter((slug) => typeof slug === "string") : [];
    } catch {
      memory = [];
    }
    return memory;
  };
  const write = (next: string[]) => {
    memory = next;
    try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* session only */ }
    listeners.forEach((listener) => listener());
  };
  const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
  return { read, write, subscribe };
}

const CHOICES_KEY = "tooltrim-ma-stack-plan-choices-v1";
const choiceListeners = new Set<() => void>();
let choiceMemory: Record<string, PlanChoice> | null = null;
const NO_CHOICES: Record<string, PlanChoice> = {};
function readChoices(): Record<string, PlanChoice> {
  if (choiceMemory) return choiceMemory;
  try {
    const parsed = typeof window === "undefined" ? {} : JSON.parse(window.localStorage.getItem(CHOICES_KEY) || "{}");
    choiceMemory = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    choiceMemory = {};
  }
  return choiceMemory as Record<string, PlanChoice>;
}
function writeChoices(next: Record<string, PlanChoice>) {
  choiceMemory = next;
  try { window.localStorage.setItem(CHOICES_KEY, JSON.stringify(next)); } catch { /* session only */ }
  choiceListeners.forEach((listener) => listener());
}
/** Read by the cost calculation (stackCost), which has no React context. */
export function getPlanChoice(slug: string): PlanChoice | undefined {
  if (typeof window === "undefined") return undefined;
  return readChoices()[slug];
}

const paidStore = createStore("tooltrim-ma-stack-paid-plans-v1");
const reviewedStore = createStore("tooltrim-ma-stack-freemium-reviewed-v1");
const EMPTY: string[] = [];

function useStore(store: ReturnType<typeof createStore>) {
  return useSyncExternalStore(store.subscribe, () => (typeof window === "undefined" ? EMPTY : store.read()), () => EMPTY);
}

export function useStackPaidPlans() {
  const paid = useStore(paidStore);
  const reviewed = useStore(reviewedStore);
  const choices = useSyncExternalStore(
    (listener) => { choiceListeners.add(listener); return () => { choiceListeners.delete(listener); }; },
    () => (typeof window === "undefined" ? NO_CHOICES : readChoices()),
    () => NO_CHOICES,
  );
  const isPaid = (slug: string) => paid.includes(slug);
  const setPaid = (slug: string, value: boolean) => {
    const current = paidStore.read();
    if (value === current.includes(slug)) return;
    paidStore.write(value ? [...current, slug] : current.filter((item) => item !== slug));
  };
  const isReviewed = (slug: string) => reviewed.includes(slug);
  const markReviewed = (slugs: string[]) => {
    const current = reviewedStore.read();
    const next = [...new Set([...current, ...slugs])];
    if (next.length !== current.length) reviewedStore.write(next);
  };
  const choiceFor = (slug: string): PlanChoice | undefined => choices[slug];
  const setChoice = (slug: string, choice: PlanChoice | null) => {
    const { [slug]: _, ...rest } = readChoices();
    writeChoices(choice ? { ...rest, [slug]: choice } : rest);
  };
  return { paid, isPaid, setPaid, isReviewed, markReviewed, choices, choiceFor, setChoice };
}
