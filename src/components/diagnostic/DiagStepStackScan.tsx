import { useMemo, useState } from "react";
import { ArrowRight, Check, Plus, Search, X } from "lucide-react";
import type { SessionState, Tool } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  tools: Tool[];
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  t: (fr: string, en: string) => string;
  fromTool?: string;
}

const POPULAR_TOOL_IDS = [
  "chatgpt",
  "claude",
  "notion",
  "canva",
  "figma",
  "slack",
  "make",
  "calendly",
  "loom",
  "zoom",
  "google-drive",
  "1password",
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function makeCustomTool(name: string, price: number): Tool {
  const slug = normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id: `custom-${slug || "tool"}-${Date.now()}`,
    name,
    price,
    category: "custom",
    functional_needs: [],
    tool_type: "satellite",
    usage: "medium",
    prescription_quality: "oui",
    force_silence: false,
  };
}

export default function DiagStepStackScan({ session, tools, onUpdate, onNext, t, fromTool }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const initialSelectedTools = useMemo(() => {
    if (session.selectedTools.length > 0 || !fromTool) return session.selectedTools || [];
    const normalizedFromTool = normalize(fromTool);
    const entryTool = tools.find((tool) =>
      normalize(tool.id) === normalizedFromTool ||
      normalize(tool.name) === normalizedFromTool
    );
    return entryTool ? [entryTool] : [];
  }, [fromTool, session.selectedTools, tools]);
  const [selectedTools, setSelectedTools] = useState<Tool[]>(initialSelectedTools);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const selectedIds = useMemo(() => new Set(selectedTools.map((tool) => tool.id)), [selectedTools]);
  const allKnownTools = useMemo(() => {
    const map = new Map<string, Tool>();
    tools.forEach((tool) => map.set(tool.id, tool));
    selectedTools.forEach((tool) => map.set(tool.id, tool));
    return Array.from(map.values());
  }, [selectedTools, tools]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    tools.forEach((tool) => {
      const category = tool.category || "other";
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return [
      { id: "all", label: t("Tous", "All"), count: tools.length },
      ...Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id, count]) => ({ id, label: id.replaceAll("-", " "), count })),
    ];
  }, [t, tools]);

  const popularTools = useMemo(
    () => POPULAR_TOOL_IDS.map((id) => tools.find((tool) => tool.id === id)).filter((tool): tool is Tool => !!tool),
    [tools]
  );

  const filteredTools = useMemo(() => {
    const q = normalize(search);
    return allKnownTools
      .filter((tool) => {
        if (selectedIds.has(tool.id)) return false;
        if (activeCategory !== "all" && tool.category !== activeCategory) return false;
        if (!q) return true;
        return normalize(tool.name).includes(q) || normalize(tool.category || "").includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeCategory, allKnownTools, search, selectedIds]);

  const totalCost = selectedTools.reduce((sum, tool) => sum + tool.price, 0);
  const lowUsageCount = selectedTools.filter((tool) => tool.usage === "low" || tool.usage === "dormant").length;

  const toggleTool = (tool: Tool) => {
    setSelectedTools((prev) =>
      prev.some((item) => item.id === tool.id)
        ? prev.filter((item) => item.id !== tool.id)
        : [...prev, tool]
    );
  };

  const updateSelectedTool = (toolId: string, patch: Partial<Tool>) => {
    setSelectedTools((prev) => prev.map((tool) => tool.id === toolId ? { ...tool, ...patch } : tool));
  };

  const addCustomTool = () => {
    const name = customName.trim();
    if (name.length < 2) return;
    const price = Math.max(0, Number(customPrice) || 0);
    setSelectedTools((prev) => [...prev, makeCustomTool(name, price)]);
    setCustomName("");
    setCustomPrice("");
    setSearch("");
  };

  const handleNext = () => {
    onUpdate({ selectedTools });
    onNext();
  };

  const toolName = fromTool
    ? fromTool.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-3">
          {toolName && (
            <p className="inline-flex rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {t(`On part de ${toolName}`, `Starting from ${toolName}`)}
            </p>
          )}
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {t("Montre-moi ta stack. Je détecte le reste.", "Show me your stack. I detect the rest.")}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            {t(
              "Sélectionne les outils que tu utilises ou paies déjà. Pas besoin de tout remplir : on affinera uniquement les points utiles.",
              "Select the tools you already use or pay for. No need to fill everything: we will only refine what matters."
            )}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-mono text-2xl font-bold text-foreground">{selectedTools.length}</p>
              <p className="text-xs text-muted-foreground">{t("outils", "tools")}</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-foreground">{Math.round(totalCost)}€</p>
              <p className="text-xs text-muted-foreground">/{t("mois", "mo")}</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-foreground">{lowUsageCount}</p>
              <p className="text-xs text-muted-foreground">{t("à vérifier", "to check")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="diagnostic-stack-search"
              name="stack-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("Rechercher ChatGPT, Notion, Canva...", "Search ChatGPT, Notion, Canva...")}
              className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label={t("Effacer", "Clear")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 rounded-md border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                  activeCategory === category.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {!search.trim() && activeCategory === "all" && (
            <ToolGrid
              title={t("Les plus fréquents", "Most common")}
              tools={popularTools.filter((tool) => !selectedIds.has(tool.id))}
              selectedIds={selectedIds}
              onToggle={toggleTool}
              t={t}
            />
          )}

          <ToolGrid
            title={search.trim() ? t("Résultats", "Results") : t("Catalogue", "Catalog")}
            tools={filteredTools.slice(0, 48)}
            selectedIds={selectedIds}
            onToggle={toggleTool}
            t={t}
          />

          <div className="rounded-xl border border-dashed border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">
              {t("Un outil manque ?", "Missing a tool?")}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <input
                id="diagnostic-custom-tool"
                name="custom-tool"
                type="text"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder={t("Nom de l'outil", "Tool name")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <input
                id="diagnostic-custom-price"
                name="custom-price"
                type="number"
                value={customPrice}
                onChange={(event) => setCustomPrice(event.target.value)}
                placeholder="€/mois"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={addCustomTool}
                disabled={customName.trim().length < 2}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                {t("Ajouter", "Add")}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("Ta sélection", "Your selection")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("Ajuste seulement les outils suspects.", "Only adjust suspicious tools.")}
                </p>
              </div>
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedTools.length === 0}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                {t("Analyser", "Analyze")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {selectedTools.length === 0 ? (
              <p className="mt-6 rounded-lg bg-muted/50 px-3 py-6 text-center text-sm text-muted-foreground">
                {t("Sélectionne au moins un outil pour obtenir un premier signal.", "Select at least one tool to get a first signal.")}
              </p>
            ) : (
              <div className="mt-4 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
                {selectedTools.map((tool) => (
                  <SelectedToolRow
                    key={tool.id}
                    tool={tool}
                    onRemove={() => toggleTool(tool)}
                    onUpdate={(patch) => updateSelectedTool(tool.id, patch)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ToolGrid({
  title,
  tools,
  selectedIds,
  onToggle,
  t,
}: {
  title: string;
  tools: Tool[];
  selectedIds: Set<string>;
  onToggle: (tool: Tool) => void;
  t: (fr: string, en: string) => string;
}) {
  if (tools.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          const selected = selectedIds.has(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onToggle(tool)}
              className={`flex min-h-[74px] items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-bold text-foreground">
                {tool.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{tool.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tool.price > 0 ? `${tool.price}€/${t("mois", "mo")}` : t("Gratuit", "Free")}
                </p>
              </div>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                selected ? "border-primary bg-primary" : "border-border"
              }`}>
                {selected && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectedToolRow({
  tool,
  onRemove,
  onUpdate,
  t,
}: {
  tool: Tool;
  onRemove: () => void;
  onUpdate: (patch: Partial<Tool>) => void;
  t: (fr: string, en: string) => string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{tool.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{tool.category || t("Autre", "Other")}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label={t("Retirer", "Remove")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-[88px_1fr] gap-2">
        <input
          type="number"
          value={tool.price || ""}
          onChange={(event) => onUpdate({ price: Math.max(0, Number(event.target.value) || 0) })}
          placeholder="€/mois"
          className="h-9 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="grid grid-cols-3 rounded-md border border-border p-0.5">
          {(["high", "medium", "low"] as const).map((usage) => (
            <button
              key={usage}
              type="button"
              onClick={() => onUpdate({ usage })}
              className={`h-8 rounded-[5px] text-[11px] font-medium ${
                tool.usage === usage
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {usage === "high" ? t("Souvent", "Often") : usage === "medium" ? t("Parfois", "Sometimes") : t("Rare", "Rare")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
