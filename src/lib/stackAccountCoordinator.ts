import type { AuthChangeEvent, Session, SupabaseClient, User } from "@supabase/supabase-js";
import { mergeAnonymousDraft, normalizePersonalStack, personalStackFingerprint, type PersonalStackRecord, type PersonalStackV4 } from "./personalStack";
import { clearPersonalStackScope, consumeAnonymousPersonalStack, getPersonalStackPersistenceStatus, getPersonalStackScope, isAnonymousPersonalStackMigrationPending, personalStackStorageKey, purgeLegacyPersonalStackSources, readPersonalStack, replacePersonalStack, retryConsumedAnonymousPersonalStackCleanup, setPersonalStackScope, subscribePersonalStack } from "./personalStackStore";
import { deletePersonalAccount, loadPersonalStack, savePersonalStack, StackAccountApiError } from "./stackAccountApi";

import { ACCOUNT_GOOGLE_ENABLED, ACCOUNT_GITHUB_ENABLED } from '@/config/features';
import { accountPath, safeAccountReturnTo } from './accountPaths';
import { accountSessionId, passwordSignIn, passwordSignUp, providerSignIn, resendAccountConfirmation, requestAccountPasswordReset, updateAccountPassword, type AccountAuthOptions, type AuthResult, type AuthMethod } from './accountAuth';
export type { AccountAuthOptions, AuthResult, AuthMethod } from './accountAuth';
export type StackSyncStatus = "local" | "connecting" | "syncing" | "synced" | "unsaved" | "choice" | "conflict" | "session-expired" | "error";
export type DraftChoice = { draft: PersonalStackV4; saved: PersonalStackRecord };
export type StackConflict = { local: PersonalStackV4; remote: PersonalStackRecord | null };
export type AccountSnapshot = {
  user: User | null; syncStatus: StackSyncStatus; status: StackSyncStatus; error: string | null;
  pendingDraftChoice: DraftChoice | null; conflict: StackConflict | null; magicLinkSentTo: string | null;
  hasUnsavedChanges: boolean; signOutNeedsConfirmation: boolean;
  deletionConfirmed: boolean; privacyWarning: string | null;
  authBusy: boolean; recoveryStatus: 'none' | 'ready' | 'complete' | 'invalid'; lastAuthMethod: AuthMethod | null;
};
type SyncMetadata = { version: 1; owner: string; revision: number; fingerprint: string };
type RequestScope = { owner: string; token: string; generation: number };
const ACTIVE_OWNER_KEY = "tooltrim-personal-stack-active-account-v1";
const empty = () => normalizePersonalStack(null);
const fingerprint = personalStackFingerprint;
const hasContent = (state: PersonalStackV4) => fingerprint(state) !== fingerprint(empty());
export const accountSyncMetadataKey = (owner: string) => `${personalStackStorageKey(owner)}:sync`;
const consumedDraftKey = (owner: string) => `${personalStackStorageKey(owner)}:consumed-anonymous`;
export const INITIAL_ACCOUNT_SNAPSHOT: AccountSnapshot = {
  user: null, syncStatus: "local", status: "local", error: null, pendingDraftChoice: null,
  conflict: null, magicLinkSentTo: null, hasUnsavedChanges: false, signOutNeedsConfirmation: false,
  deletionConfirmed: false, privacyWarning: null, authBusy: false, recoveryStatus: "none", lastAuthMethod: null,
};

/** Same-origin known ToolTrim routes only; preserve permitted query and hash. */
export function getStackAccountReturnUrl(options: AccountAuthOptions = {}): string | undefined {
  if (typeof window === "undefined") return undefined;
  const lang = options.lang ?? "fr";
  const requested = options.returnTo ?? `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return new URL(safeAccountReturnTo(requested, lang, window.location.origin), window.location.origin).href;
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
  private writeCompletion: Promise<void> | null = null;
  private abandonedWrite: Promise<void> | null = null;
  private deleting = false;
  private signingOut = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private metadata: SyncMetadata | null = null;
  private draft: PersonalStackV4 | null = null;
  private clearDraftAfterSave = false;
  private authMutation = false;
  private identityEpoch = 0;
  private lifecycle = 0;
  private recovery: { owner: string; sessionId: string; expiresAt: number } | null = null;
  private readonly recoveryKey = 'tooltrim:account-recovery-v1';
  private readonly lastMethodKey = 'tooltrim:last-auth-method';
  private readonly pendingMethodKey = 'tooltrim:pending-auth-method';

  constructor(private auth: SupabaseClient["auth"], readonly enabled: boolean) {}
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => INITIAL_ACCOUNT_SNAPSHOT;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit(patch: Partial<AccountSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch, authBusy: this.authMutation, ...(patch.syncStatus ? { status: patch.syncStatus } : {}) };
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
    if (isAnonymousPersonalStackMigrationPending()) {
      // A temporarily unreadable legacy base and its operation queue are still recoverable.
      this.emit({ privacyWarning: "ACCOUNT_LOCAL_RECOVERY_PENDING" });
      this.draft = null; this.clearDraftAfterSave = false; return;
    }
    let complete = true;
    const owner = this.session?.user.id;
    try { if (owner) window.localStorage.setItem(consumedDraftKey(owner), "1"); } catch { complete = false; }
    if (!consumeAnonymousPersonalStack(this.draft)) complete = false;
    if (!purgeLegacyPersonalStackSources()) complete = false;
    if (!complete) this.emit({ privacyWarning: "ACCOUNT_LOCAL_CLEANUP_INCOMPLETE" });
    this.draft = null; this.clearDraftAfterSave = false;
  }

  start(): () => void {
    if (!this.enabled) return () => {};
    this.running = true;
    this.lifecycle++;
    try {
      const method = window.localStorage.getItem(this.lastMethodKey);
      if (method === 'google' || method === 'github' || method === 'email') this.emit({ lastAuthMethod: method });
    } catch { /* The hint is optional. */ }
    if (!retryConsumedAnonymousPersonalStackCleanup()) this.emit({ privacyWarning: "ACCOUNT_LOCAL_CLEANUP_INCOMPLETE" });
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
    const { data } = this.auth.onAuthStateChange((event, session) => { if (!this.signingOut || session) this.adoptSession(session, event); });
    void this.auth.getSession().then(result => {
      if (!this.running || this.generation !== initialGeneration) return;
      if (result.error) this.emit({ syncStatus: "error", error: "ACCOUNT_SESSION_UNAVAILABLE" });
      else this.adoptSession(result.data.session, "INITIAL_SESSION");
    }).catch(() => { if (this.running && this.generation === initialGeneration) this.emit({ syncStatus: "error", error: "ACCOUNT_SESSION_UNAVAILABLE" }); });
    return () => {
      this.running = false; this.lifecycle++; this.generation++; this.cancelTimer(); offStore(); data.subscription.unsubscribe();
      this.session = null; this.ready = false; this.inFlight = false;
    };
  }

  private adoptSession(next: Session | null, event?: AuthChangeEvent) {
    if (!this.running) return;
    if (next?.user.is_anonymous) next = null;
    const sameIdentity = this.sameSession(this.session, next);
    if (!sameIdentity) { this.identityEpoch++; if (this.session || event === "SIGNED_OUT") this.clearRecovery(); }
    this.observeRecovery(next, event);
    this.observeAuthMethod(next, event);
    if (next && this.session?.user.id === next.user.id && this.session.access_token === next.access_token) {
      this.session = next; this.emit({ user: next.user }); return;
    }
    this.generation++; this.cancelTimer(); this.inFlight = false; this.ready = false;
    this.abandonedWrite = null; this.deleting = false;
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
    this.emit({ user: next.user, syncStatus: "connecting", error: null, pendingDraftChoice: null, conflict: null, signOutNeedsConfirmation: false, magicLinkSentTo: null, deletionConfirmed: false });
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
    // The pending write may already have replaced the previous confirmation.
    if (this.inFlight) { this.emit({ syncStatus: "syncing", hasUnsavedChanges: true }); return; }
    if (!dirty) { this.emit({ syncStatus: "synced", error: null, hasUnsavedChanges: false }); return; }
    this.emit({ syncStatus: "unsaved", hasUnsavedChanges: true });
    this.timer = setTimeout(() => { void this.saveCurrent(scope); }, 650);
  };

  private async saveCurrent(scope: RequestScope): Promise<boolean> {
    if (!this.current(scope) || this.inFlight || !this.ready || !this.metadata) return false;
    this.cancelTimer(); this.inFlight = true;
    let finishWrite!: () => void;
    const completion = new Promise<void>(resolve => { finishWrite = resolve; });
    this.writeCompletion = completion;
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
      finishWrite();
      if (this.writeCompletion === completion) this.writeCompletion = null;
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
    if (this.abandonedWrite) {
      await this.abandonedWrite;
      if (!this.current(scope)) return false;
      this.abandonedWrite = null;
    }
    this.ready = false; await this.hydrate(scope, fingerprint(readPersonalStack()));
    return this.snapshot.syncStatus !== "error" && this.snapshot.syncStatus !== "session-expired";
  };

  private sameSession(a: Session | null, b: Session | null): boolean {
    return a?.user.id === b?.user.id && accountSessionId(a) === accountSessionId(b);
  }
  private clearRecovery(status: AccountSnapshot['recoveryStatus'] = 'none') {
    this.recovery = null;
    try { window.sessionStorage.removeItem(this.recoveryKey); } catch { /* No in-memory proof remains. */ }
    this.emit({ recoveryStatus: status });
  }
  private observeRecovery(next: Session | null, event?: AuthChangeEvent) {
    const sessionId = accountSessionId(next);
    if (!next) { this.clearRecovery(event === 'PASSWORD_RECOVERY' ? 'invalid' : 'none'); return; }
    if (event === 'PASSWORD_RECOVERY') {
      if (!next || !sessionId || (next.expires_at ?? 0) <= Date.now() / 1000) { this.clearRecovery('invalid'); return; }
      this.recovery = { owner: next.user.id, sessionId, expiresAt: Math.min(Date.now() + 15 * 60 * 1000, next.expires_at! * 1000) };
      try { window.sessionStorage.setItem(this.recoveryKey, JSON.stringify(this.recovery)); } catch { /* This mounted recovery remains usable. */ }
    } else if (!this.recovery && next && event === 'INITIAL_SESSION') {
      try {
        const value = JSON.parse(window.sessionStorage.getItem(this.recoveryKey) || 'null');
        if (value && sessionId && value.owner === next.user.id && value.sessionId === sessionId && typeof value.expiresAt === 'number' && value.expiresAt > Date.now() && value.expiresAt <= Date.now() + 15 * 60 * 1000) this.recovery = value;
        else if (value) this.clearRecovery('invalid');
      } catch { /* A new recovery link is required if proof cannot be read. */ }
    }
    if (this.recovery) {
      if (!next || this.recovery.owner !== next.user.id || this.recovery.sessionId !== sessionId || this.recovery.expiresAt <= Date.now()) this.clearRecovery('invalid');
      else this.emit({ recoveryStatus: 'ready' });
    }
  }
  private recordAuthMethod(method: AuthMethod) {
    try { window.localStorage.setItem(this.lastMethodKey, method); } catch { /* In-memory public hint remains usable. */ }
    this.emit({ lastAuthMethod: method });
  }
  private observeAuthMethod(next: Session | null, event?: AuthChangeEvent) {
    if (!next || event !== 'SIGNED_IN') return;
    const lang = window.location.pathname.startsWith('/en/') ? 'en' : 'fr';
    if (window.location.pathname !== accountPath(lang, 'callback')) return;
    try {
      const pending = window.sessionStorage.getItem(this.pendingMethodKey);
      window.sessionStorage.removeItem(this.pendingMethodKey);
      if (new URLSearchParams(window.location.search).has('error') || new URLSearchParams(window.location.hash.slice(1)).has('error')) return;
      if ((pending === 'google' || pending === 'github' || pending === 'email') && next.user.app_metadata?.provider === pending) this.recordAuthMethod(pending);
    } catch { /* Never infer success from a button click. */ }
  }
  private async withAuth<T>(action: () => Promise<T>, blocked: T): Promise<T> {
    if (!this.enabled || !this.running || this.authMutation) return blocked;
    this.authMutation = true; this.emit({ error: null });
    try { return await action(); }
    finally { this.authMutation = false; this.emit({}); }
  }
  private authAction(action: () => Promise<AuthResult>): Promise<AuthResult> {
    const epoch = this.identityEpoch; const lifecycle = this.lifecycle;
    return this.withAuth(async () => {
      const result = await action();
      if (!this.running || lifecycle !== this.lifecycle || epoch !== this.identityEpoch) return { ok: false, error: 'ACCOUNT_AUTH_SESSION_CHANGED' };
      if (!result.ok) this.emit({ error: result.error });
      return result;
    }, { ok: false, error: this.authMutation ? 'ACCOUNT_AUTH_BUSY' : 'ACCOUNT_AUTH_UNAVAILABLE' });
  }
  signInWithProvider = (provider: 'google' | 'github', options: AccountAuthOptions = {}): Promise<AuthResult> => {
    if (!(provider === 'google' ? ACCOUNT_GOOGLE_ENABLED : ACCOUNT_GITHUB_ENABLED)) return Promise.resolve({ ok: false, error: 'ACCOUNT_PROVIDER_UNAVAILABLE' });
    return this.authAction(async () => {
      // A method-only intent is harmless and only becomes a hint on a matching real callback.
      try { window.sessionStorage.setItem(this.pendingMethodKey, provider); } catch { /* Optional hint. */ }
      const result = await providerSignIn(this.auth, provider, options);
      if (!result.ok) try { window.sessionStorage.removeItem(this.pendingMethodKey); } catch { /* Optional hint. */ }
      return result;
    });
  };
  private passwordAction(email: string, password: string, options?: AccountAuthOptions, signup = false): Promise<AuthResult> {
    const epoch = this.identityEpoch; const lifecycle = this.lifecycle;
    let accepted = false;
    const accept = (session: Session) => {
      if (!this.running || lifecycle !== this.lifecycle || (epoch !== this.identityEpoch && !this.sameSession(this.session, session))) return false;
      this.adoptSession(session); accepted = true;
      try { window.sessionStorage.removeItem(this.pendingMethodKey); } catch { /* Optional hint. */ }
      this.recordAuthMethod('email'); return true;
    };
    return this.withAuth(async () => {
      const result = signup ? await passwordSignUp(this.auth, email, password, options, accept) : await passwordSignIn(this.auth, email, password, accept);
      if (!this.running || lifecycle !== this.lifecycle || (!accepted && epoch !== this.identityEpoch)) return { ok: false, error: 'ACCOUNT_AUTH_SESSION_CHANGED' };
      if (!result.ok) this.emit({ error: result.error });
      else if (result.outcome === 'confirmation-required') {
        try { window.sessionStorage.setItem(this.pendingMethodKey, 'email'); } catch { /* Optional hint. */ }
      }
      return result;
    }, { ok: false, error: this.authMutation ? 'ACCOUNT_AUTH_BUSY' : 'ACCOUNT_AUTH_UNAVAILABLE' });
  }
  signInWithPassword = (email: string, password: string, _options?: AccountAuthOptions) => this.passwordAction(email, password);
  signUpWithPassword = (email: string, password: string, options?: AccountAuthOptions) => this.passwordAction(email, password, options, true);
  resendConfirmation = (email: string, options?: AccountAuthOptions) => this.authAction(() => resendAccountConfirmation(this.auth, email, options));
  requestPasswordReset = (email: string, options?: AccountAuthOptions) => this.authAction(() => requestAccountPasswordReset(this.auth, email, options));
  completePasswordReset = (password: string): Promise<AuthResult> => this.authAction(async () => {
    const proof = this.recovery;
    if (!proof || !this.session || proof.owner !== this.session.user.id || proof.sessionId !== accountSessionId(this.session) || proof.expiresAt <= Date.now() || (this.session.expires_at ?? 0) <= Date.now() / 1000) {
      this.clearRecovery('invalid'); return { ok: false, error: 'ACCOUNT_RECOVERY_INVALID' };
    }
    const epoch = this.identityEpoch; const lifecycle = this.lifecycle;
    const result = await updateAccountPassword(this.auth, password);
    if (!this.running || epoch !== this.identityEpoch || lifecycle !== this.lifecycle) return { ok: false, error: 'ACCOUNT_AUTH_SESSION_CHANGED' };
    if (!result.ok) { if (result.error === 'ACCOUNT_RECOVERY_INVALID') this.clearRecovery('invalid'); return result; }
    this.clearRecovery('complete');
    try {
      const { error } = await this.auth.signOut({ scope: 'others' });
      return error ? { ...result, warning: 'ACCOUNT_OTHER_SESSIONS_NOT_REVOKED' } : result;
    } catch { return { ...result, warning: 'ACCOUNT_OTHER_SESSIONS_NOT_REVOKED' }; }
  });
  getAccessToken = async (): Promise<string | null> => {
    if (!this.enabled || !this.running || !this.session) return null;
    const epoch = this.identityEpoch; const lifecycle = this.lifecycle; const originalToken = this.session.access_token;
    try {
      const { data, error } = await this.auth.getSession();
      if (error || !this.running || lifecycle !== this.lifecycle || epoch !== this.identityEpoch || !data.session || !this.sameSession(this.session, data.session)) return null;
      if (this.session!.access_token !== originalToken) return this.session!.access_token;
      if (data.session.access_token !== originalToken) this.adoptSession(data.session);
      return this.session!.access_token;
    } catch { return null; }
  };
  signInWithGoogle = (options?: AccountAuthOptions) => this.withAuth(() => this.legacyGoogle(options), false);
  sendEmailCode = (email: string, options?: AccountAuthOptions) => this.withAuth(() => this.legacySendEmailCode(email, options), false);
  verifyEmailCode = (email: string, code: string) => this.withAuth(() => this.legacyVerifyEmailCode(email, code), false);
  signOut = (options?: { discardUnsaved?: boolean }) => this.withAuth(() => this.performSignOut(options), false);
  deleteAccount = () => this.withAuth(() => this.performDeleteAccount(), false);
  clearLocalAccount = () => this.withAuth(() => this.performClearLocalAccount(), false);

  private legacyGoogle = async (options: AccountAuthOptions = {}): Promise<boolean> => {
    if (!this.enabled) return false;
    const generation = this.generation;
    this.emit({ error: null });
    try {
      const { error } = await this.auth.signInWithOAuth({ provider: "google", options: { redirectTo: getStackAccountReturnUrl(options) } });
      if (error) throw error; return true;
    } catch { if (this.running && generation === this.generation) this.emit({ error: "ACCOUNT_GOOGLE_SIGN_IN_FAILED" }); return false; }
  };
  private legacySendEmailCode = async (email: string, options: AccountAuthOptions = {}): Promise<boolean> => {
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
  private legacyVerifyEmailCode = async (email: string, code: string): Promise<boolean> => {
    if (!this.enabled) return false;
    const generation = this.generation;
    try {
      const { error } = await this.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
      if (error) throw error; if (this.running && generation === this.generation) this.emit({ error: null }); return true;
    } catch { if (this.running && generation === this.generation) this.emit({ error: "ACCOUNT_EMAIL_CODE_INVALID" }); return false; }
  };
  private performSignOut = async (options: { discardUnsaved?: boolean } = {}): Promise<boolean> => {
    if (!this.enabled) return false;
    if (this.snapshot.hasUnsavedChanges && !options.discardUnsaved) { this.emit({ signOutNeedsConfirmation: true }); return false; }
    const owner = this.session?.user.id ?? (getPersonalStackScope() !== "anonymous" ? getPersonalStackScope() : null);
    const abandoned = this.writeCompletion;
    this.ready = false; this.inFlight = false;
    this.generation++; this.cancelTimer(); this.signingOut = true;
    const generation = this.generation;
    try {
      const { error } = await this.auth.signOut({ scope: "local" });
      if (!this.running || this.generation !== generation || (owner && getPersonalStackScope() !== owner)) return false;
      if (error) throw error;
      const complete = this.purgeOwner(owner);
      this.session = null; this.metadata = null; this.draft = null;
      setPersonalStackScope("anonymous");
      this.emit({ ...INITIAL_ACCOUNT_SNAPSHOT, lastAuthMethod: this.snapshot.lastAuthMethod, privacyWarning: complete ? null : "ACCOUNT_LOCAL_CLEANUP_INCOMPLETE" }); return true;
    } catch {
      if (this.running && this.generation === generation) {
        this.abandonedWrite = abandoned; this.inFlight = false; this.ready = false;
        this.emit({ syncStatus: "error", error: "ACCOUNT_SIGN_OUT_FAILED" });
      }
      return false;
    }
    finally { this.signingOut = false; }
  };
  private performDeleteAccount = async (): Promise<boolean> => {
    if (this.deleting || !this.scope()) return false;
    this.generation++; this.cancelTimer(); this.ready = false; this.inFlight = false; this.deleting = true;
    const scope = this.scope()!;
    this.emit({ syncStatus: "syncing", error: null, deletionConfirmed: false, hasUnsavedChanges: true });
    try {
      await deletePersonalAccount(scope.token);
      if (!this.current(scope)) return false;
      let complete = true;
      this.signingOut = true;
      try { const result = await this.auth.signOut({ scope: "local" }); if (result.error) complete = false; }
      catch { complete = false; }
      finally { this.signingOut = false; }
      if (!this.current(scope)) return false;
      if (!this.purgeOwner(scope.owner)) complete = false;
      this.session = null; this.metadata = null; this.draft = null; setPersonalStackScope("anonymous");
      this.emit({ ...INITIAL_ACCOUNT_SNAPSHOT, lastAuthMethod: this.snapshot.lastAuthMethod, deletionConfirmed: true, privacyWarning: complete ? null : "ACCOUNT_LOCAL_CLEANUP_INCOMPLETE" });
      return true;
    } catch (cause) {
      if (this.current(scope)) {
        this.fail(cause);
        if (cause instanceof StackAccountApiError && cause.status === 401) this.emit({ error: "ACCOUNT_DELETION_UNCONFIRMED" });
      }
      return false;
    } finally { if (this.generation === scope.generation) this.deleting = false; }
  };

  private purgeOwner(owner: string | null): boolean {
    this.clearRecovery();
    try { window.sessionStorage.removeItem(this.pendingMethodKey); } catch { /* Optional hint. */ }
    let complete = retryConsumedAnonymousPersonalStackCleanup();
    if (owner) {
      clearPersonalStackScope(owner);
      if (getPersonalStackPersistenceStatus().state === "degraded") complete = false;
      try { if (window.localStorage.getItem(consumedDraftKey(owner)) === "1" && !purgeLegacyPersonalStackSources()) complete = false; }
      catch { complete = false; }
      for (const key of [accountSyncMetadataKey(owner), consumedDraftKey(owner)]) {
        try { window.localStorage.removeItem(key); } catch { complete = false; }
      }
    }
    try { window.localStorage.removeItem(ACTIVE_OWNER_KEY); } catch { complete = false; }
    return complete;
  }

  /** Privacy-only fallback after an unconfirmed deletion/session loss; never asserts remote deletion. */
  private performClearLocalAccount = async (): Promise<boolean> => {
    const owner = getPersonalStackScope() === "anonymous" ? null : getPersonalStackScope();
    this.generation++; const generation = this.generation; this.cancelTimer(); this.ready = false; this.inFlight = false;
    let complete = true; this.signingOut = true;
    try { const result = await this.auth.signOut({ scope: "local" }); if (result.error) complete = false; }
    catch { complete = false; }
    finally { this.signingOut = false; }
    if (!this.running || this.generation !== generation || (owner && getPersonalStackScope() !== owner)) return false;
    if (!this.purgeOwner(owner)) complete = false;
    this.session = null; this.metadata = null; this.draft = null; setPersonalStackScope("anonymous");
    this.emit({ ...INITIAL_ACCOUNT_SNAPSHOT, lastAuthMethod: this.snapshot.lastAuthMethod, privacyWarning: complete ? null : "ACCOUNT_LOCAL_CLEANUP_INCOMPLETE" });
    return complete;
  };
}
