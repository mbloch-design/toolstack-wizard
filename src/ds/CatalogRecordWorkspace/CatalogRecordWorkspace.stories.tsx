import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CatalogRecordWorkspace } from "@/components/backoffice/CatalogRecordWorkspace";
import type { CatalogStagedBlock, CatalogStagedUpdate } from "@/components/backoffice/catalogDraftSession";
import type { CatalogTool } from "@/lib/backofficeCatalog";
import { catalogCapabilities } from "@/lib/catalogPolicy";
import { changeStoryRecord, emptyRecord, notionRecord } from "../CatalogAuthoring/CatalogAuthoring.fixtures";

const meta: Meta = { title: "Catalogue/Fiche sur une page", tags: ["a-valider"] };
export default meta;

function RecordStory({ lang, empty = false }: { lang: "fr" | "en"; empty?: boolean }) {
  const base: CatalogTool = empty ? emptyRecord : { ...notionRecord, functional_needs: ["historical-example"] };
  const [value, setValue] = useState<CatalogTool>(base);
  const [transaction, setTransaction] = useState<CatalogStagedBlock | null>(null);
  return <CatalogRecordWorkspace currency={lang === "en" ? "USD" : "EUR"} transaction={transaction}
    onTransaction={(update: CatalogStagedUpdate) => setTransaction(update)}
    context={{
      lang, value, base, published: base, capabilities: catalogCapabilities({ isAdmin: true }),
      issues: [], categories: [], tools: [],
      onChange: (path, next) => setValue((current) => changeStoryRecord(current, [{ path, value: next }])),
      onRemove: (path) => setValue((current) => changeStoryRecord(current, [{ path, value: undefined, remove: true }])),
      onChanges: (changes) => setValue((current) => changeStoryRecord(current, changes)),
    }}
  />;
}

export const Reading: StoryObj = {
  render: (_args, { globals }) => <RecordStory lang={globals.lang === "en" ? "en" : "fr"} />,
};
export const Empty: StoryObj = {
  render: (_args, { globals }) => <RecordStory lang={globals.lang === "en" ? "en" : "fr"} empty />,
};
export const TagEditing: StoryObj = {
  ...Reading,
  play: async ({ canvas, globals, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: globals.lang === "en" ? "Edit uses" : "Modifier les usages" }));
  },
};
