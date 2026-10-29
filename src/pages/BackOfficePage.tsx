import { Button, Input, Select, Textarea, TextLink, PageHeader, Field, IconButton } from "@/components/ui/primitives";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { AccountsDashboard } from "@/components/backoffice/AccountsDashboard";
import type { Session } from "@supabase/supabase-js";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useLang } from "@/hooks/useLang";
import { removeNoindex, setNoindex } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import {
  type BackofficeEmailJob,
  type BackofficeDashboardResponse,
  type BackofficeRestitution,
  type BackofficeSession,
  type BackofficeSessionDetailResponse,
  fetchBackofficeDashboard,
  fetchBackofficeSessionDetail,
  updateBackofficeEmailJob,
  updateBackofficeSessionAdmin,
} from "@/lib/backofficeApi";
import { buildBackofficePilotage, type PilotageLane, type PilotageRow } from "@/lib/backofficePilotage";
import {
  Activity,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  ExternalLink,
  Filter,
  FileText,
  Lock,
  LogOut,
  Layers3,
  Mail,
  Save,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Tag,
  TrendingDown,
  Users,
  X,
} from "@/lib/icons";

const LEGACY_SESSION_STORAGE_KEY = "tooltrim.backoffice.admin_session";
const LEGACY_STORAGE_KEY = "tooltrim.backoffice.admin_key";

type SessionStatus = "all" | "new" | "active" | "completed" | "abandoned";
type TabId = "accounts" | "preprod" | "pilotage" | "sessions" | "emails" | "restitutions" | "quality";
type RestitutionLike = Pick<BackofficeRestitution, "channel" | "summary" | "details" | "score_snapshot">;
type PreprodCheckStatus = "ok" | "warning" | "fail";
type AdminSession = {
  accessToken: string;
  email: string | null;
  expiresAt: string | null;
};

const SELECTION_AREA_TOTAL = 10;

function formatDateTime(value: string | null, locale: "fr" | "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(locale === "en" ? "en-US" : "fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return "0€";
  return `${Math.round(Number(value))}€`;
}

function humanizeId(value: string | null | undefined) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function textValue(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function numberRecordValue(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function localizedField(record: Record<string, unknown> | null, key: string, locale: "fr" | "en") {
  if (!record) return null;
  const localizedKey = `${key}${locale === "en" ? "En" : "Fr"}`;
  const value = record[localizedKey];
  return typeof value === "string" && value.trim() ? value : null;
}

function getInsightLabel(session: BackofficeSession, key: "profile" | "maturity", locale: "fr" | "en") {
  const root = asRecord(session.diagnostic_insights);
  const item = asRecord(root?.[key]);
  return localizedField(item, "label", locale) || humanizeId(key === "profile" ? session.stack_profile : session.stack_maturity);
}

function getSessionInsightRoot(session: BackofficeSession) {
  return asRecord(session.diagnostic_insights) || {};
}

function getSessionConfidence(session: BackofficeSession) {
  const confidence = asRecord(getSessionInsightRoot(session).confidence);
  return {
    score: numberRecordValue(confidence, "score"),
    labelFr: textValue(confidence, "labelFr"),
    labelEn: textValue(confidence, "labelEn"),
  };
}

function getSessionCalibration(session: BackofficeSession) {
  const calibration = asRecord(getSessionInsightRoot(session).calibration);
  const rawFlags = calibration?.flags;
  const flags = Array.isArray(rawFlags)
    ? rawFlags.map(asRecord).filter((flag): flag is Record<string, unknown> => !!flag)
    : [];
  return {
    score: numberRecordValue(calibration, "score"),
    reviewRequired: calibration?.reviewRequired === true,
    labelFr: textValue(calibration, "labelFr"),
    labelEn: textValue(calibration, "labelEn"),
    summaryFr: textValue(calibration, "summaryFr"),
    summaryEn: textValue(calibration, "summaryEn"),
    flags,
  };
}

function getSessionDiagnosticContext(session: BackofficeSession) {
  return asRecord(session.diagnostic_context) || {};
}

function getSelectionCoverage(session: BackofficeSession) {
  const context = getSessionDiagnosticContext(session);
  const coverage = asRecord(context.selection_coverage);
  const covered = Array.isArray(coverage?.covered)
    ? coverage.covered.filter((item): item is string => typeof item === "string")
    : [];
  const skipped = Array.isArray(coverage?.skipped)
    ? coverage.skipped.filter((item): item is string => typeof item === "string")
    : [];
  const confidenceValue = coverage?.confidence;
  const confidence =
    confidenceValue === "high" || confidenceValue === "medium" || confidenceValue === "low"
      ? confidenceValue
      : null;
  const checkedCount = covered.length + skipped.length;
  const missingCount = Math.max(SELECTION_AREA_TOTAL - checkedCount, 0);
  return {
    hasCoverage: Boolean(coverage),
    covered,
    skipped,
    confidence,
    coveredCount: covered.length,
    skippedCount: skipped.length,
    checkedCount,
    missingCount,
  };
}

function selectionConfidenceLabel(confidence: string | null, locale: "fr" | "en") {
  if (confidence === "high") return locale === "en" ? "High" : "Forte";
  if (confidence === "medium") return locale === "en" ? "Medium" : "Moyenne";
  if (confidence === "low") return locale === "en" ? "Low" : "Faible";
  return locale === "en" ? "Missing" : "Absente";
}

function selectionConfidenceClasses(confidence: string | null) {
  if (confidence === "high") return "bo-history-status-ok";
  if (confidence === "medium") return "bo-history-status-watch";
  return "bo-history-status-error";
}

function contextLabel(value: string | null, locale: "fr" | "en") {
  const labels: Record<string, { fr: string; en: string }> = {
    clear: { fr: "Profil clair", en: "Clear profile" },
    hybrid: { fr: "Profil hybride", en: "Hybrid profile" },
    unsure: { fr: "Profil à confirmer", en: "Profile to confirm" },
    reduce_costs: { fr: "Réduire les coûts", en: "Reduce costs" },
    save_time: { fr: "Gagner du temps", en: "Save time" },
    simplify: { fr: "Simplifier", en: "Simplify" },
    quality: { fr: "Mieux choisir", en: "Choose better" },
  };
  if (!value) return "—";
  return labels[value]?.[locale] || humanizeId(value);
}

function getLocalizedLabel(record: Record<string, unknown> | null, locale: "fr" | "en", fallback = "—") {
  return localizedField(record, "label", locale) || fallback;
}

function getFlagSeverity(flag: Record<string, unknown>) {
  const severity = flag.severity;
  return severity === "high" || severity === "medium" || severity === "low" ? severity : "low";
}

function qualitySeverityClasses(severity: string) {
  if (severity === "high") return "bo-history-status-error";
  if (severity === "medium") return "bo-history-status-watch";
  return "bo-history-status-muted";
}

function pilotageLaneLabel(lane: PilotageLane, locale: "fr" | "en") {
  const labels: Record<PilotageLane, { fr: string; en: string }> = {
    email: { fr: "Email", en: "Email" },
    quality: { fr: "Qualite", en: "Quality" },
    recovery: { fr: "Relance", en: "Recovery" },
    value: { fr: "Valeur", en: "Value" },
    watch: { fr: "Suivi", en: "Watch" },
  };
  return labels[lane][locale];
}

function pilotageLaneClasses(lane: PilotageLane) {
  if (lane === "email") return "bo-history-status-error";
  if (lane === "quality") return "bo-history-status-watch";
  if (lane === "recovery") return "bo-history-status-info";
  if (lane === "value") return "bo-history-status-ok";
  return "bo-history-status-muted";
}

function pilotagePriorityClasses(priority: PilotageRow["priorityLabel"]) {
  if (priority === "critical") return "bo-history-status-error";
  if (priority === "high") return "bo-history-status-watch";
  if (priority === "medium") return "bo-history-status-info";
  return "bo-history-status-muted";
}

function getRiskFlags(session: BackofficeSession) {
  return Array.isArray(session.risk_flags)
    ? session.risk_flags.map(asRecord).filter((flag): flag is Record<string, unknown> => !!flag)
    : [];
}

function getCompletedActionIds(session: BackofficeSession) {
  const ids = session.action_state?.completed_action_ids;
  return Array.isArray(ids) ? ids.filter((item): item is string => typeof item === "string") : [];
}

function getSessionStatus(session: BackofficeSession): Exclude<SessionStatus, "all"> {
  if (session.abandoned_at) return "abandoned";
  if (session.completed_at) return "completed";
  if ((session.last_step_id || 0) > 0) return "active";
  return "new";
}

function statusClasses(status: Exclude<SessionStatus, "all">) {
  if (status === "completed") return "bo-history-status-ok";
  if (status === "abandoned") return "bo-history-status-error";
  if (status === "active") return "bo-history-status-watch";
  return "bo-history-status-muted";
}

function emailStatusClasses(status: string) {
  if (["sent", "delivered", "opened", "clicked"].includes(status)) return "bo-history-status-ok";
  if (status === "failed") return "bo-history-status-error";
  if (status === "processing") return "bo-history-status-info";
  if (status === "queued") return "bo-history-status-watch";
  if (status === "cancelled") return "bo-history-status-muted";
  return "bo-history-status-muted";
}

function getJobMetadata(job: BackofficeEmailJob) {
  return asRecord(job.metadata) || {};
}

function getJobTemplateVersion(job: BackofficeEmailJob) {
  return textValue(getJobMetadata(job), "template_version") || "—";
}

function getJobTrigger(job: BackofficeEmailJob) {
  return textValue(getJobMetadata(job), "trigger") || textValue(getJobMetadata(job), "parent_template_key") || "—";
}

function getJobCtaUrl(job: BackofficeEmailJob) {
  return textValue(getJobMetadata(job), "cta_url");
}

function getPreprodUrl() {
  const raw =
    import.meta.env.VITE_PREPROD_APP_URL ||
    import.meta.env.VITE_TOOLTRIM_APP_URL ||
    "https://preprod.tooltrim.com/fr";
  return String(raw).replace(/\/+$/, "");
}

function isSessionCompleted(session: BackofficeSession) {
  return Boolean(session.completed_at);
}

function getCompletedAtTime(session: BackofficeSession) {
  const time = session.completed_at ? new Date(session.completed_at).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function hasMeaningfulDiagnosticPayload(session: BackofficeSession) {
  const context = asRecord(session.diagnostic_context);
  const insights = asRecord(session.diagnostic_insights);
  return Boolean(
    context?.persona_confidence &&
      context?.stack_goal &&
      insights?.profile &&
      insights?.maturity &&
      Array.isArray(session.functional_coverage) &&
      Array.isArray(session.risk_flags)
  );
}

function getDashboardRestitutionBySession(restitutions: BackofficeRestitution[]) {
  const map = new Map<string, BackofficeRestitution>();
  [...restitutions]
    .filter((restitution) => restitution.channel === "dashboard")
    .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())
    .forEach((restitution) => {
      if (!map.has(restitution.session_id)) map.set(restitution.session_id, restitution);
    });
  return map;
}

function preprodCheckClasses(status: PreprodCheckStatus) {
  if (status === "ok") return "bo-history-status-ok";
  if (status === "warning") return "bo-history-status-watch";
  return "bo-history-status-error";
}

function getJobEmailQuality(job: BackofficeEmailJob) {
  const metadata = getJobMetadata(job);
  const quality = asRecord(metadata.email_quality);
  const summary = asRecord(metadata.email_quality_summary);
  const flags = Array.isArray(quality?.flags)
    ? quality.flags.map(asRecord).filter((flag): flag is Record<string, unknown> => !!flag)
    : [];
  const status = textValue(quality, "status") || textValue(summary, "status");
  const score = numberRecordValue(quality, "score") ?? numberRecordValue(summary, "score");
  return {
    status: status || "pending",
    score,
    flags,
    flagIds: Array.isArray(summary?.flag_ids)
      ? summary.flag_ids.filter((item): item is string => typeof item === "string")
      : flags.map((flag) => String(flag.id || "")).filter(Boolean),
  };
}

function emailQualityClasses(status: string) {
  if (status === "passed") return "bo-history-status-ok";
  if (status === "warning") return "bo-history-status-watch";
  if (status === "failed") return "bo-history-status-error";
  return "bo-history-status-muted";
}

function getRestitutionTemplate(restitution: RestitutionLike) {
  const summary = asRecord(restitution.summary);
  return textValue(summary, "template_key") || textValue(summary, "profile_label") || restitution.channel;
}

function getRestitutionSubject(restitution: RestitutionLike) {
  const summary = asRecord(restitution.summary);
  return textValue(summary, "subject") || textValue(summary, "primary_risk_label") || "—";
}

function getRestitutionScore(restitution: RestitutionLike) {
  return numberRecordValue(asRecord(restitution.score_snapshot), "health_score");
}

function getRestitutionCtaUrl(restitution: RestitutionLike) {
  return textValue(asRecord(restitution.details), "cta_url");
}

function toCsvValue(value: unknown) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(" | ");
  const text = String(value).replaceAll('"', '""');
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text}"`;
  }
  return text;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Record<string, unknown>>) {
  const head = headers.join(",");
  const body = rows.map((row) => headers.map((key) => toCsvValue(row[key])).join(",")).join("\n");
  const csv = `${head}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parseTagsInput(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toAdminSession(session: Session | null): AdminSession | null {
  if (!session?.access_token) return null;
  return {
    accessToken: session.access_token,
    email: session.user.email || null,
    expiresAt: typeof session.expires_at === "number"
      ? new Date(session.expires_at * 1000).toISOString()
      : null,
  };
}

export default function BackOfficePage() {
  const { lang, t } = useLang();
  const account = useStackAccount();
  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [logoutCleanupWarning, setLogoutCleanupWarning] = useState(false);
  const locale = lang === "en" ? "en" : "fr";
  const loginId = useId();

  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [dashboard, setDashboard] = useState<BackofficeDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>("accounts");
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(150);
  const [personaFilter, setPersonaFilter] = useState<string>("all");
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<SessionStatus>("all");
  const [pilotageLaneFilter, setPilotageLaneFilter] = useState<PilotageLane | "all">("all");
  const [pilotagePriorityFilter, setPilotagePriorityFilter] = useState<PilotageRow["priorityLabel"] | "all">("all");
  const [search, setSearch] = useState("");

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<BackofficeSessionDetailResponse | null>(null);
  const [sessionTagsInput, setSessionTagsInput] = useState("");
  const [sessionNoteInput, setSessionNoteInput] = useState("");
  const [sessionAdminSaving, setSessionAdminSaving] = useState(false);
  const [sessionAdminMessage, setSessionAdminMessage] = useState<string | null>(null);
  const [emailJobActionLoadingId, setEmailJobActionLoadingId] = useState<string | null>(null);
  const [emailJobActionError, setEmailJobActionError] = useState<string | null>(null);

  useEffect(() => {
    setNoindex();
    return () => removeNoindex();
  }, []);

  useEffect(() => {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);

    void supabase.auth.getSession().then(({ data }) => {
      setAdminSession(toAdminSession(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdminSession(toAdminSession(session));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!adminSession || activeTab === "accounts") return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBackofficeDashboard(adminSession.accessToken, {
        days,
        limit,
        persona: personaFilter === "all" ? null : personaFilter,
      });
      setDashboard(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to load data";
      setError(message);
      if (message.toLowerCase().includes("unauthorized")) {
        setAdminSession(null);
        void supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  }, [adminSession, activeTab, days, limit, personaFilter]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!adminSession || activeTab === "accounts") return;
    const timer = setInterval(() => {
      void loadDashboard();
    }, 30000);
    return () => clearInterval(timer);
  }, [adminSession, activeTab, loadDashboard]);

  const openDetail = useCallback(
    async (sessionId: string) => {
      if (!adminSession) return;
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);
      setSessionAdminMessage(null);
      try {
        const response = await fetchBackofficeSessionDetail(adminSession.accessToken, sessionId);
        setDetail(response);
      } catch (e) {
        setDetailError(e instanceof Error ? e.message : "Unable to load session detail");
      } finally {
        setDetailLoading(false);
      }
    },
    [adminSession]
  );

  useEffect(() => {
    if (!detail?.session) return;
    setSessionTagsInput((detail.session.admin_tags || []).join(", "));
    setSessionNoteInput(detail.session.admin_note || "");
  }, [detail]);

  const personaOptions = useMemo(() => {
    const personas = new Set(
      (dashboard?.sessions || [])
        .map((session) => session.persona || "")
        .filter((persona) => persona.length > 0)
    );
    return ["all", ...Array.from(personas).sort()];
  }, [dashboard]);

  const profileOptions = useMemo(() => {
    const profiles = new Set(
      (dashboard?.sessions || [])
        .map((session) => session.stack_profile || "")
        .filter((profile) => profile.length > 0)
    );
    return ["all", ...Array.from(profiles).sort()];
  }, [dashboard]);

  const filteredSessions = useMemo(() => {
    const list = dashboard?.sessions || [];
    const q = search.trim().toLowerCase();
    return list.filter((session) => {
      const status = getSessionStatus(session);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (profileFilter !== "all" && session.stack_profile !== profileFilter) return false;
      if (!q) return true;
      const haystack = [
        session.first_name || "",
        session.email || "",
        session.persona || "",
        session.stack_profile || "",
        session.primary_risk || "",
        session.session_id || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [dashboard, profileFilter, search, statusFilter]);

  const kpis = useMemo(() => {
    const sessions = filteredSessions;
    const total = sessions.length;
    const completed = sessions.filter((s) => !!s.completed_at).length;
    const avgHealthRaw = sessions
      .map((s) => s.health_score)
      .filter((value): value is number => value != null);
    const avgHealth = avgHealthRaw.length
      ? Math.round(avgHealthRaw.reduce((sum, value) => sum + value, 0) / avgHealthRaw.length)
      : 0;
    const monthlyWaste = Math.round(
      sessions.reduce((sum, s) => sum + Number(s.estimated_waste || 0), 0)
    );
    const sentJobs = sessions.reduce((sum, s) => sum + Number(s.email_sent_count || 0), 0);
    const totalJobs = sessions.reduce((sum, s) => sum + Number(s.email_jobs_count || 0), 0);
    const emailSuccessRate = totalJobs > 0 ? Math.round((sentJobs / totalJobs) * 100) : 0;
    return {
      total,
      completed,
      avgHealth,
      monthlyWaste,
      emailSuccessRate,
    };
  }, [filteredSessions]);

  const emailSummary = useMemo(() => {
    const rows = dashboard?.emailHealth || [];
    return rows.reduce(
      (acc, row) => {
        acc.total += Number(row.total_jobs || 0);
        acc.sent += Number(row.sent_jobs || 0);
        acc.delivered += Number(row.delivered_jobs || 0);
        acc.opened += Number(row.opened_jobs || 0);
        acc.clicked += Number(row.clicked_jobs || 0);
        acc.failed += Number(row.failed_jobs || 0);
        return acc;
      },
      { total: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 }
    );
  }, [dashboard]);

  const emailOpsSummary = useMemo(() => {
    const jobs = dashboard?.recentEmailJobs || [];
    const now = Date.now();
    return jobs.reduce(
      (acc, job) => {
        if (job.status === "queued") {
          acc.queued += 1;
          const scheduledAt = new Date(job.scheduled_for).getTime();
          if (!Number.isNaN(scheduledAt) && scheduledAt <= now) acc.dueNow += 1;
        }
        if (job.status === "processing") acc.processing += 1;
        if (job.status === "failed") acc.failed += 1;
        if (job.status === "cancelled") acc.cancelled += 1;
        return acc;
      },
      { queued: 0, dueNow: 0, processing: 0, failed: 0, cancelled: 0 }
    );
  }, [dashboard?.recentEmailJobs]);

  const restitutionSummary = useMemo(() => {
    const restitutions = dashboard?.recentRestitutions || [];
    return restitutions.reduce(
      (acc, restitution) => {
        acc.total += 1;
        if (restitution.channel === "email") acc.email += 1;
        if (restitution.channel === "dashboard") acc.dashboard += 1;
        if (restitution.channel === "pdf") acc.pdf += 1;
        if (restitution.version.includes("go10")) acc.go10 += 1;
        return acc;
      },
      { total: 0, email: 0, dashboard: 0, pdf: 0, go10: 0 }
    );
  }, [dashboard?.recentRestitutions]);

  const preprodSelectorUrl = useMemo(() => `${getPreprodUrl()}/selector`, []);

  const preprodSummary = useMemo(() => {
    const sessions = dashboard?.sessions || [];
    const restitutions = dashboard?.recentRestitutions || [];
    const dashboardRestitutions = getDashboardRestitutionBySession(restitutions);
    const completedSessions = sessions
      .filter(isSessionCompleted)
      .sort((a, b) => getCompletedAtTime(b) - getCompletedAtTime(a));
    const latestCompleted = completedSessions[0] || null;
    const latestRestitution = latestCompleted ? dashboardRestitutions.get(latestCompleted.session_id) || null : null;
    const completedMissingRestitution = completedSessions.filter(
      (session) => !dashboardRestitutions.has(session.session_id)
    );
    const completedMissingEmailJob = completedSessions.filter(
      (session) => Boolean(session.email) && Number(session.email_jobs_count || 0) === 0
    );
    const completedWithEmailFailure = completedSessions.filter(
      (session) => Number(session.email_failed_count || 0) > 0
    );
    const latestHasJourney =
      latestCompleted != null &&
      (latestCompleted.max_step_seen || latestCompleted.last_step_id || 0) >= 12 &&
      Number(latestCompleted.event_count || 0) >= 10;
    const latestHasEmail =
      latestCompleted != null &&
      (!latestCompleted.email || Number(latestCompleted.email_jobs_count || 0) > 0);
    const latestHasPayload = latestCompleted ? hasMeaningfulDiagnosticPayload(latestCompleted) : false;
    const checks = [
      {
        id: "session",
        labelFr: "Session complète récente",
        labelEn: "Recent completed session",
        status: latestCompleted ? "ok" : "fail",
        detail: latestCompleted?.completed_at || "missing",
      },
      {
        id: "journey",
        labelFr: "Parcours et événements",
        labelEn: "Journey and events",
        status: latestHasJourney ? "ok" : "fail",
        detail: latestCompleted
          ? `step=${latestCompleted.max_step_seen ?? latestCompleted.last_step_id ?? "?"} events=${latestCompleted.event_count || 0}`
          : "missing",
      },
      {
        id: "payload",
        labelFr: "Données diagnostic",
        labelEn: "Diagnostic payload",
        status: latestHasPayload ? "ok" : "fail",
        detail: latestCompleted?.stack_profile || "missing",
      },
      {
        id: "restitution",
        labelFr: "Restitution dashboard",
        labelEn: "Dashboard restitution",
        status: latestRestitution ? "ok" : "fail",
        detail: latestRestitution?.id || "missing",
      },
      {
        id: "email",
        labelFr: "Job email si email présent",
        labelEn: "Email job when email exists",
        status: latestHasEmail ? "ok" : "warning",
        detail: latestCompleted?.email ? `${latestCompleted.email_sent_count}/${latestCompleted.email_jobs_count}` : "no email",
      },
    ] satisfies Array<{
      id: string;
      labelFr: string;
      labelEn: string;
      status: PreprodCheckStatus;
      detail: string;
    }>;
    const failed = checks.filter((check) => check.status === "fail").length;
    const warnings = checks.filter((check) => check.status === "warning").length;
    const verdict: PreprodCheckStatus = failed > 0 ? "fail" : warnings > 0 ? "warning" : "ok";

    return {
      completedSessions,
      latestCompleted,
      latestRestitution,
      completedMissingRestitution,
      completedMissingEmailJob,
      completedWithEmailFailure,
      checks,
      failed,
      warnings,
      verdict,
    };
  }, [dashboard?.recentRestitutions, dashboard?.sessions]);

  const qualityRows = useMemo(() => {
    return filteredSessions
      .map((session) => {
        const confidence = getSessionConfidence(session);
        const calibration = getSessionCalibration(session);
        const highFlagCount = calibration.flags.filter((flag) => getFlagSeverity(flag) === "high").length;
        const mediumFlagCount = calibration.flags.filter((flag) => getFlagSeverity(flag) === "medium").length;
        const hasConfidence = confidence.score != null;
        const hasCalibration = calibration.score != null;
        const reviewRequired =
          calibration.reviewRequired ||
          !hasConfidence ||
          !hasCalibration ||
          highFlagCount > 0 ||
          (confidence.score != null && confidence.score < 60);

        return {
          session,
          confidenceScore: confidence.score,
          confidenceLabel: locale === "en" ? confidence.labelEn : confidence.labelFr,
          calibrationScore: calibration.score,
          calibrationLabel: locale === "en" ? calibration.labelEn : calibration.labelFr,
          calibrationSummary: locale === "en" ? calibration.summaryEn : calibration.summaryFr,
          reviewRequired,
          flags: calibration.flags,
          highFlagCount,
          mediumFlagCount,
          hasConfidence,
          hasCalibration,
        };
      })
      .filter((row) => row.reviewRequired || row.flags.length > 0)
      .sort(
        (a, b) =>
          Number(b.reviewRequired) - Number(a.reviewRequired) ||
          b.highFlagCount - a.highFlagCount ||
          b.mediumFlagCount - a.mediumFlagCount ||
          (a.confidenceScore ?? -1) - (b.confidenceScore ?? -1) ||
          new Date(b.session.created_at).getTime() - new Date(a.session.created_at).getTime()
      );
  }, [filteredSessions, locale]);

  const qualitySummary = useMemo(() => {
    const confidenceScores = filteredSessions
      .map((session) => getSessionConfidence(session).score)
      .filter((score): score is number => score != null);
    const avgConfidence = confidenceScores.length
      ? Math.round(confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length)
      : 0;
    return {
      reviewRequired: qualityRows.filter((row) => row.reviewRequired).length,
      avgConfidence,
      highFlags: qualityRows.reduce((sum, row) => sum + row.highFlagCount, 0),
      mediumFlags: qualityRows.reduce((sum, row) => sum + row.mediumFlagCount, 0),
      lowConfidence: filteredSessions.filter((session) => {
        const score = getSessionConfidence(session).score;
        return score == null || score < 60;
      }).length,
    };
  }, [filteredSessions, qualityRows]);

  const selectionQualityRows = useMemo(() => {
    return filteredSessions
      .map((session) => {
        const coverage = getSelectionCoverage(session);
        const reviewRequired =
          !coverage.hasCoverage ||
          coverage.confidence === "low" ||
          coverage.coveredCount < 4 ||
          coverage.missingCount > 3;
        return {
          session,
          coverage,
          reviewRequired,
        };
      })
      .filter((row) => row.reviewRequired || row.coverage.skippedCount > 0)
      .sort(
        (a, b) =>
          Number(b.reviewRequired) - Number(a.reviewRequired) ||
          b.coverage.missingCount - a.coverage.missingCount ||
          a.coverage.coveredCount - b.coverage.coveredCount ||
          new Date(b.session.created_at).getTime() - new Date(a.session.created_at).getTime()
      );
  }, [filteredSessions]);

  const selectionQualitySummary = useMemo(() => {
    const coverages = filteredSessions.map(getSelectionCoverage);
    const withCoverage = coverages.filter((coverage) => coverage.hasCoverage);
    const avgCovered = withCoverage.length
      ? Math.round(withCoverage.reduce((sum, coverage) => sum + coverage.coveredCount, 0) / withCoverage.length)
      : 0;
    return {
      missingCoverage: coverages.filter((coverage) => !coverage.hasCoverage).length,
      lowCoverage: coverages.filter((coverage) => coverage.hasCoverage && coverage.coveredCount < 4).length,
      skippedAreas: coverages.reduce((sum, coverage) => sum + coverage.skippedCount, 0),
      avgCovered,
      reviewRequired: selectionQualityRows.filter((row) => row.reviewRequired).length,
    };
  }, [filteredSessions, selectionQualityRows]);

  const pilotage = useMemo(() => buildBackofficePilotage(filteredSessions), [filteredSessions]);
  const filteredPilotageRows = useMemo(() => {
    return pilotage.rows.filter((row) => {
      if (pilotageLaneFilter !== "all" && row.lane !== pilotageLaneFilter) return false;
      if (pilotagePriorityFilter !== "all" && row.priorityLabel !== pilotagePriorityFilter) return false;
      return true;
    });
  }, [pilotage.rows, pilotageLaneFilter, pilotagePriorityFilter]);

  const connect = useCallback(async () => {
    const email = adminEmailInput.trim();
    const password = adminPasswordInput;
    if (!email || !password || account.authBusy) return;
    setAuthLoading(true);
    setError(null);
    try {
      let session: Session | null;
      if (account.enabled) {
        const result = await account.signInWithPassword(email, password);
        if (!result.ok) throw new Error(t("Connexion impossible. Vérifiez vos identifiants ou réessayez plus tard.", "Unable to sign in. Check your credentials or try again later."));
        session = (await supabase.auth.getSession()).data.session;
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        session = data.session;
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      setAdminSession(toAdminSession(session));
      setAdminPasswordInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Connexion impossible", "Unable to sign in"));
    } finally {
      setAuthLoading(false);
    }
  }, [adminEmailInput, adminPasswordInput, account, t]);

  const disconnect = useCallback(async (discardUnsaved = false) => {
    if (authLoading) return;
    setLogoutError(false);
    if (account.enabled && account.hasUnsavedChanges && !discardUnsaved) {
      setLogoutPrompt(true);
      await account.signOut();
      return;
    }
    setAuthLoading(true);
    try {
      if (account.enabled) {
        if (!await account.signOut({ discardUnsaved })) { setLogoutError(true); return; }
      } else {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      }
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      } catch { setLogoutCleanupWarning(true); }
      setLogoutPrompt(false);
      setAdminSession(null);
      setDashboard(null);
      setDetail(null);
      setError(null);
      setDetailError(null);
    } catch { setLogoutError(true); }
    finally { setAuthLoading(false); }
  }, [account, authLoading]);

  const saveSessionAdmin = useCallback(async () => {
    if (!adminSession || !detail?.session?.session_id) return;
    setSessionAdminSaving(true);
    setSessionAdminMessage(null);
    try {
      const tags = parseTagsInput(sessionTagsInput);
      const result = await updateBackofficeSessionAdmin(adminSession.accessToken, {
        sessionId: detail.session.session_id,
        tags,
        note: sessionNoteInput.trim() || null,
      });

      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          session: {
            ...prev.session,
            admin_tags: result.session.admin_tags,
            admin_note: result.session.admin_note,
            admin_updated_at: result.session.admin_updated_at,
          },
        };
      });
      setSessionTagsInput(result.session.admin_tags.join(", "));
      setSessionNoteInput(result.session.admin_note || "");
      setSessionAdminMessage(t("Annotations enregistrées", "Annotations saved"));
      void loadDashboard();
    } catch (e) {
      setSessionAdminMessage(
        e instanceof Error ? e.message : t("Échec enregistrement", "Save failed")
      );
    } finally {
      setSessionAdminSaving(false);
    }
  }, [adminSession, detail?.session?.session_id, loadDashboard, sessionNoteInput, sessionTagsInput, t]);

  const runEmailJobAction = useCallback(
    async (job: BackofficeEmailJob, action: "retry_now" | "cancel" | "schedule") => {
      if (!adminSession) return;
      setEmailJobActionLoadingId(job.id);
      setEmailJobActionError(null);
      try {
        const scheduledFor =
          action === "schedule"
            ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
            : undefined;
        const result = await updateBackofficeEmailJob(adminSession.accessToken, {
          jobId: job.id,
          action,
          scheduledFor,
        });

        setDashboard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentEmailJobs: prev.recentEmailJobs.map((current) =>
              current.id === result.job.id
                ? {
                    ...current,
                    ...result.job,
                  }
                : current
            ),
          };
        });

        if (detail?.session?.session_id === result.job.session_id) {
          const refreshed = await fetchBackofficeSessionDetail(adminSession.accessToken, result.job.session_id);
          setDetail(refreshed);
        }
        void loadDashboard();
      } catch (e) {
        setEmailJobActionError(
          e instanceof Error ? e.message : t("Action email impossible", "Email action failed")
        );
      } finally {
        setEmailJobActionLoadingId(null);
      }
    },
    [adminSession, detail?.session?.session_id, loadDashboard, t]
  );

  const exportSessionsCsv = useCallback(() => {
    const rows = filteredSessions.map((session) => {
      const context = getSessionDiagnosticContext(session);
      return {
        session_id: session.session_id,
        created_at: session.created_at,
        updated_at: session.updated_at,
        completed_at: session.completed_at,
        abandoned_at: session.abandoned_at,
        last_client_seen_at: session.last_client_seen_at,
        resumed_at: session.resumed_at,
        first_name: session.first_name,
        email: session.email,
        persona: session.persona,
        persona_confidence: textValue(context, "persona_confidence"),
        stack_goal: textValue(context, "stack_goal"),
        stack_profile: session.stack_profile,
        stack_maturity: session.stack_maturity,
        primary_risk: session.primary_risk,
        risk_flags_count: getRiskFlags(session).length,
        status: getSessionStatus(session),
        health_score: session.health_score,
        estimated_waste: session.estimated_waste,
        annual_savings: session.annual_savings,
        max_step_seen: session.max_step_seen,
        email_jobs_count: session.email_jobs_count,
        email_sent_count: session.email_sent_count,
        email_failed_count: session.email_failed_count,
        admin_tags: session.admin_tags || [],
        admin_note: session.admin_note,
        admin_updated_at: session.admin_updated_at,
        action_completed_ids: getCompletedActionIds(session),
        recovered_savings: typeof session.action_state?.recovered_savings === "number"
          ? session.action_state.recovered_savings
          : "",
      };
    });
    downloadCsv(
      `tooltrim-backoffice-sessions-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "session_id",
        "created_at",
        "updated_at",
        "completed_at",
        "abandoned_at",
        "last_client_seen_at",
        "resumed_at",
        "first_name",
        "email",
        "persona",
        "persona_confidence",
        "stack_goal",
        "stack_profile",
        "stack_maturity",
        "primary_risk",
        "risk_flags_count",
        "status",
        "health_score",
        "estimated_waste",
        "annual_savings",
        "max_step_seen",
        "email_jobs_count",
        "email_sent_count",
        "email_failed_count",
        "admin_tags",
        "admin_note",
        "admin_updated_at",
        "action_completed_ids",
        "recovered_savings",
      ],
      rows
    );
  }, [filteredSessions]);

  const exportEmailCsv = useCallback(() => {
    const rows = (dashboard?.recentEmailJobs || []).map((job) => {
      const quality = getJobEmailQuality(job);
      return {
        id: job.id,
        session_id: job.session_id,
        email: job.email,
        template_key: job.template_key,
        locale: job.locale,
        status: job.status,
        quality_status: quality.status,
        quality_score: quality.score ?? "",
        quality_flags: quality.flagIds,
        attempts: job.attempts,
        provider: job.provider,
        provider_message_id: job.provider_message_id,
        scheduled_for: job.scheduled_for,
        sent_at: job.sent_at,
        delivered_at: job.delivered_at,
        opened_at: job.opened_at,
        clicked_at: job.clicked_at,
        failed_at: job.failed_at,
        last_error: job.last_error,
        created_at: job.created_at,
        updated_at: job.updated_at,
      };
    });
    downloadCsv(
      `tooltrim-backoffice-email-jobs-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "id",
        "session_id",
        "email",
        "template_key",
        "locale",
        "status",
        "quality_status",
        "quality_score",
        "quality_flags",
        "attempts",
        "provider",
        "provider_message_id",
        "scheduled_for",
        "sent_at",
        "delivered_at",
        "opened_at",
        "clicked_at",
        "failed_at",
        "last_error",
        "created_at",
        "updated_at",
      ],
      rows
    );
  }, [dashboard?.recentEmailJobs]);

  const exportPilotageCsv = useCallback(() => {
    const rows = filteredPilotageRows.map((row) => ({
      session_id: row.sessionId,
      created_at: row.createdAt,
      first_name: row.firstName,
      email: row.email,
      persona: row.persona,
      persona_confidence: row.personaConfidence,
      stack_goal: row.stackGoal,
      profile: row.profile,
      status: row.status,
      lane: row.lane,
      priority_score: row.priorityScore,
      priority_label: row.priorityLabel,
      action: locale === "en" ? row.actionEn : row.actionFr,
      reasons: locale === "en" ? row.reasonsEn : row.reasonsFr,
      health_score: row.healthScore,
      estimated_waste: row.monthlyWaste,
      annual_savings: row.annualSavings,
      email_failed_count: row.emailFailedCount,
      email_sent_count: row.emailSentCount,
      email_jobs_count: row.emailJobsCount,
      review_required: row.reviewRequired,
    }));
    downloadCsv(
      `tooltrim-backoffice-pilotage-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "session_id",
        "created_at",
        "first_name",
        "email",
        "persona",
        "persona_confidence",
        "stack_goal",
        "profile",
        "status",
        "lane",
        "priority_score",
        "priority_label",
        "action",
        "reasons",
        "health_score",
        "estimated_waste",
        "annual_savings",
        "email_failed_count",
        "email_sent_count",
        "email_jobs_count",
        "review_required",
      ],
      rows
    );
  }, [filteredPilotageRows, locale]);

  const exportRestitutionsCsv = useCallback(() => {
    const rows = (dashboard?.recentRestitutions || []).map((restitution) => {
      const summary = asRecord(restitution.summary);
      const score = asRecord(restitution.score_snapshot);
      return {
        id: restitution.id,
        session_id: restitution.session_id,
        generated_at: restitution.generated_at,
        channel: restitution.channel,
        version: restitution.version,
        template_key: textValue(summary, "template_key"),
        subject: textValue(summary, "subject"),
        profile: textValue(summary, "profile"),
        profile_label: textValue(summary, "profile_label"),
        primary_risk: textValue(summary, "primary_risk"),
        primary_risk_label: textValue(summary, "primary_risk_label"),
        focus_area_count: numberRecordValue(summary, "focus_area_count"),
        completed_action_count: numberRecordValue(summary, "completed_action_count"),
        health_score: numberRecordValue(score, "health_score"),
        estimated_waste: numberRecordValue(score, "estimated_waste"),
        annual_savings: numberRecordValue(score, "annual_savings"),
      };
    });
    downloadCsv(
      `tooltrim-backoffice-restitutions-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "id",
        "session_id",
        "generated_at",
        "channel",
        "version",
        "template_key",
        "subject",
        "profile",
        "profile_label",
        "primary_risk",
        "primary_risk_label",
        "focus_area_count",
        "completed_action_count",
        "health_score",
        "estimated_waste",
        "annual_savings",
      ],
      rows
    );
  }, [dashboard?.recentRestitutions]);

  const exportQualityCsv = useCallback(() => {
    const rows = qualityRows.map((row) => {
      const context = getSessionDiagnosticContext(row.session);
      return {
        session_id: row.session.session_id,
        created_at: row.session.created_at,
        completed_at: row.session.completed_at,
        email: row.session.email,
        persona: row.session.persona,
        persona_confidence: textValue(context, "persona_confidence"),
        stack_goal: textValue(context, "stack_goal"),
        stack_profile: row.session.stack_profile,
        health_score: row.session.health_score,
        estimated_waste: row.session.estimated_waste,
        confidence_score: row.confidenceScore ?? "",
        confidence_label: row.confidenceLabel || "",
        calibration_score: row.calibrationScore ?? "",
        calibration_label: row.calibrationLabel || "",
        review_required: row.reviewRequired,
        high_flags: row.highFlagCount,
        medium_flags: row.mediumFlagCount,
        flags: row.flags.map((flag) => getLocalizedLabel(flag, locale, humanizeId(String(flag.id || "")))),
        actions: row.flags.map((flag) => localizedField(flag, "action", locale) || ""),
        calibration_summary: row.calibrationSummary || "",
        admin_tags: row.session.admin_tags || [],
      };
    });
    downloadCsv(
      `tooltrim-backoffice-quality-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "session_id",
        "created_at",
        "completed_at",
        "email",
        "persona",
        "persona_confidence",
        "stack_goal",
        "stack_profile",
        "health_score",
        "estimated_waste",
        "confidence_score",
        "confidence_label",
        "calibration_score",
        "calibration_label",
        "review_required",
        "high_flags",
        "medium_flags",
        "flags",
        "actions",
        "calibration_summary",
        "admin_tags",
      ],
      rows
    );
  }, [locale, qualityRows]);

  const logoutFeedback = <>
    {logoutError && <p className="bo-history-login-error" role="alert">{t("La déconnexion a échoué. Réessayez.", "Sign-out failed. Please try again.")}</p>}
    {(account.privacyWarning || logoutCleanupWarning) && <p className="bo-history-login-error" role="alert">{account.privacyWarning === "ACCOUNT_LOCAL_RECOVERY_PENDING"
      ? t("Certaines données locales n’ont pas encore pu être récupérées. Elles sont conservées sur cet appareil pour une nouvelle tentative.", "Some local data could not be recovered yet. It remains on this device for another attempt.")
      : t("L’affichage personnel a été effacé, mais le navigateur a bloqué une partie du nettoyage. Effacez les données du site ToolTrim dans les réglages de votre navigateur avant de fermer cet appareil partagé.", "Your personal view was cleared, but the browser blocked part of the cleanup. Clear ToolTrim site data in your browser settings before leaving this shared device.")}</p>}
    {logoutPrompt && <div className="bo-logout-choice" aria-busy={authLoading}>
      <p>{t("Certaines modifications ne sont pas enregistrées. Les abandonner en vous déconnectant ?", "Some changes are not saved. Discard them and sign out?")}</p>
      <div className="bo-catalog-actions">
        <Button variant="secondary" type="button"  disabled={authLoading} onClick={() => void disconnect(true)}>{t("Me déconnecter sans enregistrer", "Sign out without saving")}</Button>
        <Button variant="quiet" type="button"  disabled={authLoading} onClick={() => setLogoutPrompt(false)}>{t("Continuer mes modifications", "Keep editing")}</Button>
      </div>
    </div>}
  </>;

  if (!adminSession) {
    return (
      <section className="bo-history-shell bo-history-access" aria-labelledby={`${loginId}-page-title`}>
        <Breadcrumb items={[{ label: t("Back-office", "Back office") }]} includeSchema={false}/>
        <PageHeader className="bo-history-entry-header" title={<span id={`${loginId}-page-title`}>{t("Back-office ToolTrim", "ToolTrim back office")}</span>}
          description={t("Retrouvez les comptes et les stacks enregistrées.", "View accounts and their saved stacks.")} />
        {logoutFeedback}
        <form className="bo-history-login" aria-label={t("Connexion administrateur", "Administrator sign-in")} aria-busy={authLoading}
          onSubmit={event => { event.preventDefault(); void connect(); }}>
          <div className="bo-history-login-heading"><Lock size={20} aria-hidden="true"/><h2>{t("Accès administrateur", "Administrator access")}</h2></div>
          <p className="bo-history-login-intro">{t("Connectez-vous avec votre e-mail et votre mot de passe administrateur.", "Sign in with your admin email and password.")}</p>
          {error && <p id={`${loginId}-error`} className="bo-history-login-error" role="alert">{error}</p>}
          <Field label={t("E-mail administrateur", "Admin email")}>
            <Input id={`${loginId}-email`} type="email" name="username" autoComplete="username" inputMode="email" required
              value={adminEmailInput} onChange={event => setAdminEmailInput(event.target.value)} disabled={authLoading}
              aria-describedby={error ? `${loginId}-error` : undefined}/>
          </Field>
          <Field label={t("Mot de passe", "Password")}>
            <Input id={`${loginId}-password`} type="password" name="password" autoComplete="current-password" required
              value={adminPasswordInput} onChange={event => setAdminPasswordInput(event.target.value)} disabled={authLoading}
              aria-describedby={error ? `${loginId}-error` : undefined}/>
          </Field>
          <Button variant="primary" type="submit" className="bo-history-login-submit" loading={authLoading}>
            {authLoading ? t("Connexion…", "Signing in…") : t("Se connecter", "Sign in")}
          </Button>
          <p className="bo-history-login-note">{t("L’accès est réservé aux comptes autorisés côté serveur.", "Access is restricted to accounts authorized by the server.")}</p>
        </form>
      </section>
    );
  }

  if (activeTab === "accounts") return (
    <div className="bo-shell">
      <Breadcrumb items={[{ label: t("Back-office", "Back office") }]} includeSchema={false}/>
      <div className="bo-account-toolbar"><p>{t("Administration", "Administration")}<span aria-hidden> · </span>{adminSession.email || t("Compte connecté", "Signed-in account")}</p>
        <Button variant="secondary" className="bo-signout" disabled={authLoading} onClick={() => void disconnect()} icon={<LogOut size={16} aria-hidden/>}>{t("Fermer", "Sign out")}</Button>
      </div>
      {logoutFeedback}
      <AccountsDashboard key={adminSession.accessToken} initialView="overview" onOpenHistory={() => setActiveTab("preprod")}/>
    </div>
  );

  return (
    <div className="bo-history-max-w-1400px bo-history-mx-auto bo-history-px-4 bo-history-py-6 bo-history-md-py-10 bo-history-space-y-6">
      <Button variant="secondary"  onClick={() => setActiveTab("accounts")}>{t("Comptes et stacks", "Accounts and stacks")}</Button>
      <PageHeader title={t("Back-office diagnostic", "Diagnostic back office")}
        description={t("Pilotage onboarding, scoring, persistance et cycle email.", "Operational view for onboarding, scoring, persistence, and email lifecycle.")}
        actions={
        <div className="bo-history-flex bo-history-flex-wrap bo-history-items-center bo-history-gap-2">
          <span className="bo-history-h-9 bo-history-px-3 bo-history-rounded-md bo-history-border bo-history-border-border bo-history-text-xs bo-history-inline-flex bo-history-items-center bo-history-text-muted-foreground">
            {adminSession.email || t("Admin connecté", "Signed-in admin")}
            {adminSession.expiresAt ? ` · ${formatDateTime(adminSession.expiresAt, locale)}` : ""}
          </span>
          <Button variant="secondary"
            onClick={
              activeTab === "pilotage"
                ? exportPilotageCsv
                : activeTab === "sessions"
                ? exportSessionsCsv
                : activeTab === "emails"
                  ? exportEmailCsv
                  : activeTab === "restitutions"
                    ? exportRestitutionsCsv
                    : exportQualityCsv
            }
          >
            <Download className="bo-history-w-4 bo-history-h-4" />
            {t("Exporter CSV", "Export CSV")}
          </Button>
          <Button variant="secondary"
            onClick={() => void loadDashboard()}
          >
            <RefreshCw className={`bo-history-w-4 bo-history-h-4 ${loading ? "bo-history-animate-spin" : ""}`} />
            {t("Rafraîchir", "Refresh")}
          </Button>
          <Button variant="secondary"
            disabled={authLoading} onClick={() => void disconnect()}
          >
            <LogOut className="bo-history-w-4 bo-history-h-4" />
            {t("Fermer", "Sign out")}
          </Button>
        </div>} />

      {logoutFeedback}
      {error && (
        <div role="alert" className="bo-history-border bo-history-border-red-300 bo-history-bg-red-50 bo-history-text-red-700 bo-history-rounded-lg bo-history-px-4 bo-history-py-3 bo-history-text-sm">
          {error}
        </div>
      )}

      <div className="bo-history-grid bo-history-grid-cols-1 bo-history-md-grid-cols-2 bo-history-xl-grid-cols-5 bo-history-gap-3">
        <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-4 bo-history-bg-card">
          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Sessions", "Sessions")}</div>
          <div className="bo-history-mt-2 bo-history-text-2xl bo-history-font-semibold">{kpis.total}</div>
        </div>
        <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-4 bo-history-bg-card">
          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Terminées", "Completed")}</div>
          <div className="bo-history-mt-2 bo-history-text-2xl bo-history-font-semibold">{kpis.completed}</div>
        </div>
        <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-4 bo-history-bg-card">
          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Score moyen", "Average score")}</div>
          <div className="bo-history-mt-2 bo-history-text-2xl bo-history-font-semibold">{kpis.avgHealth}</div>
        </div>
        <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-4 bo-history-bg-card">
          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Gaspillage cumulé/mois", "Cumulative waste/mo")}</div>
          <div className="bo-history-mt-2 bo-history-text-2xl bo-history-font-semibold">{formatMoney(kpis.monthlyWaste)}</div>
        </div>
        <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-4 bo-history-bg-card">
          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Succès envoi email", "Email send success")}</div>
          <div className="bo-history-mt-2 bo-history-text-2xl bo-history-font-semibold">{kpis.emailSuccessRate}%</div>
        </div>
      </div>

      <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3 bo-history-flex bo-history-flex-col bo-history-xl-flex-row bo-history-gap-3 bo-history-xl-items-center">
        <div className="bo-history-search">
          <Search className="bo-history-search-icon" aria-hidden="true" />
          <Input type="search" aria-label={t("Chercher une session", "Search sessions")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("Chercher email, prénom, session…", "Search email, first name, session…")}
          />
        </div>

        <div className="bo-history-flex bo-history-items-center bo-history-gap-2 bo-history-text-xs bo-history-text-muted-foreground">
          <Filter className="bo-history-w-4 bo-history-h-4" />
          {t("Filtres", "Filters")}
        </div>

        <Select aria-label={t("Période", "Period")}
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
        >
          <option value={7}>{t("7 jours", "7 days")}</option>
          <option value={30}>{t("30 jours", "30 days")}</option>
          <option value={90}>{t("90 jours", "90 days")}</option>
        </Select>

        <Select aria-label={t("Persona", "Persona")}
          value={personaFilter}
          onChange={(event) => setPersonaFilter(event.target.value)}
        >
          {personaOptions.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? t("Toutes personas", "All personas") : value}
            </option>
          ))}
        </Select>

        <Select aria-label={t("Profil", "Profile")}
          value={profileFilter}
          onChange={(event) => setProfileFilter(event.target.value)}
        >
          {profileOptions.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? t("Tous profils", "All profiles") : humanizeId(value)}
            </option>
          ))}
        </Select>

        <Select aria-label={t("Statut", "Status")}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as SessionStatus)}
        >
          <option value="all">{t("Tous statuts", "All statuses")}</option>
          <option value="new">{t("Nouvelles", "New")}</option>
          <option value="active">{t("En cours", "In progress")}</option>
          <option value="completed">{t("Terminées", "Completed")}</option>
          <option value="abandoned">{t("Abandonnées", "Abandoned")}</option>
        </Select>

        <Select aria-label={t("Limite de sessions", "Session limit")}
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value))}
        >
          <option value={100}>100</option>
          <option value={150}>150</option>
          <option value={250}>250</option>
        </Select>
      </div>

      <div className="bo-history-flex bo-history-flex-wrap bo-history-items-center bo-history-gap-2">
        <Button
          onClick={() => setActiveTab("preprod")}
          variant={activeTab === "preprod" ? "primary" : "secondary"} aria-pressed={activeTab === "preprod"}
        >
          <ClipboardCheck className="bo-history-w-4 bo-history-h-4" />
          {t("Préprod", "Preprod")}
        </Button>
        <Button
          onClick={() => setActiveTab("pilotage")}
          variant={activeTab === "pilotage" ? "primary" : "secondary"} aria-pressed={activeTab === "pilotage"}
        >
          <Activity className="bo-history-w-4 bo-history-h-4" />
          {t("Pilotage", "Command")}
        </Button>
        <Button
          onClick={() => setActiveTab("sessions")}
          variant={activeTab === "sessions" ? "primary" : "secondary"} aria-pressed={activeTab === "sessions"}
        >
          <Users className="bo-history-w-4 bo-history-h-4" />
          {t("Sessions", "Sessions")}
        </Button>
        <Button
          onClick={() => setActiveTab("emails")}
          variant={activeTab === "emails" ? "primary" : "secondary"} aria-pressed={activeTab === "emails"}
        >
          <Mail className="bo-history-w-4 bo-history-h-4" />
          {t("Emails", "Emails")}
        </Button>
        <Button
          onClick={() => setActiveTab("restitutions")}
          variant={activeTab === "restitutions" ? "primary" : "secondary"} aria-pressed={activeTab === "restitutions"}
        >
          <FileText className="bo-history-w-4 bo-history-h-4" />
          {t("Restitutions", "Restitutions")}
        </Button>
        <Button
          onClick={() => setActiveTab("quality")}
          variant={activeTab === "quality" ? "primary" : "secondary"} aria-pressed={activeTab === "quality"}
        >
          <ShieldAlert className="bo-history-w-4 bo-history-h-4" />
          {t("Qualité", "Quality")}
        </Button>
      </div>

      {activeTab === "preprod" && (
        <div className="bo-history-space-y-4">
          <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-4">
            <div className="bo-history-flex bo-history-flex-col bo-history-lg-flex-row bo-history-lg-items-start bo-history-lg-justify-between bo-history-gap-4">
              <div>
                <div className="bo-history-inline-flex bo-history-items-center bo-history-gap-2 bo-history-text-sm bo-history-font-medium">
                  <ClipboardCheck className="bo-history-w-4 bo-history-h-4" />
                  {t("Recette préprod", "Preprod acceptance")}
                </div>
                <div className="bo-history-mt-2 bo-history-text-2xl bo-history-font-semibold">
                  {preprodSummary.verdict === "ok"
                    ? t("Préprod validée", "Preprod validated")
                    : preprodSummary.verdict === "warning"
                      ? t("Préprod à surveiller", "Preprod needs attention")
                      : t("Préprod bloquée", "Preprod blocked")}
                </div>
                <div className="bo-history-mt-1 bo-history-text-sm bo-history-text-muted-foreground">
                  {t("Contrôle basé sur la dernière session complétée et les données réellement capturées.", "Check based on the latest completed session and captured data.")}
                </div>
              </div>
              <div className="bo-history-flex bo-history-flex-wrap bo-history-gap-2">
                <span className={`bo-history-inline-flex bo-history-h-8 bo-history-items-center bo-history-px-3 bo-history-rounded-full bo-history-text-sm ${preprodCheckClasses(preprodSummary.verdict)}`}>
                  {preprodSummary.failed === 0
                    ? t("Aucun échec", "No failure")
                    : t(`${preprodSummary.failed} échec(s)`, `${preprodSummary.failed} failure(s)`)}
                </span>
                <TextLink variant="secondary"
                  to={preprodSelectorUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="bo-history-w-4 bo-history-h-4" />
                  {t("Ouvrir le tunnel", "Open funnel")}
                </TextLink>
                <Button variant="secondary"
                  onClick={() => void loadDashboard()}
                >
                  <RefreshCw className={`bo-history-w-4 bo-history-h-4 ${loading ? "bo-history-animate-spin" : ""}`} />
                  {t("Rafraîchir", "Refresh")}
                </Button>
              </div>
            </div>
          </div>

          <div className="bo-history-grid bo-history-grid-cols-2 bo-history-lg-grid-cols-5 bo-history-gap-3">
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Sessions terminées", "Completed sessions")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{preprodSummary.completedSessions.length}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Dernier score", "Latest score")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{preprodSummary.latestCompleted?.health_score ?? "—"}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Restitution manquante", "Missing restitution")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1 bo-history-text-red-600">{preprodSummary.completedMissingRestitution.length}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Email manquant", "Missing email")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1 bo-history-text-amber-700">{preprodSummary.completedMissingEmailJob.length}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Emails en erreur", "Email failures")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1 bo-history-text-red-600">{preprodSummary.completedWithEmailFailure.length}</div>
            </div>
          </div>

          <div className="bo-history-grid bo-history-grid-cols-1 bo-history-xl-grid-cols-2 bo-history-gap-4">
            <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-overflow-hidden">
              <div className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium">
                {t("Checklist GO29", "GO29 checklist")}
              </div>
              <div className="bo-history-divide-y bo-history-divide-border">
                {preprodSummary.checks.map((check) => (
                  <div key={check.id} className="bo-history-p-3 bo-history-flex bo-history-items-start bo-history-justify-between bo-history-gap-3">
                    <div>
                      <div className="bo-history-text-sm bo-history-font-medium">{locale === "en" ? check.labelEn : check.labelFr}</div>
                      <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground bo-history-break-all">{check.detail}</div>
                    </div>
                    <span className={`bo-history-shrink-0 bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${preprodCheckClasses(check.status)}`}>
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-sm bo-history-font-medium">{t("Dernière session validée", "Latest validated session")}</div>
              {preprodSummary.latestCompleted ? (
                <div className="bo-history-mt-3 bo-history-space-y-2 bo-history-text-sm">
                  <div className="bo-history-flex bo-history-justify-between bo-history-gap-3">
                    <span className="bo-history-text-muted-foreground">{t("Session", "Session")}</span>
                    <span className="bo-history-font-mono bo-history-text-xs">{preprodSummary.latestCompleted.session_id}</span>
                  </div>
                  <div className="bo-history-flex bo-history-justify-between bo-history-gap-3">
                    <span className="bo-history-text-muted-foreground">{t("Terminée", "Completed")}</span>
                    <span>{formatDateTime(preprodSummary.latestCompleted.completed_at, locale)}</span>
                  </div>
                  <div className="bo-history-flex bo-history-justify-between bo-history-gap-3">
                    <span className="bo-history-text-muted-foreground">{t("Persona", "Persona")}</span>
                    <span>{preprodSummary.latestCompleted.persona || "—"}</span>
                  </div>
                  <div className="bo-history-flex bo-history-justify-between bo-history-gap-3">
                    <span className="bo-history-text-muted-foreground">{t("Profil", "Profile")}</span>
                    <span>{getInsightLabel(preprodSummary.latestCompleted, "profile", locale)}</span>
                  </div>
                  <div className="bo-history-flex bo-history-justify-between bo-history-gap-3">
                    <span className="bo-history-text-muted-foreground">{t("Restitution", "Restitution")}</span>
                    <span className="bo-history-font-mono bo-history-text-xs">{preprodSummary.latestRestitution?.id || "—"}</span>
                  </div>
                  <Button variant="secondary"
                    onClick={() => void openDetail(preprodSummary.latestCompleted?.session_id || "")}
                    className="bo-history-mt-2"
                  >
                    <Eye className="bo-history-w-4 bo-history-h-4" />
                    {t("Voir le détail", "View detail")}
                  </Button>
                </div>
              ) : (
                <div className="bo-history-mt-3 bo-history-text-sm bo-history-text-muted-foreground">
                  {t("Aucune session complétée sur la période filtrée.", "No completed session in the selected period.")}
                </div>
              )}
            </section>
          </div>

          {(preprodSummary.completedMissingRestitution.length > 0 || preprodSummary.completedMissingEmailJob.length > 0) && (
            <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-overflow-hidden">
              <div className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium">
                {t("Anomalies de recette", "Acceptance anomalies")}
              </div>
              <div className="bo-history-overflow-auto">
                <table className="bo-history-w-full bo-history-text-sm">
                  <thead className="bo-history-bg-muted-40">
                    <tr className="bo-history-text-left">
                      <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Session", "Session")}</th>
                      <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Terminée", "Completed")}</th>
                      <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Contact", "Contact")}</th>
                      <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Anomalie", "Anomaly")}</th>
                      <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Action", "Action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...preprodSummary.completedMissingRestitution.map((session) => ({ session, anomaly: t("Restitution manquante", "Missing restitution") })),
                      ...preprodSummary.completedMissingEmailJob.map((session) => ({ session, anomaly: t("Job email manquant", "Missing email job") })),
                    ].slice(0, 12).map(({ session, anomaly }) => (
                      <tr key={`${session.session_id}-${anomaly}`} className="bo-history-border-t bo-history-border-border">
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-font-mono bo-history-text-xs">{session.session_id.slice(0, 8)}</td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(session.completed_at, locale)}</td>
                        <td className="bo-history-px-3 bo-history-py-2">{session.email || session.first_name || "—"}</td>
                        <td className="bo-history-px-3 bo-history-py-2">{anomaly}</td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <Button variant="secondary"
                            onClick={() => void openDetail(session.session_id)}
                          >
                            <Eye className="bo-history-w-3-5 bo-history-h-3-5" />
                            {t("Détails", "Details")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "pilotage" && (
        <div className="bo-history-space-y-4">
          <div className="bo-history-grid bo-history-grid-cols-2 bo-history-md-grid-cols-5 bo-history-gap-3">
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Critiques", "Critical")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1 bo-history-text-red-600">{pilotage.summary.critical}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Priorité haute", "High priority")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{pilotage.summary.high}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Revue humaine", "Human review")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1 bo-history-text-amber-700">{pilotage.summary.reviewRequired}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Relances tunnel", "Funnel recovery")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{pilotage.summary.recovery}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Valeur/mois", "Value/mo")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{formatMoney(pilotage.summary.monthlyWaste)}</div>
            </div>
          </div>

          <div className="bo-history-grid bo-history-grid-cols-1 bo-history-lg-grid-cols-3 bo-history-gap-3">
            <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-inline-flex bo-history-items-center bo-history-gap-2 bo-history-text-sm bo-history-font-medium">
                <Mail className="bo-history-w-4 bo-history-h-4" />
                {t("Emails à réparer", "Email issues")}
              </div>
              <div className="bo-history-mt-2 bo-history-text-2xl bo-history-font-semibold">{pilotage.summary.emailIssues}</div>
              <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">
                {t("Jobs échoués ou rapports non envoyés.", "Failed jobs or unsent reports.")}
              </div>
            </section>
            <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-inline-flex bo-history-items-center bo-history-gap-2 bo-history-text-sm bo-history-font-medium">
                <TrendingDown className="bo-history-w-4 bo-history-h-4" />
                {t("Economies potentielles", "Potential savings")}
              </div>
              <div className="bo-history-mt-2 bo-history-text-2xl bo-history-font-semibold">{formatMoney(pilotage.summary.annualSavings)}</div>
              <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">
                {t("Cumul annuel des sessions filtrées.", "Annual total for filtered sessions.")}
              </div>
            </section>
            <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-inline-flex bo-history-items-center bo-history-gap-2 bo-history-text-sm bo-history-font-medium">
                <ShieldAlert className="bo-history-w-4 bo-history-h-4" />
                {t("File de décision", "Decision queue")}
              </div>
              <div className="bo-history-mt-2 bo-history-text-2xl bo-history-font-semibold">{pilotage.summary.total}</div>
              <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">
                {t("Triée par risque, valeur et urgence opérationnelle.", "Sorted by risk, value, and operational urgency.")}
              </div>
            </section>
          </div>

          <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-overflow-hidden">
            <div className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-flex bo-history-flex-col bo-history-lg-flex-row bo-history-lg-items-center bo-history-lg-justify-between bo-history-gap-2">
              <div className="bo-history-text-sm bo-history-font-medium bo-history-inline-flex bo-history-items-center bo-history-gap-2">
                <Activity className="bo-history-w-4 bo-history-h-4" />
                {t("Priorités opérationnelles", "Operational priorities")}
              </div>
              <div className="bo-history-flex bo-history-flex-col bo-history-sm-flex-row bo-history-gap-2">
                <Select aria-label={t("File de pilotage", "Command lane")}
                  value={pilotageLaneFilter}
                  onChange={(event) => setPilotageLaneFilter(event.target.value as PilotageLane | "all")}
                >
                  <option value="all">{t("Toutes décisions", "All decisions")}</option>
                  <option value="email">{pilotageLaneLabel("email", locale)}</option>
                  <option value="quality">{pilotageLaneLabel("quality", locale)}</option>
                  <option value="recovery">{pilotageLaneLabel("recovery", locale)}</option>
                  <option value="value">{pilotageLaneLabel("value", locale)}</option>
                  <option value="watch">{pilotageLaneLabel("watch", locale)}</option>
                </Select>
                <Select aria-label={t("Priorité", "Priority")}
                  value={pilotagePriorityFilter}
                  onChange={(event) => setPilotagePriorityFilter(event.target.value as PilotageRow["priorityLabel"] | "all")}
                >
                  <option value="all">{t("Toutes priorités", "All priorities")}</option>
                  <option value="critical">critical</option>
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </Select>
              </div>
            </div>
            <div className="bo-history-overflow-auto">
              <table className="bo-history-w-full bo-history-text-sm">
                <thead className="bo-history-bg-muted-40">
                  <tr className="bo-history-text-left">
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Priorité", "Priority")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Contact", "Contact")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Décision", "Decision")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Raisons", "Reasons")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Valeur", "Value")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Santé", "Health")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Email", "Email")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Action", "Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPilotageRows.slice(0, 80).map((row) => {
                    const reasons = locale === "en" ? row.reasonsEn : row.reasonsFr;
                    return (
                      <tr key={row.sessionId} className="bo-history-border-t bo-history-border-border bo-history-align-top">
                        <td className="bo-history-px-3 bo-history-py-2">
                          <span className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${pilotagePriorityClasses(row.priorityLabel)}`}>
                            {row.priorityScore}
                          </span>
                          <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">{row.priorityLabel}</div>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-min-w-180px">
                          <div className="bo-history-font-medium">{row.firstName || "—"}</div>
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{row.email || "—"}</div>
                          <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">
                            {[row.persona, row.profile ? humanizeId(row.profile) : null].filter(Boolean).join(" / ") || "—"}
                          </div>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <span className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${pilotageLaneClasses(row.lane)}`}>
                            {pilotageLaneLabel(row.lane, locale)}
                          </span>
                          <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">{row.status}</div>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-min-w-240px">
                          <div className="bo-history-flex bo-history-flex-wrap bo-history-gap-1">
                            {reasons.slice(0, 4).map((reason) => (
                              <span key={reason} className="bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs bo-history-bg-muted">
                                {reason}
                              </span>
                            ))}
                            {reasons.length > 4 && (
                              <span className="bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs bo-history-bg-muted">
                                +{reasons.length - 4}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">
                          <div className="bo-history-font-medium">{formatMoney(row.monthlyWaste)}/mois</div>
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{formatMoney(row.annualSavings)}/an</div>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2">{row.healthScore ?? "—"}</td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <div className={row.emailFailedCount > 0 ? "bo-history-text-red-600 bo-history-font-medium" : "bo-history-text-foreground"}>
                            {row.emailSentCount}/{row.emailJobsCount}
                          </div>
                          {row.emailFailedCount > 0 && (
                            <div className="bo-history-text-xs bo-history-text-red-600">{row.emailFailedCount} failed</div>
                          )}
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-max-w-220px">
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">
                            {locale === "en" ? row.actionEn : row.actionFr}
                          </div>
                          <Button variant="secondary"
                            onClick={() => void openDetail(row.sessionId)}
                            className="bo-history-mt-2"
                          >
                            <Eye className="bo-history-w-3-5 bo-history-h-3-5" />
                            {t("Détails", "Details")}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filteredPilotageRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="bo-history-px-3 bo-history-py-8 bo-history-text-center bo-history-text-muted-foreground">
                        {t("Aucune priorité sur la période", "No priority on this period")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-overflow-hidden">
          <div className="bo-history-overflow-auto">
            <table className="bo-history-w-full bo-history-text-sm">
              <thead className="bo-history-bg-muted-40">
                <tr className="bo-history-text-left">
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Créée", "Created")}</th>
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Contact", "Contact")}</th>
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Persona", "Persona")}</th>
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Profil", "Profile")}</th>
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Tags", "Tags")}</th>
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Statut", "Status")}</th>
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Step max", "Max step")}</th>
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Score", "Score")}</th>
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Gaspillage/mo", "Waste/mo")}</th>
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Emails", "Emails")}</th>
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Événements", "Events")}</th>
                  <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Action", "Action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => {
                  const status = getSessionStatus(session);
                  return (
                    <tr key={session.session_id} className="bo-history-border-t bo-history-border-border">
                      <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(session.created_at, locale)}</td>
                      <td className="bo-history-px-3 bo-history-py-2">
                        <div className="bo-history-font-medium">{session.first_name || "—"}</div>
                        <div className="bo-history-text-xs bo-history-text-muted-foreground">{session.email || "—"}</div>
                      </td>
                      <td className="bo-history-px-3 bo-history-py-2">{session.persona || "—"}</td>
                      <td className="bo-history-px-3 bo-history-py-2">
                        <div className="bo-history-font-medium">{getInsightLabel(session, "profile", locale)}</div>
                        <div className="bo-history-text-xs bo-history-text-muted-foreground">{humanizeId(session.primary_risk)}</div>
                      </td>
                      <td className="bo-history-px-3 bo-history-py-2">
                        {(session.admin_tags || []).length > 0 ? (
                          <div className="bo-history-flex bo-history-flex-wrap bo-history-gap-1">
                            {(session.admin_tags || []).slice(0, 2).map((tag) => (
                              <span key={tag} className="bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs bo-history-bg-muted">
                                {tag}
                              </span>
                            ))}
                            {(session.admin_tags || []).length > 2 && (
                              <span className="bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs bo-history-bg-muted">
                                +{(session.admin_tags || []).length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="bo-history-px-3 bo-history-py-2">
                        <span className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${statusClasses(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="bo-history-px-3 bo-history-py-2">{session.max_step_seen ?? session.last_step_id ?? "—"}</td>
                      <td className="bo-history-px-3 bo-history-py-2">{session.health_score ?? "—"}</td>
                      <td className="bo-history-px-3 bo-history-py-2">{formatMoney(session.estimated_waste)}</td>
                      <td className="bo-history-px-3 bo-history-py-2">
                        {session.email_sent_count}/{session.email_jobs_count}
                      </td>
                      <td className="bo-history-px-3 bo-history-py-2">{session.event_count || 0}</td>
                      <td className="bo-history-px-3 bo-history-py-2">
                        <Button variant="secondary"
                          onClick={() => void openDetail(session.session_id)}
                        >
                          <Eye className="bo-history-w-3-5 bo-history-h-3-5" />
                          {t("Détails", "Details")}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={12} className="bo-history-px-3 bo-history-py-8 bo-history-text-center bo-history-text-muted-foreground">
                      {t("Aucune session trouvée", "No sessions found")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "emails" && (
        <div className="bo-history-space-y-4">
          <div className="bo-history-grid bo-history-grid-cols-2 bo-history-md-grid-cols-3 bo-history-xl-grid-cols-6 bo-history-gap-3">
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Total jobs", "Total jobs")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{emailSummary.total}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Sent", "Sent")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{emailSummary.sent}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Delivered", "Delivered")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{emailSummary.delivered}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Opened", "Opened")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{emailSummary.opened}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Clicked", "Clicked")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{emailSummary.clicked}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Failed", "Failed")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1 bo-history-text-red-600">{emailSummary.failed}</div>
            </div>
          </div>

          <div className="bo-history-grid bo-history-grid-cols-2 bo-history-md-grid-cols-5 bo-history-gap-3">
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("File d'attente", "Queued")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{emailOpsSummary.queued}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("À traiter", "Due now")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{emailOpsSummary.dueNow}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("En traitement", "Processing")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{emailOpsSummary.processing}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Échecs récents", "Recent failed")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1 bo-history-text-red-600">{emailOpsSummary.failed}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Annulés", "Cancelled")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{emailOpsSummary.cancelled}</div>
            </div>
          </div>

          <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-overflow-hidden">
            <div className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium">
              {t("Santé email par jour et template", "Email health by day and template")}
            </div>
            <div className="bo-history-overflow-auto">
              <table className="bo-history-w-full bo-history-text-sm">
                <thead className="bo-history-bg-muted-40">
                  <tr className="bo-history-text-left">
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Jour", "Day")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Template", "Template")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Locale", "Locale")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Total", "Total")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Sent", "Sent")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Delivered", "Delivered")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Opened", "Opened")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Clicked", "Clicked")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Failed", "Failed")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.emailHealth || []).map((row, index) => (
                    <tr key={`${row.day}-${row.template_key}-${row.locale}-${index}`} className="bo-history-border-t bo-history-border-border">
                      <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(row.day, locale)}</td>
                      <td className="bo-history-px-3 bo-history-py-2">{row.template_key}</td>
                      <td className="bo-history-px-3 bo-history-py-2">{row.locale}</td>
                      <td className="bo-history-px-3 bo-history-py-2">{row.total_jobs}</td>
                      <td className="bo-history-px-3 bo-history-py-2">{row.sent_jobs}</td>
                      <td className="bo-history-px-3 bo-history-py-2">{row.delivered_jobs}</td>
                      <td className="bo-history-px-3 bo-history-py-2">{row.opened_jobs}</td>
                      <td className="bo-history-px-3 bo-history-py-2">{row.clicked_jobs}</td>
                      <td className="bo-history-px-3 bo-history-py-2 bo-history-text-red-600">{row.failed_jobs}</td>
                    </tr>
                  ))}
                  {!loading && (dashboard?.emailHealth || []).length === 0 && (
                    <tr>
                      <td colSpan={9} className="bo-history-px-3 bo-history-py-8 bo-history-text-center bo-history-text-muted-foreground">
                        {t("Aucune donnée email sur la période", "No email data on this period")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {emailJobActionError && (
            <div className="bo-history-border bo-history-border-red-300 bo-history-bg-red-50 bo-history-text-red-700 bo-history-rounded-lg bo-history-px-3 bo-history-py-2 bo-history-text-sm">
              {emailJobActionError}
            </div>
          )}

          <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-overflow-hidden">
            <div className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium">
              {t("Jobs email récents", "Recent email jobs")}
            </div>
            <div className="bo-history-overflow-auto">
              <table className="bo-history-w-full bo-history-text-sm">
                <thead className="bo-history-bg-muted-40">
                  <tr className="bo-history-text-left">
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Créé", "Created")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Email", "Email")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Template", "Template")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Version", "Version")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Déclencheur", "Trigger")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Status", "Status")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Qualité", "Quality")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Schedule", "Schedule")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Attempts", "Attempts")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Erreur", "Error")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.recentEmailJobs || []).map((job) => {
                    const isBusy = emailJobActionLoadingId === job.id;
                    const ctaUrl = getJobCtaUrl(job);
                    const quality = getJobEmailQuality(job);
                    return (
                      <tr key={job.id} className="bo-history-border-t bo-history-border-border">
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(job.created_at, locale)}</td>
                        <td className="bo-history-px-3 bo-history-py-2">{job.email}</td>
                        <td className="bo-history-px-3 bo-history-py-2">{job.template_key}</td>
                        <td className="bo-history-px-3 bo-history-py-2">{getJobTemplateVersion(job)}</td>
                        <td className="bo-history-px-3 bo-history-py-2">{getJobTrigger(job)}</td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <span className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${emailStatusClasses(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <span
                            className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${emailQualityClasses(quality.status)}`}
                            title={quality.flagIds.join(", ")}
                          >
                            {quality.status}
                            {quality.score != null ? ` ${quality.score}` : ""}
                          </span>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(job.scheduled_for, locale)}</td>
                        <td className="bo-history-px-3 bo-history-py-2">{job.attempts}</td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-max-w-220px bo-history-truncate" title={job.last_error || ""}>
                          {job.last_error || "—"}
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <div className="bo-history-flex bo-history-flex-wrap bo-history-gap-1">
                            {ctaUrl && (
                              <TextLink variant="secondary"
                                to={ctaUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="bo-history-w-3-5 bo-history-h-3-5" />
                                CTA
                              </TextLink>
                            )}
                            <Button variant="secondary"
                              disabled={isBusy}
                              onClick={() => void runEmailJobAction(job, "retry_now")}
                            >
                              <RotateCcw className="bo-history-w-3-5 bo-history-h-3-5" />
                              {t("Relancer", "Retry")}
                            </Button>
                            <Button variant="secondary"
                              disabled={isBusy}
                              onClick={() => void runEmailJobAction(job, "schedule")}
                            >
                              <RefreshCw className={`bo-history-w-3-5 bo-history-h-3-5 ${isBusy ? "bo-history-animate-spin" : ""}`} />
                              {t("+1h", "+1h")}
                            </Button>
                            <Button variant="secondary"
                              disabled={isBusy || job.status === "cancelled"}
                              onClick={() => void runEmailJobAction(job, "cancel")}
                            >
                              <Ban className="bo-history-w-3-5 bo-history-h-3-5" />
                              {t("Annuler", "Cancel")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && (dashboard?.recentEmailJobs || []).length === 0 && (
                    <tr>
                      <td colSpan={11} className="bo-history-px-3 bo-history-py-8 bo-history-text-center bo-history-text-muted-foreground">
                        {t("Aucun job récent", "No recent jobs")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "restitutions" && (
        <div className="bo-history-space-y-4">
          <div className="bo-history-grid bo-history-grid-cols-2 bo-history-md-grid-cols-5 bo-history-gap-3">
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Total restitutions", "Total restitutions")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{restitutionSummary.total}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Email", "Email")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{restitutionSummary.email}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Dashboard", "Dashboard")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{restitutionSummary.dashboard}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("PDF", "PDF")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{restitutionSummary.pdf}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Version GO10", "GO10 version")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{restitutionSummary.go10}</div>
            </div>
          </div>

          <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-overflow-hidden">
            <div className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium">
              {t("Restitutions récentes", "Recent restitutions")}
            </div>
            <div className="bo-history-overflow-auto">
              <table className="bo-history-w-full bo-history-text-sm">
                <thead className="bo-history-bg-muted-40">
                  <tr className="bo-history-text-left">
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Date", "Date")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Canal", "Channel")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Version", "Version")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Template / profil", "Template / profile")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Sujet / risque", "Subject / risk")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Score", "Score")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Session", "Session")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.recentRestitutions || []).map((restitution) => {
                    const ctaUrl = getRestitutionCtaUrl(restitution);
                    return (
                      <tr key={restitution.id} className="bo-history-border-t bo-history-border-border">
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(restitution.generated_at, locale)}</td>
                        <td className="bo-history-px-3 bo-history-py-2">{restitution.channel}</td>
                        <td className="bo-history-px-3 bo-history-py-2">{restitution.version}</td>
                        <td className="bo-history-px-3 bo-history-py-2">{getRestitutionTemplate(restitution)}</td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-max-w-280px bo-history-truncate" title={getRestitutionSubject(restitution)}>
                          {getRestitutionSubject(restitution)}
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2">{getRestitutionScore(restitution) ?? "—"}</td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-font-mono bo-history-text-xs">{restitution.session_id.slice(0, 8)}</td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <div className="bo-history-flex bo-history-flex-wrap bo-history-gap-1">
                            <Button variant="secondary"
                              onClick={() => void openDetail(restitution.session_id)}
                            >
                              <Eye className="bo-history-w-3-5 bo-history-h-3-5" />
                              {t("Session", "Session")}
                            </Button>
                            {ctaUrl && (
                              <TextLink variant="secondary"
                                to={ctaUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="bo-history-w-3-5 bo-history-h-3-5" />
                                CTA
                              </TextLink>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && (dashboard?.recentRestitutions || []).length === 0 && (
                    <tr>
                      <td colSpan={8} className="bo-history-px-3 bo-history-py-8 bo-history-text-center bo-history-text-muted-foreground">
                        {t("Aucune restitution récente", "No recent restitutions")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "quality" && (
        <div className="bo-history-space-y-4">
          <div className="bo-history-grid bo-history-grid-cols-2 bo-history-md-grid-cols-5 bo-history-gap-3">
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Sélections à revoir", "Selections to review")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1 bo-history-text-red-600">{selectionQualitySummary.reviewRequired}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Couverture absente", "Missing coverage")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{selectionQualitySummary.missingCoverage}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Couverture faible", "Low coverage")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{selectionQualitySummary.lowCoverage}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Zones moyennes", "Average areas")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{selectionQualitySummary.avgCovered}/{SELECTION_AREA_TOTAL}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Zones ignorées", "Skipped areas")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{selectionQualitySummary.skippedAreas}</div>
            </div>
          </div>

          <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-overflow-hidden">
            <div className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium bo-history-inline-flex bo-history-items-center bo-history-gap-2">
              <Layers3 className="bo-history-w-4 bo-history-h-4" />
              {t("Qualité de sélection utilisateur", "User selection quality")}
            </div>
            <div className="bo-history-overflow-auto">
              <table className="bo-history-w-full bo-history-text-sm">
                <thead className="bo-history-bg-muted-40">
                  <tr className="bo-history-text-left">
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Créée", "Created")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Contact", "Contact")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Outils", "Tools")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Zones", "Areas")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Confiance", "Confidence")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Zones ignorées", "Skipped areas")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Action", "Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectionQualityRows.map((row) => {
                    const selectedTools = Array.isArray(row.session.selected_tools)
                      ? row.session.selected_tools
                      : [];
                    return (
                      <tr key={row.session.session_id} className="bo-history-border-t bo-history-border-border bo-history-align-top">
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(row.session.created_at, locale)}</td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <div className="bo-history-font-medium">{row.session.first_name || "—"}</div>
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{row.session.email || "—"}</div>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2">{selectedTools.length}</td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <div className="bo-history-font-medium">{row.coverage.coveredCount}/{SELECTION_AREA_TOTAL}</div>
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">
                            {row.coverage.missingCount} {t("non vérifiée(s)", "unchecked")}
                          </div>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <span className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${selectionConfidenceClasses(row.coverage.confidence)}`}>
                            {selectionConfidenceLabel(row.coverage.confidence, locale)}
                          </span>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-max-w-260px">
                          {row.coverage.skipped.length > 0 ? (
                            <div className="bo-history-flex bo-history-flex-wrap bo-history-gap-1">
                              {row.coverage.skipped.slice(0, 4).map((item) => (
                                <span key={item} className="bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs bo-history-status-muted">
                                  {humanizeId(item)}
                                </span>
                              ))}
                              {row.coverage.skipped.length > 4 && (
                                <span className="bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs bo-history-bg-muted">
                                  +{row.coverage.skipped.length - 4}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="bo-history-text-xs bo-history-text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-max-w-300px">
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">
                            {!row.coverage.hasCoverage
                              ? t("Session ancienne ou couverture non capturée.", "Older session or coverage not captured.")
                              : row.reviewRequired
                                ? t("Relire avant d'interpréter le score.", "Review before interpreting score.")
                                : t("Sélection exploitable.", "Selection is usable.")}
                          </div>
                          <Button variant="secondary"
                            onClick={() => void openDetail(row.session.session_id)}
                            className="bo-history-mt-2"
                          >
                            <Eye className="bo-history-w-3-5 bo-history-h-3-5" />
                            {t("Détails", "Details")}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && selectionQualityRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="bo-history-px-3 bo-history-py-8 bo-history-text-center bo-history-text-muted-foreground">
                        {t("Aucune sélection à revoir sur la période", "No selection needs review on this period")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bo-history-grid bo-history-grid-cols-2 bo-history-md-grid-cols-5 bo-history-gap-3">
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("À revoir", "Review required")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1 bo-history-text-red-600">{qualitySummary.reviewRequired}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Confiance moyenne", "Average confidence")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{qualitySummary.avgConfidence}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Flags hauts", "High flags")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1 bo-history-text-red-600">{qualitySummary.highFlags}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Flags moyens", "Medium flags")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{qualitySummary.mediumFlags}</div>
            </div>
            <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-p-3">
              <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Confiance faible", "Low confidence")}</div>
              <div className="bo-history-text-lg bo-history-font-semibold bo-history-mt-1">{qualitySummary.lowConfidence}</div>
            </div>
          </div>

          <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-bg-card bo-history-overflow-hidden">
            <div className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium bo-history-inline-flex bo-history-items-center bo-history-gap-2">
              <ShieldAlert className="bo-history-w-4 bo-history-h-4" />
              {t("Contrôle qualité scoring", "Scoring quality control")}
            </div>
            <div className="bo-history-overflow-auto">
              <table className="bo-history-w-full bo-history-text-sm">
                <thead className="bo-history-bg-muted-40">
                  <tr className="bo-history-text-left">
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Créée", "Created")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Contact", "Contact")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Persona", "Persona")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Profil", "Profile")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Score", "Score")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Confiance", "Confidence")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Calibration", "Calibration")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Revue", "Review")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Flags", "Flags")}</th>
                    <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Action", "Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {qualityRows.map((row) => {
                    const firstFlags = row.flags.slice(0, 3);
                    const primaryFlag = row.flags[0];
                    return (
                      <tr key={row.session.session_id} className="bo-history-border-t bo-history-border-border bo-history-align-top">
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(row.session.created_at, locale)}</td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <div className="bo-history-font-medium">{row.session.first_name || "—"}</div>
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{row.session.email || "—"}</div>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2">{row.session.persona || "—"}</td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <div className="bo-history-font-medium">{getInsightLabel(row.session, "profile", locale)}</div>
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{humanizeId(row.session.primary_risk)}</div>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2">{row.session.health_score ?? "—"}</td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <div className="bo-history-font-medium">{row.confidenceScore ?? "—"}</div>
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">
                            {row.confidenceLabel || t("Non calculée", "Not computed")}
                          </div>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <div className="bo-history-font-medium">{row.calibrationScore ?? "—"}</div>
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">
                            {row.calibrationLabel || t("Calibration absente", "Missing calibration")}
                          </div>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2">
                          <span
                            className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${
                              row.reviewRequired ? "bo-history-status-error" : "bo-history-status-ok"
                            }`}
                          >
                            {row.reviewRequired ? t("Oui", "Yes") : t("OK", "OK")}
                          </span>
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-min-w-220px">
                          {firstFlags.length > 0 ? (
                            <div className="bo-history-flex bo-history-flex-wrap bo-history-gap-1">
                              {firstFlags.map((flag) => {
                                const severity = getFlagSeverity(flag);
                                return (
                                  <span
                                    key={String(flag.id)}
                                    className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${qualitySeverityClasses(severity)}`}
                                  >
                                    {getLocalizedLabel(flag, locale, humanizeId(String(flag.id || "")))}
                                  </span>
                                );
                              })}
                              {row.flags.length > firstFlags.length && (
                                <span className="bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs bo-history-bg-muted">
                                  +{row.flags.length - firstFlags.length}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="bo-history-text-xs bo-history-text-muted-foreground">
                              {row.hasCalibration ? t("Aucun flag", "No flag") : t("Calibration absente", "Missing calibration")}
                            </span>
                          )}
                        </td>
                        <td className="bo-history-px-3 bo-history-py-2 bo-history-max-w-300px">
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">
                            {primaryFlag
                              ? localizedField(primaryFlag, "action", locale) || "—"
                              : row.hasCalibration
                                ? row.calibrationSummary || "—"
                                : t("Relancer un diagnostic GO13 pour obtenir la calibration.", "Run a GO13 diagnostic again to get calibration.")}
                          </div>
                          <Button variant="secondary"
                            onClick={() => void openDetail(row.session.session_id)}
                            className="bo-history-mt-2"
                          >
                            <Eye className="bo-history-w-3-5 bo-history-h-3-5" />
                            {t("Détails", "Details")}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && qualityRows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="bo-history-px-3 bo-history-py-8 bo-history-text-center bo-history-text-muted-foreground">
                        {t("Aucun diagnostic à revoir sur la période", "No diagnostic needs review on this period")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(detailLoading || detail || detailError) && (
        <div className="bo-history-fixed bo-history-inset-0 bo-history-z-50">
          <div
            className="bo-history-absolute bo-history-inset-0 bo-history-bg-black-25"
            onClick={() => {
              setDetail(null);
              setDetailError(null);
              setSessionAdminMessage(null);
            }}
          />
          <aside className="bo-history-absolute bo-history-top-0 bo-history-right-0 bo-history-h-full bo-history-w-full bo-history-max-w-2xl bo-history-bg-background bo-history-border-l bo-history-border-border bo-history-p-4 bo-history-overflow-y-auto">
            <div className="bo-history-flex bo-history-items-start bo-history-justify-between bo-history-gap-2">
              <div>
                <h2 className="bo-history-text-lg bo-history-font-semibold">
                  {t("Détail session", "Session detail")}
                </h2>
                {detail?.session && (
                  <p className="bo-history-text-sm bo-history-text-muted-foreground">
                    {detail.session.session_id}
                  </p>
                )}
              </div>
              <IconButton variant="quiet" aria-label={t("Fermer le détail", "Close detail")}
                onClick={() => {
                  setDetail(null);
                  setDetailError(null);
                  setSessionAdminMessage(null);
                }}
              >
                <X className="bo-history-w-4 bo-history-h-4" />
              </IconButton>
            </div>

            {detailLoading && (
              <div className="bo-history-mt-6 bo-history-text-sm bo-history-text-muted-foreground bo-history-inline-flex bo-history-items-center bo-history-gap-2">
                <RefreshCw className="bo-history-w-4 bo-history-h-4 bo-history-animate-spin" />
                {t("Chargement…", "Loading…")}
              </div>
            )}

            {detailError && (
              <div className="bo-history-mt-6 bo-history-border bo-history-border-red-300 bo-history-bg-red-50 bo-history-text-red-700 bo-history-rounded-lg bo-history-px-3 bo-history-py-2 bo-history-text-sm">
                {detailError}
              </div>
            )}

            {detail && (
              <div className="bo-history-mt-5 bo-history-space-y-5">
                <div className="bo-history-grid bo-history-grid-cols-2 bo-history-md-grid-cols-4 bo-history-gap-3">
                  <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-3">
                    <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Score", "Score")}</div>
                    <div className="bo-history-text-xl bo-history-font-semibold bo-history-mt-1">{detail.session.health_score ?? "—"}</div>
                  </div>
                  <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-3">
                    <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Step max", "Max step")}</div>
                    <div className="bo-history-text-xl bo-history-font-semibold bo-history-mt-1">{detail.session.max_step_seen ?? "—"}</div>
                  </div>
                  <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-3">
                    <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Emails sent", "Emails sent")}</div>
                    <div className="bo-history-text-xl bo-history-font-semibold bo-history-mt-1">{detail.session.email_sent_count}</div>
                  </div>
                  <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-3">
                    <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Waste/mo", "Waste/mo")}</div>
                    <div className="bo-history-text-xl bo-history-font-semibold bo-history-mt-1">{formatMoney(detail.session.estimated_waste)}</div>
                  </div>
                </div>

                <div className="bo-history-grid bo-history-grid-cols-1 bo-history-md-grid-cols-3 bo-history-gap-3">
                  <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-3">
                    <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Dernier signal client", "Last client signal")}</div>
                    <div className="bo-history-text-sm bo-history-font-medium bo-history-mt-1">{formatDateTime(detail.session.last_client_seen_at, locale)}</div>
                  </div>
                  <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-3">
                    <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Dernière reprise", "Last resume")}</div>
                    <div className="bo-history-text-sm bo-history-font-medium bo-history-mt-1">{formatDateTime(detail.session.resumed_at, locale)}</div>
                  </div>
                  <div className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-3">
                    <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Actions cochées", "Checked actions")}</div>
                    <div className="bo-history-text-sm bo-history-font-medium bo-history-mt-1">
                      {getCompletedActionIds(detail.session).length || detail.session.actions_completed || 0}
                    </div>
                  </div>
                </div>

                {(() => {
                  const riskFlags = getRiskFlags(detail.session);
                  const primaryRisk = riskFlags.find((flag) => flag.id === detail.session.primary_risk) || riskFlags[0];
                  const primaryRiskLabel =
                    localizedField(primaryRisk || null, "label", locale) || humanizeId(detail.session.primary_risk);
                  const primaryRiskDetail = localizedField(primaryRisk || null, "detail", locale);
                  return (
                    <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-3 bo-history-space-y-3">
                      <div className="bo-history-inline-flex bo-history-items-center bo-history-gap-2 bo-history-text-sm bo-history-font-medium">
                        <Layers3 className="bo-history-w-4 bo-history-h-4" />
                        {t("Lecture diagnostic GO7", "GO7 diagnostic read")}
                      </div>
                      <div className="bo-history-grid bo-history-grid-cols-1 bo-history-md-grid-cols-3 bo-history-gap-3">
                        <div className="bo-history-rounded-lg bo-history-border bo-history-border-border bo-history-p-3">
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Profil stack", "Stack profile")}</div>
                          <div className="bo-history-mt-1 bo-history-text-sm bo-history-font-semibold">{getInsightLabel(detail.session, "profile", locale)}</div>
                        </div>
                        <div className="bo-history-rounded-lg bo-history-border bo-history-border-border bo-history-p-3">
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Maturité", "Maturity")}</div>
                          <div className="bo-history-mt-1 bo-history-text-sm bo-history-font-semibold">{getInsightLabel(detail.session, "maturity", locale)}</div>
                        </div>
                        <div className="bo-history-rounded-lg bo-history-border bo-history-border-border bo-history-p-3">
                          <div className="bo-history-inline-flex bo-history-items-center bo-history-gap-1 bo-history-text-xs bo-history-text-muted-foreground">
                            <ShieldAlert className="bo-history-w-3-5 bo-history-h-3-5" />
                            {t("Risque principal", "Primary risk")}
                          </div>
                          <div className="bo-history-mt-1 bo-history-text-sm bo-history-font-semibold">{primaryRiskLabel}</div>
                          {primaryRiskDetail && (
                            <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">{primaryRiskDetail}</div>
                          )}
                        </div>
                      </div>
                      {riskFlags.length > 0 && (
                        <div className="bo-history-space-y-2">
                          {riskFlags.slice(0, 4).map((flag) => (
                            <div key={String(flag.id)} className="bo-history-rounded-lg bo-history-bg-muted-30 bo-history-px-3 bo-history-py-2">
                              <div className="bo-history-flex bo-history-items-center bo-history-justify-between bo-history-gap-2">
                                <span className="bo-history-text-sm bo-history-font-medium">
                                  {localizedField(flag, "label", locale) || humanizeId(String(flag.id || ""))}
                                </span>
                                <span className="bo-history-text-10px bo-history-uppercase bo-history-tracking-wide bo-history-text-muted-foreground">
                                  {String(flag.severity || "low")}
                                </span>
                              </div>
                              <p className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">
                                {localizedField(flag, "action", locale) || "—"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })()}

                {(() => {
                  const confidence = getSessionConfidence(detail.session);
                  const calibration = getSessionCalibration(detail.session);
                  const context = getSessionDiagnosticContext(detail.session);
                  const confidenceLabel = locale === "en" ? confidence.labelEn : confidence.labelFr;
                  const calibrationLabel = locale === "en" ? calibration.labelEn : calibration.labelFr;
                  const calibrationSummary = locale === "en" ? calibration.summaryEn : calibration.summaryFr;
                  const complementarySkills = Array.isArray(context.complementary_skills)
                    ? context.complementary_skills.filter((item): item is string => typeof item === "string")
                    : [];
                  const complementarySpecialties = Array.isArray(context.complementary_specialties)
                    ? context.complementary_specialties.filter((item): item is string => typeof item === "string")
                    : [];
                  const reviewRequired =
                    calibration.reviewRequired ||
                    confidence.score == null ||
                    calibration.score == null ||
                    (confidence.score != null && confidence.score < 60);
                  return (
                    <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-3 bo-history-space-y-3">
                      <div className="bo-history-inline-flex bo-history-items-center bo-history-gap-2 bo-history-text-sm bo-history-font-medium">
                        <ShieldAlert className="bo-history-w-4 bo-history-h-4" />
                        {t("Calibration qualité GO13", "GO13 quality calibration")}
                      </div>
                      <div className="bo-history-grid bo-history-grid-cols-1 bo-history-md-grid-cols-3 bo-history-gap-3">
                        <div className="bo-history-rounded-lg bo-history-border bo-history-border-border bo-history-p-3">
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Contexte GO15", "GO15 context")}</div>
                          <div className="bo-history-mt-1 bo-history-text-sm bo-history-font-semibold">
                            {contextLabel(textValue(context, "persona_confidence"), locale)}
                          </div>
                          <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">
                            {contextLabel(textValue(context, "stack_goal"), locale)}
                          </div>
                        </div>
                        <div className="bo-history-rounded-lg bo-history-border bo-history-border-border bo-history-p-3">
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Profils secondaires", "Secondary profiles")}</div>
                          <div className="bo-history-mt-1 bo-history-text-sm bo-history-font-semibold">
                            {complementarySkills.length > 0 ? complementarySkills.map(humanizeId).join(", ") : "—"}
                          </div>
                        </div>
                        <div className="bo-history-rounded-lg bo-history-border bo-history-border-border bo-history-p-3">
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Spécialités", "Specialties")}</div>
                          <div className="bo-history-mt-1 bo-history-text-sm bo-history-font-semibold">
                            {[
                              textValue(context, "primary_specialty"),
                              ...complementarySpecialties,
                            ].filter(Boolean).map((item) => humanizeId(String(item))).join(", ") || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="bo-history-grid bo-history-grid-cols-1 bo-history-md-grid-cols-3 bo-history-gap-3">
                        <div className="bo-history-rounded-lg bo-history-border bo-history-border-border bo-history-p-3">
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Confiance", "Confidence")}</div>
                          <div className="bo-history-mt-1 bo-history-text-sm bo-history-font-semibold">{confidence.score ?? "—"}</div>
                          <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">
                            {confidenceLabel || t("Non calculée", "Not computed")}
                          </div>
                        </div>
                        <div className="bo-history-rounded-lg bo-history-border bo-history-border-border bo-history-p-3">
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Calibration", "Calibration")}</div>
                          <div className="bo-history-mt-1 bo-history-text-sm bo-history-font-semibold">{calibration.score ?? "—"}</div>
                          <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">
                            {calibrationLabel || t("Calibration absente", "Missing calibration")}
                          </div>
                        </div>
                        <div className="bo-history-rounded-lg bo-history-border bo-history-border-border bo-history-p-3">
                          <div className="bo-history-text-xs bo-history-text-muted-foreground">{t("Revue humaine", "Human review")}</div>
                          <div
                            className={`bo-history-mt-1 bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${
                              reviewRequired ? "bo-history-status-error" : "bo-history-status-ok"
                            }`}
                          >
                            {reviewRequired ? t("Conseillée", "Advised") : t("Non requise", "Not required")}
                          </div>
                        </div>
                      </div>
                      <p className="bo-history-text-xs bo-history-text-muted-foreground">
                        {calibrationSummary ||
                          t(
                            "Cette session ne contient pas encore la nouvelle calibration GO13.",
                            "This session does not contain the new GO13 calibration yet."
                          )}
                      </p>
                      {calibration.flags.length > 0 ? (
                        <div className="bo-history-space-y-2">
                          {calibration.flags.map((flag) => {
                            const severity = getFlagSeverity(flag);
                            return (
                              <div key={String(flag.id)} className="bo-history-rounded-lg bo-history-bg-muted-30 bo-history-px-3 bo-history-py-2">
                                <div className="bo-history-flex bo-history-items-center bo-history-justify-between bo-history-gap-2">
                                  <span className="bo-history-text-sm bo-history-font-medium">
                                    {getLocalizedLabel(flag, locale, humanizeId(String(flag.id || "")))}
                                  </span>
                                  <span className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-10px ${qualitySeverityClasses(severity)}`}>
                                    {severity}
                                  </span>
                                </div>
                                <p className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">
                                  {localizedField(flag, "detail", locale) || "—"}
                                </p>
                                <p className="bo-history-mt-1 bo-history-text-xs bo-history-text-muted-foreground">
                                  {localizedField(flag, "action", locale) || "—"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bo-history-rounded-lg bo-history-bg-muted-30 bo-history-px-3 bo-history-py-2 bo-history-text-xs bo-history-text-muted-foreground">
                          {calibration.score == null
                            ? t("Aucun flag disponible tant que la session n'a pas été recalculée.", "No flag is available until the session is recalculated.")
                            : t("Aucun conflit majeur détecté.", "No major conflict detected.")}
                        </div>
                      )}
                    </section>
                  );
                })()}

                <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-p-3 bo-history-space-y-3">
                  <div className="bo-history-inline-flex bo-history-items-center bo-history-gap-2 bo-history-text-sm bo-history-font-medium">
                    <Tag className="bo-history-w-4 bo-history-h-4" />
                    {t("Annotations back-office", "Back-office annotations")}
                  </div>
                  <Field label={t("Tags (séparés par des virgules)", "Tags (comma separated)")}>
                    <Input
                      value={sessionTagsInput}
                      onChange={(event) => setSessionTagsInput(event.target.value)}
                      placeholder={t("ex: prioritaire, follow-up, enterprise", "e.g. priority, follow-up, enterprise")}
                    />
                  </Field>
                  <Field label={t("Note interne", "Internal note")}>
                    <Textarea
                      value={sessionNoteInput}
                      onChange={(event) => setSessionNoteInput(event.target.value)}
                      rows={4}
                      placeholder={t("Résumé du contexte, points de vigilance, next step…", "Context summary, watchpoints, next step…")}
                    />
                  </Field>
                  <div className="bo-history-flex bo-history-items-center bo-history-gap-2">
                    <Button variant="secondary"
                      onClick={() => void saveSessionAdmin()}
                      loading={sessionAdminSaving}
                    >
                      <Save className="bo-history-w-3-5 bo-history-h-3-5" />
                      {sessionAdminSaving ? t("Enregistrement…", "Saving…") : t("Enregistrer", "Save")}
                    </Button>
                    {sessionAdminMessage && (
                      <span className="bo-history-text-xs bo-history-text-muted-foreground">{sessionAdminMessage}</span>
                    )}
                  </div>
                </section>

                <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-overflow-hidden">
                  <header className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium bo-history-inline-flex bo-history-items-center bo-history-gap-2">
                    <Activity className="bo-history-w-4 bo-history-h-4" />
                    {t("Événements funnel", "Funnel events")}
                  </header>
                  <div className="bo-history-max-h-64 bo-history-overflow-auto">
                    <table className="bo-history-w-full bo-history-text-sm">
                      <thead className="bo-history-bg-muted-40">
                        <tr className="bo-history-text-left">
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Date", "Date")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Step", "Step")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Event", "Event")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.stepEvents.map((event) => (
                          <tr key={event.id} className="bo-history-border-t bo-history-border-border">
                            <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(event.created_at, locale)}</td>
                            <td className="bo-history-px-3 bo-history-py-2">{event.step_id}</td>
                            <td className="bo-history-px-3 bo-history-py-2">{event.event_name}</td>
                          </tr>
                        ))}
                        {detail.stepEvents.length === 0 && (
                          <tr>
                            <td colSpan={3} className="bo-history-px-3 bo-history-py-6 bo-history-text-center bo-history-text-muted-foreground">
                              {t("Aucun événement", "No events")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-overflow-hidden">
                  <header className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium bo-history-inline-flex bo-history-items-center bo-history-gap-2">
                    <Mail className="bo-history-w-4 bo-history-h-4" />
                    {t("Jobs email", "Email jobs")}
                  </header>
                  <div className="bo-history-max-h-64 bo-history-overflow-auto">
                    <table className="bo-history-w-full bo-history-text-sm">
                      <thead className="bo-history-bg-muted-40">
                        <tr className="bo-history-text-left">
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Template", "Template")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Version", "Version")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Status", "Status")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Qualité", "Quality")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Attempts", "Attempts")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Programmé", "Scheduled")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Created", "Created")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Action", "Action")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.emailJobs.map((job) => {
                          const isBusy = emailJobActionLoadingId === job.id;
                          const ctaUrl = getJobCtaUrl(job);
                          const quality = getJobEmailQuality(job);
                          return (
                            <tr key={job.id} className="bo-history-border-t bo-history-border-border">
                              <td className="bo-history-px-3 bo-history-py-2">
                                <div className="bo-history-font-medium">{job.template_key}</div>
                                <div className="bo-history-text-xs bo-history-text-muted-foreground">{getJobTrigger(job)}</div>
                              </td>
                              <td className="bo-history-px-3 bo-history-py-2">{getJobTemplateVersion(job)}</td>
                              <td className="bo-history-px-3 bo-history-py-2">
                                <span className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${emailStatusClasses(job.status)}`}>
                                  {job.status}
                                </span>
                              </td>
                              <td className="bo-history-px-3 bo-history-py-2">
                                <span
                                  className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${emailQualityClasses(quality.status)}`}
                                  title={quality.flagIds.join(", ")}
                                >
                                  {quality.status}
                                  {quality.score != null ? ` ${quality.score}` : ""}
                                </span>
                              </td>
                              <td className="bo-history-px-3 bo-history-py-2">{job.attempts}</td>
                              <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(job.scheduled_for, locale)}</td>
                              <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(job.created_at, locale)}</td>
                              <td className="bo-history-px-3 bo-history-py-2">
                                <div className="bo-history-flex bo-history-flex-wrap bo-history-gap-1">
                                  {ctaUrl && (
                                    <TextLink variant="secondary"
                                      to={ctaUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <ExternalLink className="bo-history-w-3-5 bo-history-h-3-5" />
                                      CTA
                                    </TextLink>
                                  )}
                                  <Button variant="secondary"
                                    disabled={isBusy}
                                    onClick={() => void runEmailJobAction(job, "retry_now")}
                                  >
                                    <RotateCcw className="bo-history-w-3-5 bo-history-h-3-5" />
                                    {t("Relancer", "Retry")}
                                  </Button>
                                  <Button variant="secondary"
                                    disabled={isBusy || job.status === "cancelled"}
                                    onClick={() => void runEmailJobAction(job, "cancel")}
                                  >
                                    <Ban className="bo-history-w-3-5 bo-history-h-3-5" />
                                    {t("Annuler", "Cancel")}
                                  </Button>
                                </div>
                                {job.last_error && (
                                  <div className="bo-history-mt-1 bo-history-text-xs bo-history-text-red-600 bo-history-max-w-280px bo-history-truncate" title={job.last_error}>
                                    {job.last_error}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {detail.emailJobs.length === 0 && (
                          <tr>
                            <td colSpan={8} className="bo-history-px-3 bo-history-py-6 bo-history-text-center bo-history-text-muted-foreground">
                              {t("Aucun job email", "No email jobs")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-overflow-hidden">
                  <header className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium bo-history-inline-flex bo-history-items-center bo-history-gap-2">
                    <Activity className="bo-history-w-4 bo-history-h-4" />
                    {t("Historique email", "Email history")}
                  </header>
                  <div className="bo-history-max-h-52 bo-history-overflow-auto">
                    <table className="bo-history-w-full bo-history-text-sm">
                      <thead className="bo-history-bg-muted-40">
                        <tr className="bo-history-text-left">
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Date", "Date")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Job", "Job")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("De", "From")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Vers", "To")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Source", "Source")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.emailJobEvents.map((event) => (
                          <tr key={event.id} className="bo-history-border-t bo-history-border-border">
                            <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(event.created_at, locale)}</td>
                            <td className="bo-history-px-3 bo-history-py-2 bo-history-font-mono bo-history-text-xs">{event.job_id.slice(0, 8)}</td>
                            <td className="bo-history-px-3 bo-history-py-2">{event.status_from || "—"}</td>
                            <td className="bo-history-px-3 bo-history-py-2">
                              <span className={`bo-history-inline-flex bo-history-px-2 bo-history-py-0-5 bo-history-rounded-full bo-history-text-xs ${emailStatusClasses(event.status_to)}`}>
                                {event.status_to}
                              </span>
                            </td>
                            <td className="bo-history-px-3 bo-history-py-2">{event.event_source}</td>
                          </tr>
                        ))}
                        {detail.emailJobEvents.length === 0 && (
                          <tr>
                            <td colSpan={5} className="bo-history-px-3 bo-history-py-6 bo-history-text-center bo-history-text-muted-foreground">
                              {t("Aucun événement email", "No email events")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-overflow-hidden">
                  <header className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium bo-history-inline-flex bo-history-items-center bo-history-gap-2">
                    <Layers3 className="bo-history-w-4 bo-history-h-4" />
                    {t("Restitutions", "Restitutions")}
                  </header>
                  <div className="bo-history-max-h-52 bo-history-overflow-auto">
                    <table className="bo-history-w-full bo-history-text-sm">
                      <thead className="bo-history-bg-muted-40">
                        <tr className="bo-history-text-left">
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Date", "Date")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Canal", "Channel")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Version", "Version")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Template / profil", "Template / profile")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Sujet / risque", "Subject / risk")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Score", "Score")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Lien", "Link")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.restitutions || []).map((restitution) => {
                          const ctaUrl = getRestitutionCtaUrl(restitution);
                          return (
                            <tr key={restitution.id} className="bo-history-border-t bo-history-border-border">
                              <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(restitution.generated_at, locale)}</td>
                              <td className="bo-history-px-3 bo-history-py-2">{restitution.channel}</td>
                              <td className="bo-history-px-3 bo-history-py-2">{restitution.version}</td>
                              <td className="bo-history-px-3 bo-history-py-2">{getRestitutionTemplate(restitution)}</td>
                              <td className="bo-history-px-3 bo-history-py-2 bo-history-max-w-240px bo-history-truncate" title={getRestitutionSubject(restitution)}>
                                {getRestitutionSubject(restitution)}
                              </td>
                              <td className="bo-history-px-3 bo-history-py-2">{getRestitutionScore(restitution) ?? "—"}</td>
                              <td className="bo-history-px-3 bo-history-py-2">
                                {ctaUrl ? (
                                  <TextLink variant="secondary"
                                    to={ctaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <ExternalLink className="bo-history-w-3-5 bo-history-h-3-5" />
                                    CTA
                                  </TextLink>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {(detail.restitutions || []).length === 0 && (
                          <tr>
                            <td colSpan={7} className="bo-history-px-3 bo-history-py-6 bo-history-text-center bo-history-text-muted-foreground">
                              {t("Aucune restitution", "No restitutions")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bo-history-border bo-history-border-border bo-history-rounded-lg bo-history-overflow-hidden">
                  <header className="bo-history-px-3 bo-history-py-2 bo-history-border-b bo-history-border-border bo-history-text-sm bo-history-font-medium bo-history-inline-flex bo-history-items-center bo-history-gap-2">
                    <TrendingDown className="bo-history-w-4 bo-history-h-4" />
                    {t("Snapshots", "Snapshots")}
                  </header>
                  <div className="bo-history-max-h-52 bo-history-overflow-auto">
                    <table className="bo-history-w-full bo-history-text-sm">
                      <thead className="bo-history-bg-muted-40">
                        <tr className="bo-history-text-left">
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Date", "Date")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Step", "Step")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Progress", "Progress")}</th>
                          <th className="bo-history-px-3 bo-history-py-2 bo-history-font-medium">{t("Final", "Final")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.snapshots.map((snapshot) => (
                          <tr key={snapshot.id} className="bo-history-border-t bo-history-border-border">
                            <td className="bo-history-px-3 bo-history-py-2 bo-history-whitespace-nowrap">{formatDateTime(snapshot.created_at, locale)}</td>
                            <td className="bo-history-px-3 bo-history-py-2">{snapshot.step_id}</td>
                            <td className="bo-history-px-3 bo-history-py-2">{snapshot.completion_pct != null ? `${snapshot.completion_pct}%` : "—"}</td>
                            <td className="bo-history-px-3 bo-history-py-2">{snapshot.is_final ? <CheckCircle2 className="bo-history-w-4 bo-history-h-4 bo-history-text-green-600" /> : "—"}</td>
                          </tr>
                        ))}
                        {detail.snapshots.length === 0 && (
                          <tr>
                            <td colSpan={4} className="bo-history-px-3 bo-history-py-6 bo-history-text-center bo-history-text-muted-foreground">
                              {t("Aucun snapshot", "No snapshots")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </aside>
        </div>
      )}

      {loading && (
        <div className="bo-history-text-sm bo-history-text-muted-foreground bo-history-inline-flex bo-history-items-center bo-history-gap-2">
          <RefreshCw className="bo-history-w-4 bo-history-h-4 bo-history-animate-spin" />
          {t("Synchronisation des données…", "Syncing data…")}
        </div>
      )}
    </div>
  );
}
