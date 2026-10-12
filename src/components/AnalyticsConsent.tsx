import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loadGoogleAnalytics, stopGoogleAnalytics } from '@/lib/analytics';
import { CONSENT_KEY, OPEN_COOKIE_PREFERENCES, readAnalyticsConsent, saveAnalyticsConsent } from '@/lib/analyticsConsent';

export default function AnalyticsConsent() {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const editingRef = useRef(false);
  const dialog = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const { pathname } = useLocation();
  const english = pathname === '/en' || pathname.startsWith('/en/');
  const t = (fr: string, en: string) => english ? en : fr;

  useEffect(() => {
    const sync = () => {
      const consent = readAnalyticsConsent();
      if (consent === 'accepted') {
        loadGoogleAnalytics();
        if (!editingRef.current) setVisible(false);
      }
      else {
        const reload = stopGoogleAnalytics();
        if (!editingRef.current || !consent) setVisible(!consent);
        if (reload) window.location.reload();
      }
    };
    const open = () => {
      returnFocus.current = document.activeElement as HTMLElement;
      editingRef.current = true;
      setEditing(true);
      setVisible(true);
    };
    const storage = (event: StorageEvent) => {
      if (event.key === CONSENT_KEY || event.key === null) sync();
    };
    // Also enforce expiry for a long-lived tab; session-only choices remain valid.
    const checkExpiry = () => sync();
    sync();
    const timer = window.setInterval(checkExpiry, 60_000);
    window.addEventListener(OPEN_COOKIE_PREFERENCES, open);
    window.addEventListener('storage', storage);
    window.addEventListener('focus', checkExpiry);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(OPEN_COOKIE_PREFERENCES, open);
      window.removeEventListener('storage', storage);
      window.removeEventListener('focus', checkExpiry);
    };
  }, []);

  useEffect(() => {
    if (visible && editing) dialog.current?.focus();
  }, [visible, editing]);

  if (!visible) return null;
  const close = () => { editingRef.current = false; setVisible(false); setEditing(false); returnFocus.current?.focus(); };
  const accept = () => { saveAnalyticsConsent('accepted'); loadGoogleAnalytics(); close(); };
  const refuse = () => {
    saveAnalyticsConsent('refused');
    const reload = stopGoogleAnalytics();
    close();
    // Removing a script does not remove its automatic tracking listeners.
    if (reload) window.location.reload();
  };

  return (
    <aside ref={dialog} tabIndex={-1} className="analytics-consent" role="dialog"
      aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-description"
      onKeyDown={event => { if (editing && event.key === 'Escape') close(); }}>
      <div className="analytics-consent__copy">
        <strong id="analytics-consent-title">{t('Mesure d’audience', 'Audience measurement')}</strong>
        <p id="analytics-consent-description">{t(
          'Avec votre accord, Google Analytics mesure les pages consultées et les interactions. Refuser ne change pas l’accès au site. Vous pouvez modifier votre choix dans « Préférences cookies » en pied de page.',
          'With your permission, Google Analytics measures page views and interactions. Refusing does not affect access to the site. You can change your choice in “Cookie preferences” in the footer.'
        )}</p>
        <a href={`${english ? '/en' : '/fr'}/privacy-policy`}>{t('En savoir plus', 'Learn more')}</a>
        {editing && <button type="button" className="analytics-consent__close" onClick={close}>{t('Fermer', 'Close')}</button>}
      </div>
      <div className="analytics-consent__actions">
        <button type="button" className="analytics-consent__refuse" onClick={refuse}>{t('Refuser', 'Refuse')}</button>
        <button type="button" className="analytics-consent__accept" onClick={accept}>{t('Accepter', 'Accept')}</button>
      </div>
    </aside>
  );
}
