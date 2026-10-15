import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Tailwind 4 class precedence in shared UI components', () => {
  it('lets a caller replace the preserved focus outline', () => {
    expect(cn('focus-visible:outline-hidden', 'focus-visible:outline-none')).toBe('focus-visible:outline-none');
  });
  it('keeps the caller shadow and conditional utility overrides', () => {
    expect(cn('shadow-xs p-4', false && 'hidden', { 'p-6': true }, 'shadow-none')).toBe('p-6 shadow-none');
  });
});
