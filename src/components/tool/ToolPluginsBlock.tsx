import { Link } from "react-router-dom";
import type { Tool } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";
import { Puzzle, Package, ArrowRight, Layers } from "lucide-react";

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
    <div className="py-8 space-y-6">

      {/* ── Case 1: Plugin → show host app ── */}
      {hostApp && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
            {toolType === "satellite"
              ? t("Prérequis", "Requires")
              : t("Fonctionne avec", "Works with")}
          </p>
          <h2 className="font-display mb-4 text-foreground" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
            {toolType === "satellite"
              ? t(`${tool.name} s'intègre dans`, `${tool.name} integrates with`)
              : t(`${tool.name} est un plugin pour`, `${tool.name} is a plugin for`)}
          </h2>

          <Link
            to={`${prefix}/tool/${(hostApp as any).slug || hostApp.id}`}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
          >
            <ToolLogo tool={hostApp as any} size={48} className="rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                {hostApp.name}
              </p>
              <p className="text-sm mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}>
                {lang === "en" && (hostApp as any).shortDescriptionEn
                  ? (hostApp as any).shortDescriptionEn
                  : hostApp.shortDescription}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>
      )}

      {/* ── Case 3: Bundle child ── */}
      {bundleParent && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              {t("Inclus dans", "Included in")}
            </span>
          </p>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Bundle parent */}
            <Link
              to={`${prefix}/tool/${(bundleParent as any).slug || bundleParent.id}`}
              className="group flex items-center gap-3 px-4 py-3.5 border-b border-border hover:bg-muted/30 transition-colors"
            >
              <ToolLogo tool={bundleParent as any} size={32} className="rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {bundleParent.name}
                </p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {t("Voir le bundle complet", "View full bundle")}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Link>

            {/* Siblings */}
            {bundleSiblings.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {t("Autres outils du bundle", "Other tools in bundle")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {bundleSiblings.map(s => (
                    <Link
                      key={s.id}
                      to={`${prefix}/tool/${(s as any).slug || s.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium transition-all hover:border-primary/30 hover:text-primary"
                    >
                      <ToolLogo tool={s as any} size={14} className="rounded" />
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Case 2: Host tool → show plugins ── */}
      {childPlugins.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
            <span className="inline-flex items-center gap-1.5">
              <Puzzle className="h-3.5 w-3.5" />
              {t("Plugins & extensions", "Plugins & extensions")}
            </span>
          </p>
          <h2 className="font-display mb-4 text-foreground" style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
            {t(`Extensions disponibles pour ${tool.name}`, `Available extensions for ${tool.name}`)}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {childPlugins.map(p => (
              <Link
                key={p.id}
                to={`${prefix}/tool/${(p as any).slug || p.id}`}
                className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md"
              >
                <ToolLogo tool={p as any} size={32} className="rounded-lg shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                    {p.name}
                  </p>
                  <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}>
                    {lang === "en" && (p as any).shortDescriptionEn
                      ? (p as any).shortDescriptionEn
                      : p.shortDescription}
                  </p>
                  {(p as any).defaultMonthlyPrice === 0 ? (
                    <span className="mt-1.5 inline-block text-[10px] font-semibold" style={{ color: "hsl(var(--keep))" }}>
                      {t("Gratuit", "Free")}
                    </span>
                  ) : (p as any).defaultMonthlyPrice > 0 ? (
                    <span className="mt-1.5 inline-block text-[10px] font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
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
