import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import ToolSearch, { SearchField } from "./ToolSearch";

const meta: Meta = { title: "Ma stack/Ajouter un outil", tags: ["a-valider"], decorators: [(Story) => <div style={{ maxWidth: 680 }}><Story /></div>] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);
const CATALOGUE = [{ id: "notion", name: "Notion", slug: "notion" }, { id: "n8n", name: "n8n", slug: "n8n" }, { id: "airtable", name: "Airtable", slug: "airtable" }, { id: "dyn", name: "Microsoft Dynamics 365 Finance and Operations" }];

function Search({ lang, initial, inStack = ["notion"], closable = true }: { lang: Lang; initial: string; inStack?: string[]; closable?: boolean }) {
  const [query, setQuery] = useState(initial);
  const [stack, setStack] = useState(inStack);
  const found = CATALOGUE.filter((tool) => tool.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <ToolSearch label={t(lang, "Ajouter un outil", "Add a tool")} localLogosOnly
    field={<SearchField value={query} onChange={setQuery} placeholder={t(lang, "Rechercher par nom…", "Search by name…")} label={t(lang, "Ajouter un outil à ma stack", "Add a tool to my stack")}
      onClose={closable ? () => setQuery("") : undefined} closeLabel={t(lang, "Fermer la recherche", "Close search")} />}
    status={query.trim() ? (found.length ? t(lang, "Résultats du catalogue", "Catalogue results") : t(lang, "Aucun outil trouvé.", "No tools found.")) : undefined}
    results={query.trim() ? found.map((tool) => ({ id: tool.id, tool, present: stack.includes(tool.id),
      addLabel: stack.includes(tool.id) ? t(lang, `${tool.name} est dans votre stack`, `${tool.name} is in your stack`) : t(lang, `Ajouter ${tool.name}`, `Add ${tool.name}`),
      renderLink: (className, content) => <a className={className} href={`#${tool.id}`}>{content}</a>, onAdd: () => setStack((s) => [...s, tool.id]) })) : undefined} />;
}

/** Empty field, as it opens. */
export const Open: Story = { render: (_a, { globals: { lang } }) => <Search lang={lang} initial="" /> };
/** Results: one already in the stack (check), one long name. */
export const Results: Story = { render: (_a, { globals: { lang } }) => <Search lang={lang} initial="a" /> };
/** Nothing found. */
export const NoResult: Story = { render: (_a, { globals: { lang } }) => <Search lang={lang} initial="zzz" /> };
/** First tool of an empty stack: no way to close, the field is the page. */
export const FirstTool: Story = { render: (_a, { globals: { lang } }) => <Search lang={lang} initial="" inStack={[]} closable={false} /> };
