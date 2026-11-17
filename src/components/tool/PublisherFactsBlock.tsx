import type { PublisherPublicFacts } from "@/lib/publisherPublicFacts";
import { pricePresentation } from "@/lib/publisherPricing";
import styles from "./PublisherFactsBlock.module.css";

export function PublisherProductFacts({ facts, lang }: { facts: PublisherPublicFacts; lang: "fr" | "en" }) {
  const fr = lang === "fr";
  const copy = facts.localized[lang];
  const fallback = facts.localized[fr ? "en" : "fr"];
  const description = copy.productDescription || fallback.productDescription;
  const features = copy.features.length ? copy.features : fallback.features;
  const useCases = copy.useCases.length ? copy.useCases : fallback.useCases;
  if (!description && !features.length && !useCases.length) return null;
  return <section className={styles.block} aria-label={fr ? "Informations de l’éditeur" : "Publisher information"}>
    <h2>{fr ? "Informations de l’éditeur" : "Publisher information"}</h2>
    {description && <p className={styles.description}>{description}</p>}
    {features.length > 0 && <section>
      <h3>{fr ? "Fonctionnalités" : "Features"}</h3>
      <ul>{features.map((text, index) => <li key={index}>{text}</li>)}</ul>
    </section>}
    {useCases.length > 0 && <section>
      <h3>{fr ? "Usages" : "Use cases"}</h3>
      <ul>{useCases.map((text, index) => <li key={index}>{text}</li>)}</ul>
    </section>}
  </section>;
}

export function PublisherPlanFacts({ facts, lang }: { facts: PublisherPublicFacts; lang: "fr" | "en" }) {
  const fr = lang === "fr";
  if (!facts.plans.length) return null;
  return <section className={styles.block}>
    <h3>{fr ? "Offres déclarées par l’éditeur" : "Plans reported by the publisher"}</h3>
    <ul className={styles.plans}>{facts.plans.map((plan, index) => {
      const copy = plan.localized[lang];
      const fallback = plan.localized[fr ? "en" : "fr"];
      return <li key={index}>
        <h4>{copy.name || fallback.name}</h4>
        {(copy.summary || fallback.summary) && <p>{copy.summary || fallback.summary}</p>}
        {plan.options.map((option, position) => {
          const price = pricePresentation({
            amount: null, currency: null, period: null, commitment: null, unit: null,
            ...option,
          }, lang);
          return <p key={position}>{[
            price.amountLabel, price.billingLabel, "unit" in option && option.unit, option.market,
          ].filter(Boolean).join(" · ")}</p>;
        })}
        {(copy.highlights.length ? copy.highlights : fallback.highlights).length > 0 && <ul>
          {(copy.highlights.length ? copy.highlights : fallback.highlights).map((text, position) => <li key={position}>{text}</li>)}
        </ul>}
      </li>;
    })}</ul>
  </section>;
}
