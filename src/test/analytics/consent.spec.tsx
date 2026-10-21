import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
let AnalyticsConsent: typeof import('@/components/AnalyticsConsent').default;
let AnalyticsPageView: typeof import('@/components/AnalyticsPageView').default;

const commands: unknown[][] = [];
function mount() {
  return render(<MemoryRouter><AnalyticsPageView /><AnalyticsConsent /></MemoryRouter>);
}
function loadTag() {
  const script = document.querySelector('script[data-tooltrim-ga]');
  expect(script).not.toBeNull();
  act(() => { script!.dispatchEvent(new Event('load')); });
}
const views = () => commands.filter(c => c[0] === 'event' && c[1] === 'page_view');
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
  vi.useFakeTimers();
  commands.length = 0;
  window.localStorage.clear();
  window.__tooltrimAnalyticsConsent = false;
  window.gtag = (...args) => { commands.push(args); };
  document.querySelectorAll('script[data-tooltrim-ga]').forEach(s => s.remove());
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('GA4 consent lifecycle', () => {
  it('starts with denied storage before config and strips URL parameters from limited page views', () => {
    window.history.replaceState({}, '', '/?email=private@example.com#secret');
    mount();
    loadTag();
    const defaults = commands.findIndex(c => c[0] === 'consent' && c[1] === 'default');
    expect(defaults).toBeGreaterThanOrEqual(0);
    const config = commands.findIndex(c => c[0] === 'config');
    expect(defaults).toBeLessThan(config);
    const safeDefaults = commands.slice(0, config).find(c => c[0] === 'set' && typeof c[1] === 'object');
    expect(safeDefaults?.[1]).toMatchObject({page_location:'http://localhost:3000/',page_title:'/'});
    expect(views()[0][2]).toMatchObject({page_location:'http://localhost:3000/'});
    expect(JSON.stringify(views())).not.toContain('private@example.com');
  });
  it('gates detailed interactions even after the limited tag is ready', async () => {
    mount(); loadTag();
    const {trackEvent} = await import('@/lib/analytics');
    trackEvent('select_tool', {tool_id:'not-consented'});
    expect(commands.some(c => c[1] === 'select_tool')).toBe(false);
    fireEvent.click(screen.getByRole('button', {name:'Accepter'}));
    trackEvent('select_tool', {tool_id:'consented'});
    expect(commands.filter(c => c[1] === 'select_tool')).toHaveLength(1);
  });
  it('hides the initial prompt when another tab accepts', () => {
    mount();
    window.localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({version:1, choice:'accepted', expiresAt:Date.now()+86400000}));
    act(() => { window.dispatchEvent(new StorageEvent('storage', {key:'tooltrim-analytics-consent'})); });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('asks again for legacy choices without a date', () => {
    window.localStorage.setItem('tooltrim-analytics-consent', 'accepted');
    mount();
    expect(screen.getByRole('button', {name:'Accepter'})).toBeInTheDocument();
    expect(document.querySelector('script[data-tooltrim-ga]')).not.toBeNull();
  });
  it('asks again when a dated choice has expired', () => {
    window.localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({version:1, choice:'refused', expiresAt:Date.now()-1}));
    mount();
    expect(screen.getByRole('button', {name:'Accepter'})).toBeInTheDocument();
  });
  it('allows reopening preferences after refusal', () => {
    mount();
    fireEvent.click(screen.getByRole('button', {name:'Refuser'}));
    act(() => { window.dispatchEvent(new Event('tooltrim:open-cookie-preferences')); });
    expect(screen.getByRole('button', {name:'Accepter'})).toBeInTheDocument();
  });

  it('reports the current page once when consent follows the initial route effect', () => {
    mount();
    act(() => { vi.advanceTimersByTime(1000); });
    loadTag();
    expect(views()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', {name:'Accepter'}));
    expect(views()).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(views()).toHaveLength(1);
  });
  it('does not send events before a slow Google tag has been configured', () => {
    mount();
    fireEvent.click(screen.getByRole('button', {name:'Accepter'}));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(views()).toHaveLength(0);
    loadTag();
    const config = commands.findIndex(c => c[0] === 'config');
    const view = commands.findIndex(c => c[0] === 'event' && c[1] === 'page_view');
    expect(config).toBeGreaterThanOrEqual(0);
    expect(view).toBeGreaterThan(config);
  });
  it('keeps limited page measurement available after refusal', () => {
    mount();
    fireEvent.click(screen.getByRole('button', {name:'Refuser'}));
    loadTag();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(document.querySelector('script[data-tooltrim-ga]')).not.toBeNull();
    expect(views()).toHaveLength(1);
    expect(window.__tooltrimAnalyticsConsent).toBe(false);
    expect(commands.some(c => c[0] === 'consent' && (c[2] as Record<string, string>).analytics_storage === 'granted')).toBe(false);
  });
});

describe('consented current-view measurement', () => {
  it('waits for both consent and tag readiness, then reports once', async () => {
    const {whenAnalyticsReady} = await import('@/lib/analytics');
    mount();
    const report = vi.fn();
    const stop = whenAnalyticsReady(report);
    fireEvent.click(screen.getByRole('button', {name:'Accepter'}));
    expect(report).not.toHaveBeenCalled();
    loadTag();
    expect(report).toHaveBeenCalledTimes(1);
    act(() => window.dispatchEvent(new Event('focus')));
    expect(report).toHaveBeenCalledTimes(1);
    stop();
  });
  it('reports the currently visible view after late acceptance, without replaying refused actions', async () => {
    const {whenAnalyticsReady, trackEvent} = await import('@/lib/analytics');
    mount(); loadTag();
    const report = vi.fn();
    const stop = whenAnalyticsReady(report);
    trackEvent('explorer_save', {source_type:'stack', intent:'wishlist'});
    expect(report).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name:'Accepter'}));
    expect(report).toHaveBeenCalledTimes(1);
    expect(commands.some(c => c[1] === 'explorer_save')).toBe(false);
    stop();
  });
  it('does not report an abandoned view when the tag finishes later', async () => {
    const {whenAnalyticsReady} = await import('@/lib/analytics');
    mount();
    const report = vi.fn();
    const stop = whenAnalyticsReady(report);
    stop();
    fireEvent.click(screen.getByRole('button', {name:'Accepter'}));
    loadTag();
    expect(report).not.toHaveBeenCalled();
  });
});

describe('authentication URL privacy with previously granted analytics consent', () => {
  const acceptBeforeLoad = () => window.localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({ version: 1, choice: 'accepted', expiresAt: Date.now() + 86400000 }));
  it.each(['/fr/connexion/retour', '/fr/compte/reinitialiser', '/en/sign-in/callback', '/en/account/reset-password', '/en/account/settings', '/en/sign-up'])('drops all callback fragments and private query parameters on %s', async route => {
    const query = '?returnTo=' + encodeURIComponent('/en/tool/notion?access_token=nested-fixture-secret') + '&unrecognized=private-fixture-value';
    window.history.replaceState({}, '', route + query + '#access_token=access-fixture-secret&refresh_token=refresh-fixture-secret&provider_token=provider-fixture-secret');
    Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://tooltrim.com/fr/connexion/retour?error_description=referrer-fixture-secret#access_token=referrer-token' });
    acceptBeforeLoad(); mount(); loadTag();
    expect(views()[0][2]).toMatchObject({ page_path: route, page_location: 'http://localhost:3000' + route, page_referrer: 'https://tooltrim.com/fr/connexion/retour' });
    const { trackPageView } = await import('@/lib/analytics');
    window.history.replaceState({}, '', '/en/tool/notion?utm_source=legitimate#public-section');
    trackPageView('/en/tool/notion?utm_source=legitimate#public-section', 'Notion');
    const payload = views().at(-1)![2] as Record<string, string>;
    expect(payload).toMatchObject({ page_path: '/en/tool/notion?utm_source=legitimate', page_location: 'http://localhost:3000/en/tool/notion?utm_source=legitimate', page_referrer: 'http://localhost:3000' + route });
    expect(commands.filter(command => command[0] === 'set' && typeof command[1] === 'object').at(-1)?.[1]).toMatchObject({ page_location: payload.page_location, page_referrer: payload.page_referrer });
    expect(JSON.stringify(commands)).not.toMatch(/fixture-secret|fixture-value|referrer-token/);
  });
  it('removes case-insensitive private and auth fields from public URLs and initial referrer, retaining legitimate public queries', () => {
    const query = '?utm_campaign=public&currency=EUR&Email=email-fixture-secret&NAME=name-fixture-secret&PaSsWoRd=password-fixture-secret&ACCESS_TOKEN=access-fixture-secret&refresh_token=refresh-fixture-secret&provider_token=provider-fixture-secret&error_description=error-fixture-secret&Code=code-fixture-secret&token_hash=hash-fixture-secret&returnTo=nested-fixture-secret';
    window.history.replaceState({}, '', '/en/tool/notion' + query + '#private-fixture-fragment');
    Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://tooltrim.com/en/tool/figma' + query + '#referrer-fixture-fragment' });
    acceptBeforeLoad(); mount(); loadTag();
    expect(views()[0][2]).toMatchObject({ page_path: '/en/tool/notion?utm_campaign=public&currency=EUR', page_location: 'http://localhost:3000/en/tool/notion?utm_campaign=public&currency=EUR', page_referrer: 'https://tooltrim.com/en/tool/figma?utm_campaign=public&currency=EUR' });
    expect(JSON.stringify(commands)).not.toContain('fixture');
  });
});
