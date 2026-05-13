import { useLang } from "@/hooks/useLang";
import { ReactNode, useState } from "react";

/**
 * Tiny 14px logo for a given domain.
 * Chain: SimpleIcons CDN (auto-probe) → Google Favicon V2 → letter fallback
 */
const L = ({ d }: { d: string }) => {
  const domainSlug = d.split(".")[0]; // figma, notion, slack, hubspot …
  const [srcIndex, setSrcIndex] = useState(0);

  const sources = [
    `https://cdn.simpleicons.org/${domainSlug}`,
    `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${d}&size=32`,
  ];

  if (srcIndex < sources.length) {
    return (
      <img
        src={sources[srcIndex]}
        alt=""
        aria-hidden
        width={14}
        height={14}
        className="inline-block shrink-0 rounded-sm object-contain"
        style={{ width: 14, height: 14, verticalAlign: "middle", background: "hsl(var(--card))" }}
        onError={() => setSrcIndex((i) => i + 1)}
      />
    );
  }

  // Letter fallback
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-sm border border-border bg-secondary text-[9px] font-semibold uppercase text-muted-foreground"
      style={{ width: 14, height: 14, lineHeight: "14px" }}
    >
      {d.charAt(0).toUpperCase()}
    </span>
  );
};

interface TickerItem {
  tag: string;
  fr: ReactNode;
  en: ReactNode;
}

const TickerBar = () => {
  const { lang } = useLang();

  const items: TickerItem[] = [
    {
      tag: lang === "fr" ? "Freelance UX" : "UX Freelancer",
      fr: <><L d="figma.com" /> Figma Pro → <span className="text-keep font-medium">Garder</span> <span style={{ color: "hsl(var(--border))" }}>·</span> <L d="notion.so" /> Notion + <L d="coda.io" /> Coda → <span className="text-destructive font-medium">Doublon — couper Coda (−19€/m)</span></>,
      en: <><L d="figma.com" /> Figma Pro → <span className="text-keep font-medium">Keep</span> <span style={{ color: "hsl(var(--border))" }}>·</span> <L d="notion.so" /> Notion + <L d="coda.io" /> Coda → <span className="text-destructive font-medium">Duplicate — cut Coda (−€19/m)</span></>,
    },
    {
      tag: lang === "fr" ? "DSI PME" : "SMB CTO",
      fr: <><L d="slack.com" /> Slack Pro → <span className="text-keep font-medium">Indispensable</span> <span style={{ color: "hsl(var(--border))" }}>·</span> <L d="zoom.us" /> Zoom + <L d="teams.microsoft.com" /> Teams → <span className="text-destructive font-medium">Redondance (−14€/m)</span></>,
      en: <><L d="slack.com" /> Slack Pro → <span className="text-keep font-medium">Essential</span> <span style={{ color: "hsl(var(--border))" }}>·</span> <L d="zoom.us" /> Zoom + <L d="teams.microsoft.com" /> Teams → <span className="text-destructive font-medium">Redundancy (−€14/m)</span></>,
    },
    {
      tag: lang === "fr" ? "Fondateur" : "Founder",
      fr: <><L d="hubspot.com" /> HubSpot → <span className="text-cancel font-medium">Swap <L d="brevo.com" /> Brevo à ce stade (−67€/m)</span></>,
      en: <><L d="hubspot.com" /> HubSpot → <span className="text-cancel font-medium">Swap to <L d="brevo.com" /> Brevo at this stage (−€67/m)</span></>,
    },
    {
      tag: lang === "fr" ? "Solopreneur IA" : "AI Solopreneur",
      fr: <><L d="zapier.com" /> Zapier → <span className="text-cancel font-medium"><L d="make.com" /> Make couvre 90% du besoin (−49€/m)</span></>,
      en: <><L d="zapier.com" /> Zapier → <span className="text-cancel font-medium"><L d="make.com" /> Make covers 90% of needs (−€49/m)</span></>,
    },
    {
      tag: lang === "fr" ? "DAF / Ops" : "CFO / Ops",
      fr: <><L d="spendesk.com" /> Spendesk → <span className="text-keep font-medium">ROI positif</span> <span style={{ color: "hsl(var(--border))" }}>·</span> <L d="getharvest.com" /> Harvest → <span className="text-destructive font-medium">Couper (doublonne <L d="pennylane.com" /> Pennylane)</span></>,
      en: <><L d="spendesk.com" /> Spendesk → <span className="text-keep font-medium">Positive ROI</span> <span style={{ color: "hsl(var(--border))" }}>·</span> <L d="getharvest.com" /> Harvest → <span className="text-destructive font-medium">Cut (duplicates <L d="pennylane.com" /> Pennylane)</span></>,
    },
  ];

  const doubled = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden border-y border-border"
      style={{ background: "hsl(var(--card))" }}
    >
      {/* Edge fade — left */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
        style={{
          background: "linear-gradient(to right, hsl(var(--card)), transparent)",
        }}
      />
      {/* Edge fade — right */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
        style={{
          background: "linear-gradient(to left, hsl(var(--card)), transparent)",
        }}
      />

      <div className="flex animate-ticker items-center gap-14 py-3 whitespace-nowrap hover:[animation-play-state:paused]">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex shrink-0 items-center gap-2.5 text-xs">
            {/* Tag pill — DM Mono, primary tint */}
            <span
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "hsl(var(--primary))",
                background: "hsl(var(--primary) / 0.1)",
                border: "1px solid hsl(var(--primary) / 0.2)",
                borderRadius: "0.375rem",
                padding: "0.15rem 0.55rem",
              }}
            >
              {item.tag}
            </span>

            {/* Content */}
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {lang === "en" ? item.en : item.fr}
            </span>

            {/* Item separator */}
            <span
              style={{
                display: "inline-block",
                width: 1,
                height: 14,
                background: "hsl(var(--border))",
                marginLeft: "0.5rem",
                flexShrink: 0,
              }}
            />
          </span>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
