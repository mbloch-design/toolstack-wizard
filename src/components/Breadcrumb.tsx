import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useLang } from "@/hooks/useLang";
import { SEO_BASE } from "@/lib/seo";

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
}

/**
 * Editorial breadcrumb — publication-mark signature pattern.
 *
 * Renders as:
 *   ▪  TOOLTRIM  /  Parent  /  Current
 *      └── monospace uppercase tracked links ──┘  └─ sans-serif bold ─┘
 *
 * The visual chrome is owned by .cp-breadcrumb CSS so every page that
 * imports this component gets the same signature with zero per-page
 * styling. Direct children only (no wrapper spans) so the CSS selectors
 * (> a, > span:last-child) target the right nodes.
 *
 * Keeps Schema.org BreadcrumbList JSON-LD for SEO.
 */
const Breadcrumb = ({ items, includeHome = true, homeLabel }: BreadcrumbProps) => {
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

  // Visible items: home link (if requested) + provided items.
  // Built as a flat array so each element is a direct child of <nav>.
  const visibleItems: BreadcrumbItem[] = [
    ...(includeHome ? [{ label: homeLabel ?? "ToolTrim", href: prefix || `/${lang}` }] : []),
    ...items,
  ];

  return (
    <nav aria-label="Breadcrumb" className="cp-breadcrumb">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      {visibleItems.flatMap((item, i) => {
        const isLast = i === visibleItems.length - 1;
        const sep = i > 0 ? [<span key={`sep-${i}`}>/</span>] : [];
        const node = item.href && !isLast
          ? <Link key={`l-${i}`} to={item.href}>{item.label}</Link>
          : <span key={`s-${i}`}>{item.label}</span>;
        return [...sep, node];
      })}
    </nav>
  );
};

export default Breadcrumb;
