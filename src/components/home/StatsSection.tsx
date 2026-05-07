import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=86",
    },
    {
      title: t("Voir les doublons avant qu’ils s’installent", "Spot duplicates before they settle in"),
      text: t(
        "Notion, Trello, ClickUp, Airtable : chacun a sa logique. Ensemble, ils peuvent ralentir.",
        "Notion, Trello, ClickUp, Airtable: each has a logic. Together, they can slow you down."
      ),
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=86",
    },
    {
      title: t("Descendre d’un plan sans perdre l’usage", "Downgrade without losing the real use"),
      text: t(
        "Le meilleur gain n’est pas toujours de supprimer. Parfois, c’est juste payer le bon niveau.",
        "The best saving is not always cancellation. Sometimes it is simply paying for the right tier."
      ),
      image: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=900&q=86",
    },
    {
      title: t("Remettre la stack au niveau de ton activité", "Bring the stack back to your current business"),
      text: t(
        "Une stack saine suit ton métier d’aujourd’hui, pas l’organisation que tu imaginais il y a six mois.",
        "A healthy stack follows today’s business, not the organization you imagined six months ago."
      ),
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=86",
    },
  ];

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_auto] lg:items-end">
          <div>
            <p className="label-section mb-3">{t("Ce que ToolTrim cherche", "What ToolTrim looks for")}</p>
            <h2
              className="max-w-3xl text-foreground"
              style={{ fontSize: "clamp(1.875rem, 3vw, 2.5rem)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}
            >
              {t("Des économies utiles, pas des coupes au hasard.", "Useful savings, not random cuts.")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {t(
                "Le diagnostic ne te dit pas seulement quoi supprimer. Il distingue ce qu’il faut garder, réduire, remplacer ou simplement surveiller.",
                "The diagnostic does not just tell you what to delete. It separates what to keep, downgrade, replace or simply watch."
              )}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-full border border-border px-3 py-1.5">{toolCount}+ {t("outils", "tools")}</span>
              <span className="rounded-full border border-border px-3 py-1.5">{categoryCount} {t("catégories", "categories")}</span>
              <span className="rounded-full border border-border px-3 py-1.5">{t("0 recommandation vendue", "0 paid recommendation")}</span>
            </div>
          </div>
          <Link
            to={`${prefix}/selector`}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/88 lg:mb-1"
          >
            {t("Identifier mes fuites", "Find my leaks")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stackLeaks.map((item) => (
            <article
              key={item.title}
              className="group flex min-h-[21rem] flex-col rounded-lg bg-secondary/70 p-3 transition-colors hover:bg-secondary"
            >
              <div className="relative overflow-hidden rounded-md bg-background">
                <img
                  src={item.image}
                  alt={item.title}
                  className="aspect-[1.18/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                  loading="lazy"
                />
              </div>

              <div className="px-1 pb-1 pt-4">
                <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};

export default StatsSection;
