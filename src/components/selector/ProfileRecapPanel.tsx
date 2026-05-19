import { useState } from "react";
import { ChevronUp, ChevronDown, Pencil, RotateCcw } from "lucide-react";
import {
  SelectorFormData, TJM_OPTIONS, PHASE_OPTIONS, MATURITY_OPTIONS,
  VERTICAL_FAMILIES, TIME_WEIGHT_OPTIONS,
} from "@/data/types";
import { Tool } from "@/data/types";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/use-mobile";

const GOAL_LABELS: Record<string, { fr: string; en: string }> = {
  "reduce-costs": { fr: "Réduire mes coûts", en: "Reduce costs" },
  "save-time": { fr: "Gagner du temps", en: "Save time" },
  "simplify": { fr: "Simplifier la stack", en: "Simplify stack" },
  "find-better": { fr: "Trouver mieux", en: "Find better tools" },
};

interface ProfileRecapPanelProps {
  form: SelectorFormData;
  tools: Tool[];
  currentStep: number;
  onGoToStep: (step: number) => void;
  onReset: () => void;
}

function RecapRow({ label, value, step, completed, onGoToStep }: {
  label: string; value: string; step: number; completed: boolean; onGoToStep: (step: number) => void;
}) {
  return (
    <button onClick={() => onGoToStep(step)} className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${!completed ? "opacity-40" : ""}`}>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{completed ? value : "—"}</p>
      </div>
      <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

const ProfileRecapPanel = ({ form, tools, currentStep, onGoToStep, onReset }: ProfileRecapPanelProps) => {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const family = VERTICAL_FAMILIES.find((f) => f.value === form.family);
  const tjm = TJM_OPTIONS.find((o) => o.value === form.tjm);
  const phase = PHASE_OPTIONS.find((o) => o.value === form.projectPhase);
  const maturity = MATURITY_OPTIONS.find((o) => o.value === form.techMaturity);
  const goal = form.mainGoal ? GOAL_LABELS[form.mainGoal] : null;

  const selectedTools = form.currentTools.map((ct) => tools.find((t) => t.id === ct.toolId)).filter(Boolean) as Tool[];
  const totalCost = form.currentTools.reduce((sum, ct) => {
    const tool = tools.find((t) => t.id === ct.toolId);
    return sum + (ct.monthlyCost || tool?.defaultMonthlyPrice || 0);
  }, 0);

  const summaryLine = [
    family ? (lang === "en" ? family.labelEn : family.label) : null,
    form.verticals.length > 0 ? `${form.verticals.length} ${t("activités", "activities")}` : null,
    form.currentTools.length > 0 ? `${form.currentTools.length} ${t("outils", "tools")}` : null,
  ].filter(Boolean).join(" · ");

  const handleReset = () => {
    if (window.confirm(t("Remettre le formulaire à zéro ?", "Reset the form?"))) onReset();
  };

  const content = (
    <div className="flex flex-col gap-1">
      <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("Votre profil", "Your profile")}
      </p>

      <RecapRow
        label={t("Famille", "Family")}
        value={family ? `${family.emoji} ${lang === "en" ? family.labelEn : family.label}` : ""}
        step={1} completed={!!form.family} onGoToStep={onGoToStep}
      />

      <RecapRow
        label={t("Activités", "Activities")}
        value={form.verticals.length > 0 ? form.verticals.map((v) => v.id.replace(/-/g, " ")).join(", ") : ""}
        step={2} completed={form.verticals.length > 0} onGoToStep={onGoToStep}
      />

      <RecapRow
        label={t("TJM", "Daily rate")}
        value={tjm ? (lang === "en" ? tjm.labelEn : tjm.label) : ""}
        step={4} completed={!!form.tjm} onGoToStep={onGoToStep}
      />

      <RecapRow
        label={t("Phase", "Phase")}
        value={phase ? (lang === "en" ? phase.labelEn : phase.label) : ""}
        step={5} completed={!!form.projectPhase} onGoToStep={onGoToStep}
      />

      <RecapRow
        label={t("Maturité", "Maturity")}
        value={maturity ? (lang === "en" ? maturity.labelEn : maturity.label) : ""}
        step={6} completed={!!form.techMaturity} onGoToStep={onGoToStep}
      />

      <RecapRow
        label={t("Objectif", "Goal")}
        value={goal ? (lang === "en" ? goal.en : goal.fr) : ""}
        step={7} completed={!!form.mainGoal} onGoToStep={onGoToStep}
      />

      {/* Tools summary */}
      <button onClick={() => onGoToStep(8)} className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t("Outils", "Tools")}</p>
          {selectedTools.length > 0 ? (
            <div className="mt-1">
              <div className="flex items-center gap-1">
                {selectedTools.slice(0, 6).map((tool) => (
                  <ToolLogo key={tool.id} tool={tool} size={20} />
                ))}
                {selectedTools.length > 6 && <span className="text-xs text-muted-foreground">+{selectedTools.length - 6}</span>}
              </div>
              <p className="mt-0.5 text-xs font-medium">{selectedTools.length} {t("outils", "tools")} · {totalCost}€/{t("mois", "mo")}</p>
            </div>
          ) : <p className="font-medium">—</p>}
        </div>
        <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <button onClick={handleReset} className="mt-2 flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <RotateCcw className="h-3 w-3" /> {t("Recommencer", "Start over")}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="flex w-full items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground truncate">{summaryLine || t("Votre profil", "Your profile")}</span>
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            {t("Voir mon profil", "View profile")}
            {mobileOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </span>
        </button>
        {mobileOpen && (
          <div className="max-h-[60vh] overflow-y-auto border-t border-border px-2 pb-4">{content}</div>
        )}
      </div>
    );
  }

  return (
    <div className="w-[280px] shrink-0 rounded-xl border border-border bg-secondary/30 p-2 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      {content}
    </div>
  );
};

export default ProfileRecapPanel;
