import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { ArrowRight, Laptop2, Rocket, Bot, Calculator } from "lucide-react";

interface Persona {
  Icon: React.ComponentType<{ className?: string }>;
  role: string;
  roleEn: string;
  sub: string;
  subEn: string;
  stack: string[];
  signals: string[];
  signalsEn: string[];
  recommendation: string[];
  recommendationEn: string[];
  budgetSignal: string;
  budgetSignalEn: string;
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
    recommendation: [
      "Garder les outils cœur.",
      "Challenger les doublons.",
      "Repousser les plans avancés tant que l’usage ne les justifie pas.",
    ],
    recommendationEn: [
      "Keep core tools.",
      "Challenge duplicates.",
      "Postpone advanced plans until usage justifies them.",
    ],
    budgetSignal: "Budget à recalibrer",
    budgetSignalEn: "Budget to recalibrate",
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
    recommendation: [
      "Limiter les outils d’équipe tant que l’équipe reste petite.",
      "Challenger les CRM installés trop tôt.",
      "Garder la stack proche du revenu réel.",
    ],
    recommendationEn: [
      "Limit team tools while the team is small.",
      "Challenge CRMs installed too early.",
      "Keep the stack close to actual revenue.",
    ],
    budgetSignal: "Plans trop tôt",
    budgetSignalEn: "Plans activated too early",
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
    recommendation: [
      "Choisir une IA principale.",
      "Garder les outils qui entrent dans la production réelle.",
      "Couper les tests qui restent ouverts par habitude.",
    ],
    recommendationEn: [
      "Choose one main AI tool.",
      "Keep tools that are part of real production.",
      "Cut tests that stay open by habit.",
    ],
    budgetSignal: "Outils à challenger",
    budgetSignalEn: "Tools to challenge",
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
    recommendation: [
      "Regrouper les fonctions déjà couvertes.",
      "Identifier les contrats sous-utilisés.",
      "Prioriser consolidation et renégociation.",
    ],
    recommendationEn: [
      "Group functions already covered elsewhere.",
      "Identify underused contracts.",
      "Prioritize consolidation and renegotiation.",
    ],
    budgetSignal: "Budget à recalibrer",
    budgetSignalEn: "Budget to recalibrate",
  },
];

const PersonasSection = () => {
  const { lang, t, prefix } = useLang();
  const [active, setActive] = useState(0);
  const p = PERSONAS[active];
  const signals = lang === "en" ? p.signalsEn : p.signals;
  const recommendation = lang === "en" ? p.recommendationEn : p.recommendation;

  return (
    <section className="home-profile-section">
      <div className="home-profile-shell">

        <div className="home-profile-header">
          <span className="home-profile-eyebrow">{t("Selon ton contexte", "Based on your context")}</span>
          <h2 className="home-profile-title">
            {t("Chaque profil a ses angles morts.", "Every profile has its blind spots.")}
          </h2>
          <p className="home-profile-subtitle">
            {t(
              "Le problème ne vient jamais du même endroit. Mais ToolTrim sait où chercher selon ton profil.",
              "The issue never comes from the same place. But ToolTrim knows where to look based on your profile."
            )}
          </p>
        </div>

        <div className="home-profile-tabs" role="tablist" aria-label={t("Profils", "Profiles")}>
          {PERSONAS.map((persona, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={`home-profile-tab ${active === i ? "home-profile-tab--active" : ""}`}
            >
              <persona.Icon className="h-4 w-4 shrink-0" />
              <span>{lang === "en" ? persona.roleEn : persona.role}</span>
            </button>
          ))}
        </div>

        <div className="home-profile-panel" key={active}>
          <div className="home-profile-grid">

            <div className="home-profile-column">
              <p className="home-profile-column-label">{t("Stack typique", "Typical stack")}</p>
              <div className="home-profile-stack">
                {p.stack.map((name) => (
                  <div key={name} className="home-profile-tool">
                    <span className="home-profile-tool-mark" aria-hidden="true">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
              <p className="home-profile-note">
                {lang === "en" ? p.subEn : p.sub}
              </p>
            </div>

            <div className="home-profile-column">
              <p className="home-profile-column-label">{t("Signaux à surveiller", "Signals to watch")}</p>
              <div className="home-profile-list">
                {signals.map((signal) => (
                  <p key={signal}>{signal}</p>
                ))}
              </div>
              <div className="home-profile-budget">
                <p>{lang === "en" ? p.budgetSignalEn : p.budgetSignal}</p>
                <span>{t("Identifié selon le profil, le niveau et les outils déjà utilisés.", "Identified based on profile, level and tools already used.")}</span>
              </div>
            </div>

            <div className="home-profile-column home-profile-column--action">
              <div>
                <p className="home-profile-column-label">{t("Recommandation ToolTrim", "ToolTrim recommendation")}</p>
                <div className="home-profile-list home-profile-list--strong">
                  {recommendation.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
              <Link
                to={`${prefix}/selector`}
                className="home-profile-cta"
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
