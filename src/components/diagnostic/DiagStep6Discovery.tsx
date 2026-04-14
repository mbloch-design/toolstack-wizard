import { useState, useMemo } from "react";
import type { SessionState, DiscoveryQuestion } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev: () => void;
  discoveryQuestions: DiscoveryQuestion[];
  t: (fr: string, en: string) => string;
}

export default function DiagStep6Discovery({ session, onUpdate, onNext, onPrev, discoveryQuestions, t }: Props) {
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
    });
  }, [discoveryQuestions, session.persona, selectedToolIds]);

  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(() => new Map(session.discoveryAnswers));

  // Skip if no questions
  if (activeQuestions.length === 0) {
    // Auto-advance
    onNext();
    return null;
  }

  const current = activeQuestions[questionIdx];
  const currentAnswer = answers.get(current?.id);

  const handleAnswer = (idx: number) => {
    const next = new Map(answers);
    next.set(current.id, idx);
    setAnswers(next);
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
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center">
      {/* Progress */}
      <div className="text-sm text-muted-foreground">
        {t("Question", "Question")} {questionIdx + 1}/{activeQuestions.length}
      </div>
      <div className="flex gap-1 w-full max-w-md">
        {activeQuestions.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= questionIdx ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="space-y-2 max-w-lg">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{current.question}</h2>
        {current.subtitle && (
          <p className="text-sm text-muted-foreground">{current.subtitle}</p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3 w-full max-w-md">
        {current.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all text-left
              ${currentAnswer === idx
                ? "border-primary bg-accent text-accent-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={handlePrev}
          className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground
                     hover:bg-muted transition-colors"
        >
          ← {t("Précédent", "Previous")}
        </button>
        <button
          onClick={handleNext}
          disabled={currentAnswer === undefined}
          className="rounded-xl bg-primary px-6 py-3 text-primary-foreground text-sm font-semibold
                     disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {questionIdx < activeQuestions.length - 1
            ? t("Suivant →", "Next →")
            : t("Terminer →", "Finish →")}
        </button>
      </div>
    </div>
  );
}
