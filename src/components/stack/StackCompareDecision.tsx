import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";
import { useStackPins } from "@/hooks/useStackPins";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { useCurrency } from "@/hooks/useCurrency";
import { useStackPaidPlans } from "@/hooks/useStackPaidPlans";
import { pairKey, useStackDecisions } from "@/hooks/useStackDecisions";
import { convertAmount, formatAmount } from "@/lib/currencyRates";
import { toolMonthlyCost } from "@/lib/stackCost";
import { toolKey } from "@/lib/stackView";

/**
 * Sur un comparatif ouvert depuis Ma stack (ou n'importe quel comparatif dont
 * un outil est dans ma stack) : la suite de « Comparer ». Après le verdict, la
 * décision pour ma stack, avec ce que ça change sur le budget :
 * - les deux dans ma stack : garder l'un (l'autre part), ou garder les deux ;
 * - un seul : le remplacer par l'autre, ou le garder.
 * Annulable, puis retour à ma stack. Rien n'est rendu avant le montage : le
 * HTML prérendu reste le même pour tout le monde.
 */

interface Props { toolA: Tool; toolB: Tool; prefix: string; lang: "fr" | "en"; t: (fr: string, en: string) => string }

export default function StackCompareDecision({ toolA, toolB, prefix, lang, t }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { state } = useStackPins();
  const { tools } = useToolSummaries({ refreshRemote: false });
  const { currency } = useCurrency();
  const plans = useStackPaidPlans();
  const money = (amount: number) => `≈ ${formatAmount(Math.round(amount), currency, lang)}${t("/mois", "/mo")}`;
  const { decisions, decide } = useStackDecisions(t, money);
  if (!mounted) return null;

  const pinned = new Set(state.pinnedToolSlugs);
  const slugA = toolKey(toolA), slugB = toolKey(toolB);
  const inA = pinned.has(slugA) || pinned.has(toolA.id);
  const inB = pinned.has(slugB) || pinned.has(toolB.id);
  const decided = decisions[pairKey(slugA, slugB)];
  if (!inA && !inB && !decided) return null;

  const summary = (tool: Tool) => tools.find((item) => item.id === tool.id || toolKey(item) === toolKey(tool)) as ToolSummary | undefined;
  const monthly = (tool: Tool) => {
    const s = summary(tool);
    if (!s) return 0;
    const cost = toolMonthlyCost(s, plans.isPaid, lang);
    return cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0;
  };
  const stackLink = <Link className="ms-cd-link" to={`${prefix}/ma-stack`}>{t("Voir ma stack", "See my stack")}</Link>;

  let body;
  if (decided) {
    const keptName = decided.kept === slugA ? toolA.name : toolB.name;
    body = <p className="ms-cd-status">{decided.kind === "keep-both"
      ? t("Décidé : vous gardez les deux.", "Decided: you keep both.")
      : t(`Décidé : vous gardez ${keptName}.`, `Decided: you keep ${keptName}.`)}{decided.saving > 0 && <> <strong>{t(`${money(decided.saving)} en moins.`, `${money(decided.saving)} less.`)}</strong></>} {stackLink}</p>;
  } else if (inA && inB) {
    body = <>
      <p className="ms-cd-lead"><strong>{t("Les deux sont dans ma stack.", "Both are in my stack.")}</strong> {t("Vous gardez lequel ?", "Which one do you keep?")}</p>
      <div className="ms-cd-choices">
        {([[toolA, toolB], [toolB, toolA]] as const).map(([keep, drop]) => {
          const saving = monthly(drop);
          return <button key={keep.id} type="button" onClick={() => decide("keep-one", { slug: toolKey(keep), name: keep.name }, { slug: toolKey(drop), name: drop.name }, saving, "compare")}>
            <ToolLogo tool={keep} size={28} />
            <span><strong>{t(`Garder ${keep.name}`, `Keep ${keep.name}`)}</strong><small>{saving > 0 ? t(`${money(saving)} en moins`, `${money(saving)} less`) : t(`${drop.name} quitte ma stack`, `${drop.name} leaves my stack`)}</small></span>
          </button>;
        })}
        <button type="button" onClick={() => decide("keep-both", { slug: slugA, name: toolA.name }, { slug: slugB, name: toolB.name }, 0, "compare")}>
          <span><strong>{t("Garder les deux", "Keep both")}</strong><small>{t("Ils ne font pas le même travail", "They don’t do the same job")}</small></span>
        </button>
      </div>
    </>;
  } else {
    const mine = inA ? toolA : toolB, other = inA ? toolB : toolA;
    const delta = monthly(mine) - monthly(other);
    body = <>
      <p className="ms-cd-lead"><strong>{t(`${mine.name} est dans ma stack.`, `${mine.name} is in my stack.`)}</strong> {t(`Passer à ${other.name} ?`, `Switch to ${other.name}?`)}</p>
      <div className="ms-cd-choices">
        <button type="button" onClick={() => decide("replace", { slug: toolKey(other), name: other.name }, { slug: toolKey(mine), name: mine.name }, Math.max(0, delta), "compare")}>
          <ToolLogo tool={other} size={28} />
          <span><strong>{t(`Remplacer par ${other.name}`, `Replace with ${other.name}`)}</strong><small>{delta > 0 ? t(`${money(delta)} en moins (offre d’entrée)`, `${money(delta)} less (entry plan)`) : delta < 0 ? t(`${money(-delta)} en plus (offre d’entrée)`, `${money(-delta)} more (entry plan)`) : t("Même coût d’entrée ou prix non relevé", "Same entry cost or price not checked")}</small></span>
        </button>
        <button type="button" onClick={() => decide("keep-both", { slug: toolKey(mine), name: mine.name }, { slug: toolKey(other), name: other.name }, 0, "compare", t(`Noté : vous gardez ${mine.name}.`, `Noted: you keep ${mine.name}.`))}>
          <ToolLogo tool={mine} size={28} />
          <span><strong>{t(`Garder ${mine.name}`, `Keep ${mine.name}`)}</strong><small>{t("Rien ne change", "Nothing changes")}</small></span>
        </button>
      </div>
    </>;
  }

  return (
    <aside className="ms-compare-decision" aria-label={t("Décision pour ma stack", "Decision for my stack")}>
      <p className="ms-cd-eyebrow">{t("Ma stack", "My stack")}</p>
      {body}
    </aside>
  );
}
