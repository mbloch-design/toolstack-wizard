import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import { startConsent } from '@/lib/analyticsConsent';

/** Mounts the CookieConsent banner (rendered by the library outside #root) in the page language. */
export default function AnalyticsConsent() {
  const { pathname } = useLocation();
  const lang = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'fr';
  useEffect(() => { void startConsent(lang); }, [lang]);
  return null;
}
