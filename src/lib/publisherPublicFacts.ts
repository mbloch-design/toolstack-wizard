import type { PriceOption } from "./publisherPricing.js";

type Locale = "fr" | "en";
export type PublisherPublicFacts = {
  localized: Record<Locale, {
    shortDescription: string | null;
    productDescription: string | null;
    features: string[];
    useCases: string[];
  }>;
  plans: {
    localized: Record<Locale, { name: string; highlights: string[]; summary: string | null }>;
    options: (Omit<PriceOption, "id"> | Pick<PriceOption, "type" | "market" | "offerLocale">)[];
  }[];
};
