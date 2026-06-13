import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useDiagnosticData } from "@/hooks/useDiagnosticData";
import type { SessionState, Persona, DiagnosticResult } from "@/types/diagnostic";
import { runDiagnostic } from "@/utils/scoring";
import { getPricingCaptureSummary } from "@/utils/diagnosticPricing";
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

import DiagStepStackScan from "@/components/diagnostic/DiagStepStackScan";
import DiagStepProfileGoal from "@/components/diagnostic/DiagStepProfileGoal";
import DiagStep6Discovery from "@/components/diagnostic/DiagStep6Discovery";
import DiagStepPreVerdict from "@/components/diagnostic/DiagStepPreVerdict";
import DiagResultsLoading from "@/components/diagnostic/DiagResultsLoading";
import DiagDashboard from "@/components/dashboard/DiagDashboard";
import DiagTopBar from "@/components/diagnostic/DiagTopBar";
import DiagSaveIndicator from "@/components/diagnostic/DiagSaveIndicator";
import DiagTransitionOverlay from "@/components/diagnostic/DiagTransitionOverlay";

// V2 steps: 0=Profile/goal, 1=Stack scan, 2=Dynamic questions,
// 3=Verdict + optional email, 4=legacy email step, 5=Loading, 12=Dashboard.
type StepId = 0 | 1 | 2 | 3 | 4 | 5 | 12;

const TOTAL_VISIBLE_STEPS = 5;
const FUNNEL_VERSION = "v2";
const PROGRESS_MAP: Record<StepId, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 3,
  5: 4,
  12: 5,
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
  return parsed === 0 || parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4 || parsed === 5 || parsed === 12
    ? (parsed as StepId)
    : 0;
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
    selectionCoverage: session.selectionCoverage || null,
    adaptiveDiscoveryQuestions: session.adaptiveDiscoveryQuestions || [],
    selectedTools: session.selectedTools.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
      priceCurrency: t.priceCurrency || null,
      selectedOffer: t.selectedOffer || null,
      catalogMonthlyPrice: t.catalogMonthlyPrice ?? null,
      catalogMonthlyPriceCurrency: t.catalogMonthlyPriceCurrency || null,
      selectedPriceIsEstimate: t.selectedPriceIsEstimate ?? null,
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
    selection_coverage: session.selectionCoverage || null,
    pricing_capture: getPricingCaptureSummary(session.selectedTools),
  };
}

export default function DiagnosticRouter() {
  const { lang, t } = useLang();
  const language = lang === "en" ? "en" : "fr";
  const [searchParams] = useSearchParams();
  const fromTool = searchParams.get("from") || undefined;
  const { tools, doublonRules, discoveryQuestions, loading, error } = useDiagnosticData();
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
  const effectiveDiscoveryQuestions = useMemo(() => {
    const seen = new Set<string>();
    return [...(session.adaptiveDiscoveryQuestions || []), ...discoveryQuestions].filter((question) => {
      if (seen.has(question.id)) return false;
      seen.add(question.id);
      return true;
    });
  }, [discoveryQuestions, session.adaptiveDiscoveryQuestions]);

  const previewDiagnosticResult = useMemo<DiagnosticResult | null>(() => {
    if (step < 3 || session.selectedTools.length === 0) return null;
    return runDiagnostic(session, { allTools: tools, doublonRules, discoveryQuestions: effectiveDiscoveryQuestions });
  }, [doublonRules, effectiveDiscoveryQuestions, session, step, tools]);

  // Compute final diagnostic result when reaching dashboard.
  const diagnosticResult = useMemo<DiagnosticResult | null>(() => {
    if (step !== 12) return null;
    return runDiagnostic(session, { allTools: tools, doublonRules, discoveryQuestions: effectiveDiscoveryQuestions });
  }, [step, session, tools, doublonRules, effectiveDiscoveryQuestions]);

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
        trigger_step: 3,
        funnel_version: FUNNEL_VERSION,
      },
    });
    logEvent(3, "report_requested", { template_key: "diagnostic_report_ready" });
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

    // Queue report email only on explicit transition from verdict -> loading/results.
    if ((previous === 3 || previous === 4) && step === 5) {
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
    const pricingCapture = getPricingCaptureSummary(session.selectedTools);

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
          priceCurrency: tool.priceCurrency || null,
          selectedOffer: tool.selectedOffer || null,
          catalogMonthlyPrice: tool.catalogMonthlyPrice ?? null,
          catalogMonthlyPriceCurrency: tool.catalogMonthlyPriceCurrency || null,
          selectedPriceIsEstimate: tool.selectedPriceIsEstimate ?? null,
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
          report_pattern: "guided_report",
          report_sections: ["understood_context", "verdict", "first_decision", "evidence", "appendices"],
          currency_policy: "source_currency_or_verify",
          understood_context: {
            persona: session.persona,
            persona_confidence: session.personaConfidence,
            stack_goal: session.stackGoal,
            selected_tool_count: session.selectedTools.length,
            covered_zone_count: session.selectionCoverage?.covered.length || 0,
            skipped_zone_count: session.selectionCoverage?.skipped.length || 0,
          },
          pricing_capture: pricingCapture,
          profile: diagnosticResult.insights.profile,
          maturity: diagnosticResult.insights.maturity,
          primary_risk: diagnosticResult.insights.primaryRisk,
          focus_areas: diagnosticResult.insights.focusAreas,
        },
        details: {
          report_pattern: "guided_report",
          currency_policy: "source_currency_or_verify",
          pricing_capture: pricingCapture,
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
      case 3:
        return goToWithTransition(5, t(
          session.firstName ? `${session.firstName}, je transforme ta stack en plan d'action...` : "Je transforme ta stack en plan d'action...",
          session.firstName ? `${session.firstName}, turning your stack into an action plan...` : "Turning your stack into an action plan..."
        ));
      case 4:
        return goToWithTransition(5, t(
          session.firstName ? `${session.firstName}, je transforme ta stack en plan d'action...` : "Je transforme ta stack en plan d'action...",
          session.firstName ? `${session.firstName}, turning your stack into an action plan...` : "Turning your stack into an action plan..."
        ));
      case 5: return goTo(12);
      case 12: return;
    }
  }, [goTo, goToWithTransition, logEvent, session.firstName, t]);

  const prevFrom = useCallback((current: StepId) => {
    logEvent(current, "step_back", { direction: "prev" });
    switch (current) {
      case 1: return goTo(0);
      case 2: return goTo(1);
      case 3: return goTo(2);
      case 4: return goTo(3);
      case 5: return goTo(3);
      default: return;
    }
  }, [goTo, logEvent]);

  if (loading) {
    return (
      <div className="diagnostic-mood p-3 md:p-4">
        <div className="diagnostic-shell flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diagnostic-mood p-3 md:p-4">
        <div className="diagnostic-shell flex items-center justify-center px-4">
        <div className="max-w-lg w-full rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="diagnostic-primary-action mt-3 h-9 px-4 rounded-md text-sm font-medium"
          >
            {t("Réessayer", "Retry")}
          </button>
        </div>
        </div>
      </div>
    );
  }

  // Map internal step to visible progress (0-9)
  const progressIndex = PROGRESS_MAP[step];

  // If on dashboard step, render full dashboard
  if (step === 12 && diagnosticResult) {
    return (
      <div className="diagnostic-mood p-3 md:p-4">
        <div className="diagnostic-shell">
          <DiagDashboard result={diagnosticResult} allTools={tools} t={t} dbSessionId={dbSessionId} dbSessionToken={dbSessionToken} />
        </div>
      </div>
    );
  }
  return (
    <div className="diagnostic-mood p-3 md:p-4">
      <div className="diagnostic-shell">
      {/* Top bar */}
      <DiagTopBar
        session={session}
        step={progressIndex}
        totalSteps={TOTAL_VISIBLE_STEPS + 1}
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
                className="diagnostic-primary-action h-8 px-3 rounded-md text-xs font-medium"
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

      <div
        className="min-h-[calc(100vh-var(--navbar-h)-72px)]"
      >
        <div className="mx-auto max-w-7xl px-4 py-7 md:py-10">
        {/* Main content */}
        <div className="min-w-0">
          {step === 0 && (
            <DiagStepProfileGoal
              session={session}
              onUpdate={updateSession}
              onNext={() => nextFrom(0)}
              variant="intro"
              t={t}
            />
          )}
          {step === 1 && (
            <DiagStepStackScan
              session={session}
              tools={tools}
              onUpdate={updateSession}
              onNext={() => nextFrom(1)}
              onPrev={() => prevFrom(1)}
              onTrack={(eventName, eventPayload = {}) => {
                logEvent(1, eventName, {
                  ...eventPayload,
                  funnel_version: FUNNEL_VERSION,
                });
              }}
              t={t}
              fromTool={fromTool}
            />
          )}
          {step === 2 && (
            <DiagStep6Discovery
              session={session}
              onUpdate={updateSession}
              onNext={() => nextFrom(2)}
              onPrev={() => prevFrom(2)}
              discoveryQuestions={discoveryQuestions}
              t={t}
            />
          )}
          {(step === 3 || step === 4) && previewDiagnosticResult && (
            <DiagStepPreVerdict
              session={session}
              result={previewDiagnosticResult}
              onUpdate={updateSession}
              onNext={() => nextFrom(step === 4 ? 4 : 3)}
              onPrev={() => prevFrom(step === 4 ? 4 : 3)}
              t={t}
            />
          )}
          {step === 5 && (
            <DiagResultsLoading
              toolCount={session.selectedTools.length}
              t={t}
              onComplete={() => goTo(12)}
            />
          )}
        </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      <DiagSaveIndicator session={session as unknown as Record<string, unknown>} t={t} />
      </div>
    </div>
  );
}
