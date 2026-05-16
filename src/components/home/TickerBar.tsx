import { useLang } from "@/hooks/useLang";
import { getToolLogoSources, type LogoCandidateTool } from "@/lib/toolLogos";
import { useEffect, useMemo, useState } from "react";

type TickerTool = LogoCandidateTool & {
  name: string;
  logoOverride?: string;
};

type TickerItem = {
  from: TickerTool[];
  to?: TickerTool[];
  decisionFr: string;
  decisionEn: string;
};

const icon = (slug: string, color = "111111") => `https://cdn.simpleicons.org/${slug}/${color}`;

const tool = (name: string, slug: string, websiteUrl: string, logoOverride?: string): TickerTool => ({
  name,
  slug,
  websiteUrl,
  logoOverride,
});

const TICKER_ITEMS: TickerItem[] = [
  {
    from: [tool("Loom", "loom", "https://www.loom.com", icon("loom", "625DF5"))],
    decisionFr: "À challenger",
    decisionEn: "Challenge it",
  },
  {
    from: [tool("Slack Pro", "slack", "https://slack.com", icon("slack", "4A154B"))],
    decisionFr: "À garder",
    decisionEn: "Keep",
  },
  {
    from: [
      tool("Zoom", "zoom", "https://zoom.us", icon("zoom", "0B5CFF")),
      tool("Teams", "microsoft-teams", "https://www.microsoft.com/microsoft-teams", icon("microsoftteams", "6264A7")),
    ],
    decisionFr: "Redondance",
    decisionEn: "Redundant",
  },
  {
    from: [tool("Zapier", "zapier", "https://zapier.com", icon("zapier", "FF4F00"))],
    decisionFr: "Trop tôt",
    decisionEn: "Too early",
  },
  {
    from: [tool("HubSpot", "hubspot", "https://www.hubspot.com", icon("hubspot", "FF5C35"))],
    to: [tool("Brevo", "brevo", "https://www.brevo.com", icon("brevo", "0B996E"))],
    decisionFr: "À remplacer",
    decisionEn: "Replace",
  },
  {
    from: [
      tool("Figma", "figma", "https://www.figma.com", icon("figma", "F24E1E")),
      tool("Sketch", "sketch", "https://www.sketch.com", icon("sketch", "F7B500")),
    ],
    decisionFr: "Couper Sketch",
    decisionEn: "Cut Sketch",
  },
  {
    from: [
      tool("Harvest", "harvest", "https://www.getharvest.com"),
      tool("Pennylane", "pennylane", "https://www.pennylane.com"),
    ],
    decisionFr: "Doublon",
    decisionEn: "Duplicate",
  },
  {
    from: [
      tool("Coda", "coda", "https://coda.io", icon("coda", "F46A54")),
      tool("Notion", "notion", "https://www.notion.so", icon("notion", "111111")),
    ],
    decisionFr: "Doublon",
    decisionEn: "Duplicate",
  },
];

function LogoPill({ tickerTool }: { tickerTool: TickerTool }) {
  const sources = useMemo(() => {
    const candidates = tickerTool.logoOverride
      ? [tickerTool.logoOverride, ...getToolLogoSources(tickerTool, 32)]
      : getToolLogoSources(tickerTool, 32);

    return Array.from(new Set(candidates));
  }, [tickerTool]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[sourceIndex];

  useEffect(() => {
    setSourceIndex(0);
  }, [sources]);

  return (
    <span className="ticker-logo-pill" aria-hidden="true">
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="ticker-logo-image"
          onError={() => setSourceIndex((index) => index + 1)}
        />
      ) : (
        <span className="ticker-logo-fallback">{tickerTool.name.charAt(0).toUpperCase()}</span>
      )}
    </span>
  );
}

function ToolGroup({ tools }: { tools: TickerTool[] }) {
  return (
    <span className="ticker-tool-group">
      {tools.map((item, index) => (
        <span key={`${item.slug}-${item.name}`} className="ticker-tool">
          {index > 0 && <span className="ticker-operator">+</span>}
          <LogoPill tickerTool={item} />
          <span className="ticker-tool-name">{item.name}</span>
        </span>
      ))}
    </span>
  );
}

const TickerBar = () => {
  const { lang } = useLang();
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="home-decision-ticker" aria-label={lang === "fr" ? "Exemples de décisions ToolTrim" : "ToolTrim decision examples"}>
      <div className="home-decision-ticker-track">
        {doubled.map((item, index) => (
          <span className="home-decision-ticker-item" key={`${item.decisionFr}-${index}`}>
            <ToolGroup tools={item.from} />
            {item.to && (
              <>
                <span className="ticker-operator">→</span>
                <ToolGroup tools={item.to} />
                <span className="ticker-operator">·</span>
              </>
            )}
            {!item.to && <span className="ticker-operator">→</span>}
            <span className="ticker-decision">{lang === "en" ? item.decisionEn : item.decisionFr}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
