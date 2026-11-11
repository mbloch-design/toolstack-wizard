import { useMemo } from "react";
import { ShellNote } from "@/ds/Shell/Shell";
import { RouterLink, useShellAccount } from "@/components/v2shell/ShellMenuBody";
import { firstNameOf } from "@/components/stack/StackPersonalWelcome";
import { useLang } from "@/hooks/useLang";
import { useCurrency } from "@/hooks/useCurrency";
import { useStackPins } from "@/hooks/useStackPins";
import { useStackPaidPlans } from "@/hooks/useStackPaidPlans";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { stackMonthlyCost } from "@/lib/stackCost";
import { formatAmount } from "@/lib/currencyRates";
import { toolKey } from "@/lib/stackView";

/**
 * Home, in the breadcrumb's place (11/11/2026): a greeting and where the stack stands, leading to Ma stack.
 * The cost follows Ma stack's own rules (stackMonthlyCost), so both pages say the same figure; no figure without tools.
 */
export default function HomeGreeting() {
  const { t, lang, prefix } = useLang();
  const { currency } = useCurrency();
  const who = useShellAccount();
  const { state } = useStackPins();
  const { tools } = useToolSummaries({ refreshRemote: false });
  const plans = useStackPaidPlans();
  const evening = (() => { const hour = new Date().getHours(); return hour >= 18 || hour < 5; })();
  const name = who.kind === "user" ? firstNameOf(who.name) : null;
  const hello = `${evening ? t("Bonsoir", "Good evening") : t("Bonjour", "Hello")}${name ? `, ${name}` : ""}`;
  const selected = useMemo(() => {
    const lookup = new Map(tools.flatMap((tool) => [[tool.id, tool], [toolKey(tool), tool]] as [string, ToolSummary][]));
    return state.pinnedToolSlugs.flatMap((slug) => { const tool = lookup.get(slug); return tool ? [tool] : []; });
  }, [tools, state.pinnedToolSlugs]);
  const count = state.pinnedToolSlugs.length;
  const cost = stackMonthlyCost(selected, plans.isPaid, currency, lang);
  const known = selected.length === count;
  const status = count === 0
    ? t("Votre stack en deux minutes", "Your stack in two minutes")
    : `${t(`${count} outil${count > 1 ? "s" : ""}`, `${count} tool${count > 1 ? "s" : ""}`)}${known && cost.paid > 0 ? ` · ${formatAmount(Math.round(cost.total), currency, lang)}${t("/mois", "/mo")}` : ""}`;
  return <ShellNote link={RouterLink} to={`${prefix}/ma-stack`}><strong>{hello}</strong><span aria-hidden="true">·</span><span>{status}</span></ShellNote>;
}
