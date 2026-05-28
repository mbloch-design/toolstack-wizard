import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@6.12.3";
import {
  summarizeDiagnosticEmailQuality,
  validateDiagnosticEmailContent,
} from "../_shared/email-quality.ts";

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
  stack_profile: string | null;
  stack_maturity: string | null;
  primary_risk: string | null;
  risk_flags: DiagnosticRiskFlag[] | null;
  diagnostic_insights: DiagnosticInsights | null;
  action_state: ActionState | null;
};

type LocalizedDiagnosticItem = {
  id?: string;
  labelFr?: string;
  labelEn?: string;
  summaryFr?: string;
  summaryEn?: string;
  actionFr?: string;
  actionEn?: string;
};

type DiagnosticRiskFlag = LocalizedDiagnosticItem & {
  severity?: "low" | "medium" | "high";
  detailFr?: string;
  detailEn?: string;
  impactMonthly?: number;
};

type DiagnosticFocusArea = LocalizedDiagnosticItem & {
  priority?: "low" | "medium" | "high";
};

type DiagnosticInsights = {
  profile?: LocalizedDiagnosticItem | null;
  maturity?: LocalizedDiagnosticItem | null;
  primaryRisk?: DiagnosticRiskFlag | null;
  riskFlags?: DiagnosticRiskFlag[] | null;
  focusAreas?: DiagnosticFocusArea[] | null;
  metrics?: Record<string, number> | null;
};

type ActionState = {
  completed_action_ids?: string[];
  recovered_savings?: number;
  total_savings?: number;
  updated_at?: string;
  version?: string;
};

type TemplateContent = {
  subject: string;
  html: string;
  text: string;
  ctaUrl: string;
  locale: "fr" | "en";
  templateVersion: string;
  summary: Record<string, unknown>;
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

function humanizeId(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function localizedField(
  item: LocalizedDiagnosticItem | DiagnosticRiskFlag | null | undefined,
  field: "label" | "summary" | "action" | "detail",
  locale: "fr" | "en"
) {
  if (!item) return "";
  const suffix = locale === "en" ? "En" : "Fr";
  const key = `${field}${suffix}` as keyof (LocalizedDiagnosticItem & DiagnosticRiskFlag);
  const fallbackKey = `${field}${locale === "en" ? "Fr" : "En"}` as keyof (LocalizedDiagnosticItem & DiagnosticRiskFlag);
  const value = item[key] || item[fallbackKey];
  return typeof value === "string" ? value : "";
}

function itemLabel(item: LocalizedDiagnosticItem | DiagnosticRiskFlag | null | undefined, locale: "fr" | "en", fallback?: string | null) {
  return localizedField(item, "label", locale) || humanizeId(item?.id || fallback);
}

function getRiskFlags(session: SessionSnapshot) {
  const fromInsights = session.diagnostic_insights?.riskFlags;
  if (Array.isArray(fromInsights)) return fromInsights;
  if (Array.isArray(session.risk_flags)) return session.risk_flags;
  return [];
}

function getPrimaryRisk(session: SessionSnapshot) {
  const fromInsights = session.diagnostic_insights?.primaryRisk;
  if (fromInsights) return fromInsights;
  const flags = getRiskFlags(session);
  return flags.find((flag) => flag.id === session.primary_risk) || flags[0] || null;
}

function getFocusAreas(session: SessionSnapshot) {
  const focusAreas = session.diagnostic_insights?.focusAreas;
  return Array.isArray(focusAreas) ? focusAreas : [];
}

function getCompletedActionCount(actionState: ActionState | null) {
  return Array.isArray(actionState?.completed_action_ids) ? actionState.completed_action_ids.length : 0;
}

function renderMetricCards(cards: Array<{ label: string; value: string }>) {
  const rows: Array<Array<{ label: string; value: string }>> = [];
  for (let i = 0; i < cards.length; i += 2) {
    rows.push(cards.slice(i, i + 2));
  }

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border-collapse:separate;border-spacing:0;">
      ${rows.map((row) => `
        <tr>
          ${row.map((card) => `
            <td width="50%" style="padding:5px;vertical-align:top;">
              <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#f9fafb;">
                <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">${escapeHtml(card.label)}</div>
                <div style="font-size:18px;font-weight:700;color:#111827;">${escapeHtml(card.value)}</div>
              </div>
            </td>
          `).join("")}
          ${row.length === 1 ? `<td width="50%" style="padding:5px;"></td>` : ""}
        </tr>
      `).join("")}
    </table>
  `;
}

function renderFocusList(focusAreas: DiagnosticFocusArea[], locale: "fr" | "en") {
  if (focusAreas.length === 0) return "";
  return `
    <div style="margin:18px 0;">
      <h2 style="font-size:16px;margin:0 0 8px;color:#111827;">${t(locale, "Ordre de bataille", "Action order")}</h2>
      <ol style="margin:0;padding-left:20px;color:#374151;">
        ${focusAreas.slice(0, 3).map((focus) => `
          <li style="margin:0 0 8px;">
            <strong>${escapeHtml(itemLabel(focus, locale, focus.id))}</strong><br/>
            <span>${escapeHtml(localizedField(focus, "action", locale))}</span>
          </li>
        `).join("")}
      </ol>
    </div>
  `;
}

function buildShell(params: {
  title: string;
  intro: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  const safeCtaUrl = escapeHtml(params.ctaUrl);
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;line-height:1.5;color:#111827;">
      <h1 style="font-size:24px;margin:0 0 12px;color:#111827;">${escapeHtml(params.title)}</h1>
      <p style="margin:0 0 14px;color:#374151;">${params.intro}</p>
      ${params.body}
      <p style="margin:22px 0 0;">
        <a href="${safeCtaUrl}" style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:11px 16px;border-radius:8px;font-weight:700;">${escapeHtml(params.ctaLabel)}</a>
      </p>
    </div>
  `;
}

function buildTemplateContent(job: ClaimedJob, session: SessionSnapshot, appBaseUrl: string): TemplateContent {
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
  const profile = session.diagnostic_insights?.profile || null;
  const maturity = session.diagnostic_insights?.maturity || null;
  const primaryRisk = getPrimaryRisk(session);
  const focusAreas = getFocusAreas(session);
  const profileLabel = itemLabel(profile, locale, session.stack_profile);
  const maturityLabel = itemLabel(maturity, locale, session.stack_maturity);
  const primaryRiskLabel = itemLabel(primaryRisk, locale, session.primary_risk);
  const primaryRiskAction = localizedField(primaryRisk, "action", locale);
  const completedActionCount = getCompletedActionCount(session.action_state);
  const recoveredSavings = numberValue(session.action_state?.recovered_savings);
  const totalSavings = numberValue(session.action_state?.total_savings);
  const templateVersion = "go16-email-v1";
  const summary = {
    template_key: job.template_key,
    template_version: templateVersion,
    profile: session.stack_profile,
    profile_label: profileLabel,
    maturity: session.stack_maturity,
    maturity_label: maturityLabel,
    primary_risk: session.primary_risk,
    primary_risk_label: primaryRiskLabel,
    focus_area_count: focusAreas.length,
    completed_action_count: completedActionCount,
    recovered_savings: recoveredSavings,
    total_savings: totalSavings,
  };

  if (job.template_key === "diagnostic_followup_24h") {
    const firstFocus = focusAreas[0];
    const firstFocusAction = firstFocus ? localizedField(firstFocus, "action", locale) : "";
    const progressLine = completedActionCount > 0
      ? t(
        locale,
        `Tu as déjà coché ${completedActionCount} action(s), soit environ ${money(recoveredSavings)}/mois récupérés.`,
        `You already checked ${completedActionCount} action(s), roughly ${money(recoveredSavings)}/month recovered.`
      )
      : t(
        locale,
        "Le meilleur prochain pas est de traiter une action courte avant d'ajouter un nouvel outil.",
        "The best next step is to handle one short action before adding another tool."
      );
    const body = `
      ${renderMetricCards([
        { label: t(locale, "Score santé", "Health score"), value: `${healthScore}/100` },
        { label: t(locale, "À récupérer", "Recoverable"), value: `${money(monthlyWaste)}/${t(locale, "mois", "month")}` },
      ])}
      <div style="border-left:4px solid #d4581a;background:#fff7ed;padding:12px 14px;margin:16px 0;border-radius:8px;">
        <strong>${escapeHtml(firstFocus ? itemLabel(firstFocus, locale, firstFocus.id) : t(locale, "Première action", "First action"))}</strong>
        <p style="margin:6px 0 0;color:#374151;">${escapeHtml(firstFocusAction || primaryRiskAction || t(locale, "Reprendre le plan et valider une première action.", "Resume the plan and validate a first action."))}</p>
      </div>
      <p style="color:#374151;">${escapeHtml(progressLine)}</p>
    `;
    return {
      subject: t(locale, "Ton plan d'actions ToolTrim (24h)", "Your ToolTrim action plan (24h)"),
      html: buildShell({
        title: t(locale, "On passe à l'action", "Time to take action"),
        intro: t(locale, `Salut ${safeName}, voici le rappel utile de ton diagnostic ToolTrim.`, `Hi ${safeName}, here is the useful reminder from your ToolTrim diagnostic.`),
        body,
        ctaLabel: t(locale, "Reprendre mon plan", "Resume my plan"),
        ctaUrl,
      }),
      text: [
        t(locale, "On passe à l'action.", "Time to take action."),
        t(locale, `Salut ${firstName}, voici ton rappel 24h ToolTrim.`, `Hi ${firstName}, here is your ToolTrim 24h reminder.`),
        `${t(locale, "Score santé", "Health score")}: ${healthScore}/100 (${healthLabel})`,
        `${t(locale, "Gaspillage estimé", "Estimated waste")}: ${money(monthlyWaste)}/${t(locale, "mois", "month")}`,
        firstFocusAction || primaryRiskAction,
        progressLine,
        ctaUrl,
      ].filter(Boolean).join("\n"),
      ctaUrl,
      locale,
      templateVersion,
      summary,
    };
  }

  if (job.template_key === "diagnostic_followup_7d") {
    const body = `
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;background:#f9fafb;margin:16px 0;">
        <div style="font-size:12px;color:#6b7280;">${t(locale, "Lecture actuelle", "Current read")}</div>
        <div style="font-size:18px;font-weight:700;color:#111827;">${escapeHtml(profileLabel || healthLabel)}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">${escapeHtml(primaryRiskLabel ? `${t(locale, "Risque principal", "Primary risk")}: ${primaryRiskLabel}` : healthLabel)}</div>
      </div>
      <p style="color:#374151;">${escapeHtml(t(
        locale,
        "Si tu as supprimé ou downgradé un outil, mets la stack à jour: le score et les économies restantes deviendront plus fiables.",
        "If you removed or downgraded a tool, update the stack: the score and remaining savings will become more reliable."
      ))}</p>
    `;
    return {
      subject: t(locale, "On refait un point ToolTrim ?", "Ready for a ToolTrim check-in?"),
      html: buildShell({
        title: t(locale, "Point d'étape à 7 jours", "7-day check-in"),
        intro: t(locale, `Salut ${safeName}, ton diagnostic est prêt à être comparé avec la réalité de la semaine.`, `Hi ${safeName}, your diagnostic is ready to be compared with the reality of the week.`),
        body,
        ctaLabel: t(locale, "Mettre à jour ma stack", "Update my stack"),
        ctaUrl,
      }),
      text: [
        t(locale, "Point d'étape à 7 jours.", "7-day check-in."),
        t(locale, `Salut ${firstName}, ton diagnostic est prêt à être mis à jour.`, `Hi ${firstName}, your diagnostic is ready for an update.`),
        `${t(locale, "Profil", "Profile")}: ${profileLabel || healthLabel}`,
        primaryRiskLabel ? `${t(locale, "Risque principal", "Primary risk")}: ${primaryRiskLabel}` : "",
        ctaUrl,
      ].filter(Boolean).join("\n"),
      ctaUrl,
      locale,
      templateVersion,
      summary,
    };
  }

  if (job.template_key === "diagnostic_reactivation_30d") {
    const body = `
      ${renderMetricCards([
        { label: t(locale, "Anciennes économies", "Previous savings"), value: money(annualSavings) },
        { label: t(locale, "Actions faites", "Actions done"), value: `${completedActionCount}` },
      ])}
      <p style="color:#374151;">${escapeHtml(t(
        locale,
        "Une stack dérive vite: nouveaux essais, essais gratuits oubliés, doublons IA. Un repassage rapide suffit pour remettre les chiffres au propre.",
        "A stack drifts quickly: new trials, forgotten free trials, AI overlaps. A quick rerun is enough to clean the numbers."
      ))}</p>
    `;
    return {
      subject: t(locale, "Ta stack a-t-elle changé ce mois-ci ?", "Has your stack changed this month?"),
      html: buildShell({
        title: t(locale, "Réactivation à 30 jours", "30-day reactivation"),
        intro: t(locale, `Salut ${safeName}, en 5 minutes tu peux recalculer tes gains potentiels.`, `Hi ${safeName}, in 5 minutes you can recalculate your potential gains.`),
        body,
        ctaLabel: t(locale, "Relancer le diagnostic", "Run the diagnostic again"),
        ctaUrl,
      }),
      text: [
        t(locale, "Réactivation à 30 jours.", "30-day reactivation."),
        t(locale, `Salut ${firstName}, relance le diagnostic en 5 minutes.`, `Hi ${firstName}, run the diagnostic again in 5 minutes.`),
        `${t(locale, "Anciennes économies", "Previous savings")}: ${money(annualSavings)}`,
        ctaUrl,
      ].join("\n"),
      ctaUrl,
      locale,
      templateVersion,
      summary,
    };
  }

  const profileSummary = localizedField(profile, "summary", locale);
  const body = `
    ${renderMetricCards([
      { label: t(locale, "Score santé", "Health score"), value: `${healthScore}/100` },
      { label: t(locale, "Coût actuel", "Current cost"), value: `${money(monthlyCost)}/${t(locale, "mois", "month")}` },
      { label: t(locale, "À récupérer", "Recoverable"), value: `${money(monthlyWaste)}/${t(locale, "mois", "month")}` },
      { label: t(locale, "Économies/an", "Savings/year"), value: money(annualSavings) },
    ])}
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;background:#f9fafb;margin:16px 0;">
      <div style="font-size:12px;color:#6b7280;">${t(locale, "Lecture ToolTrim", "ToolTrim read")}</div>
      <div style="font-size:18px;font-weight:700;color:#111827;">${escapeHtml(profileLabel || healthLabel)}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px;">${escapeHtml(maturityLabel ? `${t(locale, "Maturité", "Maturity")}: ${maturityLabel}` : "")}</div>
      ${profileSummary ? `<p style="margin:8px 0 0;color:#374151;">${escapeHtml(profileSummary)}</p>` : ""}
    </div>
    ${primaryRiskLabel ? `
      <div style="border-left:4px solid #d4581a;background:#fff7ed;padding:12px 14px;margin:16px 0;border-radius:8px;">
        <strong>${escapeHtml(t(locale, "Risque principal", "Primary risk"))}: ${escapeHtml(primaryRiskLabel)}</strong>
        ${primaryRiskAction ? `<p style="margin:6px 0 0;color:#374151;">${escapeHtml(primaryRiskAction)}</p>` : ""}
      </div>
    ` : ""}
    ${renderFocusList(focusAreas, locale)}
    <p style="color:#374151;">${escapeHtml(t(
      locale,
      `Temps récupérable estimé: ${hoursRecoverable}h/mois. Le rapport complet garde le détail outil par outil.`,
      `Estimated recoverable time: ${hoursRecoverable}h/month. The full report keeps the tool-by-tool detail.`
    ))}</p>
  `;
  return {
    subject: annualSavings > 0
      ? t(locale, `Ton diagnostic ToolTrim: ${money(annualSavings)} à récupérer/an`, `Your ToolTrim diagnostic: ${money(annualSavings)} recoverable/year`)
      : t(locale, "Ton diagnostic ToolTrim est prêt", "Your ToolTrim diagnostic is ready"),
    html: buildShell({
      title: t(locale, "Ton rapport est prêt", "Your report is ready"),
      intro: t(locale, `Salut ${safeName}, j'ai gardé l'essentiel: profil, risque principal et premières actions.`, `Hi ${safeName}, I kept the essentials: profile, primary risk, and first actions.`),
      body,
      ctaLabel: t(locale, "Voir mon plan d'action", "View my action plan"),
      ctaUrl,
    }),
    text: [
      t(locale, "Ton rapport ToolTrim est prêt.", "Your ToolTrim report is ready."),
      `${t(locale, "Score santé", "Health score")}: ${healthScore}/100 (${healthLabel})`,
      profileLabel ? `${t(locale, "Profil", "Profile")}: ${profileLabel}` : "",
      maturityLabel ? `${t(locale, "Maturité", "Maturity")}: ${maturityLabel}` : "",
      primaryRiskLabel ? `${t(locale, "Risque principal", "Primary risk")}: ${primaryRiskLabel}` : "",
      primaryRiskAction,
      `${t(locale, "Coût stack actuel", "Current stack cost")}: ${money(monthlyCost)}/${t(locale, "mois", "month")}`,
      `${t(locale, "Coût optimisé", "Optimized cost")}: ${money(optimizedCost)}/${t(locale, "mois", "month")}`,
      `${t(locale, "Gaspillage estimé", "Estimated waste")}: ${money(monthlyWaste)}/${t(locale, "mois", "month")}`,
      `${t(locale, "Économies annuelles", "Annual savings")}: ${money(annualSavings)}`,
      `${t(locale, "Temps récupérable", "Recoverable time")}: ${hoursRecoverable}h/${t(locale, "mois", "month")}`,
      ctaUrl,
    ].filter(Boolean).join("\n"),
    ctaUrl,
    locale,
    templateVersion,
    summary,
  };
}

async function queueFollowupIfMissing(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  email: string,
  locale: "fr" | "en",
  templateKey: string,
  delayHours: number,
  parentTemplateKey: string
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
    metadata: {
      trigger: "go16_followup",
      parent_template_key: parentTemplateKey,
      template_version: "go16-email-v1",
    },
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
            "first_name, language, persona, health_score, health_label, stack_total_cost, estimated_waste, optimized_cost, annual_savings, hours_recoverable, email_preferences, stack_profile, stack_maturity, primary_risk, risk_flags, diagnostic_insights, action_state"
          )
          .eq("id", job.session_id)
          .single();

        if (sessionError || !session) {
          throw new Error(`Session lookup failed: ${sessionError?.message || "not found"}`);
        }

        const content = buildTemplateContent(job, session as SessionSnapshot, appBaseUrl);
        const emailQuality = validateDiagnosticEmailContent(content);
        const emailQualitySummary = summarizeDiagnosticEmailQuality(emailQuality);
        const qualityMetadata = {
          ...(job.metadata || {}),
          template_key: job.template_key,
          template_version: content.templateVersion,
          cta_url: content.ctaUrl,
          email_quality: emailQuality,
          email_quality_summary: emailQualitySummary,
        };

        if (emailQuality.status === "failed") {
          const message = `Email quality gate failed: ${emailQuality.flags
            .filter((flag) => flag.severity === "error")
            .map((flag) => flag.id)
            .join(", ")}`;

          await supabase
            .from("diagnostic_email_jobs")
            .update({
              status: "failed",
              failed_at: new Date().toISOString(),
              last_error: message.slice(0, 2000),
              metadata: qualityMetadata,
            })
            .eq("id", job.id)
            .eq("status", "processing");

          failed += 1;
          continue;
        }

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
              ...qualityMetadata,
              provider_message_id: providerMessageId,
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
          version: content.templateVersion,
          summary: {
            ...content.summary,
            email_quality: emailQualitySummary,
            subject: content.subject,
            recipient: job.email,
          },
          details: {
            provider: "resend",
            provider_message_id: providerMessageId,
            cta_url: content.ctaUrl,
            locale: content.locale,
            email_quality: emailQuality,
          },
          score_snapshot: {
            health_score: session.health_score,
            health_label: session.health_label,
            stack_total_cost: session.stack_total_cost,
            estimated_waste: session.estimated_waste,
            optimized_cost: session.optimized_cost,
            annual_savings: session.annual_savings,
            stack_profile: session.stack_profile,
            stack_maturity: session.stack_maturity,
            primary_risk: session.primary_risk,
            actions_completed: getCompletedActionCount(session.action_state),
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
              24,
              job.template_key
            );
          }
          if (prefs.checkIn === true) {
            await queueFollowupIfMissing(
              supabase,
              job.session_id,
              job.email,
              toLocale(job.locale || session.language),
              "diagnostic_followup_7d",
              24 * 7,
              job.template_key
            );
            await queueFollowupIfMissing(
              supabase,
              job.session_id,
              job.email,
              toLocale(job.locale || session.language),
              "diagnostic_reactivation_30d",
              24 * 30,
              job.template_key
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
