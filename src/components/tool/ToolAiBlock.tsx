import { Link } from "react-router-dom";
import type { Tool } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";
import { Sparkles, ArrowUpRight, Swords } from "lucide-react";

interface Props {
  tool: Tool;
  allTools: Tool[];
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
}

const STANCE: Record<string, { fr: string; en: string }> = {
  augmente: { fr: "L'IA augmente cet outil", en: "AI augments this tool" },
  challenge: { fr: "L'IA le challenge", en: "AI challenges it" },
  menace: { fr: "L'IA le menace sérieusement", en: "AI seriously threatens it" },
};

export default function ToolAiBlock({ tool, allTools, prefix, lang, t }: Props) {
  // aiAngle lives either as a top-level field (future dedicated column) or
  // nested under seo.aiAngle (current pilot, no schema change).
  const ai = ((tool as any).aiAngle || (tool as any).seo?.aiAngle) as any;
  if (!ai) return null;

  const isFr = lang !== "en";
  const augment = isFr ? ai.augmentFr : ai.augmentEn || ai.augmentFr;
  const replace = isFr ? ai.replaceFr : ai.replaceEn || ai.replaceFr;
  if (!augment && !replace) return null;

  const stance = STANCE[ai.stance];
  const aiTools = Array.isArray(ai.aiTools)
    ? ai.aiTools
        .map((s: string) => allTools.find(x => (x as any).slug === s || x.id === s))
        .filter(Boolean)
    : [];

  return (
    <section className="td-section td-ai-section">
      <header className="td-ai-header">
        <div>
          <span className="td-subhead">
            <Sparkles />
            {t("L'angle IA", "The AI angle")}
          </span>
          <h2 className="td-subtitle">{t(`${tool.name} face à l'IA`, `${tool.name} vs AI`)}</h2>
        </div>
        {stance && (
          <div className="td-ai-stance">
            {isFr ? stance.fr : stance.en}
          </div>
        )}
      </header>

      <div className="td-ai-grid">
        {augment && (
          <div className="td-ai-point">
            <span className="td-subhead">
              <ArrowUpRight />
              {t("Aller plus loin avec l'IA", "Go further with AI")}
            </span>
            <p>{augment}</p>
          </div>
        )}
        {replace && (
          <div className="td-ai-point">
            <span className="td-subhead">
              <Swords />
              {t("L'IA peut-elle le remplacer ?", "Can AI replace it?")}
            </span>
            <p>{replace}</p>
          </div>
        )}
      </div>

      {aiTools.length > 0 && (
        <div className="td-ai-tools">
          <span className="td-subhead">
            {t("Les IA qui comptent ici", "The AIs that matter here")}
          </span>
          <div>
            {aiTools.map((a: any) => (
              <Link key={a.id} to={`${prefix}/tool/${(a as any).slug || a.id}`} className="td-chip">
                <ToolLogo tool={a} size={14} className="rounded" />
                {a.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
