import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";

const CategoryPage = () => {
  const { t, prefix } = useLang();
  const { slug } = useParams();
  const { tools } = useTools();
  const { categories } = useCategories();
  const category = categories.find((c) => c.slug === slug);
  const catTools = category ? tools.filter((t) => t.categoryId === category.id) : [];

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{t("Catégorie non trouvée.", "Category not found.")}</p>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container">
        <h1 className="font-heading text-3xl font-bold">{t(category.name, category.nameEn)}</h1>
        <p className="mt-2 text-muted-foreground">{t(category.description, category.descriptionEn)}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catTools.map((tool) => (
            <Link
              key={tool.id}
              to={`${prefix}/tool/${tool.slug}`}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{tool.logo}</span>
                <div>
                  <h3 className="font-heading font-semibold group-hover:text-primary">{tool.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
