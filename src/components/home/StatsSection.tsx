import { Link } from "react-router-dom";
import { ArrowRight, Scissors, Copy, ChevronsDown, RefreshCw } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const StatsSection = ({ toolCount, categoryCount }: { toolCount: number; categoryCount: number }) => {
  const { t, prefix } = useLang();

  const stackLeaks = [
    {
      title: t("Couper les abonnements de mission", "Cut mission-only subscriptions"),
      text: t(
        "Un outil utile sur un projet peut devenir une charge invisible trois mois plus tard.",
        "A tool that was useful on one project can become an invisible cost three months later."
      ),
      Icon: Scissors,
      gradientFrom: "from-amber-50 dark:from-amber-950/25",
      gradientTo: "to-orange-50 dark:to-orange-950/20",
      decorA: "bg-amber-200/40 dark:bg-amber-700/20",
      decorB: "bg-orange-200/25 dark:bg-orange-700/10",
      iconRing: "bg-amber-100 ring-amber-200/80 dark:bg-amber-900/40 dark:ring-amber-700/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      visual: "cut",
    },
    {
      title: t("Voir les doublons avant qu'ils s'installent", "Spot duplicates before they settle in"),
      text: t(
        "Notion, Trello, ClickUp, Airtable : chacun a sa logique. Ensemble, ils peuvent ralentir.",
        "Notion, Trello, ClickUp, Airtable: each has a logic. Together, they can slow you down."
      ),
      Icon: Copy,
      gradientFrom: "from-violet-50 dark:from-violet-950/25",
      gradientTo: "to-purple-50 dark:to-purple-950/20",
      decorA: "bg-violet-200/40 dark:bg-violet-700/20",
      decorB: "bg-purple-200/25 dark:bg-purple-700/10",
      iconRing: "bg-violet-100 ring-violet-200/80 dark:bg-violet-900/40 dark:ring-violet-700/50",
      iconColor: "text-violet-600 dark:text-violet-400",
      visual: "duplicate",
    },
    {
      title: t("Descendre d'un plan sans perdre l'usage", "Downgrade without losing the real use"),
      text: t(
        "Le meilleur gain n'est pas toujours de supprimer. Parfois, c'est juste payer le bon niveau.",
        "The best saving is not always cancellation. Sometimes it is simply paying for the right tier."
      ),
      Icon: ChevronsDown,
      gradientFrom: "from-emerald-50 dark:from-emerald-950/25",
      gradientTo: "to-teal-50 dark:to-teal-950/20",
      decorA: "bg-emerald-200/40 dark:bg-emerald-700/20",
      decorB: "bg-teal-200/25 dark:bg-teal-700/10",
      iconRing: "bg-emerald-100 ring-emerald-200/80 dark:bg-emerald-900/40 dark:ring-emerald-700/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      visual: "downgrade",
    },
    {
      title: t("Remettre la stack au niveau de ton activité", "Bring the stack back to your current business"),
      text: t(
        "Une stack saine suit ton métier d'aujourd'hui, pas l'organisation que tu imaginais il y a six mois.",
        "A healthy stack follows today's business, not the organization you imagined six months ago."
      ),
      Icon: RefreshCw,
      gradientFrom: "from-sky-50 dark:from-sky-950/25",
      gradientTo: "to-blue-50 dark:to-blue-950/20",
      decorA: "bg-sky-200/40 dark:bg-sky-700/20",
      decorB: "bg-blue-200/25 dark:bg-blue-700/10",
      iconRing: "bg-sky-100 ring-sky-200/80 dark:bg-sky-900/40 dark:ring-sky-700/50",
      iconColor: "text-sky-600 dark:text-sky-400",
      visual: "realign",
    },
  ];

  return (
    <section className="home-actions-section">
      <div className="layout-shell">
        <div className="home-actions-header">
          <div>
            <span className="home-actions-eyebrow">{t("Trois façons de décider", "Three ways to decide")}</span>
            <h2 className="home-actions-title">
              {t("Commence par la bonne question.", "Start with the right question.")}
            </h2>
            <p className="home-actions-desc">
              {t(
                "Audite ta stack, pars d'un profil type ou compare deux outils selon ton usage réel.",
                "Audit your stack, start from a profile template, or compare two tools based on real usage."
              )}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-full border border-border px-3 py-1.5">{toolCount}+ {t("outils", "tools")}</span>
              <span className="rounded-full border border-border px-3 py-1.5">{categoryCount} {t("catégories", "categories")}</span>
              <span className="rounded-full border border-border px-3 py-1.5">{t("100% indépendant", "100% independent")}</span>
            </div>
          </div>
        </div>

        <div className="home-actions-grid">
          {stackLeaks.map((item) => (
            <article
              key={item.title}
              className="group flex min-h-[21rem] flex-col rounded-lg bg-secondary/70 p-3 transition-colors hover:bg-secondary"
            >
              {/* Illustration block — replaces stock photo */}
              <div className={`relative flex aspect-[1.18/1] w-full items-center justify-center overflow-hidden rounded-md bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo}`}>
                {/* Decorative background circles */}
                <div className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full ${item.decorA}`} />
                <div className={`pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full ${item.decorB}`} />

                {/* Central content */}
                <div className="relative flex flex-col items-center gap-4 px-6">
                  {/* Icon badge */}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 shadow-sm ${item.iconRing}`}>
                    <item.Icon className={`h-6 w-6 ${item.iconColor}`} />
                  </div>

                  {/* Visual annotation — specific per card */}
                  <VisualAnnotation type={item.visual} t={t} />
                </div>
              </div>

              <div className="px-1 pb-1 pt-4">
                <h3 className="ts-h3">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </div>
            </article>
          ))}
        </div>

        <Link
          to={`${prefix}/selector`}
          className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/88 lg:mb-1"
        >
          {t("Identifier mes fuites", "Find my leaks")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur-sm dark:bg-white/8 dark:shadow-none dark:ring-1 dark:ring-white/10 ${className}`}>
      {children}
    </div>
  );
}

function VisualAnnotation({ type, t }: { type: string; t: (fr: string, en: string) => string }) {
  if (type === "cut") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <Pill>
          <span className="h-1.5 w-1.5 rounded-full bg-destructive/90 shrink-0" />
          <span className="text-foreground/70 font-medium">Zapier Pro</span>
          <span className="font-bold text-destructive">−49€</span>
        </Pill>
        <Pill>
          <span className="h-1.5 w-1.5 rounded-full bg-destructive/90 shrink-0" />
          <span className="text-foreground/70 font-medium">Linear Team</span>
          <span className="font-bold text-destructive">−19€</span>
        </Pill>
        <Pill>
          <span className="h-1.5 w-1.5 rounded-full bg-destructive/90 shrink-0" />
          <span className="text-foreground/70 font-medium">Calendly Pro</span>
          <span className="font-bold text-destructive">−12€</span>
        </Pill>
      </div>
    );
  }

  if (type === "duplicate") {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center">
          <Pill className="z-10 relative">
            <span className="font-medium text-foreground/80">Notion</span>
          </Pill>
          <Pill className="-ml-2 ring-1 ring-violet-300/80 dark:ring-violet-600/40">
            <span className="font-medium text-foreground/80">Coda</span>
          </Pill>
        </div>
        <div className="rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-destructive">
          {t("Doublon détecté", "Duplicate detected")}
        </div>
      </div>
    );
  }

  if (type === "downgrade") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <Pill className="opacity-50 line-through decoration-foreground/40">
          <span className="text-foreground/60">HubSpot Pro · 450€/m</span>
        </Pill>
        <svg width="12" height="14" viewBox="0 0 12 14" className="text-emerald-500" fill="none">
          <path d="M6 0v11M1 7l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Pill className="ring-1 ring-emerald-300/80 dark:ring-emerald-600/40">
          <span className="text-foreground/70 font-medium">HubSpot Starter</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">50€/m</span>
        </Pill>
        <div className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          −400€/m
        </div>
      </div>
    );
  }

  if (type === "realign") {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-col gap-1">
          {[
            { label: "Notion", status: "keep" },
            { label: "GitHub", status: "keep" },
            { label: "Monday", status: "remove" },
          ].map((row) => (
            <Pill key={row.label} className={row.status === "remove" ? "opacity-40" : ""}>
              {row.status === "keep" ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-sky-500 shrink-0">
                  <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-destructive shrink-0">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              <span className={`font-medium ${row.status === "remove" ? "text-foreground/40 line-through" : "text-foreground/80"}`}>
                {row.label}
              </span>
            </Pill>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default StatsSection;
