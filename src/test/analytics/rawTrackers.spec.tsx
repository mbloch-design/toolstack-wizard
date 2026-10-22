import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const { mounted } = vi.hoisted(() => ({ mounted: [] as Array<{ beforeSend?: (event: { type: 'pageview' | 'event'; url: string }) => unknown }> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: {} } }));
vi.mock('@vercel/analytics/react', () => ({ Analytics: (props: object) => { mounted.push(props); return null; } }));
vi.mock('@/components/ErrorBoundary', () => ({ ErrorBoundary: () => null }));
vi.mock('@/components/ScrollToTop', () => ({ default: () => null }));
vi.mock('@/components/DynamicCanonical', () => ({ default: () => null }));
vi.mock('@/components/AnalyticsPageView', () => ({ default: () => null }));
vi.mock('@/components/AnalyticsConsent', () => ({ default: () => null }));
import App from '@/App';
beforeEach(() => {
 mounted.length = 0; window.history.replaceState({}, '', '/en/tools');
 Object.defineProperty(document, 'referrer', { configurable: true, value: '' });
 window.__tooltrimAnalyticsPrivateDocument = false; // A successful public bootstrap explicitly opts in.
});
afterEach(cleanup);
it('never mounts Vercel on a latched sensitive document after the SDK cleans its URL or a public SPA return', () => {
 (window as unknown as { __tooltrimAnalyticsPrivateDocument: boolean }).__tooltrimAnalyticsPrivateDocument = true;
 const view = render(<App />); expect(mounted).toHaveLength(0);
 window.history.replaceState({}, '', '/en/tool/notion'); view.rerender(<App />); expect(mounted).toHaveLength(0);
});
it.each(['href', 'referrer'])('omits Vercel at startup when the %s carries credential transport', field => {
 if (field === 'href') window.history.replaceState({}, '', '/en/sign-in/callback#access_token=fixture-secret');
 else Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://tooltrim.com/en/account/reset-password?code=fixture-secret' });
 render(<App />); expect(mounted).toHaveLength(0);
});
it('tracks ordinary public documents and drops sensitive subsequent events while scrubbing fragments', () => {
 render(<App />); expect(mounted).toHaveLength(1); expect(mounted[0].beforeSend).toBeTypeOf('function');
 const beforeSend = mounted[0].beforeSend!;
 expect(beforeSend({ type: 'pageview', url: 'https://tooltrim.com/en/account/settings?returnTo=fixture-secret' })).toBeNull();
 expect(beforeSend({ type: 'event', url: 'https://tooltrim.com/en/tool/notion?ACCESS_TOKEN=fixture-secret' })).toBeNull();
 expect(beforeSend({ type: 'pageview', url: 'https://tooltrim.com/en/tool/notion?utm_source=public#section' })).toEqual({ type: 'pageview', url: 'https://tooltrim.com/en/tool/notion?utm_source=public' });
});

it('fails closed when bootstrap did not run, even after SDK transport has been consumed', () => {
 delete window.__tooltrimAnalyticsPrivateDocument;
 window.history.replaceState({}, '', '/en/tool/notion');
 const view = render(<App />); expect(mounted).toHaveLength(0);
 window.__tooltrimAnalyticsPrivateDocument = false; view.rerender(<App />);
 expect(mounted).toHaveLength(0); // A later script cannot undo this document mount's suppression.
});
