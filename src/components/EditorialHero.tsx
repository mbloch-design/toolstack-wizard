import { Link } from "react-router-dom";
import type { ReactNode } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   EditorialHero — universal page hero for ToolTrim
   Replaces the old PageHero (dotted grid + blue gradient) across all pages.
   Uses only typography, spacing and thin borders — no decorative visuals.
───────────────────────────────────────────────────────────────────────────── */

export interface HeroCtaProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface HeroMetaItem {
  label: string;
  value: string | number;
}

export interface EditorialHeroProps {
  /** 12px uppercase label above the title */
  eyebrow?: string;
  /** Small quiet pill badge */
  badge?: string;
  /** Main headline — can include <br /> or JSX for line breaks */
  title: ReactNode;
  /** Optional blue-accented word or phrase injected into the title */
  titleAccent?: string;
  /** Subtitle / description */
  description?: ReactNode;
  /** Dark filled CTA */
  primaryCta?: HeroCtaProps;
  /** Ghost CTA */
  secondaryCta?: HeroCtaProps;
  /** Metadata bar — rendered below a divider */
  meta?: HeroMetaItem[];
  /** Breadcrumb trail */
  breadcrumb?: { label: string; href?: string }[];
  /** Center-aligns content — for homepage only */
  centered?: boolean;
  /** Compact size — for category / tool detail pages */
  compact?: boolean;
  /** Custom content below description + CTAs (e.g. search bar) */
  children?: ReactNode;
}

/* ── Helper: CTA button ──────────────────────────────────────────────────── */
function CtaButton({
  cta,
  variant,
}: {
  cta: HeroCtaProps;
  variant: "primary" | "secondary";
}) {
  const cls = variant === "primary" ? "eh-cta-primary" : "eh-cta-secondary";
  if (cta.href) {
    return (
      <Link to={cta.href} className={cls}>
        {cta.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={cta.onClick} className={cls}>
      {cta.label}
    </button>
  );
}

/* ── Helper: Breadcrumb ──────────────────────────────────────────────────── */
function HeroBreadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-8 flex items-center gap-2"
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: 14,
        color: "#6F6F68",
      }}
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && (
            <span aria-hidden style={{ color: "#DADAD4", fontSize: 12 }}>
              /
            </span>
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="transition-opacity hover:opacity-70"
              style={{ color: "#6F6F68", textDecoration: "none" }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "#222222" }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export function EditorialHero({
  eyebrow,
  badge,
  title,
  description,
  primaryCta,
  secondaryCta,
  meta,
  breadcrumb,
  centered = false,
  compact = false,
  children,
}: EditorialHeroProps) {
  const rootCls = [
    "eh-root",
    centered ? "eh-root--centered" : "",
    compact  ? "eh-root--compact"  : "",
  ]
    .filter(Boolean)
    .join(" ");

  const hasCta = primaryCta || secondaryCta;

  return (
    <section className={rootCls}>
      <div className="eh-container">
        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 0 && (
          <HeroBreadcrumb items={breadcrumb} />
        )}

        {/* Eyebrow */}
        {eyebrow && <span className="eh-eyebrow">{eyebrow}</span>}

        {/* Badge */}
        {badge && <div><span className="eh-badge">{badge}</span></div>}

        {/* Title */}
        <h1 className="eh-title">{title}</h1>

        {/* Description */}
        {description && (
          <p className="eh-description">{description}</p>
        )}

        {/* CTA group */}
        {hasCta && (
          <div className="eh-cta-group">
            {primaryCta && (
              <CtaButton cta={primaryCta} variant="primary" />
            )}
            {secondaryCta && (
              <CtaButton cta={secondaryCta} variant="secondary" />
            )}
          </div>
        )}

        {/* Custom children (search, filters, etc.) */}
        {children && <div className="eh-body">{children}</div>}

        {/* Metadata bar */}
        {meta && meta.length > 0 && (
          <div className="eh-meta">
            {meta.map((item) => (
              <div key={item.label} className="eh-meta-item">
                <span className="eh-meta-label">{item.label}</span>
                <span className="eh-meta-value">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default EditorialHero;
