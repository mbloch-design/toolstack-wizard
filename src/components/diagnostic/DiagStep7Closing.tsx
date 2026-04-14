import { useState } from "react";
import type { SessionState } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev: () => void;
  t: (fr: string, en: string) => string;
}

interface ClosingQuestion {
  question: string;
  questionEn: string;
  options: { label: string; labelEn: string }[];
  allowCustom?: boolean;
}

const QUESTIONS: ClosingQuestion[] = [
  {
    question: "La dernière fois que tu as regardé tes prélèvements, il y avait un nom que tu n'as pas reconnu tout de suite ?",
    questionEn: "Last time you checked your bank statements, was there a charge you didn't recognize right away?",
    options: [
      { label: "Oui absolument", labelEn: "Yes absolutely" },
      { label: "Peut-être", labelEn: "Maybe" },
      { label: "Non, je suis à jour", labelEn: "No, I'm on top of it" },
      { label: "Je ne regarde jamais", labelEn: "I never check" },
    ],
  },
  {
    question: "Tu as payé un abonnement annuel cette année que tu n'utilises plus ?",
    questionEn: "Did you pay for a yearly subscription this year that you no longer use?",
    options: [
      { label: "Oui", labelEn: "Yes" },
      { label: "Probablement", labelEn: "Probably" },
      { label: "Non", labelEn: "No" },
      { label: "Je ne sais pas", labelEn: "I don't know" },
    ],
  },
  {
    question: "Tu as un gestionnaire de mots de passe — et si oui, tu paies pour lequel ?",
    questionEn: "Do you use a password manager — and if so, which one?",
    options: [
      { label: "1Password", labelEn: "1Password" },
      { label: "Dashlane", labelEn: "Dashlane" },
      { label: "Bitwarden", labelEn: "Bitwarden" },
      { label: "LastPass", labelEn: "LastPass" },
      { label: "Gratuit ou je n'en ai pas", labelEn: "Free or I don't have one" },
    ],
    allowCustom: true,
  },
];

export default function DiagStep7Closing({ session, onUpdate, onNext, onPrev, t }: Props) {
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<[string, string, string]>(() => {
    const a = session.closingAnswers;
    return [a[0] || "", a[1] || "", a[2] || ""];
  });
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const current = QUESTIONS[qIdx];
  const currentAnswer = answers[qIdx];

  const selectAnswer = (label: string) => {
    const next = [...answers] as [string, string, string];
    next[qIdx] = label;
    setAnswers(next);
    setShowCustom(false);
    setCustomInput("");
  };

  const submitCustom = () => {
    const val = customInput.trim();
    if (val.length < 1 || val.length > 100) return;
    selectAnswer(val);
  };

  const handleNext = () => {
    onUpdate({ closingAnswers: answers });
    if (qIdx < QUESTIONS.length - 1) {
      setQIdx((i) => i + 1);
    } else {
      onNext();
    }
  };

  const handlePrev = () => {
    if (qIdx > 0) {
      setQIdx((i) => i - 1);
    } else {
      onPrev();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center">
      {/* Progress */}
      <div className="text-sm text-muted-foreground">
        {t("Question", "Question")} {qIdx + 1}/{QUESTIONS.length}
      </div>
      <div className="flex gap-1 w-full max-w-md">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= qIdx ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <h2 className="text-lg md:text-xl font-bold text-foreground max-w-lg leading-snug">
        {t(current.question, current.questionEn)}
      </h2>

      {/* Options */}
      <div className="grid grid-cols-1 gap-2 w-full max-w-md">
        {current.options.map((opt) => {
          const label = t(opt.label, opt.labelEn);
          return (
            <button
              key={label}
              onClick={() => selectAnswer(label)}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all text-left
                ${currentAnswer === label
                  ? "border-primary bg-accent text-accent-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
            >
              {label}
            </button>
          );
        })}

        {current.allowCustom && !showCustom && (
          <button
            onClick={() => setShowCustom(true)}
            className="text-sm text-primary hover:underline font-medium mt-1"
          >
            {t("Autre (préciser)", "Other (specify)")}
          </button>
        )}

        {showCustom && (
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCustom()}
              placeholder={t("Ton gestionnaire…", "Your manager…")}
              maxLength={100}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <button
              onClick={submitCustom}
              disabled={customInput.trim().length < 1}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm font-medium
                         disabled:opacity-40"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 pt-2">
        <button
          onClick={handlePrev}
          className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground
                     hover:bg-muted transition-colors"
        >
          ← {t("Précédent", "Previous")}
        </button>
        <button
          onClick={handleNext}
          disabled={!currentAnswer}
          className="rounded-xl bg-primary px-6 py-3 text-primary-foreground text-sm font-semibold
                     disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {qIdx < QUESTIONS.length - 1
            ? t("Suivant →", "Next →")
            : t("Voir mes résultats →", "See my results →")}
        </button>
      </div>
    </div>
  );
}
