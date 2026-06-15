import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@6.12.3";
import { buildAdminAlertDigest } from "../_shared/admin-alerts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-worker-key",
};

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length).trim();
}

function assertWorkerAuth(req: Request) {
  const expected = Deno.env.get("BACKOFFICE_ALERT_WORKER_KEY") || Deno.env.get("DIAGNOSTIC_EMAIL_WORKER_KEY");
  if (!expected) {
    throw new Error("Missing BACKOFFICE_ALERT_WORKER_KEY or DIAGNOSTIC_EMAIL_WORKER_KEY secret");
  }
  const provided = req.headers.get("x-worker-key") || getBearerToken(req);
  return !!provided && provided === expected;
}

function parseRecipients(input: string | undefined) {
  return (input || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
    if (!assertWorkerAuth(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const days = Math.min(Math.max(Number(body.days || 1), 1), 30);
    const limit = Math.min(Math.max(Number(body.limit || 12), 1), 50);
    const locale = body.locale === "en" ? "en" : "fr";
    const dryRun = body.dryRun === true;
    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("DIAGNOSTIC_EMAIL_FROM");
    const recipients = parseRecipients(Deno.env.get("BACKOFFICE_ALERT_EMAILS"));

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    if (!dryRun && (!resendApiKey || !emailFrom || recipients.length === 0)) {
      throw new Error("Missing RESEND_API_KEY, DIAGNOSTIC_EMAIL_FROM, or BACKOFFICE_ALERT_EMAILS");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: sessions, error } = await supabase
      .from("vw_backoffice_diagnostic_sessions")
      .select(
        "session_id, created_at, first_name, email, persona, stack_profile, completed_at, abandoned_at, last_step_id, health_score, estimated_waste, annual_savings, email_jobs_count, email_sent_count, email_failed_count, diagnostic_context, diagnostic_insights"
      )
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    const digest = buildAdminAlertDigest(sessions || [], { limit });
    if (digest.rows.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: false, reason: "no_alerts", digest }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!dryRun) {
      const resend = new Resend(resendApiKey);
      const sendResult = await resend.emails.send({
        from: emailFrom,
        to: recipients,
        subject: locale === "en" ? digest.subjectEn : digest.subjectFr,
        html: locale === "en" ? digest.htmlEn : digest.htmlFr,
        text: locale === "en" ? digest.textEn : digest.textFr,
      });

      if (sendResult.error) {
        throw new Error(sendResult.error.message || "Resend send failed");
      }
    }

    return new Response(JSON.stringify({ success: true, sent: !dryRun, dryRun, digest }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
