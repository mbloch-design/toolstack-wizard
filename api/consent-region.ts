import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";

// EEA (EU 27 + Iceland, Liechtenstein, Norway), United Kingdom and Switzerland:
// analytics cookies there need prior consent (GDPR / ePrivacy, UK GDPR, Swiss FADP).
const CONSENT_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
]);

/** An unknown country is treated as a consent region: the banner is the safe default. */
export function consentRequired(country: unknown): boolean {
  const code = typeof country === "string" ? country.trim().toUpperCase() : "";
  return !/^[A-Z]{2}$/.test(code) || CONSENT_COUNTRIES.has(code);
}

/** Vercel derives the country from the visitor IP; neither is stored or returned. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json({ consentRequired: consentRequired(req.headers["x-vercel-ip-country"]) });
}
