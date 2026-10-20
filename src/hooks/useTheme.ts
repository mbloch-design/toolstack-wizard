import { useSyncExternalStore } from 'react';
export type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'tooltrim:theme';
let theme: Theme = 'light';
const listeners = new Set<() => void>();
function applyTheme(next: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', next === 'dark'); root.classList.toggle('light', next === 'light'); root.style.colorScheme = next;
}
function publish(next: Theme) { theme = next; applyTheme(next); listeners.forEach(listener => listener()); }
function initialTheme(): Theme {
  let stored: string | null = null;
  try { stored = window.localStorage.getItem(THEME_STORAGE_KEY); } catch { /* Use system preference. */ }
  return stored === 'dark' || stored === 'light' ? stored : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function onStorage(event: StorageEvent) { if (event.key === THEME_STORAGE_KEY) publish(event.newValue === 'dark' ? 'dark' : 'light'); }
function subscribe(listener: () => void) {
  if (listeners.size === 0) publish(initialTheme());
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);
  return () => { listeners.delete(listener); if (listeners.size === 0) window.removeEventListener('storage', onStorage); };
}
function setTheme(next: Theme) {
  try { window.localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* In-memory preference stays usable. */ }
  publish(next);
}
function toggle() { setTheme(theme === 'dark' ? 'light' : 'dark'); }
/** One store for every shell/settings consumer; deterministic light server snapshot. */
export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => theme, () => 'light' as Theme);
  return { theme: current, setTheme, toggle };
}
