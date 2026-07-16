import { Check } from "lucide-react";

interface Props {
  covers: string[];
  functionalNeeds?: string[];
  toolName: string;
  t: (fr: string, en: string) => string;
}

/** Convert a slug like "email-marketing" → "Email marketing" */
function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(" ");
}

// Override map for slugs that auto-label poorly
const LABEL_OVERRIDES: Record<string, { fr: string; en: string }> = {
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

function getLabel(slug: string, lang: "fr" | "en"): string {
  const override = LABEL_OVERRIDES[slug];
  if (override) return lang === "fr" ? override.fr : override.en;
  return slugToLabel(slug);
}

const MAX_FEATURES = 6;

export default function ToolFeaturesBlock({ covers, functionalNeeds = [], toolName, t }: Props) {
  // Merge covers + functional_needs, deduplicate, cap at MAX_FEATURES
  const lang = t("fr", "en") === "fr" ? "fr" : "en";
  const allSlugs = [...new Set([...covers, ...functionalNeeds])];
  if (allSlugs.length === 0) return null;

  const features = allSlugs.slice(0, MAX_FEATURES).map(slug => getLabel(slug, lang as "fr" | "en"));

  return (
    <div className="td-features-summary">
      {/* Feature grid (parent section already renders the eyebrow + title) */}
      <div className="td-feature-grid">
        {features.map((label) => (
          <div key={label} className="td-feature">
            <Check />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {allSlugs.length > MAX_FEATURES && (
        <p style={{ marginTop: 12, fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted)" }}>
          {t(
            `+ ${allSlugs.length - MAX_FEATURES} autres fonctionnalités`,
            `+ ${allSlugs.length - MAX_FEATURES} more features`
          )}
        </p>
      )}
    </div>
  );
}
