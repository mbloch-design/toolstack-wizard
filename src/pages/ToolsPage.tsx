import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { Search } from "lucide-react";

const ToolsPage = () => {
  const { t, prefix } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = tools.filter((tool) => {
    const matchSearch = !search || tool.name.toLowerCase().includes(search.toLowerCase()) || tool.shortDescription.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || tool.categoryId === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="py-12">
      <div className="container">
        <h1 className="text-3xl font-extrabold tracking-tighter md:text-4xl">{t("Catalogue d'outils", "Tool catalog")}</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">{t(`${tools.length}+ outils analysés et comparés.`, `${tools.length}+ tools analyzed and compared.`)}</p>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Rechercher un outil...", "Search for a tool...")}
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                !selectedCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {t("Tout", "All")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {t(cat.name, cat.nameEn)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <Link
              key={tool.id}
              to={`${prefix}/tool/${tool.slug}`}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{tool.logo}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold group-hover:text-primary">{tool.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      tool.defaultMonthlyPrice === 0 ? "bg-accent text-accent-foreground" :
                      tool.pricing?.free ? "bg-secondary text-secondary-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {tool.defaultMonthlyPrice === 0 ? (tool.pricing?.free ? "Freemium" : t("Gratuit", "Free")) : t("Payant", "Paid")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}</p>
                  {tool.defaultMonthlyPrice > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">{t("À partir de", "From")} {tool.defaultMonthlyPrice}€/{t("mois", "mo")}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">{t("Aucun outil trouvé.", "No tools found.")}</p>
        )}
      </div>
    </div>
  );
};

export default ToolsPage;
