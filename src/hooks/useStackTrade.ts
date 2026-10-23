import { useSyncExternalStore } from "react";
import type { DailyRate, Trade } from "@/lib/personalStack";
import { readPersonalStack, updatePersonalStack, subscribePersonalStack, getServerPersonalStack } from "@/lib/personalStackStore";

/** What the onboarding learns (trade, daily rate), in the personal scope: it follows the account. */
const getTrade = () => readPersonalStack().trade;
const getServerTrade = () => getServerPersonalStack().trade;
const getRate = () => readPersonalStack().dailyRate;
const getServerRate = () => getServerPersonalStack().dailyRate;

export function useStackTrade() {
  const trade = useSyncExternalStore(subscribePersonalStack, getTrade, getServerTrade);
  const setTrade = (next: Trade | null) => {
    updatePersonalStack(current => (current.trade === next ? current : { ...current, trade: next }));
  };
  const dailyRate = useSyncExternalStore(subscribePersonalStack, getRate, getServerRate);
  const setDailyRate = (next: DailyRate | null) => {
    updatePersonalStack(current => (current.dailyRate?.amount === next?.amount && current.dailyRate?.currency === next?.currency ? current : { ...current, dailyRate: next }));
  };
  return { trade, setTrade, dailyRate, setDailyRate };
}
