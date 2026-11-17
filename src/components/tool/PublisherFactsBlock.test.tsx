import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PublisherPlanFacts, PublisherProductFacts } from "./PublisherFactsBlock";
import { mapToolFromJson } from "@/lib/toolFromJson";

it("renders separately attributed publisher facts with FR and EN fallback", () => {
  const tool = mapToolFromJson({
    id: "sample", name: "Sample", longDescription: "Analyse ToolTrim",
    publisherFacts: {
      localized: {
        fr: { productDescription: "Présentation produit", features: [], useCases: ["Exemple"] },
        en: { productDescription: null, features: [], useCases: [] },
      },
      plans: [{
        localized: { fr: { name: "Entreprise", highlights: [] }, en: { name: "Enterprise", highlights: [] } },
        options: [{ type: "quote", market: "FR", offerLocale: null }],
      }],
    },
  });
  if (!tool.publisherFacts) throw new Error("Missing publisher projection");
  render(<>
    <PublisherProductFacts facts={tool.publisherFacts} lang="en" />
    <PublisherPlanFacts facts={tool.publisherFacts} lang="en" />
  </>);
  expect(screen.getByRole("heading", { name: "Publisher information" })).toBeInTheDocument();
  expect(screen.getByText("Présentation produit")).toBeInTheDocument();
  expect(screen.getByText("Exemple")).toBeInTheDocument();
  expect(screen.getByText("Contact for pricing · FR")).toBeInTheDocument();
  expect(tool.longDescription).toBe("Analyse ToolTrim");
});
