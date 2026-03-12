import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { Search, LayoutGrid } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setJsonLd, cleanupSeo } from "@/lib/seo";

const ToolsPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // SEO
  useEffect(() => {
    const title = lang === "fr"
      ? `Catalogue de ${tools.length}+ outils SaaS — ToolTrim`
      : `${tools.length}+ SaaS Tool Catalog — ToolTrim`;
    const desc = lang === "fr"
      ? `Comparez ${tools.length}+ outils SaaS classés par catégorie. Prix, avantages, alternatives — tout pour optimiser votre stack.`
      : `Compare ${tools.length}+ SaaS tools by category. Pricing, pros, alternatives — everything to optimize your stack.`;
    const url = `https://tooltrim.com/${lang}/tools`;

    setSeoTags({ title, description: desc, url });

    setJsonLd("tools-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description: desc,
      url,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: tools.length,
        itemListElement: tools.slice(0, 20).map((tool, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: tool.name,
          url: `https://tooltrim.com/${lang}/tool/${tool.slug || tool.id}`,
        })),
      },
    });

    return () => cleanupSeo(["tools-jsonld"]);
  }, [lang, tools.length]);

  const filtered = tools.filter((tool) => {
    const matchSearch = !search || tool.name.toLowerCase().includes(search.toLowerCase()) || tool.shortDescription.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || tool.categoryId === selectedCategory;
    return matchSearch && matchCat;
  });

  const selectedCatObj = selectedCategory ? categories.find((c) => c.id === selectedCategory) : null;

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <section className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="container mx-auto max-w-6xl px-4 pb-8 pt-12 md:pt-16">
          <div className="mb-5">
            <Breadcrumb items={[
              { label: t("Outils", "Tools") },
            ]} />
          </div>

          <div className="flex items-center gap-2 text-primary mb-3">
            <LayoutGrid className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">{t("Catalogue", "Catalog")}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tighter md:text-4xl">
            {t("Catalogue d'outils", "Tool catalog")}
          </h1>
          <p className="mt-2 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t(
              `${tools.length}+ outils SaaS analysés, comparés et classés par catégorie. Trouvez l'outil parfait pour votre activité.`,
              `${tools.length}+ SaaS tools analyzed, compared and categorized. Find the perfect tool for your business.`
            )}
          </p>

          {/* Search + filters */}
          <div className="mt-8 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Rechercher un outil...", "Search for a tool...")}
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                !selectedCategory ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {t("Tous", "All")} ({tools.length})
            </button>
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              const count = tools.filter((t) => t.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    selectedCategory === cat.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {t(cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), cat.nameEn || cat.name)} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto max-w-6xl px-4 py-10">
        {selectedCatObj && (
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tighter">
              {t(selectedCatObj.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), selectedCatObj.nameEn || selectedCatObj.name)}
            </h2>
            {selectedCatObj.description && (
              <p className="mt-1 text-sm text-muted-foreground">{t(selectedCatObj.description, selectedCatObj.descriptionEn)}</p>
            )}
          </div>
        )}

        <p className="mb-4 text-sm text-muted-foreground">
          {filtered.length} {t("résultats", "results")}
          {search && ` ${t("pour", "for")} "${search}"`}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <Link
              key={tool.id}
              to={`${prefix}/tool/${tool.slug}`}
              className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <ToolLogo tool={tool} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold group-hover:text-primary truncate">{tool.name}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      tool.defaultMonthlyPrice === 0 ? "bg-accent text-accent-foreground" :
                      tool.pricing?.free ? "bg-secondary text-secondary-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {tool.defaultMonthlyPrice === 0 ? (tool.pricing?.free ? "Freemium" : t("Gratuit", "Free")) : t("Payant", "Paid")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}
                  </p>
                  {tool.defaultMonthlyPrice > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("À partir de", "From")} {tool.defaultMonthlyPrice}€/{t("mois", "mo")}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">{t("Aucun outil trouvé.", "No tools found.")}</p>
        )}
      </section>
    </div>
  );
};

export default ToolsPage;
