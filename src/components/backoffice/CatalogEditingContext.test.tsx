import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { catalogCapabilities } from "@/lib/catalogPolicy";
import ToolPricingSection from "@/components/tool/ToolPricingSection";
import { mapToolFromJson } from "@/lib/toolFromJson";
import { CATALOG_FIELD_REGISTRY } from "@/lib/catalogFieldRegistry";
import type { CatalogTool } from "@/lib/backofficeCatalog";
import type { CatalogEditingPresentation } from "@/lib/catalogEditingPresentation";
const modules = import.meta.glob("./CatalogEditingContext.tsx");
async function loadEditor() {
  expect(
    modules["./CatalogEditingContext.tsx"],
    "complete typed authoring controls must exist",
  ).toBeTypeOf("function");
  return (await modules["./CatalogEditingContext.tsx"]()) as any;
}
afterEach(cleanup);
const base: CatalogTool = {
  id: "sample",
  slug: "sample",
  name: "Sample",
  pros: ["One", "Two"],
  research: { retained: true },
  customUnknown: { keep: true },
  pricing_v5: {
    plans: [
      {
        planKey: "pro",
        displayName: "Pro",
        nativeAmount: 10,
        nativeCurrency: "EUR",
        billingPeriod: "monthly",
        isComparePlan: true,
        isFree: false,
        detailsSourceUrl: "https://example.com/pricing",
        observedOn: "2026-10-30",
      },
    ],
  },
};
const caps = catalogCapabilities({ isAdmin: true });
function Harness({
  Editor,
  grants = caps,
  value: initial = base,
  roots = [
    "name",
    "pros",
    "toolTrimRating",
    "seo",
    "category",
    "migrationGuide",
  ],
  onValue = () => {},
  lang = "fr",
  offers = false,
  issues = [],
}: any) {
  const [value, setValue] = useState(initial);
  const change = (path: (string | number)[], next: unknown, remove = false) =>
    setValue((old: CatalogTool) => {
      const updated = structuredClone(old);
      let parent: any = updated;
      path.slice(0, -1).forEach((key, i) => {
        parent[key] ??= typeof path[i + 1] === "number" ? [] : {};
        parent = parent[key];
      });
      if (remove) delete parent[path[path.length - 1]];
      else parent[path[path.length - 1]] = next;
      onValue(updated);
      return updated;
    });
  return (
    <Editor.CatalogEditorPresentation
      context={{
        lang,
        value,
        base: initial,
        published: initial,
        capabilities: grants,
        issues,
        onChange: change,
        onRemove: (p: any) => change(p, undefined, true),
        categories: [{ id: "design", name: "Design", slug: "design" }],
        tools: [],
      }}
    >
      {(editing: CatalogEditingPresentation) => (
        <div>
          {offers ? (
            <ToolPricingSection
              tool={mapToolFromJson(value)}
              displayPrice={0}
              lang={lang}
              t={(fr, en) => (lang === "en" ? en : fr)}
              editing={editing}
            />
          ) : (
            <>
              {editing.block(roots, "Édition")}
              {editing.planCollection("pricing_v5")}
            </>
          )}
        </div>
      )}
    </Editor.CatalogEditorPresentation>
  );
}
it("edits every registry root through typed controls, preserving protected and unknown values on open", async () => {
  const Editor = await loadEditor();
  const changes = vi.fn();
  const { container } = render(
    <Harness
      Editor={Editor}
      roots={CATALOG_FIELD_REGISTRY.filter(
        (f) => !f.path.includes(".") && f.editable,
      ).map((f) => f.path)}
      onValue={changes}
    />,
  );
  expect(changes).not.toHaveBeenCalled();
  expect(container.querySelector("textarea[data-raw-json]")).toBeNull();
  for (const entry of CATALOG_FIELD_REGISTRY.filter(
    (f) => !f.path.includes(".") && f.editable,
  ))
    expect(
      container.querySelector(`[data-catalog-path="${entry.path}"]`),
      entry.path,
    ).toBeTruthy();
  expect(screen.getByLabelText("Nom")).toHaveValue("Sample");
  fireEvent.change(screen.getByLabelText("Nom"), {
    target: { value: "<b>Plain text</b>" },
  });
  expect(changes.mock.lastCall?.[0].customUnknown).toEqual({ keep: true });
  expect(changes.mock.lastCall?.[0].research).toEqual({ retained: true });
});
it("denies all mutations for readonly capabilities, including add and collection operations", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  render(
    <Harness
      Editor={Editor}
      grants={catalogCapabilities(null)}
      onValue={changed}
    />,
  );
  expect(screen.getByLabelText("Nom")).toBeDisabled();
  for (const button of screen.queryAllByRole("button"))
    expect(button).toBeDisabled();
  expect(changed).not.toHaveBeenCalled();
});
it("adds missing object and enum values explicitly without copying fallbacks or silently choosing an option", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  render(<Harness Editor={Editor} onValue={changed} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Ajouter Notation ToolTrim" }),
  );
  expect(changed.mock.lastCall?.[0].toolTrimRating).toEqual({});
  expect(screen.getByLabelText("Puissance")).toHaveValue(null);
  fireEvent.change(screen.getByLabelText("Puissance"), {
    target: { value: "4" },
  });
  expect(changed.mock.lastCall?.[0].toolTrimRating.puissance).toBe(4);
  expect(screen.getByLabelText("Catégorie")).toHaveValue("");
});
it("reorders list items without remounting their focused controls and supports removal undo", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  const { container } = render(
    <Harness Editor={Editor} roots={["pros"]} onValue={changed} />,
  );
  const inputs = screen.getAllByLabelText("Élément");
  const second = inputs[1];
  second.focus();
  fireEvent.click(screen.getAllByRole("button", { name: "Monter" })[1]);
  expect(screen.getAllByLabelText("Élément")[0]).toBe(second);
  expect(changed.mock.lastCall?.[0].pros).toEqual(["Two", "One"]);
  fireEvent.click(
    screen.getAllByRole("button", { name: "Retirer cet élément" })[0],
  );
  fireEvent.click(screen.getByRole("button", { name: "Annuler le retrait" }));
  expect(changed.mock.lastCall?.[0].pros).toEqual(["Two", "One"]);
  expect(container.querySelector("[contenteditable]")).toBeNull();
});
it("keeps IME composition local until completed and persists literal plain text", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  render(<Harness Editor={Editor} roots={["name"]} onValue={changed} />);
  const name = screen.getByLabelText("Nom");
  fireEvent.compositionStart(name);
  fireEvent.change(name, { target: { value: "日本" } });
  expect(changed).not.toHaveBeenCalled();
  fireEvent.compositionEnd(name, { data: "日本" });
  expect(changed.mock.lastCall?.[0].name).toBe("日本");
});
it("edits known shared price facts with the shared helper, requires explicit intent, and preserves local text", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  const plan = (base.pricing_v5 as any).plans[0];
  const initial = {
    ...base,
    pricing_v5En: { plans: [{ ...plan, displayName: "English Pro" }] },
  };
  render(
    <Harness
      Editor={Editor}
      value={initial}
      roots={["pricing_v5"]}
      onValue={changed}
    />,
  );
  fireEvent.change(screen.getByLabelText("Montant"), {
    target: { value: "24" },
  });
  expect(changed.mock.lastCall?.[0].pricing_v5.plans[0].priceStatus).toBe(
    "paid",
  );
  expect(changed.mock.lastCall?.[0].pricing_v5En.plans[0].nativeAmount).toBe(
    24,
  );
  expect(changed.mock.lastCall?.[0].pricing_v5En.plans[0].displayName).toBe(
    "English Pro",
  );
});

it("keeps a structured historical union until explicit format replacement", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  render(
    <Harness
      Editor={Editor}
      value={{
        ...base,
        migrationGuide: {
          steps: ["Export first"],
          timeEstimate: "2h",
          dataLoss: "None",
        },
      }}
      roots={["migrationGuide"]}
      onValue={changed}
    />,
  );
  fireEvent.change(screen.getByLabelText("Migration · format"), {
    target: { value: "0" },
  });
  expect(changed).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Durée estimée")).toHaveValue("2h");
  fireEvent.click(screen.getByRole("button", { name: "Utiliser ce format" }));
  expect(changed.mock.lastCall?.[0].migrationGuide).toBe("");
});
it("blocks inherited non-granted object creation and reports precise field issues", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  const grants = { ...caps, editablePaths: ["toolTrimRating.puissance"] };
  render(
    <Harness
      Editor={Editor}
      grants={grants}
      roots={["toolTrimRating"]}
      onValue={changed}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Ajouter Notation ToolTrim" }),
  ).toBeDisabled();
  expect(changed).not.toHaveBeenCalled();
});
it("retains every editable registry leaf in typed structured editors and uses human labels", async () => {
  const Editor = await loadEditor();
  const { catalogSchema } = await import("@/lib/catalogFieldRegistry");
  function filled(schema: any): any {
    if (schema.kind === "object")
      return Object.fromEntries(
        Object.entries(schema.children).map(([key, child]) => [
          key,
          filled(child),
        ]),
      );
    if (schema.kind === "array") return [filled(schema.item)];
    if (schema.kind === "union")
      return filled(
        schema.variants.find((v: any) => v.kind === "object") ??
          schema.variants.find((v: any) => v.kind === "array") ??
          schema.variants[0],
      );
    return schema.kind === "number"
      ? 3
      : schema.kind === "boolean"
        ? false
        : schema.kind === "enum"
          ? schema.options[0]
          : "";
  }
  const initial = {
    ...base,
    ...Object.fromEntries(
      Object.entries(catalogSchema).map(([root, schema]) => [
        root,
        filled(schema),
      ]),
    ),
  };
  const { container } = render(
    <Harness
      Editor={Editor}
      value={initial}
      roots={Object.keys(catalogSchema)}
    />,
  );
  for (const field of CATALOG_FIELD_REGISTRY.filter((f) => f.editable)) {
    const actual = field.path.replaceAll("*", "0");
    expect(
      container.querySelector(`[data-catalog-path="${actual}"]`),
      field.path,
    ).toBeTruthy();
  }
  expect(
    screen.queryAllByText("Information éditoriale", { exact: true }),
  ).toHaveLength(0);
});

it("localizes typed field labels, add actions and settings in English", async () => {
  const Editor = await loadEditor();
  render(
    <Harness Editor={Editor} lang="en" roots={["name", "toolTrimRating"]} />,
  );
  expect(screen.getByLabelText("Name")).toHaveValue("Sample");
  expect(
    screen.getByRole("button", { name: "Add ToolTrim rating" }),
  ).toBeEnabled();
  expect(screen.getByRole("button", { name: "Add an offer" })).toBeEnabled();
});

it("adds, edits, removes and restores a new offer inside its own box without losing its identity", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  const { container } = render(
    <Harness Editor={Editor} offers onValue={changed} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ajouter une offre" }));
  const cards = container.querySelectorAll(".td-plan");
  expect(cards).toHaveLength(2);
  const name = within(cards[1] as HTMLElement).getByLabelText("Nom de l’offre");
  const key = changed.mock.lastCall?.[0].pricing_v5.plans[1].planKey;
  fireEvent.change(name, { target: { value: "New structured offer" } });
  expect(changed.mock.lastCall?.[0].pricing_v5.plans[1].planKey).toBe(key);
  fireEvent.click(
    within(cards[1] as HTMLElement).getByRole("button", {
      name: "Retirer l’offre",
    }),
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Annuler le retrait de New structured offer",
    }),
  );
  expect(changed.mock.lastCall?.[0].pricing_v5.plans[1].planKey).toBe(key);
});
it("requires a replacement when removing the reference and restores the original reference on undo", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  const pro = (base.pricing_v5 as any).plans[0];
  const initial = {
    ...base,
    pricing_v5: {
      plans: [
        pro,
        {
          ...pro,
          planKey: "basic",
          displayName: "Basic",
          nativeAmount: 5,
          isComparePlan: false,
        },
      ],
    },
  };
  const { container } = render(
    <Harness Editor={Editor} offers value={initial} onValue={changed} />,
  );
  const card = container.querySelector(".td-plan") as HTMLElement;
  expect(
    within(card).getByRole("button", { name: "Retirer l’offre" }),
  ).toBeDisabled();
  fireEvent.change(
    within(card).getByLabelText("Prix de référence après retrait"),
    { target: { value: "basic" } },
  );
  fireEvent.click(
    within(card).getByRole("button", { name: "Retirer l’offre" }),
  );
  expect(changed.mock.lastCall?.[0].pricing_v5.plans[0].isComparePlan).toBe(
    true,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Annuler le retrait de Pro" }),
  );
  const plans = changed.mock.lastCall?.[0].pricing_v5.plans;
  expect(plans.find((p: any) => p.planKey === "pro").isComparePlan).toBe(true);
  expect(plans.find((p: any) => p.planKey === "basic").isComparePlan).toBe(
    false,
  );
});
it("retains offer input nodes and focus when moving an offer", async () => {
  const Editor = await loadEditor();
  const pro = (base.pricing_v5 as any).plans[0];
  const initial = {
    ...base,
    pricing_v5: {
      plans: [
        pro,
        {
          ...pro,
          planKey: "basic",
          displayName: "Basic",
          nativeAmount: 5,
          isComparePlan: false,
        },
      ],
    },
  };
  render(<Harness Editor={Editor} offers value={initial} />);
  const input = screen.getAllByLabelText("Nom de l’offre")[1];
  input.focus();
  fireEvent.click(screen.getAllByRole("button", { name: "Monter l’offre" })[1]);
  expect(screen.getAllByLabelText("Nom de l’offre")[0]).toBe(input);
  expect(input).toHaveFocus();
});
it("undoes row removal after editing a remaining row without reverting that edit", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  render(<Harness Editor={Editor} roots={["pros"]} onValue={changed} />);
  fireEvent.click(
    screen.getAllByRole("button", { name: "Retirer cet élément" })[0],
  );
  fireEvent.change(screen.getByLabelText("Élément"), {
    target: { value: "Newer edit" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Annuler le retrait" }));
  expect(changed.mock.lastCall?.[0].pros).toEqual(["One", "Newer edit"]);
});
it("shows protected research evidence as consultable content without edit controls", async () => {
  const Editor = await loadEditor();
  render(
    <Harness
      Editor={Editor}
      value={{
        ...base,
        research: {
          sources: [
            { title: "Vendor source evidence", observedOn: "2026-10-30" },
          ],
        },
      }}
      roots={["research"]}
    />,
  );
  expect(screen.getByText("Vendor source evidence")).toBeTruthy();
  expect(screen.queryByRole("textbox")).toBeNull();
});

it("removes an optional collection as absence and restores it without undoing newer fields", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  render(
    <Harness Editor={Editor} roots={["name", "pros"]} onValue={changed} />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Retirer Points forts · français" }),
  );
  expect(changed.mock.lastCall?.[0]).not.toHaveProperty("pros");
  fireEvent.change(screen.getByLabelText("Nom"), {
    target: { value: "Later name" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Annuler le retrait de la liste" }),
  );
  expect(changed.mock.lastCall?.[0].pros).toEqual(["One", "Two"]);
  expect(changed.mock.lastCall?.[0].name).toBe("Later name");
});
it("attaches a human validation message to the precise field", async () => {
  const Editor = await loadEditor();
  render(
    <Harness
      Editor={Editor}
      roots={["pricing_v5"]}
      issues={[
        {
          path: "pricing_v5.plans.0.detailsSourceUrl",
          code: "SOURCE_REQUIRED",
          stage: "publish",
          severity: "error",
        },
      ]}
    />,
  );
  expect(screen.getByText("Ajouter une source officielle.")).toBeTruthy();
  expect(screen.getByLabelText("Source officielle de l’offre")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});
it("does not present an uncommitted linked-price edit as saved when peer capability is missing", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  const plan = (base.pricing_v5 as any).plans[0];
  render(
    <Harness
      Editor={Editor}
      value={{ ...base, pricing_v5En: { plans: [{ ...plan }] } }}
      roots={["pricing_v5"]}
      grants={{
        ...caps,
        canPublishAll: false,
        editablePaths: [
          "pricing_v5.plans.*.nativeAmount",
          "pricing_v5.plans.*.priceStatus",
        ],
      }}
      onValue={changed}
    />,
  );
  const amount = screen.getByLabelText("Montant");
  fireEvent.change(amount, { target: { value: "25" } });
  expect(changed).not.toHaveBeenCalled();
  expect(amount).toHaveValue(10);
  expect(
    screen.getByText(
      "Ce prix est lié à des champs que vous ne pouvez pas modifier.",
    ),
  ).toBeTruthy();
});
it("explains canonical price provenance and keeps legacy comparison amounts readonly while offers own the price", async () => {
  const Editor = await loadEditor();
  const { container } = render(
    <Harness
      Editor={Editor}
      value={{
        ...base,
        defaultMonthlyPrice: 999,
        pricing_v5: {
          ...(base.pricing_v5 as any),
          compare_price_monthly_eur: 999,
        },
      }}
      roots={["defaultMonthlyPrice", "pricing_v5"]}
    />,
  );
  expect(
    container.querySelector('[data-catalog-path="defaultMonthlyPrice"] input'),
  ).toBeNull();
  expect(
    container.querySelector(
      '[data-catalog-path="pricing_v5.compare_price_monthly_eur"] input',
    ),
  ).toBeNull();
  expect(
    screen.getAllByText(
      "Valeur historique conservée ; les offres canoniques déterminent le prix affiché.",
    ).length,
  ).toBeGreaterThan(0);
});

it("clears comparison flags on linked peers when shared price intent becomes nonnumeric", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  const plan = (base.pricing_v5 as any).plans[0];
  render(
    <Harness
      Editor={Editor}
      value={{ ...base, pricing_v5En: { plans: [{ ...plan }] } }}
      roots={["pricing_v5"]}
      onValue={changed}
    />,
  );
  fireEvent.change(screen.getByLabelText("Type de prix"), {
    target: { value: "quote" },
  });
  expect(changed.mock.lastCall?.[0].pricing_v5En.plans[0].priceStatus).toBe(
    "quote",
  );
  expect(changed.mock.lastCall?.[0].pricing_v5En.plans[0].isComparePlan).toBe(
    false,
  );
});

it("explains a missing localized list fallback without copying it when adding the translation", async () => {
  const Editor = await loadEditor();
  const changed = vi.fn();
  render(
    <Harness Editor={Editor} roots={["prosEn"]} lang="en" onValue={changed} />,
  );
  expect(screen.getByText(/Inherited content: One · Two/)).toBeTruthy();
  expect(changed).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Add Strengths · English" }),
  );
  expect(changed.mock.lastCall?.[0].prosEn).toEqual([""]);
});
