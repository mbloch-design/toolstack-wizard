import { CatalogNote, CatalogSettings } from "@/ds/CatalogAuthoring/CatalogAuthoring";
import styles from "@/ds/CatalogAuthoring/CatalogAuthoring.module.css";
import ficheLayout from "@/ds/CatalogAuthoring/CatalogFicheLayout.module.css";
import { createContext, useContext, useState, type ReactNode } from "react";
import { CATALOG_FIELD_REGISTRY } from "@/lib/catalogFieldRegistry";
import type { CatalogEditingPresentation } from "@/lib/catalogEditingPresentation";
import { CatalogFieldEditor } from "./CatalogFieldEditor";
import {
  PlanActions,
  PlanCollection,
  PlanDetails,
  useOfferOperations,
  ComparisonPriceSummary,
} from "./CatalogPriceEditor";
import type { CatalogEditingValue } from "./catalogEditingModel";
export type {
  CatalogEditingValue,
  CatalogPath,
  CatalogChange,
} from "./catalogEditingModel";
export { catalogValueAt, catalogFieldLabel } from "./catalogEditingModel";

const layout: CatalogEditingPresentation["layout"] = {
  privateFiche: ficheLayout.privateFiche,
  heroCard: ficheLayout.heroCard,
  planHead: ficheLayout.planHead,
  planName: ficheLayout.planName,
  planPrice: ficheLayout.planPrice,
  priceEditor: ficheLayout.priceEditor,
  planCondition: ficheLayout.planCondition,
  planSettings: ficheLayout.planSettings,
};

export const CatalogEditingContext = createContext<CatalogEditingValue | null>(
  null,
);
export const useCatalogEditing = () => useContext(CatalogEditingContext);

function CatalogBlock({
  context,
  roots,
  title,
  advanced = false,
  inHero = false,
  omit = [],
}: {
  context: CatalogEditingValue;
  roots: string[];
  title: string;
  advanced?: boolean;
  inHero?: boolean;
  omit?: string[];
}) {
  // Mount costly vocabularies only when requested. Keep mounted after closing so
  // collection undo state and in-progress controls survive subsequent edits.
  const [visited, setVisited] = useState(false);
  const content = (
    <div className={styles.fields}>
      {roots.map((root) => (
        <CatalogFieldEditor
          key={root}
          context={context}
          path={root.split(".")}
          omit={omit}
        />
      ))}
    </div>
  );
  return advanced ? (
    <CatalogSettings
      className={inHero ? ficheLayout.heroSettings : undefined}
      summary={title}
      onToggle={(event) => {
        if (event.currentTarget.open) setVisited(true);
      }}
    >
      {visited && content}
    </CatalogSettings>
  ) : (
    <section className={styles.block} aria-label={title}>
      <h3>{title}</h3>
      {content}
    </section>
  );
}
export function CatalogEditorPresentation({
  context,
  children,
}: {
  context: CatalogEditingValue;
  children: (editing: CatalogEditingPresentation) => ReactNode;
}) {
  const offers = useOfferOperations(context);
  const presentation: CatalogEditingPresentation = {
    layout,
    note: (content) => <CatalogNote>{content}</CatalogNote>,
    field: (path, inherited) => (
      <CatalogFieldEditor
        key={path
          .map((part) => (typeof part === "number" ? "*" : part))
          .join(".")}
        context={context}
        path={path}
        inherited={inherited}
      />
    ),
    block: (roots, title, options) => (
      <CatalogBlock
        key={roots.join("|")}
        context={context}
        roots={roots}
        title={title}
        {...options}
      />
    ),
    planDetails: (root, index) => (
      <PlanDetails context={context} root={root} index={index} />
    ),
    planActions: (root, index) => (
      <PlanActions
        context={context}
        root={root}
        index={index}
        onRemove={offers.remove}
      />
    ),
    priceSummary: (currency) => (
      <ComparisonPriceSummary context={context} currency={currency} />
    ),
    planCollection: (root) => (
      <PlanCollection
        context={context}
        root={root}
        removed={offers.removed}
        onUndo={offers.undo}
      />
    ),
  };
  return (
    <CatalogEditingContext.Provider value={context}>
      {children(presentation)}
    </CatalogEditingContext.Provider>
  );
}
/** Explicit protected inventory: values remain consultable without raw JSON editing. */
export function CatalogProtectedFields({
  context,
}: {
  context: CatalogEditingValue;
}) {
  return (
    <CatalogBlock
      context={context}
      roots={CATALOG_FIELD_REGISTRY.filter(
        (field) => !field.path.includes(".") && !field.editable,
      ).map((field) => field.path)}
      title="Identifiants, sources et valeurs protégées"
      advanced
    />
  );
}
