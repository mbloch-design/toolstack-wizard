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
  vi.useFakeTimers();
  commands.length = 0;
  window.localStorage.clear();
  window.__tooltrimAnalyticsConsent = false;
  window.gtag = (...args) => { commands.push(args); };
  document.querySelectorAll('script[data-tooltrim-ga]').forEach(s => s.remove());
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('GA4 consent lifecycle', () => {
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
    expect(document.querySelector('script[data-tooltrim-ga]')).toBeNull();
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
    expect(views()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', {name:'Accepter'}));
    loadTag();
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
  it('keeps GA4 unloaded after refusal', () => {
    mount();
    fireEvent.click(screen.getByRole('button', {name:'Refuser'}));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(document.querySelector('script[data-tooltrim-ga]')).toBeNull();
    expect(views()).toHaveLength(0);
  });
});
