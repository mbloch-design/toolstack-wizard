const DEFAULT_SUPABASE_PROJECT_ID = "rtfyfuwfdpnsogovkwai";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZnlmdXdmZHBuc29nb3Zrd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTcyMDcsImV4cCI6MjA4ODg3MzIwN30.pwpmh9Qe8dLZFq1rMqtCRmEMJ9dnbcdvT_B4CjIu4Xc";

function getFunctionUrl() {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || DEFAULT_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/backoffice-diagnostic`;
}

function getAnonKey() {
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_ANON_KEY;
}

function buildBaseHeaders(): HeadersInit {
  const anonKey = getAnonKey();
  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

function buildHeaders(adminSessionToken: string): HeadersInit {
  return {
    ...buildBaseHeaders(),
    "x-admin-session": adminSessionToken,
  };
}

async function parseOrThrow(res: Response) {
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // keep null
  }

  if (!res.ok) {
    const message =
      (json && typeof json === "object" && "error" in json && typeof (json as { error?: unknown }).error === "string"
        ? (json as { error: string }).error
        : text) || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return json;
}

export type BackofficeSession = {
  session_id: string;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
  abandoned_at: string | null;
  last_client_seen_at: string | null;
  resumed_at: string | null;
  recovery_state: Record<string, unknown> | null;
  action_state: Record<string, unknown> | null;
  diagnostic_context: Record<string, unknown> | null;
  first_name: string | null;
  email: string | null;
  persona: string | null;
  language: string | null;
  source: string | null;
  funnel_version: string | null;
  last_step_id: number | null;
  health_score: number | null;
  health_label: string | null;
  stack_total_cost: number | null;
  estimated_waste: number | null;
  optimized_cost: number | null;
  annual_savings: number | null;
  actions_completed: number | null;
  stack_profile: string | null;
  stack_maturity: string | null;
  primary_risk: string | null;
  risk_flags: Array<Record<string, unknown>> | null;
  functional_coverage: Array<Record<string, unknown>> | null;
  diagnostic_insights: Record<string, unknown> | null;
  admin_tags: string[] | null;
  admin_note: string | null;
  admin_updated_at: string | null;
  event_count: number;
  last_event_at: string | null;
  max_step_seen: number | null;
  email_jobs_count: number;
  email_sent_count: number;
  email_failed_count: number;
  last_email_job_at: string | null;
};

export type BackofficeEmailHealth = {
  day: string;
  template_key: string;
  locale: string;
  total_jobs: number;
  queued_jobs: number;
  sent_jobs: number;
  delivered_jobs: number;
  opened_jobs: number;
  clicked_jobs: number;
  failed_jobs: number;
};

export type BackofficeEmailJob = {
  id: string;
  session_id: string;
  email: string;
  template_key: string;
  locale: string;
  status: string;
  attempts: number;
  provider: string | null;
  provider_message_id: string | null;
  scheduled_for: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  failed_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type BackofficeAuthResponse = {
  mode: "auth";
  adminSessionToken: string;
  expiresAt: string;
};

export type BackofficeRestitution = {
  id: string;
  session_id: string;
  channel: string;
  version: string;
  summary: Record<string, unknown>;
  details: Record<string, unknown>;
  score_snapshot: Record<string, unknown>;
  generated_at: string;
};

export type BackofficeDashboardResponse = {
  mode: "dashboard";
  meta: {
    days: number;
    limit: number;
    persona: string | null;
    fetchedAt: string;
  };
  sessions: BackofficeSession[];
  emailHealth: BackofficeEmailHealth[];
  recentEmailJobs: BackofficeEmailJob[];
  recentRestitutions: BackofficeRestitution[];
};

export type BackofficeSessionDetailResponse = {
  mode: "session_detail";
  session: BackofficeSession;
  stepEvents: Array<{
    id: string;
    step_id: number;
    event_name: string;
    event_payload: Record<string, unknown>;
    source: string;
    lang: string | null;
    persona: string | null;
    created_at: string;
  }>;
  snapshots: Array<{
    id: string;
    step_id: number;
    completion_pct: number | null;
    is_final: boolean;
    snapshot: Record<string, unknown>;
    created_at: string;
  }>;
  emailJobs: BackofficeEmailJob[];
  emailJobEvents: Array<{
    id: string;
    job_id: string;
    status_from: string | null;
    status_to: string;
    event_source: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  restitutions: Array<{
    id: string;
    channel: string;
    version: string;
    summary: Record<string, unknown>;
    details: Record<string, unknown>;
    score_snapshot: Record<string, unknown>;
    generated_at: string;
  }>;
};

export type BackofficeUpdateSessionAdminResponse = {
  mode: "update_session_admin";
  session: {
    session_id: string;
    admin_tags: string[];
    admin_note: string | null;
    admin_updated_at: string | null;
  };
};

export type BackofficeUpdateEmailJobResponse = {
  mode: "update_email_job";
  job: BackofficeEmailJob;
};

export async function authenticateBackofficeAdmin(adminKey: string): Promise<BackofficeAuthResponse> {
  const res = await fetch(getFunctionUrl(), {
    method: "POST",
    headers: buildBaseHeaders(),
    body: JSON.stringify({
      mode: "auth",
      adminKey,
    }),
  });
  return parseOrThrow(res) as Promise<BackofficeAuthResponse>;
}

export async function fetchBackofficeDashboard(
  adminSessionToken: string,
  params: { days: number; limit: number; persona?: string | null }
): Promise<BackofficeDashboardResponse> {
  const res = await fetch(getFunctionUrl(), {
    method: "POST",
    headers: buildHeaders(adminSessionToken),
    body: JSON.stringify({
      mode: "dashboard",
      days: params.days,
      limit: params.limit,
      persona: params.persona || null,
    }),
  });
  return parseOrThrow(res) as Promise<BackofficeDashboardResponse>;
}

export async function fetchBackofficeSessionDetail(
  adminSessionToken: string,
  sessionId: string
): Promise<BackofficeSessionDetailResponse> {
  const res = await fetch(getFunctionUrl(), {
    method: "POST",
    headers: buildHeaders(adminSessionToken),
    body: JSON.stringify({
      mode: "session_detail",
      sessionId,
    }),
  });
  return parseOrThrow(res) as Promise<BackofficeSessionDetailResponse>;
}

export async function updateBackofficeSessionAdmin(
  adminSessionToken: string,
  payload: { sessionId: string; tags?: string[]; note?: string | null }
): Promise<BackofficeUpdateSessionAdminResponse> {
  const res = await fetch(getFunctionUrl(), {
    method: "POST",
    headers: buildHeaders(adminSessionToken),
    body: JSON.stringify({
      mode: "update_session_admin",
      sessionId: payload.sessionId,
      tags: payload.tags,
      note: payload.note,
    }),
  });
  return parseOrThrow(res) as Promise<BackofficeUpdateSessionAdminResponse>;
}

export async function updateBackofficeEmailJob(
  adminSessionToken: string,
  payload: {
    jobId: string;
    action: "retry_now" | "cancel" | "schedule";
    scheduledFor?: string;
  }
): Promise<BackofficeUpdateEmailJobResponse> {
  const res = await fetch(getFunctionUrl(), {
    method: "POST",
    headers: buildHeaders(adminSessionToken),
    body: JSON.stringify({
      mode: "update_email_job",
      jobId: payload.jobId,
      action: payload.action,
      scheduledFor: payload.scheduledFor,
    }),
  });
  return parseOrThrow(res) as Promise<BackofficeUpdateEmailJobResponse>;
}
