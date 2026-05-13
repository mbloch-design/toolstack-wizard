import { Users, User, Code2, Pen, BarChart2, Briefcase, ShoppingCart, Building2, Palette, Megaphone, BookOpen, Cpu, Globe } from "lucide-react";

interface Props {
  relevantFor: string[];
  soloRelevance?: string;
  teamRelevance?: string;
  toolName: string;
  t: (fr: string, en: string) => string;
}

// Map relevantFor slugs → readable label + icon
const AUDIENCE_MAP: Record<string, { labelFr: string; labelEn: string; Icon: React.ElementType }> = {
  // Dev
  "dev":              { labelFr: "Développeur",        labelEn: "Developer",         Icon: Code2      },
  "developer":        { labelFr: "Développeur",        labelEn: "Developer",         Icon: Code2      },
  "dev-frontend":     { labelFr: "Dev Frontend",       labelEn: "Frontend Dev",      Icon: Code2      },
  "dev-fullstack":    { labelFr: "Dev Fullstack",      labelEn: "Fullstack Dev",     Icon: Code2      },
  "dev-mobile":       { labelFr: "Dev Mobile",         labelEn: "Mobile Dev",        Icon: Code2      },
  "dev-wordpress":    { labelFr: "Dev WordPress",      labelEn: "WordPress Dev",     Icon: Code2      },
  "dev-freelance":    { labelFr: "Dev Freelance",      labelEn: "Freelance Dev",     Icon: Code2      },
  "cto-lead-tech":    { labelFr: "CTO / Lead Tech",    labelEn: "CTO / Lead Tech",   Icon: Code2      },
  "tech":             { labelFr: "Profil tech",        labelEn: "Tech profile",      Icon: Code2      },
  "ai-builder":       { labelFr: "Builder IA",         labelEn: "AI builder",        Icon: Cpu        },
  "it":               { labelFr: "IT",                 labelEn: "IT",                Icon: Cpu        },
  // Design
  "designer":         { labelFr: "Designer",           labelEn: "Designer",          Icon: Palette    },
  // Consulting / Business
  "consultant":       { labelFr: "Consultant",         labelEn: "Consultant",        Icon: Briefcase  },
  "consultant-b2b":   { labelFr: "Consultant B2B",     labelEn: "B2B Consultant",    Icon: Briefcase  },
  "business":         { labelFr: "Business",           labelEn: "Business",          Icon: Briefcase  },
  "business-developer":{ labelFr: "Business Dev",      labelEn: "Business Dev",      Icon: Briefcase  },
  "ops":              { labelFr: "Ops / COO",          labelEn: "Ops / COO",         Icon: Briefcase  },
  "manager-dsi":      { labelFr: "Manager / DSI",      labelEn: "Manager / CIO",     Icon: Building2  },
  "enterprise":       { labelFr: "Grande entreprise",  labelEn: "Enterprise",        Icon: Building2  },
  "scaleup":          { labelFr: "Scale-up",           labelEn: "Scale-up",          Icon: Building2  },
  "startup":          { labelFr: "Startup",            labelEn: "Startup",           Icon: Building2  },
  "pme":              { labelFr: "PME",                labelEn: "SMB",               Icon: Building2  },
  "fondateur-saas":   { labelFr: "Fondateur SaaS",     labelEn: "SaaS Founder",      Icon: Building2  },
  "agence":           { labelFr: "Agence",             labelEn: "Agency",            Icon: Building2  },
  "agency":           { labelFr: "Agence",             labelEn: "Agency",            Icon: Building2  },
  "indie":            { labelFr: "Indie hacker",       labelEn: "Indie hacker",      Icon: User       },
  // Content / Writing
  "writer":           { labelFr: "Rédacteur",          labelEn: "Writer",            Icon: Pen        },
  "creator":          { labelFr: "Créateur",           labelEn: "Creator",           Icon: Pen        },
  "content-creator":  { labelFr: "Créateur de contenu",labelEn: "Content creator",   Icon: Pen        },
  "createur-contenu": { labelFr: "Créateur de contenu",labelEn: "Content creator",   Icon: Pen        },
  "newslettiste-auteur":{ labelFr: "Newslettiste",     labelEn: "Newsletter author", Icon: Pen        },
  "community-manager":{ labelFr: "Community Manager",  labelEn: "Community Manager", Icon: Megaphone  },
  "marketer":         { labelFr: "Marketeur",          labelEn: "Marketer",          Icon: Megaphone  },
  "marketing":        { labelFr: "Marketing",          labelEn: "Marketing",         Icon: Megaphone  },
  // Finance / Legal
  "finance":          { labelFr: "Finance",            labelEn: "Finance",           Icon: BarChart2  },
  "daf-finance":      { labelFr: "DAF / Finance",      labelEn: "CFO / Finance",     Icon: BarChart2  },
  "legal":            { labelFr: "Juridique",          labelEn: "Legal",             Icon: BookOpen   },
  "procurement":      { labelFr: "Achats",             labelEn: "Procurement",       Icon: BarChart2  },
  // Other
  "hr":               { labelFr: "RH",                 labelEn: "HR",                Icon: Users      },
  "product-manager":  { labelFr: "Product Manager",    labelEn: "Product Manager",   Icon: Briefcase  },
  "data-analyst":     { labelFr: "Data Analyst",       labelEn: "Data Analyst",      Icon: BarChart2  },
  "ecommercant":      { labelFr: "E-commerçant",       labelEn: "E-commerce",        Icon: ShoppingCart },
  "ecommerce":        { labelFr: "E-commerce",         labelEn: "E-commerce",        Icon: ShoppingCart },
  "business-local":   { labelFr: "Commerce local",     labelEn: "Local business",    Icon: Globe      },
  "security":         { labelFr: "Sécurité",           labelEn: "Security",          Icon: Cpu        },
  "coach-formateur":  { labelFr: "Coach / Formateur",  labelEn: "Coach / Trainer",   Icon: BookOpen   },
  "educator":         { labelFr: "Formateur",          labelEn: "Educator",          Icon: BookOpen   },
  "architecte-bim":   { labelFr: "Architecte BIM",     labelEn: "BIM Architect",     Icon: Building2  },
  "solo":             { labelFr: "Solo / Freelance",   labelEn: "Solo / Freelance",  Icon: User       },
  "freelance":        { labelFr: "Freelance",          labelEn: "Freelance",         Icon: User       },
  "team":             { labelFr: "Équipe",             labelEn: "Team",              Icon: Users      },
};

const SKIP = new Set(["other", "all"]);
const MAX = 6;

export default function ToolAudienceBlock({ relevantFor, soloRelevance, teamRelevance, toolName, t }: Props) {
  const mapped = (relevantFor || [])
    .filter(r => !SKIP.has(r) && AUDIENCE_MAP[r])
    .slice(0, MAX)
    .map(r => AUDIENCE_MAP[r]);

  // Derive solo/team signal from clean values only
  const isSoloHigh  = soloRelevance === "high";
  const isTeamHigh  = teamRelevance === "high";
  const isSoloMed   = soloRelevance === "medium";
  const isTeamMed   = teamRelevance === "medium";

  if (mapped.length === 0 && !isSoloHigh && !isTeamHigh) return null;

  return (
    <div className="py-8">
      <p
        className="text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: "hsl(var(--primary))" }}
      >
        {t("Pour qui ?", "Who is it for?")}
      </p>
      <h2
        className="font-display mb-5 text-foreground"
        style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.025em" }}
      >
        {t(`À qui s'adresse ${toolName} ?`, `Who should use ${toolName}?`)}
      </h2>

      {/* Audience chips */}
      {mapped.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {mapped.map(({ labelFr, labelEn, Icon }, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/85"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
              {t(labelFr, labelEn)}
            </span>
          ))}
        </div>
      )}

      {/* Solo / Team signal — only when clean values exist */}
      {(isSoloHigh || isTeamHigh || isSoloMed || isTeamMed) && (
        <div className="flex gap-3">
          <div
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm flex-1"
            style={{
              borderColor: isSoloHigh ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))",
              background: isSoloHigh ? "hsl(var(--primary) / 0.05)" : "hsl(var(--muted) / 0.3)",
            }}
          >
            <User className="h-4 w-4 shrink-0" style={{ color: isSoloHigh ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
            <div>
              <p className="font-semibold text-foreground text-xs">{t("Solo / Freelance", "Solo / Freelance")}</p>
              <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                {isSoloHigh ? t("Très recommandé", "Highly recommended") : t("Peut convenir", "Can work")}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm flex-1"
            style={{
              borderColor: isTeamHigh ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))",
              background: isTeamHigh ? "hsl(var(--primary) / 0.05)" : "hsl(var(--muted) / 0.3)",
            }}
          >
            <Users className="h-4 w-4 shrink-0" style={{ color: isTeamHigh ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
            <div>
              <p className="font-semibold text-foreground text-xs">{t("Équipe", "Team")}</p>
              <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                {isTeamHigh ? t("Très recommandé", "Highly recommended") : t("Peut convenir", "Can work")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
