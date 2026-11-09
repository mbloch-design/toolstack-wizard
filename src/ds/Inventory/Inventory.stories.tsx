import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { formatAmount } from "@/lib/currencyRates";
import { LayoutGrid, List, Pencil, Check } from "@/lib/icons";
import ToolCard, { ToolCards, ToolGroup, type ToolStatus } from "../ToolCard/ToolCard";
import Toolbar, { FilterChips, IconSwitch, SectionHead, SortSelect, ToggleButton, ToolbarTools } from "../Toolbar/Toolbar";

const meta: Meta = { title: "Ma stack/Inventaire", tags: ["a-valider"], parameters: { layout: "fullscreen" }, decorators: [(Story) => <div style={{ padding: 16, maxWidth: 1180 }}><Story /></div>] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
type Item = { name: string; slug?: string; cost: number | null; status: ToolStatus; area: string };

const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);
const AREAS: Record<string, { fr: string; en: string; color: string }> = {
  organise: { fr: "Organiser", en: "Organize", color: "var(--tt-area-1)" }, create: { fr: "Créer", en: "Create", color: "var(--tt-area-2)" }, talk: { fr: "Communiquer", en: "Communicate", color: "var(--tt-area-3)" },
};
const ITEMS: Item[] = [
  { name: "Notion", slug: "notion", cost: 36, status: "overlap", area: "organise" }, { name: "Airtable", slug: "airtable", cost: 24, status: "overlap", area: "organise" },
  { name: "Figma", slug: "figma", cost: 15, status: "ok", area: "create" }, { name: "Canva", slug: "canva", cost: null, status: "review", area: "create" },
  { name: "Microsoft Dynamics 365 Finance and Operations", cost: 1100, status: "ok", area: "organise" }, { name: "Slack", slug: "slack", cost: 0, status: "ok", area: "talk" },
];

function Inventory({ lang, layout: initialLayout = "grid", editing: initialEditing = false, grouped = true }: { lang: Lang; layout?: "grid" | "list"; editing?: boolean; grouped?: boolean }) {
  const [layout, setLayout] = useState(initialLayout);
  const [editing, setEditing] = useState(initialEditing);
  const [filter, setFilter] = useState<"all" | "review" | "overlap">("all");
  const [sort, setSort] = useState(grouped ? "area" : "cost");
  const shown = filter === "all" ? ITEMS : ITEMS.filter((item) => item.status === filter);
  const card = (item: Item) => <ToolCard key={item.name} lang={lang} tool={{ id: item.slug ?? item.name, name: item.name, slug: item.slug }}
    amount={item.cost === null ? t(lang, "Prix ?", "Price?") : item.cost === 0 ? t(lang, "Gratuit", "Free") : formatAmount(item.cost, "EUR", lang)} monthly={!!item.cost}
    status={item.status} area={grouped ? undefined : t(lang, AREAS[item.area].fr, AREAS[item.area].en)} editing={editing} onOpen={() => {}} onRemove={() => {}} localLogosOnly />;
  return <section style={{ display: "grid", gap: 20 }}>
    <SectionHead title={t(lang, "Ma stack", "My stack")} note={t(lang, `${ITEMS.length} outils · 1 175 € · partiel`, `${ITEMS.length} tools · €1,175 · partial`)} />
    <Toolbar>
      <FilterChips label={t(lang, "Filtrer par statut", "Filter by status")} value={filter} onChange={setFilter} filters={[
        { id: "all", label: t(lang, "Tous", "All"), count: ITEMS.length },
        { id: "review", label: t(lang, "À vérifier", "To check"), count: ITEMS.filter((item) => item.status === "review").length },
        { id: "overlap", label: t(lang, "Doublons", "Overlaps"), count: ITEMS.filter((item) => item.status === "overlap").length, alert: true },
      ]} />
      <ToolbarTools>
        <SortSelect label={t(lang, "Trier mes outils", "Sort my tools")} caption={t(lang, "Trier :", "Sort:")} value={sort} onChange={setSort} options={[
          { value: "area", label: t(lang, "Domaine", "Area") }, { value: "cost", label: t(lang, "Coût", "Cost") }, { value: "name", label: t(lang, "Nom", "Name") }]} />
        <IconSwitch label={t(lang, "Affichage", "Layout")} value={layout} onChange={setLayout} options={[
          { value: "grid", label: t(lang, "Grille", "Grid"), icon: <LayoutGrid aria-hidden /> }, { value: "list", label: t(lang, "Liste", "List"), icon: <List aria-hidden /> }]} />
        <ToggleButton pressed={editing} onClick={() => setEditing((value) => !value)}>{editing ? <Check aria-hidden /> : <Pencil aria-hidden />}{editing ? t(lang, "Terminé", "Done") : t(lang, "Modifier", "Edit")}</ToggleButton>
      </ToolbarTools>
    </Toolbar>
    {grouped
      ? Object.entries(AREAS).map(([id, area]) => { const tools = shown.filter((item) => item.area === id); return tools.length > 0 && <ToolGroup key={id} label={t(lang, area.fr, area.en)} color={area.color} note={t(lang, `${tools.length} outil${tools.length > 1 ? "s" : ""}`, `${tools.length} tool${tools.length > 1 ? "s" : ""}`)}><ToolCards layout={layout}>{tools.map(card)}</ToolCards></ToolGroup>; })
      : <ToolGroup><ToolCards layout={layout}>{shown.map(card)}</ToolCards></ToolGroup>}
  </section>;
}

export const ByArea: Story = { render: (_args, { globals: { lang } }) => <Inventory lang={lang} /> };
export const List_: Story = { name: "List", render: (_args, { globals: { lang } }) => <Inventory lang={lang} layout="list" grouped={false} /> };
export const Editing: Story = { render: (_args, { globals: { lang } }) => <Inventory lang={lang} editing /> };
