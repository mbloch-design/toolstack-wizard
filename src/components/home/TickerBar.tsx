import { useLang } from "@/hooks/useLang";

const TickerBar = () => {
  const { t } = useLang();

  const items = [
    {
      tag: t("Freelance UX", "UX Freelancer"),
      text: t(
        <>Figma Pro → <span className="text-keep font-medium">Garder</span> · Notion + Coda → <span className="text-destructive">Doublon, couper Coda (−19€/m)</span></>,
        <>Figma Pro → <span className="text-keep font-medium">Keep</span> · Notion + Coda → <span className="text-destructive">Duplicate, cut Coda (−€19/m)</span></>
      ),
    },
    {
      tag: t("DSI PME", "SMB CTO"),
      text: t(
        <>Slack Pro → <span className="text-keep font-medium">Indispensable</span> · Zoom + Teams → <span className="text-destructive">Redondance (−14€/m)</span></>,
        <>Slack Pro → <span className="text-keep font-medium">Essential</span> · Zoom + Teams → <span className="text-destructive">Redundancy (−€14/m)</span></>
      ),
    },
    {
      tag: t("Fondateur", "Founder"),
      text: t(
        <><span className="text-foreground/60 font-medium">HubSpot</span> → <span className="text-amber-500">Swap Brevo à ce stade (−67€/m)</span></>,
        <><span className="text-foreground/60 font-medium">HubSpot</span> → <span className="text-amber-500">Swap to Brevo at this stage (−€67/m)</span></>
      ),
    },
    {
      tag: t("Solopreneur IA", "AI Solopreneur"),
      text: t(
        <><span className="text-foreground/60 font-medium">Zapier</span> → <span className="text-amber-500">Make couvre 90% du besoin (−49€/m)</span></>,
        <><span className="text-foreground/60 font-medium">Zapier</span> → <span className="text-amber-500">Make covers 90% of needs (−€49/m)</span></>
      ),
    },
    {
      tag: t("DAF / Ops", "CFO / Ops"),
      text: t(
        <>Spendesk → <span className="text-keep font-medium">ROI positif</span> · Harvest → <span className="text-destructive">Couper (doublonne Pennylane)</span></>,
        <>Spendesk → <span className="text-keep font-medium">Positive ROI</span> · Harvest → <span className="text-destructive">Cut (duplicates Pennylane)</span></>
      ),
    },
  ];

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-border bg-secondary/30 py-3.5">
      <div className="flex animate-ticker gap-16 whitespace-nowrap hover:[animation-play-state:paused]">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex shrink-0 items-center gap-2.5 text-xs text-muted-foreground">
            <span className="rounded border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground/60">
              {item.tag}
            </span>
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
