export const CONSENT_KEY = 'tooltrim-analytics-consent';
export const OPEN_COOKIE_PREFERENCES = 'tooltrim:open-cookie-preferences';
export type ConsentChoice = 'accepted' | 'refused';
type ConsentRecord = {version: 1; choice: ConsentChoice; decidedAt: number; expiresAt: number};
const SESSION_MARKER = /\n__tooltrimConsentV1=(accepted|refused):(\d+):(\d+)/;

function parseRecord(raw: string | null): ConsentRecord | null {
  try {
    const record = JSON.parse(raw ?? 'null');
    if (record?.version !== 1 || !['accepted', 'refused'].includes(record.choice)
      || !Number.isFinite(record.expiresAt) || record.expiresAt <= Date.now()) return null;
    // Dated version-1 records created before timestamp arbitration remain valid.
    return {...record, decidedAt: Number.isFinite(record.decidedAt) ? record.decidedAt : 0};
  } catch { return null; }
}

export function readAnalyticsConsent(): ConsentChoice | null {
  const records: ConsentRecord[] = [];
  const marker = window.name.match(SESSION_MARKER);
  if (marker && Number(marker[3]) > Date.now()) records.push({
    version: 1, choice: marker[1] as ConsentChoice, decidedAt: Number(marker[2]), expiresAt: Number(marker[3]),
  });
  for (const storage of ['localStorage', 'sessionStorage'] as const) {
    try {
      const record = parseRecord(window[storage].getItem(CONSENT_KEY));
      if (record) records.push(record);
    } catch { /* Storage may be unavailable. */ }
  }
  // New durable decisions from another tab supersede older session fallbacks.
  // On an exact timestamp tie, refusal wins.
  records.sort((a, b) => b.decidedAt - a.decidedAt || Number(b.choice === 'refused') - Number(a.choice === 'refused'));
  return records[0]?.choice ?? null;
}

export function saveAnalyticsConsent(choice: ConsentChoice): void {
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 6);
  const decidedAt = Date.now();
  const record = JSON.stringify({version: 1, choice, decidedAt, expiresAt: expires.getTime()});
  window.name = window.name.replace(SESSION_MARKER, '');
  try { window.sessionStorage.removeItem(CONSENT_KEY); } catch { /* Blocked storage. */ }
  try {
    window.localStorage.setItem(CONSENT_KEY, record);
  } catch {
    // Remove an outdated choice if quota prevents replacement.
    try { window.localStorage.removeItem(CONSENT_KEY); } catch { /* Read-only storage. */ }
    try { window.sessionStorage.setItem(CONSENT_KEY, record); }
    catch {
      // Tab-scoped preference survives same-site reload without storage.
      // Preserve the existing window name; no visitor identifier is stored.
      window.name += `\n__tooltrimConsentV1=${choice}:${decidedAt}:${expires.getTime()}`;
    }
  }
}

export function openCookiePreferences(): void {
  window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES));
}
