import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import ToolLogo from "@/components/ToolLogo";

type StackTool = { slug: string; name: string; websiteUrl: string; logo?: string };

interface GoalStack {
  objectiveFr: string;
  objectiveEn: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  subtitleFr: string;
  subtitleEn: string;
  tools: StackTool[];
}

// One flagship stack per business objective, picked from the ~200+ curated
// stacks for broad appeal within the freelancer / small-team audience —
// not the most tool-heavy stack per objective, the most relatable one.
const GOAL_STACKS: GoalStack[] = [
  {
    objectiveFr: "Gérer ses clients",
    objectiveEn: "Manage clients",
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
    slug: "createur-contenu-operateur",
    titleFr: "Stack créateur contenu",
    titleEn: "Content creator stack",
    subtitleFr: "Publiez, recyclez vos contenus et captez les demandes sans payer trois copilotes IA.",
    subtitleEn: "Publish, repurpose, and capture requests without paying for three copilots.",
    tools: [
      // Self-hosted: Simple Icons no longer carries the OpenAI mark.
      { slug: "chatgpt", name: "ChatGPT", websiteUrl: "https://chat.openai.com", logo: "/home-logos/chatgpt.webp" },
      { slug: "notion", name: "Notion", websiteUrl: "https://notion.so" },
      { slug: "canva", name: "Canva", websiteUrl: "https://canva.com" },
      { slug: "buffer", name: "Buffer", websiteUrl: "https://buffer.com" },
    ],
  },
  {
    objectiveFr: "Automatiser",
    objectiveEn: "Automate",
    slug: "automatisation-legere-freelance",
    titleFr: "Automatisation freelance",
    titleEn: "Freelance automation",
    subtitleFr: "Quelques tâches répétitives automatisées, sans la complexité de Zapier.",
    subtitleEn: "A few recurring tasks, automated, without the complexity of Zapier.",
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
  const { tools: catalog } = useToolSummaries();

  // Resolve against the live catalogue so logos use the same data (logo,
  // domain) as every other tool card; the config values only fill gaps.
  const bySlug = useMemo(() => new Map(catalog.map((tool) => [tool.slug, tool])), [catalog]);
  const resolve = (tool: StackTool) => {
    const live = bySlug.get(tool.slug);
    return {
      ...tool,
      ...live,
      name: live?.name || tool.name,
      websiteUrl: live?.websiteUrl || tool.websiteUrl,
      logo: tool.logo || live?.logo || undefined,
    };
  };

  return (
    <section className="sgs-root">
      <div className="v2-container">
        <div className="sgs-head">
          <div>
            <h2 className="v2-section-title">
              {t("De vraies stacks, choisies selon votre objectif", "Real stacks, picked by what you need to do")}
            </h2>
            <p className="sgs-lead">
              {t(
                "Quatre points de départ parmi notre bibliothèque de plus de 200 stacks.",
                "Four starting points from our library of 200+ curated stacks.",
              )}
            </p>
          </div>
          <Link to={`${prefix}/stacks`} className="tt-section-action v2-section-link">
            {t("Toutes les stacks", "All stacks")} <ArrowRight aria-hidden />
          </Link>
        </div>

        <ul className="sgs-list">
          {GOAL_STACKS.map((stack) => (
            <li key={stack.slug}>
              <Link to={`${prefix}/stacks/${stack.slug}`} className="sgs-item">
                {/* iOS-folder cluster: the stack reads as one bundle of apps. */}
                <span className="sgs-folder" aria-hidden>
                  {stack.tools.slice(0, 4).map((tool) => (
                    <span key={tool.slug} className="sgs-folder-app">
                      <ToolLogo tool={resolve(tool) as any} size={32} className="sgs-folder-logo" />
                    </span>
                  ))}
                </span>
                <span className="sgs-item-copy">
                  <span className="sgs-item-objective">{lang === "fr" ? stack.objectiveFr : stack.objectiveEn}</span>
                  <span className="sgs-item-title">{lang === "fr" ? stack.titleFr : stack.titleEn}</span>
                  <span className="sgs-item-subtitle">{lang === "fr" ? stack.subtitleFr : stack.subtitleEn}</span>
                  <span className="sr-only">{stack.tools.map((tool) => tool.name).join(", ")}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default StackGoalsSection;
