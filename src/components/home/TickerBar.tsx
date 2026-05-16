import { useLang } from "@/hooks/useLang";

/* ─────────────────────────────────────────────────────────────────────────────
   TickerBar — Sprint 6 · style Awwwards
   Ligne de décisions typographiques : outil(s) + décision courte + ◌
   Pas de logos. Rythme lent. Intensité basse.
───────────────────────────────────────────────────────────────────────────── */

interface TickerItem {
  /** Nom(s) d'outil — identiques FR/EN (noms propres) */
  tools: string;
  decisionFr: string;
  decisionEn: string;
}

const ITEMS: TickerItem[] = [
  { tools: "Notion + Trello",  decisionFr: "Doublon possible",    decisionEn: "Possible duplicate"   },
  { tools: "Slack Pro",        decisionFr: "À garder",            decisionEn: "Keep it"              },
  { tools: "Zoom + Teams",     decisionFr: "Redondance",          decisionEn: "Redundancy"           },
  { tools: "Zapier",           decisionFr: "Trop tôt",            decisionEn: "Too soon"             },
  { tools: "HubSpot",          decisionFr: "À remplacer",         decisionEn: "Replace it"           },
  { tools: "Figma + Sketch",   decisionFr: "Couper Sketch",       decisionEn: "Cut Sketch"           },
  { tools: "Loom",             decisionFr: "À challenger",        decisionEn: "Challenge it"         },
  { tools: "Harvest",          decisionFr: "Doublon Pennylane",   decisionEn: "Duplicates Pennylane" },
  { tools: "Coda + Notion",    decisionFr: "Garder un seul",      decisionEn: "Keep one"             },
];

const TickerBar = () => {
  const { lang } = useLang();
  /* Dupliquer pour boucle seamless (keyframe translateX 0 → -50%) */
  const track = [...ITEMS, ...ITEMS];

  return (
    /* aria-hidden : décoratif, pas de valeur d'information critique */
    <div className="hp-ticker relative overflow-hidden" aria-hidden="true">

      {/* Fades latéraux */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10"
        style={{ background: "linear-gradient(to right, #F8F8F4, transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10"
        style={{ background: "linear-gradient(to left, #F8F8F4, transparent)" }}
      />

      {/* Track animé */}
      <div className="animate-ticker hpt-track hover:[animation-play-state:paused]">
        {track.map((item, i) => (
          <span key={i} className="hpt-item-group">
            <span className="hpt-tools">{item.tools}</span>
            <span className="hpt-decision">
              {lang === "fr" ? item.decisionFr : item.decisionEn}
            </span>
            <span className="hpt-sep" aria-hidden="true">◌</span>
          </span>
        ))}
      </div>

    </div>
  );
};

export default TickerBar;
