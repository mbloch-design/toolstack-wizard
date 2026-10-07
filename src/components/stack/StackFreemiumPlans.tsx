import ToolLogo from "@/components/ToolLogo";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { convertAmount, formatAmount, type Currency } from "@/lib/currencyRates";
import { toolMonthlyCost } from "@/lib/stackCost";
import { formatNativePrice, pickNativePrice, stackCatalogPrice, toolKey } from "@/lib/stackView";

/**
 * Widget « Freemium » de Ma stack : les outils freemium comptent 0 tant que la
 * personne ne dit pas qu'elle paie (décision de Michael, 7 oct. 2026). C'est
 * souvent l'essentiel du vrai budget, donc un widget à part entière plutôt
 * qu'un repli : chaque outil avec son offre payante d'entrée (prix natif, sans
 * conversion) et un interrupteur ; l'en-tête dit ce que les déclarations
 * ajoutent au total (converti, comme le total).
 */

interface Props {
  tools: ToolSummary[];
  paid: { isPaid: (slug: string) => boolean; setPaid: (slug: string, value: boolean) => void };
  currency: Currency;
  lang: "fr" | "en";
  onSelect: (slug: string) => void;
}

export default function StackFreemiumPlans({ tools, paid, currency, lang, onSelect }: Props) {
  const en = lang === "en";
  const freemium = tools.filter((tool) => stackCatalogPrice(tool, lang) === "Freemium")
    // Fixed alphabetical order: a row must not move under the finger when switched.
    .sort((a, b) => a.name.localeCompare(b.name, lang));
  if (!freemium.length) return null;
  const declared = freemium.filter((tool) => paid.isPaid(toolKey(tool)));
  const added = declared.reduce((sum, tool) => {
    const cost = toolMonthlyCost(tool, paid.isPaid, lang);
    return cost.kind === "paid" ? sum + convertAmount(cost.monthly, cost.currency, currency) : sum;
  }, 0);

  return (
    <section id="ms-freemium" className="ms-tile ms-freemium-tile" aria-labelledby="ms-freemium-title">
      <header className="ms-tile-head">
        <div>
          <h2 id="ms-freemium-title">Freemium</h2>
          <p>{en ? "Which ones do you pay for?" : "Lesquels payez-vous ?"}</p>
        </div>
        <p className="ms-freemium-count" aria-live="polite">
          <strong>{declared.length}</strong>{en ? ` of ${freemium.length} paid` : ` sur ${freemium.length} payé${declared.length > 1 ? "s" : ""}`}
          {added > 0 && <span>{en ? `+ ≈ ${formatAmount(Math.round(added), currency, lang)}/mo in the budget` : `+ ≈ ${formatAmount(Math.round(added), currency, lang)}/mois au budget`}</span>}
        </p>
      </header>
      <p className="ms-freemium-lead">{en
        ? "They count as free until you say you pay. Each one you switch on adds its entry paid plan to the budget."
        : "Ils comptent 0 tant que vous ne dites pas que vous payez. Chaque outil activé ajoute son offre payante d’entrée au budget."}</p>
      <ul className="ms-freemium-list">
        {freemium.map((tool) => {
          const on = paid.isPaid(toolKey(tool));
          const price = pickNativePrice(tool, lang);
          const usable = price && price.period !== "once" ? price : null;
          return (
            <li key={tool.id} className={on ? "is-on" : undefined}>
              <button type="button" className="ms-freemium-tool" onClick={() => onSelect(toolKey(tool))}>
                <ToolLogo tool={tool} size={32} />
                <span><strong>{tool.name}</strong><small>{usable
                  ? (en ? `Paid from ${formatNativePrice(usable, lang)}` : `Payant dès ${formatNativePrice(usable, lang)}`)
                  : (en ? "Paid price not checked" : "Prix payant non relevé")}</small></span>
              </button>
              <button type="button" role="switch" aria-checked={on} className="ms-switch"
                aria-label={en ? `I pay for ${tool.name}` : `Je paie ${tool.name}`}
                onClick={() => paid.setPaid(toolKey(tool), !on)}>
                <span className="ms-switch-label">{on ? (en ? "I pay" : "Je paie") : (en ? "Free" : "Gratuit")}</span>
                <span className="ms-switch-track" aria-hidden="true"><span /></span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
