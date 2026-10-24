import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as CookieConsent from 'vanilla-cookieconsent';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
let AnalyticsConsent: typeof import('@/components/AnalyticsConsent').default;
let AnalyticsPageView: typeof import('@/components/AnalyticsPageView').default;

const commands: unknown[][] = [];
async function mount(path = '/') {
  render(<MemoryRouter initialEntries={[path]}><AnalyticsPageView /><AnalyticsConsent /></MemoryRouter>);
  await waitFor(() => expect(document.querySelector('script[data-tooltrim-ga]')).not.toBeNull());
}
function loadTag() {
  const script = document.querySelector('script[data-tooltrim-ga]');
  expect(script).not.toBeNull();
  act(() => { script!.dispatchEvent(new Event('load')); });
}
const views = () => commands.filter(c => c[0] === 'event' && c[1] === 'page_view');
const granted = () => commands.some(c => c[0] === 'consent' && (c[2] as Record<string, string>).analytics_storage === 'granted');
const click = (name: string) => act(() => { fireEvent.click(screen.getAllByRole('button', {name})[0]); });

beforeEach(async () => {
  vi.resetModules();
  AnalyticsConsent = (await import('@/components/AnalyticsConsent')).default;
  AnalyticsPageView = (await import('@/components/AnalyticsPageView')).default;
  const values = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', { configurable: true, value: {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k), clear: () => values.clear(),
    key: (i: number) => [...values.keys()][i] ?? null, get length() { return values.size; },
  }});
  window.history.replaceState({}, '', '/');
  Object.defineProperty(document, 'referrer', { configurable: true, value: '' });
  commands.length = 0;
  window.__tooltrimAnalyticsConsent = false;
  window.gtag = (...args) => { commands.push(args); };
  document.querySelectorAll('script[data-tooltrim-ga]').forEach(s => s.remove());
});
afterEach(() => {
  cleanup();
  CookieConsent.reset(true);
  document.getElementById('cc-main')?.remove();
});

describe('CookieConsent and GA4 advanced Consent Mode', () => {
  it('loads GA4 with denied storage before any choice and strips URL parameters', async () => {
    window.history.replaceState({}, '', '/?email=private@example.com#secret');
    await mount();
    loadTag();
    const defaults = commands.findIndex(c => c[0] === 'consent' && c[1] === 'default');
    const config = commands.findIndex(c => c[0] === 'config');
    expect(defaults).toBeGreaterThanOrEqual(0);
    expect(defaults).toBeLessThan(config);
    expect(granted()).toBe(false);
    expect(views()[0][2]).toMatchObject({page_location: 'http://localhost:3000/'});
    expect(JSON.stringify(views())).not.toContain('private@example.com');
    expect(screen.getByRole('button', {name: 'Accepter'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Refuser'})).toBeInTheDocument();
  });

  it('gates detailed interactions until acceptance, then stores the choice in the consent cookie', async () => {
    await mount(); loadTag();
    const {trackEvent} = await import('@/lib/analytics');
    trackEvent('select_tool', {tool_id: 'not-consented'});
    expect(commands.some(c => c[1] === 'select_tool')).toBe(false);
    click('Accepter');
    expect(granted()).toBe(true);
    expect(document.cookie).toContain('tooltrim_consent=');
    trackEvent('select_tool', {tool_id: 'consented'});
    expect(commands.filter(c => c[1] === 'select_tool')).toHaveLength(1);
  });

  it('keeps limited page measurement after refusal', async () => {
    await mount();
    click('Refuser');
    loadTag();
    expect(views()).toHaveLength(1);
    expect(window.__tooltrimAnalyticsConsent).toBe(false);
    expect(granted()).toBe(false);
    expect(CookieConsent.validConsent()).toBe(true);
  });

  it('speaks English on English routes', async () => {
    await mount('/en/privacy-policy');
    expect(screen.getByRole('button', {name: 'Accept'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Refuse'})).toBeInTheDocument();
  });

  it('keeps a dated legacy acceptance once and asks again for undated ones', async () => {
    window.localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({version: 1, choice: 'accepted', decidedAt: 1, expiresAt: Date.now() + 86400000}));
    await mount();
    expect(CookieConsent.acceptedCategory('analytics')).toBe(true);
    expect(window.localStorage.getItem('tooltrim-analytics-consent')).toBeNull();
  });
});

describe('consented current-view measurement', () => {
  it('waits for both consent and tag readiness, then reports once', async () => {
    const {whenAnalyticsReady} = await import('@/lib/analytics');
    await mount();
    const report = vi.fn();
    const stop = whenAnalyticsReady(report);
    click('Accepter');
    expect(report).not.toHaveBeenCalled();
    loadTag();
    expect(report).toHaveBeenCalledTimes(1);
    stop();
  });

  it('reports the visible view after late acceptance, without replaying refused actions', async () => {
    const {whenAnalyticsReady, trackEvent} = await import('@/lib/analytics');
    await mount(); loadTag();
    const report = vi.fn();
    const stop = whenAnalyticsReady(report);
    trackEvent('explorer_save', {source_type: 'stack', intent: 'wishlist'});
    click('Accepter');
    expect(report).toHaveBeenCalledTimes(1);
    expect(commands.some(c => c[1] === 'explorer_save')).toBe(false);
    stop();
  });
});

describe('authentication URL privacy with previously granted analytics consent', () => {
  const acceptBeforeLoad = () => window.localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({ version: 1, choice: 'accepted', decidedAt: Date.now(), expiresAt: Date.now() + 86400000 }));
  it.each(['/fr/connexion/retour', '/fr/compte/reinitialiser', '/en/sign-in/callback', '/en/account/reset-password', '/en/account/settings', '/en/sign-up'])('drops all callback fragments and private query parameters on %s', async route => {
    const query = '?returnTo=' + encodeURIComponent('/en/tool/notion?access_token=nested-fixture-secret') + '&unrecognized=private-fixture-value';
    window.history.replaceState({}, '', route + query + '#access_token=access-fixture-secret&refresh_token=refresh-fixture-secret&provider_token=provider-fixture-secret');
    Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://tooltrim.com/fr/connexion/retour?error_description=referrer-fixture-secret#access_token=referrer-token' });
    acceptBeforeLoad(); await mount(window.location.pathname + window.location.search); loadTag();
    expect(views()[0][2]).toMatchObject({ page_path: route, page_location: 'http://localhost:3000' + route, page_referrer: 'https://tooltrim.com/fr/connexion/retour' });
    const { trackPageView } = await import('@/lib/analytics');
    window.history.replaceState({}, '', '/en/tool/notion?utm_source=legitimate#public-section');
    trackPageView('/en/tool/notion?utm_source=legitimate#public-section', 'Notion');
    const payload = views().at(-1)![2] as Record<string, string>;
    expect(payload).toMatchObject({ page_path: '/en/tool/notion?utm_source=legitimate', page_location: 'http://localhost:3000/en/tool/notion?utm_source=legitimate', page_referrer: 'http://localhost:3000' + route });
    expect(commands.filter(command => command[0] === 'set' && typeof command[1] === 'object').at(-1)?.[1]).toMatchObject({ page_location: payload.page_location, page_referrer: payload.page_referrer });
    expect(JSON.stringify(commands)).not.toMatch(/fixture-secret|fixture-value|referrer-token/);
  });
  it('removes case-insensitive private and auth fields from public URLs and initial referrer, retaining legitimate public queries', async () => {
    const query = '?utm_campaign=public&currency=EUR&Email=email-fixture-secret&NAME=name-fixture-secret&PaSsWoRd=password-fixture-secret&ACCESS_TOKEN=access-fixture-secret&refresh_token=refresh-fixture-secret&provider_token=provider-fixture-secret&error_description=error-fixture-secret&Code=code-fixture-secret&token_hash=hash-fixture-secret&returnTo=nested-fixture-secret';
    window.history.replaceState({}, '', '/en/tool/notion' + query + '#private-fixture-fragment');
    Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://tooltrim.com/en/tool/figma' + query + '#referrer-fixture-fragment' });
    acceptBeforeLoad(); await mount(window.location.pathname + window.location.search); loadTag();
    expect(views()[0][2]).toMatchObject({ page_path: '/en/tool/notion?utm_campaign=public&currency=EUR', page_location: 'http://localhost:3000/en/tool/notion?utm_campaign=public&currency=EUR', page_referrer: 'https://tooltrim.com/en/tool/figma?utm_campaign=public&currency=EUR' });
    expect(JSON.stringify(commands)).not.toContain('fixture');
  });
});
