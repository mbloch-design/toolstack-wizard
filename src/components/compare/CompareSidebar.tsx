import { useState, useMemo } from "react";
import { useLang } from "@/hooks/useLang";
import { useNavigate, Link } from "react-router-dom";
import { useTools } from "@/hooks/useSupabaseData";
import { X, Plus, Search } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";

interface CompareSidebarProps {
  categories: { slug: string; label: string }[];
  activeCategorySlug: string | null;
  selectedTools: Tool[];
  comparisons: { slugPair: string; toolA: string; toolB: string }[];
}

const CompareSidebar = ({ categories, activeCategorySlug, selectedTools, comparisons }: CompareSidebarProps) => {
  const { t, prefix } = useLang();
  const navigate = useNavigate();
  const { tools: allTools } = useTools();

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  const filteredTools = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const selectedIds = new Set(selectedTools.map(t => t.id));
    return allTools.filter(t => (t.name ?? "").toLowerCase().includes(q) && !selectedIds.has(t.id)).slice(0, 8);
  }, [search, allTools, selectedTools]);

  const handleSelectTool = (tool: Tool) => {
    const [a, b] = selectedTools;
    let slugA: string, slugB: string;

    if (replacingIndex === 0) {
      slugA = tool.slug || tool.id;
      slugB = b.slug || b.id;
    } else if (replacingIndex === 1) {
      slugA = a.slug || a.id;
      slugB = tool.slug || tool.id;
    } else {
      // Adding/replacing tool B by default
      slugA = a.slug || a.id;
      slugB = tool.slug || tool.id;
    }

    setSearch("");
    setShowSearch(false);
    setReplacingIndex(null);
    navigate(`${prefix}/comparatif/${slugA}-vs-${slugB}`);
  };

  const handleRemoveTool = (index: number) => {
    setReplacingIndex(index);
    setShowSearch(true);
    setSearch("");
  };

  return (
    <aside className="space-y-6">
      {/* Category filters */}
      <div className="p-5 bg-secondary/50 rounded-2xl">
        <h3 className="font-bold text-foreground mb-4 text-sm">{t("Catégories", "Categories")}</h3>
        <div className="space-y-1.5">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-muted-foreground hover:bg-secondary"
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected tools */}
      <div className="surface-card p-5">
        <h4 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest">
          {t("Outils sélectionnés", "Selected Tools")}
        </h4>
        <div className="space-y-2">
          {selectedTools.map((tool, i) => (
            <div key={tool.id} className="flex items-center gap-2 px-3 py-2 bg-accent/50 rounded-xl">
              <ToolLogo tool={tool} size={20} />
              <span className="text-xs font-bold flex-1 truncate">{tool.name}</span>
              <button
                onClick={() => handleRemoveTool(i)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={t("Remplacer", "Replace")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Search to add/replace tool */}
        {showSearch ? (
          <div className="mt-3 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                id="compare-sidebar-search"
                name="compare-sidebar-search"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                placeholder={t("Rechercher un outil…", "Search a tool…")}
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {filteredTools.length > 0 && (
              <div className="surface-card mt-1 max-h-48 overflow-y-auto overflow-hidden shadow-lg">
                {filteredTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => handleSelectTool(tool)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-left"
                  >
                    <ToolLogo tool={tool} size={18} />
                    <span className="font-medium truncate">{tool.name}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => { setShowSearch(false); setReplacingIndex(null); setSearch(""); }}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {t("Annuler", "Cancel")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setShowSearch(true); setReplacingIndex(null); }}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("Changer un outil", "Swap a tool")}
          </button>
        )}
      </div>

      {/* All comparisons list */}
      <div className="surface-card p-5">
        <h4 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest">
          {t("Comparatifs populaires", "Popular Comparisons")}
        </h4>
        <div className="space-y-1.5">
          {comparisons.map((c) => (
            <Link
              key={c.slugPair}
              to={`${prefix}/comparatif/${c.slugPair}`}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                c.slugPair === activeCategorySlug
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {c.slugPair.replace(/-vs-/g, " vs ").replace(/-/g, " ")}
            </Link>
          ))}
        </div>
        <Link
          to={`${prefix}/comparatifs`}
          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80"
        >
          {t("Tous les comparatifs", "All comparisons")} →
        </Link>
      </div>
    </aside>
  );
};

export default CompareSidebar;
