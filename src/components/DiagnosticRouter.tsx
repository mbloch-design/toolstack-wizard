import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { useDiagnosticData } from "@/hooks/useDiagnosticData";
import type { SessionState, Persona } from "@/types/diagnostic";

const STEP_LABELS = [
  "Bienvenue",
  "Persona",
  "Spécialités",
  "Sélection outils",
  "Discovery",
  "Closing",
  "Email",
  "Résultats",
] as const;

function createInitialSession(language: "fr" | "en"): SessionState {
  return {
    firstName: "",
    tjm: 0,
    language,
    persona: "THEO" as Persona,
    complementarySkills: [],
    selectedTools: [],
    discoveryAnswers: new Map(),
    closingAnswers: ["", "", ""],
  };
}

export default function DiagnosticRouter() {
  const { lang } = useLang();
  const { tools, clusters, doublonRules, discoveryQuestions, loading, error } = useDiagnosticData();
  const [step, setStep] = useState(0);
  const [session, setSession] = useState<SessionState>(() =>
    createInitialSession(lang === "en" ? "en" : "fr")
  );

  const next = () => setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Progress indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEP_LABELS.map((label, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step placeholder */}
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Étape {step + 1} / {STEP_LABELS.length}
        </p>
        <h2 className="text-2xl font-bold">{STEP_LABELS[step]}</h2>
        <p className="text-muted-foreground">
          {tools.length} outils chargés · {clusters.length} clusters · {doublonRules.length} règles doublons · {discoveryQuestions.length} questions
        </p>

        <div className="flex justify-center gap-4 pt-6">
          <button
            onClick={prev}
            disabled={step === 0}
            className="px-4 py-2 rounded border border-border text-sm disabled:opacity-30"
          >
            ← Précédent
          </button>
          <button
            onClick={next}
            disabled={step === STEP_LABELS.length - 1}
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm disabled:opacity-30"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>
  );
}
