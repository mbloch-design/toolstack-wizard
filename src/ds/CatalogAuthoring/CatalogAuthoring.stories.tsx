import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CatalogEditorPresentation } from "@/components/backoffice/CatalogEditingContext";
import type { CatalogEditingValue } from "@/components/backoffice/catalogEditingModel";
import { catalogCapabilities } from "@/lib/catalogPolicy";
import { Button, LinkAction } from "../Controls/Controls";
import { controlCopy } from "../Controls/Controls.fixtures";
import { CatalogIssues, CatalogToolbar } from "./CatalogAuthoring";
import { changeStoryRecord, emptyRecord, notionRecord } from "./CatalogAuthoring.fixtures";

const meta: Meta = { title: "Catalogue/Édition de fiche", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;

function RecordFields({ lang, empty = false }: { lang: "fr" | "en"; empty?: boolean }) {
  const copy = controlCopy[lang];
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  const base = empty ? emptyRecord : notionRecord;
  const [value, setValue] = useState<CatalogEditingValue["value"]>(base);
  const pricingRoot = lang === "en" ? "pricing_v5En" : "pricing_v5";
  const missingName = empty && !value.name;
  const context: CatalogEditingValue = {
    lang, value, base, published: base,
    capabilities: catalogCapabilities({ isAdmin: true }),
    issues: missingName ? [{ path: "name", code: "REQUIRED", severity: "error", stage: "publish" }] : [],
    categories: [],
    tools: [],
    onChange: (path, next) => setValue((current) => changeStoryRecord(current, [{ path, value: next }])),
    onRemove: (path) => setValue((current) => changeStoryRecord(current, [{ path, remove: true, value: undefined }])),
    onChanges: (changes) => setValue((current) => changeStoryRecord(current, changes)),
  };
  return <CatalogEditorPresentation context={context}>
    {(editing) => <>
      <CatalogToolbar>
        <Button>{t("Retour aux fiches", "Back to records")}</Button>
        <p role="status">{t("Modifications locales", "Local changes")}</p>
        <p>{t("Le brouillon est enregistré automatiquement après votre saisie.", "Your draft saves automatically after you finish typing.")}</p>
      </CatalogToolbar>
      {missingName && <CatalogIssues summary={t("À vérifier avant mise en ligne (1)", "Check before publishing (1)")} open>
        <ul><li>{t("Nom · Renseignez le nom de l’outil.", "Name · Enter the tool name.")}</li></ul>
      </CatalogIssues>}
      {editing.block(["name", lang === "en" ? "shortDescriptionEn" : "shortDescription"], t("Présentation", "Presentation"))}
      {editing.block([lang === "en" ? "prosEn" : "pros"], t("Points forts", "Strengths"))}
      {editing.block(["websiteUrl"], t("Source officielle", "Official source"), { advanced: true })}
      {!empty && <>
        {editing.field([pricingRoot, "plans", 0, "nativeAmount"])}
        {editing.field([pricingRoot, "plans", 0, "nativeCurrency"])}
        {editing.planDetails(pricingRoot, 0)}
      </>}
      {editing.planCollection(pricingRoot)}
      {editing.priceSummary("EUR")}
      <CatalogToolbar>
        <Button disabled>{copy.cancel}</Button>
        <LinkAction href={`/${lang}/tool/notion`}>{copy.compare}</LinkAction>
      </CatalogToolbar>
    </>}
  </CatalogEditorPresentation>;
}

export const Notion: Story = {
  render: (_args, { globals: { lang } }) => <RecordFields lang={lang === "en" ? "en" : "fr"} />,
  play: async ({ canvas, globals: { lang }, userEvent }) => {
    await userEvent.click(canvas.getByText(lang === "en" ? "Offer details" : "Détails de l’offre"));
  },
};

export const MissingFields: Story = {
  render: (_args, { globals: { lang } }) => <RecordFields lang={lang === "en" ? "en" : "fr"} empty />,
};
