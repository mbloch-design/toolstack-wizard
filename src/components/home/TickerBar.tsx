import { useState } from "react";
import { useLang } from "@/hooks/useLang";

/* ─────────────────────────────────────────────────────────────────────────────
   TickerBar — Sprint 5
   Bande de décisions ToolTrim avec logos d'outils.
   Structure par item : [logo] Outil A  +  [logo] Outil B  →  Décision
───────────────────────────────────────────────────────────────────────────── */

interface TickerTool {
  name: string;
  domain: string;
}

interface TickerItem {
  tools: TickerTool[];
  decisionFr: string;
  decisionEn: string;
}

const ITEMS: TickerItem[] = [
  {
    tools: [{ name: "Notion", domain: "notion.so" }, { name: "Coda", domain: "coda.io" }],
    decisionFr: "Doublon à challenger",
    decisionEn: "Duplicate to challenge",
  },
  {
    tools: [{ name: "Slack", domain: "slack.com" }],
    decisionFr: "À garder si usage quotidien",
    decisionEn: "Keep if used daily",
  },
  {
    tools: [{ name: "Zoom", domain: "zoom.us" }, { name: "Teams", domain: "microsoft.com" }],
    decisionFr: "Redondance possible",
    decisionEn: "Possible redundancy",
  },
  {
    tools: [{ name: "HubSpot", domain: "hubspot.com" }],
    decisionFr: "Remplacer par Brevo à ce stade",
    decisionEn: "Replace with Brevo at this stage",
  },
  {
    tools: [{ name: "Zapier", domain: "zapier.com" }],
    decisionFr: "Make couvre 90% du besoin",
    decisionEn: "Make covers 90% of the need",
  },
  {
    tools: [{ name: "Harvest", domain: "getharvest.com" }, { name: "Pennylane", domain: "pennylane.com" }],
    decisionFr: "Doublon avec Pennylane",
    decisionEn: "Duplicates Pennylane",
  },
  {
    tools: [{ name: "Figma", domain: "figma.com" }, { name: "Sketch", domain: "sketch.com" }],
    decisionFr: "Couper Sketch",
    decisionEn: "Cut Sketch",
  },
  {
    tools: [{ name: "Loom", domain: "loom.com" }],
    decisionFr: "À challenger si < 3 vidéos/mois",
    decisionEn: "Challenge if < 3 videos/month",
  },
];

/* ── Logo pill with favicon CDN + letter fallback ── */
function TickerLogo({ name, domain }: TickerTool) {
  const [err, setErr] = useState(false);
  const src = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=32`;
  return (
    <span className="hpt-logo">
      {!err ? (
        <img src={src} alt="" aria-hidden="true" onError={() => setErr(true)} />
      ) : (
        <span className="hpt-logo-letter">{name[0].toUpperCase()}</span>
      )}
    </span>
  );
}

const TickerBar = () => {
  const { lang } = useLang();
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div
      className="hp-ticker relative overflow-hidden"
      role="marquee"
      aria-label={lang === "fr" ? "Exemples de décisions ToolTrim" : "ToolTrim decision examples"}
    >
      {/* Fades latéraux */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12"
        style={{ background: "linear-gradient(to right, #F8F8F4, transparent)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12"
        style={{ background: "linear-gradient(to left, #F8F8F4, transparent)" }}
      />

      {/* Scrolling track */}
      <div
        className="animate-ticker hover:[animation-play-state:paused]"
        style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="hpt-item">
            {/* Tools — [logo] Name  +  [logo] Name */}
            {item.tools.map((tool, ti) => (
              <span
                key={tool.domain}
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                {ti > 0 && <span className="hpt-plus">+</span>}
                <TickerLogo name={tool.name} domain={tool.domain} />
                <span className="hpt-name">{tool.name}</span>
              </span>
            ))}

            {/* Arrow */}
            <span className="hpt-arrow" aria-hidden="true">→</span>

            {/* Decision */}
            <span className="hpt-decision">
              {lang === "fr" ? item.decisionFr : item.decisionEn}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
