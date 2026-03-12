import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { getCategoryIcon } from "@/lib/categoryIcons";
import ToolLogo from "@/components/ToolLogo";

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

  const Icon = getCategoryIcon(category.id);

  return (
    <div className="pt-12 pb-12">
      <div className="container">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-accent p-2.5 text-accent-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter">
            {t(
              category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""),
              category.nameEn?.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "") || category.name
            )}
          </h1>
        </div>
        <p className="mt-2 leading-relaxed text-muted-foreground">{t(category.description, category.descriptionEn)}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catTools.map((tool) => (
            <Link
              key={tool.id}
              to={`${prefix}/tool/${tool.slug}`}
              className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <ToolLogo tool={tool} size={36} />
                <div>
                  <h3 className="font-semibold group-hover:text-primary">{tool.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}</p>
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
