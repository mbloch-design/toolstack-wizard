import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";

interface Props {
  tool: { name: string; slug?: string; id: string; [key: string]: any };
  prefix: string;
  lang: string;
  t: (fr: string, en: string) => string;
}

export default function ToolDiagCta({ tool, prefix, lang, t }: Props) {
  const slug = tool.slug || tool.id;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/30 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-3 shrink-0">
          <div className="rounded-xl bg-background p-2 shadow-sm ring-1 ring-border">
            <ToolLogo tool={tool} size={36} />
          </div>
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-base leading-snug">
            {t(
              `${tool.name} fait partie de ta stack ?`,
              `Is ${tool.name} part of your stack?`
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              `Découvre en 5 minutes si tu en paies trop, si tu l'utilises à son plein potentiel, et quels outils tu pourrais éliminer.`,
              `Find out in 5 minutes if you're overpaying, using it at full potential, and which tools you could cut.`
            )}
          </p>
        </div>

        <Link
          to={`${prefix}/selector?from=${slug}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/85 transition-colors shrink-0 whitespace-nowrap"
        >
          {t("Auditer ma stack", "Audit my stack")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {t("Gratuit · 5 minutes · Résultat personnalisé", "Free · 5 minutes · Personalised result")}
      </p>
    </div>
  );
}
