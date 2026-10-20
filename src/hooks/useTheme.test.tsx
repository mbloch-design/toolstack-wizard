import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { useTheme } from './useTheme';
beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('shares immediate changes and toggles across independent consumers', () => {
  const a = renderHook(() => useTheme()); const b = renderHook(() => useTheme());
  act(() => a.result.current.setTheme('dark'));
  expect(b.result.current.theme).toBe('dark');
  act(() => b.result.current.toggle());
  expect(a.result.current.theme).toBe('light');
  expect(document.documentElement.style.colorScheme).toBe('light');
});
it('keeps all consumers usable with denied persistence and newly mounted consumers', () => {
  vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('denied'); });
  const a = renderHook(() => useTheme()); act(() => a.result.current.setTheme('dark'));
  const b = renderHook(() => useTheme()); expect(b.result.current.theme).toBe('dark');
  act(() => b.result.current.setTheme('light')); expect(a.result.current.theme).toBe('light');
});
it('renders light on the server even after a client selected dark', () => {
  const a = renderHook(() => useTheme()); act(() => a.result.current.setTheme('dark'));
  const Consumer = () => createElement('span', null, useTheme().theme);
  expect(renderToString(createElement(Consumer))).toBe('<span>light</span>');
});
