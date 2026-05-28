import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useDiagnosticData } from "@/hooks/useDiagnosticData";
import type { SessionState, Persona, DiagnosticResult } from "@/types/diagnostic";
import { runDiagnostic } from "@/utils/scoring";
import {
  clearDiagnosticRecovery,
  loadDiagnosticRecovery,
  saveDiagnosticRecovery,
} from "@/lib/diagnosticRecovery";
import {
  createDiagnosticSession,
  insertDiagnosticRestitution,
  insertDiagnosticSessionSnapshot,
  insertDiagnosticStepEvent,
  markDiagnosticSessionAbandoned,
  queueDiagnosticEmailJob,
  updateDiagnosticSession,
} from "@/lib/diagnosticPersistence";

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
const FUNNEL_VERSION = "v1";
const PROGRESS_MAP: Record<StepId, number> = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 3, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8, 11: 9, 12: 10,
};

function createInitialSession(language: "fr" | "en"): SessionState {
  return {
    firstName: "",
    tjm: 0,
    language,
    persona: "THEO" as Persona,
    personaConfidence: "clear",
    stackGoal: "reduce_costs",
    complementarySkills: [],
    selectedTools: [],
    discoveryAnswers: new Map(),
    closingAnswers: ["", "", ""],
  };
}

function toStepId(value: unknown): StepId {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 12 ? (parsed as StepId) : 0;
}

function serializeDiscoveryAnswers(answers: Map<string, number>) {
  const out: Record<string, number> = {};
  answers.forEach((v, k) => { out[k] = v; });
  return out;
}

function serializeToolScores(result: DiagnosticResult) {
  const out: Record<string, { pertinence: number; valueIndex: number; scoreFinal: number }> = {};
  result.toolScores.forEach((v, k) => { out[k] = v; });
  return out;
}

function serializeSessionSnapshot(session: SessionState) {
  return {
    firstName: session.firstName,
    tjm: session.tjm,
    language: session.language,
    persona: session.persona,
    personaConfidence: session.personaConfidence || null,
    stackGoal: session.stackGoal || null,
    complementarySkills: session.complementarySkills,
    primarySpecialty: session.primarySpecialty || null,
    complementarySpecialties: session.complementarySpecialties || [],
    email: session.email || null,
    emailPreferences: session.emailPreferences || null,
    apiSpendTranche: session.apiSpendTranche || null,
    selectedTools: session.selectedTools.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
      category: t.category,
    })),
    discoveryAnswers: serializeDiscoveryAnswers(session.discoveryAnswers),
    closingAnswers: session.closingAnswers,
  };
}

function buildDiagnosticContext(session: SessionState) {
  return {
    persona_confidence: session.personaConfidence || null,
    stack_goal: session.stackGoal || null,
    complementary_skills: session.complementarySkills,
    primary_specialty: session.primarySpecialty || null,
    complementary_specialties: session.complementarySpecialties || [],
  };
}

export default function DiagnosticRouter() {
  const { lang, t } = useLang();
  const language = lang === "en" ? "en" : "fr";
  const [searchParams] = useSearchParams();
  const fromTool = searchParams.get("from") || undefined;
  const { tools, clusters, doublonRules, discoveryQuestions, loading, error } = useDiagnosticData();
  const recoveryRef = useRef<ReturnType<typeof loadDiagnosticRecovery> | undefined>(undefined);
  if (recoveryRef.current === undefined) {
    recoveryRef.current = loadDiagnosticRecovery(language, FUNNEL_VERSION);
  }
  const recovered = recoveryRef.current;
  const [step, setStep] = useState<StepId>(() => toStepId(recovered?.step));
  const [showTransition, setShowTransition] = useState<string | null>(null);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(
    () => !!recovered && toStepId(recovered.step) > 0 && toStepId(recovered.step) < 12
  );
  const [session, setSession] = useState<SessionState>(() =>
    recovered?.session || createInitialSession(language)
  );
  const [dbSessionId, setDbSessionId] = useState<string | null>(recovered?.dbSessionId || null);
  const [dbSessionToken, setDbSessionToken] = useState<string | null>(recovered?.dbSessionToken || null);
  const bootstrapAttemptedRef = useRef(!!(recovered?.dbSessionId && recovered?.dbSessionToken));
  const finalSaveDoneRef = useRef(recovered?.finalSaveDone === true);
  const reportEmailQueuedRef = useRef(recovered?.reportEmailQueued === true);
  const previousStepRef = useRef<StepId | null>(null);
  const resumeLoggedRef = useRef(false);

  // Compute diagnostic result when reaching dashboard
  const diagnosticResult = useMemo<DiagnosticResult | null>(() => {
    if (step < 11) return null;
    return runDiagnostic(session, { allTools: tools, doublonRules, discoveryQuestions });
  }, [step, session, tools, doublonRules, discoveryQuestions]);

  const updateSession = useCallback((patch: Partial<SessionState>) => {
    setSession((prev) => ({ ...prev, ...patch }));
  }, []);

  const goTo = useCallback((s: StepId) => setStep(s), []);

  const persistRecovery = useCallback(() => {
    saveDiagnosticRecovery({
      funnelVersion: FUNNEL_VERSION,
      step,
      session,
      dbSessionId,
      dbSessionToken,
      finalSaveDone: finalSaveDoneRef.current,
      reportEmailQueued: reportEmailQueuedRef.current,
    });
  }, [dbSessionId, dbSessionToken, session, step]);

  const logEvent = useCallback((stepId: StepId, eventName: string, eventPayload: Record<string, unknown> = {}) => {
    if (!dbSessionId || !dbSessionToken) return;
    void insertDiagnosticStepEvent(dbSessionId, dbSessionToken, {
      stepId,
      eventName,
      eventPayload,
      source: "web",
      lang: session.language,
      persona: session.persona,
    });
  }, [dbSessionId, dbSessionToken, session.language, session.persona]);

  const maybeQueueReportEmail = useCallback(() => {
    if (!dbSessionId || !dbSessionToken || reportEmailQueuedRef.current) return;
    const wantsSummary = session.emailPreferences?.summary === true;
    const email = session.email?.trim();
    if (!wantsSummary || !email) return;

    reportEmailQueuedRef.current = true;
    persistRecovery();
    void queueDiagnosticEmailJob(dbSessionId, dbSessionToken, {
      email,
      templateKey: "diagnostic_report_ready",
      locale: session.language,
      metadata: {
        trigger_step: 9,
        funnel_version: FUNNEL_VERSION,
      },
    });
    logEvent(9, "report_requested", { template_key: "diagnostic_report_ready" });
  }, [dbSessionId, dbSessionToken, logEvent, persistRecovery, session.email, session.emailPreferences, session.language]);

  // Transition helper
  const goToWithTransition = useCallback((s: StepId, message: string) => {
    setShowTransition(message);
    setTimeout(() => {
      setShowTransition(null);
      setStep(s);
    }, 1500);
  }, []);

  // Bootstrap DB session early to persist funnel progress from the first step.
  useEffect(() => {
    if (loading || error || bootstrapAttemptedRef.current) return;
    bootstrapAttemptedRef.current = true;

    void (async () => {
      const row = await createDiagnosticSession({
        language: session.language,
        persona: session.persona,
        source: "web",
        funnelVersion: FUNNEL_VERSION,
        firstName: session.firstName || null,
        email: session.email || null,
        lastStepId: step,
      });
      if (!row) return;
      setDbSessionId(row.id);
      setDbSessionToken(row.session_token);
    })();
  }, [loading, error, session.language, session.persona, session.firstName, session.email, step]);

  useEffect(() => {
    persistRecovery();
  }, [persistRecovery]);

  useEffect(() => {
    if (!recovered || !dbSessionId || !dbSessionToken || resumeLoggedRef.current) return;
    resumeLoggedRef.current = true;
    const resumedAt = new Date().toISOString();
    void updateDiagnosticSession(dbSessionId, dbSessionToken, {
      resumed_at: resumedAt,
      last_client_seen_at: resumedAt,
      abandoned_at: null,
      recovery_state: {
        status: "resumed",
        resumed_at: resumedAt,
        restored_step_id: step,
      },
    });
    void insertDiagnosticStepEvent(dbSessionId, dbSessionToken, {
      stepId: step,
      eventName: "session_resumed",
      eventPayload: {
        restored_step: step,
        saved_at: recovered.savedAt,
      },
      source: "web",
      lang: session.language,
      persona: session.persona,
    });
  }, [dbSessionId, dbSessionToken, recovered, session.language, session.persona, step]);

  // Persist step viewed + snapshots when navigating through the funnel.
  useEffect(() => {
    if (!dbSessionId || !dbSessionToken) return;
    const previous = previousStepRef.current;
    if (previous === step) return;
    previousStepRef.current = step;

    // Queue report email only on explicit transition from recap step -> closing step.
    if (previous === 9 && step === 10) {
      maybeQueueReportEmail();
    }

    const completionPct = Number(((PROGRESS_MAP[step] / TOTAL_VISIBLE_STEPS) * 100).toFixed(2));
    const snapshot = serializeSessionSnapshot(session);

    logEvent(step, "step_viewed", {
      previous_step: previous,
      from_tool: fromTool || null,
      completion_pct: completionPct,
    });

    void updateDiagnosticSession(dbSessionId, dbSessionToken, {
      first_name: session.firstName || null,
      persona: session.persona,
      language: session.language,
      diagnostic_context: buildDiagnosticContext(session),
      email: session.email || null,
      tjm: session.tjm || 0,
      api_spend_tranche: session.apiSpendTranche || null,
      selected_tools: snapshot.selectedTools,
      discovery_answers: snapshot.discoveryAnswers,
      closing_answers: snapshot.closingAnswers,
      email_preferences: session.emailPreferences || {},
      last_step_id: step,
      source: "web",
      funnel_version: FUNNEL_VERSION,
      last_client_seen_at: new Date().toISOString(),
      abandoned_at: null,
    });

    void insertDiagnosticSessionSnapshot(dbSessionId, dbSessionToken, {
      stepId: step,
      snapshot,
      completionPct,
      isFinal: step >= 12,
    });
  }, [dbSessionId, dbSessionToken, fromTool, logEvent, maybeQueueReportEmail, session, step]);

  // Persist final computed result once (without creating a second DB session row).
  useEffect(() => {
    if (!diagnosticResult || !dbSessionId || !dbSessionToken || finalSaveDoneRef.current) return;
    finalSaveDoneRef.current = true;

    const discoveryObj = serializeDiscoveryAnswers(session.discoveryAnswers);
    const toolScoresObj = serializeToolScores(diagnosticResult);
    const prescriptionsObj = {
      phase1: diagnosticResult.prescriptions.phase1,
      phase2: diagnosticResult.prescriptions.phase2,
      phase3: diagnosticResult.prescriptions.phase3,
    };

    void (async () => {
      await updateDiagnosticSession(dbSessionId, dbSessionToken, {
        first_name: session.firstName || null,
        persona: session.persona,
        language: session.language,
        diagnostic_context: buildDiagnosticContext(session),
        email: session.email || null,
        tjm: session.tjm || 0,
        api_spend_tranche: session.apiSpendTranche || null,
        selected_tools: session.selectedTools.map((tool) => ({
          id: tool.id,
          name: tool.name,
          price: tool.price,
          category: tool.category,
        })),
        discovery_answers: discoveryObj,
        closing_answers: session.closingAnswers,
        stack_total_cost: diagnosticResult.stackTotalCost,
        estimated_waste: diagnosticResult.estimatedWaste,
        optimized_cost: diagnosticResult.optimizedCost,
        health_score: diagnosticResult.healthScore,
        health_label: diagnosticResult.healthLabel,
        annual_savings: diagnosticResult.annualSavings,
        hours_recoverable: diagnosticResult.hoursRecoverable,
        prescriptions: prescriptionsObj,
        recommendations: diagnosticResult.recommendations.map((r) => ({ id: r.id, name: r.name })),
        tool_scores: toolScoresObj,
        stack_profile: diagnosticResult.insights.profile.id,
        stack_maturity: diagnosticResult.insights.maturity.id,
        primary_risk: diagnosticResult.insights.primaryRisk?.id || null,
        risk_flags: diagnosticResult.insights.riskFlags,
        functional_coverage: diagnosticResult.insights.functionalCoverage,
        diagnostic_insights: diagnosticResult.insights,
        email_preferences: session.emailPreferences || {},
        last_step_id: 12,
        last_client_seen_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        abandoned_at: null,
      });
      persistRecovery();

      void insertDiagnosticRestitution(dbSessionId, dbSessionToken, {
        channel: "dashboard",
        version: FUNNEL_VERSION,
        summary: {
          profile: diagnosticResult.insights.profile,
          maturity: diagnosticResult.insights.maturity,
          primary_risk: diagnosticResult.insights.primaryRisk,
          focus_areas: diagnosticResult.insights.focusAreas,
        },
        details: {
          insights: diagnosticResult.insights,
          prescriptions: prescriptionsObj,
          recommendations: diagnosticResult.recommendations.map((r) => ({ id: r.id, name: r.name })),
        },
        scoreSnapshot: {
          health_score: diagnosticResult.healthScore,
          health_label: diagnosticResult.healthLabel,
          stack_total_cost: diagnosticResult.stackTotalCost,
          estimated_waste: diagnosticResult.estimatedWaste,
          optimized_cost: diagnosticResult.optimizedCost,
          annual_savings: diagnosticResult.annualSavings,
        },
      });

      logEvent(12, "session_completed", {
        health_score: diagnosticResult.healthScore,
        estimated_waste: diagnosticResult.estimatedWaste,
        stack_profile: diagnosticResult.insights.profile.id,
        primary_risk: diagnosticResult.insights.primaryRisk?.id || null,
      });
      void insertDiagnosticSessionSnapshot(dbSessionId, dbSessionToken, {
        stepId: 12,
        snapshot: serializeSessionSnapshot(session),
        completionPct: 100,
        isFinal: true,
      });
    })();
  }, [dbSessionId, dbSessionToken, diagnosticResult, logEvent, persistRecovery, session]);

  useEffect(() => {
    if (!dbSessionId || !dbSessionToken) return;
    if (step >= 11) {
      void updateDiagnosticSession(dbSessionId, dbSessionToken, {
        last_step_id: step,
        last_client_seen_at: new Date().toISOString(),
        abandoned_at: null,
      });
    }
  }, [dbSessionId, dbSessionToken, step]);

  useEffect(() => {
    if (!dbSessionId || !dbSessionToken || step <= 0 || step >= 12) return;
    const markHidden = (reason: string) => {
      markDiagnosticSessionAbandoned(dbSessionId, dbSessionToken, {
        stepId: step,
        reason,
      });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") markHidden("visibility_hidden");
    };
    const onPageHide = () => markHidden("page_hide");
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [dbSessionId, dbSessionToken, step]);

  const restartDiagnostic = useCallback(() => {
    clearDiagnosticRecovery();
    recoveryRef.current = null;
    setSession(createInitialSession(language));
    setStep(0);
    setShowRecoveryBanner(false);
    setDbSessionId(null);
    setDbSessionToken(null);
    bootstrapAttemptedRef.current = false;
    finalSaveDoneRef.current = false;
    reportEmailQueuedRef.current = false;
    previousStepRef.current = null;
  }, [language]);

  // Step navigation logic
  const nextFrom = useCallback((current: StepId) => {
    logEvent(current, "step_completed", { direction: "next" });
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
  }, [goTo, goToWithTransition, logEvent, session.firstName, session.persona, t]);

  const prevFrom = useCallback((current: StepId) => {
    logEvent(current, "step_back", { direction: "prev" });
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
  }, [goTo, logEvent, session.persona]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-lg w-full rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            {t("Réessayer", "Retry")}
          </button>
        </div>
      </div>
    );
  }

  // Map internal step to visible progress (0-9)
  const progressIndex = PROGRESS_MAP[step];

  const showRightPanel = step >= 7 && step <= 10;

  // If on dashboard step, render full dashboard
  if (step === 12 && diagnosticResult) {
    return <DiagDashboard result={diagnosticResult} allTools={tools} t={t} dbSessionId={dbSessionId} dbSessionToken={dbSessionToken} />;
  }
  return (
    <>
      {/* Top bar */}
      <DiagTopBar
        session={session}
        step={progressIndex}
        totalSteps={TOTAL_VISIBLE_STEPS}
        t={t}
      />

      {showRecoveryBanner && (
        <div className="border-b border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-foreground">
              {t(
                "On a repris ton diagnostic là où tu l'avais laissé.",
                "We picked up your diagnostic where you left off."
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRecoveryBanner(false)}
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium"
              >
                {t("Continuer", "Continue")}
              </button>
              <button
                onClick={restartDiagnostic}
                className="h-8 px-3 rounded-md border border-border text-xs font-medium text-foreground"
              >
                {t("Recommencer", "Restart")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition overlay */}
      {showTransition && (
        <DiagTransitionOverlay
          message={showTransition}
          toolCount={session.selectedTools.length}
          onComplete={() => {}}
        />
      )}

      <div className={`max-w-7xl mx-auto px-4 py-8 md:py-12 ${showRightPanel ? "flex gap-6" : ""}`}>
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {step === 0 && (
            <DiagStep0Prenom session={session} onUpdate={updateSession} onNext={() => nextFrom(0)} t={t} fromTool={fromTool} />
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
            <DiagStep6bEmailRecap
              session={session}
              onUpdate={updateSession}
              onNext={() => nextFrom(9)}
              onPrev={() => prevFrom(9)}
              t={t}
            />
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
            <DiagResultsLoading
              toolCount={session.selectedTools.length}
              t={t}
              onComplete={() => goTo(12)}
            />
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
