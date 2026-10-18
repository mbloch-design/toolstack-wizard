import { describe, expect, it } from 'vitest';
import tools from '@/data/tools_v4.json';
import { affiliateComparisonGuides, comparisonOffers } from '@/data/affiliateComparisonGuides';
import { nativePriceFromTool } from '@/lib/currencyRates';

const find = (slug: string): any => tools.find(t => t.slug === slug);
describe('Kit conversion refresh', () => {
  it('retains the exact affiliate link and evidence for all five scores', () => {
    const kit = find('kit');
    expect(kit.affiliateLink).toBe('https://partners.kit.com/u037oht6r48p');
    for (const axis of ['valeurAjoutee', 'simplicite', 'utilisation', 'puissance', 'reversibilite']) {
      expect(kit.toolTrimRating[axis]).toBe(4);
      expect(kit.toolTrimRating.evidence[axis]).toContain('https://');
      expect(kit.toolTrimRating.evidenceEn[axis]).toContain('https://');
    }
  });
  it('keeps annual USD prices native and separates promotion from renewal', () => {
    const kit = find('kit');
    expect(kit.defaultMonthlyPrice).toBe(0);
    expect(nativePriceFromTool(kit)).toBeNull();
    expect(nativePriceFromTool(find('beehiiv'))).toBeNull();
    for (const pricing of [kit.pricing_v5, kit.pricing_v5En]) {
      expect(pricing.compare_price_monthly_eur).toBe(0);
      expect(pricing.compare_plan_kind).toBe('free');
      expect(pricing.plans[0].isComparePlan).toBe(true);
      expect(pricing.plans[1].isComparePlan).toBe(false);
      expect(pricing.plans[1]).toMatchObject({ nativeAmount: 390, nativeCurrency: 'USD', billingPeriod: 'annual' });
      expect(pricing.plans[2].nativeAmount).toBe(790);
    }
    expect(kit.pricingEn.paid).toContain('first year only');
  });
  it('corrects related free limits and uses canonical Kit links', () => {
    expect(find('mailerlite').pricingEn.free).toContain('250 subscribers');
    expect(find('beehiiv').pricingEn.free).toContain('2,500 subscribers');
    for (const slug of ['brevo', 'mailerlite', 'beehiiv', 'substack']) {
      expect(find(slug).alternatives).toContain('kit');
      expect(find(slug).timeGainedHoursPerMonth).toBeFalsy();
    }
  });
  it.each(['mailchimp-vs-convertkit', 'convertkit-vs-getresponse'])('adds bilingual advice and affiliate offers to %s', pair => {
    for (const lang of ['fr', 'en'] as const) expect(affiliateComparisonGuides[pair][lang].checkedAt).toBe('2026-10-19');
    expect(comparisonOffers[pair]).toContainEqual({ name: 'Kit', url: 'https://partners.kit.com/u037oht6r48p', affiliated: true });
    const kitIndex = pair === 'mailchimp-vs-convertkit' ? 1 : 0;
    expect(affiliateComparisonGuides[pair].en.scenarios[kitIndex].choice).toContain('Kit');
  });
});
