import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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
    stack: ["Figma Pro · Notion · Linear", "Zapier · Calendly · Stripe", "Loom · Miro · Harvest"],
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
    stack: ["Slack · Teams · Google Workspace", "Asana · Monday · ClickUp", "HubSpot · Spendesk · Notion"],
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
    stack: ["Notion · Slack · Linear", "Vercel · Supabase · Stripe", "HubSpot · Mailchimp · Zapier"],
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
    stack: ["ChatGPT · Claude · Perplexity", "Notion · Airtable · Zapier", "Canva · Descript · ElevenLabs"],
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
    stack: ["Pennylane · Qonto · Spendesk", "Notion · Slack · Google Drive", "Harvest · DocuSign · HubSpot"],
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
    <section className="border-t border-border bg-secondary/20 py-20 px-6">
      <div className="mx-auto max-w-[1100px]">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary mb-2">
          {t("Pour qui", "Who it's for")}
        </p>
        <h2 className="text-4xl font-bold tracking-[-1.5px]">
          {t("Fait pour 5 expertises précises", "Built for 5 specific expertise types")}
        </h2>

        {/* Persona cards grid */}
        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {PERSONAS.map((persona, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-xl border p-4 text-left transition-all ${
                active === i
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card hover:border-primary/20"
              }`}
            >
              <span className="text-2xl">{persona.emoji}</span>
              <p className="mt-2.5 text-sm font-semibold leading-tight">{lang === "en" ? persona.roleEn : persona.role}</p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">{lang === "en" ? persona.subEn : persona.sub}</p>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="mt-6 grid gap-6 rounded-xl border border-border bg-card p-6 sm:grid-cols-3 animate-in fade-in duration-200" key={active}>
          <div>
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-primary">{t("Stack typique", "Typical stack")}</p>
            <div className="space-y-1.5">
              {p.stack.map((s, i) => (
                <p key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="text-muted-foreground/30">·</span> {s}
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-primary">{t("Signaux détectés", "Detected signals")}</p>
            <div className="space-y-1.5">
              {(lang === "en" ? p.signalsEn : p.signals).map((s, i) => (
                <p key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="text-muted-foreground/30">·</span> {s}
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-primary">{t("Économie moyenne", "Average savings")}</p>
            <p className="text-3xl font-extrabold tracking-[-1px] text-primary">{p.saving}</p>
            <p className="mt-1.5 text-xs text-muted-foreground/60">{lang === "en" ? p.noteEn : p.note}</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
          >
            {t("Trouver mon profil et mes économies", "Find my profile and my savings")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PersonasSection;
