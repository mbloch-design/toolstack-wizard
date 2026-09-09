import { createContext, useContext, useEffect, useState } from "react";
import type { StackGuide } from "@/data/stacks";

export const SsrStackContext = createContext<StackGuide | undefined>(undefined);

const shardPromises = new Map<string, Promise<StackGuide[]>>();

function getShardKey(slug: string): string {
  const firstCharacter = slug.trim().toLowerCase().charAt(0);
  return /^[a-z0-9]$/.test(firstCharacter) ? firstCharacter : "other";
}

async function loadStack(slug: string): Promise<StackGuide | null> {
  if (import.meta.env.DEV) {
    const { STACKS } = await import("@/data/stacks");
    return STACKS.find((stack) => stack.slug === slug) || null;
  }

  const shardKey = getShardKey(slug);
  let pending = shardPromises.get(shardKey);
  if (!pending) {
    pending = fetch(`/assets/stack-catalog/${shardKey}.json`, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Stack catalogue shard ${shardKey}: HTTP ${response.status}`);
        return response.json() as Promise<StackGuide[]>;
      });
    shardPromises.set(shardKey, pending);
  }

  try {
    const stacks = await pending;
    return stacks.find((stack) => stack.slug === slug) || null;
  } catch (error) {
    shardPromises.delete(shardKey);
    console.warn(`Stack catalogue shard ${shardKey} unavailable`, error);
    return null;
  }
}

export function useStackBySlug(slug: string | undefined) {
  const ssrStack = useContext(SsrStackContext);
  const ssrMatches = !!ssrStack && ssrStack.slug === slug;
  const [stack, setStack] = useState<StackGuide | null>(ssrMatches ? ssrStack : null);
  const [loading, setLoading] = useState(!ssrMatches);

  useEffect(() => {
    if (!slug) {
      setStack(null);
      setLoading(false);
      return;
    }
    if (ssrMatches) {
      setStack(ssrStack);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    loadStack(slug).then((nextStack) => {
      if (cancelled) return;
      setStack(nextStack);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [slug, ssrMatches, ssrStack]);

  const matchesCurrentSlug = stack?.slug === slug;
  return {
    stack: matchesCurrentSlug ? stack : null,
    loading: loading || (!!slug && !matchesCurrentSlug),
  };
}
