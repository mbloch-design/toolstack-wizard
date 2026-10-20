import * as CookieConsent from 'vanilla-cookieconsent';
import { GA_ID, loadGoogleAnalytics, stopGoogleAnalytics } from '@/lib/analytics';

/** Consent is handled by CookieConsent v3 (orestbida); GA4 stays in advanced Consent Mode. */
export const CONSENT_COOKIE = 'tooltrim_consent';
const LEGACY_KEY = 'tooltrim-analytics-consent';
const ANALYTICS = 'analytics';
type Lang = 'fr' | 'en';

const privacyLink = (lang: Lang) => `<a href="/${lang}/privacy-policy">${lang === 'en' ? 'Privacy policy' : 'Politique de confidentialité'}</a>`;
const gaCookies = (lang: Lang) => ({
  headers: lang === 'en'
    ? {name: 'Cookie', domain: 'Domain', desc: 'Purpose', exp: 'Duration'}
    : {name: 'Cookie', domain: 'Domaine', desc: 'Usage', exp: 'Durée'},
  body: [
    {name: '_ga', domain: 'tooltrim.com', desc: lang === 'en' ? 'Distinguishes visitors' : 'Distingue les visiteurs', exp: lang === 'en' ? '13 months' : '13 mois'},
    {name: `_ga_${GA_ID.slice(2)}`, domain: 'tooltrim.com', desc: lang === 'en' ? 'Keeps the visit state' : 'Conserve l’état de la visite', exp: lang === 'en' ? '13 months' : '13 mois'},
  ],
});

const translations: Record<Lang, CookieConsent.Translation> = {
  fr: {
    consentModal: {
      title: 'Aidez-nous à améliorer ToolTrim',
      description: 'Google Analytics nous montre quelles pages et quels comparatifs vous servent vraiment, pour savoir quoi enrichir en priorité. Aucune publicité ciblée, aucune donnée revendue. Si vous refusez, Google reçoit seulement des signaux techniques limités, sans cookie. Le site reste entièrement accessible dans les deux cas.',
      acceptAllBtn: 'Accepter',
      acceptNecessaryBtn: 'Refuser',
      footer: privacyLink('fr'),
    },
    preferencesModal: {
      title: 'Préférences cookies',
      acceptAllBtn: 'Accepter',
      acceptNecessaryBtn: 'Refuser',
      savePreferencesBtn: 'Enregistrer mon choix',
      closeIconLabel: 'Fermer',
      sections: [
        {description: `Vous pouvez changer d’avis à tout moment depuis « Préférences cookies » en pied de page. ${privacyLink('fr')}`},
        {title: 'Strictement nécessaire', description: `Un cookie <code>${CONSENT_COOKIE}</code> garde votre choix pendant six mois.`, linkedCategory: 'necessary'},
        {
          title: 'Mesure d’audience (Google Analytics)',
          description: 'Avec votre accord : cookies Google Analytics et mesure des interactions (recherches, ajouts à votre stack). Sans accord : signaux limités sans cookie, adresse de la page uniquement.',
          linkedCategory: ANALYTICS,
          cookieTable: gaCookies('fr'),
        },
      ],
    },
  },
  en: {
    consentModal: {
      title: 'Help us improve ToolTrim',
      description: 'Google Analytics shows us which pages and comparisons are genuinely useful to you, so we know what to improve first. No targeted ads, no data sold. If you refuse, Google only receives limited technical signals, without cookies. The whole site stays available either way.',
      acceptAllBtn: 'Accept',
      acceptNecessaryBtn: 'Refuse',
      footer: privacyLink('en'),
    },
    preferencesModal: {
      title: 'Cookie preferences',
      acceptAllBtn: 'Accept',
      acceptNecessaryBtn: 'Refuse',
      savePreferencesBtn: 'Save my choice',
      closeIconLabel: 'Close',
      sections: [
        {description: `You can change your mind at any time from “Cookie preferences” in the footer. ${privacyLink('en')}`},
        {title: 'Strictly necessary', description: `A <code>${CONSENT_COOKIE}</code> cookie keeps your choice for six months.`, linkedCategory: 'necessary'},
        {
          title: 'Audience measurement (Google Analytics)',
          description: 'With your permission: Google Analytics cookies and interaction measurement (searches, stack additions). Without it: limited cookieless signals, page address only.',
          linkedCategory: ANALYTICS,
          cookieTable: gaCookies('en'),
        },
      ],
    },
  },
};

// getCookie() reads the live cookie, so remember which decision this tab applied.
let appliedTimestamp: string | undefined;

/** Apply the current decision to GA4. Withdrawal needs a reload to remove Google's listeners. */
function applyConsent(): void {
  appliedTimestamp = CookieConsent.getCookie('lastConsentTimestamp');
  if (CookieConsent.acceptedCategory(ANALYTICS)) { loadGoogleAnalytics(true); return; }
  if (stopGoogleAnalytics()) window.location.reload();
  else loadGoogleAnalytics(false);
}

/** A choice saved before the CookieConsent migration (dated, under six months) is kept once. */
function migrateLegacyChoice(): void {
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(LEGACY_KEY); window.localStorage.removeItem(LEGACY_KEY); } catch { return; }
  if (CookieConsent.validConsent() || !raw) return;
  try {
    const record = JSON.parse(raw);
    if (record?.version !== 1 || !(record.expiresAt > Date.now())) return;
    if (record.choice === 'accepted') CookieConsent.acceptCategory('all');
    else if (record.choice === 'refused') CookieConsent.acceptCategory([]);
    else return;
    CookieConsent.hide();
  } catch { /* Undated legacy values are asked again. */ }
}

/** Another tab changed the shared cookie: reload so this tab applies the newer choice. */
function watchOtherTabs(): void {
  const check = () => {
    const current = CookieConsent.getCookie('lastConsentTimestamp');
    if (current && current !== appliedTimestamp) window.location.reload();
  };
  const onVisible = () => { if (document.visibilityState === 'visible') check(); };
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', onVisible);
}

// Keep focused content clear of the banner while it shows (WCAG 2.4.11).
let bannerObserver: ResizeObserver | null = null;
function reserveBannerSpace(modal: HTMLElement | null): void {
  const root = document.documentElement;
  bannerObserver?.disconnect();
  bannerObserver = null;
  if (!modal) { root.style.removeProperty('--consent-h'); return; }
  const measure = () => root.style.setProperty('--consent-h', `${Math.ceil(modal.getBoundingClientRect().height) + 16}px`);
  measure();
  if (typeof ResizeObserver !== 'undefined') { bannerObserver = new ResizeObserver(measure); bannerObserver.observe(modal); }
}

const REGION_KEY = 'tooltrim-consent-region';

/** Whether the visitor's country requires prior consent. Any failure keeps the banner. */
async function consentRegion(): Promise<boolean> {
  try { const cached = window.sessionStorage.getItem(REGION_KEY); if (cached) return cached !== 'open'; } catch { /* storage blocked */ }
  try {
    const res = await fetch('/api/consent-region', {signal: AbortSignal.timeout(1500), credentials: 'omit'});
    const data = res.ok ? await res.json() : null;
    if (data?.consentRequired !== false) return true;
    try { window.sessionStorage.setItem(REGION_KEY, 'open'); } catch { /* storage blocked */ }
    return false;
  } catch { return true; }
}

let started = false;
/** Idempotent: the first call runs CookieConsent, later calls only follow the page language. */
export async function startConsent(lang: Lang): Promise<void> {
  if (started) { await CookieConsent.setLanguage(lang); return; }
  started = true;
  const region = consentRegion();
  await CookieConsent.run({
    revision: 1,
    autoShow: false, // Shown below, only where prior consent is required.
    hideFromBots: false,
    cookie: {name: CONSENT_COOKIE, expiresAfterDays: 182, sameSite: 'Lax'},
    guiOptions: {
      consentModal: {layout: 'bar inline', position: 'bottom', equalWeightButtons: true, flipButtons: false},
      preferencesModal: {layout: 'box', equalWeightButtons: true, flipButtons: false},
    },
    categories: {necessary: {enabled: true, readOnly: true}, [ANALYTICS]: {}},
    language: {default: lang, translations},
    onConsent: applyConsent,
    onChange: applyConsent,
    onModalShow: ({modalName}) => {
      if (modalName === 'consentModal') reserveBannerSpace(document.querySelector<HTMLElement>('#cc-main .cm'));
    },
    onModalHide: ({modalName}) => { if (modalName === 'consentModal') reserveBannerSpace(null); },
  });
  migrateLegacyChoice();
  if (!CookieConsent.validConsent()) {
    // Outside consent regions GA4 measures by default; "Cookie preferences" still lets anyone refuse.
    if (!(await region)) loadGoogleAnalytics(true);
    else if (!CookieConsent.validConsent()) {
      // Advanced Consent Mode: before any choice, GA4 runs with storage denied.
      loadGoogleAnalytics(false);
      CookieConsent.show(true); // autoShow is off, so the modal must be created here.
    }
  }
  watchOtherTabs();
}

export function openCookiePreferences(): void {
  CookieConsent.showPreferences();
}
