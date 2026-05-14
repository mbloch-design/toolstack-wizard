import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { ArrowRight, Laptop2, Building2, Rocket, Bot, Calculator } from "lucide-react";

interface Persona {
  Icon: React.ComponentType<{ className?: string }>;
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
    Icon: Laptop2,
    role: "Freelance Design / Dev",
    roleEn: "Design / Dev Freelancer",
    sub: "TJM 300–600€",
    subEn: "Daily rate €300–600",
    stack: ["Figma Pro", "Notion", "Linear", "Zapier", "Calendly"],
    signals: [
      "Gestion de projet en double (Notion + Linear)",
      "Outils payants avec un free tier suffisant",
      "Outils d'équipe utilisés en solo",
    ],
    signalsEn: [
      "Duplicate project management (Notion + Linear)",
      "Paid tools with a sufficient free tier",
      "Team tools used solo",
    ],
    saving: "−780€/an",
    note: "identifiés sur 2,4 outils en moyenne",
    noteEn: "identified across 2.4 tools on average",
  },
  {
    Icon: Building2,
    role: "DSI PME",
    roleEn: "SMB IT Director",
    sub: "Équipe 10–50 pers.",
    subEn: "Team 10–50 people",
    stack: ["Slack", "Teams", "Google Workspace", "Asana", "HubSpot"],
    signals: [
      "Suites qui se recouvrent (Microsoft + Google)",
      "Licences dormantes non détectées (shadow IT)",
      "Doublons entre services isolés",
    ],
    signalsEn: [
      "Overlapping suites (Microsoft + Google)",
      "Dormant undetected licenses (shadow IT)",
      "Duplicates between isolated departments",
    ],
    saving: "−3 400€/an",
    note: "principalement sur les licences dormantes",
    noteEn: "mainly on dormant licenses",
  },
  {
    Icon: Rocket,
    role: "Fondateur early-stage",
    roleEn: "Early-stage Founder",
    sub: "Bootstrapped / seed",
    subEn: "Bootstrapped / seed",
    stack: ["Notion", "Slack", "Linear", "Vercel", "HubSpot"],
    signals: [
      "CRM premium installé trop tôt",
      "Outils d'équipe à 3 utilisateurs",
      "Doublons automation (Zapier + Make)",
    ],
    signalsEn: [
      "Premium CRM installed too early",
      "Team tools at 3 users",
      "Automation duplicates (Zapier + Make)",
    ],
    saving: "−1 680€/an",
    note: "via downgrade ou swap vers alternatives gratuites",
    noteEn: "via downgrade or swap to free alternatives",
  },
  {
    Icon: Bot,
    role: "Solopreneur IA",
    roleEn: "AI Solopreneur",
    sub: "Stack IA / No-code",
    subEn: "AI / No-code stack",
    stack: ["ChatGPT Plus", "Claude Pro", "Perplexity", "Notion", "Zapier"],
    signals: [
      "3+ abonnements IA aux fonctions identiques",
      "Outils de productivité qui se doublonnent",
      "Coût mensuel supérieur à la valeur générée",
    ],
    signalsEn: [
      "3+ AI subscriptions with identical functions",
      "Overlapping productivity tools",
      "Monthly cost exceeds value generated",
    ],
    saving: "−960€/an",
    note: "principalement sur les doublons IA",
    noteEn: "mainly on AI duplicates",
  },
  {
    Icon: Calculator,
    role: "DAF / Ops",
    roleEn: "CFO / Ops",
    sub: "Vision coût global",
    subEn: "Total cost visibility",
    stack: ["Pennylane", "Qonto", "Spendesk", "Notion", "DocuSign"],
    signals: [
      "Modules comptables redondants avec la suite",
      "Contrats annuels sous-utilisés",
      "Fonctions déjà couvertes par l'outil principal",
    ],
    signalsEn: [
      "Accounting modules overlapping with the suite",
      "Underused annual contracts",
      "Functions already covered by the main tool",
    ],
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
    <section className="border-t border-border py-24 px-6">
      <div className="mx-auto max-w-7xl">

        {/* Header — centered, benefit-led headline */}
        <div className="mb-14 text-center">
          <span className="section-tag">{t("Par profil", "By profile")}</span>
          <h2 className="ts-h1">
            {t("Votre métier.", "Your role.")}
            <br />
            <span className="text-primary">{t("Votre diagnostic.", "Your diagnosis.")}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground leading-relaxed">
            {t(
              "Un freelance à 400€/jour n'a pas les mêmes angles morts qu'un DSI de PME. ToolTrim ajuste chaque analyse.",
              "A freelancer at €400/day doesn't have the same blind spots as an SMB IT director. ToolTrim adjusts every analysis."
            )}
          </p>
        </div>

        {/* Tabs — card style, dark active state mirrors section-tag */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {PERSONAS.map((persona, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2.5 rounded-xl border px-5 py-3 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                active === i
                  ? "border-transparent bg-foreground text-background shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/30 hover:text-primary"
              }`}
            >
              <persona.Icon className="h-4 w-4 shrink-0" />
              <span>{lang === "en" ? persona.roleEn : persona.role}</span>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div
          className="rounded-2xl border border-border bg-card overflow-hidden animate-in fade-in duration-300"
          key={active}
        >
          <div className="grid md:grid-cols-3">

            {/* Stack typique */}
            <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border">
              <p className="label-section mb-5">{t("Stack typique", "Typical stack")}</p>
              <div className="space-y-2.5">
                {p.stack.map((name) => (
                  <div key={name} className="flex items-center gap-3">
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

            {/* Signaux détectés */}
            <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border">
              <p className="label-section mb-5">{t("Signaux détectés", "Detected signals")}</p>
              <div className="space-y-3">
                {(lang === "en" ? p.signalsEn : p.signals).map((s) => (
                  <div key={s} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Économie moyenne */}
            <div className="p-8 md:p-10 flex flex-col justify-between">
              <div>
                <p className="label-section mb-3">{t("Économie moyenne", "Average savings")}</p>
                <p className="num-mono text-5xl font-semibold text-primary" style={{ letterSpacing: "-0.06em" }}>
                  {p.saving}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lang === "en" ? p.noteEn : p.note}
                </p>
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
