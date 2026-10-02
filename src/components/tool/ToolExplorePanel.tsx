import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import { getExplorerHref } from "@/lib/toolExploration";
import { trackEvent } from "@/lib/analytics";

/**
 * Sidebar de la fiche outil : l'exploration. Le contenu aide à choisir avant
 * d'acheter (prix, verdict, alternatives) ; la colonne de droite sert à
 * rebondir ailleurs. Volontairement court : la carte d'exploration, et trois
 * outils d'autres domaines souvent utilisés avec celui-ci dans nos stacks.
 *
 * Les outils viennent de src/data/toolExplore (scripts/gen-tool-explore-
 * index.mjs), chargés à la demande. Un outil absent des stacks garde la
 * carte d'exploration seule.
 */

type ExploreEntry = { w: string[] };
type Summary = { id: string; slug?: string; name: string; categoryId?: string; logo?: string };

const shards = import.meta.glob<{ default: Record<string, ExploreEntry> }>("../../data/toolExplore/*.json");

interface Props {
  slug: string;
  name: string;
  prefix: string;
  t: (fr: string, en: string) => string;
  tools: Summary[];
}

export default function ToolExplorePanel({ slug, name, prefix, t, tools }: Props) {
  const [entry, setEntry] = useState<ExploreEntry | null>(null);

  useEffect(() => {
    setEntry(null);
    const key = /^[a-z]/.test(slug) ? slug[0] : "0";
    const load = shards[`../../data/toolExplore/${key}.json`];
    if (!load) return;
    let cancelled = false;
    load().then((module) => { if (!cancelled) setEntry(module.default[slug] || null); }).catch(() => {});
    return () => { cancelled = true; };
  }, [slug]);

  const bySlug = new Map(tools.map((tool) => [tool.slug || tool.id, tool]));
  const together = (entry?.w || []).map((other) => bySlug.get(other)).filter((tool): tool is Summary => !!tool).slice(0, 3);

  return (
    <section className="td-explore" aria-label={t("Explorer", "Explore")}>
      <Link
        to={getExplorerHref(prefix, { type: "outil", slug })}
        className="td-explore-map"
        aria-label={t(`Explorer les outils liés à ${name}`, `Explore tools related to ${name}`)}
        onClick={() => trackEvent("explore_tool", { tool_slug: slug, source: "tool_sidebar" })}
      >
        <Compass aria-hidden />
        <span>{t("Explorer les outils liés", "Explore related tools")}</span>
      </Link>

      {together.length > 0 && (
        <div className="td-explore-group">
          <h3>{t("Souvent utilisé avec", "Often used with")}</h3>
          <ul className="td-explore-tools">
            {together.map((tool) => (
              <li key={tool.id}>
                <Link to={`${prefix}/tool/${tool.slug || tool.id}`}>
                  <span className="td-explore-logo"><ToolLogo tool={tool as any} size={20} /></span>
                  <span className="td-explore-tool-text">{tool.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

    </section>
  );
}
