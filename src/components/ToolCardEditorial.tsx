import { Link } from "react-router-dom";
import { Compass, Pencil } from "lucide-react";
import PinToolButton from "@/components/PinToolButton";
import ToolCardImage from "@/components/tool/ToolCardImage";
import ToolLogo from "@/components/ToolLogo";
import { getToolPresentation } from "@/lib/toolPresentation";
import type { Tool } from "@/data/types";

/* ─────────────────────────────────────────────────────────────────────────────
   ToolCardEditorial — main catalog grid card (ToolsPage).
   Kept deliberately minimal: at the browsing/discovery stage a visitor needs
   just enough to decide whether to click through, not the full fiche. Cover
   image, name, category, one line of "why", price, CTA.
───────────────────────────────────────────────────────────────────────────── */

export type ToolCardEditorialTool = Pick<
  Tool,
  | "id"
  | "name"
  | "categoryId"
  | "shortDescription"
  | "pricing"
  | "defaultMonthlyPrice"
  | "affiliateLink"
> & Partial<Pick<
  Tool,
  | "slug"
  | "shortDescriptionEn"
  | "websiteUrl"
  | "ogImageUrl"
  | "logo"
  | "pricing_v5"
>>;

interface ToolCardEditorialProps {
  tool: ToolCardEditorialTool;
  prefix: string;
  t: (fr: string, en: string) => string;
  categoryLabel?: string;
  lang?: "fr" | "en";
  variant?: "media" | "decision";
  showPin?: boolean;
  to?: string;
  linkState?: unknown;
  selected?: boolean;
  showPrice?: boolean;
  typeLabel?: string;
  contextRole?: string;
  contextLabel?: string;
  exploreHref?: string;
  exploreState?: unknown;
  onOrganize?: () => void;
  mediaClassName?: string;
}

interface CardHoverActionsProps {
  tool: ToolCardEditorialTool;
  t: ToolCardEditorialProps["t"];
  exploreHref?: string;
  exploreState?: unknown;
  showPin: boolean;
  onOrganize?: () => void;
}

function CardHoverActions({ tool, t, exploreHref, exploreState, showPin, onOrganize }: CardHoverActionsProps) {
  return (
    <div className="tce-hover-actions" aria-label={t(`Actions pour ${tool.name}`, `Actions for ${tool.name}`)}>
      {exploreHref && (
        <Link
          to={exploreHref}
          state={exploreState}
          className="tce-hover-action"
          aria-label={t(`Explorer autour de ${tool.name}`, `Explore around ${tool.name}`)}
          title={t("Explorer autour", "Explore around")}
        >
          <Compass size={20} aria-hidden />
        </Link>
      )}
      {onOrganize && (
        <button
          type="button"
          className="tce-hover-action"
          onClick={onOrganize}
          aria-label={t(`Modifier l’organisation de ${tool.name}`, `Edit ${tool.name} organization`)}
          title={t("Modifier l’organisation", "Edit organization")}
        >
          <Pencil size={19} aria-hidden />
        </button>
      )}
      {showPin && (
        <PinToolButton
          slug={tool.slug ?? tool.id}
          label={tool.name}
          t={t}
          compact
          inline
          labelMode="icon"
        />
      )}
    </div>
  );
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function ToolCardEditorial({
  tool,
  prefix,
  t,
  categoryLabel,
  lang = "fr",
  variant = "media",
  showPin = true,
  to,
  linkState,
  selected = false,
  showPrice = true,
  typeLabel,
  contextRole,
  contextLabel,
  exploreHref,
  exploreState,
  onOrganize,
  mediaClassName = "",
}: ToolCardEditorialProps) {
  const presentation = getToolPresentation(tool, lang);
  const plan = presentation.planLabel;
  const decision = variant === "decision";

  const description = presentation.description;

  const toolHref = to || `${prefix}/tool/${tool.slug ?? tool.id}`;

  /* Stack cards are interaction-heavy and intentionally remain compact.
     The catalog variant below adopts a media-card anatomy: thumbnail first,
     then logo + identity + contextual actions, like a useful editorial
     equivalent of a YouTube card. */
  if (decision) {
    return (
      <div className="tool-pin-wrap tool-pin-wrap--compact">
        {showPin && <PinToolButton slug={tool.slug ?? tool.id} label={tool.name} t={t} compact labelMode="short" />}
        <Link
          to={toolHref}
          state={linkState}
          className={`tce-card tce-card--compact${selected ? " is-selected" : ""}`}
          aria-current={selected ? "true" : undefined}
        >
          <ToolCardImage tool={tool} logoSize={36} />
          <div className="tce-body">
            <div className="tce-title-row">
              <h3 className="tce-name">{tool.name}</h3>
              {showPrice && <span className="tce-price">{plan}</span>}
            </div>
            {(typeLabel || categoryLabel) && <p className="tce-category">{typeLabel || categoryLabel}</p>}
            {description && <p className="tce-compact-description">{description}</p>}
            {contextRole && (
              <p className="tce-context-role">
                <span>{contextLabel || t("Sert à", "Used to")}</span>
                <strong>{contextRole}</strong>
              </p>
            )}
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="tool-pin-wrap">
      <article className={`tce-card tce-card--media${selected ? " is-selected" : ""}`}>
        <Link
          className="tce-primary-link"
          to={toolHref}
          state={linkState}
          aria-label={t(`Voir la fiche de ${tool.name}`, `View ${tool.name}`)}
          aria-current={selected ? "true" : undefined}
        />

        <div className="tce-cover">
          <ToolCardImage
            tool={tool}
            logoSize={44}
            className={mediaClassName}
            overlayMode="static"
            overlay={(
              <div className="tce-cover-meta">
                {showPrice && plan !== "N/A" && <span className="tce-cover-price">{plan}</span>}
              </div>
            )}
          />
          {(exploreHref || showPin || onOrganize) && (
            <CardHoverActions
              tool={tool}
              t={t}
              exploreHref={exploreHref}
              exploreState={exploreState}
              showPin={showPin}
              onOrganize={onOrganize}
            />
          )}
        </div>

        <div className="tce-body">
          <div className="tce-identity-row">
            <div className="tce-identity-link">
              <ToolLogo tool={tool} size={24} className="tce-logo" />
              <div className="tce-identity-copy">
                <h3 className="tce-name">{tool.name}</h3>
                {(typeLabel || categoryLabel) && <span className="tce-category">{typeLabel || categoryLabel}</span>}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export default ToolCardEditorial;
