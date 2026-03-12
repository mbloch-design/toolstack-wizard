import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolBySlug, useTools, useCategories } from "@/hooks/useSupabaseData";
import { ArrowLeft, ExternalLink, Check, X } from "lucide-react";

const ToolDetailPage = () => {
  const { t, prefix } = useLang();
  const { slug } = useParams();
  const { tool, loading } = useToolBySlug(slug);
  const { tools } = useTools();
  const { categories } = useCategories();

  if (loading) {
    return <div className="container py-20 text-center text-muted-foreground">Chargement...</div>;
  }

  if (!tool) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{t("Outil non trouvé.", "Tool not found.")}</p>
        <Link to={`${prefix}/tools`} className="mt-4 inline-block text-primary hover:underline">{t("Retour au catalogue", "Back to catalog")}</Link>
      </div>
    );
  }

  const category = categories.find((c: any) => c.id === tool.categoryId);
  const alternatives = tools.filter((t: any) => t.categoryId === tool.categoryId && t.id !== tool.id).slice(0, 3);

  return (
    <div className="py-12">
      <div className="container mx-auto max-w-3xl">
        <Link to={`${prefix}/tools`} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("Retour au catalogue", "Back to catalog")}
        </Link>

        <div className="flex items-start gap-4">
          <span className="text-4xl">{tool.logo}</span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter">{tool.name}</h1>
            {category && (
              <Link to={`${prefix}/category/${category.slug}`} className="mt-1 inline-block text-sm text-primary hover:underline">
                {t(category.name, category.nameEn)}
              </Link>
            )}
          </div>
        </div>

        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{tool.longDescription || tool.description || tool.shortDescription}</p>

        {/* Pricing */}
        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-tighter">{t("Tarification", "Pricing")}</h2>
          <div className="mt-3 space-y-2">
            {tool.pricing?.free && (
              <p className="text-sm"><span className="font-medium text-keep">✓ {t("Gratuit :", "Free:")}</span> {tool.pricing.free}</p>
            )}
            {tool.pricing?.paid && (
              <p className="text-sm"><span className="font-medium text-primary">💳 {t("Payant :", "Paid:")}</span> {tool.pricing.paid}</p>
            )}
            {tool.defaultMonthlyPrice > 0 && (
              <p className="text-sm text-muted-foreground">{t("À partir de", "From")} <strong>{tool.defaultMonthlyPrice}€/{t("mois", "mo")}</strong></p>
            )}
          </div>
        </div>

        {/* Verdict */}
        <div className="mt-6 rounded-xl border border-primary/20 bg-accent/50 p-5">
          <h2 className="text-lg font-semibold tracking-tighter">{t("Notre verdict", "Our verdict")}</h2>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <span className="font-medium text-keep">✓ {t("Gardez si :", "Keep if:")}</span>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                {(Array.isArray(tool.verdict.keepIf) ? tool.verdict.keepIf : [tool.verdict.keepIf]).map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-medium text-cancel">✗ {t("Évitez si :", "Avoid if:")}</span>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                {(Array.isArray(tool.verdict.avoidIf) ? tool.verdict.avoidIf : [tool.verdict.avoidIf]).map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <p><span className="font-medium">📊 {t("Seuil :", "Threshold:")}</span> {tool.verdict.threshold}</p>
          </div>
        </div>

        {/* Pros/Cons */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-keep/20 bg-card p-5">
            <h3 className="font-semibold text-keep">{t("Avantages", "Pros")}</h3>
            <ul className="mt-3 space-y-2">
              {tool.pros.map((pro) => (
                <li key={pro} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-keep" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-cancel/20 bg-card p-5">
            <h3 className="font-semibold text-cancel">{t("Inconvénients", "Cons")}</h3>
            <ul className="mt-3 space-y-2">
              {tool.cons.map((con) => (
                <li key={con} className="flex items-start gap-2 text-sm">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-cancel" />
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Links */}
        <div className="mt-6 flex gap-3">
          <a
            href={tool.affiliateLink || tool.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/85"
          >
            {t("Essayer", "Try")} {tool.name} <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold tracking-tighter">{t("Alternatives", "Alternatives")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {alternatives.map((alt) => (
                <Link
                  key={alt.id}
                  to={`${prefix}/tool/${alt.slug}`}
                  className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
                >
                  <span className="text-xl">{alt.logo}</span>
                  <p className="mt-2 font-semibold group-hover:text-primary">{alt.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{alt.defaultMonthlyPrice > 0 ? `${alt.defaultMonthlyPrice}€/${t("mois", "mo")}` : t("Gratuit", "Free")}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolDetailPage;
