import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "tooltrim:theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

/**
 * Shared ToolTrim theme preference.
 *
 * The first render stays light so SSR and hydration keep the same markup.
 * Once mounted, the explicit preference wins, then the operating-system
 * preference is used as the initial fallback.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    let storedTheme: string | null = null;
    try { storedTheme = localStorage.getItem(THEME_STORAGE_KEY); } catch { /* Use system preference. */ }
    const initialTheme: Theme = storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    try { localStorage.setItem(THEME_STORAGE_KEY, nextTheme); } catch { /* Session preference remains usable. */ }
    applyTheme(nextTheme);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_STORAGE_KEY, nextTheme); } catch { /* Session preference remains usable. */ }
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  return { theme, setTheme, toggle };
}
