import type { Tool } from "@/data/types";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";

// Slug -> nom lisible (repli quand le nom n'est pas disponible).
const humanizeSlug = (s: string) =>
  s.split("-").map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");

interface Props {
  tool: Tool;
  lang?: string;
  t: (fr: string, en: string) => string;
}

type Member = { slug: string; name: string };

/**
 * Section « bundle » : pour un outil appartenant à une suite (bundle_parent) OU pour la suite
 * parente elle-même, liste tous les outils liés (parent + apps) avec liens. Les membres sont lus
 * dans la projection (catalog_api, accessible en lecture), fiable même quand les summaries statiques
 * ne portent pas encore le rattachement. Rend `null` si aucun bundle.
 */
export default function ToolBundleSection({ tool, lang, t }: Props) {
  const L = lang === "en" ? "en" : "fr";
  const selfKey = tool.slug || tool.id;
  // Clé de bundle : le parent de l'outil (s'il est membre), sinon l'outil lui-même (s'il est parent).
  const bundleKey = tool.bundle_parent || selfKey;

  const [members, setMembers] = useState<Member[] | null>(null);
  const [parentName, setParentName] = useState<string>(
    tool.bundle_parent ? humanizeSlug(bundleKey) : tool.name,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const catalog = (supabase as any).schema("catalog_api");
        const { data } = await catalog
          .from("published_tool_projection")
          .select("tool_id, slug, name, bundle_parent")
          .eq("bundle_parent", bundleKey)
          .eq("lang", L);
        if (cancelled) return;
        const seen = new Set<string>();
        const list: Member[] = [];
        for (const r of (data || []) as any[]) {
          const slug = r.slug || r.tool_id;
          if (!slug || slug === bundleKey || seen.has(slug)) continue;
          seen.add(slug);
          list.push({ slug, name: r.name || humanizeSlug(slug) });
        }
        list.sort((a, b) => a.name.localeCompare(b.name));
        setMembers(list);
        // Nom du parent (si l'outil est membre) : lu depuis sa propre ligne de projection.
        if (tool.bundle_parent) {
          const { data: p } = await catalog
            .from("published_tool_projection")
            .select("name").eq("tool_id", bundleKey).eq("lang", L).limit(1);
          if (!cancelled && p?.[0]?.name) setParentName(p[0].name);
        }
      } catch {
        if (!cancelled) setMembers([]);
      }
    })();
    return () => { cancelled = true; };
  }, [bundleKey, L, tool.bundle_parent]);

  if (!members || members.length === 0) return null;

  const isViewingParent = selfKey === bundleKey;
  const parentHref = `/${L}/tool/${bundleKey}`;

  return (
    <div className="td-section td-bundle">
      <header className="td-bundle-head">
        <h2 className="td-title">
          <Package aria-hidden />
          {isViewingParent
            ? t(`Les outils de ${parentName}`, `Tools in ${parentName}`)
            : t(`${parentName} — la suite complète`, `${parentName} — the full suite`)}
        </h2>
        <p className="td-bundle-sub">
          {isViewingParent
            ? t(`Cette suite regroupe ${members.length} outils, inclus dans l'abonnement.`,
                `This suite bundles ${members.length} tools, included in the subscription.`)
            : t(`${tool.name} fait partie de ${parentName}. Les autres outils inclus dans la suite :`,
                `${tool.name} is part of ${parentName}. The other tools included in the suite:`)}
        </p>
      </header>

      <ul className="td-bundle-grid">
        {!isViewingParent && (
          <li className="td-bundle-item td-bundle-item--parent">
            <a href={parentHref}>
              <strong>{parentName}</strong>
              <span>{t("Voir la suite et ses tarifs", "See the suite and its pricing")}</span>
            </a>
          </li>
        )}
        {members.map((m) => {
          const current = m.slug === selfKey;
          return (
            <li key={m.slug} className={`td-bundle-item${current ? " td-bundle-item--current" : ""}`}>
              {current ? (
                <span aria-current="page"><strong>{m.name}</strong><span>{t("Vous êtes ici", "You are here")}</span></span>
              ) : (
                <a href={`/${L}/tool/${m.slug}`}><strong>{m.name}</strong></a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
