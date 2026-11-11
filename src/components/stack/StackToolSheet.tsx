import { useLayoutEffect, useRef, useState } from "react";
import StackCostEditor from "@/components/stack/StackCostEditor";
import { ValueChange, Collapse } from "@/ds/Motion/Motion";
import Drawer from "@/ds/Drawer/Drawer";
import Switch from "@/ds/Switch/Switch";
import Tag from "@/ds/Tag/Tag";
import { buttonAttrs, linkClass, LinkArrow, TextButton } from "@/ds/Button/Button";
import { CardPanel, CostCard, CostFigure, DisclosureRow, SettingRow, SheetFoot, SheetHead, SheetNote, SheetSection, TagList, ToolRow, ToolRows } from "@/ds/ToolSheet/ToolSheet";
import type { PlanChoice } from "@/hooks/useStackPaidPlans";
import { Link } from "@/lib/routerLinks";
import { ArrowRight, ArrowUpRight, Compass } from "@/lib/icons";
import { relPourLienOutil, safeExternalUrl } from "@/lib/externalLink";
import ToolLogo from "@/components/ToolLogo";
import type { Category, Tool } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { convertAmount, formatAmount, isCurrency, type Currency } from "@/lib/currencyRates";
import { comparisonPath } from "@/lib/comparisonLinks";
import { toolMonthlyCost } from "@/lib/stackCost";
import { formatNativePrice, pickNativePrice, stackCatalogPrice, toolKey } from "@/lib/stackView";
import { stackDisplayLabel, stackPlacement, stackUsageLabels } from "@/lib/stackUsage";
import type { ScoredPair } from "@/lib/stackOverlap";
import { trackEvent } from "@/lib/analytics";
import { getExplorerHref } from "@/lib/toolExploration";
import toolAccents from "@/data/toolAccents.json";

/**
 * Un outil de Ma stack, ouvert depuis sa carte : une feuille (à droite sur
 * ordinateur, en bas sur mobile) qui garde la page en place. Elle répond à
 * « que fait cet outil dans ma stack ? », pas à « qu'est-ce que cet outil ? »
 * (c'est la fiche) :
 * 1. ce qu'il me coûte, et pour un freemium, la question « je paie ? » sur place ;
 * 2. les usages qu'il couvre ;
 * 3. ce qu'il recoupe dans ma stack, avec le coût estimé à examiner ;
 * 4. la fiche complète, et le retrait de ma stack (annulable).
 */

interface Props {
  editCostRequest?: {slug:string;sequence:number}|null;
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
  onReturnFocus: () => void;
  onSelect: (slug: string) => void;
  onRemove: () => void;
  /** Whole catalogue (light index) and the ids in my stack: for alternatives to consider. */
  catalog: ToolSummary[];
  stackIds: Set<string>;
}

export default function StackToolSheet({ editCostRequest, tool, detail, pairs, categories, paid, currency, prefix, lang, onClose, onReturnFocus, onSelect, onRemove, catalog, stackIds }: Props) {
  const en = lang === "en";
  const [editing, setEditing] = useState<string | null>(null);
  // Each opening starts a fresh draft from what is saved.
  const [opened, setOpened] = useState(0);
  const adjustButton = useRef<HTMLButtonElement>(null);
  const closeCostEditor = () => { setEditing(null); adjustButton.current?.focus({preventScroll:true}); };
  useLayoutEffect(() => {
    if (editCostRequest && tool && editCostRequest.slug === toolKey(tool)) { setEditing(editCostRequest.slug); setOpened(n => n + 1); }
  }, [editCostRequest, tool?.id]);
  const money = (amount: number) => `≈ ${formatAmount(amount, currency, lang)}${en ? "/mo" : "/mois"}`;

  return (
    <Drawer open={!!tool} onClose={onClose} closeLabel={en ? "Close" : "Fermer"}
        onCloseAutoFocus={(event) => { event.preventDefault(); onReturnFocus(); }}
        onOpenAutoFocus={() => { if (editCostRequest) requestAnimationFrame(() => document.querySelector<HTMLInputElement>("[data-drawer] [data-cost-editor] input")?.focus()); }}
        style={tool && (toolAccents as Record<string, string>)[toolKey(tool)] ? ({ "--tool-accent": (toolAccents as Record<string, string>)[toolKey(tool)] } as React.CSSProperties) : undefined}>
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
            <SheetHead logo={<ToolLogo tool={tool} size={56} />} eyebrow={stackDisplayLabel(stackPlacement(tool, categories, lang).label, lang)} title={tool.name} lead={short || undefined}
              explore={<Link {...buttonAttrs()} to={getExplorerHref(prefix, { type: "outil", slug })}
                state={{ explorerCanGoBack: true, explorerReturnTo: `${prefix}/ma-stack?outil=${encodeURIComponent(slug)}`,
                  previousSourceLabel: en ? "My stack" : "Ma stack", originLabel: en ? "My stack" : "Ma stack" }}
                onClick={() => trackEvent("stack_explorer_click", { tool_slug: slug })}>
                <Compass aria-hidden />{en ? `Explore around ${tool.name}` : `Explorer autour de ${tool.name}`}
              </Link>} />

            <CostCard label={en ? "In my stack" : "Dans ma stack"}>
              {(() => {
                const choice = paid.choiceFor(slug);
                const on = choice ? cost.kind === "paid" : paid.isPaid(slug);
                const source = cost.kind !== "paid" ? null
                  : cost.source === "custom" && choice ? `${en ? "Billed amount" : "Montant facturé"} ${formatNativePrice({ amount: choice.amount, currency: choice.currency, period: choice.period }, lang)}`
                  : cost.source === "plan" ? (() => { const users = Math.max(1, choice?.seats || 1); return `${choice?.label || ""}${choice?.perSeat ? ` · ${users} ${en ? (users > 1 ? "users" : "user") : (users > 1 ? "utilisateurs" : "utilisateur")}` : ""}`; })()
                  : (en ? "Catalogue entry level" : "Entrée de gamme du catalogue");
                const open = editing === slug;
                return <>
                  {/* The figure of the sheet: what this tool costs me, large,
                      with where the number comes from. */}
                  <CostFigure label={en ? "Estimated monthly cost" : "Coût mensuel estimé"} source={source || undefined}
                    link={<Link className={linkClass()} to={`${prefix}/tool/${slug}/${en ? "pricing" : "prix"}`} onClick={() => trackEvent("stack_pricing_click", { tool_slug: slug })}>{en ? "Official pricing" : "Tarifs officiels"}<LinkArrow /></Link>}
                    value={<ValueChange value={cost.kind === "paid" ? `${cost.currency}${Math.round(cost.monthly * 100)}` : cost.kind}>{cost.kind === "paid" ? (cost.source === "custom" && cost.currency === currency && choice?.period === "monthly"
                        // What the person typed, in the shown currency: exact, no "≈".
                        ? `${new Intl.NumberFormat(en ? "en-US" : "fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(cost.monthly)}${en ? "/mo" : "/mois"}`
                        : money(convertAmount(cost.monthly, cost.currency, currency)))
                      : cost.kind === "free" ? (en ? "Free" : "Gratuit")
                      : cost.kind === "freemium-free" ? (en ? "Free version" : "Version gratuite")
                      : (en ? "Price not checked" : "Prix non relevé")}</ValueChange>} />
                  {freemium && <SettingRow title={en ? "Paid subscription" : "Abonnement payant"}
                    note={native && native.period !== "once"
                      ? (en ? `From ${formatNativePrice(native, lang)}` : `À partir de ${formatNativePrice(native, lang)}`)
                      : (en ? "Paid price not checked" : "Prix payant non relevé")}
                    control={<Switch checked={on} label={en ? `Paid subscription for ${tool.name}` : `Abonnement payant pour ${tool.name}`}
                      onChange={() => { if (on) { paid.setChoice(slug, null); paid.setPaid(slug, false); } else { if (choice?.amount === 0) paid.setChoice(slug, null); paid.setPaid(slug, true); } }} />} />}
                  {/* The right figure: a catalogue plan with its seats, or what
                      the person really pays. */}
                  <DisclosureRow buttonRef={adjustButton} open={open} onToggle={() => { if (!open) setOpened((n) => n + 1); setEditing(open ? null : slug); }}
                    title={en ? "Edit my subscription" : "Modifier mon abonnement"} note={en ? "Plan, users, invoice currency or billed amount" : "Offre, utilisateurs, devise ou montant facturé"} />
                  {/* Always mounted, opens in height: the content below glides. */}
                  <Collapse open={open}><CardPanel>
                    <StackCostEditor key={`${slug}-${opened}`} tool={tool} detail={detail} currency={currency} lang={lang} freemium={freemium}
                      initial={choice ? { kind: "choice", choice } : freemium && !paid.isPaid(slug) ? { kind: "free" } : { kind: "entry" }}
                      entryLabel={native && native.period !== "once" ? (() => { const amount = native.period === "annual" ? native.amount / 12 : native.amount; return isCurrency(native.currency) ? money(convertAmount(amount, native.currency, currency)) : formatNativePrice(native, lang); })() : null}
                      entryNative={native && native.period !== "once" ? native : null}
                      onCancel={closeCostEditor}
                      onSave={(draft) => {
                        // Saved: the stack takes it, the editor closes, the figure above updates.
                        if (draft.kind === "choice") { paid.setChoice(slug, draft.choice); if (freemium) paid.setPaid(slug, draft.choice.amount > 0); }
                        else { paid.setChoice(slug, null); if (freemium) paid.setPaid(slug, draft.kind === "entry"); }
                        closeCostEditor();
                      }} />
                  </CardPanel></Collapse>
                </>;
              })()}
            </CostCard>

            {uses.length > 0 && <SheetSection title={en ? "What it covers" : "Ce qu’il couvre"}>
              <TagList items={uses.map((use) => stackDisplayLabel(use, lang))} />
            </SheetSection>}

            <SheetSection title={en ? "Overlaps in my stack" : "Recoupements dans ma stack"}>
              {mine.length === 0
                ? <SheetNote>{en ? "No overlap detected with the other tools in your stack." : "Aucun recoupement détecté avec les autres outils de votre stack."}</SheetNote>
                : <ToolRows>{mine.map((pair) => {
                  const other = pair.a.id === tool.id ? pair.b : pair.a;
                  return <ToolRow key={other.id} logo={<ToolLogo tool={other} size={32} />} name={other.name}
                    note={<>{pair.shared.length > 0
                        ? (en ? `Shared: ${pair.shared.slice(0, 2).join(", ")}` : `En commun : ${pair.shared.slice(0, 2).map((use) => stackDisplayLabel(use, lang)).join(", ")}`)
                        : (en ? "Catalogue alternative" : "Alternative du catalogue")}
                      {pair.double > 0 && <> · <Tag tone="overlap">{en ? `${money(pair.double)} to review` : `${money(pair.double)} à examiner`}</Tag></>}</>}
                    renderMain={(className, content) => <button type="button" className={className} onClick={() => onSelect(toolKey(other))}>{content}</button>}
                    action={<Link {...buttonAttrs()} to={comparisonPath(prefix, slug, toolKey(other))} onClick={() => trackEvent("stack_compare_click", { source: "sheet", a: slug, b: toolKey(other) })}>{en ? "Compare" : "Comparer"}</Link>} />;
                })}</ToolRows>}
            </SheetSection>

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
              return <SheetSection title={en ? "Worth considering" : "À envisager"}>
                <ToolRows>{alternatives.map((alt) => {
                  const altCost = toolMonthlyCost(alt, () => true, lang);
                  const altMonthly = altCost.kind === "paid" ? convertAmount(altCost.monthly, altCost.currency, currency) : null;
                  const gap = mine > 0 && altMonthly !== null ? mine - altMonthly : null;
                  const label = stackCatalogPrice(alt, lang) || (en ? "Price not checked" : "Prix non relevé");
                  const gapText = gap !== null && Math.round(gap) !== 0
                    ? { short: `${gap > 0 ? "−" : "+"}${formatAmount(Math.round(Math.abs(gap)), currency, lang)}${en ? "/mo" : "/mois"}`,
                        full: gap > 0 ? (en ? `${money(gap)} less in the estimate` : `${money(gap)} de moins dans l’estimation`) : (en ? `${money(-gap)} more in the estimate` : `${money(-gap)} de plus dans l’estimation`) }
                    : null;
                  // Name on its own line; price and the gap to what I pay under it.
                  return <ToolRow key={alt.id} logo={<ToolLogo tool={alt} size={32} />} name={alt.name}
                    note={<>{label}{gapText && <> <Tag tone={gap! > 0 ? "ok" : "neutral"} title={gapText.full}><span aria-hidden="true">{gapText.short}</span><span className="sr-only">{gapText.full}</span></Tag></>}</>}
                    renderMain={(className, content) => <Link className={className} to={`${prefix}/tool/${toolKey(alt)}`} onClick={() => trackEvent("stack_alternative_click", { tool_slug: slug, alternative: toolKey(alt) })}>{content}</Link>}
                    action={<Link {...buttonAttrs()} to={comparisonPath(prefix, slug, toolKey(alt))} onClick={() => trackEvent("stack_compare_click", { source: "alternatives", a: slug, b: toolKey(alt) })}>{en ? "Compare" : "Comparer"}</Link>} />;
                })}</ToolRows>
              </SheetSection>;
            })()}

            {/* Actions for a tool I use: open it, read its profile, or let it go. */}
            {(() => {
              const href = safeExternalUrl(tool.affiliateLink || tool.websiteUrl);
              return <SheetFoot remove={<TextButton tone="danger" onClick={onRemove}>{en ? "Remove from my stack" : "Retirer de ma stack"}</TextButton>}
                actions={<>
                  {href && <a {...buttonAttrs("primary", "lg")} href={href} target="_blank" rel={relPourLienOutil(href, tool.affiliateLink, tool.websiteUrl)}
                    onClick={() => trackEvent("stack_visit_click", { tool_slug: slug })}>{en ? `Open ${tool.name}` : `Ouvrir ${tool.name}`}<ArrowUpRight aria-hidden /><span className="sr-only">{en ? " (opens in a new tab)" : " (nouvel onglet)"}</span></a>}
                  <Link {...buttonAttrs(href ? "secondary" : "primary", "lg")} to={`${prefix}/tool/${slug}`} onClick={() => trackEvent("stack_profile_click", { tool_slug: slug })}>{en ? "Full profile" : "Fiche complète"}{!href && <ArrowRight aria-hidden />}</Link>
                </>} />;
            })()}
          </>;
        })()}
    </Drawer>
  );
}
