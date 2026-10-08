import { useEffect, useState } from "react";

const CONSENT_KEY = "tooltrim-analytics-consent";
const GA_ID = "G-DL5MJKQ3JE";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __tooltrimAnalyticsConsent?: boolean;
  }
}

function loadGoogleAnalytics() {
  if (window.__tooltrimAnalyticsConsent || document.querySelector(`script[data-tooltrim-ga="${GA_ID}"]`)) return;
  window.__tooltrimAnalyticsConsent = true;
  window.gtag?.("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  const script = document.createElement("script");
  script.async = true;
  script.dataset.tooltrimGa = GA_ID;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
  script.addEventListener("load", () => {
    window.gtag?.("js", new Date());
    window.gtag?.("config", GA_ID, { send_page_view: false, anonymize_ip: true });
  }, { once: true });
}

const OPEN_EVENT = "tooltrim:consent-open";

/** Reopens the banner (footer "Manage cookies"): withdrawing consent must be
 * as easy as giving it (RGPD, CNIL guidance). */
export function openConsentBanner() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export default function AnalyticsConsent() {
  const [visible, setVisible] = useState(false);
  const en = typeof window !== "undefined" && window.location.pathname.startsWith("/en");

  useEffect(() => {
    let consent: string | null = null;
    try { consent = window.localStorage.getItem(CONSENT_KEY); } catch { /* Consent remains a session choice. */ }
    if (consent === "accepted") loadGoogleAnalytics();
    else if (!consent) setVisible(true);
    const open = () => setVisible(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  if (!visible) return null;

  const accept = () => {
    try { window.localStorage.setItem(CONSENT_KEY, "accepted"); } catch { /* Consent only applies to this session. */ }
    loadGoogleAnalytics();
    setVisible(false);
  };

  const refuse = () => {
    try { window.localStorage.setItem(CONSENT_KEY, "refused"); } catch { /* Analytics stays disabled. */ }
    // A withdrawal after acceptance: stop measuring from now on.
    if (window.__tooltrimAnalyticsConsent) {
      window.__tooltrimAnalyticsConsent = false;
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
    }
    setVisible(false);
  };

  return (
    <div className="analytics-consent" role="region" aria-label={en ? "Analytics cookie consent" : "Consentement aux cookies analytics"}>
      <div className="analytics-consent__copy">
        <strong>{en ? "Your privacy matters" : "Votre vie privée compte"}</strong>
        <p>{en
          ? "We use Google Analytics only to understand how the site is used. No analytics cookie is set without your consent."
          : "Nous utilisons Google Analytics uniquement pour comprendre l’usage du site. Aucun cookie analytics n’est déposé sans votre accord."}</p>
        <a href={en ? "/en/privacy-policy" : "/fr/privacy-policy"}>{en ? "Learn more" : "En savoir plus"}</a>
      </div>
      <div className="analytics-consent__actions">
        <button type="button" className="analytics-consent__refuse" onClick={refuse}>{en ? "Decline" : "Refuser"}</button>
        <button type="button" className="analytics-consent__accept" onClick={accept}>{en ? "Accept" : "Accepter"}</button>
      </div>
    </div>
  );
}
