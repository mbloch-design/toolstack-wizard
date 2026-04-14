import { useState, useCallback, useMemo } from "react";
import { useLang } from "@/hooks/useLang";
import { useDiagnosticData } from "@/hooks/useDiagnosticData";
import type { SessionState, Persona, DiagnosticResult } from "@/types/diagnostic";
import { runDiagnostic } from "@/utils/scoring";

import DiagStep0Prenom from "@/components/diagnostic/DiagStep0Prenom";
import DiagStep1Tjm from "@/components/diagnostic/DiagStep1Tjm";
import DiagStep2Persona from "@/components/diagnostic/DiagStep2Persona";
import DiagStep2bEmail from "@/components/diagnostic/DiagStep2bEmail";
import DiagStep2cComplementary from "@/components/diagnostic/DiagStep2cComplementary";
import DiagStep3SofiaSpecialties from "@/components/diagnostic/DiagStep3SofiaSpecialties";
import DiagStep4Clusters from "@/components/diagnostic/DiagStep4Clusters";
import DiagStep5ApiCosts from "@/components/diagnostic/DiagStep5ApiCosts";
import DiagStep6Discovery from "@/components/diagnostic/DiagStep6Discovery";
import DiagStep6bEmailRecap from "@/components/diagnostic/DiagStep6bEmailRecap";
import DiagStep7Closing from "@/components/diagnostic/DiagStep7Closing";
import DiagResultsLoading from "@/components/diagnostic/DiagResultsLoading";
import DiagDashboard from "@/components/dashboard/DiagDashboard";
import DiagTopBar from "@/components/diagnostic/DiagTopBar";
import DiagRightPanel from "@/components/diagnostic/DiagRightPanel";
import DiagSaveIndicator from "@/components/diagnostic/DiagSaveIndicator";
import DiagTransitionOverlay from "@/components/diagnostic/DiagTransitionOverlay";

// Steps: 0=Prenom, 1=TJM, 2=Persona, 3=Email, 4=Complementary,
// 5=SofiaSpecialties(conditional), 6=Clusters, 7=ApiCosts(conditional),
// 8=Discovery, 9=EmailRecap, 10=Closing, 11=ResultsLoading, 12=Dashboard
type StepId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const TOTAL_VISIBLE_STEPS = 10;

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
  const [showTransition, setShowTransition] = useState<string | null>(null);
  const [session, setSession] = useState<SessionState>(() =>
    createInitialSession(lang === "en" ? "en" : "fr")
  );

  const updateSession = useCallback((patch: Partial<SessionState>) => {
    setSession((prev) => ({ ...prev, ...patch }));
  }, []);

  const goTo = useCallback((s: StepId) => setStep(s), []);

  // Transition helper
  const goToWithTransition = useCallback((s: StepId, message: string) => {
    setShowTransition(message);
    setTimeout(() => {
      setShowTransition(null);
      setStep(s);
    }, 1500);
  }, []);

  // Step navigation logic
  const nextFrom = useCallback((current: StepId) => {
    switch (current) {
      case 0: return goTo(1);
      case 1: return goTo(2);
      case 2: return goTo(3);
      case 3: return goTo(4);
      case 4: return session.persona === "SOFIA" ? goTo(5) : goTo(6);
      case 5: return goTo(6);
      case 6: // after clusters → transition → api costs (Theo) or discovery
        if (session.persona === "THEO") {
          return goToWithTransition(7, t(
            `Merci ${session.firstName} ! On affine ton diagnostic…`,
            `Thanks ${session.firstName}! Refining your diagnostic…`
          ));
        }
        return goToWithTransition(8, t(
          `Merci ${session.firstName} ! On analyse ta stack…`,
          `Thanks ${session.firstName}! Analyzing your stack…`
        ));
      case 7: return goTo(8); // api costs → discovery
      case 8: return goTo(9); // discovery → email recap
      case 9: return goTo(10); // email recap → closing
      case 10: // closing → results loading with transition
        return goToWithTransition(11, t(
          `C'est parti ${session.firstName} ! Calcul en cours…`,
          `Here we go ${session.firstName}! Calculating…`
        ));
      case 11: return goTo(12); // results loading → dashboard
      case 12: return;
    }
  }, [session.persona, session.firstName, goTo, goToWithTransition, t]);

  const prevFrom = useCallback((current: StepId) => {
    switch (current) {
      case 1: return goTo(0);
      case 2: return goTo(1);
      case 3: return goTo(2);
      case 4: return goTo(3);
      case 5: return goTo(4);
      case 6: return session.persona === "SOFIA" ? goTo(5) : goTo(4);
      case 7: return goTo(6);
      case 8: return session.persona === "THEO" ? goTo(7) : goTo(6);
      case 9: return goTo(8);
      case 10: return goTo(9);
      default: return;
    }
  }, [session.persona, goTo]);

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

  // Map internal step to visible progress (0-9)
  const progressMap: Record<StepId, number> = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 3, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8, 11: 9, 12: 10,
  };
  const progressIndex = progressMap[step];

  const showRightPanel = step >= 6 && step <= 10;

  return (
    <>
      {/* Top bar */}
      <DiagTopBar
        session={session}
        step={progressIndex}
        totalSteps={TOTAL_VISIBLE_STEPS}
        t={t}
      />

      {/* Transition overlay */}
      {showTransition && (
        <DiagTransitionOverlay
          message={showTransition}
          toolCount={session.selectedTools.length}
          onComplete={() => {}}
        />
      )}

      <div className={`max-w-6xl mx-auto px-4 py-8 md:py-12 ${showRightPanel ? "flex gap-6" : ""}`}>
        {/* Main content */}
        <div className="flex-1 min-w-0">
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
          {step === 7 && (
            <DiagStep5ApiCosts session={session} onUpdate={updateSession} onNext={() => nextFrom(7)} t={t} />
          )}
          {step === 8 && (
            <DiagStep6Discovery
              session={session}
              onUpdate={updateSession}
              onNext={() => nextFrom(8)}
              onPrev={() => prevFrom(8)}
              discoveryQuestions={discoveryQuestions}
              t={t}
            />
          )}
          {step === 9 && (
            <DiagStep6bEmailRecap session={session} onUpdate={updateSession} onNext={() => nextFrom(9)} t={t} />
          )}
          {step === 10 && (
            <DiagStep7Closing
              session={session}
              onUpdate={updateSession}
              onNext={() => nextFrom(10)}
              onPrev={() => prevFrom(10)}
              t={t}
            />
          )}
          {step === 11 && (
            <DiagResultsLoading toolCount={session.selectedTools.length} t={t} />
          )}
        </div>

        {/* Right panel — desktop only, steps 6-10 */}
        {showRightPanel && (
          <DiagRightPanel session={session} doublonRules={doublonRules} t={t} />
        )}
      </div>

      {/* Auto-save indicator */}
      <DiagSaveIndicator session={session as unknown as Record<string, unknown>} t={t} />
    </>
  );
}
