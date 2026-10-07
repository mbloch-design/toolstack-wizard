import { useSyncExternalStore } from "react";

/**
 * Outils freemium que la personne déclare payer, dans Ma stack. Par défaut un
 * outil freemium compte comme utilisé gratuitement (0) : c'est elle qui coche
 * « je paie la version payante ». Stockage local séparé de la sélection
 * (tooltrim-ma-stack-mvp-v3) pour ne pas toucher à son schéma ni à ses
 * migrations. Accès protégés : un navigateur qui bloque le stockage garde la
 * déclaration pour la session.
 */

const KEY = "tooltrim-ma-stack-paid-plans-v1";
const listeners = new Set<() => void>();
let memory: string[] | null = null;

function read(): string[] {
  if (memory) return memory;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    memory = Array.isArray(parsed) ? parsed.filter((slug) => typeof slug === "string") : [];
  } catch {
    memory = [];
  }
  return memory;
}

function write(next: string[]) {
  memory = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* session only */ }
  listeners.forEach((listener) => listener());
}

const EMPTY: string[] = [];

export function useStackPaidPlans() {
  const paid = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => (typeof window === "undefined" ? EMPTY : read()),
    () => EMPTY,
  );
  const isPaid = (slug: string) => paid.includes(slug);
  const setPaid = (slug: string, value: boolean) => {
    const current = read();
    if (value === current.includes(slug)) return;
    write(value ? [...current, slug] : current.filter((item) => item !== slug));
  };
  return { paid, isPaid, setPaid };
}
