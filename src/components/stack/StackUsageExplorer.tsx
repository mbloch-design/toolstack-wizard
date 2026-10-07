import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ToolLogo from "@/components/ToolLogo";
import StackBubblePeek from "@/components/stack/StackBubblePeek";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { stackDisplayLabel, stackMapTerritories } from "@/lib/stackUsage";
import { stackCatalogPrice, toolKey } from "@/lib/stackView";
import { budgetEntry, estimateStackBudget, formatApproximateBudget } from "@/lib/stackBudget";
import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCY_RATE_DATE } from "@/lib/currencyRates";
import type { ToolSummary } from "@/hooks/useSupabaseData";

type Territory = ReturnType<typeof stackMapTerritories>[number];
type Bubble = { id: string; label: string; weight: number; tool?: ToolSummary; tools?: ToolSummary[] };

// Deterministic packing: no moving simulation, stable positions for the same selection.
function pack(items: Bubble[], inside: boolean) {
  const placed: { item: Bubble; x: number; y: number; r: number }[] = [];
  for (const item of [...items].sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))) {
    const r = Math.max(item.tool ? 60 : 80, 60 * Math.sqrt(item.weight));
    let x = 0, y = 0;
    if (placed.length) {
      for (let step = 1; step < 20000; step++) {
        const angle = step * 2.399963;
        const distance = 3 * Math.sqrt(step);
        x = Math.cos(angle) * distance; y = Math.sin(angle) * distance;
        if (placed.every(p => Math.hypot(x - p.x, y - p.y) >= r + p.r + 12)) break;
      }
    }
    placed.push({ item, x, y, r });
  }
  if (!placed.length) return [];
  const left = Math.min(...placed.map(p => p.x - p.r)), right = Math.max(...placed.map(p => p.x + p.r));
  const top = Math.min(...placed.map(p => p.y - p.r)), bottom = Math.max(...placed.map(p => p.y + p.r));
  const radius = Math.max(...placed.map(p => Math.hypot(p.x - (left + right) / 2, p.y - (top + bottom) / 2) + p.r));
  const size = Math.max(inside ? radius * 2 + 24 : Math.max(right - left, bottom - top) + 32, items.every(item => item.tool) ? 400 : 320);
  return placed.map(p => ({ ...p, left: (p.x - p.r - (left + right) / 2 + size / 2) / size * 100,
    top: (p.y - p.r - (top + bottom) / 2 + size / 2) / size * 100, diameter: p.r * 2 / size * 100 }));
}

export default function StackUsageExplorer({ territories, lang, selectedId, navigationRequest, onDomainChange, onSelect, onNavigate }: {
  territories: Territory[]; lang: string; selectedId?: string; onSelect: (slug: string) => void; onNavigate: () => void;
  navigationRequest?: { id: string; revision: number } | null; onDomainChange?: (id: string) => void;
}) {
  const [domainId, setDomainId] = useState<string | null>(null);
  const [usageId, setUsageId] = useState<string | null>(null);
  const [pricesOpen, setPricesOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const locked = useRef(false);
  const handledRequest = useRef<number | null>(null);
  const [moving, setMoving] = useState(false);
  const incoming = useRef<{ direction: "in" | "out"; x: number; y: number; scale: number } | null>(null);
  const entrances = useRef(new Map<string, { x: number; y: number; scale: number }>());
  const domain = territories.find(t => t.id === domainId);
  const active = domain?.groups.find(g => g.id === usageId);
  const selectedTool = active?.tools.find(tool => tool.id === selectedId);
  const en = lang === "en";
  const { currency } = useCurrency();
  const rootLabel = en ? "All uses" : "Tous les usages";
  useEffect(() => { setPricesOpen(false); }, [domainId, usageId, selectedId]);
  useEffect(() => {
    if (!selectedId) return;
    const owner = territories.find(t => t.tools.some(tool => tool.id === selectedId));
    const group = owner?.groups.find(g => g.tools.some(tool => tool.id === selectedId));
    if (owner && group) { setDomainId(owner.id); setUsageId(group.id); onDomainChange?.(owner.id); }
  }, [selectedId, territories]);
  async function navigate(nextDomain: string | null, nextUsage: string | null = null, itemId?: string) {
    if (locked.current) return;
    const targetDomain = territories.find(t => t.id === nextDomain);
    if (targetDomain?.groups.length === 1 && !nextUsage) nextUsage = targetDomain.groups[0].id;
    if (nextDomain === domainId && nextUsage === usageId) { onDomainChange?.(nextDomain ?? "all"); onNavigate(); return; }
    const currentDepth = active ? 2 : domain ? 1 : 0;
    const nextDepth = nextUsage ? 2 : nextDomain ? 1 : 0;
    const direction = nextDepth > currentDepth ? "in" : "out";
    const bubble = bubbles.find(b => b.item.id === itemId);
    const destination = `${nextDomain ?? "root"}/${nextUsage ?? ""}`;
    const current = `${domainId ?? "root"}/${usageId ?? ""}`;
    const point = bubble ? { x: bubble.left + bubble.diameter / 2, y: bubble.top + bubble.diameter / 2, scale: 100 / bubble.diameter }
      : entrances.current.get(nextDepth === 0 ? `${domainId}/` : current) ?? { x: 50, y: 50, scale: 3 };
    if (direction === "in") {
      entrances.current.set(destination, point);
      if (!domainId && nextDomain) entrances.current.set(`${nextDomain}/`, point);
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const field = fieldRef.current;
    locked.current = true; setMoving(true);
    if (field && !reduced) {
      const zoom = `translate(${50 - point.x}%, ${50 - point.y}%) scale(${point.scale})`;
      const animation = field.animate([
        { transform: "none", opacity: 1, transformOrigin: `${point.x}% ${point.y}%` },
        { transform: direction === "in" ? zoom : "scale(.3)", opacity: 0, transformOrigin: `${point.x}% ${point.y}%` },
      ], { duration: 160, easing: "cubic-bezier(.3,0,.7,1)", fill: "forwards" });
      try { await animation.finished; } catch { /* Interrupted navigation. */ }
      animation.cancel();
    }
    incoming.current = reduced ? null : { direction, ...point };
    onNavigate(); setDomainId(nextDomain); setUsageId(nextUsage); onDomainChange?.(nextDomain ?? "all");
    if (reduced || (nextDomain === domainId && nextUsage === usageId)) { locked.current = false; setMoving(false); }
  }
  const items: Bubble[] = active
    ? active.tools.map(tool => ({ id: tool.id, label: tool.name, weight: 1, tool }))
    : domain ? domain.groups.map(g => ({ id: g.id, label: stackDisplayLabel(g.label, lang), weight: g.tools.length, tools: g.tools }))
    : territories.map(t => ({ id: t.id, label: t.label, weight: t.tools.length, tools: t.tools }));
  const bubbles = useMemo(() => pack(items, Boolean(domain)), [territories, domainId, usageId, lang]);
  useLayoutEffect(() => {
    const entry = incoming.current;
    const field = fieldRef.current;
    if (!entry || !field) return;
    incoming.current = null;
    const origin = entry.direction === "in" ? "50% 50%" : `${entry.x}% ${entry.y}%`;
    const animation = field.animate([
      { transform: entry.direction === "in" ? "scale(.3)" : `translate(${50 - entry.x}%, ${50 - entry.y}%) scale(${entry.scale})`, opacity: 0, transformOrigin: origin },
      { transform: "none", opacity: 1, transformOrigin: origin },
    ], { duration: 230, easing: "cubic-bezier(.16,1,.3,1)" });
    void animation.finished.catch(() => {}).then(() => { locked.current = false; setMoving(false); });
    return () => { animation.cancel(); locked.current = false; };
  }, [domainId, usageId]);
  // Top tabs are shortcuts through the same path as bubbles, not a reduced tree.
  // Keep the latest request pending while a zoom is finishing.
  useEffect(() => {
    if (!navigationRequest || handledRequest.current === navigationRequest.revision || moving || locked.current) return;
    const target = territories.find(territory => territory.id === navigationRequest.id);
    if (navigationRequest.id !== "all" && !target) return;
    handledRequest.current = navigationRequest.revision;
    if (target?.tools.length === 1) onSelect(toolKey(target.tools[0]));
    else void navigate(target?.id ?? null, null, target?.id);
  }, [navigationRequest, moving, territories]);
  const title = active ? stackDisplayLabel(active.label, lang) : domain?.label ?? (en ? "Your uses" : "Vos usages");
  const priceGroups = active ? [{ id: active.id, label: title, tools: active.tools }]
    : domain ? [{ id: domain.id, label: domain.label, tools: domain.tools }] : territories;
  const budget = estimateStackBudget(priceGroups.flatMap(group => group.tools), currency, lang);
  const backToDomain = Boolean(active && domain && domain.groups.length > 1);
  function open(item: Bubble) {
    if (locked.current) return;
    if (item.tool) onSelect(toolKey(item.tool));
    else if (item.tools?.length === 1) onSelect(toolKey(item.tools[0]));
    else void navigate(domain ? domain.id : item.id, domain ? item.id : null, item.id);
  }
  function navTools(tools: ToolSummary[]) {
    return <ul className="ms-usage-tree-tools">{tools.map(tool => <li key={tool.id}>
      <button type="button" className="ms-usage-tree-tool" disabled={moving} aria-current={tool.id === selectedId ? "page" : undefined} onClick={() => { if (!locked.current) onSelect(toolKey(tool)); }} title={tool.name}>
        <ToolLogo tool={tool} size={28} /><span className="ms-usage-row-label">{tool.name}</span>
      </button>
    </li>)}</ul>;
  }
  return <section className="ms-usage-explorer" aria-label={en ? "Explore by use" : "Explorer par usage"}>
    <nav className="ms-usage-nav" aria-label={en ? "Telescope exploration" : "Exploration du télescope"}>
      <button type="button" className="ms-usage-tree-root" disabled={moving} aria-current={!domain ? "location" : undefined} onClick={() => navigate(null)}>
        <span className="ms-usage-row-label">{rootLabel}</span><span className="ms-usage-tree-count">{territories.reduce((sum, t) => sum + t.tools.length, 0)}</span>
      </button>
      <ul className="ms-usage-tree">{territories.map(territory => {
        const expanded = territory.id === domainId;
        return <li key={territory.id}>
          <button type="button" className={expanded ? "ms-usage-tree-ancestor" : undefined} disabled={moving} aria-expanded={expanded} aria-current={expanded && !active ? "location" : undefined}
            onClick={() => territory.tools.length === 1 ? onSelect(toolKey(territory.tools[0])) : navigate(territory.id, null, territory.id)}>
            <ChevronRight size={14} className={expanded ? "ms-usage-tree-chevron--open" : undefined} aria-hidden />
            <span className="ms-usage-row-label">{territory.label}</span><span className="ms-usage-tree-count">{territory.tools.length}</span>
          </button>
          {expanded && <ul className="ms-usage-tree-groups">{territory.groups.map(group => {
            const groupOpen = group.id === usageId;
            return <li key={group.id}>
              <button type="button" className={groupOpen ? "ms-usage-tree-ancestor" : undefined} disabled={moving} aria-expanded={groupOpen} aria-current={groupOpen && !selectedTool ? "location" : undefined}
                onClick={() => group.tools.length === 1 ? onSelect(toolKey(group.tools[0])) : navigate(territory.id, group.id, group.id)}>
                <ChevronRight size={14} className={groupOpen ? "ms-usage-tree-chevron--open" : undefined} aria-hidden />
                <span className="ms-usage-row-label">{stackDisplayLabel(group.label, lang)}</span><span className="ms-usage-tree-count">{group.tools.length}</span>
              </button>
              {groupOpen && navTools(group.tools)}
            </li>;
          })}</ul>}
        </li>;
      })}</ul>
    </nav>
    <div className={`ms-usage-stage${moving ? " ms-usage-stage--moving" : ""}`} role="region" aria-label={title} aria-busy={moving}>
      <header className="ms-usage-stage-heading" role="group" aria-label={en ? "Telescope navigation" : "Navigation du télescope"}>
        <button type="button" className="ms-telescope-back" disabled={!domain || moving}
          onClick={() => selectedTool ? navigate(domain!.id, active!.id) : navigate(backToDomain ? domain!.id : null)}
          aria-label={selectedTool ? en ? `Back to ${title}` : `Revenir à ${title}` : en ? `Back to ${backToDomain ? domain?.label : rootLabel}` : `Revenir à ${backToDomain ? domain?.label : rootLabel}`}>
          <ChevronLeft size={16} aria-hidden /><span>{en ? "Back" : "Retour"}</span>
        </button>
    <nav className="ms-usage-breadcrumb" aria-label={en ? "Exploration path" : "Fil d’Ariane"}>
      <ol>
        <li>{domain ? <button type="button" disabled={moving} onClick={() => navigate(null)}>{rootLabel}</button> : <span aria-current="page">{rootLabel}</span>}</li>
        {domain && <li><ChevronRight size={14} aria-hidden />{active ? <button type="button" disabled={moving} onClick={() => navigate(domain.id)}>{domain.label}</button> : <span aria-current="page">{domain.label}</span>}</li>}
        {active && <li><ChevronRight size={14} aria-hidden />{selectedTool ? <button type="button" disabled={moving} onClick={() => navigate(domain!.id, active.id)}>{stackDisplayLabel(active.label, lang)}</button> : <span aria-current="page">{stackDisplayLabel(active.label, lang)}</span>}</li>}
        {selectedTool && <li><ChevronRight size={14} aria-hidden /><span aria-current="page">{selectedTool.name}</span></li>}
      </ol>
    </nav>
        {!selectedTool && <Popover open={pricesOpen} onOpenChange={setPricesOpen}>
          <PopoverTrigger asChild><button type="button" className="ms-telescope-prices-button" disabled={moving}>{en ? "Estimated budget" : "Budget estimé"}{budget.included > 0 && <span>{formatApproximateBudget(budget, lang, currency)}{en ? "/month" : "/mois"}{budget.excluded > 0 ? "*" : ""}</span>}</button></PopoverTrigger>
          <PopoverContent className="ms-telescope-prices" align="end" sideOffset={8}>
            <h3>{en ? "Estimated budget" : "Budget estimé"}</h3>
            <p className="ms-budget-panel-total">{formatApproximateBudget(budget, lang, currency)}{budget.included > 0 && <small>{en ? " /month" : " /mois"}</small>}</p>
            {budget.included > 0 && <p className="ms-telescope-prices-note">{en ? "Annual equivalent: " : "Équivalent annuel : "}{formatApproximateBudget(budget, lang, currency, true)}</p>}
            <p className="ms-telescope-prices-note">{budget.included}/{budget.total} {en ? "tools included. Entry paid plans, per tool." : "outils pris en compte. Offres payantes d’entrée, par outil."}{budget.excluded > 0 && (en ? " Partial total." : " Total partiel.")}</p>
            <p className="ms-telescope-prices-note">{en ? "Indicative conversion, site rates dated " : "Conversion indicative, taux du site datés du "}{CURRENCY_RATE_DATE}{en ? ". $ treated as USD." : ". $ assimilé à USD."}</p>
            <div className="ms-telescope-prices-list">{priceGroups.map(group => <section key={group.id}>
              <h4 className="ms-budget-group-heading"><span>{group.label}</span><span>{formatApproximateBudget(estimateStackBudget(group.tools, currency, lang), lang, currency)}</span></h4>
              {group.tools.map(tool => {
                const price = stackCatalogPrice(tool, lang);
                const nativePaid = price && !tool.priceUndisclosed ? (en ? tool.pricingEn?.paid || tool.pricing?.paid : tool.pricing?.paid)?.trim() : undefined;
                const mainPrice = price && /^(Dès|From) /.test(price) && nativePaid ? nativePaid : price;
                return <button type="button" key={tool.id} className="ms-telescope-price-row" onClick={() => { setPricesOpen(false); onSelect(toolKey(tool)); }}>
                  <ToolLogo tool={tool} size={28} /><span className="ms-telescope-price-copy"><strong>{tool.name}</strong><span>{mainPrice || (en ? "Not available" : "Non renseigné")}</span>
                    {price === "Freemium" && nativePaid && <span>{nativePaid}</span>}
                    {!budgetEntry(tool, lang) && <span>{en ? "Excluded from the estimate" : "Non inclus dans l’estimation"}</span>}
                  </span><ChevronRight size={14} aria-hidden />
                </button>;
              })}
            </section>)}</div>
          </PopoverContent>
        </Popover>}
      </header>
      <div className={`ms-bubble-canvas${domain ? " ms-bubble-canvas--inside" : ""}`}>
        {domain && <h3 className="ms-telescope-level-title">{title}</h3>}
        <div className="ms-bubble-field" ref={fieldRef} key={`${domainId}/${usageId}`}>{bubbles.map(b => {
          const bubbleBudget = estimateStackBudget(b.item.tool ? [b.item.tool] : b.item.tools || [], currency, lang);
          const bubblePrice = bubbleBudget.included > 0 ? `${formatApproximateBudget(bubbleBudget, lang, currency)}${en ? "/mo" : "/mois"}${bubbleBudget.excluded > 0 ? "*" : ""}` : "—";
          return <StackBubblePeek key={b.item.id} tools={b.item.tool ? [b.item.tool] : b.item.tools || []} label={b.item.label} lang={lang} disabled={moving} group={!b.item.tool} onExplore={() => open(b.item)} onSelect={onSelect}><button type="button" disabled={moving}
          className={`ms-usage-bubble${b.item.tool && b.item.tool.id === selectedId ? " ms-usage-bubble--selected" : ""}`}
          style={{ left: `${b.left}%`, top: `${b.top}%`, width: `${b.diameter}%`, height: `${b.diameter}%` }}
          data-tool-id={b.item.tool?.id}
          title={`${b.item.label} · ${bubbleBudget.included}/${bubbleBudget.total} ${en ? "tools included" : "outils pris en compte"} · ${bubbleBudget.included ? bubblePrice : en ? "Price unavailable" : "Tarif non renseigné"}`}
          aria-label={b.item.tool ? b.item.label : `${b.item.label}, ${b.item.weight} ${en ? b.item.weight === 1 ? "tool" : "tools" : b.item.weight === 1 ? "outil" : "outils"}`}
          aria-pressed={b.item.tool ? b.item.tool.id === selectedId : undefined}
          onClick={() => open(b.item)}>
          <span className="ms-bubble-content">
          {b.item.tool ? <ToolLogo tool={b.item.tool} size={40} className="ms-bubble-tool-logo" /> : <span className="ms-bubble-logos" aria-hidden="true">
            {b.item.tools?.slice(0, 3).map(tool => <ToolLogo key={tool.id} tool={tool} size={b.item.weight === 1 && b.diameter >= 18 ? 40 : 28} />)}
          </span>}
          <strong>{b.item.label}</strong>
          <span className="ms-bubble-budget">{bubbleBudget.included > 0 ? <span>{formatApproximateBudget(bubbleBudget, lang, currency)}<small>{en ? "/mo" : "/mois"}</small>{bubbleBudget.excluded > 0 ? "*" : ""}</span> : "—"}</span>
          </span>
        </button></StackBubblePeek>;
        })}</div>
      </div>
    </div>
  </section>;
}
