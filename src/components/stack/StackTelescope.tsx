import { useLayoutEffect, useMemo, useRef, useState } from "react";
import ToolLogo from "@/components/ToolLogo";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { ChevronLeft } from "@/lib/icons";
import { pack, type Bubble } from "@/components/stack/StackUsageExplorer";
import { AREA_COLORS, AreaCard, type Territory } from "@/components/stack/StackAreaBoard";
import { useCurrency } from "@/hooks/useCurrency";
import { useStackPaidPlans } from "@/hooks/useStackPaidPlans";
import { stackMonthlyCost } from "@/lib/stackCost";
import { CURRENCY_RATE_DATE, formatAmount } from "@/lib/currencyRates";

/**
 * Vue « Par usage » de Ma stack, en télescope à deux niveaux.
 *
 * 1. Vue d'ensemble : une bulle par domaine, sa taille suit le nombre d'outils.
 *    C'est là que les bulles apportent quelque chose : le poids de chaque
 *    domaine se voit d'un coup d'œil.
 * 2. Un clic zoome sur le domaine, qui s'ouvre en carte lisible (usages,
 *    outils, prix, recoupements). Les bulles du deuxième niveau se lisaient
 *    mal : quelques bulles serrées, libellés qui débordent, outil caché
 *    derrière le nom de son usage.
 *
 * Taille des bulles : le coût mensuel du domaine par défaut (voir où part
 * l'argent), ou le nombre d'outils. Coût = offres d'entrée attestées, outils
 * freemium à 0 sauf s'ils sont déclarés payés, total converti au taux daté du
 * site et affiché comme converti (décisions de Michael, 7 oct. 2026).
 * Disposition reprise de StackUsageExplorer (déterministe).
 */

interface Props {
  territories: Territory[];
  lang: "fr" | "en";
  selectedId?: string;
  onSelect: (slug: string) => void;
  overlaps?: Map<string, ToolSummary[]>;
}

export default function StackTelescope({ territories, lang, selectedId, onSelect, overlaps }: Props) {
  const en = lang === "en";
  const [openId, setOpenId] = useState<string | null>(null);
  const [sizeBy, setSizeBy] = useState<"cost" | "tools">("cost");
  const { currency } = useCurrency();
  const plans = useStackPaidPlans();
  const costOf = (tools: ToolSummary[]) => stackMonthlyCost(tools, plans.isPaid, currency, lang);
  const money = (amount: number) => `≈ ${formatAmount(Math.round(amount), currency, lang)}${en ? "/mo" : "/mois"}`;
  const allTools = territories.flatMap((t) => t.tools);
  const totalCost = costOf(allTools);
  const areaCosts = new Map(territories.map((t) => [t.id, costOf(t.tools).total]));
  const maxCost = Math.max(0, ...areaCosts.values());
  // Cost mode needs at least one priced area; otherwise sizes fall back to tools.
  const byCost = sizeBy === "cost" && maxCost > 0;
  const fieldRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const moving = useRef(false);
  const origin = useRef<{ x: number; y: number; scale: number }>({ x: 50, y: 50, scale: 3 });
  const pending = useRef<"in" | "out" | null>(null);

  const colorOf = (id: string) => AREA_COLORS[Math.max(0, territories.findIndex((t) => t.id === id)) % AREA_COLORS.length];
  // pack() sizes by sqrt(weight): weight 1 to 16 gives areas up to ~16x apart,
  // so the costliest area clearly dominates and a free one stays readable.
  const bubbles = useMemo(() => pack(territories.map((t): Bubble => ({
    id: t.id, label: t.label, tools: t.tools,
    weight: byCost ? 1 + 15 * (areaCosts.get(t.id) || 0) / maxCost : t.tools.length,
  })), false), [territories, byCost, maxCost, plans.paid, currency]);
  const open = territories.find((t) => t.id === openId) || null;
  const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  async function zoomTo(id: string | null) {
    if (moving.current) return;
    const bubble = id ? bubbles.find((b) => b.item.id === id) : null;
    if (bubble) origin.current = { x: bubble.left + bubble.diameter / 2, y: bubble.top + bubble.diameter / 2, scale: 100 / bubble.diameter };
    const leaving = id ? fieldRef.current : detailRef.current;
    if (leaving && !reduced()) {
      moving.current = true;
      const { x, y, scale } = origin.current;
      const frames = id
        ? [{ transform: "none", opacity: 1 }, { transform: `translate(${50 - x}%, ${50 - y}%) scale(${scale})`, opacity: 0 }]
        : [{ transform: "none", opacity: 1 }, { transform: "scale(.92)", opacity: 0 }];
      leaving.style.transformOrigin = id ? `${x}% ${y}%` : "50% 0%";
      const animation = leaving.animate(frames, { duration: 220, easing: "cubic-bezier(.3,0,.7,1)", fill: "forwards" });
      try { await animation.finished; } catch { /* interrupted */ }
      animation.cancel();
      moving.current = false;
    }
    pending.current = id ? "in" : "out";
    setOpenId(id);
  }

  // Entrance of the new level: the area grows out of its bubble, or the
  // bubbles come back from the area that was open.
  useLayoutEffect(() => {
    const direction = pending.current;
    pending.current = null;
    if (!direction || reduced()) return;
    const target = direction === "in" ? detailRef.current : fieldRef.current;
    if (!target) return;
    const { x, y, scale } = origin.current;
    target.style.transformOrigin = direction === "in" ? "50% 0%" : `${x}% ${y}%`;
    target.animate(direction === "in"
      ? [{ transform: "scale(.9) translateY(12px)", opacity: 0 }, { transform: "none", opacity: 1 }]
      : [{ transform: `translate(${50 - x}%, ${50 - y}%) scale(${scale})`, opacity: 0 }, { transform: "none", opacity: 1 }],
    { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
  }, [openId]);

  return (
    <section className="ms-telescope" aria-label={en ? "My tools by use" : "Mes outils par usage"}>
      <div className="ms-cost-summary">
        <p className="ms-cost-note">
          {[
            totalCost.paid > 0 && (en ? `Entry plans of ${totalCost.paid} paid tool${totalCost.paid > 1 ? "s" : ""}, converted to ${currency} at the site's ${CURRENCY_RATE_DATE} rate.` : `Offres d’entrée de ${totalCost.paid} outil${totalCost.paid > 1 ? "s" : ""} payant${totalCost.paid > 1 ? "s" : ""}, converties en ${currency} au taux du ${CURRENCY_RATE_DATE}.`),
            totalCost.freemiumFree > 0 && (en ? `${totalCost.freemiumFree} freemium counted as free: open an area to mark the ones you pay.` : `${totalCost.freemiumFree} freemium comptés gratuits : ouvrez un domaine pour indiquer ceux que vous payez.`),
            totalCost.unknown > 0 && (en ? `${totalCost.unknown} without a checked price.` : `${totalCost.unknown} sans prix relevé.`),
          ].filter(Boolean).join(" ")}
        </p>
      </div>
      <div className="ms-telescope-stage">
        <header className="ms-telescope-head">
          {open ? (
            <button type="button" className="ms-telescope-backlink" onClick={() => zoomTo(null)}>
              <ChevronLeft size={16} aria-hidden />{en ? "All uses" : "Tous les usages"}
            </button>
          ) : (
            <>
              <p className="ms-telescope-hint">{byCost ? (en ? "Bubble size: monthly cost. Click an area to open it." : "Taille des bulles : coût mensuel. Cliquez sur un domaine pour l’ouvrir.") : (en ? "Bubble size: number of tools. Click an area to open it." : "Taille des bulles : nombre d’outils. Cliquez sur un domaine pour l’ouvrir.")}</p>
              <div className="ms-size-switch" role="group" aria-label={en ? "Bubble size" : "Taille des bulles"}>
                <button type="button" aria-pressed={sizeBy === "cost"} onClick={() => setSizeBy("cost")}>{en ? "Cost" : "Coût"}</button>
                <button type="button" aria-pressed={sizeBy === "tools"} onClick={() => setSizeBy("tools")}>{en ? "Tools" : "Outils"}</button>
              </div>
            </>
          )}
        </header>
        {open ? (
          <div ref={detailRef} className="ms-telescope-detail">
            <AreaCard territory={open} color={colorOf(open.id)} lang={lang} selectedId={selectedId} onSelect={onSelect} overlaps={overlaps}
              paid={plans} extra={(areaCosts.get(open.id) || 0) > 0 ? money(areaCosts.get(open.id) || 0) : (en ? "Nothing paid" : "Rien de payant")} />
          </div>
        ) : (
          <div className="ms-telescope-canvas">
            <div ref={fieldRef} className="ms-telescope-field">
              {bubbles.map((b, index) => (
                <button
                  key={b.item.id}
                  type="button"
                  className="ms-telescope-bubble"
                  style={{ left: `${b.left}%`, top: `${b.top}%`, width: `${b.diameter}%`, height: `${b.diameter}%`, ["--bubble-color" as string]: colorOf(b.item.id), ["--bubble-delay" as string]: `${index * 50}ms` }}
                  aria-label={`${b.item.label}, ${b.item.tools?.length || 0} ${en ? "tools" : "outils"}${(areaCosts.get(b.item.id) || 0) > 0 ? `, ${money(areaCosts.get(b.item.id) || 0)}` : ""}`}
                  onClick={() => zoomTo(b.item.id)}
                >
                  <span className="ms-telescope-logos" aria-hidden="true">{b.item.tools?.slice(0, 3).map((tool) => <ToolLogo key={tool.id} tool={tool} size={30} />)}</span>
                  <strong>{b.item.label}</strong>
                  {(() => {
                    const cost = areaCosts.get(b.item.id) || 0;
                    const count = b.item.tools?.length || 0;
                    const tools = en ? `${count} ${count === 1 ? "tool" : "tools"}` : `${count} outil${count > 1 ? "s" : ""}`;
                    return <>
                      <span className="ms-telescope-count">{byCost ? (cost > 0 ? money(cost) : (en ? "Free" : "Gratuit")) : tools}</span>
                      <span className="ms-telescope-sub">{byCost ? tools : (cost > 0 ? money(cost) : "")}</span>
                    </>;
                  })()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
