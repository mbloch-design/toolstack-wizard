import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUp, Check, Compass, Copy, Flag, Linkedin, Mail, MessageCircle, Minus, Share2 } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import PinToolButton from "@/components/PinToolButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Tool } from "@/data/types";
import { getExplorerHref } from "@/lib/toolExploration";
import { computeToolTrimScore } from "@/lib/toolTrimScore";

interface Props {
  tool: Tool;
  prefix: string;
  t: (fr: string, en: string) => string;
  alternatives: Tool[];
}

export default function StickyDecisionCard({ tool, prefix, t, alternatives }: Props) {
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "copied" | "error">("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const slug = tool.slug || tool.id;
  const similar = alternatives.slice(0, 4);
  const toolTrimScore = computeToolTrimScore(tool);
  const verdictLevel = toolTrimScore.score >= 4 ? "high" : toolTrimScore.score >= 3.5 ? "mid" : "low";
  const VerdictIcon = verdictLevel === "high" ? ArrowUp : verdictLevel === "mid" ? Minus : ArrowDown;

  const copyUrl = async (url: string) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        return;
      } catch {
        // A browser may expose the Clipboard API while denying writes in the
        // current context. Continue with the synchronous selection fallback.
      }
    }

    const input = document.createElement("textarea");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.focus();
    input.select();
    input.setSelectionRange(0, input.value.length);
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("copy_failed");
  };

  const shareNative = async () => {
    const url = window.location.href;
    try {
      if (!navigator.share) {
        await copyShareUrl();
        return;
      }
      await navigator.share({ title: tool.name, url });
      setShareStatus("shared");
      setShareOpen(false);
      window.setTimeout(() => setShareStatus("idle"), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareStatus("error");
      window.setTimeout(() => setShareStatus("idle"), 2600);
    }
  };

  const copyShareUrl = async () => {
    try {
      await copyUrl(window.location.href);
      setShareStatus("copied");
      setShareOpen(false);
      window.setTimeout(() => setShareStatus("idle"), 2200);
    } catch {
      setShareStatus("error");
      window.setTimeout(() => setShareStatus("idle"), 2600);
    }
  };

  const shareLabel = shareStatus === "shared"
    ? t("Partagé", "Shared")
    : shareStatus === "copied"
      ? t("Lien copié", "Link copied")
      : shareStatus === "error"
        ? t("Copie impossible", "Unable to copy")
        : t("Partager", "Share");
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const shareText = t(`Découvre ${tool.name} sur ToolTrim`, `Discover ${tool.name} on ToolTrim`);

  return (
    <div className="td-decision-card td-decision-card--utility">
      <div className="td-decision-verdict">
        <span className="td-decision-verdict-label">{t("L’avis ToolTrim", "ToolTrim verdict")}</span>
        <span className={`td-decision-verdict-indicator td-decision-verdict-indicator--${verdictLevel}`} aria-hidden="true">
          <VerdictIcon />
        </span>
        <span className="td-decision-verdict-score">
          <strong>{toolTrimScore.score.toFixed(1)}</strong>
          <span>/ 5</span>
        </span>
        <span className="td-decision-verdict-copy">{t(toolTrimScore.labelFr, toolTrimScore.labelEn)}</span>
      </div>

      <nav className="td-decision-utility-actions" aria-label={t("Actions sur l’outil", "Tool actions")}>
        <Link
          to={getExplorerHref(prefix, { type: "outil", slug })}
          className="td-decision-explore"
        >
          <Compass aria-hidden />
          <span>{t("Explorer autour de cet outil", "Explore around this tool")}</span>
        </Link>
        <PinToolButton slug={slug} label={tool.name} t={t} labelMode="full" />
        <Popover open={shareOpen} onOpenChange={setShareOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="td-decision-share" aria-expanded={shareOpen}>
              {shareStatus === "shared" || shareStatus === "copied" ? <Check aria-hidden /> : <Share2 aria-hidden />}
              <span aria-live="polite">{shareLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="td-share-menu" side="left" align="start" sideOffset={10}>
            <p className="td-share-menu-title">{t("Partager cette fiche", "Share this page")}</p>
            <div className="td-share-menu-actions">
              <button type="button" onClick={shareNative}>
                <Share2 aria-hidden />
                <span>{t("Plus d’options", "More options")}</span>
              </button>
              <button type="button" onClick={copyShareUrl}>
                <Copy aria-hidden />
                <span>{t("Copier le lien", "Copy link")}</span>
              </button>
              <a href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`}>
                <Mail aria-hidden />
                <span>{t("E-mail", "Email")}</span>
              </a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
                <Linkedin aria-hidden />
                <span>LinkedIn</span>
              </a>
              <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden />
                <span>WhatsApp</span>
              </a>
            </div>
          </PopoverContent>
        </Popover>
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
