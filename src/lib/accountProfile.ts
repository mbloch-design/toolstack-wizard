import { normalizeOAuthAvatar, normalizeProviderLocale } from "./accountIdentityProfile.js";
export type AccountProfile = {
  userId: string;
  avatarUrl: string | null;
  providerLocale: string | null;
  oauthProfileSource: "google" | "github" | null;
  displayName: string | null;
  email: string | null;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  canAccessBackoffice: boolean;
};
export class AccountProfileValidationError extends Error {
  constructor() { super("INVALID_ACCOUNT_PROFILE"); this.name = "AccountProfileValidationError"; }
}
export function normalizeDisplayName(value: unknown): string | null {
  if (value === null) return null;
  // Reject controls before trimming, including C1 controls; trim is not a way
  // to silently accept a newline/tab in a submitted name.
  if (typeof value !== "string" || /\p{Cc}/u.test(value)) throw new AccountProfileValidationError();
  const name = value.trim();
  if (Array.from(name).length > 80) throw new AccountProfileValidationError();
  return name || null;
}
function timestamp(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
}
/** Fail closed on malformed source. Project only the public private-profile DTO. */
export function parseAccountProfile(value: unknown): AccountProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AccountProfileValidationError();
  const p = value as Record<string, unknown>;
  if (typeof p.userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.userId)
    || !(p.email === null || typeof p.email === "string" && p.email.length > 0 && !/\p{Cc}/u.test(p.email))
    || typeof p.emailConfirmed !== "boolean" || typeof p.canAccessBackoffice !== "boolean"
    || p.emailConfirmed && p.email === null || p.canAccessBackoffice && !p.emailConfirmed
    || !timestamp(p.createdAt) || !timestamp(p.updatedAt)
    || normalizeDisplayName(p.displayName) !== p.displayName) throw new AccountProfileValidationError();
  if (!(p.oauthProfileSource === null || p.oauthProfileSource === 'google' || p.oauthProfileSource === 'github')
    // The source marks the first import, not the origin of an older retained avatar.
    || !(p.avatarUrl === null || typeof p.avatarUrl === 'string' && normalizeOAuthAvatar(p.avatarUrl, null) === p.avatarUrl)
    || !(p.providerLocale === null || typeof p.providerLocale === 'string' && normalizeProviderLocale(p.providerLocale) === p.providerLocale)) throw new AccountProfileValidationError();
  return { avatarUrl: p.avatarUrl as string | null, providerLocale: p.providerLocale as string | null, oauthProfileSource: p.oauthProfileSource,
    userId: p.userId, displayName: p.displayName as string | null, email: p.email as string | null,
    emailConfirmed: p.emailConfirmed, createdAt: p.createdAt, updatedAt: p.updatedAt, canAccessBackoffice: p.canAccessBackoffice };
}
