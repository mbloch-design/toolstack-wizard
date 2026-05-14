import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

interface Persona {
  emoji: string;
  role: string;
  roleEn: string;
  sub: string;
  subEn: string;
  stack: string[];
  signals: string[];
  signalsEn: string[];
  saving: string;
  note: string;
  noteEn: string;
}

const PERSONAS: Persona[] = [
  {
    emoji: "👩‍💻",
    role: "Freelance Design / Dev",
    roleEn: "Design / Dev Freelancer",
    sub: "TJM 300–600€",
    subEn: "Daily rate €300–600",
    stack: ["Figma Pro", "Notion", "Linear", "Zapier", "Calendly"],
    signals: ["Doublons gestion projet fréquents", "Outils payants à free tier suffisant", "Stack surdimensionnée phase solo"],
    signalsEn: ["Frequent project management duplicates", "Paid tools with sufficient free tier", "Oversized stack for solo phase"],
    saving: "−780€/an",
    note: "identifiés sur 2,4 outils en moyenne",
    noteEn: "identified on 2.4 tools on average",
  },
  {
    emoji: "🏢",
    role: "DSI PME",
    roleEn: "SMB IT Director",
    sub: "Équipe 10–50 pers.",
    subEn: "Team 10–50 people",
    stack: ["Slack", "Teams", "Google Workspace", "Asana", "HubSpot"],
    signals: ["Suites qui se recouvrent (Microsoft + Google)", "Licences inutilisées (shadow IT)", "Outils redondants entre services"],
    signalsEn: ["Overlapping suites (Microsoft + Google)", "Unused licenses (shadow IT)", "Redundant tools across departments"],
    saving: "−3 400€/an",
    note: "principalement sur les licences dormantes",
    noteEn: "mainly on dormant licenses",
  },
  {
    emoji: "🚀",
    role: "Fondateur early-stage",
    roleEn: "Early-stage Founder",
    sub: "Bootstrapped / seed",
    subEn: "Bootstrapped / seed",
    stack: ["Notion", "Slack", "Linear", "Vercel", "HubSpot"],
    signals: ["CRM surdimensionné pour le stade", "Outils premium dès le jour 1", "Doublons automation (Zapier + Make)"],
    signalsEn: ["CRM oversized for the stage", "Premium tools from day 1", "Automation duplicates (Zapier + Make)"],
    saving: "−1 680€/an",
    note: "en downgrade ou swap vers alternatives gratuites",
    noteEn: "via downgrade or swap to free alternatives",
  },
  {
    emoji: "🤖",
    role: "Solopreneur IA / No-code",
    roleEn: "AI / No-code Solopreneur",
    sub: "Stack 100% no-code/IA",
    subEn: "100% no-code/AI stack",
    stack: ["ChatGPT", "Claude", "Perplexity", "Notion", "Zapier"],
    signals: ["3+ abonnements IA redondants", "Outils de productivité qui se recouvrent", "Coût/mois > revenu généré"],
    signalsEn: ["3+ redundant AI subscriptions", "Overlapping productivity tools", "Monthly cost > generated revenue"],
    saving: "−960€/an",
    note: "doublons IA principalement",
    noteEn: "mainly AI duplicates",
  },
  {
    emoji: "📊",
    role: "DAF / Ops",
    roleEn: "CFO / Ops",
    sub: "Vision coût global",
    subEn: "Total cost visibility",
    stack: ["Pennylane", "Qonto", "Spendesk", "Notion", "DocuSign"],
    signals: ["Modules compta redondants", "Contrats annuels sous-utilisés", "Fonctions couvertes par la suite existante"],
    signalsEn: ["Redundant accounting modules", "Underused annual contracts", "Functions covered by existing suite"],
    saving: "−4 200€/an",
    note: "via consolidation et renégociation",
    noteEn: "via consolidation and renegotiation",
  },
];

const PersonasSection = () => {
  const { lang, t, prefix } = useLang();
  const [active, setActive] = useState(0);
  const p = PERSONAS[active];

  return (
    <section className="bg-secondary/30 py-24 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
            {t("Pour qui", "Who it's for")}
          </span>
          <h2 className="font-display font-medium" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            {t("Conçu pour ", "Built for ")}<em className="text-primary italic">{t("5 expertises métier", "5 professional profiles")}</em>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground leading-relaxed">
            {t(
              "Chaque profil a des besoins différents. ToolTrim adapte son analyse à votre réalité.",
              "Each profile has different needs. ToolTrim adapts its analysis to your reality."
            )}
          </p>
        </div>

        {/* Persona selector — horizontal pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {PERSONAS.map((persona, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                active === i
                  ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground"
              }`}
            >
              <span className="text-lg">{persona.emoji}</span>
              <span>{lang === "en" ? persona.roleEn : persona.role}</span>
            </button>
          ))}
        </div>

        {/* Detail panel — Elevo-inspired clean layout */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden animate-in fade-in duration-300" key={active}>
          <div className="grid md:grid-cols-3">
            {/* Left: Stack */}
            <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border">
              <p className="text-[12px] font-semibold text-primary mb-5">
                {t("Stack typique", "Typical stack")}
              </p>
              <div className="space-y-2.5">
                {p.stack.map((name, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-secondary text-[10px] font-bold text-foreground"
                      aria-hidden="true"
                    >
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm text-foreground">{name}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                {lang === "en" ? p.subEn : p.sub}
              </p>
            </div>

            {/* Center: Signals detected */}
            <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border">
              <p className="text-[12px] font-semibold text-primary mb-5">
                {t("Signaux détectés", "Detected signals")}
              </p>
              <div className="space-y-3">
                {(lang === "en" ? p.signalsEn : p.signals).map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Savings */}
            <div className="p-8 md:p-10 flex flex-col justify-between">
              <div>
                <p className="text-[12px] font-semibold text-primary mb-3">
                  {t("Économie moyenne", "Average savings")}
                </p>
                <p className="text-5xl font-semibold tracking-[-3px] text-primary">{p.saving}</p>
                <p className="mt-2 text-sm text-muted-foreground">{lang === "en" ? p.noteEn : p.note}</p>
              </div>

              <Link
                to={`${prefix}/selector`}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
              >
                {t("Analyser ma stack", "Analyze my stack")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonasSection;
