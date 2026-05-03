import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { getCategoryIcon } from "@/lib/categoryIcons";
import PageHero from "@/components/PageHero";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import { LayoutGrid } from "lucide-react";

const CategoriesIndexPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();

  useEffect(() => {
    const title = lang === "fr"
      ? `${categories.length} catégories d'outils SaaS — ToolTrim`
      : `${categories.length} SaaS tool categories — ToolTrim`;
    const desc = lang === "fr"
      ? `Explorez ${categories.length} catégories d'outils SaaS : IA, gestion de projet, communication, design et plus. Trouvez les meilleurs outils par usage.`
      : `Explore ${categories.length} SaaS tool categories: AI, project management, communication, design and more. Find the best tools by use case.`;
    const url = `https://tooltrim.com/${lang}/category`;

    setSeoTags({ title, description: desc, url });
    setHreflang(`/${lang}/category`);
    setJsonLd("cats-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description: desc,
      url,
    });
    return () => cleanupSeo(["cats-jsonld"]);
  }, [lang, categories.length]);

  return (
    <div className="min-h-screen">
      <PageHero
        breadcrumb={[
          { label: t("Outils", "Tools"), href: `${prefix}/tools` },
          { label: t("Catégories", "Categories") },
        ]}
        eyebrow={t("Catégories", "Categories")}
        icon={<LayoutGrid className="h-3.5 w-3.5" />}
        title={t("Toutes les catégories d'outils", "All tool categories")}
        description={t(
          `${categories.length} catégories couvrant ${tools.length}+ outils SaaS. Explorez par usage pour trouver l'outil parfait.`,
          `${categories.length} categories covering ${tools.length}+ SaaS tools. Browse by use case to find the perfect tool.`
        )}
        stats={[
          { value: categories.length, label: t("catégories", "categories") },
          { value: tools.length, label: t("outils", "tools"), tone: "primary" },
        ]}
      />

      <section className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(cat => {
            const Icon = getCategoryIcon(cat.id);
            const count = tools.filter(t => t.categoryId === cat.id).length;
            const catName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
            const freeCount = tools.filter(t => t.categoryId === cat.id && t.defaultMonthlyPrice === 0).length;

            return (
              <Link key={cat.id} to={`${prefix}/category/${cat.slug}`}
                className="surface-card-hover group p-6">
                <div className="flex items-start gap-4">
                  <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold tracking-tighter group-hover:text-primary">
                      {t(catName, cat.nameEn || catName)}
                    </h2>
                    {cat.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t(cat.description, cat.descriptionEn)}</p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <span className="font-semibold">{count} {t("outils", "tools")}</span>
                      {freeCount > 0 && (
                        <span className="text-primary">{freeCount} {t("gratuits", "free")}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default CategoriesIndexPage;
