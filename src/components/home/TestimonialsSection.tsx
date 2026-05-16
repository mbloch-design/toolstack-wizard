import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";

interface CaseType {
  profileFr: string;
  profileEn: string;
  situationFr: string;
  situationEn: string;
  stack: string[];
  signalFr: string;
  signalEn: string;
  decisionFr: string;
  decisionEn: string;
  href: string;
}

const CASE_TYPES: CaseType[] = [
  {
    profileFr: "Designer freelance",
    profileEn: "Freelance designer",
    situationFr: "Trois outils pour suivre les mêmes projets.",
    situationEn: "Three tools to track the same projects.",
    stack: ["Notion", "Trello", "Linear"],
    signalFr: "Doublon probable",
    signalEn: "Likely duplicate",
    decisionFr: "Garder l’outil central. Couper ce qui répète le même usage.",
    decisionEn: "Keep the central tool. Cut what repeats the same use.",
    href: "/stacks/designer-freelance-solo",
  },
  {
    profileFr: "Fondateur early-stage",
    profileEn: "Early-stage founder",
    situationFr: "Un CRM trop lourd avant d’avoir un vrai flux commercial.",
    situationEn: "A CRM that is too heavy before there is a real sales flow.",
    stack: ["HubSpot", "Tally", "Brevo"],
    signalFr: "Plan trop tôt",
    signalEn: "Plan too early",
    decisionFr: "Repousser le CRM complet. Garder une stack légère pour valider l’usage.",
    decisionEn: "Postpone the full CRM. Keep a light stack to validate usage.",
    href: "/stacks/startup-saas",
  },
  {
    profileFr: "Solopreneur IA",
    profileEn: "AI solopreneur",
    situationFr: "Plusieurs abonnements IA qui couvrent le même besoin.",
    situationEn: "Several AI subscriptions covering the same need.",
    stack: ["ChatGPT", "Claude", "Perplexity"],
    signalFr: "Redondance d’usage",
    signalEn: "Usage redundancy",
    decisionFr: "Garder l’outil principal. Challenger les abonnements secondaires.",
    decisionEn: "Keep the main tool. Challenge secondary subscriptions.",
    href: "/stacks/solopreneur",
  },
];

const TestimonialsSection = () => {
  const { lang, t, prefix } = useLang();

  return (
    <section className="home-case-section">
      <div className="home-case-shell">
        <div className="home-case-header">
          <p className="home-case-eyebrow">{t("Cas types", "Typical cases")}</p>
          <h2 className="home-case-title">
            {t(
              <>Les mêmes erreurs reviennent souvent.<br />Pas toujours au même endroit.</>,
              <>The same mistakes come back often.<br />Not always in the same place.</>,
            )}
          </h2>
          <p className="home-case-subtitle">
            {t(
              "Selon ton profil, le problème ne vient pas du même outil. ToolTrim lit la stack dans son ensemble pour repérer les doublons, les plans trop tôt et les outils surdimensionnés.",
              "Depending on your profile, the issue does not come from the same tool. ToolTrim reads the stack as a whole to spot duplicates, premature plans and oversized tools.",
            )}
          </p>
        </div>

        <div className="home-case-grid">
          {CASE_TYPES.map((item) => (
            <article key={item.profileFr} className="home-case-card">
              <p className="home-case-profile">{lang === "en" ? item.profileEn : item.profileFr}</p>
              <h3 className="home-case-card-title">{lang === "en" ? item.situationEn : item.situationFr}</h3>

              <div className="home-case-stack" aria-label={t("Stack exemple", "Example stack")}>
                {item.stack.map((tool) => (
                  <span key={tool} className="home-case-chip">{tool}</span>
                ))}
              </div>

              <span className="home-case-signal">{lang === "en" ? item.signalEn : item.signalFr}</span>

              <p className="home-case-decision">{lang === "en" ? item.decisionEn : item.decisionFr}</p>

              <Link to={`${prefix}${item.href}`} className="home-case-link">
                {t("Voir une stack adaptée →", "View a tailored stack →")}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
