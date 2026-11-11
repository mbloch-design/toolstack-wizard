import type { ReactNode, Ref } from "react";
import { StoryHero } from "@/ds/Narrative/Narrative";
import Tag from "@/ds/Tag/Tag";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import { useLang } from "@/hooks/useLang";
import { useCurrency } from "@/hooks/useCurrency";
import { useStackTrade } from "@/hooks/useStackTrade";
import { convertAmount, formatAmount } from "@/lib/currencyRates";
import type { Trade } from "@/lib/personalStack";

/** Set when the onboarding opens the space; the first visit after it is still part of the welcome. */
export const ONBOARDED_KEY = "tooltrim-stack-onboarded";
const FRESH_MS = 30 * 60 * 1000;
export function markOnboarded() { try { sessionStorage.setItem(ONBOARDED_KEY, String(Date.now())); } catch { /* private mode */ } }
export function isFreshFromOnboarding() {
  try { const at = Number(sessionStorage.getItem(ONBOARDED_KEY)); return at > 0 && Date.now() - at < FRESH_MS; } catch { return false; }
}
/**
 * A first name to greet with, or null. A provider handle ("blochmic-ops", "jdoe42")
 * or an address is not a name: then the onboarding asks for one.
 */
export function firstNameOf(display: string | null | undefined): string | null {
  const clean = display?.trim().replace(/\s+/g, " ");
  if (!clean) return null;
  if (!/\s/.test(clean) && /[-_.\d@]/.test(clean)) return null;
  const first = clean.split(" ")[0];
  return first.charAt(0).toLocaleUpperCase() + first.slice(1);
}
const TRADE_LABELS: Record<Trade, [string, string]> = {
  dev: ["Développement", "Development"], designer: ["Design", "Design"], consultant: ["Conseil", "Consulting"],
  content: ["Création de contenu", "Content creation"], ops: ["Opérations", "Operations"], solo: ["Un peu de tout", "A bit of everything"],
};

/**
 * The person's presence at the top of their space (23/10/2026): a greeting by
 * first name for the time of day, one line with a smile that follows where
 * they are, and what the onboarding learnt (trade, day rate and the hour it
 * is worth). Only the current account's chosen name is used; never derive a
 * name from email.
 */
/** What the hero says: the greeting, the verdict (what is waiting), its humour, the person's facts. */
export function useStackWelcome({ empty, pending = 0, cards = 0 }: { empty: boolean; pending?: number; cards?: number }) {
  const { user, syncStatus } = useStackAccount();
  const { profile } = useAccountExperience();
  const { t, lang } = useLang();
  const { currency } = useCurrency();
  const { trade, dailyRate } = useStackTrade();
  // Everyone is greeted: by first name when signed in, simply otherwise.
  const signedIn = !!user && syncStatus !== "session-expired";
  const full = signedIn && profile?.userId === user!.id ? profile.displayName : null;
  const name = firstNameOf(full);
  const hour = new Date().getHours();
  const evening = hour >= 18 || hour < 5;
  const hello = name ? t(`${evening ? "Bonsoir" : "Bonjour"}, ${name}`, `${evening ? "Good evening" : "Hi"}, ${name}`) : t(evening ? "Bonsoir" : "Bonjour", evening ? "Good evening" : "Hello");
  const s = pending > 1 ? "s" : "";
  // The verdict is the title, the humour its lead.
  const [title, lead] = empty
    ? [t("Bienvenue chez vous.", "Make yourself at home."), t("Commençons par un outil que vous aimez utiliser.", "Start with a tool you enjoy using.")]
    : pending > 0 && isFreshFromOnboarding()
      ? [t("Bienvenue chez vous.", "Welcome home."), t(`${pending} petite${s} décision${s}, une à la fois, et c’est plié.`, `${pending} small decision${s}, one at a time, and you’re done.`)]
      : pending > 0
        ? [t(`${pending} petite${s} décision${s} vous attend${pending > 1 ? "ent" : ""}.`, `${pending} small decision${s} waiting.`), t("Promis, aucune ne mord.", "None of them bite.")]
        : cards > 0
          ? [t(`${cards} carte${cards > 1 ? "s" : ""} à jouer dans Vos usages.`, `${cards} card${cards > 1 ? "s" : ""} to play in Your use.`), t("Promis, aucune ne mord.", "None of them bite.")]
          : [t("Votre stack est à jour.", "Your stack is up to date."), t("Rien à trancher. Profitez-en, ça ne dure jamais très longtemps.", "Nothing to decide. Enjoy it, it never lasts very long.")];
  const rate = dailyRate ? convertAmount(dailyRate.amount, dailyRate.currency, currency) : null;
  const money = (amount: number) => formatAmount(Math.round(amount), currency, lang);
  const facts = [
    ...(trade ? [{ label: t(...TRADE_LABELS[trade]) }] : []),
    ...(rate ? [{ label: t(`${money(rate)}/jour · votre heure ≈ ${money(rate / 7)}`, `${money(rate)}/day · your hour ≈ ${money(rate / 7)}`), title: t("Sur une journée de 7 heures", "On a 7-hour day") }] : []),
  ];
  return { greeting: <>{hello} <span aria-hidden="true">👋</span></>, eyebrow: t("Ma stack", "My stack"), verdict: title, lead, facts,
    // The humour the stack's hero keeps under its cost (registre 11/11/2026): the whole verdict, or the rest line once nothing waits.
    quip: empty ? null : pending > 0 || cards > 0 ? `${title} ${lead}` : lead };
}

export type StackWelcome = ReturnType<typeof useStackWelcome>;

/** The hero without the stack's figure (no stack yet): the greeting, the verdict, its humour, the person's facts. */
export default function StackPersonalWelcome({ empty, pending = 0, cards = 0, titleRef, secondary }: {
  empty: boolean; pending?: number; cards?: number; titleRef?: Ref<HTMLHeadingElement>; action?: ReactNode; secondary?: ReactNode; tools?: unknown;
}) {
  const welcome = useStackWelcome({ empty, pending, cards });
  return <StoryHero greeting={welcome.greeting} eyebrow={welcome.eyebrow} titleRef={titleRef} title={<span data-verdict="">{welcome.verdict}</span>}
    lead={<span data-welcome-message="">{welcome.lead}</span>}
    aside={<>{welcome.facts.map((fact) => <Tag key={fact.label} title={fact.title}>{fact.label}</Tag>)}{secondary}</>} />;
}
