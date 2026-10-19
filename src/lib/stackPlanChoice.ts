import type { Currency } from "./currencyRates";

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
