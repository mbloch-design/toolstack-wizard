import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   EditorialSection — universal content section wrapper for ToolTrim
   Uses es-* CSS system. No gradients. No soft shadows.
   Border + typography + tight grid only.
───────────────────────────────────────────────────────────────────────────── */

export interface EditorialSectionProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  cta?: { label: string; href: string };
  /** default = off-white #F8F8F4, white = pure white, band = #EDEDE8 CTA band */
  variant?: "default" | "white" | "band";
  children: ReactNode;
  id?: string;
}

export function EditorialSection({
  eyebrow,
  title,
  description,
  cta,
  variant = "default",
  children,
  id,
}: EditorialSectionProps) {
  const sectionCls =
    variant === "band"
      ? "es-section es-section--band"
      : variant === "white"
      ? "es-section es-section--white"
      : "es-section";

  return (
    <section className={sectionCls} id={id}>
      <div className="es-container">
        {(eyebrow || title || description || cta) && (
          <div className="es-header">
            <div>
              {eyebrow && <span className="es-eyebrow">{eyebrow}</span>}
              <h2 className="es-title">{title}</h2>
              {description && <p className="es-description">{description}</p>}
            </div>
            {cta && (
              <Link to={cta.href} className="es-cta-link">
                {cta.label}
                <ArrowRight style={{ width: 14, height: 14, flexShrink: 0 }} />
              </Link>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export default EditorialSection;
