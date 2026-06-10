import { useEffect, useState, useMemo } from "react";
import { Check, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import type { SessionState, DiscoveryQuestion } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev: () => void;
  discoveryQuestions: DiscoveryQuestion[];
  maxQuestions?: number;
  t: (fr: string, en: string) => string;
}

export default function DiagStep6Discovery({ session, onUpdate, onNext, onPrev, discoveryQuestions, maxQuestions = 3, t }: Props) {
  const selectedToolIds = useMemo(
    () => new Set(session.selectedTools.map((t) => t.id)),
    [session.selectedTools]
  );

  // Filter questions based on conditions
  const activeQuestions = useMemo(() => {
    return discoveryQuestions.filter((q) => {
      // Persona filter
      if (q.persona !== "ALL" && q.persona !== session.persona) return false;
      // Tool condition
      if (q.condition_tool_ids.length === 0) return true;
      if (q.condition_type === "all") {
        return q.condition_tool_ids.every((id) => selectedToolIds.has(id));
      }
      return q.condition_tool_ids.some((id) => selectedToolIds.has(id));
    }).slice(0, maxQuestions);
  }, [discoveryQuestions, maxQuestions, session.persona, selectedToolIds]);

  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(() => new Map(session.discoveryAnswers));
  const [autoAdvanced, setAutoAdvanced] = useState(false);
  const answeredCount = activeQuestions.filter((question) => answers.has(question.id)).length;

  useEffect(() => {
    if (activeQuestions.length === 0 && !autoAdvanced) {
      setAutoAdvanced(true);
      onUpdate({ discoveryAnswers: answers });
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
            onUpdate({ discoveryAnswers: answers });
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

  const handleAnswer = (idx: number) => {
    const next = new Map(answers);
    next.set(current.id, idx);
    setAnswers(next);
    onUpdate({ discoveryAnswers: next });
    if (questionIdx < activeQuestions.length - 1) {
      window.setTimeout(() => {
        setQuestionIdx((i) => i === questionIdx ? Math.min(i + 1, activeQuestions.length - 1) : i);
      }, 220);
    }
  };

  const handleNext = () => {
    onUpdate({ discoveryAnswers: answers });
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
          <h2 className="mx-auto max-w-xl text-2xl font-bold leading-tight text-foreground md:text-3xl">
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
