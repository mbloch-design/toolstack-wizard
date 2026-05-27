import { useCallback, useEffect, useMemo, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { removeNoindex, setNoindex } from "@/lib/seo";
import {
  type BackofficeEmailJob,
  type BackofficeDashboardResponse,
  type BackofficeSession,
  type BackofficeSessionDetailResponse,
  fetchBackofficeDashboard,
  fetchBackofficeSessionDetail,
  updateBackofficeEmailJob,
  updateBackofficeSessionAdmin,
} from "@/lib/backofficeApi";
import {
  Activity,
  Ban,
  CheckCircle2,
  Download,
  Eye,
  Filter,
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
} from "lucide-react";

const STORAGE_KEY = "tooltrim.backoffice.admin_key";

type SessionStatus = "all" | "new" | "active" | "completed" | "abandoned";
type TabId = "sessions" | "emails";

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

function getRiskFlags(session: BackofficeSession) {
  return Array.isArray(session.risk_flags)
    ? session.risk_flags.map(asRecord).filter((flag): flag is Record<string, unknown> => !!flag)
    : [];
}

function getSessionStatus(session: BackofficeSession): Exclude<SessionStatus, "all"> {
  if (session.abandoned_at) return "abandoned";
  if (session.completed_at) return "completed";
  if ((session.last_step_id || 0) > 0) return "active";
  return "new";
}

function statusClasses(status: Exclude<SessionStatus, "all">) {
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "abandoned") return "bg-red-100 text-red-700";
  if (status === "active") return "bg-amber-100 text-amber-800";
  return "bg-muted text-foreground";
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

export default function BackOfficePage() {
  const { lang, t } = useLang();
  const locale = lang === "en" ? "en" : "fr";

  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [adminKey, setAdminKey] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<BackofficeDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>("sessions");
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(150);
  const [personaFilter, setPersonaFilter] = useState<string>("all");
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<SessionStatus>("all");
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
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
      setAdminKey(savedKey);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBackofficeDashboard(adminKey, {
        days,
        limit,
        persona: personaFilter === "all" ? null : personaFilter,
      });
      setDashboard(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, [adminKey, days, limit, personaFilter]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!adminKey) return;
    const timer = setInterval(() => {
      void loadDashboard();
    }, 30000);
    return () => clearInterval(timer);
  }, [adminKey, loadDashboard]);

  const openDetail = useCallback(
    async (sessionId: string) => {
      if (!adminKey) return;
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);
      setSessionAdminMessage(null);
      try {
        const response = await fetchBackofficeSessionDetail(adminKey, sessionId);
        setDetail(response);
      } catch (e) {
        setDetailError(e instanceof Error ? e.message : "Unable to load session detail");
      } finally {
        setDetailLoading(false);
      }
    },
    [adminKey]
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

  const connect = useCallback(() => {
    const value = adminKeyInput.trim();
    if (!value) return;
    localStorage.setItem(STORAGE_KEY, value);
    setAdminKey(value);
    setError(null);
    setAdminKeyInput("");
  }, [adminKeyInput]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAdminKey(null);
    setDashboard(null);
    setDetail(null);
    setError(null);
    setDetailError(null);
  }, []);

  const saveSessionAdmin = useCallback(async () => {
    if (!adminKey || !detail?.session?.session_id) return;
    setSessionAdminSaving(true);
    setSessionAdminMessage(null);
    try {
      const tags = parseTagsInput(sessionTagsInput);
      const result = await updateBackofficeSessionAdmin(adminKey, {
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
  }, [adminKey, detail?.session?.session_id, loadDashboard, sessionNoteInput, sessionTagsInput, t]);

  const runEmailJobAction = useCallback(
    async (job: BackofficeEmailJob, action: "retry_now" | "cancel" | "schedule") => {
      if (!adminKey) return;
      setEmailJobActionLoadingId(job.id);
      setEmailJobActionError(null);
      try {
        const scheduledFor =
          action === "schedule"
            ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
            : undefined;
        const result = await updateBackofficeEmailJob(adminKey, {
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
          const refreshed = await fetchBackofficeSessionDetail(adminKey, result.job.session_id);
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
    [adminKey, detail?.session?.session_id, loadDashboard, t]
  );

  const exportSessionsCsv = useCallback(() => {
    const rows = filteredSessions.map((session) => ({
      session_id: session.session_id,
      created_at: session.created_at,
      updated_at: session.updated_at,
      completed_at: session.completed_at,
      abandoned_at: session.abandoned_at,
      first_name: session.first_name,
      email: session.email,
      persona: session.persona,
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
    }));
    downloadCsv(
      `tooltrim-backoffice-sessions-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "session_id",
        "created_at",
        "updated_at",
        "completed_at",
        "abandoned_at",
        "first_name",
        "email",
        "persona",
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
      ],
      rows
    );
  }, [filteredSessions]);

  const exportEmailCsv = useCallback(() => {
    const rows = (dashboard?.recentEmailJobs || []).map((job) => ({
      id: job.id,
      session_id: job.session_id,
      email: job.email,
      template_key: job.template_key,
      locale: job.locale,
      status: job.status,
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
    }));
    downloadCsv(
      `tooltrim-backoffice-email-jobs-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "id",
        "session_id",
        "email",
        "template_key",
        "locale",
        "status",
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

  if (!adminKey) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="border border-border rounded-lg bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Lock className="w-5 h-5" />
            <h1 className="text-xl font-semibold">
              {t("Back-office ToolTrim", "ToolTrim Back Office")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(
              "Saisis ta clé d'administration pour ouvrir le suivi diagnostic.",
              "Enter your admin key to open diagnostic operations."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={adminKeyInput}
              onChange={(event) => setAdminKeyInput(event.target.value)}
              placeholder={t("Clé d'administration", "Admin key")}
              className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
            />
            <button
              onClick={connect}
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              {t("Ouvrir", "Open")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("Back-office diagnostic", "Diagnostic back office")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "Pilotage onboarding, scoring, persistance et cycle email.",
              "Operational view for onboarding, scoring, persistence, and email lifecycle."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={activeTab === "sessions" ? exportSessionsCsv : exportEmailCsv}
            className="h-9 px-3 rounded-md border border-border text-sm inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t("Exporter CSV", "Export CSV")}
          </button>
          <button
            onClick={() => void loadDashboard()}
            className="h-9 px-3 rounded-md border border-border text-sm inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {t("Rafraîchir", "Refresh")}
          </button>
          <button
            onClick={disconnect}
            className="h-9 px-3 rounded-md border border-border text-sm inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t("Fermer", "Sign out")}
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red-300 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground">{t("Sessions", "Sessions")}</div>
          <div className="mt-2 text-2xl font-semibold">{kpis.total}</div>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground">{t("Terminées", "Completed")}</div>
          <div className="mt-2 text-2xl font-semibold">{kpis.completed}</div>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground">{t("Score moyen", "Average score")}</div>
          <div className="mt-2 text-2xl font-semibold">{kpis.avgHealth}</div>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground">{t("Gaspillage cumulé/mois", "Cumulative waste/mo")}</div>
          <div className="mt-2 text-2xl font-semibold">{formatMoney(kpis.monthlyWaste)}</div>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground">{t("Succès envoi email", "Email send success")}</div>
          <div className="mt-2 text-2xl font-semibold">{kpis.emailSuccessRate}%</div>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card p-3 flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="relative xl:max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("Chercher email, prénom, session…", "Search email, first name, session…")}
            className="h-9 w-full pl-8 pr-3 rounded-md border border-input bg-background text-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="w-4 h-4" />
          {t("Filtres", "Filters")}
        </div>

        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value={7}>{t("7 jours", "7 days")}</option>
          <option value={30}>{t("30 jours", "30 days")}</option>
          <option value={90}>{t("90 jours", "90 days")}</option>
        </select>

        <select
          value={personaFilter}
          onChange={(event) => setPersonaFilter(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {personaOptions.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? t("Toutes personas", "All personas") : value}
            </option>
          ))}
        </select>

        <select
          value={profileFilter}
          onChange={(event) => setProfileFilter(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {profileOptions.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? t("Tous profils", "All profiles") : humanizeId(value)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as SessionStatus)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">{t("Tous statuts", "All statuses")}</option>
          <option value="new">{t("Nouvelles", "New")}</option>
          <option value="active">{t("En cours", "In progress")}</option>
          <option value="completed">{t("Terminées", "Completed")}</option>
          <option value="abandoned">{t("Abandonnées", "Abandoned")}</option>
        </select>

        <select
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value))}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value={100}>100</option>
          <option value={150}>150</option>
          <option value={250}>250</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`h-9 px-3 rounded-md text-sm inline-flex items-center gap-2 ${
            activeTab === "sessions" ? "bg-primary text-primary-foreground" : "border border-border"
          }`}
        >
          <Users className="w-4 h-4" />
          {t("Sessions", "Sessions")}
        </button>
        <button
          onClick={() => setActiveTab("emails")}
          className={`h-9 px-3 rounded-md text-sm inline-flex items-center gap-2 ${
            activeTab === "emails" ? "bg-primary text-primary-foreground" : "border border-border"
          }`}
        >
          <Mail className="w-4 h-4" />
          {t("Emails", "Emails")}
        </button>
      </div>

      {activeTab === "sessions" && (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">{t("Créée", "Created")}</th>
                  <th className="px-3 py-2 font-medium">{t("Contact", "Contact")}</th>
                  <th className="px-3 py-2 font-medium">{t("Persona", "Persona")}</th>
                  <th className="px-3 py-2 font-medium">{t("Profil", "Profile")}</th>
                  <th className="px-3 py-2 font-medium">{t("Tags", "Tags")}</th>
                  <th className="px-3 py-2 font-medium">{t("Statut", "Status")}</th>
                  <th className="px-3 py-2 font-medium">{t("Step max", "Max step")}</th>
                  <th className="px-3 py-2 font-medium">{t("Score", "Score")}</th>
                  <th className="px-3 py-2 font-medium">{t("Gaspillage/mo", "Waste/mo")}</th>
                  <th className="px-3 py-2 font-medium">{t("Emails", "Emails")}</th>
                  <th className="px-3 py-2 font-medium">{t("Événements", "Events")}</th>
                  <th className="px-3 py-2 font-medium">{t("Action", "Action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => {
                  const status = getSessionStatus(session);
                  return (
                    <tr key={session.session_id} className="border-t border-border">
                      <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(session.created_at, locale)}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{session.first_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{session.email || "—"}</div>
                      </td>
                      <td className="px-3 py-2">{session.persona || "—"}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{getInsightLabel(session, "profile", locale)}</div>
                        <div className="text-xs text-muted-foreground">{humanizeId(session.primary_risk)}</div>
                      </td>
                      <td className="px-3 py-2">
                        {(session.admin_tags || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(session.admin_tags || []).slice(0, 2).map((tag) => (
                              <span key={tag} className="inline-flex px-2 py-0.5 rounded-full text-xs bg-muted">
                                {tag}
                              </span>
                            ))}
                            {(session.admin_tags || []).length > 2 && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-muted">
                                +{(session.admin_tags || []).length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${statusClasses(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{session.max_step_seen ?? session.last_step_id ?? "—"}</td>
                      <td className="px-3 py-2">{session.health_score ?? "—"}</td>
                      <td className="px-3 py-2">{formatMoney(session.estimated_waste)}</td>
                      <td className="px-3 py-2">
                        {session.email_sent_count}/{session.email_jobs_count}
                      </td>
                      <td className="px-3 py-2">{session.event_count || 0}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => void openDetail(session.session_id)}
                          className="h-8 px-2 rounded-md border border-border inline-flex items-center gap-1 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t("Détails", "Details")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-3 py-8 text-center text-muted-foreground">
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="border border-border rounded-lg bg-card p-3">
              <div className="text-xs text-muted-foreground">{t("Total jobs", "Total jobs")}</div>
              <div className="text-lg font-semibold mt-1">{emailSummary.total}</div>
            </div>
            <div className="border border-border rounded-lg bg-card p-3">
              <div className="text-xs text-muted-foreground">{t("Sent", "Sent")}</div>
              <div className="text-lg font-semibold mt-1">{emailSummary.sent}</div>
            </div>
            <div className="border border-border rounded-lg bg-card p-3">
              <div className="text-xs text-muted-foreground">{t("Delivered", "Delivered")}</div>
              <div className="text-lg font-semibold mt-1">{emailSummary.delivered}</div>
            </div>
            <div className="border border-border rounded-lg bg-card p-3">
              <div className="text-xs text-muted-foreground">{t("Opened", "Opened")}</div>
              <div className="text-lg font-semibold mt-1">{emailSummary.opened}</div>
            </div>
            <div className="border border-border rounded-lg bg-card p-3">
              <div className="text-xs text-muted-foreground">{t("Clicked", "Clicked")}</div>
              <div className="text-lg font-semibold mt-1">{emailSummary.clicked}</div>
            </div>
            <div className="border border-border rounded-lg bg-card p-3">
              <div className="text-xs text-muted-foreground">{t("Failed", "Failed")}</div>
              <div className="text-lg font-semibold mt-1 text-red-600">{emailSummary.failed}</div>
            </div>
          </div>

          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-3 py-2 border-b border-border text-sm font-medium">
              {t("Santé email par jour et template", "Email health by day and template")}
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">{t("Jour", "Day")}</th>
                    <th className="px-3 py-2 font-medium">{t("Template", "Template")}</th>
                    <th className="px-3 py-2 font-medium">{t("Locale", "Locale")}</th>
                    <th className="px-3 py-2 font-medium">{t("Total", "Total")}</th>
                    <th className="px-3 py-2 font-medium">{t("Sent", "Sent")}</th>
                    <th className="px-3 py-2 font-medium">{t("Delivered", "Delivered")}</th>
                    <th className="px-3 py-2 font-medium">{t("Opened", "Opened")}</th>
                    <th className="px-3 py-2 font-medium">{t("Clicked", "Clicked")}</th>
                    <th className="px-3 py-2 font-medium">{t("Failed", "Failed")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.emailHealth || []).map((row, index) => (
                    <tr key={`${row.day}-${row.template_key}-${row.locale}-${index}`} className="border-t border-border">
                      <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(row.day, locale)}</td>
                      <td className="px-3 py-2">{row.template_key}</td>
                      <td className="px-3 py-2">{row.locale}</td>
                      <td className="px-3 py-2">{row.total_jobs}</td>
                      <td className="px-3 py-2">{row.sent_jobs}</td>
                      <td className="px-3 py-2">{row.delivered_jobs}</td>
                      <td className="px-3 py-2">{row.opened_jobs}</td>
                      <td className="px-3 py-2">{row.clicked_jobs}</td>
                      <td className="px-3 py-2 text-red-600">{row.failed_jobs}</td>
                    </tr>
                  ))}
                  {!loading && (dashboard?.emailHealth || []).length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                        {t("Aucune donnée email sur la période", "No email data on this period")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {emailJobActionError && (
            <div className="border border-red-300 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">
              {emailJobActionError}
            </div>
          )}

          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-3 py-2 border-b border-border text-sm font-medium">
              {t("Jobs email récents", "Recent email jobs")}
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">{t("Créé", "Created")}</th>
                    <th className="px-3 py-2 font-medium">{t("Email", "Email")}</th>
                    <th className="px-3 py-2 font-medium">{t("Template", "Template")}</th>
                    <th className="px-3 py-2 font-medium">{t("Status", "Status")}</th>
                    <th className="px-3 py-2 font-medium">{t("Schedule", "Schedule")}</th>
                    <th className="px-3 py-2 font-medium">{t("Attempts", "Attempts")}</th>
                    <th className="px-3 py-2 font-medium">{t("Actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.recentEmailJobs || []).map((job) => {
                    const isBusy = emailJobActionLoadingId === job.id;
                    return (
                      <tr key={job.id} className="border-t border-border">
                        <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(job.created_at, locale)}</td>
                        <td className="px-3 py-2">{job.email}</td>
                        <td className="px-3 py-2">{job.template_key}</td>
                        <td className="px-3 py-2">{job.status}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(job.scheduled_for, locale)}</td>
                        <td className="px-3 py-2">{job.attempts}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            <button
                              disabled={isBusy}
                              onClick={() => void runEmailJobAction(job, "retry_now")}
                              className="h-7 px-2 rounded-md border border-border text-xs inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              {t("Relancer", "Retry")}
                            </button>
                            <button
                              disabled={isBusy}
                              onClick={() => void runEmailJobAction(job, "schedule")}
                              className="h-7 px-2 rounded-md border border-border text-xs inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? "animate-spin" : ""}`} />
                              {t("+1h", "+1h")}
                            </button>
                            <button
                              disabled={isBusy || job.status === "cancelled"}
                              onClick={() => void runEmailJobAction(job, "cancel")}
                              className="h-7 px-2 rounded-md border border-border text-xs inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              {t("Annuler", "Cancel")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && (dashboard?.recentEmailJobs || []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
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

      {(detailLoading || detail || detailError) && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/25"
            onClick={() => {
              setDetail(null);
              setDetailError(null);
              setSessionAdminMessage(null);
            }}
          />
          <aside className="absolute top-0 right-0 h-full w-full max-w-2xl bg-background border-l border-border p-4 overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  {t("Détail session", "Session detail")}
                </h2>
                {detail?.session && (
                  <p className="text-sm text-muted-foreground">
                    {detail.session.session_id}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setDetail(null);
                  setDetailError(null);
                  setSessionAdminMessage(null);
                }}
                className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading && (
              <div className="mt-6 text-sm text-muted-foreground inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t("Chargement…", "Loading…")}
              </div>
            )}

            {detailError && (
              <div className="mt-6 border border-red-300 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">
                {detailError}
              </div>
            )}

            {detail && (
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="border border-border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">{t("Score", "Score")}</div>
                    <div className="text-xl font-semibold mt-1">{detail.session.health_score ?? "—"}</div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">{t("Step max", "Max step")}</div>
                    <div className="text-xl font-semibold mt-1">{detail.session.max_step_seen ?? "—"}</div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">{t("Emails sent", "Emails sent")}</div>
                    <div className="text-xl font-semibold mt-1">{detail.session.email_sent_count}</div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">{t("Waste/mo", "Waste/mo")}</div>
                    <div className="text-xl font-semibold mt-1">{formatMoney(detail.session.estimated_waste)}</div>
                  </div>
                </div>

                {(() => {
                  const riskFlags = getRiskFlags(detail.session);
                  const primaryRisk = riskFlags.find((flag) => flag.id === detail.session.primary_risk) || riskFlags[0];
                  const primaryRiskLabel =
                    localizedField(primaryRisk || null, "label", locale) || humanizeId(detail.session.primary_risk);
                  const primaryRiskDetail = localizedField(primaryRisk || null, "detail", locale);
                  return (
                    <section className="border border-border rounded-lg p-3 space-y-3">
                      <div className="inline-flex items-center gap-2 text-sm font-medium">
                        <Layers3 className="w-4 h-4" />
                        {t("Lecture diagnostic GO7", "GO7 diagnostic read")}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted-foreground">{t("Profil stack", "Stack profile")}</div>
                          <div className="mt-1 text-sm font-semibold">{getInsightLabel(detail.session, "profile", locale)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted-foreground">{t("Maturité", "Maturity")}</div>
                          <div className="mt-1 text-sm font-semibold">{getInsightLabel(detail.session, "maturity", locale)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {t("Risque principal", "Primary risk")}
                          </div>
                          <div className="mt-1 text-sm font-semibold">{primaryRiskLabel}</div>
                          {primaryRiskDetail && (
                            <div className="mt-1 text-xs text-muted-foreground">{primaryRiskDetail}</div>
                          )}
                        </div>
                      </div>
                      {riskFlags.length > 0 && (
                        <div className="space-y-2">
                          {riskFlags.slice(0, 4).map((flag) => (
                            <div key={String(flag.id)} className="rounded-lg bg-muted/30 px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">
                                  {localizedField(flag, "label", locale) || humanizeId(String(flag.id || ""))}
                                </span>
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  {String(flag.severity || "low")}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {localizedField(flag, "action", locale) || "—"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })()}

                <section className="border border-border rounded-lg p-3 space-y-3">
                  <div className="inline-flex items-center gap-2 text-sm font-medium">
                    <Tag className="w-4 h-4" />
                    {t("Annotations back-office", "Back-office annotations")}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      {t("Tags (séparés par des virgules)", "Tags (comma separated)")}
                    </label>
                    <input
                      value={sessionTagsInput}
                      onChange={(event) => setSessionTagsInput(event.target.value)}
                      placeholder={t("ex: prioritaire, follow-up, enterprise", "e.g. priority, follow-up, enterprise")}
                      className="h-9 w-full px-3 rounded-md border border-input bg-background text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      {t("Note interne", "Internal note")}
                    </label>
                    <textarea
                      value={sessionNoteInput}
                      onChange={(event) => setSessionNoteInput(event.target.value)}
                      rows={4}
                      placeholder={t("Résumé du contexte, points de vigilance, next step…", "Context summary, watchpoints, next step…")}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void saveSessionAdmin()}
                      disabled={sessionAdminSaving}
                      className="h-8 px-3 rounded-md border border-border text-sm inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {sessionAdminSaving ? t("Enregistrement…", "Saving…") : t("Enregistrer", "Save")}
                    </button>
                    {sessionAdminMessage && (
                      <span className="text-xs text-muted-foreground">{sessionAdminMessage}</span>
                    )}
                  </div>
                </section>

                <section className="border border-border rounded-lg overflow-hidden">
                  <header className="px-3 py-2 border-b border-border text-sm font-medium inline-flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {t("Événements funnel", "Funnel events")}
                  </header>
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr className="text-left">
                          <th className="px-3 py-2 font-medium">{t("Date", "Date")}</th>
                          <th className="px-3 py-2 font-medium">{t("Step", "Step")}</th>
                          <th className="px-3 py-2 font-medium">{t("Event", "Event")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.stepEvents.map((event) => (
                          <tr key={event.id} className="border-t border-border">
                            <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(event.created_at, locale)}</td>
                            <td className="px-3 py-2">{event.step_id}</td>
                            <td className="px-3 py-2">{event.event_name}</td>
                          </tr>
                        ))}
                        {detail.stepEvents.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                              {t("Aucun événement", "No events")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="border border-border rounded-lg overflow-hidden">
                  <header className="px-3 py-2 border-b border-border text-sm font-medium inline-flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {t("Jobs email", "Email jobs")}
                  </header>
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr className="text-left">
                          <th className="px-3 py-2 font-medium">{t("Template", "Template")}</th>
                          <th className="px-3 py-2 font-medium">{t("Status", "Status")}</th>
                          <th className="px-3 py-2 font-medium">{t("Attempts", "Attempts")}</th>
                          <th className="px-3 py-2 font-medium">{t("Created", "Created")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.emailJobs.map((job) => (
                          <tr key={job.id} className="border-t border-border">
                            <td className="px-3 py-2">{job.template_key}</td>
                            <td className="px-3 py-2">{job.status}</td>
                            <td className="px-3 py-2">{job.attempts}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(job.created_at, locale)}</td>
                          </tr>
                        ))}
                        {detail.emailJobs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                              {t("Aucun job email", "No email jobs")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="border border-border rounded-lg overflow-hidden">
                  <header className="px-3 py-2 border-b border-border text-sm font-medium inline-flex items-center gap-2">
                    <Layers3 className="w-4 h-4" />
                    {t("Restitutions", "Restitutions")}
                  </header>
                  <div className="max-h-52 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr className="text-left">
                          <th className="px-3 py-2 font-medium">{t("Date", "Date")}</th>
                          <th className="px-3 py-2 font-medium">{t("Canal", "Channel")}</th>
                          <th className="px-3 py-2 font-medium">{t("Version", "Version")}</th>
                          <th className="px-3 py-2 font-medium">{t("Score", "Score")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.restitutions || []).map((restitution) => (
                          <tr key={restitution.id} className="border-t border-border">
                            <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(restitution.generated_at, locale)}</td>
                            <td className="px-3 py-2">{restitution.channel}</td>
                            <td className="px-3 py-2">{restitution.version}</td>
                            <td className="px-3 py-2">
                              {typeof restitution.score_snapshot?.health_score === "number"
                                ? restitution.score_snapshot.health_score
                                : "—"}
                            </td>
                          </tr>
                        ))}
                        {(detail.restitutions || []).length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                              {t("Aucune restitution", "No restitutions")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="border border-border rounded-lg overflow-hidden">
                  <header className="px-3 py-2 border-b border-border text-sm font-medium inline-flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    {t("Snapshots", "Snapshots")}
                  </header>
                  <div className="max-h-52 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr className="text-left">
                          <th className="px-3 py-2 font-medium">{t("Date", "Date")}</th>
                          <th className="px-3 py-2 font-medium">{t("Step", "Step")}</th>
                          <th className="px-3 py-2 font-medium">{t("Progress", "Progress")}</th>
                          <th className="px-3 py-2 font-medium">{t("Final", "Final")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.snapshots.map((snapshot) => (
                          <tr key={snapshot.id} className="border-t border-border">
                            <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(snapshot.created_at, locale)}</td>
                            <td className="px-3 py-2">{snapshot.step_id}</td>
                            <td className="px-3 py-2">{snapshot.completion_pct != null ? `${snapshot.completion_pct}%` : "—"}</td>
                            <td className="px-3 py-2">{snapshot.is_final ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : "—"}</td>
                          </tr>
                        ))}
                        {detail.snapshots.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
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
        <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          {t("Synchronisation des données…", "Syncing data…")}
        </div>
      )}
    </div>
  );
}
