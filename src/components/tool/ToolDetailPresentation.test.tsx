import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import * as Page from "@/pages/ToolDetailPage";
import { mapToolFromJson } from "@/lib/toolFromJson";
import ToolPricingSection from "./ToolPricingSection";
import { getNativeComparePrice } from "@/lib/nativePricing";
import type { Tool } from "@/data/types";

const loaders = vi.hoisted(() => ({
  tool: vi.fn(),
  summaries: vi.fn(),
  categories: vi.fn(),
}));
vi.mock("@/hooks/useSupabaseData", async (original) => ({
  ...(await original<typeof import("@/hooks/useSupabaseData")>()),
  useToolBySlug: loaders.tool,
  useToolSummaries: loaders.summaries,
  useCategories: loaders.categories,
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const raw = {
  id: "editor-fixture",
  slug: "editor-fixture",
  name: "Draft identity",
  shortDescription: "Draft description",
  category: "design",
  websiteUrl: "https://example.com",
  pros: [],
  cons: [],
  useCases: [],
  verdict: { keepIf: [], avoidIf: [], threshold: "" },
};
const present = () =>
  (Page as unknown as { ToolDetailPresentation: React.ComponentType<any> })
    .ToolDetailPresentation;
it("provides the actual controlled fiche without invoking public source hooks or writing SEO", () => {
  const Presentation = present();
  expect(
    Presentation,
    "the shared actual fiche needs a source-free presentation entry",
  ).toBeTypeOf("function");
  const title = document.title;
  const { container } = render(
    <MemoryRouter>
      <Presentation
        tool={mapToolFromJson(raw)}
        tools={[]}
        categories={[]}
        lang="fr"
        currency="EUR"
        subPage="presentation"
        privateMode
      />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Draft identity",
  );
  expect(container.querySelector(".td-hero-card")).toBeTruthy();
  expect(container.querySelector(".td-plans")).toBeNull();
  expect(loaders.tool).not.toHaveBeenCalled();
  expect(loaders.summaries).not.toHaveBeenCalled();
  expect(loaders.categories).not.toHaveBeenCalled();
  expect(document.title).toBe(title);
  expect(
    container.querySelector('script[type="application/ld+json"]'),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: /Ajouter à ma stack/i }),
  ).toBeNull();
  const outbound = container.querySelector('a[href="https://example.com"]');
  if (outbound) expect(fireEvent.click(outbound)).toBe(false);
});
it.each(["quote", "unknown", "usage"])(
  "never describes explicit %s zero price as a free numeric offer",
  (priceStatus) => {
    const tool = mapToolFromJson({
      ...raw,
      pricing_v5: {
        plans: [
          {
            planKey: "p",
            displayName: "Enterprise",
            isComparePlan: true,
            isFree: false,
            nativeAmount: 0,
            nativeCurrency: "EUR",
            billingPeriod: "monthly",
            priceStatus,
          },
        ],
      },
    });
    const { container } = render(
      <ToolPricingSection
        tool={tool}
        displayPrice={0}
        lang="fr"
        t={(fr) => fr}
      />,
    );
    expect(container.querySelector(".td-plan-price")?.textContent).not.toMatch(
      /0\s*€/,
    );
    expect(getNativeComparePrice(tool)).toBeNull();
  },
);
it("handles extended annual periods in the common native monthly resolver", () => {
  const tool = mapToolFromJson({
    ...raw,
    pricing_v5: {
      plans: [
        {
          planKey: "p",
          displayName: "Annual",
          isComparePlan: true,
          nativeAmount: 120,
          nativeCurrency: "EUR",
          billingPeriod: "year",
          priceStatus: "paid",
        },
      ],
    },
  });
  expect(getNativeComparePrice(tool)?.amount).toBe(10);
});
it("keeps an untouched legacy numeric plan eligible without materialising a status", () => {
  const plan = {
    planKey: "legacy",
    displayName: "Legacy",
    isComparePlan: true,
    nativeAmount: 12,
    nativeCurrency: "EUR",
    billingPeriod: "monthly",
  };
  expect(
    getNativeComparePrice(
      mapToolFromJson({ ...raw, pricing_v5: { plans: [plan] } }),
    )?.amount,
  ).toBe(12);
  expect(plan).not.toHaveProperty("priceStatus");
});

it("places complete typed authoring at the corresponding blocks of the actual fiche, including first-value adds", async () => {
  const { CatalogEditorPresentation } = await import(
    "@/components/backoffice/CatalogEditingContext"
  );
  const { catalogCapabilities } = await import("@/lib/catalogPolicy");
  const Presentation = present();
  const value = {
    ...raw,
    pricing_v5: {
      plans: [
        {
          planKey: "p",
          displayName: "Pro",
          nativeAmount: 12,
          nativeCurrency: "EUR",
          billingPeriod: "monthly",
          isFree: false,
          isComparePlan: true,
        },
      ],
    },
  };
  const { container } = render(
    <MemoryRouter>
      <CatalogEditorPresentation
        context={{
          value,
          base: value,
          published: value,
          capabilities: catalogCapabilities({ isAdmin: true }),
          issues: [],
          onChange: vi.fn(),
          onRemove: vi.fn(),
          categories: [],
          tools: [],
        }}
      >
        {(editing) => (
          <Presentation
            tool={mapToolFromJson(value)}
            tools={[]}
            categories={[]}
            lang="fr"
            currency="EUR"
            subPage="presentation"
            privateMode
            editing={editing}
          />
        )}
      </CatalogEditorPresentation>
    </MemoryRouter>,
  );
  expect(
    container.querySelector(
      '.td-editorial-intro [data-catalog-path="longDescription"]',
    ),
  ).toBeTruthy();
  expect(
    container.querySelector(
      '.td-editorial-intro [data-catalog-path="useCases"]',
    ),
  ).toBeTruthy();
  expect(
    container.querySelector(
      '.td-editorial-facts [data-catalog-path="relevantFor"]',
    ),
  ).toBeTruthy();
  expect(
    container.querySelector('#analyse [data-catalog-path="pros"]'),
  ).toBeTruthy();
  expect(
    container.querySelector('#avis [data-catalog-path="toolTrimRating"]'),
  ).toBeTruthy();
  expect(
    container.querySelector(
      '#alternatives [data-catalog-path="migrationGuide"]',
    ),
  ).toBeTruthy();
  expect(
    container.querySelector(
      '.td-plan [data-catalog-path="pricing_v5.plans.0.displayName"]',
    ),
  ).toBeTruthy();
  expect(
    container.querySelector(
      '.td-plan [data-catalog-path="pricing_v5.plans.0.nativeAmount"]',
    ),
  ).toBeTruthy();
  expect(
    container.querySelector('#approfondir [data-catalog-path="seo"]'),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Ajouter une offre" }),
  ).toBeEnabled();
  expect(container.querySelector("#approfondir")).toHaveTextContent(
    /Les guides affichés proviennent de la sélection éditoriale des guides/,
  );
  expect(container.querySelector("#alternatives")).toHaveTextContent(
    /sans bloc public dédié/,
  );
});
it("keeps an accepted CAD offer amount in its native currency in the actual pricing card", () => {
  const tool = mapToolFromJson({
    ...raw,
    pricing_v5: {
      plans: [
        {
          planKey: "cad",
          displayName: "CAD Pro",
          priceStatus: "paid",
          isFree: false,
          isComparePlan: true,
          nativeAmount: 120,
          nativeCurrency: "CAD",
          billingPeriod: "monthly",
        },
      ],
    },
  });
  const { container } = render(
    <ToolPricingSection
      tool={tool}
      displayPrice={0}
      lang="en"
      t={(_, en) => en}
    />,
  );
  expect(container.querySelector(".td-plan-price")).not.toHaveTextContent("€");
  expect(container.querySelector(".td-plan-price")).toHaveTextContent(
    /CA\$|CAD/,
  );
});
