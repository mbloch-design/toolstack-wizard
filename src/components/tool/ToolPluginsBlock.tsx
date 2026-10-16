import { Link } from "@/lib/routerLinks";
import type { Tool } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import ToolLogo from "@/components/ToolLogo";
import { Puzzle, ArrowRight } from "@/lib/icons";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrencyAmount } from "@/lib/currency";
import { resolveDisplayPrice } from "@/lib/nativePricing";

interface Props {
  tool: Tool;
  allTools: ToolSummary[];
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
}

export default function ToolPluginsBlock({ tool, allTools, prefix, lang, t }: Props) {
  const { currency } = useCurrency();
  const toolId = (tool as any).slug || tool.id;
  const toolType = (tool as any).tool_type as string;
  const hostAppSlug = (tool as any).host_app as string | undefined;

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

  // Bundle parent / members are shown once, in the pricing section (ToolBundleSection).
  const hasAnyContent = hostApp || childPlugins.length > 0;
  if (!hasAnyContent) return null;

  return (
    <div className="td-section td-section--sub" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

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
                    <span className="td-tile-price">
                      {t("Gratuit", "Free")}
                    </span>
                  ) : (p as any).defaultMonthlyPrice > 0 ? (
                    <span className="td-tile-price">
                      {(() => { const price = resolveDisplayPrice(p, (p as any).defaultMonthlyPrice, currency); return `${price.converted ? "≈ " : ""}${formatCurrencyAmount(price.amount, price.nativePrice ? price.currency : currency, lang)}`; })()}/{t("mois", "mo")}
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
