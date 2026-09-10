import { Helmet } from "react-helmet-async";
import { useLang } from "@/hooks/useLang";
import { SEO_BASE } from "@/lib/seo";
import { useTopbarBreadcrumb } from "@/contexts/TopbarBreadcrumbContext";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /**
   * Whether to include "ToolTrim" (home) as the implicit first item.
   * Default true. Pass false when the page is itself the home (rare).
   */
  includeHome?: boolean;
  /** Custom label for the home item. Defaults to "ToolTrim". */
  homeLabel?: string;
  /**
   * Disable JSON-LD when the parent page already publishes its canonical
   * BreadcrumbList. This prevents duplicate and potentially divergent schemas.
   */
  includeSchema?: boolean;
}

/**
 * Editorial breadcrumb.
 *
 * The visual trail now lives in the sticky topbar (AppShellV2), not in the
 * page body — this component registers `items` there via context and only
 * renders the Schema.org BreadcrumbList JSON-LD for SEO.
 */
const Breadcrumb = ({ items, includeHome = true, homeLabel, includeSchema = true }: BreadcrumbProps) => {
  const { lang, prefix } = useLang();

  // Schema items: home + provided items (canonical for crawlers).
  const home = includeHome ? [{ label: homeLabel ?? "ToolTrim", href: `/${lang}` }] : [];
  const schemaItems = [...home, ...items];
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
      if (item.href && !isLast) entry.item = `${SEO_BASE}${item.href}`;
      return entry;
    }),
  };

  // Topbar items: home link (if requested) + provided items.
  const topbarItems: BreadcrumbItem[] = [
    ...(includeHome ? [{ label: homeLabel ?? "ToolTrim", href: prefix || `/${lang}` }] : []),
    ...items,
  ];
  useTopbarBreadcrumb(topbarItems);

  if (!includeSchema) return null;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default Breadcrumb;
