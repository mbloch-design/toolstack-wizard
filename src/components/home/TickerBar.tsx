import { useLang } from "@/hooks/useLang";
import { ReactNode } from "react";

/** Tiny inline logo from Google favicons */
/** Tiny inline logo from Google favicons — with error fallback */
const L = ({ d }: { d: string }) => (
  <img
    src={`https://www.google.com/s2/favicons?domain=${d}&sz=32`}
    alt=""
    width={16}
    height={16}
    loading="lazy"
    className="inline-block shrink-0 rounded-sm"
    style={{ width: 16, height: 16 }}
    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
  />
);

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
      fr: <><L d="figma.com" /> Figma Pro → <span className="text-keep font-medium">Garder</span> · <L d="notion.so" /> Notion + <L d="coda.io" /> Coda → <span className="text-destructive">Doublon, couper Coda (−19€/m)</span></>,
      en: <><L d="figma.com" /> Figma Pro → <span className="text-keep font-medium">Keep</span> · <L d="notion.so" /> Notion + <L d="coda.io" /> Coda → <span className="text-destructive">Duplicate, cut Coda (−€19/m)</span></>,
    },
    {
      tag: lang === "fr" ? "DSI PME" : "SMB CTO",
      fr: <><L d="slack.com" /> Slack Pro → <span className="text-keep font-medium">Indispensable</span> · <L d="zoom.us" /> Zoom + <L d="teams.microsoft.com" /> Teams → <span className="text-destructive">Redondance (−14€/m)</span></>,
      en: <><L d="slack.com" /> Slack Pro → <span className="text-keep font-medium">Essential</span> · <L d="zoom.us" /> Zoom + <L d="teams.microsoft.com" /> Teams → <span className="text-destructive">Redundancy (−€14/m)</span></>,
    },
    {
      tag: lang === "fr" ? "Fondateur" : "Founder",
      fr: <><L d="hubspot.com" /> <span className="text-foreground/60 font-medium">HubSpot</span> → <span className="text-amber-500">Swap <L d="brevo.com" /> Brevo à ce stade (−67€/m)</span></>,
      en: <><L d="hubspot.com" /> <span className="text-foreground/60 font-medium">HubSpot</span> → <span className="text-amber-500">Swap to <L d="brevo.com" /> Brevo at this stage (−€67/m)</span></>,
    },
    {
      tag: lang === "fr" ? "Solopreneur IA" : "AI Solopreneur",
      fr: <><L d="zapier.com" /> <span className="text-foreground/60 font-medium">Zapier</span> → <span className="text-amber-500"><L d="make.com" /> Make couvre 90% du besoin (−49€/m)</span></>,
      en: <><L d="zapier.com" /> <span className="text-foreground/60 font-medium">Zapier</span> → <span className="text-amber-500"><L d="make.com" /> Make covers 90% of needs (−€49/m)</span></>,
    },
    {
      tag: lang === "fr" ? "DAF / Ops" : "CFO / Ops",
      fr: <><L d="spendesk.com" /> Spendesk → <span className="text-keep font-medium">ROI positif</span> · <L d="getharvest.com" /> Harvest → <span className="text-destructive">Couper (doublonne <L d="pennylane.com" /> Pennylane)</span></>,
      en: <><L d="spendesk.com" /> Spendesk → <span className="text-keep font-medium">Positive ROI</span> · <L d="getharvest.com" /> Harvest → <span className="text-destructive">Cut (duplicates <L d="pennylane.com" /> Pennylane)</span></>,
    },
  ];

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-border bg-secondary/30 py-3.5">
      <div className="flex animate-ticker gap-16 whitespace-nowrap hover:[animation-play-state:paused]">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground/60">
              {item.tag}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {lang === "en" ? item.en : item.fr}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
