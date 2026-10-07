import ToolLogo from "@/components/ToolLogo";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { convertAmount, formatAmount, type Currency } from "@/lib/currencyRates";
import { toolMonthlyCost } from "@/lib/stackCost";
import { formatNativePrice, pickNativePrice, toolKey } from "@/lib/stackView";

/**
 * Question « Lesquels payez-vous ? » de Ma stack, dans une fenêtre : une
 * question de réglage qu'on se pose une fois, pas une section permanente.
 * Les freemium comptent 0 tant que la personne ne dit pas qu'elle paie
 * (décision de Michael, 7 oct. 2026). Chaque outil : son offre payante
 * d'entrée (prix natif, sans conversion) et un interrupteur ; le pied dit ce
 * que les déclarations ajoutent au total (converti, comme le total).
 * Fermer la fenêtre vaut réponse : ces outils ne seront plus redemandés.
 */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freemium: ToolSummary[];
  paid: { isPaid: (slug: string) => boolean; setPaid: (slug: string, value: boolean) => void };
  currency: Currency;
  lang: "fr" | "en";
}

export default function StackFreemiumPlans({ open, onOpenChange, freemium, paid, currency, lang }: Props) {
  const en = lang === "en";
  // Fixed alphabetical order: a row must not move under the finger when switched.
  const tools = [...freemium].sort((a, b) => a.name.localeCompare(b.name, lang));
  const declared = tools.filter((tool) => paid.isPaid(toolKey(tool)));
  const added = declared.reduce((sum, tool) => {
    const cost = toolMonthlyCost(tool, paid.isPaid, lang);
    return cost.kind === "paid" ? sum + convertAmount(cost.monthly, cost.currency, currency) : sum;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ms-sheet">
        <div className="ms-sheet-head">
          <DialogTitle>{en ? "Which ones do you pay for?" : "Lesquels payez-vous ?"}</DialogTitle>
          <DialogDescription>{en
            ? "These freemium tools count as free until you say you pay. Each one you switch on adds its entry paid plan to your budget."
            : "Ces outils freemium comptent 0 tant que vous ne dites pas que vous payez. Chaque outil activé ajoute son offre payante d’entrée à votre budget."}</DialogDescription>
        </div>
        <ul className="ms-freemium-list">
          {tools.map((tool) => {
            const on = paid.isPaid(toolKey(tool));
            const price = pickNativePrice(tool, lang);
            const usable = price && price.period !== "once" ? price : null;
            return (
              <li key={tool.id} className={on ? "is-on" : undefined}>
                <span className="ms-freemium-tool">
                  <ToolLogo tool={tool} size={32} />
                  <span><strong>{tool.name}</strong><small>{usable
                    ? (en ? `Paid from ${formatNativePrice(usable, lang)}` : `Payant dès ${formatNativePrice(usable, lang)}`)
                    : (en ? "Paid price not checked" : "Prix payant non relevé")}</small></span>
                </span>
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
        <div className="ms-sheet-foot">
          <p aria-live="polite">{declared.length === 0
            ? (en ? "None paid: your budget stays as it is." : "Aucun payé : votre budget reste tel quel.")
            : en ? `${declared.length} paid, + ≈ ${formatAmount(Math.round(added), currency, lang)}/mo in your budget` : `${declared.length} payé${declared.length > 1 ? "s" : ""}, + ≈ ${formatAmount(Math.round(added), currency, lang)}/mois au budget`}</p>
          <button type="button" className="tt-button-primary ms-sheet-done" onClick={() => onOpenChange(false)}>{en ? "Done" : "C’est noté"}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
