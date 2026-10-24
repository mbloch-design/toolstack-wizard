import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, expect, it, vi } from 'vitest';
import { accountCallbackUrl, accountCallbackReturnTo, clearAccountCallbackReturnTo, passwordSignIn, passwordSignUp, providerSignIn, resendAccountConfirmation, requestAccountPasswordReset, updateAccountPassword } from './accountAuth';
const sdk = { signInWithPassword: vi.fn(), signUp: vi.fn(), signInWithOAuth: vi.fn(), resend: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn() };
const auth = sdk as unknown as SupabaseClient['auth'];
beforeEach(() => { sessionStorage.clear(); vi.resetAllMocks(); Object.values(sdk).forEach(mock => mock.mockResolvedValue({ data: {}, error: null })); });
it('returns confirmation-required when signup creates no session, preserving password spaces', async () => {
  expect(await passwordSignUp(auth, ' User@Example.invalid ', '  phrase  ', { lang: 'en', returnTo: '/en/tool/notion' })).toEqual({ ok: true, outcome: 'confirmation-required' });
  expect(sdk.signUp).toHaveBeenCalledWith({ email: 'user@example.invalid', password: '  phrase  ', options: { emailRedirectTo: expect.stringContaining('/en/sign-in/callback') } });
});
it('accepts short existing passwords and maps invalid credentials without leaking SDK messages', async () => {
  sdk.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { code: 'invalid_credentials', message: 'private@example.invalid' } });
  expect(await passwordSignIn(auth, ' x@example.invalid ', ' a ')).toEqual({ ok: false, error: 'ACCOUNT_INVALID_CREDENTIALS' });
  expect(sdk.signInWithPassword).toHaveBeenCalledWith({ email: 'x@example.invalid', password: ' a ' });
});
it('distinguishes a real session from an incomplete sign-in', async () => {
  expect(await passwordSignIn(auth, 'x@example.invalid', 'test')).toEqual({ ok: false, error: 'ACCOUNT_SIGN_IN_FAILED' });
  sdk.signInWithPassword.mockResolvedValue({ data: { session: { user: { id: 'A' } } }, error: null });
  expect(await passwordSignIn(auth, 'x@example.invalid', 'test')).toEqual({ ok: true, outcome: 'signed-in' });
});
it('redirects GitHub without requesting repository access', async () => {
  expect(await providerSignIn(auth, 'github', { lang: 'fr', returnTo: '/fr/tool/notion' })).toEqual({ ok: true, outcome: 'redirecting' });
  expect(sdk.signInWithOAuth).toHaveBeenCalledWith({ provider: 'github', options: { redirectTo: expect.stringContaining('/fr/connexion/retour') } });
});
it.each(['over_email_send_rate_limit', 'over_request_rate_limit'])('maps %s for resend', async code => {
  sdk.resend.mockResolvedValue({ error: { code } });
  expect(await resendAccountConfirmation(auth, 'x@example.invalid')).toEqual({ ok: false, error: 'ACCOUNT_RATE_LIMITED' });
});
it('requests recovery with the exact localized reset redirect and neutral response', async () => {
  expect(await requestAccountPasswordReset(auth, ' X@Example.invalid ', { lang: 'en' })).toEqual({ ok: true, outcome: 'email-sent' });
  expect(sdk.resetPasswordForEmail).toHaveBeenCalledWith('x@example.invalid', { redirectTo: expect.stringMatching(/\/en\/account\/reset-password$/) });
});
it('validates new password length but never trims valid passwords', async () => {
  expect(await updateAccountPassword(auth, 'short')).toEqual({ ok: false, error: 'ACCOUNT_PASSWORD_TOO_SHORT' });
  expect(await updateAccountPassword(auth, '        ')).toEqual({ ok: true, outcome: 'password-updated' });
  expect(sdk.updateUser).toHaveBeenCalledWith({ password: '        ' });
});
it.each([['reauthentication_needed', 'ACCOUNT_REAUTHENTICATION_REQUIRED'], ['reauthentication_not_valid', 'ACCOUNT_REAUTHENTICATION_REQUIRED'], ['email_not_confirmed', 'ACCOUNT_EMAIL_UNCONFIRMED'], ['otp_expired', 'ACCOUNT_RECOVERY_INVALID']])('handles explicit provider error %s', async (code, error) => {
  sdk.updateUser.mockResolvedValue({ error: { code } });
  expect(await updateAccountPassword(auth, 'new phrase')).toEqual({ ok: false, error });
});

it('uses exact callbacks and preserves a safe destination across render retries until completion', () => {
  const url = new URL(accountCallbackUrl({ lang: 'en', returnTo: '/en/tool/notion?tab=pricing' })!);
  expect(url.search).toBe('');
  expect(url.hash).toBe('');
  expect(accountCallbackReturnTo('en')).toBe('/en/tool/notion?tab=pricing');
  expect(accountCallbackReturnTo('en')).toBe('/en/tool/notion?tab=pricing');
  clearAccountCallbackReturnTo('en');
  expect(accountCallbackReturnTo('en')).toBe('/en/ma-stack');
});
it('rejects unsafe and expired stored destinations and tolerates denied storage', () => {
  accountCallbackUrl({lang: 'fr', returnTo: 'https://evil.invalid'});
  expect(accountCallbackReturnTo('fr')).toBe('/fr/ma-stack');
  sessionStorage.setItem('tooltrim:auth-return:fr', JSON.stringify({path:'/fr/tools',at:0}));
  expect(accountCallbackReturnTo('fr')).toBe('/fr/ma-stack');
  const denied = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(new URL(accountCallbackUrl({lang:'fr'})!).search).toBe('');
  denied.mockRestore();
});
