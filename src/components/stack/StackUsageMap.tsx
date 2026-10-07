import { useMemo, useState } from "react";
import ToolLogo from "@/components/ToolLogo";
import { AREA_COLORS, type Territory } from "@/components/stack/StackAreaBoard";
import { formatAmount, type Currency } from "@/lib/currencyRates";

/**
 * Carte des usages du tableau de bord Ma stack : une bulle par domaine, sa
 * taille suit le coût mensuel (ou le nombre d'outils). Ce n'est plus une vue à
 * part : un clic sur une bulle filtre tout le tableau de bord (budget,
 * recoupements, outils), un second clic revient à toute la stack.
 * Disposition : un bandeau de bulles alignées (aire proportionnelle au poids),
 * plus compact que l'empilement circulaire qui prenait une page entière.
 * Coûts : mêmes règles que le reste de la page (offres d'entrée attestées,
 * freemium à 0 sauf « Je paie », total converti au taux daté).
 */

interface Props {
  territories: Territory[];
  areaCosts: Map<string, number>;
  activeId: string;
  onChoose: (id: string) => void;
  currency: Currency;
  lang: "fr" | "en";
}

export default function StackUsageMap({ territories, areaCosts, activeId, onChoose, currency, lang }: Props) {
  const en = lang === "en";
  const [sizeBy, setSizeBy] = useState<"cost" | "tools">("cost");
  const maxCost = Math.max(0, ...areaCosts.values());
  const byCost = sizeBy === "cost" && maxCost > 0;
  const money = (amount: number) => `≈ ${formatAmount(Math.round(amount), currency, lang)}${en ? "/mo" : "/mois"}`;
  const colorOf = (id: string) => AREA_COLORS[Math.max(0, territories.findIndex((t) => t.id === id)) % AREA_COLORS.length];
  // Area proportional to weight: diameter follows sqrt, between 96 and 232px,
  // costliest first.
  const bubbles = useMemo(() => {
    const items = territories.map((t) => ({ item: t, weight: byCost ? 1 + 15 * (areaCosts.get(t.id) || 0) / maxCost : t.tools.length }));
    const top = Math.max(1, ...items.map((i) => i.weight));
    return items.sort((a, b) => b.weight - a.weight || a.item.label.localeCompare(b.item.label))
      .map((i) => ({ ...i, diameter: Math.round(96 + 136 * Math.sqrt(i.weight / top)) }));
  }, [territories, byCost, areaCosts, maxCost]);

  return (
    <div className="ms-map" role="group" aria-label={en ? "My tools by use" : "Mes outils par usage"}>
      <header className="ms-map-head">
        <p>{byCost
          ? (en ? "Bubble size is the monthly cost. Tap an area to focus on it." : "La taille des bulles suit le coût mensuel. Touchez un domaine pour zoomer dessus.")
          : (en ? "Bubble size is the number of tools. Tap an area to focus on it." : "La taille des bulles suit le nombre d’outils. Touchez un domaine pour zoomer dessus.")}</p>
        <div className="ms-size-switch" role="group" aria-label={en ? "Bubble size" : "Taille des bulles"}>
          <button type="button" aria-pressed={sizeBy === "cost"} onClick={() => setSizeBy("cost")}>{en ? "Cost" : "Coût"}</button>
          <button type="button" aria-pressed={sizeBy === "tools"} onClick={() => setSizeBy("tools")}>{en ? "Tools" : "Outils"}</button>
        </div>
      </header>
      <div className="ms-map-strip" data-filtered={activeId !== "all" || undefined}>
        {bubbles.map(({ item, diameter }, index) => {
          const cost = areaCosts.get(item.id) || 0;
          const count = item.tools.length;
          const tools = en ? `${count} ${count === 1 ? "tool" : "tools"}` : `${count} outil${count > 1 ? "s" : ""}`;
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className="ms-telescope-bubble"
              aria-pressed={active}
              style={{ ["--d" as string]: diameter, ["--bubble-color" as string]: colorOf(item.id), ["--bubble-delay" as string]: `${index * 50}ms` }}
              aria-label={`${item.label}, ${tools}${cost > 0 ? `, ${money(cost)}` : ""}`}
              onClick={() => onChoose(active ? "all" : item.id)}
            >
              <span className="ms-telescope-logos" aria-hidden="true">{item.tools.slice(0, 3).map((tool) => <ToolLogo key={tool.id} tool={tool} size={26} />)}</span>
              <strong>{item.label}</strong>
              <span className="ms-telescope-count">{byCost ? (cost > 0 ? money(cost) : (en ? "Free" : "Gratuit")) : tools}</span>
              <span className="ms-telescope-sub">{byCost ? tools : (cost > 0 ? money(cost) : "")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
