import { Link } from "react-router-dom";
import { ArrowRight, FolderKanban, Handshake, PenTool, Zap } from "@/lib/icons";
import type { IconComponent } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import ToolLogo from "@/components/ToolLogo";

interface GoalStack {
  objectiveFr: string;
  objectiveEn: string;
  icon: IconComponent;
  slug: string;
  titleFr: string;
  titleEn: string;
  subtitleFr: string;
  subtitleEn: string;
  tools: Array<{ slug: string; name: string; websiteUrl: string }>;
}

// One flagship stack per business objective, picked from the ~200+ curated
// stacks for broad appeal within the freelancer / small-team audience —
// not the most tool-heavy stack per objective, the most relatable one.
const GOAL_STACKS: GoalStack[] = [
  {
    objectiveFr: "Gérer ses clients",
    objectiveEn: "Manage clients",
    icon: Handshake,
    slug: "consultant-b2b-propre",
    titleFr: "Stack consultant B2B",
    titleEn: "B2B consultant stack",
    subtitleFr: "Suivez vos opportunités, vos appels et vos livrables sans reconstruire une équipe commerciale.",
    subtitleEn: "Track opportunities, calls, and deliverables without rebuilding a sales team.",
    tools: [
      { slug: "pipedrive", name: "Pipedrive", websiteUrl: "https://pipedrive.com" },
      { slug: "calendly", name: "Calendly", websiteUrl: "https://calendly.com" },
      { slug: "notion", name: "Notion", websiteUrl: "https://notion.so" },
      { slug: "stripe", name: "Stripe", websiteUrl: "https://stripe.com" },
    ],
  },
  {
    objectiveFr: "Créer du contenu",
    objectiveEn: "Create content",
    icon: PenTool,
    slug: "createur-contenu-operateur",
    titleFr: "Stack créateur contenu",
    titleEn: "Content creator stack",
    subtitleFr: "Publiez, recyclez vos contenus et captez les demandes sans payer trois copilotes IA.",
    subtitleEn: "Publish, repurpose, and capture requests without paying for three copilots.",
    tools: [
      { slug: "chatgpt", name: "ChatGPT", websiteUrl: "https://chat.openai.com" },
      { slug: "notion", name: "Notion", websiteUrl: "https://notion.so" },
      { slug: "canva", name: "Canva", websiteUrl: "https://canva.com" },
      { slug: "buffer", name: "Buffer", websiteUrl: "https://buffer.com" },
    ],
  },
  {
    objectiveFr: "Automatiser",
    objectiveEn: "Automate",
    icon: Zap,
    slug: "automatisation-legere-freelance",
    titleFr: "Automatisation freelance",
    titleEn: "Freelance automation",
    subtitleFr: "Quelques tâches répétitives automatisées, sans la complexité de Zapier.",
    subtitleEn: "A few recurring tasks, automated — without the complexity of Zapier.",
    tools: [
      { slug: "make", name: "Make", websiteUrl: "https://make.com" },
      { slug: "tally", name: "Tally", websiteUrl: "https://tally.so" },
      { slug: "airtable", name: "Airtable", websiteUrl: "https://airtable.com" },
      { slug: "notion", name: "Notion", websiteUrl: "https://notion.so" },
    ],
  },
  {
    objectiveFr: "Organiser",
    objectiveEn: "Organize",
    icon: FolderKanban,
    slug: "freelance-solo-zero-bloat",
    titleFr: "Stack solo léger",
    titleEn: "Light solo stack",
    subtitleFr: "Vendez, qualifiez, livrez et encaissez avec le minimum viable.",
    subtitleEn: "Sell, qualify, deliver, and get paid with the viable minimum.",
    tools: [
      { slug: "notion", name: "Notion", websiteUrl: "https://notion.so" },
      { slug: "google-drive", name: "Google Drive", websiteUrl: "https://drive.google.com" },
      { slug: "stripe", name: "Stripe", websiteUrl: "https://stripe.com" },
      { slug: "tally", name: "Tally", websiteUrl: "https://tally.so" },
    ],
  },
];

const StackGoalsSection = () => {
  const { t, lang, prefix } = useLang();

  return (
    <section className="sgs-root">
      <div className="v2-container">
        <div className="sgs-head">
          <div>
            <h2 className="sgs-title">
              {t("De vraies stacks, choisies selon votre objectif", "Real stacks, picked by what you need to do")}
            </h2>
            <p className="sgs-lead">
              {t(
                "Quatre points de départ parmi notre bibliothèque de plus de 200 stacks.",
                "Four starting points from our library of 200+ curated stacks.",
              )}
            </p>
          </div>
          <Link to={`${prefix}/stacks`} className="sgs-all-link">
            {t("Voir toutes les stacks", "Browse all stacks")}
            <ArrowRight style={{ width: 14, height: 14 }} aria-hidden />
          </Link>
        </div>

        <div className="sgs-grid">
          {GOAL_STACKS.map((stack) => {
            const title = lang === "fr" ? stack.titleFr : stack.titleEn;
            const Icon = stack.icon;
            return (
              <Link key={stack.slug} to={`${prefix}/stacks/${stack.slug}`} className="sgs-card">
                <div className="sgs-card-logos">
                  {stack.tools.map((tool) => (
                    <span key={tool.slug} className="sgs-card-logo-tile">
                      <ToolLogo tool={tool} size={30} />
                    </span>
                  ))}
                </div>

                <span className="sgs-card-objective">
                  <Icon style={{ width: 14, height: 14 }} aria-hidden />
                  {lang === "fr" ? stack.objectiveFr : stack.objectiveEn}
                </span>
                <h3 className="sgs-card-title">{title}</h3>
                <p className="sgs-card-subtitle">
                  {lang === "fr" ? stack.subtitleFr : stack.subtitleEn}
                </p>

                <span className="sgs-card-link">
                  {t("Voir la stack", "View stack")}
                  <ArrowRight style={{ width: 14, height: 14 }} aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StackGoalsSection;
