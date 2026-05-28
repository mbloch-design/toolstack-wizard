import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import Breadcrumb from "./Breadcrumb";

/* ─────────────────────────────────────────────────────────────────────────────
   EditorialHero — universal page hero for ToolTrim
   - Default: left-aligned, internal-page padding (88px/72px)
   - centered: homepage layout (96px/80px, center-aligned)
   - compact: smaller title + reduced padding (tool/category pages)
   - rightModule: shows a contextual module in the right column on desktop
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
  /** Center-aligns content — homepage only */
  centered?: boolean;
  /** Compact size — tool detail / category pages */
  compact?: boolean;
  /** Custom content below CTAs */
  children?: ReactNode;
  /** Contextual module — renders in right column on desktop */
  rightModule?: ReactNode;
}

/* ── CTA button ──────────────────────────────────────────────────────────── */
function CtaButton({ cta, variant }: { cta: HeroCtaProps; variant: "primary" | "secondary" }) {
  const cls = variant === "primary" ? "eh-cta-primary" : "eh-cta-secondary";
  if (cta.href) {
    return <Link to={cta.href} className={cls}>{cta.label}</Link>;
  }
  return (
    <button type="button" onClick={cta.onClick} className={cls}>
      {cta.label}
    </button>
  );
}

/* ── Breadcrumb ──────────────────────────────────────────────────────────── */
// Delegates to the shared editorial Breadcrumb so any consumer of
// EditorialHero gets the same ▪ TOOLTRIM / [section] publication mark
// signature as the rest of the site. No local styling.
const HeroBreadcrumb = ({ items }: { items: { label: string; href?: string }[] }) => (
  <div style={{ marginBottom: 24 }}>
    <Breadcrumb items={items} />
  </div>
);

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
  rightModule,
}: EditorialHeroProps) {
  const rootCls = [
    "eh-root",
    centered ? "eh-root--centered" : "",
    compact  ? "eh-root--compact"  : "",
  ].filter(Boolean).join(" ");

  const hasCta = primaryCta || secondaryCta;
  const has2Col = !!rightModule && !centered;

  const mainContent = (
    <>
      {breadcrumb && breadcrumb.length > 0 && <HeroBreadcrumb items={breadcrumb} />}
      {eyebrow && <span className="eh-eyebrow">{eyebrow}</span>}
      {badge && <div><span className="eh-badge">{badge}</span></div>}
      <h1 className="eh-title">{title}</h1>
      {description && <p className="eh-description">{description}</p>}
      {hasCta && (
        <div className="eh-cta-group">
          {primaryCta && <CtaButton cta={primaryCta} variant="primary" />}
          {secondaryCta && <CtaButton cta={secondaryCta} variant="secondary" />}
        </div>
      )}
      {children && <div className="eh-body">{children}</div>}
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
    </>
  );

  return (
    <section className={rootCls}>
      <div className="eh-container">
        {has2Col ? (
          <div className="eh-layout-2col">
            <div className="eh-layout-left">{mainContent}</div>
            <div className="eh-layout-right">{rightModule}</div>
          </div>
        ) : (
          mainContent
        )}
      </div>
    </section>
  );
}

export default EditorialHero;
