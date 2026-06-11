import { useEffect, useState, useMemo, useRef } from "react";
import { Check, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import type { SessionState, DiscoveryQuestion, Tool } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev: () => void;
  discoveryQuestions: DiscoveryQuestion[];
  maxQuestions?: number;
  t: (fr: string, en: string) => string;
}

function hasRealFreeTier(tool: Tool) {
  const freeText = `${tool.pricing?.free || ""} ${tool.pricingEn?.free || ""}`.toLowerCase();
  if (!freeText.trim()) return false;
  return !/(no free|aucun|pas de|none|non disponible)/i.test(freeText);
}

function isAiTool(tool: Tool) {
  return tool.tool_type === "ia" || /(^|[^a-z])(ai|ia)([^a-z]|$)|chatgpt|claude|copilot|perplexity|gemini|mistral|deepseek/i.test(
    `${tool.category} ${tool.name} ${tool.ia_use_case || ""}`
  );
}

function toolList(tools: Tool[], max = 3) {
  const names = tools.slice(0, max).map((tool) => tool.name);
  if (tools.length > max) names.push(`+${tools.length - max}`);
  return names.join(", ");
}

function buildAdaptiveQuestions(
  session: SessionState,
  t: (fr: string, en: string) => string
): DiscoveryQuestion[] {
  const selectedTools = session.selectedTools;
  const questions: DiscoveryQuestion[] = [];
  const aiTools = selectedTools.filter(isAiTool);
  const uncertainPlanTools = selectedTools.filter((tool) => {
    const catalogPrice = Number(tool.catalogMonthlyPrice ?? tool.price ?? 0);
    return catalogPrice > 0 && (tool.selectedOffer === "unknown" || tool.selectedPriceIsEstimate === true);
  });
  const paidFreeTierTools = selectedTools.filter((tool) =>
    hasRealFreeTier(tool) && tool.selectedOffer !== "free"
  );
  const skippedCount = session.selectionCoverage?.skipped.length || 0;

  if (aiTools.length >= 2) {
    questions.push({
      id: "adaptive_ai_overlap",
      persona: "ALL",
      question: t(
        `Tu as plusieurs outils IA dans ta stack (${toolList(aiTools)}). Comment les utilises-tu vraiment ?`,
        `You have several AI tools in your stack (${toolList(aiTools)}). How do you really use them?`
      ),
      subtitle: t(
        "Cette réponse évite de recommander une coupure trop rapide si chaque outil a un rôle clair.",
        "This avoids recommending a cut too quickly if each tool has a clear role."
      ),
      options: [
        {
          label: t("Ils ont chacun un rôle clair", "Each has a clear role"),
          impact: "keep",
          affectedTools: aiTools.map((tool) => tool.id),
        },
        {
          label: t("Un seul est central, les autres dépannent", "One is central, the others are occasional"),
          impact: "review",
          affectedTools: aiTools.map((tool) => tool.id),
        },
        {
          label: t("Je paie plusieurs IA sans règle claire", "I pay for several AI tools without a clear rule"),
          impact: "review",
          affectedTools: aiTools.map((tool) => tool.id),
        },
        {
          label: t("Je pense pouvoir en couper au moins un", "I could probably cut at least one"),
          impact: "cancel",
          affectedTools: aiTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: aiTools.map((tool) => tool.id),
      condition_type: "all",
    });
  }

  if (uncertainPlanTools.length > 0) {
    questions.push({
      id: "adaptive_plan_reality",
      persona: "ALL",
      question: t(
        `Pour ${toolList(uncertainPlanTools)}, le prix catalogue peut être faux pour toi. Tu es plutôt sur quel cas ?`,
        `For ${toolList(uncertainPlanTools)}, catalog pricing may be wrong for you. Which case is closest?`
      ),
      subtitle: t(
        "Je m'en sers pour éviter de surestimer ou sous-estimer ton budget réel.",
        "I use this to avoid overestimating or underestimating your real budget."
      ),
      options: [
        {
          label: t("Plan gratuit ou inclus ailleurs", "Free plan or included elsewhere"),
          impact: "keep",
          affectedTools: uncertainPlanTools.map((tool) => tool.id),
        },
        {
          label: t("Plan individuel payant", "Paid individual plan"),
          impact: "keep",
          affectedTools: uncertainPlanTools.map((tool) => tool.id),
        },
        {
          label: t("Plan équipe ou facture plus élevée", "Team plan or higher invoice"),
          impact: "review",
          affectedTools: uncertainPlanTools.map((tool) => tool.id),
        },
        {
          label: t("Je ne sais pas encore", "I am not sure yet"),
          impact: "review",
          affectedTools: uncertainPlanTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: uncertainPlanTools.map((tool) => tool.id),
      condition_type: "any",
    });
  } else if (paidFreeTierTools.length > 0) {
    questions.push({
      id: "adaptive_free_tier_check",
      persona: "ALL",
      question: t(
        `${toolList(paidFreeTierTools)} semble avoir une version gratuite ou un palier inférieur. Tu as déjà vérifié ton plan ?`,
        `${toolList(paidFreeTierTools)} seems to have a free version or lower tier. Have you checked your plan?`
      ),
      subtitle: t(
        "C'est souvent là que se cachent les économies faciles, sans changer d'outil.",
        "This is often where easy savings hide, without changing tools."
      ),
      options: [
        {
          label: t("Oui, le plan payant est justifié", "Yes, the paid plan is justified"),
          impact: "keep",
          affectedTools: paidFreeTierTools.map((tool) => tool.id),
        },
        {
          label: t("Non, je dois vérifier", "No, I need to check"),
          impact: "review",
          affectedTools: paidFreeTierTools.map((tool) => tool.id),
        },
        {
          label: t("Je pourrais descendre de plan", "I could downgrade"),
          impact: "cancel",
          affectedTools: paidFreeTierTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: paidFreeTierTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  if (skippedCount >= 3) {
    questions.push({
      id: "adaptive_skipped_areas",
      persona: "ALL",
      question: t(
        "Tu as passé plusieurs zones sans outil. C'est bien volontaire ?",
        "You skipped several areas without tools. Was that intentional?"
      ),
      subtitle: t(
        "Je préfère vérifier maintenant plutôt que conclure à tort qu'il manque des briques.",
        "I prefer checking now instead of wrongly concluding that pieces are missing."
      ),
      options: [
        { label: t("Oui, je n'ai rien dans ces zones", "Yes, I have nothing in those areas"), impact: "keep" },
        { label: t("J'ai peut-être oublié un outil", "I may have forgotten a tool"), impact: "review" },
        { label: t("Ces zones ne concernent pas mon activité", "Those areas do not apply to my work"), impact: "keep" },
      ],
      condition_tool_ids: [],
      condition_type: "any",
    });
  }

  return questions;
}

export default function DiagStep6Discovery({ session, onUpdate, onNext, onPrev, discoveryQuestions, maxQuestions = 3, t }: Props) {
  const selectedToolIds = useMemo(
    () => new Set(session.selectedTools.map((t) => t.id)),
    [session.selectedTools]
  );
  const adaptiveQuestions = useMemo(
    () => buildAdaptiveQuestions(session, t),
    [session, t]
  );

  // Filter questions based on conditions
  const activeQuestions = useMemo(() => {
    const candidateQuestions = [...adaptiveQuestions, ...discoveryQuestions];
    const seen = new Set<string>();
    return candidateQuestions.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      // Persona filter
      if (q.persona !== "ALL" && q.persona !== session.persona) return false;
      // Tool condition
      if (q.condition_tool_ids.length === 0) return true;
      if (q.condition_type === "all") {
        return q.condition_tool_ids.every((id) => selectedToolIds.has(id));
      }
      return q.condition_tool_ids.some((id) => selectedToolIds.has(id));
    }).slice(0, maxQuestions);
  }, [adaptiveQuestions, discoveryQuestions, maxQuestions, session.persona, selectedToolIds]);

  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(() => new Map(session.discoveryAnswers));
  const [autoAdvanced, setAutoAdvanced] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const answeredCount = activeQuestions.filter((question) => answers.has(question.id)).length;
  const activeAdaptiveQuestions = activeQuestions.filter((question) => question.id.startsWith("adaptive_"));

  useEffect(() => {
    if (activeQuestions.length === 0) return;
    if (questionIdx >= activeQuestions.length) {
      setQuestionIdx(activeQuestions.length - 1);
    }
  }, [activeQuestions.length, questionIdx]);

  useEffect(() => {
    if (activeQuestions.length === 0 && !autoAdvanced) {
      setAutoAdvanced(true);
      onUpdate({ discoveryAnswers: answers, adaptiveDiscoveryQuestions: [] });
      onNext();
    }
  }, [activeQuestions.length, answers, autoAdvanced, onNext, onUpdate]);

  // Stable fallback state when there is no discovery question for this profile/tools set.
  if (activeQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          {t("Pas besoin de question en plus", "No extra question needed")}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {t(
            "Ta stack suffit déjà pour générer un premier verdict.",
            "Your stack is already enough to generate a first verdict."
          )}
        </p>
        <button
          onClick={() => {
            onUpdate({ discoveryAnswers: answers, adaptiveDiscoveryQuestions: activeAdaptiveQuestions });
            onNext();
          }}
          className="rounded-xl bg-primary px-6 py-3 text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t("Continuer", "Continue")}
        </button>
      </div>
    );
  }

  const current = activeQuestions[questionIdx];
  const currentAnswer = answers.get(current?.id);
  const reasonTools = session.selectedTools
    .filter((tool) => current?.condition_tool_ids.includes(tool.id))
    .slice(0, 3);

  useEffect(() => {
    headingRef.current?.focus();
  }, [current?.id]);

  const handleAnswer = (idx: number) => {
    const next = new Map(answers);
    next.set(current.id, idx);
    setAnswers(next);
    onUpdate({ discoveryAnswers: next, adaptiveDiscoveryQuestions: activeAdaptiveQuestions });
    if (questionIdx < activeQuestions.length - 1) {
      window.setTimeout(() => {
        setQuestionIdx((i) => i === questionIdx ? Math.min(i + 1, activeQuestions.length - 1) : i);
      }, 220);
    }
  };

  const handleNext = () => {
    onUpdate({ discoveryAnswers: answers, adaptiveDiscoveryQuestions: activeAdaptiveQuestions });
    if (questionIdx < activeQuestions.length - 1) {
      setQuestionIdx((i) => i + 1);
    } else {
      onNext();
    }
  };

  const handlePrev = () => {
    if (questionIdx > 0) {
      setQuestionIdx((i) => i - 1);
    } else {
      onPrev();
    }
  };

  return (
    <div className="mx-auto flex min-h-[54vh] max-w-2xl flex-col justify-center gap-7">
      <header className="space-y-4 text-center">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>{t("Vérification courte", "Short check")}</span>
          <span className="text-primary/40">·</span>
          <span>{questionIdx + 1}/{activeQuestions.length}</span>
        </div>
        <div className="mx-auto flex max-w-sm gap-1.5" aria-hidden="true">
          {activeQuestions.map((question, i) => (
            <div
              key={question.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < questionIdx || answers.has(question.id)
                  ? "bg-primary"
                  : i === questionIdx
                    ? "bg-primary/50"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>
        <div className="space-y-2">
          {questionIdx === 0 && (
            <p className="text-xs font-semibold uppercase text-primary">
              {t("Seulement les questions qui changent le verdict", "Only questions that change the verdict")}
            </p>
          )}
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mx-auto max-w-xl text-2xl font-bold leading-tight text-foreground outline-none md:text-3xl"
          >
            {current.question}
          </h2>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
            {current.subtitle || t(
              "Réponds au plus proche de ta réalité. Il n’y a pas de mauvaise réponse.",
              "Pick the closest answer. There is no wrong answer."
            )}
          </p>
          {reasonTools.length > 0 && (
            <p className="mx-auto max-w-lg rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm leading-relaxed text-primary">
              {t(
                `Je te pose ça parce que tu as sélectionné ${reasonTools.map((tool) => tool.name).join(", ")}.`,
                `I ask because you selected ${reasonTools.map((tool) => tool.name).join(", ")}.`
              )}
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {current.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            aria-pressed={currentAnswer === idx}
            className={`flex min-h-[58px] items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all
              ${currentAnswer === idx
                ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/15"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/30"
              }`}
          >
            <span className="flex-1">{opt.label}</span>
            {currentAnswer === idx && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                <Check className="h-3.5 w-3.5" />
                {t("Noté", "Saved")}
              </span>
            )}
          </button>
        ))}
      </div>

      {currentAnswer !== undefined && (
        <p className="rounded-lg bg-primary/5 px-3 py-2 text-center text-sm font-medium text-primary" role="status">
          {questionIdx < activeQuestions.length - 1
            ? t("Réponse prise en compte. On passe à la suivante.", "Answer saved. Moving to the next one.")
            : t("Réponse prise en compte. Ton premier verdict est prêt.", "Answer saved. Your first verdict is ready.")}
        </p>
      )}

      <footer className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={handlePrev}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("Retour", "Back")}
        </button>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            {answeredCount}/{activeQuestions.length} {t("réponse(s) utiles", "useful answer(s)")}
          </p>
        <button
          onClick={handleNext}
          disabled={currentAnswer === undefined}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {questionIdx < activeQuestions.length - 1
            ? t("Question suivante", "Next question")
            : t("Voir le premier verdict", "See first verdict")}
            <ChevronRight className="h-4 w-4" />
        </button>
        </div>
      </footer>
    </div>
  );
}
