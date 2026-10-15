/** Convert a slug like "email-marketing" → "Email marketing" */
function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(" ");
}

// Override map for slugs that auto-label poorly
const LABEL_OVERRIDES: Record<string, { fr: string; en: string }> = {
  "prototyping": { fr: "Prototypage", en: "Prototyping" },
  "generation-texte": { fr: "Génération de texte", en: "Text generation" },
  "generation-image": { fr: "Génération d’images", en: "Image generation" },
  "analyse-documents": { fr: "Analyse de documents", en: "Document analysis" },
  "task-management": { fr: "Gestion de tâches", en: "Task management" },
  "knowledge-management": { fr: "Gestion des connaissances", en: "Knowledge management" },
  "modelisation-3d": { fr: "Modélisation 3D", en: "3D modeling" },
  "rendu-3d": { fr: "Rendu 3D", en: "3D rendering" },
  "animation-2d-3d": { fr: "Animation 2D/3D", en: "2D/3D animation" },
  "color-grading": { fr: "Étalonnage", en: "Color grading" },
  "montage-video": { fr: "Montage vidéo", en: "Video editing" },
  "effets-visuels": { fr: "Effets visuels", en: "Visual effects" },
  "presentations": { fr: "Présentations", en: "Presentations" },
  "workflow-automation": { fr: "Automatisation de workflows", en: "Workflow automation" },
  "workflows": { fr: "Workflows", en: "Workflows" },
  "form-builder": { fr: "Création de formulaires", en: "Form building" },
  "website-builder": { fr: "Création de sites", en: "Website building" },
  "landing-page": { fr: "Pages de destination", en: "Landing pages" },
  "hosting": { fr: "Hébergement", en: "Hosting" },
  "app-builder": { fr: "Création d’applications", en: "App building" },
  "devops": { fr: "Déploiement et exploitation", en: "Deployment and operations" },
  "ecommerce": { fr: "Commerce en ligne", en: "E-commerce" },
  "brainstorming": { fr: "Recherche d’idées", en: "Brainstorming" },
  "motion-design": { fr: "Animation graphique", en: "Motion design" },

  // Acronymes : la normalisation du vocabulaire a mis tous les termes en
  // minuscules (« CRM » → « crm »), et slugToLabel ne capitalise que la
  // première lettre — sans ces libellés, la fiche afficherait « Crm », « Ats »
  // ou « Ci cd ».
  // Termes français conservés par la fusion des synonymes : la variante FR
  // était majoritaire dans le catalogue (« facturation » sur 12 fiches contre
  // 1 à « invoicing »). Sans ces libellés, le site anglais afficherait
  // « Facturation » ou « Comptabilite ».
  "comptabilite":        { fr: "Comptabilité",          en: "Accounting"          },
  "paiements":           { fr: "Paiements",             en: "Payments"            },
  "automatisation":      { fr: "Automatisation",        en: "Automation"          },
  "facturation":         { fr: "Facturation",           en: "Invoicing"           },
  "planification":       { fr: "Planification",         en: "Scheduling"          },
  "base-de-donnees":     { fr: "Base de données",       en: "Database"            },
  "veille":              { fr: "Veille",                en: "Media monitoring"    },
  "redaction":           { fr: "Rédaction",             en: "Copywriting"         },
  "deploiement":         { fr: "Déploiement",           en: "Deployment"          },
  "publication":         { fr: "Publication",           en: "Publishing"          },
  "partage":             { fr: "Partage",               en: "Sharing"             },
  "synthese":            { fr: "Synthèse",              en: "Summarisation"       },
  "recherche":           { fr: "Recherche",             en: "Search"              },
  "validation":          { fr: "Validation",            en: "Approval"            },
  "crm":                 { fr: "CRM",                   en: "CRM"                 },
  "crm-calls":           { fr: "Appels CRM",            en: "CRM calls"           },
  "crm-enrichment":      { fr: "Enrichissement CRM",    en: "CRM enrichment"      },
  "crm-social":          { fr: "CRM social",            en: "Social CRM"          },
  "ats":                 { fr: "ATS (recrutement)",     en: "ATS (recruiting)"    },
  "lms":                 { fr: "LMS (formation)",       en: "LMS (training)"      },
  "sirh":                { fr: "SIRH",                  en: "HRIS"                },
  "cms":                 { fr: "CMS",                   en: "CMS"                 },
  "dam":                 { fr: "DAM (médiathèque)",     en: "DAM (asset library)" },
  "voip":                { fr: "VoIP",                  en: "VoIP"                },
  "ci-cd":               { fr: "CI/CD",                 en: "CI/CD"               },
  "erp-sync":            { fr: "Synchronisation ERP",   en: "ERP sync"            },
  "kpi-tracking":        { fr: "Suivi des KPI",         en: "KPI tracking"        },
  "ui-design":           { fr: "Design UI",             en: "UI design"           },
  "ui-testing":          { fr: "Tests UI",              en: "UI testing"          },
  "ui-generation":       { fr: "Génération d'UI",       en: "UI generation"       },
  "ui-icons":            { fr: "Icônes UI",             en: "UI icons"            },
  "ux-design":           { fr: "Design UX",             en: "UX design"           },
  "ux-ui":               { fr: "UX/UI",                 en: "UX/UI"               },
  "seo-video":           { fr: "SEO vidéo",             en: "Video SEO"           },
  "sfx":                 { fr: "Effets sonores",        en: "Sound effects"       },
  "raw":                 { fr: "Fichiers RAW",          en: "RAW files"           },
  "3d":                  { fr: "3D",                    en: "3D"                  },
  "crm-marketing":       { fr: "CRM marketing",        en: "Marketing CRM"       },
  "email-marketing":     { fr: "Email marketing",       en: "Email marketing"     },
  "ui-components":       { fr: "Composants UI",         en: "UI components"       },
  "ssr":                 { fr: "Rendu serveur (SSR)",   en: "Server-side render"  },
  "seo":                 { fr: "SEO",                   en: "SEO"                 },
  "css-in-js":           { fr: "CSS-in-JS",             en: "CSS-in-JS"           },
  "data-fetching":       { fr: "Requêtes de données",   en: "Data fetching"       },
  "state-management":    { fr: "Gestion d'état",        en: "State management"    },
  "build-tooling":       { fr: "Outils de build",       en: "Build tooling"       },
  "design-system":       { fr: "Design system",         en: "Design system"       },
  "design-collaboration":{ fr: "Collaboration design",  en: "Design collaboration"},
  "data-visualization":  { fr: "Visualisation données", en: "Data visualisation"  },
  "frontend-framework":  { fr: "Framework frontend",    en: "Frontend framework"  },
  "dom-manipulation":    { fr: "Manipulation DOM",      en: "DOM manipulation"    },
  "hris-sync":           { fr: "Synchro SIRH",          en: "HRIS sync"           },
  "legal-contracts":     { fr: "Contrats légaux",       en: "Legal contracts"     },
  "photo-manipulation":  { fr: "Manipulation photo",    en: "Photo manipulation"  },
  "marketing-automation":{ fr: "Automation marketing",  en: "Marketing automation"},
  "gestion-assets":      { fr: "Gestion d'assets",      en: "Asset management"    },
  "retouche-photo":      { fr: "Retouche photo",        en: "Photo editing"       },
  "compositing":         { fr: "Compositing",           en: "Compositing"         },
  "live-chat":           { fr: "Chat en direct",        en: "Live chat"           },
  "help-desk":           { fr: "Support client",        en: "Help desk"           },
  "project-management":  { fr: "Gestion de projet",     en: "Project management"  },
  "time-tracking":       { fr: "Suivi du temps",        en: "Time tracking"       },
  "invoicing":           { fr: "Facturation",           en: "Invoicing"           },
  "e-signature":         { fr: "Signature électronique",en: "E-signature"         },
  "video-conferencing":  { fr: "Visioconférence",       en: "Video conferencing"  },
  "cloud-storage":       { fr: "Stockage cloud",        en: "Cloud storage"       },
  "password-manager":    { fr: "Gestionnaire MDP",      en: "Password manager"    },
  "social-media":        { fr: "Réseaux sociaux",       en: "Social media"        },
  "analytics":           { fr: "Analytics",             en: "Analytics"           },
  "a-b-testing":         { fr: "Test A/B",              en: "A/B testing"         },
  "kanban":              { fr: "Kanban",                en: "Kanban"              },
  "gantt":               { fr: "Gantt",                 en: "Gantt chart"         },
  "reporting":           { fr: "Reporting",             en: "Reporting"           },
  "api-integration":     { fr: "Intégrations API",      en: "API integrations"    },
  "automation":          { fr: "Automatisation",        en: "Automation"          },
  "collaboration":       { fr: "Collaboration",         en: "Collaboration"       },
  "commenting":          { fr: "Commentaires",          en: "Commenting"          },
  "version-control":     { fr: "Versioning",            en: "Version control"     },
  "ai-generation":       { fr: "Génération IA",         en: "AI generation"       },
  "ai-writing":          { fr: "Rédaction IA",          en: "AI writing"          },
  "ai-coding":           { fr: "Code IA",               en: "AI coding"           },
  "ai-image":            { fr: "Image IA",              en: "AI image"            },
  "knowledge-base":      { fr: "Base de connaissance",  en: "Knowledge base"      },
  "document-editing":    { fr: "Édition de documents",  en: "Document editing"    },
  "spreadsheet":         { fr: "Tableur",               en: "Spreadsheet"         },
  "presentation":        { fr: "Présentation",          en: "Presentation"        },
};

export function getFeatureLabel(slug: string, lang: "fr" | "en"): string {
  const override = LABEL_OVERRIDES[slug];
  if (override) return lang === "fr" ? override.fr : override.en;
  return slugToLabel(slug);
}

