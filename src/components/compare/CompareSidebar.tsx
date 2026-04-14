import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { X, Plus } from "lucide-react";
import type { Tool } from "@/data/types";

interface CompareSidebarProps {
  categories: { slug: string; label: string }[];
  activeCategorySlug: string | null;
  selectedTools: Tool[];
  comparisons: { slugPair: string; toolA: string; toolB: string }[];
}

const CompareSidebar = ({ categories, activeCategorySlug, selectedTools, comparisons }: CompareSidebarProps) => {
  const { t, prefix } = useLang();

  return (
    <aside className="space-y-6">
      {/* Category filters */}
      <div className="p-5 bg-secondary/50 rounded-2xl">
        <h3 className="font-bold text-foreground mb-4 text-sm">{t("Catégories", "Categories")}</h3>
        <div className="space-y-1.5">
          {categories.map((cat) => {
            const isActive = cat.slug === activeCategorySlug;
            return (
              <button
                key={cat.slug}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <span>{cat.label}</span>
                {isActive && <span className="text-xs">→</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected tools */}
      <div className="bg-card p-5 rounded-2xl shadow-sm border border-border/15">
        <h4 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest">
          {t("Outils sélectionnés", "Selected Tools")}
        </h4>
        <div className="flex flex-wrap gap-2">
          {selectedTools.map((tool) => (
            <span
              key={tool.id}
              className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-bold flex items-center gap-1.5"
            >
              {tool.name}
              <X className="h-3 w-3 opacity-60" />
            </span>
          ))}
        </div>
        <button className="mt-4 w-full py-2.5 border border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {t("Ajouter un outil", "+ Add Tool")}
        </button>
      </div>

      {/* All comparisons list */}
      <div className="bg-card p-5 rounded-2xl shadow-sm border border-border/15">
        <h4 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest">
          {t("Tous les comparatifs", "All Comparisons")}
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
      </div>
    </aside>
  );
};

export default CompareSidebar;
