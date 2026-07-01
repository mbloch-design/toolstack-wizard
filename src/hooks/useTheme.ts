import { useEffect } from "react";

/**
 * Dark mode is disabled site-wide — always resolves to "light" and never
 * writes a "dark" class to <html>, regardless of stored preference or
 * system color-scheme. toggle/setTheme are kept as no-ops so callers
 * (Navbar's theme switch, if still wired) don't need special-casing.
 */
export function useTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    localStorage.removeItem("theme");
  }, []);

  return { theme: "light" as const, setTheme: () => {}, toggle: () => {} };
}
