import { useState } from "react";
import { Link } from "@/lib/routerLinks";
import { ArrowRight, Check, CircleAlert, Compass, Copy, Flag, Info, Linkedin, Mail, MessageCircle, Share2 } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Tool } from "@/data/types";
import { getExplorerHref } from "@/lib/toolExploration";
import { computeToolTrimScore } from "@/lib/toolTrimScore";
import { trackEvent } from "@/lib/analytics";
import TapstitchDecision from "./TapstitchDecision";

interface Props {
  tool: Tool;
  prefix: string;
  t: (fr: string, en: string) => string;
  alternatives: Tool[];
  section?: "all" | "verdict" | "actions" | "share";
}

export default function StickyDecisionCard({ tool, prefix, t, alternatives, section = "all" }: Props) {
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "copied" | "error">("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const slug = tool.slug || tool.id;
  const similar = alternatives.slice(0, 4);
  // Desktop sidebar foot: share and report only, the exploration panel
  // above already carries "Explore around this tool".
  const compactUtilities = section === "share";
  const toolTrimScore = computeToolTrimScore(tool);
  const verdict = prefix === "/en" ? tool.verdictEn : tool.verdict;
  const conclusion = verdict?.threshold?.trim();
  const keepIf = verdict?.keepIf?.[0]?.trim();
  const avoidIf = verdict?.avoidIf?.[0]?.trim();
  const sentence = (text: string) => text.replace(/[.\s]+$/, "");
  const scoreTone = toolTrimScore.score >= 3.5 ? "pro" : toolTrimScore.score >= 2.5 ? "neutral" : "con";
  const [fitTab, setFitTab] = useState<"keep" | "avoid">("keep");
  const isEn = prefix === "/en";
  const rating = tool.toolTrimRating;
  const axes = rating ? ([
    ["valeurAjoutee", "Valeur", "Value"],
    ["simplicite", "Simplicité", "Simplicity"],
    ["utilisation", "Utilisation", "Fit"],
    ["puissance", "Puissance", "Power"],
    ["reversibilite", "Réversibilité", "Reversibility"],
  ] as const).map(([key, fr, en]) => ({ key, label: isEn ? en : fr, value: Number(rating[key] ?? 0) })) : [];
  // The ring opens the score detail: scroll to it on the overview, else open the verdict subpage.
  const reviewHref = `${prefix}/tool/${slug}/${isEn ? "reviews" : "avis"}`;
  const openScoreDetail = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("avis");
    if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    trackEvent("score_detail_open", { tool_slug: slug, source: "verdict_ring" });
  };

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
      trackEvent("share", { method: "native", content_type: "tool", item_id: slug });
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
      trackEvent("share", { method: "copy_link", content_type: "tool", item_id: slug });
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
      {(section === "all" || section === "verdict") && (slug === "tapstitch" ? <TapstitchDecision t={t} compact /> : <div className="td-decision-verdict">
        <span className="td-decision-verdict-label">
          {t("L’avis ToolTrim", "ToolTrim verdict")}
          <Link
            to={`${prefix}/transparency#notation`}
            className="td-decision-verdict-info"
            aria-label={t("Comment est calculée cette note ?", "How is this score calculated?")}
            title={t("Comment est calculée cette note ?", "How is this score calculated?")}
          >
            <Info aria-hidden />
          </Link>
          {/* The tool's own logo gives each verdict card its identity. */}
          <span className="td-verdict-logo" aria-hidden="true"><ToolLogo tool={tool as any} size={24} /></span>
        </span>
        {/* Score as an activity ring in the tool's colour: it draws itself to the
            score once (pathLength 100 keeps the arc in attributes, no inline style). */}
        <span className="td-verdict-hero">
          <a className="td-verdict-ring" href={reviewHref} onClick={openScoreDetail}
            aria-label={t(`Note ${toolTrimScore.score.toFixed(1)} sur 5 : voir le détail`, `Score ${toolTrimScore.score.toFixed(1)} out of 5: see the breakdown`)}>
            <svg viewBox="0 0 88 88" aria-hidden="true">
              <circle className="td-verdict-ring-track" cx="44" cy="44" r="38" pathLength={100} />
              <circle className="td-verdict-ring-fill" cx="44" cy="44" r="38" pathLength={100}
                strokeDasharray="100" strokeDashoffset={100 - Math.max(0, Math.min(100, (toolTrimScore.score / 5) * 100))} />
            </svg>
            <strong aria-hidden="true">{toolTrimScore.score.toFixed(1)}</strong>
          </a>
          <span className="td-verdict-side">
            <span className={`td-verdict-pill td-verdict-pill--${scoreTone}`}>{t(toolTrimScore.labelFr, toolTrimScore.labelEn)}</span>
            {axes.length > 0 ? (
              /* Five criteria as mini bars that rise one after another; name and score on hover/focus. */
              <span className="td-verdict-axes" role="list" aria-label={t("Les 5 critères de la note", "The 5 scoring criteria")}>
                {/* Drawn in CSS from data-v: five bars cost a few bytes per page (the card is
                    prerendered twice on every tool page, weight matters). */}
                {axes.map((axis) => (
                  <i key={axis.key} className="td-verdict-axis" role="listitem" tabIndex={0}
                    data-v={Math.max(0, Math.min(5, Math.round(axis.value)))} aria-label={`${axis.label} ${axis.value}/5`} />
                ))}
              </span>
            ) : <span className="td-verdict-out">{t("sur 5", "out of 5")}</span>}
          </span>
        </span>
        {keepIf ? <div className="td-fit">
          {avoidIf && (
            <div className="td-fit-switch" role="group" aria-label={t("Pour qui", "Who it is for")}>
              <button type="button" aria-pressed={fitTab === "keep"} className="td-fit-switch-btn" onClick={() => setFitTab("keep")}>{t("Pour toi si", "For you if")}</button>
              <button type="button" aria-pressed={fitTab === "avoid"} className="td-fit-switch-btn" onClick={() => setFitTab("avoid")}>{t("Pas pour toi si", "Not for you if")}</button>
              <span className={`td-fit-switch-thumb${fitTab === "avoid" ? " is-right" : ""}`} aria-hidden="true" />
            </div>
          )}
          <div className={`td-fit-panel td-fit-panel--pro${fitTab === "keep" ? " is-active" : ""}`} aria-live="polite" hidden={fitTab !== "keep"}>
            <span className="td-fit-icon" aria-hidden="true"><Check /></span>
            <p><span className="td-fit-label">{t("À garder si", "Keep it if")}</span> {sentence(keepIf)}.</p>
          </div>
          {avoidIf && <div className={`td-fit-panel td-fit-panel--con${fitTab === "avoid" ? " is-active" : ""}`} aria-live="polite" hidden={fitTab !== "avoid"}>
            <span className="td-fit-icon" aria-hidden="true"><CircleAlert /></span>
            <p><span className="td-fit-label">{t("À éviter si", "Look elsewhere if")}</span> {sentence(avoidIf)}.</p>
          </div>}
        </div> : conclusion && <p className="td-decision-conclusion">{conclusion}</p>}
        <Link
          to={`${prefix}/tool/${slug}/alternatives`}
          className="td-decision-compare"
          onClick={() => trackEvent("alternative_click", { tool_slug: slug, source: "tool_decision_card" })}
        >
          {t("Comparer les alternatives", "Compare alternatives")}<ArrowRight aria-hidden />
        </Link>
      </div>)}


      {section === "all" && similar.length > 0 && (
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

      {section !== "verdict" && <nav className={`td-decision-utility-actions${compactUtilities ? " td-decision-utility-actions--compact" : ""}`} aria-label={t("Actions sur l’outil", "Tool actions")}>
        {!compactUtilities && <Link
          to={getExplorerHref(prefix, { type: "outil", slug })}
          className="td-decision-explore"
          onClick={() => trackEvent("explore_tool", { tool_slug: slug, source: "tool_decision_card" })}
        >
          <Compass aria-hidden />
          <span>{t("Explorer autour de cet outil", "Explore around this tool")}</span>
        </Link>}
        <Popover open={shareOpen} onOpenChange={setShareOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="td-decision-share" aria-expanded={shareOpen} title={t("Partager", "Share")}>
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
        <a title={t("Signaler un problème", "Report a problem")} href={`mailto:contact@tooltrim.com?subject=${encodeURIComponent(t(`Information à corriger sur ${tool.name}`, `Information to correct on ${tool.name}`))}`}>
          <Flag aria-hidden />
          <span>{t("Signaler un problème", "Report a problem")}</span>
        </a>
      </nav>}
    </div>
  );
}
