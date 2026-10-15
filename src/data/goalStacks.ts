// Shared by the homepage ("De vraies stacks, choisies selon votre objectif")
// and the search dialog ("Partir d'une stack").
export type StackTool = { slug: string; name: string; websiteUrl: string; logo?: string };

export interface GoalStack {
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
export const GOAL_STACKS: GoalStack[] = [
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
      { slug: "docusign", name: "DocuSign", websiteUrl: "https://docusign.com" },
      { slug: "stripe", name: "Stripe", websiteUrl: "https://stripe.com" },
    ],
  },
  {
    objectiveFr: "Créer du contenu",
    objectiveEn: "Create content",
    slug: "createur-contenu-operateur",
    titleFr: "Stack créateur de contenu",
    titleEn: "Content creator stack",
    subtitleFr: "Publiez, recyclez vos contenus et captez les demandes sans payer trois copilotes IA.",
    subtitleEn: "Publish, repurpose, and capture requests without paying for three copilots.",
    tools: [
      // Self-hosted: Simple Icons no longer carries the OpenAI mark.
      { slug: "chatgpt", name: "ChatGPT", websiteUrl: "https://chat.openai.com", logo: "/home-logos/chatgpt.webp" },
      { slug: "beehiiv", name: "Beehiiv", websiteUrl: "https://beehiiv.com" },
      { slug: "canva", name: "Canva", websiteUrl: "https://canva.com" },
      { slug: "buffer", name: "Buffer", websiteUrl: "https://buffer.com" },
    ],
  },
  {
    objectiveFr: "Automatiser",
    objectiveEn: "Automate",
    slug: "automatisation-legere-freelance",
    titleFr: "Stack automatisation légère",
    titleEn: "Light automation stack",
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
    objectiveFr: "Démarrer en solo",
    objectiveEn: "Start solo",
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
