import type { AgentAccess } from "@/data/types";

/** Real blocks from the catalogue (src/data/tools_v4.json, verified on the vendor docs), worst cases included. */
export const agentAccessStates = {
  /** One remote server, every plan, three kinds of action, an admin safeguard. */
  notion: {
    "mcp": "official",
    "verifiedOn": "2026-11-16",
    "sources": [
      {
        "label": "Notion Developers — Notion MCP, overview",
        "url": "https://developers.notion.com/guides/mcp/overview"
      },
      {
        "label": "Notion Developers — Connect to Notion MCP (setup, FAQ plans)",
        "url": "https://developers.notion.com/guides/mcp/get-started-with-mcp"
      },
      {
        "label": "Notion Developers — Supported tools",
        "url": "https://developers.notion.com/guides/mcp/mcp-supported-tools"
      }
    ],
    "servers": [
      {
        "name": "Notion MCP",
        "transport": "remote",
        "auth": [
          "oauth",
          "key"
        ],
        "access": "read_write",
        "plan": "all",
        "planNote": "Tous les forfaits. Jetons MCP (connexion sans navigateur), recherche dans les sources connectées et requêtes SQL illimitées : Business et Enterprise. Les invités d'un espace ne peuvent pas se connecter.",
        "planNoteEn": "Every plan. MCP tokens (no browser sign-in), connected-source search and unlimited SQL queries: Business and Enterprise. Workspace guests cannot connect.",
        "docsUrl": "https://developers.notion.com/guides/mcp/get-started-with-mcp",
        "mcpSlug": "notion-mcp"
      }
    ],
    "status": "ga",
    "capabilities": [
      {
        "kind": "read",
        "fr": "Chercher et lire pages, bases et notes de réunion, y compris dans les sources connectées",
        "en": "Search and read pages, databases and meeting notes, including connected sources"
      },
      {
        "kind": "write",
        "fr": "Créer et modifier pages, bases, vues, commentaires et événements d'agenda",
        "en": "Create and edit pages, databases, views, comments and calendar events"
      },
      {
        "kind": "delete",
        "fr": "Supprimer pages, bases et commentaires ; restaurer une version",
        "en": "Delete pages, databases and comments; restore a version"
      }
    ],
    "setup": [
      {
        "assistant": "claude",
        "how": "connector"
      },
      {
        "assistant": "chatgpt",
        "how": "connector"
      },
      {
        "assistant": "gemini",
        "how": "connector"
      },
      {
        "assistant": "other",
        "how": "url"
      }
    ],
    "safeguards": [
      "admin_controls"
    ]
  } satisfies AgentAccess,
  /** Two servers, two sheet links. */
  figma: {
    "mcp": "official",
    "verifiedOn": "2026-11-16",
    "sources": [
      {
        "label": "Figma Help Center — Guide to the Figma MCP server",
        "url": "https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server"
      },
      {
        "label": "Figma Developer Docs — Rate limits & access",
        "url": "https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/"
      },
      {
        "label": "Figma Developer Docs — Set up the remote server",
        "url": "https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/"
      },
      {
        "label": "Figma Developer Docs — Set up the desktop server",
        "url": "https://developers.figma.com/docs/figma-mcp-server/local-server-installation/"
      },
      {
        "label": "Figma Developer Docs — Tools and prompts",
        "url": "https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/"
      }
    ],
    "servers": [
      {
        "name": "Figma MCP server (remote)",
        "transport": "remote",
        "access": "read_write",
        "plan": "all",
        "planNote": "Tous les forfaits, mais 20 appels par mois sur le forfait Starter et les sièges View ou Collab ; 200 par jour avec un siège Full ou Dev payant. Écrire hors de ses brouillons demande un siège Full.",
        "planNoteEn": "All plans, but 20 tool calls per month on the Starter plan and on View or Collab seats; 200 per day with a paid Full or Dev seat. Writing outside your drafts requires a Full seat.",
        "clients": [
          "claude",
          "cursor",
          "vs-code",
          "replit",
          "linear",
          "warp",
          "clickup",
          "notion"
        ],
        "docsUrl": "https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/",
        "mcpSlug": "figma-mcp"
      },
      {
        "name": "Figma MCP server (desktop)",
        "transport": "local",
        "access": "read",
        "plan": "specific",
        "planNote": "Siège Dev ou Full sur un forfait Professional, Education, Organization ou Enterprise ; application de bureau Figma requise.",
        "planNoteEn": "Dev or Full seat on a Professional, Education, Organization or Enterprise plan; requires the Figma desktop app.",
        "clients": [
          "claude",
          "cursor",
          "vs-code",
          "warp"
        ],
        "docsUrl": "https://developers.figma.com/docs/figma-mcp-server/local-server-installation/",
        "mcpSlug": "figma-mcp-desktop"
      }
    ],
    "capabilities": [
      {
        "kind": "read",
        "fr": "Lire le contexte d'un design : variables, composants, mise en page, y compris FigJam",
        "en": "Read a design's context: variables, components, layout, including FigJam"
      },
      {
        "kind": "write",
        "fr": "Créer et modifier frames, composants, variables et auto layout dans vos fichiers",
        "en": "Create and edit frames, components, variables and auto layout in your files"
      },
      {
        "kind": "delete",
        "fr": "Supprimer des calques ou contenus existants, par l'outil d'écriture",
        "en": "Delete existing layers or content, through the write tool"
      }
    ],
    "setup": [
      {
        "assistant": "claude",
        "how": "connector"
      },
      {
        "assistant": "copilot",
        "how": "plugin"
      },
      {
        "assistant": "other",
        "how": "url"
      }
    ],
    "safeguards": [],
    "note": "L'écriture dans les fichiers est en bêta.",
    "noteEn": "Writing to files is in beta."
  } satisfies AgentAccess,
  /** Paid plans; no safeguard documented. */
  ahrefs: {
    "mcp": "official",
    "verifiedOn": "2026-11-16",
    "sources": [
      {
        "label": "Ahrefs for Developers — What is Ahrefs MCP",
        "url": "https://docs.ahrefs.com/en/mcp/docs/introduction"
      },
      {
        "label": "Ahrefs Help — Getting started with Ahrefs MCP",
        "url": "https://help.ahrefs.com/en/articles/13913559-getting-started-with-ahrefs-mcp"
      },
      {
        "label": "Ahrefs — Ahrefs SEO MCP",
        "url": "https://ahrefs.com/mcp"
      }
    ],
    "servers": [
      {
        "name": "Ahrefs MCP",
        "transport": "remote",
        "auth": [
          "oauth",
          "key"
        ],
        "access": "read_write",
        "plan": "paid",
        "planNote": "Forfaits payants à partir de Lite ; chaque appel consomme des unités API du quota mensuel du forfait.",
        "planNoteEn": "Paid plans from Lite up; each call uses API units from the plan's monthly allowance.",
        "docsUrl": "https://docs.ahrefs.com/en/mcp/docs/introduction",
        "mcpSlug": "ahrefs-mcp"
      }
    ],
    "capabilities": [
      {
        "kind": "read",
        "fr": "Lire les données SEO : mots-clés, backlinks, positions",
        "en": "Read SEO data: keywords, backlinks, rankings"
      },
      {
        "kind": "write",
        "fr": "Créer et modifier des publications pour les réseaux sociaux",
        "en": "Create and edit social media posts"
      },
      {
        "kind": "delete",
        "fr": "Supprimer des publications pour les réseaux sociaux",
        "en": "Delete social media posts"
      }
    ],
    "setup": [
      {
        "assistant": "claude",
        "how": "connector"
      },
      {
        "assistant": "chatgpt",
        "how": "plugin"
      }
    ],
    "safeguards": []
  } satisfies AgentAccess,
  /** Checked, no official server; a note on the merger. */
  hotjar: {
    "mcp": "none",
    "verifiedOn": "2026-11-16",
    "sources": [
      {
        "label": "Contentsquare — Hotjar Free vs Contentsquare Free (« Connect your AI assistant » : — pour Hotjar)",
        "url": "https://contentsquare.com/hotjar/free-mcp/"
      },
      {
        "label": "Hotjar Documentation — recherche « MCP », aucun résultat",
        "url": "https://help.hotjar.com/hc/en-us/search?query=MCP"
      }
    ],
    "servers": [],
    "note": "Hotjar a rejoint Contentsquare, dont l'offre propose un serveur MCP.",
    "noteEn": "Hotjar has joined Contentsquare, whose offer includes an MCP server."
  } satisfies AgentAccess,
  /** Can cancel meetings; no safeguard documented. */
  calendly: {
    "mcp": "official",
    "verifiedOn": "2026-11-16",
    "sources": [
      {
        "label": "Calendly Developer — Calendly MCP Overview",
        "url": "https://developer.calendly.com/docs/mcp/calendly-mcp-server"
      },
      {
        "label": "Calendly Help — Connect Calendly to your AI tools",
        "url": "https://calendly.com/help/connect-calendly-to-your-ai-tools"
      }
    ],
    "servers": [
      {
        "name": "Calendly MCP server",
        "transport": "remote",
        "auth": [
          "oauth"
        ],
        "access": "read_write",
        "plan": "all",
        "planNote": "Aucun forfait payant requis ; certaines actions dépendent du forfait.",
        "planNoteEn": "No paid plan required; some actions depend on your plan.",
        "docsUrl": "https://developer.calendly.com/docs/mcp/calendly-mcp-server",
        "mcpSlug": "calendly-mcp"
      }
    ],
    "status": "ga",
    "capabilities": [
      {
        "kind": "read",
        "fr": "Trouver des créneaux libres et voir les plages occupées",
        "en": "Find open time and view busy slots"
      },
      {
        "kind": "write",
        "fr": "Réserver un rendez-vous, créer un lien à usage unique, modifier disponibilités et types d'événements",
        "en": "Book meetings, create single-use links, update availability and event types"
      },
      {
        "kind": "delete",
        "fr": "Annuler un rendez-vous",
        "en": "Cancel meetings"
      }
    ],
    "setup": [
      {
        "assistant": "claude",
        "how": "connector"
      },
      {
        "assistant": "chatgpt",
        "how": "plugin"
      },
      {
        "assistant": "other",
        "how": "url"
      }
    ],
    "safeguards": []
  } satisfies AgentAccess,
  /** Can move money, with human confirmation; beta. */
  stripe: {
    "mcp": "official",
    "verifiedOn": "2026-11-16",
    "sources": [
      {
        "label": "Stripe Docs — Model Context Protocol (MCP)",
        "url": "https://docs.stripe.com/mcp"
      }
    ],
    "servers": [
      {
        "name": "Stripe MCP",
        "transport": "remote",
        "auth": [
          "oauth",
          "key"
        ],
        "access": "read_write",
        "plan": "unknown",
        "docsUrl": "https://docs.stripe.com/mcp",
        "mcpSlug": "stripe-mcp"
      }
    ],
    "status": "beta",
    "capabilities": [
      {
        "kind": "read",
        "fr": "Lire les données du compte, les analyses et la documentation Stripe",
        "en": "Read account data, analytics and Stripe documentation"
      },
      {
        "kind": "write",
        "fr": "Créer et modifier des objets Stripe (clients, remboursements…)",
        "en": "Create and update Stripe objects (customers, refunds…)"
      },
      {
        "kind": "pay",
        "fr": "Envoyer ou convertir de l'argent depuis un compte Treasury, avec confirmation humaine",
        "en": "Send or convert money from a Treasury account, with human confirmation"
      }
    ],
    "setup": [
      {
        "assistant": "claude",
        "how": "plugin"
      },
      {
        "assistant": "chatgpt",
        "how": "plugin"
      },
      {
        "assistant": "other",
        "how": "url"
      }
    ],
    "safeguards": [
      "human_confirmation",
      "admin_controls",
      "scoped_keys"
    ]
  } satisfies AgentAccess,
  /** Local only, read-only: the most technical. */
  googleAnalytics: {
    "mcp": "official",
    "verifiedOn": "2026-11-16",
    "sources": [
      {
        "label": "Google for Developers — Try the Google Analytics MCP server",
        "url": "https://developers.google.com/analytics/devguides/MCP"
      },
      {
        "label": "GitHub googleanalytics/google-analytics-mcp",
        "url": "https://github.com/googleanalytics/google-analytics-mcp"
      }
    ],
    "servers": [
      {
        "name": "Google Analytics MCP server",
        "transport": "local",
        "access": "read",
        "plan": "unknown",
        "docsUrl": "https://developers.google.com/analytics/devguides/MCP",
        "mcpSlug": "google-analytics-mcp"
      }
    ],
    "capabilities": [
      {
        "kind": "read",
        "fr": "Lire comptes, propriétés, rapports et données en temps réel",
        "en": "Read accounts, properties, reports and realtime data"
      }
    ],
    "setup": [
      {
        "assistant": "claude",
        "how": "local"
      },
      {
        "assistant": "other",
        "how": "local"
      }
    ],
    "safeguards": [
      "scoped_keys",
      "no_delete"
    ],
    "note": "Serveur à installer sur votre ordinateur et à relier par des identifiants Google Cloud : une mise en place technique.",
    "noteEn": "A server to install on your computer and connect with Google Cloud credentials: a technical setup."
  } satisfies AgentAccess,
  /** Setup and safeguards unread (vendor help page blocked): left out, never guessed. */
  canva: {
    "mcp": "official",
    "verifiedOn": "2026-11-16",
    "sources": [
      {
        "label": "Canva Help Center — Connect Canva to an AI assistant",
        "url": "https://www.canva.com/help/mcp-agent-setup/"
      },
      {
        "label": "Canva Developers — About Canva MCP",
        "url": "https://www.canva.dev/docs/apps/mcp/"
      },
      {
        "label": "Canva Developers — Access and permissions",
        "url": "https://www.canva.dev/docs/apps/mcp/access/"
      },
      {
        "label": "Canva Developers — Tools",
        "url": "https://www.canva.dev/docs/apps/mcp/tools/"
      }
    ],
    "servers": [
      {
        "name": "Canva AI Connector (Canva MCP)",
        "transport": "remote",
        "auth": [
          "oauth"
        ],
        "access": "read_write",
        "plan": "all",
        "planNote": "Tous les comptes, y compris Canva Free. Modèles de marque, kits de marque, remplissage automatique et redimensionnement : forfait payant. Dans une équipe, l'administrateur doit autoriser le connecteur.",
        "planNoteEn": "All accounts, including Canva Free. Brand Templates, brand kits, autofill and resizing: paid plan. On a team, the admin must allow the connector.",
        "clients": [
          "chatgpt",
          "claude",
          "gemini",
          "cursor",
          "lovable",
          "make",
          "perplexity",
          "grok"
        ],
        "docsUrl": "https://www.canva.com/help/mcp-agent-setup/",
        "mcpSlug": "canva-mcp"
      }
    ],
    "capabilities": [
      {
        "kind": "read",
        "fr": "Rechercher et consulter vos designs, pages, dossiers et commentaires",
        "en": "Search and view your designs, pages, folders and comments"
      },
      {
        "kind": "write",
        "fr": "Créer des designs à partir d'une description, modifier un design, importer des fichiers, ranger, commenter, exporter",
        "en": "Create designs from a description, edit a design, upload files, organise, comment, export"
      }
    ]
  } satisfies AgentAccess,
};
