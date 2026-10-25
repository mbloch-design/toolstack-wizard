import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import ToolPricingSection from './ToolPricingSection';
import type { Tool } from '@/data/types';

afterEach(cleanup);
const main = 'https://try.uniqode.com/lyuxl5fme6c4';
const pricing = 'https://try.uniqode.com/wvxety1c73nj-exlg8';
const fixture = (override?: string) => ({
  id: 'uniqode', slug: 'uniqode', name: 'Uniqode',
  websiteUrl: 'https://www.uniqode.com/', affiliateLink: main,
  pricing: { paid: 'Essential: $9/month, billed annually.' },
  pricing_v5: { compare_price_monthly_eur: null,
    official_source_url: 'https://www.uniqode.com/pricing', affiliate_url: override },
}) as unknown as Tool;

it('uses the dedicated sponsored pricing link instead of the main affiliate destination', () => {
  render(<ToolPricingSection tool={fixture(pricing)} displayPrice={0} lang="en" t={(_, en) => en} />);
  const link = screen.getByRole('link', { name: 'Official pricing' });
  expect(link).toHaveAttribute('href', pricing);
  expect(link.getAttribute('rel')).toContain('sponsored');
});

it.each([undefined, 'javascript:alert(1)'])('preserves the main affiliate fallback when pricing override is %s', override => {
  render(<ToolPricingSection tool={fixture(override)} displayPrice={0} lang="en" t={(_, en) => en} />);
  expect(screen.getByRole('link', { name: 'Official pricing' })).toHaveAttribute('href', main);
});
