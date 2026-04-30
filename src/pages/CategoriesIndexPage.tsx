import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { getCategoryIcon } from "@/lib/categoryIcons";
import Breadcrumb from "@/components/Breadcrumb";
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
      <section className="border-b border-border bg-gradient-to-br from-accent/60 via-background to-accent/30">
        <div className="container mx-auto max-w-6xl px-4 pb-8 pt-10 md:pt-14">
          <div className="mb-5">
            <Breadcrumb items={[
              { label: t("Outils", "Tools"), href: `${prefix}/tools` },
              { label: t("Catégories", "Categories") },
            ]} />
          </div>
          <div className="flex items-center gap-2 text-primary mb-3">
            <LayoutGrid className="h-4 w-4" />
            <span className="label-section">{t("Catégories", "Categories")}</span>
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 600, letterSpacing: "-0.022em" }}>
            {t("Toutes les catégories d'outils", "All tool categories")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t(
              `${categories.length} catégories couvrant ${tools.length}+ outils SaaS. Explorez par usage pour trouver l'outil parfait.`,
              `${categories.length} categories covering ${tools.length}+ SaaS tools. Browse by use case to find the perfect tool.`
            )}
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(cat => {
            const Icon = getCategoryIcon(cat.id);
            const count = tools.filter(t => t.categoryId === cat.id).length;
            const catName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
            const freeCount = tools.filter(t => t.categoryId === cat.id && t.defaultMonthlyPrice === 0).length;

            return (
              <Link key={cat.id} to={`${prefix}/category/${cat.slug}`}
                className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
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
