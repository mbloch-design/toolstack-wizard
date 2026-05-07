import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { Shield, Zap } from "lucide-react";
import type { Tool } from "@/data/types";

interface CompareVerdictCardsProps {
  toolA: Tool;
  toolB: Tool;
}

function getVerdictData(tool: Tool, lang: "fr" | "en"): { tagline: string; headline: string; body: string } {
  const keepIf = (tool.verdict?.keepIf || []).slice(0, 2).join(", ");
  const threshold = tool.verdict?.threshold || "";

  if (lang === "fr") {
    return {
      tagline: tool.prescription_quality === "ferme" ? "Meilleur rapport qualité/prix" : "Meilleur pour la productivité",
      headline: `${tool.name} ${keepIf ? `excelle pour ${keepIf}` : "est un choix solide"}`,
      body: threshold || tool.shortDescription || "",
    };
  }
  return {
    tagline: tool.prescription_quality === "ferme" ? "Best Value" : "Best for Productivity",
    headline: `${tool.name} ${keepIf ? `excels for ${keepIf}` : "is a solid choice"}`,
    body: threshold || tool.shortDescriptionEn || tool.shortDescription || "",
  };
}

const CompareVerdictCards = ({ toolA, toolB }: CompareVerdictCardsProps) => {
  const { lang, t, prefix } = useLang();
  const vA = getVerdictData(toolA, lang);
  const vB = getVerdictData(toolB, lang);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Tool A — primary gradient card */}
      <div className="bg-primary p-6 md:p-8 rounded-2xl text-primary-foreground">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">{vA.tagline}</span>
        </div>
        <h4 className="text-xl md:text-2xl font-semibold mb-4 leading-tight">{vA.headline}</h4>
        <p className="text-primary-foreground/80 leading-relaxed text-sm">{vA.body}</p>
        <Link
          to={`${prefix}/tool/${toolA.slug}`}
          className="mt-6 inline-block bg-background text-primary px-5 py-2.5 rounded-full font-bold text-sm hover:bg-accent transition-colors"
        >
          {t("Lire l'analyse complète", "Read Full Review")}
        </Link>
      </div>

      {/* Tool B — white card */}
      <div className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border/20">
        <div className="flex items-center gap-2 mb-4 text-orange-500">
          <Zap className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">{vB.tagline}</span>
        </div>
        <h4 className="text-xl md:text-2xl font-semibold mb-4 text-foreground leading-tight">{vB.headline}</h4>
        <p className="text-muted-foreground leading-relaxed text-sm">{vB.body}</p>
        <Link
          to={`${prefix}/tool/${toolB.slug}`}
          className="mt-6 inline-block border border-border text-foreground px-5 py-2.5 rounded-full font-bold text-sm hover:bg-secondary transition-colors"
        >
          {t("Lire l'analyse complète", "Read Full Review")}
        </Link>
      </div>
    </div>
  );
};

export default CompareVerdictCards;
