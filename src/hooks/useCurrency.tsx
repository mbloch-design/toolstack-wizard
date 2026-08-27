import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Currency = "EUR" | "USD" | "GBP";

const STORAGE_KEY = "tooltrim:currency";

// ECB reference rates published on 2026-08-27. These are deliberately dated,
// editorial conversion rate: ToolTrim prices inform comparison, not checkout.
export const EUR_TO_USD = 1.1645;
export const EUR_TO_GBP = 0.8574;
export const CURRENCY_RATE_DATE = "2026-08-27";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "EUR",
  setCurrency: () => undefined,
  toggleCurrency: () => undefined,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Keep EUR as the deterministic SSR value. The saved preference is restored
  // after hydration, preventing a server/client markup mismatch.
  const [currency, setCurrencyState] = useState<Currency>("EUR");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "EUR" || saved === "USD" || saved === "GBP") {
      setCurrencyState(saved);
      return;
    }

    const pathLanguage = window.location.pathname.split("/")[1];
    setCurrencyState(pathLanguage === "en" ? "USD" : "EUR");
  }, []);

  const setCurrency = (next: Currency) => {
    setCurrencyState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.dataset.currency = next;
  };

  useEffect(() => {
    document.documentElement.dataset.currency = currency;
  }, [currency]);

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    setCurrency,
    toggleCurrency: () => setCurrency(
      currency === "EUR" ? "USD" : currency === "USD" ? "GBP" : "EUR",
    ),
  }), [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
