import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CURRENCY_RATE_DATE, EUR_TO_GBP, EUR_TO_USD, currencyForLang, isCurrency, type Currency } from "@/lib/currencyRates";

// Les taux et le type vivent dans @/lib/currencyRates, un module sans React que
// le prérendu peut importer. Réexportés ici pour ne pas casser les imports
// existants et garder un taux unique entre le build et l'application.
export type { Currency };
export { CURRENCY_RATE_DATE, EUR_TO_GBP, EUR_TO_USD };

const STORAGE_KEY = "tooltrim:currency";

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

export function CurrencyProvider({ children, lang }: { children: ReactNode; lang?: string }) {
  // The initial value is derived from the route language, not hardcoded to EUR.
  // It stays deterministic across SSR and hydration because both compute it
  // from the same URL, so there is no server/client markup mismatch.
  //
  // Hardcoding EUR here meant every prerendered /en/ page shipped euro prices:
  // the switch to USD only happened in the effect below, after hydration, so
  // crawlers (which don't run it) only ever saw euros on the English site.
  const [currency, setCurrencyState] = useState<Currency>(currencyForLang(lang ?? "fr"));

  useEffect(() => {
    // An explicit user choice always wins over the language default.
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isCurrency(saved)) setCurrencyState(saved);
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
