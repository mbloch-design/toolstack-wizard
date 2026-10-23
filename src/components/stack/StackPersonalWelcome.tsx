import type { ReactNode } from "react";
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
export default function StackPersonalWelcome({ empty, pending = 0, children }: { empty: boolean; pending?: number; children?: ReactNode }) {
  const { user, syncStatus } = useStackAccount();
  const { profile } = useAccountExperience();
  const { t, lang } = useLang();
  const { currency } = useCurrency();
  const { trade, dailyRate } = useStackTrade();
  if (!user || syncStatus === "session-expired") return <>{children}</>;
  const full = profile?.userId === user.id ? profile.displayName : null;
  const name = full ? full.trim().split(/\s+/)[0] : null;
  const hour = new Date().getHours();
  const evening = hour >= 18 || hour < 5;
  const hello = name ? t(`${evening ? "Bonsoir" : "Bonjour"}, ${name}`, `${evening ? "Good evening" : "Hi"}, ${name}`) : t(evening ? "Bonsoir" : "Bonjour", evening ? "Good evening" : "Hello");
  const s = pending > 1 ? "s" : "";
  const message = empty
    ? t("Bienvenue chez vous. Commençons par un outil que vous aimez utiliser.", "Make yourself at home. Start with a tool you enjoy using.")
    : pending > 0 && isFreshFromOnboarding()
      ? t(`Bienvenue chez vous. ${pending} petite${s} décision${s}, une à la fois, et c’est plié.`, `Welcome home. ${pending} small decision${s}, one at a time, and you’re done.`)
      : pending > 0
        ? t(`${pending} petite${s} décision${s} vous attend${pending > 1 ? "ent" : ""}. Promis, aucune ne mord.`, `${pending} small decision${s} waiting. None of them bite.`)
        : t("Tout est à jour. Rien à signaler, à part votre bon goût.", "All up to date. Nothing to report, apart from your good taste.");
  const rate = dailyRate ? convertAmount(dailyRate.amount, dailyRate.currency, currency) : null;
  const money = (amount: number) => formatAmount(Math.round(amount), currency, lang);
  return <div className="ms-personal-welcome">
    <p className="ms-personal-greeting">{hello} <span className="ms-personal-wave" aria-hidden="true">👋</span></p>
    {children}
    <p className="ms-personal-message">{message}</p>
    {(trade || rate) && <p className="ms-personal-facts">
      {trade && <span className="ms-personal-chip">{t(...TRADE_LABELS[trade])}</span>}
      {rate && <span className="ms-personal-chip" title={t("Sur une journée de 7 heures", "On a 7-hour day")}>{t(`${money(rate)}/jour · votre heure ≈ ${money(rate / 7)}`, `${money(rate)}/day · your hour ≈ ${money(rate / 7)}`)}</span>}
    </p>}
  </div>;
}
