import { useSyncExternalStore } from "react";
import type { PlanChoice } from "@/lib/stackPlanChoice";
import { readPersonalStack, updatePersonalStack, subscribePersonalStack, getServerPersonalStack, getPersonalStackScope, getPersonalStackScopeEpoch } from "@/lib/personalStackStore";
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
  /** Publish a complete billing answer and return a bounded, single-use undo. */
  const choosePlan = (slug: string, choice: PlanChoice | null, markAsReviewed = true): (() => void) => {
    const scope = getPersonalStackScope();
    const epoch = getPersonalStackScopeEpoch(scope);
    const before = readPersonalStack().billing;
    const previousChoice = before.choices[slug];
    const previousPaid = before.paid.includes(slug);
    const previousReviewed = before.reviewed.includes(slug);
    const nextChoice = choice ? { ...choice } : undefined;
    const nextPaid = !!nextChoice && nextChoice.amount > 0;
    const nextReviewed = markAsReviewed || previousReviewed;
    const withMembership = (items: string[], included: boolean) =>
      included ? (items.includes(slug) ? items : [...items, slug]) : items.filter(item => item !== slug);
    updatePersonalStack(current => {
      const { [slug]: _, ...rest } = current.billing.choices;
      return { ...current, billing: {
        ...current.billing,
        paid: withMembership(current.billing.paid, nextPaid),
        reviewed: withMembership(current.billing.reviewed, nextReviewed),
        choices: nextChoice ? { ...rest, [slug]: nextChoice } : rest,
      } };
    });
    const appliedChoice = JSON.stringify(readPersonalStack().billing.choices[slug]);
    let used = false;
    return () => {
      if (used) return;
      used = true;
      if (getPersonalStackScope() !== scope || getPersonalStackScopeEpoch(scope) !== epoch) return;
      updatePersonalStack(current => {
        const billing = current.billing;
        // An older toast must not overwrite a subsequent edit to this tool.
        if (billing.paid.includes(slug) !== nextPaid || billing.reviewed.includes(slug) !== nextReviewed
          || JSON.stringify(billing.choices[slug]) !== appliedChoice) return current;
        const { [slug]: _, ...rest } = billing.choices;
        return { ...current, billing: {
          ...billing,
          paid: withMembership(billing.paid, previousPaid),
          reviewed: withMembership(billing.reviewed, previousReviewed),
          choices: previousChoice ? { ...rest, [slug]: previousChoice } : rest,
        } };
      });
    };
  };
  return { paid, isPaid, setPaid, isReviewed, markReviewed, choices, choiceFor, setChoice, choosePlan };
}
