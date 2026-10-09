import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/routerLinks";
import type { Tool } from "@/data/types";
import { useStackPins } from "@/hooks/useStackPins";
import { useCategories, useToolSummaries } from "@/hooks/useSupabaseData";
import { stackRelations } from "@/lib/stackUsage";
import { toolKey } from "@/lib/stackView";
import { comparisonPath } from "@/lib/comparisonLinks";

/**
 * Sur la fiche d'un outil qui n'est pas encore dans « Ma stack » : rappelle
 * l'outil déjà présent qui le recoupe, et propose de les comparer. C'est la
 * version légère de « comprendre ce qu'un candidat ajouterait »
 * (docs/MON_STACK_PRODUCT_DIRECTION.md) : même règle de recoupement que Ma
 * stack (alternative explicite ou usages communs du catalogue), aucun score,
 * aucune incitation à retirer quoi que ce soit.
 *
 * La stack vit dans le stockage local : rien n'est rendu avant le montage,
 * le HTML prérendu reste identique pour tout le monde.
 */

interface Props {
  tool: Tool;
  prefix: string;
  lang: "fr" | "en";
  t: (fr: string, en: string) => string;
}

export default function ToolStackOverlapNote({ tool, prefix, lang, t }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { state } = useStackPins();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const key = toolKey(tool);

  const overlaps = useMemo(() => {
    if (!mounted) return [];
    const pinned = new Set(state.pinnedToolSlugs);
    if (pinned.has(key) || pinned.has(tool.id)) return [];
    const selected = tools.filter((item) => pinned.has(item.slug || item.id) || pinned.has(item.id));
    if (!selected.length) return [];
    return stackRelations(tool, selected, categories, lang)
      .filter((relation) => relation.explicit || relation.commonUses.length > 0)
      .map((relation) => relation.tool);
  }, [mounted, state.pinnedToolSlugs, tools, categories, lang, tool, key]);

  if (!overlaps.length) return null;
  const first = overlaps[0];
  const others = overlaps.length - 1;
  const names = others > 0 ? t(`${first.name} et ${others} autre${others > 1 ? "s" : ""}`, `${first.name} and ${others} other${others > 1 ? "s" : ""}`) : first.name;

  return (
    <p className="td-stack-note">
      <span>
        {t(`Dans ma stack, ${names} ${others > 0 ? "recoupent" : "recoupe"} ${tool.name}.`, `In my stack, ${names} ${others > 0 ? "overlap" : "overlaps"} with ${tool.name}.`)}
      </span>
      <Link to={comparisonPath(prefix, key, toolKey(first))}>{t(`Comparer avec ${first.name}`, `Compare with ${first.name}`)}</Link>
    </p>
  );
}
