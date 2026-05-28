import { Link } from "react-router-dom";
import type { Tool } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";
import { Puzzle, Package, ArrowRight } from "lucide-react";

interface Props {
  tool: Tool;
  allTools: Tool[];
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
}

export default function ToolPluginsBlock({ tool, allTools, prefix, lang, t }: Props) {
  const toolId = (tool as any).slug || tool.id;
  const toolType = (tool as any).tool_type as string;
  const hostAppSlug = (tool as any).host_app as string | undefined;
  const bundleParentSlug = (tool as any).bundle_parent as string | undefined;

  // Bidirectional slug matching: "after-effects" matches "adobe-after-effects"
  // because adobe-after-effects ends with "-after-effects"
  function slugMatches(toolSlug: string, hostValue: string): boolean {
    return toolSlug === hostValue ||
      toolSlug.endsWith(`-${hostValue}`) ||
      toolSlug.replace(/^[^-]+-/, "") === hostValue; // strip first segment: adobe-after-effects → after-effects
  }

  // ── Case 1: this tool is a plugin/satellite — find the host app
  const hostApp = hostAppSlug
    ? allTools.find(t => slugMatches((t as any).slug || t.id, hostAppSlug))
    : null;

  // ── Case 2: this tool is a host — find all its plugins
  // Match plugins whose host_app matches this tool's slug (either exact or prefix-stripped)
  const childPlugins = allTools
    .filter(t => {
      const ha = (t as any).host_app as string | undefined;
      if (!ha) return false;
      return (t as any).tool_type === "plugin" && slugMatches(toolId, ha);
    })
    .slice(0, 8);

  // ── Case 3: this tool is part of a bundle
  const bundleParent = bundleParentSlug
    ? allTools.find(t => (t as any).slug === bundleParentSlug || (t as any).id === bundleParentSlug)
    : null;

  // Also: sibling tools in the same bundle
  const bundleSiblings = bundleParentSlug
    ? allTools
        .filter(t => (t as any).bundle_parent === bundleParentSlug && t.id !== tool.id)
        .slice(0, 5)
    : [];

  const hasAnyContent = hostApp || childPlugins.length > 0 || bundleParent;
  if (!hasAnyContent) return null;

  return (
    <div className="td-section" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ── Case 1: Plugin → show host app ── */}
      {hostApp && (
        <div>
          <span className="td-subhead">
            {toolType === "satellite" ? t("Prérequis", "Requires") : t("Fonctionne avec", "Works with")}
          </span>
          <h2 className="td-subtitle">
            {toolType === "satellite"
              ? t(`${tool.name} s'intègre dans`, `${tool.name} integrates with`)
              : t(`${tool.name} est un plugin pour`, `${tool.name} is a plugin for`)}
          </h2>

          <Link to={`${prefix}/tool/${(hostApp as any).slug || hostApp.id}`} className="td-tile">
            <ToolLogo tool={hostApp as any} size={44} className="rounded-xl shrink-0" />
            <div className="td-tile-body">
              <p className="td-tile-title">{hostApp.name}</p>
              <p className="td-tile-sub">
                {lang === "en" && (hostApp as any).shortDescriptionEn
                  ? (hostApp as any).shortDescriptionEn
                  : hostApp.shortDescription}
              </p>
            </div>
            <ArrowRight className="td-tile-arrow" />
          </Link>
        </div>
      )}

      {/* ── Case 3: Bundle child ── */}
      {bundleParent && (
        <div>
          <span className="td-subhead">
            <Package />
            {t("Inclus dans", "Included in")}
          </span>

          <Link to={`${prefix}/tool/${(bundleParent as any).slug || bundleParent.id}`} className="td-tile">
            <ToolLogo tool={bundleParent as any} size={36} className="rounded-lg shrink-0" />
            <div className="td-tile-body">
              <p className="td-tile-title">{bundleParent.name}</p>
              <p className="td-tile-sub">{t("Voir le bundle complet", "View full bundle")}</p>
            </div>
            <ArrowRight className="td-tile-arrow" />
          </Link>

          {bundleSiblings.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <span className="td-subhead" style={{ marginBottom: 10 }}>
                {t("Autres outils du bundle", "Other tools in bundle")}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {bundleSiblings.map(s => (
                  <Link key={s.id} to={`${prefix}/tool/${(s as any).slug || s.id}`} className="td-chip">
                    <ToolLogo tool={s as any} size={14} className="rounded" />
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Case 2: Host tool → show plugins ── */}
      {childPlugins.length > 0 && (
        <div>
          <span className="td-subhead">
            <Puzzle />
            {t("Plugins & extensions", "Plugins & extensions")}
          </span>
          <h2 className="td-subtitle">
            {t(`Extensions disponibles pour ${tool.name}`, `Available extensions for ${tool.name}`)}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {childPlugins.map(p => (
              <Link
                key={p.id}
                to={`${prefix}/tool/${(p as any).slug || p.id}`}
                className="td-tile"
                style={{ alignItems: "flex-start" }}
              >
                <ToolLogo tool={p as any} size={32} className="rounded-lg shrink-0" />
                <div className="td-tile-body">
                  <p className="td-tile-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </p>
                  <p className="td-tile-sub" style={{ whiteSpace: "normal", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {lang === "en" && (p as any).shortDescriptionEn
                      ? (p as any).shortDescriptionEn
                      : p.shortDescription}
                  </p>
                  {(p as any).defaultMonthlyPrice === 0 ? (
                    <span style={{ marginTop: 6, display: "inline-block", fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-strong)" }}>
                      {t("Gratuit", "Free")}
                    </span>
                  ) : (p as any).defaultMonthlyPrice > 0 ? (
                    <span style={{ marginTop: 6, display: "inline-block", fontFamily: "var(--font-mono, ui-monospace)", fontSize: 11, color: "var(--color-muted)" }}>
                      {Math.round((p as any).defaultMonthlyPrice)}€/{t("mois", "mo")}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
