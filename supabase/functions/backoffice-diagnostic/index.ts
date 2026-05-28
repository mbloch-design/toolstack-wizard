import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-key",
};

type DashboardModePayload = {
  mode?: "dashboard";
  days?: number;
  limit?: number;
  persona?: string | null;
};

type SessionDetailModePayload = {
  mode: "session_detail";
  sessionId?: string;
};

type UpdateSessionAdminModePayload = {
  mode: "update_session_admin";
  sessionId?: string;
  tags?: string[];
  note?: string | null;
};

type UpdateEmailJobModePayload = {
  mode: "update_email_job";
  jobId?: string;
  action?: "retry_now" | "cancel" | "schedule";
  scheduledFor?: string | null;
};

type Payload =
  | DashboardModePayload
  | SessionDetailModePayload
  | UpdateSessionAdminModePayload
  | UpdateEmailJobModePayload;

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length).trim();
}

function assertAdminAccess(req: Request) {
  const expected = Deno.env.get("BACKOFFICE_ADMIN_KEY");
  if (!expected) {
    throw new Error("Missing BACKOFFICE_ADMIN_KEY secret");
  }
  const provided = req.headers.get("x-admin-key") || getBearerToken(req);
  return provided === expected;
}

function sanitizePersona(persona: string | null | undefined) {
  if (!persona) return null;
  const value = persona.trim().toUpperCase();
  if (!value || value === "ALL") return null;
  return value;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function sanitizeTags(input: unknown) {
  if (!Array.isArray(input)) return [];
  const unique = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const clean = raw.trim().replace(/\s+/g, " ");
    if (!clean) continue;
    unique.add(clean.slice(0, 48));
    if (unique.size >= 12) break;
  }
  return Array.from(unique);
}

function sanitizeNote(input: unknown) {
  if (input == null) return null;
  if (typeof input !== "string") return null;
  const clean = input.trim();
  if (!clean) return null;
  return clean.slice(0, 3000);
}

function parseIsoDate(input: unknown) {
  if (typeof input !== "string") return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

async function fetchDashboard(
  supabase: ReturnType<typeof createClient>,
  payload: DashboardModePayload
) {
  const days = clampInt(payload.days, 1, 365, 30);
  const limit = clampInt(payload.limit, 20, 500, 150);
  const persona = sanitizePersona(payload.persona || null);
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let sessionQuery = supabase
    .from("vw_backoffice_diagnostic_sessions")
    .select("*")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (persona) {
    sessionQuery = sessionQuery.eq("persona", persona);
  }

  const { data: sessions, error: sessionsError } = await sessionQuery;
  if (sessionsError) {
    throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
  }

  const { data: emailHealth, error: emailHealthError } = await supabase
    .from("vw_backoffice_email_health")
    .select("*")
    .gte("day", sinceIso)
    .order("day", { ascending: false })
    .limit(500);

  if (emailHealthError) {
    throw new Error(`Failed to fetch email health: ${emailHealthError.message}`);
  }

  const { data: recentEmailJobs, error: jobsError } = await supabase
    .from("diagnostic_email_jobs")
    .select(
      "id, session_id, email, template_key, locale, status, attempts, provider, provider_message_id, scheduled_for, sent_at, delivered_at, opened_at, clicked_at, failed_at, last_error, metadata, created_at, updated_at"
    )
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(200);

  if (jobsError) {
    throw new Error(`Failed to fetch recent email jobs: ${jobsError.message}`);
  }

  const { data: recentRestitutions, error: restitutionsError } = await supabase
    .from("diagnostic_restitutions")
    .select("id, session_id, channel, version, summary, details, score_snapshot, generated_at")
    .gte("generated_at", sinceIso)
    .order("generated_at", { ascending: false })
    .limit(200);

  if (restitutionsError) {
    throw new Error(`Failed to fetch recent restitutions: ${restitutionsError.message}`);
  }

  return {
    mode: "dashboard",
    meta: {
      days,
      limit,
      persona,
      fetchedAt: new Date().toISOString(),
    },
    sessions: sessions || [],
    emailHealth: emailHealth || [],
    recentEmailJobs: recentEmailJobs || [],
    recentRestitutions: recentRestitutions || [],
  };
}

async function fetchSessionDetail(
  supabase: ReturnType<typeof createClient>,
  payload: SessionDetailModePayload
) {
  const sessionId = payload.sessionId?.trim();
  if (!sessionId || !isUuid(sessionId)) {
    return {
      status: 400,
      body: {
        error: "Invalid sessionId",
      },
    };
  }

  const { data: session, error: sessionError } = await supabase
    .from("vw_backoffice_diagnostic_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (sessionError || !session) {
    return {
      status: 404,
      body: {
        error: "Session not found",
      },
    };
  }

  const { data: stepEvents, error: stepEventsError } = await supabase
    .from("diagnostic_step_events")
    .select("id, step_id, event_name, event_payload, source, lang, persona, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(150);

  if (stepEventsError) {
    throw new Error(`Failed to fetch step events: ${stepEventsError.message}`);
  }

  const { data: snapshots, error: snapshotsError } = await supabase
    .from("diagnostic_session_snapshots")
    .select("id, step_id, completion_pct, is_final, snapshot, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (snapshotsError) {
    throw new Error(`Failed to fetch snapshots: ${snapshotsError.message}`);
  }

  const { data: emailJobs, error: emailJobsError } = await supabase
    .from("diagnostic_email_jobs")
    .select(
      "id, session_id, email, template_key, locale, status, attempts, provider, provider_message_id, scheduled_for, sent_at, delivered_at, opened_at, clicked_at, failed_at, last_error, metadata, created_at, updated_at"
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (emailJobsError) {
    throw new Error(`Failed to fetch email jobs: ${emailJobsError.message}`);
  }

  const emailJobIds = (emailJobs || []).map((job) => job.id);
  let emailJobEvents: Array<Record<string, unknown>> = [];
  if (emailJobIds.length > 0) {
    const { data: eventsData, error: emailJobEventsError } = await supabase
      .from("diagnostic_email_job_events")
      .select("id, job_id, status_from, status_to, event_source, metadata, created_at")
      .in("job_id", emailJobIds)
      .order("created_at", { ascending: false })
      .limit(200);

    if (emailJobEventsError) {
      throw new Error(`Failed to fetch email job events: ${emailJobEventsError.message}`);
    }
    emailJobEvents = eventsData || [];
  }

  const { data: restitutions, error: restitutionsError } = await supabase
    .from("diagnostic_restitutions")
    .select("id, channel, version, summary, details, score_snapshot, generated_at")
    .eq("session_id", sessionId)
    .order("generated_at", { ascending: false })
    .limit(50);

  if (restitutionsError) {
    throw new Error(`Failed to fetch restitutions: ${restitutionsError.message}`);
  }

  return {
    status: 200,
    body: {
      mode: "session_detail",
      session,
      stepEvents: stepEvents || [],
      snapshots: snapshots || [],
      emailJobs: emailJobs || [],
      emailJobEvents,
      restitutions: restitutions || [],
    },
  };
}

async function updateSessionAdmin(
  supabase: ReturnType<typeof createClient>,
  payload: UpdateSessionAdminModePayload
) {
  const sessionId = payload.sessionId?.trim();
  if (!sessionId || !isUuid(sessionId)) {
    return {
      status: 400,
      body: { error: "Invalid sessionId" },
    };
  }

  const patch: Record<string, unknown> = {
    admin_updated_at: new Date().toISOString(),
  };
  let hasChange = false;
  if ("tags" in payload) {
    patch.admin_tags = sanitizeTags(payload.tags);
    hasChange = true;
  }
  if ("note" in payload) {
    patch.admin_note = sanitizeNote(payload.note);
    hasChange = true;
  }

  if (!hasChange) {
    return {
      status: 400,
      body: { error: "No session admin changes provided" },
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("diagnostic_sessions")
    .update(patch)
    .eq("id", sessionId)
    .select("id, admin_tags, admin_note, admin_updated_at")
    .single();

  if (updateError || !updated) {
    return {
      status: 404,
      body: { error: updateError?.message || "Session not found" },
    };
  }

  return {
    status: 200,
    body: {
      mode: "update_session_admin",
      session: {
        session_id: updated.id,
        admin_tags: updated.admin_tags || [],
        admin_note: updated.admin_note || null,
        admin_updated_at: updated.admin_updated_at || null,
      },
    },
  };
}

async function updateEmailJob(
  supabase: ReturnType<typeof createClient>,
  payload: UpdateEmailJobModePayload
) {
  const jobId = payload.jobId?.trim();
  if (!jobId || !isUuid(jobId)) {
    return {
      status: 400,
      body: { error: "Invalid jobId" },
    };
  }

  const action = payload.action;
  if (!action || !["retry_now", "cancel", "schedule"].includes(action)) {
    return {
      status: 400,
      body: { error: "Invalid action" },
    };
  }

  const { data: current, error: currentError } = await supabase
    .from("diagnostic_email_jobs")
    .select("id, status, metadata")
    .eq("id", jobId)
    .single();

  if (currentError || !current) {
    return {
      status: 404,
      body: { error: "Email job not found" },
    };
  }

  const nowIso = new Date().toISOString();
  let scheduledFor = nowIso;
  if (action === "schedule") {
    const parsed = parseIsoDate(payload.scheduledFor);
    if (!parsed) {
      return {
        status: 400,
        body: { error: "Invalid scheduledFor" },
      };
    }
    scheduledFor = parsed;
  }
  if (action === "retry_now") {
    scheduledFor = nowIso;
  }

  const metadata = ((current.metadata as Record<string, unknown> | null) || {});
  const patch: Record<string, unknown> = {
    metadata: {
      ...metadata,
      last_backoffice_action: action,
      last_backoffice_action_at: nowIso,
    },
  };

  if (action === "cancel") {
    patch.status = "cancelled";
  }
  if (action === "retry_now" || action === "schedule") {
    patch.status = "queued";
    patch.scheduled_for = scheduledFor;
    patch.failed_at = null;
    patch.last_error = null;
  }

  const { data: updated, error: updateError } = await supabase
    .from("diagnostic_email_jobs")
    .update(patch)
    .eq("id", jobId)
    .select(
      "id, session_id, email, template_key, locale, status, attempts, provider, provider_message_id, scheduled_for, sent_at, delivered_at, opened_at, clicked_at, failed_at, last_error, metadata, created_at, updated_at"
    )
    .single();

  if (updateError || !updated) {
    return {
      status: 500,
      body: { error: updateError?.message || "Unable to update email job" },
    };
  }

  return {
    status: 200,
    body: {
      mode: "update_email_job",
      job: updated,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!assertAdminAccess(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const payload = (await req.json().catch(() => ({}))) as Payload;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (payload.mode === "session_detail") {
      const detail = await fetchSessionDetail(supabase, payload);
      return new Response(JSON.stringify(detail.body), {
        status: detail.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.mode === "update_session_admin") {
      const result = await updateSessionAdmin(supabase, payload);
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.mode === "update_email_job") {
      const result = await updateEmailJob(supabase, payload);
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dashboard = await fetchDashboard(supabase, payload);
    return new Response(JSON.stringify(dashboard), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
