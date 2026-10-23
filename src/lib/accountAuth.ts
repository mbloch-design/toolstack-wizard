import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { accountPath, safeAccountReturnTo, type AccountLang } from './accountPaths';
export type AccountAuthOptions = { lang?: AccountLang; returnTo?: string };
export type AuthMethod = 'google' | 'github' | 'email';
export type AuthResult = { ok: true; outcome: 'signed-in' | 'redirecting' | 'confirmation-required' | 'email-sent' | 'password-updated'; warning?: string } | { ok: false; error: string };
type Auth = SupabaseClient['auth'];
export function accountAuthError(cause: unknown, fallback = 'ACCOUNT_AUTH_UNAVAILABLE'): AuthResult {
  const error = cause as { code?: string; status?: number } | null;
  const codes: Record<string, string> = {
    invalid_credentials: 'ACCOUNT_INVALID_CREDENTIALS', email_not_confirmed: 'ACCOUNT_EMAIL_UNCONFIRMED',
    over_email_send_rate_limit: 'ACCOUNT_RATE_LIMITED', over_request_rate_limit: 'ACCOUNT_RATE_LIMITED',
    weak_password: 'ACCOUNT_PASSWORD_TOO_WEAK', same_password: 'ACCOUNT_PASSWORD_UNCHANGED',
    reauthentication_needed: 'ACCOUNT_REAUTHENTICATION_REQUIRED', reauthentication_not_valid: 'ACCOUNT_REAUTHENTICATION_REQUIRED',
    otp_expired: 'ACCOUNT_RECOVERY_INVALID', session_not_found: 'ACCOUNT_RECOVERY_INVALID', session_expired: 'ACCOUNT_RECOVERY_INVALID',
  };
  return { ok: false, error: error?.status === 429 ? 'ACCOUNT_RATE_LIMITED' : codes[error?.code ?? ''] ?? fallback };
}
export function accountCallbackUrl(options: AccountAuthOptions = {}): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const lang = options.lang ?? 'fr';
  const url = new URL(accountPath(lang, 'callback'), window.location.origin);
  try { window.sessionStorage.setItem(`tooltrim:auth-return:${lang}`, JSON.stringify({ path: safeAccountReturnTo(options.returnTo, lang, window.location.origin), at: Date.now() })); } catch { /* A blocked store falls back to Ma stack after authentication. */ }
  return url.href;
}
/** Same-tab navigation only; cross-device email links safely open Ma stack. */
export function accountCallbackReturnTo(lang: AccountLang, legacyReturnTo?: string | null): string {
  const origin = typeof window === 'undefined' ? 'https://tooltrim.com' : window.location.origin;
  let stored: string | undefined;
  try {
    const key = `tooltrim:auth-return:${lang}`;
    const raw = window.sessionStorage.getItem(key);
    const value = raw ? JSON.parse(raw) : null;
    if (typeof value?.path === 'string' && typeof value.at === 'number' && Date.now() >= value.at && Date.now() - value.at < 60 * 60 * 1000) stored = value.path;
  } catch { /* Storage is optional navigation context. */ }
  return safeAccountReturnTo(legacyReturnTo ?? stored, lang, origin);
}
export function clearAccountCallbackReturnTo(lang: AccountLang): void {
  try { window.sessionStorage.removeItem(`tooltrim:auth-return:${lang}`); } catch { /* Optional navigation context. */ }
}
const emailValue = (email: string) => email.trim().toLowerCase();
export async function providerSignIn(auth: Auth, provider: 'google' | 'github', options?: AccountAuthOptions): Promise<AuthResult> {
  try { const { error } = await auth.signInWithOAuth({ provider, options: { redirectTo: accountCallbackUrl(options) } }); return error ? accountAuthError(error) : { ok: true, outcome: 'redirecting' }; }
  catch (cause) { return accountAuthError(cause); }
}
export async function passwordSignIn(auth: Auth, email: string, password: string, acceptSession?: (session: Session) => boolean): Promise<AuthResult> {
  if (!emailValue(email) || !password) return { ok: false, error: 'ACCOUNT_CREDENTIALS_REQUIRED' };
  try { const { data, error } = await auth.signInWithPassword({ email: emailValue(email), password }); return error ? accountAuthError(error, 'ACCOUNT_SIGN_IN_FAILED') : data.session ? acceptSession && !acceptSession(data.session) ? { ok: false, error: 'ACCOUNT_AUTH_SESSION_CHANGED' } : { ok: true, outcome: 'signed-in' } : { ok: false, error: 'ACCOUNT_SIGN_IN_FAILED' }; }
  catch (cause) { return accountAuthError(cause); }
}
export async function passwordSignUp(auth: Auth, email: string, password: string, options?: AccountAuthOptions, acceptSession?: (session: Session) => boolean): Promise<AuthResult> {
  if (!emailValue(email)) return { ok: false, error: 'ACCOUNT_CREDENTIALS_REQUIRED' };
  if (password.length < 8) return { ok: false, error: 'ACCOUNT_PASSWORD_TOO_SHORT' };
  try { const { data, error } = await auth.signUp({ email: emailValue(email), password, options: { emailRedirectTo: accountCallbackUrl(options) } }); return error ? accountAuthError(error) : data.session && acceptSession && !acceptSession(data.session) ? { ok: false, error: 'ACCOUNT_AUTH_SESSION_CHANGED' } : { ok: true, outcome: data.session ? 'signed-in' : 'confirmation-required' }; }
  catch (cause) { return accountAuthError(cause); }
}
export async function resendAccountConfirmation(auth: Auth, email: string, options?: AccountAuthOptions): Promise<AuthResult> {
  try { const { error } = await auth.resend({ type: 'signup', email: emailValue(email), options: { emailRedirectTo: accountCallbackUrl(options) } }); return error ? accountAuthError(error) : { ok: true, outcome: 'email-sent' }; }
  catch (cause) { return accountAuthError(cause); }
}
export async function requestAccountPasswordReset(auth: Auth, email: string, options: AccountAuthOptions = {}): Promise<AuthResult> {
  const redirectTo = typeof window === 'undefined' ? undefined : new URL(accountPath(options.lang ?? 'fr', 'reset'), window.location.origin).href;
  try { const { error } = await auth.resetPasswordForEmail(emailValue(email), { redirectTo }); return error ? accountAuthError(error) : { ok: true, outcome: 'email-sent' }; }
  catch (cause) { return accountAuthError(cause); }
}
export async function updateAccountPassword(auth: Auth, password: string): Promise<AuthResult> {
  if (password.length < 8) return { ok: false, error: 'ACCOUNT_PASSWORD_TOO_SHORT' };
  try { const { error } = await auth.updateUser({ password }); return error ? accountAuthError(error) : { ok: true, outcome: 'password-updated' }; }
  catch (cause) { return accountAuthError(cause); }
}
/** Session claim is a local UX binding, never an authorization decision. No token is persisted here. */
export function accountSessionId(session: Session | null): string | null {
  if (!session) return null;
  try { const value: unknown = JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return typeof (value as { session_id?: unknown }).session_id === 'string' ? (value as { session_id: string }).session_id : null; }
  catch { return null; }
}
