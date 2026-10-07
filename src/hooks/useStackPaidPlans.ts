import { useSyncExternalStore } from "react";

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
 */

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

const paidStore = createStore("tooltrim-ma-stack-paid-plans-v1");
const reviewedStore = createStore("tooltrim-ma-stack-freemium-reviewed-v1");
const EMPTY: string[] = [];

function useStore(store: ReturnType<typeof createStore>) {
  return useSyncExternalStore(store.subscribe, () => (typeof window === "undefined" ? EMPTY : store.read()), () => EMPTY);
}

export function useStackPaidPlans() {
  const paid = useStore(paidStore);
  const reviewed = useStore(reviewedStore);
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
  return { paid, isPaid, setPaid, isReviewed, markReviewed };
}
