import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-key, svix-id, svix-signature, svix-timestamp, webhook-id, webhook-signature, webhook-timestamp",
};

type JobStatus =
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "failed"
  | "cancelled";

const STATUS_RANK: Record<JobStatus, number> = {
  queued: 0,
  processing: 1,
  sent: 2,
  delivered: 3,
  opened: 4,
  clicked: 5,
  failed: 6,
  cancelled: 7,
};

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length).trim();
}

function extractSignatureHeaders(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  const headerNames = [
    "svix-id",
    "svix-signature",
    "svix-timestamp",
    "webhook-id",
    "webhook-signature",
    "webhook-timestamp",
  ];
  for (const name of headerNames) {
    const value = req.headers.get(name);
    if (value) out[name] = value;
  }
  return out;
}

function parseWebhookPayload(req: Request, rawBody: string) {
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  const signatureHeaders = extractSignatureHeaders(req);

  if (webhookSecret && (signatureHeaders["svix-signature"] || signatureHeaders["webhook-signature"])) {
    const wh = new Webhook(webhookSecret);
    return wh.verify(rawBody, signatureHeaders) as Record<string, unknown>;
  }

  const sharedKey = Deno.env.get("DIAGNOSTIC_EMAIL_WEBHOOK_KEY");
  if (!sharedKey) {
    throw new Error("Missing webhook auth configuration (RESEND_WEBHOOK_SECRET or DIAGNOSTIC_EMAIL_WEBHOOK_KEY)");
  }

  const provided = req.headers.get("x-webhook-key") || getBearerToken(req);
  if (!provided || provided !== sharedKey) {
    throw new Error("Unauthorized webhook request");
  }

  return JSON.parse(rawBody) as Record<string, unknown>;
}

function mapStatusFromEventType(eventType: string): JobStatus | null {
  switch (eventType) {
    case "email.sent":
      return "sent";
    case "email.delivered":
      return "delivered";
    case "email.opened":
      return "opened";
    case "email.clicked":
      return "clicked";
    case "email.bounced":
    case "email.complained":
    case "email.failed":
      return "failed";
    default:
      return null;
  }
}

function shouldApplyStatus(currentStatus: JobStatus, nextStatus: JobStatus) {
  if (currentStatus === nextStatus) return false;
  if (nextStatus === "failed" && (currentStatus === "opened" || currentStatus === "clicked")) {
    return false;
  }
  return STATUS_RANK[nextStatus] >= STATUS_RANK[currentStatus];
}

function getProviderMessageId(payload: Record<string, unknown>) {
  const data = payload.data as Record<string, unknown> | undefined;
  const raw = data?.email_id || data?.id || payload.email_id || payload.id;
  return typeof raw === "string" ? raw : null;
}

function getRecipientEmail(payload: Record<string, unknown>) {
  const data = payload.data as Record<string, unknown> | undefined;
  const to = data?.to;
  if (Array.isArray(to) && typeof to[0] === "string") return to[0];
  if (typeof data?.to === "string") return data.to;
  if (typeof payload.email === "string") return payload.email;
  return null;
}

function getEventTimestamp(payload: Record<string, unknown>) {
  const data = payload.data as Record<string, unknown> | undefined;
  const raw =
    (typeof payload.created_at === "string" && payload.created_at) ||
    (typeof data?.created_at === "string" && data.created_at) ||
    null;
  return raw || new Date().toISOString();
}

function pickTimestampPatch(status: JobStatus, eventTimestamp: string) {
  if (status === "sent") return { sent_at: eventTimestamp };
  if (status === "delivered") return { delivered_at: eventTimestamp };
  if (status === "opened") return { opened_at: eventTimestamp };
  if (status === "clicked") return { clicked_at: eventTimestamp };
  if (status === "failed") return { failed_at: eventTimestamp };
  return {};
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
    const rawBody = await req.text();
    const payload = parseWebhookPayload(req, rawBody);

    const eventType = typeof payload.type === "string" ? payload.type : "";
    const nextStatus = mapStatusFromEventType(eventType);
    if (!nextStatus) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "unsupported_event", eventType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const providerMessageId = getProviderMessageId(payload);
    const recipientEmail = getRecipientEmail(payload);
    const eventTimestamp = getEventTimestamp(payload);

    if (!providerMessageId && !recipientEmail) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "missing_identifiers",
        }),
        {
          status: 202,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let query = supabase
      .from("diagnostic_email_jobs")
      .select("id, status, provider_message_id, metadata")
      .eq("provider", "resend")
      .order("created_at", { ascending: false })
      .limit(1);

    if (providerMessageId) {
      query = query.eq("provider_message_id", providerMessageId);
    } else if (recipientEmail) {
      query = query.eq("email", recipientEmail);
    }

    const { data: matches, error: queryError } = await query;
    if (queryError) {
      throw new Error(`Email job lookup failed: ${queryError.message}`);
    }

    const job = matches?.[0];
    if (!job) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "job_not_found",
          providerMessageId,
          recipientEmail,
        }),
        {
          status: 202,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const currentStatus = (job.status || "queued") as JobStatus;
    if (!shouldApplyStatus(currentStatus, nextStatus)) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "stale_transition",
          currentStatus,
          nextStatus,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const patch = {
      status: nextStatus,
      provider: "resend",
      provider_message_id: providerMessageId || job.provider_message_id,
      ...pickTimestampPatch(nextStatus, eventTimestamp),
      metadata: {
        ...((job.metadata as Record<string, unknown> | null) || {}),
        last_webhook_event: eventType,
        last_webhook_at: new Date().toISOString(),
      },
      last_error: nextStatus === "failed" ? eventType : null,
    };

    const { error: updateError } = await supabase
      .from("diagnostic_email_jobs")
      .update(patch)
      .eq("id", job.id);

    if (updateError) {
      throw new Error(`Email job update failed: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        currentStatus,
        nextStatus,
        providerMessageId: providerMessageId || job.provider_message_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    const unauthorized = message.toLowerCase().includes("unauthorized");
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: unauthorized ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
