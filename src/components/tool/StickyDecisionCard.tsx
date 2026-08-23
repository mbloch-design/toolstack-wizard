import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flag, Share2 } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import PinToolButton from "@/components/PinToolButton";
import type { Tool } from "@/data/types";

interface Props {
  tool: Tool;
  prefix: string;
  t: (fr: string, en: string) => string;
  alternatives: Tool[];
  compactHeaderActive?: boolean;
}

export default function StickyDecisionCard({ tool, prefix, t, alternatives, compactHeaderActive = false }: Props) {
  const [shared, setShared] = useState(false);
  const slug = tool.slug || tool.id;
  const similar = alternatives.slice(0, 4);

  const sharePage = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: tool.name, url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // Closing the native share sheet needs no visible error.
    }
  };

  return (
    <div className="td-decision-card td-decision-card--utility">
      <nav className="td-decision-utility-actions" aria-label={t("Actions sur l’outil", "Tool actions")}>
        {!compactHeaderActive && (
          <PinToolButton slug={slug} label={tool.name} t={t} labelMode="full" />
        )}
        <button type="button" onClick={sharePage}>
          <Share2 aria-hidden />
          <span>{shared ? t("Lien copié", "Link copied") : t("Partager", "Share")}</span>
        </button>
        <a href={`mailto:contact@tooltrim.com?subject=${encodeURIComponent(t(`Information à corriger sur ${tool.name}`, `Information to correct on ${tool.name}`))}`}>
          <Flag aria-hidden />
          <span>{t("Signaler un problème", "Report a problem")}</span>
        </a>
      </nav>

      {similar.length > 0 && (
        <section className="td-decision-similar">
          <div className="td-decision-similar-head">
            <h2>{t("Outils similaires", "Similar tools")}</h2>
            <Link to={`${prefix}/tool/${slug}/alternatives`}>
              <span>{t("Voir tout", "View all")}</span>
              <ArrowRight aria-hidden />
            </Link>
          </div>
          <div className="td-decision-tool-list">
            {similar.map((item) => (
              <Link key={item.id} to={`${prefix}/tool/${item.slug || item.id}`}>
                <span className="td-decision-tool-logo"><ToolLogo tool={item as any} size={19} /></span>
                <span>{item.name}</span>
                <ArrowRight aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
