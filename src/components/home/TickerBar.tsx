import { useLang } from "@/hooks/useLang";

/* ─────────────────────────────────────────────────────────────────────────────
   TickerBar — fine bande de décisions ToolTrim
   Sprint 4c : rendu calme, texte simple, pas d'alerte financière.
   Contenu : exemples courts de décisions garder/couper/challenger.
───────────────────────────────────────────────────────────────────────────── */

interface TickerItem {
  fr: string;
  en: string;
}

const ITEMS: TickerItem[] = [
  {
    fr: "Notion + Coda → Doublon à challenger",
    en: "Notion + Coda → Duplicate to challenge",
  },
  {
    fr: "Slack Pro → À garder si usage quotidien",
    en: "Slack Pro → Keep if used daily",
  },
  {
    fr: "Zoom + Teams → Redondance possible",
    en: "Zoom + Teams → Possible redundancy",
  },
  {
    fr: "HubSpot → À remplacer par Brevo à ce stade",
    en: "HubSpot → Replace with Brevo at this stage",
  },
  {
    fr: "Zapier Pro → Make couvre 90% du besoin",
    en: "Zapier Pro → Make covers 90% of the need",
  },
  {
    fr: "Harvest → Doublon avec Pennylane",
    en: "Harvest → Duplicates Pennylane",
  },
  {
    fr: "Figma Pro + Sketch → Couper Sketch",
    en: "Figma Pro + Sketch → Cut Sketch",
  },
  {
    fr: "Loom → À challenger si < 3 vidéos/mois",
    en: "Loom → Challenge if < 3 videos/month",
  },
];

const TickerBar = () => {
  const { lang } = useLang();
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="hp-ticker relative overflow-hidden">
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

      <div
        className="flex animate-ticker items-center whitespace-nowrap hover:[animation-play-state:paused]"
        style={{ gap: "2.5rem", padding: "0 1.5rem" }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 13,
              color: "#6F6F68",
              gap: "1.5rem",
            }}
          >
            {lang === "en" ? item.en : item.fr}

            {/* Séparateur fin */}
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: 1,
                height: 10,
                background: "#CFCFC8",
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
