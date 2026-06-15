import type { Persona, SessionState, Tool } from "@/types/diagnostic";

const RECOVERY_KEY = "tooltrim.diagnostic.recovery.v1";
const MAX_RECOVERY_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type DiagnosticRecoveryState = {
  funnelVersion: string;
  step: number;
  session: SessionState;
  dbSessionId: string | null;
  dbSessionToken: string | null;
  finalSaveDone: boolean;
  reportEmailQueued: boolean;
  savedAt: string;
};

type RawRecoveryState = Omit<DiagnosticRecoveryState, "session"> & {
  session: Omit<SessionState, "discoveryAnswers"> & {
    discoveryAnswers?: Record<string, number>;
  };
};

const PERSONAS: Persona[] = ["THEO", "SOFIA", "MARC", "ALIX", "CLAIRE"];
const PERSONA_CONFIDENCE = ["clear", "hybrid", "unsure"] as const;
const STACK_GOALS = ["reduce_costs", "save_time", "simplify", "quality"] as const;

function isPersona(value: unknown): value is Persona {
  return typeof value === "string" && PERSONAS.includes(value as Persona);
}

function isPersonaConfidence(value: unknown): value is NonNullable<SessionState["personaConfidence"]> {
  return typeof value === "string" && PERSONA_CONFIDENCE.includes(value as NonNullable<SessionState["personaConfidence"]>);
}

function isStackGoal(value: unknown): value is NonNullable<SessionState["stackGoal"]> {
  return typeof value === "string" && STACK_GOALS.includes(value as NonNullable<SessionState["stackGoal"]>);
}

function sanitizeTool(tool: unknown): Tool | null {
  if (!tool || typeof tool !== "object") return null;
  const raw = tool as Partial<Tool>;
  if (typeof raw.id !== "string" || typeof raw.name !== "string") return null;
  return {
    id: raw.id,
    name: raw.name,
    name_en: raw.name_en,
    price: Number(raw.price) || 0,
    category: typeof raw.category === "string" ? raw.category : "",
    functional_needs: Array.isArray(raw.functional_needs)
      ? raw.functional_needs.filter((item): item is string => typeof item === "string")
      : [],
    pertinence_by_persona: raw.pertinence_by_persona,
    tool_type: raw.tool_type || "satellite",
    ia_use_case: raw.ia_use_case,
    usage: raw.usage || "medium",
    prescription_quality: raw.prescription_quality || "oui",
    freeAlternative: raw.freeAlternative,
    downgrade_plan: raw.downgrade_plan,
    better_alternative: raw.better_alternative,
    force_silence: raw.force_silence === true,
    bundle_parent: raw.bundle_parent,
    includedInBundle: raw.includedInBundle,
    includedVia: raw.includedVia,
  };
}

function deserializeSession(raw: RawRecoveryState["session"], language: "fr" | "en"): SessionState | null {
  if (!raw || typeof raw !== "object") return null;
  if (raw.language !== language) return null;
  if (!isPersona(raw.persona)) return null;

  const discoveryAnswers = new Map<string, number>();
  Object.entries(raw.discoveryAnswers || {}).forEach(([key, value]) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) discoveryAnswers.set(key, parsed);
  });

  return {
    firstName: typeof raw.firstName === "string" ? raw.firstName : "",
    tjm: Number(raw.tjm) || 0,
    language,
    persona: raw.persona,
    personaConfidence: isPersonaConfidence(raw.personaConfidence) ? raw.personaConfidence : "clear",
    stackGoal: isStackGoal(raw.stackGoal) ? raw.stackGoal : undefined,
    complementarySkills: Array.isArray(raw.complementarySkills)
      ? raw.complementarySkills.filter(isPersona)
      : [],
    primarySpecialty: typeof raw.primarySpecialty === "string" ? raw.primarySpecialty : undefined,
    complementarySpecialties: Array.isArray(raw.complementarySpecialties)
      ? raw.complementarySpecialties.filter((item): item is string => typeof item === "string")
      : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
    emailPreferences: raw.emailPreferences,
    apiSpendTranche: raw.apiSpendTranche,
    selectedTools: Array.isArray(raw.selectedTools)
      ? raw.selectedTools.map(sanitizeTool).filter((item): item is Tool => !!item)
      : [],
    discoveryAnswers,
    closingAnswers: Array.isArray(raw.closingAnswers) && raw.closingAnswers.length === 3
      ? [String(raw.closingAnswers[0] || ""), String(raw.closingAnswers[1] || ""), String(raw.closingAnswers[2] || "")]
      : ["", "", ""],
  };
}

function serializeSession(session: SessionState): RawRecoveryState["session"] {
  const discoveryAnswers: Record<string, number> = {};
  session.discoveryAnswers.forEach((value, key) => {
    discoveryAnswers[key] = value;
  });
  return {
    ...session,
    discoveryAnswers,
  };
}

export function loadDiagnosticRecovery(language: "fr" | "en", funnelVersion: string): DiagnosticRecoveryState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RECOVERY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RawRecoveryState;
    if (parsed.funnelVersion !== funnelVersion) return null;
    const savedAt = new Date(parsed.savedAt);
    if (Number.isNaN(savedAt.getTime())) return null;
    if (Date.now() - savedAt.getTime() > MAX_RECOVERY_AGE_MS) {
      window.localStorage.removeItem(RECOVERY_KEY);
      return null;
    }
    const session = deserializeSession(parsed.session, language);
    if (!session) return null;
    return {
      ...parsed,
      session,
      dbSessionId: parsed.dbSessionId || null,
      dbSessionToken: parsed.dbSessionToken || null,
      finalSaveDone: parsed.finalSaveDone === true,
      reportEmailQueued: parsed.reportEmailQueued === true,
    };
  } catch {
    return null;
  }
}

export function saveDiagnosticRecovery(state: Omit<DiagnosticRecoveryState, "savedAt">) {
  if (typeof window === "undefined") return;
  const payload: RawRecoveryState = {
    ...state,
    session: serializeSession(state.session),
    savedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(payload));
}

export function clearDiagnosticRecovery() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RECOVERY_KEY);
}
