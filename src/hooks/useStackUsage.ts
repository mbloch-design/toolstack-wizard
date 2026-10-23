import { useSyncExternalStore } from "react";
import type { UsageLevel } from "@/lib/personalStack";
import { readPersonalStack, updatePersonalStack, subscribePersonalStack, getServerPersonalStack } from "@/lib/personalStackStore";

/** How much the person uses each paid tool (1 asleep, 5 flat out), in the personal scope: it follows the account. */
const getUsage = () => readPersonalStack().usage;
const getServerUsage = () => getServerPersonalStack().usage;

export function useStackUsage() {
  const usage = useSyncExternalStore(subscribePersonalStack, getUsage, getServerUsage);
  const setUsage = (slug: string, level: UsageLevel | null) => {
    updatePersonalStack(current => {
      if (level === null ? !(slug in current.usage) : current.usage[slug] === level) return current;
      const { [slug]: _, ...rest } = current.usage;
      return { ...current, usage: level === null ? rest : { ...rest, [slug]: level } };
    });
  };
  return { usage, setUsage };
}
