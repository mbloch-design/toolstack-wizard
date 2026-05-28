type CreateSessionPayload = {
  language: "fr" | "en";
  persona: string;
  source?: string;
  funnelVersion?: string;
  firstName?: string | null;
  email?: string | null;
  lastStepId?: number | null;
};

type UpdateSessionPayload = Record<string, unknown>;

type StepEventPayload = {
  stepId: number;
  eventName: string;
  eventPayload?: Record<string, unknown>;
  source?: string;
  lang?: string;
  persona?: string;
};

type SnapshotPayload = {
  stepId: number;
  snapshot: Record<string, unknown>;
  completionPct?: number;
  isFinal?: boolean;
};

type EmailJobPayload = {
  email: string;
  templateKey: string;
  locale: "fr" | "en";
  metadata?: Record<string, unknown>;
};

type RestitutionPayload = {
  channel: "dashboard" | "email" | "pdf" | "share";
  version?: string;
  summary?: Record<string, unknown>;
  details?: Record<string, unknown>;
  scoreSnapshot?: Record<string, unknown>;
};

type SessionRow = {
  id: string;
  session_token: string;
};

const DEFAULT_SUPABASE_URL = "https://rtfyfuwfdpnsogovkwai.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZnlmdXdmZHBuc29nb3Zrd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTcyMDcsImV4cCI6MjA4ODg3MzIwN30.pwpmh9Qe8dLZFq1rMqtCRmEMJ9dnbcdvT_B4CjIu4Xc";

function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_ANON_KEY,
  };
}

function buildHeaders(token?: string): HeadersInit {
  const { anonKey } = getSupabaseConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
  if (token) headers["x-session-token"] = token;
  return headers;
}

function toIsoNow() {
  return new Date().toISOString();
}

function createUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function createDiagnosticSession(
  payload: CreateSessionPayload
): Promise<SessionRow | null> {
  try {
    const { url } = getSupabaseConfig();
    const session: SessionRow = {
      id: createUuid(),
      session_token: createUuid(),
    };
    const body = {
      id: session.id,
      session_token: session.session_token,
      first_name: payload.firstName ?? null,
      persona: payload.persona,
      language: payload.language,
      email: payload.email ?? null,
      source: payload.source || "web",
      funnel_version: payload.funnelVersion || "v1",
      last_step_id: payload.lastStepId ?? 0,
      last_client_seen_at: toIsoNow(),
      updated_at: toIsoNow(),
    };

    const res = await fetch(`${url}/rest/v1/diagnostic_sessions`, {
      method: "POST",
      headers: {
        ...buildHeaders(),
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(await res.text());
    return session;
  } catch (error) {
    console.error("[DiagPersistence] createDiagnosticSession failed:", error);
    return null;
  }
}

export async function updateDiagnosticSession(
  sessionId: string,
  sessionToken: string,
  patch: UpdateSessionPayload
): Promise<boolean> {
  try {
    const { url } = getSupabaseConfig();
    const res = await fetch(
      `${url}/rest/v1/diagnostic_sessions?id=eq.${encodeURIComponent(sessionId)}`,
      {
        method: "PATCH",
        headers: {
          ...buildHeaders(sessionToken),
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ ...patch, updated_at: toIsoNow() }),
      }
    );
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (error) {
    console.error("[DiagPersistence] updateDiagnosticSession failed:", error);
    return false;
  }
}

export function markDiagnosticSessionAbandoned(
  sessionId: string,
  sessionToken: string,
  payload: { stepId: number; reason?: string }
) {
  try {
    const { url } = getSupabaseConfig();
    const nowIso = toIsoNow();
    void fetch(
      `${url}/rest/v1/diagnostic_sessions?id=eq.${encodeURIComponent(sessionId)}`,
      {
        method: "PATCH",
        keepalive: true,
        headers: {
          ...buildHeaders(sessionToken),
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          abandoned_at: nowIso,
          last_client_seen_at: nowIso,
          last_step_id: payload.stepId,
          recovery_state: {
            reason: payload.reason || "client_hidden",
            step_id: payload.stepId,
            captured_at: nowIso,
          },
          updated_at: nowIso,
        }),
      }
    );
  } catch (error) {
    console.error("[DiagPersistence] markDiagnosticSessionAbandoned failed:", error);
  }
}

export async function insertDiagnosticStepEvent(
  sessionId: string,
  sessionToken: string,
  event: StepEventPayload
): Promise<boolean> {
  try {
    const { url } = getSupabaseConfig();
    const body = {
      session_id: sessionId,
      step_id: event.stepId,
      event_name: event.eventName,
      event_payload: event.eventPayload || {},
      source: event.source || "web",
      lang: event.lang || null,
      persona: event.persona || null,
    };
    const res = await fetch(`${url}/rest/v1/diagnostic_step_events`, {
      method: "POST",
      headers: {
        ...buildHeaders(sessionToken),
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (error) {
    console.error("[DiagPersistence] insertDiagnosticStepEvent failed:", error);
    return false;
  }
}

export async function insertDiagnosticSessionSnapshot(
  sessionId: string,
  sessionToken: string,
  payload: SnapshotPayload
): Promise<boolean> {
  try {
    const { url } = getSupabaseConfig();
    const body = {
      session_id: sessionId,
      step_id: payload.stepId,
      snapshot: payload.snapshot,
      completion_pct: payload.completionPct ?? null,
      is_final: payload.isFinal === true,
    };
    const res = await fetch(`${url}/rest/v1/diagnostic_session_snapshots`, {
      method: "POST",
      headers: {
        ...buildHeaders(sessionToken),
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (error) {
    console.error("[DiagPersistence] insertDiagnosticSessionSnapshot failed:", error);
    return false;
  }
}

export async function queueDiagnosticEmailJob(
  sessionId: string,
  sessionToken: string,
  payload: EmailJobPayload
): Promise<boolean> {
  try {
    const { url } = getSupabaseConfig();
    const body = {
      session_id: sessionId,
      email: payload.email,
      template_key: payload.templateKey,
      locale: payload.locale,
      status: "queued",
      metadata: payload.metadata || {},
    };
    const res = await fetch(`${url}/rest/v1/diagnostic_email_jobs`, {
      method: "POST",
      headers: {
        ...buildHeaders(sessionToken),
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (error) {
    console.error("[DiagPersistence] queueDiagnosticEmailJob failed:", error);
    return false;
  }
}

export async function insertDiagnosticRestitution(
  sessionId: string,
  sessionToken: string,
  payload: RestitutionPayload
): Promise<boolean> {
  try {
    const { url } = getSupabaseConfig();
    const body = {
      session_id: sessionId,
      channel: payload.channel,
      version: payload.version || "v1",
      summary: payload.summary || {},
      details: payload.details || {},
      score_snapshot: payload.scoreSnapshot || {},
    };
    const res = await fetch(`${url}/rest/v1/diagnostic_restitutions`, {
      method: "POST",
      headers: {
        ...buildHeaders(sessionToken),
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (error) {
    console.error("[DiagPersistence] insertDiagnosticRestitution failed:", error);
    return false;
  }
}
