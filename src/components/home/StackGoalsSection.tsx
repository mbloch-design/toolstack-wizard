import { useMemo } from "react";
import { Link } from "@/lib/routerLinks";
import { ArrowRight } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import ToolLogo from "@/components/ToolLogo";
import { displayText } from "@/lib/typography";
import { GOAL_STACKS, type StackTool } from "@/data/goalStacks";

const StackGoalsSection = () => {
  const { t, lang, prefix } = useLang();
  const { tools: catalog } = useToolSummaries();

  // Resolve against the live catalogue so logos use the same data (logo,
  // domain) as every other tool card; the config values only fill gaps.
  const bySlug = useMemo(() => new Map(catalog.map((tool) => [tool.slug, tool])), [catalog]);
  const resolve = (tool: StackTool) => {
    const live = bySlug.get(tool.slug);
    return {
      ...tool,
      ...live,
      name: live?.name || tool.name,
      websiteUrl: live?.websiteUrl || tool.websiteUrl,
      logo: tool.logo || live?.logo || undefined,
    };
  };

  return (
    <section className="sgs-root">
      <div className="v2-container">
        <div className="sgs-head">
          <div>
            <h2 className="v2-section-title">
              {t("De vraies stacks, choisies selon votre objectif", "Real stacks, picked by what you need to do")}
            </h2>
            <p className="sgs-lead">
              {t(
                "Quatre points de départ parmi notre bibliothèque de plus de 200 stacks.",
                "Four starting points from our library of 200+ curated stacks.",
              )}
            </p>
          </div>
          <Link to={`${prefix}/stacks`} className="tt-section-action v2-section-link">
            {t("Toutes les stacks", "All stacks")} <ArrowRight aria-hidden />
          </Link>
        </div>

        <ul className="sgs-list">
          {GOAL_STACKS.map((stack) => (
            <li key={stack.slug}>
              <Link to={`${prefix}/stacks/${stack.slug}`} className="sgs-item">
                {/* iOS-folder cluster: the stack reads as one bundle of apps. */}
                <span className="sgs-folder" aria-hidden>
                  {stack.tools.slice(0, 4).map((tool) => (
                    <span key={tool.slug} className="sgs-folder-app">
                      <ToolLogo tool={resolve(tool) as any} size={32} className="sgs-folder-logo" />
                    </span>
                  ))}
                </span>
                <span className="sgs-item-copy">
                  <span className="sgs-item-objective">{lang === "fr" ? stack.objectiveFr : stack.objectiveEn}</span>
                  <span className="sgs-item-title">{displayText(lang === "fr" ? stack.titleFr : stack.titleEn, lang)}</span>
                  <span className="sgs-item-subtitle">{displayText(lang === "fr" ? stack.subtitleFr : stack.subtitleEn, lang)}</span>
                  <span className="sr-only">{stack.tools.map((tool) => tool.name).join(", ")}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default StackGoalsSection;
