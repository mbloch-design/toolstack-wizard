import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb = ({ items }: BreadcrumbProps) => {
  const { prefix } = useLang();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
      <Link to={prefix} className="shrink-0 hover:text-foreground transition-colors">
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
