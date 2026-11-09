import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useOfferOperations } from "./CatalogPriceEditor";
import { catalogCapabilities } from "@/lib/catalogPolicy";
import { validateCatalogDraft, validateCatalogPublication } from "@/lib/backofficeCatalog";
const row = { planKey: "pro", displayName: "Français", priceObservationId: "obs", nativeAmount: 10, nativeCurrency: "EUR", billingPeriod: "monthly", priceStatus: "paid", isFree: false, isComparePlan: false, detailsSourceUrl: "https://example.com", observedOn: "2026-10-30", taxInclusion: "included" };
const initial: any = { id: "a", slug: "a", name: "A", pricing_v5: { plans: [row] }, pricing_v5En: { plans: [{ ...row, displayName: "English" }] } };
function setup() {
 let value = structuredClone(initial);
 const context: any = { lang: "fr", value, base: initial, capabilities: catalogCapabilities({ isAdmin: true }), onChanges(changes: any[]) { for (const c of changes) { let target: any = value; for (const key of c.path.slice(0,-1)) target = target[key]; if (c.remove) delete target[c.path.at(-1)]; else target[c.path.at(-1)] = c.value; } } };
 const hook = renderHook(() => useOfferOperations(context));
 const refresh = () => { context.value = value; hook.rerender(); };
 const remove = () => { act(() => hook.result.current.remove("pricing_v5", 0, "")); refresh(); };
 return { hook, refresh, remove, get value() { return value; } };
}
it("does not throw if the offer parent is removed", () => { const h = setup(); h.remove(); delete h.value.pricing_v5; h.refresh(); expect(() => act(() => h.hook.result.current.undo(h.hook.result.current.removed[0]))).not.toThrow(); });
it("restores current linked facts including absent properties while retaining localized text", () => { const h = setup(); h.remove(); h.value.pricing_v5En.plans[0].nativeAmount = 30; delete h.value.pricing_v5En.plans[0].taxInclusion; h.refresh(); act(() => h.hook.result.current.undo(h.hook.result.current.removed[0])); expect(h.value.pricing_v5.plans[0]).toMatchObject({ displayName: "Français", nativeAmount: 30 }); expect(h.value.pricing_v5.plans[0]).not.toHaveProperty("taxInclusion"); expect(validateCatalogDraft(initial, h.value)).toBeTruthy(); });
it("does not restore an old reference after the linked peer changes currency", () => {
 const h = setup(); h.value.pricing_v5.plans[0].isComparePlan = true; h.value.pricing_v5En.plans[0].isComparePlan = true; h.refresh(); h.remove();
 h.value.pricing_v5En.plans[0].nativeCurrency = "USD"; h.value.pricing_v5En.plans[0].isComparePlan = true; h.refresh();
 act(() => h.hook.result.current.undo(h.hook.result.current.removed[0]));
 expect(h.value.pricing_v5.plans[0]).toMatchObject({ nativeCurrency: "USD", isComparePlan: false });
 expect(h.value.pricing_v5En.plans[0].isComparePlan).toBe(true);
});

it("restores a linked quote without reselecting it as a numeric reference", () => {
  const h = setup();
  h.value.pricing_v5.plans[0].isComparePlan = true;
  h.refresh();
  h.remove();
  Object.assign(h.value.pricing_v5En.plans[0], {
    priceStatus: "quote",
    nativeAmount: null,
  });
  h.refresh();

  act(() => h.hook.result.current.undo(h.hook.result.current.removed[0]));

  expect(h.value.pricing_v5.plans[0]).toMatchObject({
    displayName: "Français",
    priceStatus: "quote",
    nativeAmount: null,
    isComparePlan: false,
  });
  expect(() => validateCatalogPublication(initial, h.value)).not.toThrow();
});
