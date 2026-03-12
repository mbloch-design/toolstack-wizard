import { useParams, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { tools, categories } from "@/data/content";
import { ArrowLeft, ExternalLink, Check, X } from "lucide-react";

const ToolDetailPage = () => {
  const { t, prefix } = useLang();
  const { slug } = useParams();
  const tool = tools.find((t) => t.slug === slug);

  if (!tool) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{t("Outil non trouvé.", "Tool not found.")}</p>
        <Link to={`${prefix}/tools`} className="mt-4 inline-block text-primary hover:underline">{t("Retour au catalogue", "Back to catalog")}</Link>
      </div>
    );
  }

  const category = categories.find((c) => c.id === tool.categoryId);
  const alternatives = tools.filter((t) => t.categoryId === tool.categoryId && t.id !== tool.id).slice(0, 3);

  return (
    <div className="py-12">
      <div className="container mx-auto max-w-3xl">
        <Link to={`${prefix}/tools`} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("Retour au catalogue", "Back to catalog")}
        </Link>

        <div className="flex items-start gap-4">
          <span className="text-4xl">{tool.logo}</span>
          <div>
            <h1 className="font-heading text-3xl font-bold">{tool.name}</h1>
            {category && (
              <Link to={`${prefix}/category/${category.slug}`} className="mt-1 inline-block text-sm text-primary hover:underline">
                {t(category.name, category.nameEn)}
              </Link>
            )}
          </div>
        </div>

        <p className="mt-6 text-lg text-muted-foreground">{tool.description}</p>

        {/* Pricing */}
        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">{t("Tarification", "Pricing")}</h2>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              tool.pricing === "free" ? "bg-accent text-accent-foreground" :
              tool.pricing === "freemium" ? "bg-secondary text-secondary-foreground" :
              "bg-muted text-muted-foreground"
            }`}>
              {tool.pricing === "free" ? t("Gratuit", "Free") : tool.pricing === "freemium" ? "Freemium" : t("Payant", "Paid")}
            </span>
            {tool.defaultMonthlyPrice > 0 && (
              <span className="text-sm text-muted-foreground">{t("À partir de", "From")} <strong>{tool.defaultMonthlyPrice}€/{t("mois", "mo")}</strong></span>
            )}
          </div>
        </div>

        {/* Verdict */}
        <div className="mt-6 rounded-xl border border-primary/20 bg-accent/50 p-5">
          <h2 className="font-heading text-lg font-semibold">{t("Notre verdict", "Our verdict")}</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p><span className="font-medium text-keep">✓ {t("Gardez si :", "Keep if:")}</span> {tool.verdict.keepIf}</p>
            <p><span className="font-medium text-cancel">✗ {t("Évitez si :", "Avoid if:")}</span> {tool.verdict.avoidIf}</p>
            <p><span className="font-medium">📊 {t("Seuil :", "Threshold:")}</span> {tool.verdict.threshold}</p>
          </div>
        </div>

        {/* Pros/Cons */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-keep/20 bg-card p-5">
            <h3 className="font-heading font-semibold text-keep">{t("Avantages", "Pros")}</h3>
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
            <h3 className="font-heading font-semibold text-cancel">{t("Inconvénients", "Cons")}</h3>
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
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("Essayer", "Try")} {tool.name} <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading text-xl font-bold">{t("Alternatives", "Alternatives")}</h2>
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
