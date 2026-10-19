import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { mergeAnonymousDraft, normalizePersonalStack, personalStackFingerprint, type PersonalStackRecord, type PersonalStackV4 } from "./personalStack";
import { clearPersonalStackScope, getPersonalStackScope, personalStackStorageKey, readPersonalStack, replacePersonalStack, setPersonalStackScope, subscribePersonalStack } from "./personalStackStore";
import { deletePersonalAccount, loadPersonalStack, savePersonalStack, StackAccountApiError } from "./stackAccountApi";

export type StackSyncStatus = "local" | "connecting" | "syncing" | "synced" | "unsaved" | "choice" | "conflict" | "session-expired" | "error";
export type DraftChoice = { draft: PersonalStackV4; saved: PersonalStackRecord };
export type StackConflict = { local: PersonalStackV4; remote: PersonalStackRecord | null };
export type AccountSnapshot = {
  user: User | null; syncStatus: StackSyncStatus; status: StackSyncStatus; error: string | null;
  pendingDraftChoice: DraftChoice | null; conflict: StackConflict | null; magicLinkSentTo: string | null;
  hasUnsavedChanges: boolean; signOutNeedsConfirmation: boolean;
};
type SyncMetadata = { version: 1; owner: string; revision: number; fingerprint: string };
type RequestScope = { owner: string; token: string; generation: number };
export type AccountAuthOptions = { lang?: "fr" | "en"; returnTo?: string };
const ACTIVE_OWNER_KEY = "tooltrim-personal-stack-active-account-v1";
const empty = () => normalizePersonalStack(null);
const fingerprint = personalStackFingerprint;
const hasContent = (state: PersonalStackV4) => fingerprint(state) !== fingerprint(empty());
export const accountSyncMetadataKey = (owner: string) => `${personalStackStorageKey(owner)}:sync`;
export const INITIAL_ACCOUNT_SNAPSHOT: AccountSnapshot = {
  user: null, syncStatus: "local", status: "local", error: null, pendingDraftChoice: null,
  conflict: null, magicLinkSentTo: null, hasUnsavedChanges: false, signOutNeedsConfirmation: false,
};

/** Same-origin known ToolTrim routes only; preserve permitted query and hash. */
export function getStackAccountReturnUrl(options: AccountAuthOptions = {}): string | undefined {
  if (typeof window === "undefined") return undefined;
  const fallback = new URL(`/${options.lang === "en" ? "en" : "fr"}/ma-stack`, window.location.origin).href;
  const requested = options.returnTo ?? `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (requested.includes("\\")) return fallback;
  try {
    const url = new URL(requested, window.location.origin);
    const [, lang, page] = url.pathname.split("/");
    const pages = new Set([undefined, "", "ma-stack", "my-stack", "panier", "cart", "tools", "tool", "category", "guides", "guide", "stacks", "stack", "comparatifs", "comparatif", "explorer", "about", "methodology", "transparency", "contact", "submit", "legal-notice", "privacy-policy", "terms", "search", "back-office"]);
    return url.origin === window.location.origin && (lang === "fr" || lang === "en") && pages.has(page) ? url.href : fallback;
  } catch { return fallback; }
}

/** One instance per application provider; hooks only consume its snapshot. */
export class StackAccountCoordinator {
  private snapshot = INITIAL_ACCOUNT_SNAPSHOT;
  private listeners = new Set<() => void>();
  private session: Session | null = null;
  private generation = 0;
  private running = false;
  private ready = false;
  private applying = false;
  private inFlight = false;
  private signingOut = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private metadata: SyncMetadata | null = null;
  private draft: PersonalStackV4 | null = null;
  private clearDraftAfterSave = false;

  constructor(private auth: SupabaseClient["auth"], readonly enabled: boolean) {}
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => INITIAL_ACCOUNT_SNAPSHOT;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit(patch: Partial<AccountSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch, ...(patch.syncStatus ? { status: patch.syncStatus } : {}) };
    this.listeners.forEach(listener => listener());
  }
  private cancelTimer() { if (this.timer !== undefined) clearTimeout(this.timer); this.timer = undefined; }
  private scope(): RequestScope | null {
    return this.session ? { owner: this.session.user.id, token: this.session.access_token, generation: this.generation } : null;
  }
  private current(scope: RequestScope): boolean {
    return this.running && this.session?.user.id === scope.owner && this.session.access_token === scope.token
      && this.generation === scope.generation && getPersonalStackScope() === scope.owner;
  }
  private readMetadata(owner: string): SyncMetadata | null {
    try {
      const value = JSON.parse(window.localStorage.getItem(accountSyncMetadataKey(owner)) || "null");
      return value && value.version === 1 && value.owner === owner && Number.isSafeInteger(value.revision) && value.revision >= 0 && typeof value.fingerprint === "string" ? value : null;
    } catch { return null; }
  }
  private confirm(scope: RequestScope, saved: PersonalStackRecord | null) {
    this.metadata = { version: 1, owner: scope.owner, revision: saved?.revision ?? 0, fingerprint: fingerprint(saved?.state ?? empty()) };
    try { window.localStorage.setItem(accountSyncMetadataKey(scope.owner), JSON.stringify(this.metadata)); } catch { /* Scoped in-memory confirmation remains valid for this session. */ }
  }
  private apply(state: PersonalStackV4) {
    this.applying = true;
    try { replacePersonalStack(state); } finally { this.applying = false; }
  }
  private finishDraft() {
    if (!this.draft) return;
    // Do not clear an anonymous draft another tab changed while this save ran.
    try {
      const raw = window.localStorage.getItem(personalStackStorageKey("anonymous"));
      if (raw && fingerprint(normalizePersonalStack(JSON.parse(raw))) === fingerprint(this.draft)) clearPersonalStackScope("anonymous");
    } catch { /* Retaining a draft is safer when its persistence cannot be checked. */ }
    this.draft = null; this.clearDraftAfterSave = false;
  }

  start(): () => void {
    if (!this.enabled) return () => {};
    this.running = true;
    // Only this true anonymous namespace is ever eligible for account import.
    if (getPersonalStackScope() === "anonymous") {
      const anonymous = readPersonalStack(); this.draft = hasContent(anonymous) ? anonymous : null;
    } else {
      try { const raw = window.localStorage.getItem(personalStackStorageKey("anonymous")); const anonymous = raw ? normalizePersonalStack(JSON.parse(raw)) : null;
        this.draft = anonymous && hasContent(anonymous) ? anonymous : null; } catch { this.draft = null; }
    }
    const offStore = subscribePersonalStack(this.storeChanged);
    const initialGeneration = this.generation;
    // Auth callbacks only update synchronous identity state and dispatch work; no awaited SDK calls under its lock.
    const { data } = this.auth.onAuthStateChange((_event, session) => { if (!this.signingOut || session) this.adoptSession(session); });
    void this.auth.getSession().then(result => {
      if (!this.running || this.generation !== initialGeneration) return;
      if (result.error) this.emit({ syncStatus: "error", error: "ACCOUNT_SESSION_UNAVAILABLE" });
      else this.adoptSession(result.data.session);
    }).catch(() => { if (this.running && this.generation === initialGeneration) this.emit({ syncStatus: "error", error: "ACCOUNT_SESSION_UNAVAILABLE" }); });
    return () => {
      this.running = false; this.generation++; this.cancelTimer(); offStore(); data.subscription.unsubscribe();
      this.session = null; this.ready = false; this.inFlight = false;
    };
  }

  private adoptSession(next: Session | null) {
    if (!this.running) return;
    if (next?.user.is_anonymous) next = null;
    if (next && this.session?.user.id === next.user.id && this.session.access_token === next.access_token) return;
    this.generation++; this.cancelTimer(); this.inFlight = false; this.ready = false;
    this.session = next;
    if (!next) {
      let owner = getPersonalStackScope();
      if (owner === "anonymous") {
        try { owner = window.localStorage.getItem(ACTIVE_OWNER_KEY) || "anonymous"; } catch { /* Keep current namespace. */ }
      }
      if (owner !== "anonymous") setPersonalStackScope(owner);
      this.emit({ user: null, syncStatus: owner === "anonymous" ? "local" : "session-expired", error: owner === "anonymous" ? null : "ACCOUNT_SESSION_INVALID", pendingDraftChoice: null, conflict: null,
        hasUnsavedChanges: owner !== "anonymous" });
      return;
    }
    const scope = this.scope()!;
    if (getPersonalStackScope() === "anonymous") {
      const anonymous = readPersonalStack(); this.draft = hasContent(anonymous) ? anonymous : null;
    }
    setPersonalStackScope(scope.owner);
    try { window.localStorage.setItem(ACTIVE_OWNER_KEY, scope.owner); } catch { /* Namespace remains isolated in memory. */ }
    this.metadata = this.readMetadata(scope.owner);
    this.emit({ user: next.user, syncStatus: "connecting", error: null, pendingDraftChoice: null, conflict: null, signOutNeedsConfirmation: false, magicLinkSentTo: null });
    const loadingFingerprint = fingerprint(readPersonalStack());
    void this.hydrate(scope, loadingFingerprint);
  }

  private async hydrate(scope: RequestScope, loadingFingerprint: string) {
    try {
      const remote = await loadPersonalStack(scope.token);
      if (!this.current(scope)) return;
      const local = readPersonalStack();
      const localFingerprint = fingerprint(local);
      const remoteFingerprint = fingerprint(remote?.state ?? empty());
      const dirty = localFingerprint !== loadingFingerprint || (this.metadata ? localFingerprint !== this.metadata.fingerprint : hasContent(local));
      if (dirty && localFingerprint !== remoteFingerprint) {
        if (this.metadata && this.metadata.revision === (remote?.revision ?? 0) && this.metadata.fingerprint === remoteFingerprint) {
          this.confirm(scope, remote); this.ready = true; this.storeChanged();
        } else this.showConflict(local, remote);
        return;
      }
      this.confirm(scope, remote);
      if (remote && hasContent(remote.state) && this.draft && hasContent(this.draft) && fingerprint(this.draft) !== remoteFingerprint) {
        this.apply(remote.state);
        this.emit({ syncStatus: "choice", pendingDraftChoice: { draft: this.draft, saved: remote }, hasUnsavedChanges: false });
        return;
      }
      const initial = this.draft && hasContent(this.draft) && (!remote || !hasContent(remote.state))
        ? mergeAnonymousDraft(remote?.state ?? empty(), this.draft) : remote?.state ?? local;
      this.apply(initial); this.ready = true;
      if (this.draft && fingerprint(initial) === remoteFingerprint) this.finishDraft();
      else this.clearDraftAfterSave = this.draft !== null;
      this.storeChanged();
    } catch (cause) { if (this.current(scope)) this.fail(cause); }
  }

  private showConflict(local: PersonalStackV4, remote: PersonalStackRecord | null) {
    this.ready = false;
    this.emit({ syncStatus: "conflict", error: "STACK_REVISION_CONFLICT", conflict: { local, remote }, hasUnsavedChanges: true });
  }
  private fail(cause: unknown) {
    const error = cause instanceof StackAccountApiError ? cause : new StackAccountApiError(0, "STACK_ACCOUNT_NETWORK_ERROR");
    if (error.status === 401) { this.ready = false; this.cancelTimer(); }
    this.emit({ syncStatus: error.status === 401 ? "session-expired" : "error", error: error.code, hasUnsavedChanges: true });
  }
  private storeChanged = () => {
    const scope = this.scope();
    if (!scope || !this.current(scope) || this.applying || !this.ready || this.snapshot.pendingDraftChoice || this.snapshot.conflict) return;
    const dirty = fingerprint(readPersonalStack()) !== this.metadata?.fingerprint;
    this.cancelTimer();
    if (!dirty) { this.emit({ syncStatus: "synced", error: null, hasUnsavedChanges: false }); return; }
    this.emit({ syncStatus: this.inFlight ? "syncing" : "unsaved", hasUnsavedChanges: true });
    if (!this.inFlight) this.timer = setTimeout(() => { void this.saveCurrent(scope); }, 650);
  };

  private async saveCurrent(scope: RequestScope): Promise<boolean> {
    if (!this.current(scope) || this.inFlight || !this.ready || !this.metadata) return false;
    this.cancelTimer(); this.inFlight = true;
    const submitted = readPersonalStack(); const submittedFingerprint = fingerprint(submitted);
    const revision = this.metadata.revision;
    this.emit({ syncStatus: "syncing", error: null, hasUnsavedChanges: true });
    let saved: PersonalStackRecord;
    try {
      try { saved = await savePersonalStack(scope.token, { expectedRevision: revision, state: submitted }); }
      catch (cause) {
        if (!this.current(scope)) return false;
        if (cause instanceof StackAccountApiError && (cause.status === 401 || cause.status === 400 || cause.status === 413 || cause.code === "ACCOUNT_DELETING")) throw cause;
        // A response may be lost after commit. Reconcile by value before permitting another write.
        const latest = await loadPersonalStack(scope.token);
        if (!this.current(scope)) return false;
        if (!latest || fingerprint(latest.state) !== submittedFingerprint) { this.showConflict(readPersonalStack(), latest); return false; }
        saved = latest;
      }
      if (!this.current(scope)) return false;
      this.confirm(scope, saved);
      if (fingerprint(readPersonalStack()) === submittedFingerprint) this.apply(saved.state);
      if (this.clearDraftAfterSave) this.finishDraft();
      return true;
    } catch (cause) { if (this.current(scope)) this.fail(cause); return false; }
    finally {
      if (this.current(scope)) {
        this.inFlight = false;
        // Read the whole current store again: an edit may have happened during either request.
        if (this.snapshot.syncStatus !== "error" && this.snapshot.syncStatus !== "session-expired" && !this.snapshot.conflict) this.storeChanged();
      }
    }
  }

  loadSaved = async (): Promise<boolean> => {
    const scope = this.scope(); const choice = this.snapshot.pendingDraftChoice;
    if (!scope || !this.current(scope) || !choice) return false;
    this.apply(choice.saved.state); this.confirm(scope, choice.saved); this.ready = true;
    this.emit({ pendingDraftChoice: null, error: null }); this.finishDraft(); this.storeChanged(); return true;
  };
  addDraft = async (): Promise<boolean> => {
    const scope = this.scope(); const choice = this.snapshot.pendingDraftChoice;
    if (!scope || !this.current(scope) || !choice) return false;
    this.apply(mergeAnonymousDraft(readPersonalStack(), choice.draft)); this.confirm(scope, choice.saved);
    this.ready = true; this.clearDraftAfterSave = true; this.emit({ pendingDraftChoice: null });
    return this.saveCurrent(scope);
  };
  reloadLatest = async (): Promise<boolean> => {
    const scope = this.scope(); if (!scope || !this.current(scope) || this.inFlight) return false;
    this.cancelTimer(); this.ready = false;
    const before = fingerprint(readPersonalStack());
    try {
      const latest = await loadPersonalStack(scope.token);
      if (!this.current(scope)) return false;
      if (fingerprint(readPersonalStack()) !== before) { this.showConflict(readPersonalStack(), latest); return false; }
      this.apply(latest?.state ?? empty()); this.confirm(scope, latest); this.ready = true;
      this.emit({ conflict: null, error: null }); this.storeChanged(); return true;
    } catch (cause) { if (this.current(scope)) this.fail(cause); return false; }
  };
  keepCurrent = async (): Promise<boolean> => {
    const scope = this.scope(); const conflict = this.snapshot.conflict;
    if (!scope || !this.current(scope) || !conflict) return false;
    this.confirm(scope, conflict.remote); this.ready = true; this.emit({ conflict: null });
    return this.saveCurrent(scope);
  };
  retry = async (): Promise<boolean> => {
    const scope = this.scope(); if (!scope || !this.current(scope)) return false;
    if (this.snapshot.conflict || this.snapshot.pendingDraftChoice) return false;
    this.ready = false; await this.hydrate(scope, fingerprint(readPersonalStack()));
    return this.snapshot.syncStatus !== "error" && this.snapshot.syncStatus !== "session-expired";
  };

  signInWithGoogle = async (options: AccountAuthOptions = {}): Promise<boolean> => {
    if (!this.enabled) return false;
    const generation = this.generation;
    this.emit({ error: null });
    try {
      const { error } = await this.auth.signInWithOAuth({ provider: "google", options: { redirectTo: getStackAccountReturnUrl(options) } });
      if (error) throw error; return true;
    } catch { if (this.running && generation === this.generation) this.emit({ error: "ACCOUNT_GOOGLE_SIGN_IN_FAILED" }); return false; }
  };
  sendEmailCode = async (email: string, options: AccountAuthOptions = {}): Promise<boolean> => {
    if (!this.enabled) return false;
    const generation = this.generation;
    const normalized = email.trim().toLowerCase();
    this.emit({ error: null, magicLinkSentTo: null });
    try {
      const { error } = await this.auth.signInWithOtp({ email: normalized, options: { shouldCreateUser: true, emailRedirectTo: getStackAccountReturnUrl(options) } });
      if (!this.running || generation !== this.generation) return false;
      if (error) throw error; this.emit({ magicLinkSentTo: normalized }); return true;
    } catch { if (this.running && generation === this.generation) this.emit({ error: "ACCOUNT_EMAIL_CODE_FAILED" }); return false; }
  };
  verifyEmailCode = async (email: string, code: string): Promise<boolean> => {
    if (!this.enabled) return false;
    const generation = this.generation;
    try {
      const { error } = await this.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
      if (error) throw error; if (this.running && generation === this.generation) this.emit({ error: null }); return true;
    } catch { if (this.running && generation === this.generation) this.emit({ error: "ACCOUNT_EMAIL_CODE_INVALID" }); return false; }
  };
  signOut = async (options: { discardUnsaved?: boolean } = {}): Promise<boolean> => {
    if (!this.enabled) return false;
    if (this.snapshot.hasUnsavedChanges && !options.discardUnsaved) { this.emit({ signOutNeedsConfirmation: true }); return false; }
    const owner = this.session?.user.id ?? (getPersonalStackScope() !== "anonymous" ? getPersonalStackScope() : null);
    this.generation++; this.cancelTimer(); this.signingOut = true;
    const generation = this.generation;
    try {
      const { error } = await this.auth.signOut();
      if (!this.running || this.generation !== generation || (owner && getPersonalStackScope() !== owner)) return false;
      if (error) throw error;
      this.session = null; this.ready = false; this.inFlight = false; this.draft = null;
      if (owner) { clearPersonalStackScope(owner); try { window.localStorage.removeItem(accountSyncMetadataKey(owner)); } catch { /* Session stays cleared. */ } }
      clearPersonalStackScope("anonymous"); setPersonalStackScope("anonymous");
      try { window.localStorage.removeItem(ACTIVE_OWNER_KEY); } catch { /* Private scopes still cannot become drafts. */ }
      this.emit({ ...INITIAL_ACCOUNT_SNAPSHOT }); return true;
    } catch { if (this.running && this.generation === generation) this.emit({ syncStatus: "error", error: "ACCOUNT_SIGN_OUT_FAILED" }); return false; }
    finally { this.signingOut = false; }
  };
  deleteAccount = async (): Promise<boolean> => {
    const scope = this.scope(); if (!scope || !this.current(scope)) return false;
    try { await deletePersonalAccount(scope.token); }
    catch (cause) { if (this.current(scope)) this.fail(cause); return false; }
    // Task 6 supplies the deletion lifecycle and purge. Never present this prepared interface as complete.
    if (this.current(scope)) this.emit({ syncStatus: "error", error: "ACCOUNT_DELETION_UNAVAILABLE" });
    return false;
  };
}
