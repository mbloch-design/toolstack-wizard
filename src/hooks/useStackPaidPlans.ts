import { useSyncExternalStore } from "react";
import type { PlanChoice } from "@/lib/stackPlanChoice";
import { readPersonalStack, updatePersonalStack, subscribePersonalStack, getServerPersonalStack } from "@/lib/personalStackStore";
export type { PlanChoice } from "@/lib/stackPlanChoice";

/** Paid declarations, reviewed freemium tools and actual costs share the personal scope. */
const getBilling = () => readPersonalStack().billing;
const getServerBilling = () => getServerPersonalStack().billing;
/** Read by cost calculations outside React; always follows the global account scope. */
export function getPlanChoice(slug: string): PlanChoice | undefined {
  if (typeof window === "undefined") return undefined;
  return readPersonalStack().billing.choices[slug];
}

export function useStackPaidPlans() {
  const { paid, reviewed, choices } = useSyncExternalStore(subscribePersonalStack, getBilling, getServerBilling);
  const isPaid = (slug: string) => paid.includes(slug);
  const setPaid = (slug: string, value: boolean) => {
    updatePersonalStack(current => {
      const paid = current.billing.paid;
      if (value === paid.includes(slug)) return current;
      return { ...current, billing: { ...current.billing, paid: value ? [...paid, slug] : paid.filter(item => item !== slug) } };
    });
  };
  const isReviewed = (slug: string) => reviewed.includes(slug);
  const markReviewed = (slugs: string[]) => {
    updatePersonalStack(current => {
      const reviewed = [...new Set([...current.billing.reviewed, ...slugs])];
      return reviewed.length === current.billing.reviewed.length ? current : { ...current, billing: { ...current.billing, reviewed } };
    });
  };
  const choiceFor = (slug: string): PlanChoice | undefined => choices[slug];
  const setChoice = (slug: string, choice: PlanChoice | null) => {
    updatePersonalStack(current => {
      const { [slug]: _, ...rest } = current.billing.choices;
      return { ...current, billing: { ...current.billing, choices: choice ? { ...rest, [slug]: choice } : rest } };
    });
  };
  return { paid, isPaid, setPaid, isReviewed, markReviewed, choices, choiceFor, setChoice };
}
