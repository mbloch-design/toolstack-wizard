import { useState, useSyncExternalStore } from "react";
import StackCostEditor from "@/components/stack/StackCostEditor";
import type { PlanChoice } from "@/hooks/useStackPaidPlans";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { Category, Tool } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { convertAmount, formatAmount, type Currency } from "@/lib/currencyRates";
import { comparisonPath } from "@/lib/comparisonLinks";
import { toolMonthlyCost } from "@/lib/stackCost";
import { formatNativePrice, pickNativePrice, stackCatalogPrice, toolKey } from "@/lib/stackView";
import { stackDisplayLabel, stackPlacement, stackUsageLabels } from "@/lib/stackUsage";
import type { ScoredPair } from "@/components/stack/StackOverlapPairs";
import { trackEvent } from "@/lib/analytics";

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
}

const narrow = "(max-width: 640px)";
function useNarrow() {
  return useSyncExternalStore(
    (listener) => { const query = window.matchMedia(narrow); query.addEventListener("change", listener); return () => query.removeEventListener("change", listener); },
    () => window.matchMedia(narrow).matches,
    () => false,
  );
}

export default function StackToolSheet({ tool, detail, pairs, categories, paid, currency, prefix, lang, onClose, onSelect, onRemove }: Props) {
  const en = lang === "en";
  const bottom = useNarrow();
  const [editing, setEditing] = useState<string | null>(null);
  const money = (amount: number) => `≈ ${formatAmount(Math.round(amount), currency, lang)}${en ? "/mo" : "/mois"}`;

  return (
    <Sheet open={!!tool} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side={bottom ? "bottom" : "right"} className="ms-tool-sheet">
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
              <h3>{en ? "In my stack" : "Dans ma stack"}</h3>
              {(() => {
                const choice = paid.choiceFor(slug);
                const on = paid.isPaid(slug) || !!choice;
                const source = cost.kind !== "paid" ? null
                  : cost.source === "custom" && choice ? `${en ? "You entered" : "Vous avez saisi"} ${new Intl.NumberFormat(en ? "en-US" : "fr-FR", { style: "currency", currency: choice.currency, maximumFractionDigits: 2 }).format(choice.amount)}${choice.period === "annual" ? (en ? "/yr" : "/an") : (en ? "/mo" : "/mois")}`
                  : cost.source === "plan" ? `${en ? "Plan" : "Plan"} ${choice?.label || ""}${choice?.perSeat ? ` × ${Math.max(1, choice.seats || 1)} ${en ? "seats" : "places"}` : ""}`
                  : (en ? "Catalogue entry plan" : "Offre d’entrée du catalogue");
                const open = editing === slug;
                return <>
                  <div className="ms-ts-row">
                    <span>{en ? "Monthly cost" : "Coût mensuel"}{source && <small>{source}</small>}</span>
                    <strong className="ms-pop" key={cost.kind === "paid" ? `${cost.currency}${Math.round(cost.monthly * 100)}` : cost.kind}>{cost.kind === "paid" ? (cost.source === "custom" && cost.currency === currency && choice?.period === "monthly"
                        // What the person typed, in the shown currency: exact, no "≈".
                        ? `${new Intl.NumberFormat(en ? "en-US" : "fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(cost.monthly)}${en ? "/mo" : "/mois"}`
                        : money(convertAmount(cost.monthly, cost.currency, currency)))
                      : cost.kind === "free" ? (en ? "Free" : "Gratuit")
                      : cost.kind === "freemium-free" ? (en ? "Free use" : "Usage gratuit")
                      : (en ? "Price not checked" : "Prix non relevé")}</strong>
                  </div>
                  {freemium && <div className="ms-ts-row">
                    <span>{en ? "I pay for a paid plan" : "Je paie une offre payante"}<small>{native && native.period !== "once"
                      ? (en ? `From ${formatNativePrice(native, lang)}` : `Dès ${formatNativePrice(native, lang)}`)
                      : (en ? "Paid price not checked" : "Prix payant non relevé")}</small></span>
                    <button type="button" role="switch" aria-checked={on} className="ms-switch" aria-label={en ? `I pay for ${tool.name}` : `Je paie ${tool.name}`}
                      onClick={() => { if (on) { paid.setChoice(slug, null); paid.setPaid(slug, false); } else paid.setPaid(slug, true); }}>
                      <span className="ms-switch-track" aria-hidden="true"><span /></span>
                    </button>
                  </div>}
                  {/* The right figure: a catalogue plan with its seats, or what
                      the person really pays. */}
                  <button type="button" className="ms-ts-adjust" aria-expanded={open} onClick={() => setEditing(open ? null : slug)}>
                    <span>{en ? "Adjust my cost" : "Ajuster mon coût"}<small>{en ? "Plan, seats or the amount you pay" : "Plan, places ou montant réel"}</small></span>
                    <ChevronDown size={16} aria-hidden />
                  </button>
                  {open && <StackCostEditor key={slug} tool={tool} detail={detail} choice={choice} currency={currency} lang={lang} freemium={freemium} paidAtEntry={paid.isPaid(slug) && !choice}
                    onFree={() => paid.setPaid(slug, false)}
                    onChange={(next) => { paid.setChoice(slug, next); if (next && freemium) paid.setPaid(slug, true); }} />}
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

            <footer className="ms-ts-foot">
              <Link className="tt-button-primary ms-ts-profile" to={`${prefix}/tool/${slug}`} onClick={() => trackEvent("stack_profile_click", { tool_slug: slug })}>{en ? "View full profile" : "Voir la fiche complète"}<ArrowRight size={16} aria-hidden /></Link>
              <button type="button" className="ms-ts-remove" onClick={onRemove}>{en ? "Remove from my stack" : "Retirer de ma stack"}</button>
            </footer>
          </>;
        })()}
      </SheetContent>
    </Sheet>
  );
}
