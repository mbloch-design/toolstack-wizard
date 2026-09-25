/**
 * The eight needs the site is organised around (homepage "Explore by need"
 * and the tools catalogue shelves). Each carries three hand-picked tools
 * with a one-line editorial take: a reference, a ToolTrim pick and a
 * discovery. That order is an editorial rule only and is never labelled.
 * The picks are curation, deliberately independent from how complete each
 * tool's fiche happens to be.
 */
export type UniversePick = { slug: string; takeFr: string; takeEn: string };

export const NEED_UNIVERSES: Array<{
  categoryId: string; labelFr: string; labelEn: string;
  subsFr: string[]; subsEn: string[]; picks: UniversePick[];
}> = [
  {
    categoryId: "organization", labelFr: "Productivité & Travail", labelEn: "Productivity & Work",
    subsFr: ["Notes", "Gestion de projet", "Gestion de tâches", "Base de connaissances"],
    subsEn: ["Notes", "Project Management", "Task Management", "Knowledge Base"],
    picks: [
      { slug: "notion", takeFr: "Assez flexible pour devenir presque n'importe quoi.", takeEn: "Flexible enough to become almost anything." },
      { slug: "todoist", takeFr: "Capturer vite, sans outil projet à administrer.", takeEn: "Fast capture, without a project tool to run." },
      { slug: "scribe", takeFr: "Transforme votre écran en guide pas à pas.", takeEn: "Turns your screen into a step-by-step guide." },
    ],
  },
  {
    categoryId: "creation", labelFr: "Création de contenu", labelEn: "Content Creation",
    subsFr: ["Vidéo", "Design", "Audio", "3D"],
    subsEn: ["Video", "Design", "Audio", "3D"],
    picks: [
      { slug: "canva", takeFr: "La vitesse et les modèles avant le contrôle fin.", takeEn: "Speed and templates over fine control." },
      { slug: "auphonic", takeFr: "Le mastering audio de podcast, en automatique.", takeEn: "Podcast audio, mastered automatically." },
      { slug: "screen-studio", takeFr: "Des démos Mac soignées, sans passer par le montage.", takeEn: "Polished Mac demos, no editing pass." },
    ],
  },
  {
    categoryId: "design-tools", labelFr: "Design", labelEn: "Design",
    subsFr: ["Design systems", "Motion design", "Modélisation 3D", "Prototypage"],
    subsEn: ["Design Systems", "Motion Design", "3D Modeling", "Prototyping"],
    picks: [
      { slug: "figma", takeFr: "Design, prototype et handoff dans un seul fichier.", takeEn: "Design, prototype and handoff in one file." },
      { slug: "affinity-photo", takeFr: "Une alternative à Photoshop, désormais gratuite.", takeEn: "A Photoshop alternative, now free." },
      { slug: "spline", takeFr: "De la 3D interactive sans suite 3D complète.", takeEn: "Interactive 3D without a full 3D suite." },
    ],
  },
  {
    categoryId: "email-productivity", labelFr: "Marketing & Ventes", labelEn: "Marketing & Sales",
    subsFr: ["Email outreach", "Newsletter", "Prospection", "Réseaux sociaux"],
    subsEn: ["Email Outreach", "Newsletter", "Prospecting", "Social Media"],
    picks: [
      { slug: "mailchimp", takeFr: "Le point de départ classique pour une petite liste.", takeEn: "The familiar start for a small email list." },
      { slug: "lemlist", takeFr: "Pensé pour la prospection à froid, pas la newsletter.", takeEn: "Built for cold outreach, not newsletters." },
      { slug: "clay", takeFr: "Croise de nombreuses sources en une liste de leads.", takeEn: "Stacks many data sources into one lead list." },
    ],
  },
  {
    categoryId: "automation", labelFr: "Automatisation", labelEn: "Automation",
    subsFr: ["Workflows", "No-code", "Agents IA", "Web scraping"],
    subsEn: ["Workflows", "No-Code", "AI Agents", "Web Scraping"],
    picks: [
      { slug: "make", takeFr: "Le juste milieu visuel.", takeEn: "The visual middle ground." },
      { slug: "n8n", takeFr: "Puissant quand vous voulez tout contrôler.", takeEn: "Powerful when you want full control." },
      { slug: "lindy", takeFr: "L'automatisation sans tout construire vous-même.", takeEn: "Automation without building everything yourself." },
    ],
  },
  {
    categoryId: "nocode-web", labelFr: "Développement & No-Code", labelEn: "Development & No-Code",
    subsFr: ["DevOps", "Créateurs de sites", "E-commerce", "Créateurs d'apps"],
    subsEn: ["DevOps", "Website Builders", "E-commerce", "App Builders"],
    picks: [
      { slug: "webflow", takeFr: "De vrais sites en production, construits visuellement.", takeEn: "Production sites, built visually." },
      { slug: "supabase", takeFr: "Postgres, auth et stockage sans gérer de serveur.", takeEn: "Postgres, auth and storage without a server to run." },
      { slug: "carrd", takeFr: "Souvent tout ce qu'il faut pour un site d'une page.", takeEn: "Often all a one-page site needs." },
    ],
  },
  {
    categoryId: "communication", labelFr: "Communication", labelEn: "Communication",
    subsFr: ["Chat d'équipe", "Téléphonie pro", "Planification", "Support client"],
    subsEn: ["Team Chat", "Business Phone", "Scheduling", "Customer Support"],
    picks: [
      { slug: "calendly", takeFr: "Un lien de réservation qui met fin aux allers-retours.", takeEn: "A booking link that ends the back-and-forth." },
      { slug: "loom", takeFr: "Quand une vidéo de deux minutes remplace une réunion.", takeEn: "When a two-minute video beats a meeting." },
      { slug: "crisp", takeFr: "Un chat support facturé par espace, pas par siège.", takeEn: "Support chat priced per workspace, not per seat." },
    ],
  },
  {
    categoryId: "analytics", labelFr: "Données & Analytics", labelEn: "Data & Analytics",
    subsFr: ["SEO", "Visualisation de données", "Dashboards", "Recherche utilisateur"],
    subsEn: ["SEO", "Data Visualization", "Dashboards", "User Research"],
    picks: [
      { slug: "google-analytics", takeFr: "La référence gratuite pour mesurer l'audience.", takeEn: "The free default for measuring traffic." },
      { slug: "microsoft-clarity", takeFr: "Heatmaps et replays gratuits, sans plafond de trafic.", takeEn: "Free heatmaps and replays, no traffic cap." },
      { slug: "datawrapper", takeFr: "Des graphiques propres pour articles et rapports.", takeEn: "Clean charts for articles and reports." },
    ],
  },
];
