import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useLang } from "@/hooks/useLang";
import { ChevronRight, Home } from "lucide-react";
import { SEO_BASE } from "@/lib/seo";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb = ({ items }: BreadcrumbProps) => {
  const { lang, prefix, t } = useLang();

  // BreadcrumbList JSON-LD — Home + items, with absolute URLs.
  // For the trailing item without href, omit `item` (Google convention for current page).
  const homeLabel = t("Accueil", "Home");
  const schemaItems = [
    { label: homeLabel, href: `/${lang}` },
    ...items,
  ];
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: schemaItems.map((item, index) => {
      const isLast = index === schemaItems.length - 1;
      const entry: Record<string, unknown> = {
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
      };
      if (item.href && !isLast) {
        entry.item = `${SEO_BASE}${item.href}`;
      }
      return entry;
    }),
  };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <Link to={prefix} className="shrink-0 hover:text-foreground transition-colors" aria-label={homeLabel}>
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
          {item.href ? (
            <Link to={item.href} className="truncate hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="truncate text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb;
