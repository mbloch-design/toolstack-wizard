import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { SEO_BASE } from "@/lib/seo";

/**
 * Auto-referencing canonical: every page points to itself.
 * Strips trailing slashes and query params. Forces "www" domain.
 */
export default function DynamicCanonical() {
  const { pathname } = useLocation();
  const clean = pathname.replace(/\/+$/, "") || "";
  const canonical = `${SEO_BASE}${clean}`;

  return (
    <Helmet>
      <link rel="canonical" href={canonical} />
    </Helmet>
  );
}
