import type { Tool, ToolSummary } from "@/data/types";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import ToolLogo from "@/components/ToolLogo";

// Slug -> nom lisible (repli quand le nom n'est pas disponible).
const humanizeSlug = (s: string) =>
  s.split("-").map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");

interface Props {
  tool: Tool;
  tools?: ToolSummary[];
  lang?: string;
  t: (fr: string, en: string) => string;
}

type Member = { slug: string; name: string; logo?: string | null; websiteUrl?: string | null };

/**
 * Section « bundle » : pour un outil appartenant à une suite (bundle_parent) OU pour la suite
 * parente elle-même, liste tous les outils liés sous forme de tags (pills) avec logo + nom.
 * Membres lus dans la projection catalog_api. Rend `null` si aucun bundle.
 */
export default function ToolBundleSection({ tool, tools = [], lang, t }: Props) {
  const L = lang === "en" ? "en" : "fr";
  const selfKey = tool.slug || tool.id;
  // Clé de bundle : le parent de l'outil (s'il est membre), sinon l'outil lui-même (s'il est parent).
  const bundleKey = tool.bundle_parent || selfKey;

  const localMembers = tools
    .filter((candidate) => candidate.bundle_parent === bundleKey && candidate.slug !== bundleKey)
    .map((candidate) => ({ slug: candidate.slug, name: candidate.name, logo: candidate.logo, websiteUrl: candidate.websiteUrl }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const localParentTool = tools.find((candidate) => candidate.slug === bundleKey || candidate.id === bundleKey);
  const localParent = localParentTool
    ? { slug: localParentTool.slug, name: localParentTool.name, logo: localParentTool.logo, websiteUrl: localParentTool.websiteUrl }
    : null;
  const [members, setMembers] = useState<Member[]>(localMembers);
  const [parent, setParent] = useState<Member | null>(localParent);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const catalog = (supabase as any).schema("catalog_api");
        const { data } = await catalog
          .from("published_tool_projection")
          .select("tool_id, slug, name, logo, website_url, bundle_parent")
          .eq("bundle_parent", bundleKey)
          .eq("lang", L);
        if (cancelled) return;
        const seen = new Set<string>();
        const list: Member[] = [];
        for (const r of (data || []) as any[]) {
          const slug = r.slug || r.tool_id;
          if (!slug || slug === bundleKey || seen.has(slug)) continue;
          seen.add(slug);
          list.push({ slug, name: r.name || humanizeSlug(slug), logo: r.logo, websiteUrl: r.website_url });
        }
        list.sort((a, b) => a.name.localeCompare(b.name));
        if (list.length > 0) setMembers(list);
        const { data: p } = await catalog
          .from("published_tool_projection")
          .select("slug, name, logo, website_url").eq("tool_id", bundleKey).eq("lang", L).limit(1);
        if (!cancelled && p?.[0]) setParent({ slug: p[0].slug || bundleKey, name: p[0].name || humanizeSlug(bundleKey), logo: p[0].logo, websiteUrl: p[0].website_url });
      } catch {
        // Keep the local catalogue fallback. It also makes the ecosystem
        // visible in prerendered pages when the remote projection is offline.
      }
    })();
    return () => { cancelled = true; };
  }, [bundleKey, L]);

  if (!members || members.length === 0) return null;

  const isViewingParent = selfKey === bundleKey;
  const parentName = parent?.name || humanizeSlug(bundleKey);

  const Tag = (m: Member, opts: { parent?: boolean } = {}) => {
    const current = m.slug === selfKey;
    const logoTool = { id: m.slug, slug: m.slug, name: m.name, logo: m.logo || undefined, websiteUrl: m.websiteUrl || undefined } as any;
    const inner = (
      <>
        <ToolLogo tool={logoTool} size={22} className="td-bundle-tag-logo" />
        <span>{m.name}</span>
      </>
    );
    const cls = `td-bundle-tag${opts.parent ? " td-bundle-tag--parent" : ""}${current ? " td-bundle-tag--current" : ""}`;
    return current
      ? <li key={m.slug}><span className={cls} aria-current="page">{inner}</span></li>
      : <li key={m.slug}><a className={cls} href={`/${L}/tool/${m.slug}`}>{inner}</a></li>;
  };

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

      <ul className="td-bundle-tags">
        {!isViewingParent && parent && Tag(parent, { parent: true })}
        {members.map((m) => Tag(m))}
      </ul>
    </div>
  );
}
