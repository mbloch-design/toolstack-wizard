import type { ReactNode } from "react";
import { Link } from "@/lib/routerLinks";
import type { Tool } from "@/data/types";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import ToolLogo from "@/components/ToolLogo";

interface Props {
  tool: Tool;
  allTools: ToolSummary[];
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
  /** What follows « Les IA qui comptent ici » inside the same section: the agents gateway (step 2, 17/11). */
  children?: ReactNode;
}

/** The angle the section is written from, or null: the page knows whether the section renders. */
export function toolAiAngle(tool: Tool, lang: string) {
  const ai = ((tool as any).aiAngle || (tool as any).seo?.aiAngle) as any;
  if (!ai) return null;
  const isFr = lang !== "en";
  const augment = isFr ? ai.augmentFr : ai.augmentEn || ai.augmentFr;
  const replace = isFr ? ai.replaceFr : ai.replaceEn || ai.replaceFr;
  return augment || replace ? { ai, augment, replace } : null;
}

const STANCE: Record<string, { fr: string; en: string; tone: "pro" | "con" }> = {
  augmente: { fr: "L'IA augmente cet outil", en: "AI augments this tool", tone: "pro" },
  challenge: { fr: "L'IA le challenge", en: "AI challenges it", tone: "con" },
  menace: { fr: "L'IA le menace sérieusement", en: "AI seriously threatens it", tone: "con" },
};

export default function ToolAiBlock({ tool, allTools, prefix, lang, t, children }: Props) {
  // aiAngle lives either as a top-level field (future dedicated column) or
  // nested under seo.aiAngle (current pilot, no schema change).
  const angle = toolAiAngle(tool, lang);
  if (!angle) return null;
  const { ai, augment, replace } = angle;
  const isFr = lang !== "en";

  const stance = STANCE[ai.stance];
  const aiTools = Array.isArray(ai.aiTools)
    ? ai.aiTools
        .map((s: string) => allTools.find(x => (x as any).slug === s || x.id === s))
        .filter(Boolean)
    : [];

  return (
    <section className="td-section td-ai-section">
      {/* Same title pattern as every section; the stance is a tinted pill
          in the "for" / "against" colours of the pros and cons sheet. */}
      <header className="td-ai-header">
        <h2 className="td-title">
          {t("L'IA.", "AI.")} <span className="tt-title-muted">{t(`Ce qu'elle change pour ${tool.name}.`, `What it changes for ${tool.name}.`)}</span>
        </h2>
        {stance && <p className={`td-ai-stance td-ai-stance--${stance.tone}`}>{isFr ? stance.fr : stance.en}</p>}
      </header>

      <div className="td-ai-grid">
        {augment && (
          <div className="td-ai-point">
            <h3 className="td-ai-point-title">{t("Aller plus loin avec l'IA", "Go further with AI")}</h3>
            <p>{augment}</p>
          </div>
        )}
        {replace && (
          <div className="td-ai-point">
            <h3 className="td-ai-point-title">{t("L'IA peut-elle le remplacer ?", "Can AI replace it?")}</h3>
            <p>{replace}</p>
          </div>
        )}
      </div>

      {aiTools.length > 0 && (
        <div className="td-ai-tools">
          <h3 className="td-ai-point-title">{t("Les IA qui comptent ici", "The AIs that matter here")}</h3>
          <div>
            {aiTools.map((a: any) => (
              <Link key={a.id} to={`${prefix}/tool/${(a as any).slug || a.id}`} className="td-chip">
                <ToolLogo tool={a} size={20} />
                {a.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}
