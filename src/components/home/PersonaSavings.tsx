import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight, AlertTriangle } from "lucide-react";

interface PersonaProfile {
  id: string;
  label: string;
  labelEn: string;
  stack: string[];
  signal: string;
  signalEn: string;
  loss: number;
}

const PROFILES: PersonaProfile[] = [
  {
    id: "freelance-ia",
    label: "Freelance IA",
    labelEn: "AI Freelancer",
    stack: ["ChatGPT Pro", "Claude Pro", "Perplexity"],
    signal: "Doublons IA — 3 abonnements similaires",
    signalEn: "AI duplicates — 3 similar subscriptions",
    loss: 960,
  },
  {
    id: "petite-agence",
    label: "Petite Agence",
    labelEn: "Small Agency",
    stack: ["Notion", "Airtable", "Coda", "Trello"],
    signal: "Outils de gestion de projet en quadruple",
    signalEn: "Project management tools duplicated 4x",
    loss: 1240,
  },
  {
    id: "pme",
    label: "PME",
    labelEn: "SMB",
    stack: ["HubSpot", "Mailchimp", "Brevo"],
    signal: "CRM surdimensionné et doublons emailing",
    signalEn: "Oversized CRM and email duplicates",
    loss: 3400,
  },
];

const PersonaSavings = () => {
  const { lang, t, prefix } = useLang();
  const [active, setActive] = useState(0);
  const profile = PROFILES[active];

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-center font-display font-medium" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          {t(
            "Vous payez probablement pour des outils en double.",
            "You're probably paying for duplicate tools."
          )}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted-foreground">
          {t(
            "Voici ce que ToolTrim détecte sur des stacks réelles.",
            "Here's what ToolTrim detects on real stacks."
          )}
        </p>

        {/* Tabs */}
        <div className="mt-8 flex justify-center gap-2">
          {PROFILES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActive(i)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                active === i
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              {lang === "en" ? p.labelEn : p.label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="mt-6 rounded-2xl border border-destructive/20 bg-card p-6 shadow-lg shadow-destructive/5 transition-all">
          {/* Loss badge */}
          <div className="mb-5 flex items-center gap-2">
            <span className="rounded-full bg-destructive/10 px-4 py-1.5 font-mono text-lg font-bold text-destructive">
              -{profile.loss}€/{t("an", "yr")}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("gaspillés", "wasted")}
            </span>
          </div>

          {/* Signal */}
          <div className="mb-5 flex items-start gap-2 rounded-lg bg-destructive/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              {lang === "en" ? profile.signalEn : profile.signal}
            </p>
          </div>

          {/* Strikethrough tool list */}
          <div className="space-y-2">
            {profile.stack.map((name) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-2.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                  {name[0]}
                </div>
                <span className="text-sm line-through text-muted-foreground">
                  {name}
                </span>
              </div>
            ))}
          </div>

          {/* Monthly breakdown */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t(
              `≈ ${Math.round(profile.loss / 12)}€/mois de perdus — sans s'en rendre compte.`,
              `≈ €${Math.round(profile.loss / 12)}/mo lost — without even noticing.`
            )}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/85 hover:shadow-xl hover:shadow-primary/30"
          >
            {t(
              "Scanner ma stack et trouver mes fuites financières",
              "Scan my stack and find my financial leaks"
            )}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PersonaSavings;
