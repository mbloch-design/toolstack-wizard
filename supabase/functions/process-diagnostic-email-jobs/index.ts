import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@6.12.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-worker-key",
};

type ClaimedJob = {
  id: string;
  session_id: string;
  email: string;
  template_key: string;
  locale: "fr" | "en";
  attempts: number;
  metadata: Record<string, unknown> | null;
};

type SessionSnapshot = {
  first_name: string | null;
  language: string | null;
  persona: string | null;
  health_score: number | null;
  health_label: string | null;
  stack_total_cost: number | null;
  estimated_waste: number | null;
  optimized_cost: number | null;
  annual_savings: number | null;
  hours_recoverable: number | null;
  email_preferences: Record<string, boolean> | null;
};

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length).trim();
}

function assertWorkerAuth(req: Request) {
  const expected = Deno.env.get("DIAGNOSTIC_EMAIL_WORKER_KEY");
  if (!expected) {
    throw new Error("Missing DIAGNOSTIC_EMAIL_WORKER_KEY secret");
  }
  const provided = req.headers.get("x-worker-key") || getBearerToken(req);
  if (!provided || provided !== expected) {
    return false;
  }
  return true;
}

function toLocale(locale: string | null | undefined): "fr" | "en" {
  return locale === "en" ? "en" : "fr";
}

function t(locale: "fr" | "en", fr: string, en: string) {
  return locale === "en" ? en : fr;
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return "0€";
  return `${Math.round(Number(value))}€`;
}

function numberValue(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return 0;
  return Math.round(Number(value));
}

function buildTemplateContent(job: ClaimedJob, session: SessionSnapshot, appBaseUrl: string) {
  const locale = toLocale(job.locale || session.language);
  const firstName = session.first_name?.trim() || t(locale, "là", "there");
  const safeName = escapeHtml(firstName);
  const ctaUrlFromMeta = typeof job.metadata?.cta_url === "string" ? job.metadata.cta_url : null;
  const reportUrlFromMeta = typeof job.metadata?.report_url === "string" ? job.metadata.report_url : null;
  const ctaUrl = reportUrlFromMeta || ctaUrlFromMeta || `${appBaseUrl}/${locale}/selector`;

  const healthScore = numberValue(session.health_score);
  const healthLabel = session.health_label || t(locale, "À revoir", "Needs attention");
  const annualSavings = numberValue(session.annual_savings);
  const monthlyWaste = numberValue(session.estimated_waste);
  const monthlyCost = numberValue(session.stack_total_cost);
  const optimizedCost = numberValue(session.optimized_cost);
  const hoursRecoverable = numberValue(session.hours_recoverable);

  if (job.template_key === "diagnostic_followup_24h") {
    return {
      subject: t(locale, "Ton plan d'actions ToolTrim (24h)", "Your ToolTrim action plan (24h)"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;line-height:1.5;color:#111827;">
          <h1 style="font-size:24px;margin:0 0 12px;">${t(locale, "On passe à l'action", "Time to take action")}</h1>
          <p>${t(locale, `Salut ${safeName}, voici le rappel 24h de ton diagnostic ToolTrim.`, `Hi ${safeName}, here is your 24h reminder from your ToolTrim diagnostic.`)}</p>
          <ul>
            <li>${t(locale, "Score santé", "Health score")}: <strong>${healthScore}/100</strong> (${escapeHtml(healthLabel)})</li>
            <li>${t(locale, "Gaspillage estimé", "Estimated waste")}: <strong>${money(monthlyWaste)}/${t(locale, "mois", "month")}</strong></li>
            <li>${t(locale, "Économies annuelles potentielles", "Potential annual savings")}: <strong>${money(annualSavings)}</strong></li>
          </ul>
          <p><a href="${ctaUrl}" style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:10px 16px;border-radius:8px;">${t(locale, "Reprendre mon plan", "Resume my plan")}</a></p>
        </div>
      `,
      text: [
        t(locale, "On passe à l'action.", "Time to take action."),
        t(locale, `Salut ${firstName}, voici ton rappel 24h ToolTrim.`, `Hi ${firstName}, here is your ToolTrim 24h reminder.`),
        `${t(locale, "Score santé", "Health score")}: ${healthScore}/100 (${healthLabel})`,
        `${t(locale, "Gaspillage estimé", "Estimated waste")}: ${money(monthlyWaste)}/${t(locale, "mois", "month")}`,
        `${t(locale, "Économies annuelles", "Annual savings")}: ${money(annualSavings)}`,
        ctaUrl,
      ].join("\n"),
    };
  }

  if (job.template_key === "diagnostic_followup_7d") {
    return {
      subject: t(locale, "On refait un point ToolTrim ?", "Ready for a ToolTrim check-in?"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;line-height:1.5;color:#111827;">
          <h1 style="font-size:24px;margin:0 0 12px;">${t(locale, "Point d'étape à 7 jours", "7-day check-in")}</h1>
          <p>${t(locale, `Salut ${safeName}, ton diagnostic est prêt à être mis à jour.`, `Hi ${safeName}, your diagnostic is ready for an update.`)}</p>
          <p>${t(locale, "Relance un passage rapide pour vérifier ce qui a bougé.", "Run a quick pass to see what changed.")}</p>
          <p><a href="${ctaUrl}" style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:10px 16px;border-radius:8px;">${t(locale, "Mettre à jour ma stack", "Update my stack")}</a></p>
        </div>
      `,
      text: [
        t(locale, "Point d'étape à 7 jours.", "7-day check-in."),
        t(locale, `Salut ${firstName}, ton diagnostic est prêt à être mis à jour.`, `Hi ${firstName}, your diagnostic is ready for an update.`),
        ctaUrl,
      ].join("\n"),
    };
  }

  if (job.template_key === "diagnostic_reactivation_30d") {
    return {
      subject: t(locale, "Ta stack a-t-elle changé ce mois-ci ?", "Has your stack changed this month?"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;line-height:1.5;color:#111827;">
          <h1 style="font-size:24px;margin:0 0 12px;">${t(locale, "Réactivation à 30 jours", "30-day reactivation")}</h1>
          <p>${t(locale, `Salut ${safeName}, en 5 minutes tu peux recalculer tes gains potentiels.`, `Hi ${safeName}, in 5 minutes you can recalculate your potential gains.`)}</p>
          <p><a href="${ctaUrl}" style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:10px 16px;border-radius:8px;">${t(locale, "Relancer le diagnostic", "Run the diagnostic again")}</a></p>
        </div>
      `,
      text: [
        t(locale, "Réactivation à 30 jours.", "30-day reactivation."),
        t(locale, `Salut ${firstName}, relance le diagnostic en 5 minutes.`, `Hi ${firstName}, run the diagnostic again in 5 minutes.`),
        ctaUrl,
      ].join("\n"),
    };
  }

  return {
    subject: t(locale, "Ton diagnostic ToolTrim est prêt", "Your ToolTrim diagnostic is ready"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;line-height:1.5;color:#111827;">
        <h1 style="font-size:24px;margin:0 0 12px;">${t(locale, "Ton rapport est prêt", "Your report is ready")}</h1>
        <p>${t(locale, `Salut ${safeName}, voici ton diagnostic ToolTrim.`, `Hi ${safeName}, here is your ToolTrim diagnostic.`)}</p>
        <ul>
          <li>${t(locale, "Score santé", "Health score")}: <strong>${healthScore}/100</strong> (${escapeHtml(healthLabel)})</li>
          <li>${t(locale, "Coût stack actuel", "Current stack cost")}: <strong>${money(monthlyCost)}/${t(locale, "mois", "month")}</strong></li>
          <li>${t(locale, "Coût optimisé", "Optimized cost")}: <strong>${money(optimizedCost)}/${t(locale, "mois", "month")}</strong></li>
          <li>${t(locale, "Gaspillage estimé", "Estimated waste")}: <strong>${money(monthlyWaste)}/${t(locale, "mois", "month")}</strong></li>
          <li>${t(locale, "Économies annuelles potentielles", "Potential annual savings")}: <strong>${money(annualSavings)}</strong></li>
          <li>${t(locale, "Temps récupérable", "Recoverable time")}: <strong>${hoursRecoverable}h/${t(locale, "mois", "month")}</strong></li>
        </ul>
        <p><a href="${ctaUrl}" style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:10px 16px;border-radius:8px;">${t(locale, "Voir / relancer le diagnostic", "View / rerun the diagnostic")}</a></p>
      </div>
    `,
    text: [
      t(locale, "Ton rapport ToolTrim est prêt.", "Your ToolTrim report is ready."),
      `${t(locale, "Score santé", "Health score")}: ${healthScore}/100 (${healthLabel})`,
      `${t(locale, "Coût stack actuel", "Current stack cost")}: ${money(monthlyCost)}/${t(locale, "mois", "month")}`,
      `${t(locale, "Coût optimisé", "Optimized cost")}: ${money(optimizedCost)}/${t(locale, "mois", "month")}`,
      `${t(locale, "Gaspillage estimé", "Estimated waste")}: ${money(monthlyWaste)}/${t(locale, "mois", "month")}`,
      `${t(locale, "Économies annuelles", "Annual savings")}: ${money(annualSavings)}`,
      `${t(locale, "Temps récupérable", "Recoverable time")}: ${hoursRecoverable}h/${t(locale, "mois", "month")}`,
      ctaUrl,
    ].join("\n"),
  };
}

async function queueFollowupIfMissing(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  email: string,
  locale: "fr" | "en",
  templateKey: string,
  delayHours: number
) {
  const { data: existing } = await supabase
    .from("diagnostic_email_jobs")
    .select("id")
    .eq("session_id", sessionId)
    .eq("template_key", templateKey)
    .limit(1);

  if (existing && existing.length > 0) return;

  const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();
  await supabase.from("diagnostic_email_jobs").insert({
    session_id: sessionId,
    email,
    template_key: templateKey,
    locale,
    status: "queued",
    scheduled_for: scheduledFor,
    metadata: { trigger: "go4_followup" },
  });
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
    const batchSize = Math.min(Math.max(Number(body.batchSize || 20), 1), 100);
    const maxAttempts = Math.min(Math.max(Number(body.maxAttempts || 5), 1), 10);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("DIAGNOSTIC_EMAIL_FROM");
    const appBaseUrl = (Deno.env.get("TOOLTRIM_APP_URL") || "https://tooltrim.com").replace(/\/+$/, "");

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !emailFrom) {
      throw new Error("Missing required secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, DIAGNOSTIC_EMAIL_FROM)");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const resend = new Resend(resendApiKey);

    const { data: claimedJobs, error: claimError } = await supabase.rpc("claim_diagnostic_email_jobs", {
      p_limit: batchSize,
    });

    if (claimError) {
      throw new Error(`claim_diagnostic_email_jobs failed: ${claimError.message}`);
    }

    const jobs = (claimedJobs || []) as ClaimedJob[];
    if (jobs.length === 0) {
      return new Response(JSON.stringify({ success: true, claimed: 0, sent: 0, retried: 0, failed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let retried = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        const { data: session, error: sessionError } = await supabase
          .from("diagnostic_sessions")
          .select(
            "first_name, language, persona, health_score, health_label, stack_total_cost, estimated_waste, optimized_cost, annual_savings, hours_recoverable, email_preferences"
          )
          .eq("id", job.session_id)
          .single();

        if (sessionError || !session) {
          throw new Error(`Session lookup failed: ${sessionError?.message || "not found"}`);
        }

        const content = buildTemplateContent(job, session as SessionSnapshot, appBaseUrl);
        const sendResult = await resend.emails.send({
          from: emailFrom,
          to: [job.email],
          subject: content.subject,
          html: content.html,
          text: content.text,
        });

        if (sendResult.error) {
          throw new Error(sendResult.error.message || "Resend send failed");
        }

        const providerMessageId = sendResult.data?.id || null;
        const nowIso = new Date().toISOString();

        const { error: updateError } = await supabase
          .from("diagnostic_email_jobs")
          .update({
            status: "sent",
            provider: "resend",
            provider_message_id: providerMessageId,
            sent_at: nowIso,
            last_error: null,
            metadata: {
              ...(job.metadata || {}),
              provider_message_id: providerMessageId,
              template_key: job.template_key,
            },
          })
          .eq("id", job.id)
          .eq("status", "processing");

        if (updateError) {
          throw new Error(`Job update failed: ${updateError.message}`);
        }

        await supabase.from("diagnostic_restitutions").insert({
          session_id: job.session_id,
          channel: "email",
          version: "v1",
          summary: {
            template_key: job.template_key,
            subject: content.subject,
            recipient: job.email,
          },
          details: {
            provider: "resend",
            provider_message_id: providerMessageId,
          },
          score_snapshot: {
            health_score: session.health_score,
            estimated_waste: session.estimated_waste,
            annual_savings: session.annual_savings,
          },
          generated_at: nowIso,
        });

        const prefs = (session.email_preferences || {}) as Record<string, boolean>;
        if (job.template_key === "diagnostic_report_ready") {
          if (prefs.actions === true) {
            await queueFollowupIfMissing(
              supabase,
              job.session_id,
              job.email,
              toLocale(job.locale || session.language),
              "diagnostic_followup_24h",
              24
            );
          }
          if (prefs.checkIn === true) {
            await queueFollowupIfMissing(
              supabase,
              job.session_id,
              job.email,
              toLocale(job.locale || session.language),
              "diagnostic_followup_7d",
              24 * 7
            );
          }
        }

        sent += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown send error";
        const attempts = Number(job.attempts || 1);
        const shouldRetry = attempts < maxAttempts;

        if (shouldRetry) {
          const delayMinutes = Math.min(60, 5 * Math.pow(2, Math.max(0, attempts - 1)));
          const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
          await supabase
            .from("diagnostic_email_jobs")
            .update({
              status: "queued",
              scheduled_for: scheduledFor,
              last_error: message.slice(0, 2000),
            })
            .eq("id", job.id)
            .eq("status", "processing");
          retried += 1;
        } else {
          await supabase
            .from("diagnostic_email_jobs")
            .update({
              status: "failed",
              failed_at: new Date().toISOString(),
              last_error: message.slice(0, 2000),
            })
            .eq("id", job.id)
            .eq("status", "processing");
          failed += 1;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        claimed: jobs.length,
        sent,
        retried,
        failed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[process-diagnostic-email-jobs] failed:", error);
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
