import { useState, useCallback } from "react";
import { useLang } from "@/hooks/useLang";
import { useDiagnosticData } from "@/hooks/useDiagnosticData";
import type { SessionState, Persona } from "@/types/diagnostic";

import DiagStep0Prenom from "@/components/diagnostic/DiagStep0Prenom";
import DiagStep1Tjm from "@/components/diagnostic/DiagStep1Tjm";
import DiagStep2Persona from "@/components/diagnostic/DiagStep2Persona";
import DiagStep2bEmail from "@/components/diagnostic/DiagStep2bEmail";
import DiagStep2cComplementary from "@/components/diagnostic/DiagStep2cComplementary";
import DiagStep3SofiaSpecialties from "@/components/diagnostic/DiagStep3SofiaSpecialties";
import DiagStep4Clusters from "@/components/diagnostic/DiagStep4Clusters";

// Steps: 0=Prenom, 1=TJM, 2=Persona, 3=Email, 4=Complementary, 5=SofiaSpecialties(conditional), 6=Clusters, 7+=future
type StepId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const TOTAL_VISIBLE_STEPS = 7; // for progress bar

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
  const { lang, t } = useLang();
  const { tools, clusters, doublonRules, discoveryQuestions, loading, error } = useDiagnosticData();
  const [step, setStep] = useState<StepId>(0);
  const [session, setSession] = useState<SessionState>(() =>
    createInitialSession(lang === "en" ? "en" : "fr")
  );

  const updateSession = useCallback((patch: Partial<SessionState>) => {
    setSession((prev) => ({ ...prev, ...patch }));
  }, []);

  const goTo = (s: StepId) => setStep(s);

  // Step navigation logic with conditional branching
  const nextFrom = (current: StepId) => {
    switch (current) {
      case 0: return goTo(1);
      case 1: return goTo(2);
      case 2: return goTo(3); // email
      case 3: return goTo(4); // complementary
      case 4: // after complementary → sofia specialties or clusters
        return session.persona === "SOFIA" ? goTo(5) : goTo(6);
      case 5: return goTo(6); // sofia → clusters
      case 6: return; // TODO: next steps (discovery, closing, results)
    }
  };

  const prevFrom = (current: StepId) => {
    switch (current) {
      case 1: return goTo(0);
      case 2: return goTo(1);
      case 3: return goTo(2);
      case 4: return goTo(3);
      case 5: return goTo(4);
      case 6: return session.persona === "SOFIA" ? goTo(5) : goTo(4);
      default: return;
    }
  };

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

  // Map step to progress index (0-6)
  const progressIndex = step <= 4 ? step : step === 5 ? 4 : 5;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-8">
        {Array.from({ length: TOTAL_VISIBLE_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= progressIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Render current step */}
      {step === 0 && (
        <DiagStep0Prenom session={session} onUpdate={updateSession} onNext={() => nextFrom(0)} t={t} />
      )}
      {step === 1 && (
        <DiagStep1Tjm session={session} onUpdate={updateSession} onNext={() => nextFrom(1)} t={t} />
      )}
      {step === 2 && (
        <DiagStep2Persona session={session} onUpdate={updateSession} onNext={() => nextFrom(2)} t={t} />
      )}
      {step === 3 && (
        <DiagStep2bEmail session={session} onUpdate={updateSession} onNext={() => nextFrom(3)} t={t} />
      )}
      {step === 4 && (
        <DiagStep2cComplementary session={session} onUpdate={updateSession} onNext={() => nextFrom(4)} t={t} />
      )}
      {step === 5 && (
        <DiagStep3SofiaSpecialties session={session} onUpdate={updateSession} onNext={() => nextFrom(5)} t={t} />
      )}
      {step === 6 && (
        <DiagStep4Clusters
          session={session}
          onUpdate={updateSession}
          onNext={() => nextFrom(6)}
          onPrev={() => prevFrom(6)}
          clusters={clusters}
          tools={tools}
          doublonRules={doublonRules}
          t={t}
        />
      )}
    </div>
  );
}
