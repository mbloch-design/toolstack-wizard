import { useState, useMemo } from "react";
import { Search, Check, X } from "@/lib/icons";
import { Tool, SelectedTool } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { useCategories } from "@/hooks/useSupabaseData";

const POPULAR_TOOL_IDS = [
  "chatgpt", "claude", "notion", "canva", "slack", "figma",
  "calendly", "make", "loom", "grammarly", "zoom", "google-drive",
];

const CATEGORY_CHIPS: { id: string; label: string; labelEn: string }[] = [
  { id: "all", label: "Tous", labelEn: "All" },
  { id: "ai-general", label: "IA", labelEn: "AI" },
  { id: "organization", label: "Organisation", labelEn: "Organization" },
  { id: "communication", label: "Communication", labelEn: "Communication" },
  { id: "design-tools", label: "Design", labelEn: "Design" },
  { id: "automation", label: "Automatisation", labelEn: "Automation" },
  { id: "finance", label: "Finance", labelEn: "Finance" },
  { id: "nocode-web", label: "No-code", labelEn: "No-code" },
  { id: "creation", label: "Création", labelEn: "Creation" },
];

interface ToolSelectionStepProps {
  tools: Tool[];
  currentTools: SelectedTool[];
  onToggleTool: (toolId: string) => void;
  onUpdateCost: (toolId: string, cost: number) => void;
  onUpdateUsage: (toolId: string, usage: "low" | "medium" | "high") => void;
}

function ToolCard({
  tool,
  selected,
  onToggle,
}: {
  tool: Tool;
  selected: SelectedTool | undefined;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
        selected
          ? "border-primary bg-accent shadow-sm ring-1 ring-primary/20"
          : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
      }`}
    >
      {/* Logo — centralized via ToolLogo (multi-source fallback + initial) */}
      <ToolLogo tool={tool} size={32} />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{tool.name}</p>
        <p className="text-xs text-muted-foreground">
          {tool.defaultMonthlyPrice > 0 ? `${tool.defaultMonthlyPrice}€/mois` : "Gratuit"}
        </p>
      </div>

      {selected ? (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full border-2 border-border group-hover:border-primary/50 transition-colors" />
      )}
    </button>
  );
}

const ToolSelectionStep = ({
  tools,
  currentTools,
  onToggleTool,
  onUpdateCost,
  onUpdateUsage,
}: ToolSelectionStepProps) => {
  const { t, lang } = useLang();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const selectedIds = useMemo(
    () => new Set(currentTools.map((ct) => ct.toolId)),
    [currentTools]
  );
  const totalCost = currentTools.reduce((sum, ct) => {
    const tool = tools.find((t) => t.id === ct.toolId);
    return sum + (ct.monthlyCost ?? tool?.defaultMonthlyPrice ?? 0);
  }, 0);

  const selectedTools = useMemo(() => tools.filter((t) => selectedIds.has(t.id)), [tools, selectedIds]);

  const popularTools = useMemo(
    () => POPULAR_TOOL_IDS.map((id) => tools.find((t) => t.id === id)).filter(Boolean) as Tool[],
    [tools]
  );

  const filteredTools = useMemo(() => {
    let filtered = tools.filter((t) => !selectedIds.has(t.id));

    if (activeCategory !== "all") {
      filtered = filtered.filter((t) => t.categoryId === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((t) => (t.name ?? "").toLowerCase().includes(q));
    }

    return filtered;
  }, [tools, search, activeCategory, selectedIds]);

  const showPopular = !search.trim() && activeCategory === "all";

  return (
    <div className="animate-fade-in">
      <h2 className="font-heading text-2xl font-bold">
        {t("Quels outils utilisez-vous ?", "Which tools do you use?")}
      </h2>
      <p className="mt-2 text-muted-foreground">
        {t("Sélectionnez les outils que vous payez actuellement. Optionnel.", "Select the tools you currently pay for. Optional.")}
      </p>

      {/* Search */}
      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="selector-tool-search"
          name="selector-tool-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Rechercher un outil...", "Search for a tool...")}
          className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setActiveCategory(chip.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === chip.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {lang === "en" ? chip.labelEn : chip.label}
          </button>
        ))}
      </div>

      {/* Selected tools section */}
      {selectedTools.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            {t("Votre sélection", "Your selection")} ({selectedTools.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {selectedTools.map((tool) => (
              <div key={tool.id}>
                <ToolCard
                  tool={tool}
                  selected={currentTools.find((ct) => ct.toolId === tool.id)}
                  onToggle={() => onToggleTool(tool.id)}
                />
                {/* Inline cost/usage */}
                <div className="mt-1 flex gap-2 px-1">
                  <input
                    id={`selector-tool-cost-${tool.id}`}
                    name={`selector-tool-cost-${tool.id}`}
                    type="number"
                    placeholder={t("€/mois", "€/mo")}
                    value={currentTools.find((ct) => ct.toolId === tool.id)?.monthlyCost || ""}
                    onChange={(e) => onUpdateCost(tool.id, Number(e.target.value))}
                    className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <select
                    id={`selector-tool-usage-${tool.id}`}
                    name={`selector-tool-usage-${tool.id}`}
                    value={currentTools.find((ct) => ct.toolId === tool.id)?.usage || "medium"}
                    onChange={(e) => onUpdateUsage(tool.id, e.target.value as "low" | "medium" | "high")}
                    className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="low">{t("Peu utilisé", "Low use")}</option>
                    <option value="medium">{t("Usage moyen", "Medium use")}</option>
                    <option value="high">{t("Usage intensif", "High use")}</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular tools */}
      {showPopular && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            {t("Outils populaires", "Popular tools")}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {popularTools.filter((t) => !selectedIds.has(t.id)).map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                selected={undefined}
                onToggle={() => onToggleTool(tool.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filtered results */}
      {(!showPopular || search.trim()) && (
        <div className="mt-4">
          {filteredTools.length > 0 ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                {filteredTools.length} {t("outils", "tools")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 max-h-[40vh] overflow-y-auto pr-1">
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    selected={undefined}
                    onToggle={() => onToggleTool(tool.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("Aucun outil trouvé.", "No tools found.")}
            </p>
          )}
        </div>
      )}

      {/* All tools when no filter applied and not searching */}
      {showPopular && !search.trim() && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            {t("Tous les outils", "All tools")}
          </p>
          <div className="grid gap-2 sm:grid-cols-2 max-h-[35vh] overflow-y-auto pr-1">
            {tools.filter((t) => !selectedIds.has(t.id) && !POPULAR_TOOL_IDS.includes(t.id)).map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                selected={undefined}
                onToggle={() => onToggleTool(tool.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sticky counter */}
      <div className="sticky bottom-0 mt-4 -mx-1 rounded-xl border border-border bg-card/95 backdrop-blur-sm px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{currentTools.length}</span>{" "}
            {t("outils sélectionnés", "tools selected")}
          </span>
          <span className="font-heading text-sm font-bold">
            {t("Total", "Total")} : <span className="text-primary">{totalCost}€/mois</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ToolSelectionStep;
