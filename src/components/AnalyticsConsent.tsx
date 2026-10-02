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

export default function AnalyticsConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(CONSENT_KEY);
    if (consent === "accepted") loadGoogleAnalytics();
    else if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    loadGoogleAnalytics();
    setVisible(false);
  };

  const refuse = () => {
    window.localStorage.setItem(CONSENT_KEY, "refused");
    setVisible(false);
  };

  return (
    <aside className="analytics-consent" role="dialog" aria-label="Consentement aux cookies analytics">
      <div className="analytics-consent__copy">
        <strong>Votre vie privée compte</strong>
        <p>Nous utilisons Google Analytics uniquement pour comprendre l’usage du site. Aucun cookie analytics n’est déposé sans votre accord.</p>
        <a href="/fr/privacy-policy">En savoir plus</a>
      </div>
      <div className="analytics-consent__actions">
        <button type="button" className="analytics-consent__refuse" onClick={refuse}>Refuser</button>
        <button type="button" className="analytics-consent__accept" onClick={accept}>Accepter</button>
      </div>
    </aside>
  );
}
