import { useState, useSyncExternalStore } from "react";
import StackCostEditor from "@/components/stack/StackCostEditor";
import Collapse from "@/components/motion/Collapse";
import ValueChange from "@/components/motion/ValueChange";
import type { PlanChoice } from "@/hooks/useStackPaidPlans";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ChevronDown, X } from "@/lib/icons";
import { relPourLienOutil, safeExternalUrl } from "@/lib/externalLink";
import ToolLogo from "@/components/ToolLogo";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { Category, Tool } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { convertAmount, formatAmount, isCurrency, type Currency } from "@/lib/currencyRates";
import { comparisonPath } from "@/lib/comparisonLinks";
import { toolMonthlyCost } from "@/lib/stackCost";
import { formatNativePrice, pickNativePrice, stackCatalogPrice, toolKey } from "@/lib/stackView";
import { stackDisplayLabel, stackPlacement, stackUsageLabels } from "@/lib/stackUsage";
import type { ScoredPair } from "@/components/stack/StackOverlapPairs";
import { trackEvent } from "@/lib/analytics";
import toolAccents from "@/data/toolAccents.json";

/**
 * Un outil de Ma stack, ouvert depuis sa carte : une feuille (à droite sur
 * ordinateur, en bas sur mobile) qui garde la page en place. Elle répond à
 * « que fait cet outil dans ma stack ? », pas à « qu'est-ce que cet outil ? »
 * (c'est la fiche) :
 * 1. ce qu'il me coûte, et pour un freemium, la question « je paie ? » sur place ;
 * 2. les usages qu'il couvre ;
 * 3. ce qu'il recoupe dans ma stack, avec ce qui est payé en double ;
 * 4. la fiche complète, et le retrait de ma stack (annulable).
 */

interface Props {
  /** The stack's summary of the tool: prices and uses come from it (attested nativePrices). */
  tool: ToolSummary | null;
  /** Full catalogue record when loaded, for the description only. */
  detail?: ToolSummary | Tool | null;
  pairs: ScoredPair[];
  categories: Category[];
  paid: { isPaid: (slug: string) => boolean; setPaid: (slug: string, value: boolean) => void; choiceFor: (slug: string) => PlanChoice | undefined; setChoice: (slug: string, choice: PlanChoice | null) => void };
  currency: Currency;
  prefix: string;
  lang: "fr" | "en";
  onClose: () => void;
  onSelect: (slug: string) => void;
  onRemove: () => void;
  /** Whole catalogue (light index) and the ids in my stack: for alternatives to consider. */
  catalog: ToolSummary[];
  stackIds: Set<string>;
}

const narrow = "(max-width: 640px)";
function useNarrow() {
  return useSyncExternalStore(
    (listener) => { const query = window.matchMedia(narrow); query.addEventListener("change", listener); return () => query.removeEventListener("change", listener); },
    () => window.matchMedia(narrow).matches,
    () => false,
  );
}

export default function StackToolSheet({ tool, detail, pairs, categories, paid, currency, prefix, lang, onClose, onSelect, onRemove, catalog, stackIds }: Props) {
  const en = lang === "en";
  const bottom = useNarrow();
  const [editing, setEditing] = useState<string | null>(null);
  // Each opening starts a fresh draft from what is saved.
  const [opened, setOpened] = useState(0);
  const money = (amount: number) => `≈ ${formatAmount(Math.round(amount), currency, lang)}${en ? "/mo" : "/mois"}`;

  return (
    <Sheet open={!!tool} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/* Focus lands on the sheet itself, not on its first control: no stray ring. */}
      <SheetContent side={bottom ? "bottom" : "right"} className="ms-tool-sheet" overlayClassName="ms-sheet-overlay"
        onOpenAutoFocus={(event) => { event.preventDefault(); (event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true }); }}
        style={tool && (toolAccents as Record<string, string>)[toolKey(tool)] ? ({ "--tool-accent": (toolAccents as Record<string, string>)[toolKey(tool)] } as React.CSSProperties) : undefined}>
        {/* A close button you can see (36px), top right. */}
        <SheetClose className="ms-ts-close" aria-label={en ? "Close" : "Fermer"}><X size={18} aria-hidden /></SheetClose>
        {tool && (() => {
          const slug = toolKey(tool);
          const price = stackCatalogPrice(tool, lang);
          const native = pickNativePrice(tool, lang);
          const cost = toolMonthlyCost(tool, paid.isPaid, lang);
          const freemium = price === "Freemium";
          const text = detail && detail.id === tool.id ? detail : tool;
          const short = en ? text.shortDescriptionEn || text.shortDescription : text.shortDescription;
          const uses = stackUsageLabels(tool, lang).slice(0, 6);
          const mine = pairs.filter((pair) => pair.a.id === tool.id || pair.b.id === tool.id);
          return <>
            <header className="ms-ts-head">
              <ToolLogo tool={tool} size={56} />
              <div>
                <p className="ms-ts-eyebrow">{stackDisplayLabel(stackPlacement(tool, categories, lang).label, lang)}</p>
                <SheetTitle className="ms-ts-title">{tool.name}</SheetTitle>
              </div>
            </header>
            {short && <SheetDescription className="ms-ts-lead">{short}</SheetDescription>}

            <section className="ms-ts-group" aria-label={en ? "In my stack" : "Dans ma stack"}>
              {(() => {
                const choice = paid.choiceFor(slug);
                const on = paid.isPaid(slug) || !!choice;
                const source = cost.kind !== "paid" ? null
                  : cost.source === "custom" && choice ? `${en ? "Billed amount" : "Montant facturé"} ${formatNativePrice({ amount: choice.amount, currency: choice.currency, period: choice.period }, lang)}`
                  : cost.source === "plan" ? (() => { const users = Math.max(1, choice?.seats || 1); return `${choice?.label || ""}${choice?.perSeat ? ` · ${users} ${en ? (users > 1 ? "users" : "user") : (users > 1 ? "utilisateurs" : "utilisateur")}` : ""}`; })()
                  : (en ? "Catalogue entry level" : "Entrée de gamme du catalogue");
                const open = editing === slug;
                return <>
                  {/* The figure of the sheet: what this tool costs me, large,
                      with where the number comes from. */}
                  <div className="ms-ts-cost">
                    <span className="ms-ts-cost-label">{en ? "Monthly cost" : "Coût mensuel"}</span>
                    <strong className="ms-ts-cost-value"><ValueChange value={cost.kind === "paid" ? `${cost.currency}${Math.round(cost.monthly * 100)}` : cost.kind}>{cost.kind === "paid" ? (cost.source === "custom" && cost.currency === currency && choice?.period === "monthly"
                        // What the person typed, in the shown currency: exact, no "≈".
                        ? `${new Intl.NumberFormat(en ? "en-US" : "fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(cost.monthly)}${en ? "/mo" : "/mois"}`
                        : money(convertAmount(cost.monthly, cost.currency, currency)))
                      : cost.kind === "free" ? (en ? "Free" : "Gratuit")
                      : cost.kind === "freemium-free" ? (en ? "Free version" : "Version gratuite")
                      : (en ? "Price not checked" : "Prix non relevé")}</ValueChange></strong>
                    {source && <small className="ms-ts-cost-source">{source}</small>}
                    <Link className="ms-ts-pricing" to={`${prefix}/tool/${slug}/${en ? "pricing" : "prix"}`} onClick={() => trackEvent("stack_pricing_click", { tool_slug: slug })}>{en ? "Official pricing" : "Tarifs officiels"}<ArrowRight size={14} aria-hidden /></Link>
                  </div>
                  {freemium && <div className="ms-ts-row">
                    <span>{en ? "Paid subscription" : "Abonnement payant"}<small>{native && native.period !== "once"
                      ? (en ? `From ${formatNativePrice(native, lang)}` : `À partir de ${formatNativePrice(native, lang)}`)
                      : (en ? "Paid price not checked" : "Prix payant non relevé")}</small></span>
                    <button type="button" role="switch" aria-checked={on} className="ms-switch" aria-label={en ? `Paid subscription for ${tool.name}` : `Abonnement payant pour ${tool.name}`}
                      onClick={() => { if (on) { paid.setChoice(slug, null); paid.setPaid(slug, false); } else paid.setPaid(slug, true); }}>
                      <span className="ms-switch-track" aria-hidden="true"><span /></span>
                    </button>
                  </div>}
                  {/* The right figure: a catalogue plan with its seats, or what
                      the person really pays. */}
                  <button type="button" className="ms-ts-adjust" aria-expanded={open} onClick={() => { if (!open) setOpened((n) => n + 1); setEditing(open ? null : slug); }}>
                    <span>{en ? "Edit my subscription" : "Modifier mon abonnement"}<small>{en ? "Plan, users or billed amount" : "Offre, utilisateurs ou montant facturé"}</small></span>
                    <ChevronDown size={16} aria-hidden />
                  </button>
                  {/* Always mounted, opens in height: the content below glides. */}
                  <Collapse open={open}>
                    <StackCostEditor key={`${slug}-${opened}`} tool={tool} detail={detail} currency={currency} lang={lang} freemium={freemium}
                      initial={choice ? { kind: "choice", choice } : freemium && !paid.isPaid(slug) ? { kind: "free" } : { kind: "entry" }}
                      entryLabel={native && native.period !== "once" ? (() => { const amount = native.period === "annual" ? native.amount / 12 : native.amount; return isCurrency(native.currency) ? money(convertAmount(amount, native.currency, currency)) : formatNativePrice(native, lang); })() : null}
                      entryNative={native && native.period !== "once" ? native : null}
                      onCancel={() => setEditing(null)}
                      onSave={(draft) => {
                        // Saved: the stack takes it, the editor closes, the figure above updates.
                        if (draft.kind === "choice") { paid.setChoice(slug, draft.choice); if (freemium) paid.setPaid(slug, true); }
                        else { paid.setChoice(slug, null); if (freemium) paid.setPaid(slug, draft.kind === "entry"); }
                        setEditing(null);
                      }} />
                  </Collapse>
                </>;
              })()}
            </section>

            {uses.length > 0 && <section className="ms-ts-section">
              <h3>{en ? "What it covers" : "Ce qu’il couvre"}</h3>
              <ul className="ms-ts-uses">{uses.map((use) => <li key={use}>{stackDisplayLabel(use, lang)}</li>)}</ul>
            </section>}

            <section className="ms-ts-section">
              <h3>{en ? "Overlaps in my stack" : "Recoupements dans ma stack"}</h3>
              {mine.length === 0
                ? <p className="ms-ts-empty">{en ? "No other tool in your stack does the same job." : "Aucun autre outil de votre stack ne fait le même travail."}</p>
                : <ul className="ms-ts-pairs">{mine.map((pair) => {
                  const other = pair.a.id === tool.id ? pair.b : pair.a;
                  return <li key={other.id}>
                    <button type="button" className="ms-ts-other" onClick={() => onSelect(toolKey(other))}>
                      <ToolLogo tool={other} size={32} />
                      <span><strong>{other.name}</strong><small>{pair.shared.length > 0
                        ? (en ? `Shared: ${pair.shared.slice(0, 2).join(", ")}` : `En commun : ${pair.shared.slice(0, 2).map((use) => stackDisplayLabel(use, lang)).join(", ")}`)
                        : (en ? "Catalogue alternative" : "Alternative du catalogue")}</small></span>
                    </button>
                    {pair.double > 0 && <span className="ms-pair-double">{en ? `${money(pair.double)} twice` : `${money(pair.double)} en double`}</span>}
                    <Link className="ms-ts-compare" to={comparisonPath(prefix, slug, toolKey(other))} onClick={() => trackEvent("stack_compare_click", { source: "sheet", a: slug, b: toolKey(other) })}>{en ? "Compare" : "Comparer"}</Link>
                  </li>;
                })}</ul>}
            </section>

            {/* Already in my stack, so the questions are: is there better or
                cheaper, and take me to it. Alternatives from the catalogue that
                are not in my stack, with the gap to what I pay. */}
            {(() => {
              const mine = cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0;
              const alternatives = (tool.alternatives || [])
                .map((ref) => catalog.find((item) => toolKey(item) === ref || item.id === ref))
                .filter((item): item is ToolSummary => !!item && !stackIds.has(item.id))
                .slice(0, 3);
              if (!alternatives.length) return null;
              return <section className="ms-ts-section">
                <h3>{en ? "Worth considering" : "À envisager"}</h3>
                <ul className="ms-ts-pairs ms-ts-alts">{alternatives.map((alt) => {
                  const altCost = toolMonthlyCost(alt, () => true, lang);
                  const altMonthly = altCost.kind === "paid" ? convertAmount(altCost.monthly, altCost.currency, currency) : null;
                  const gap = mine > 0 && altMonthly !== null ? mine - altMonthly : null;
                  const label = stackCatalogPrice(alt, lang) || (en ? "Price not checked" : "Prix non relevé");
                  const gapText = gap !== null && Math.round(gap) !== 0
                    ? { short: `${gap > 0 ? "−" : "+"}${formatAmount(Math.round(Math.abs(gap)), currency, lang)}${en ? "/mo" : "/mois"}`,
                        full: gap > 0 ? (en ? `${money(gap)} less than what you pay` : `${money(gap)} de moins que ce que vous payez`) : (en ? `${money(-gap)} more than what you pay` : `${money(-gap)} de plus que ce que vous payez`) }
                    : null;
                  // Name on its own line; price and the gap to what I pay under it.
                  return <li key={alt.id}>
                    <Link className="ms-ts-other" to={`${prefix}/tool/${toolKey(alt)}`} onClick={() => trackEvent("stack_alternative_click", { tool_slug: slug, alternative: toolKey(alt) })}>
                      <ToolLogo tool={alt} size={32} />
                      <span><strong>{alt.name}</strong><small>{label}{gapText && <span className={`ms-ts-gap${gap! > 0 ? " is-less" : ""}`} title={gapText.full}><span aria-hidden="true">{gapText.short}</span><span className="sr-only">{gapText.full}</span></span>}</small></span>
                    </Link>
                    <Link className="ms-ts-compare" to={comparisonPath(prefix, slug, toolKey(alt))} onClick={() => trackEvent("stack_compare_click", { source: "alternatives", a: slug, b: toolKey(alt) })}>{en ? "Compare" : "Comparer"}</Link>
                  </li>;
                })}</ul>
              </section>;
            })()}

            {/* Actions for a tool I use: open it, read its profile, or let it go. */}
            <footer className="ms-ts-foot">
              {(() => {
                const href = safeExternalUrl(tool.affiliateLink || tool.websiteUrl);
                return <div className="ms-ts-foot-row">
                  {href && <a className="tt-button-primary ms-ts-open" href={href} target="_blank" rel={relPourLienOutil(href, tool.affiliateLink, tool.websiteUrl)}
                    onClick={() => trackEvent("stack_visit_click", { tool_slug: slug })}>{en ? `Open ${tool.name}` : `Ouvrir ${tool.name}`}<ArrowUpRight size={16} aria-hidden /><span className="sr-only">{en ? " (opens in a new tab)" : " (nouvel onglet)"}</span></a>}
                  <Link className={href ? "ms-ts-secondary" : "tt-button-primary ms-ts-open"} to={`${prefix}/tool/${slug}`} onClick={() => trackEvent("stack_profile_click", { tool_slug: slug })}>{en ? "Full profile" : "Fiche complète"}{!href && <ArrowRight size={16} aria-hidden />}</Link>
                </div>;
              })()}
              <button type="button" className="ms-ts-remove" onClick={onRemove}>{en ? "Remove from my stack" : "Retirer de ma stack"}</button>
            </footer>
          </>;
        })()}
      </SheetContent>
    </Sheet>
  );
}
