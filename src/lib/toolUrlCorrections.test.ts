import { describe, expect, it } from 'vitest';
import { catalogProjectionRowsToTool, type CatalogProjectionRow } from './catalogProjection';
import { applyAuditedToolUrls, isAuditedToolCoverUrl, resolveAuditedToolUrl } from './toolUrlCorrections.mjs';

describe('audited catalogue URL corrections', () => {
  it.each([
    ['snov-io', ' campagnes).', 'https://snov.io/'],
    ['plutio', ' finances).', 'https://www.plutio.com/'],
    ['elfsight', ' formulaires…).', 'https://elfsight.com/'],
    ['vcita', ' paiements).', 'https://www.vcita.com/'],
  ])('restores the official website for %s without fabricating an affiliate destination', (slug, invalid, website) => {
    expect(applyAuditedToolUrls({ slug, websiteUrl: invalid, affiliateLink: invalid })).toEqual({ slug, websiteUrl: website, affiliateLink: null });
  });

  it('resolves the verified official origin of a relative legacy image', () => {
    expect(resolveAuditedToolUrl('flutter', 'ogImageUrl', '/assets/flutter-logo-sharing.d744440971931f937269e060e720f5a7.png')).toBe('https://flutter.dev/assets/flutter-logo-sharing.d744440971931f937269e060e720f5a7.png');
  });
  it('preserves a future canonical media URL and other tools with the same relative path', () => {
    expect(resolveAuditedToolUrl('flutter', 'ogImageUrl', 'https://flutter.dev/new-cover.png')).toBe('https://flutter.dev/new-cover.png');
    expect(resolveAuditedToolUrl('another-tool', 'ogImageUrl', '/banner.png')).toBe('/banner.png');
  });
  it('removes an absent local capture without inventing a replacement', () => {
    expect(resolveAuditedToolUrl('visualcv', 'ogImageUrl', 'https://tooltrim.com/og-screenshots/visualcv.jpg')).toBeNull();
  });
  it('repairs the verified product destination without changing unrelated fields', () => {
    expect(resolveAuditedToolUrl('zoom-ai-companion', 'websiteUrl', 'https://zoom.us/ai-assistant')).toBe('https://www.zoom.com/en/products/ai-assistant/');
    expect(resolveAuditedToolUrl('zoom-ai-companion', 'affiliateLink', 'https://zoom.us/ai-assistant')).toBe('https://zoom.us/ai-assistant');
  });
  it('applies the same corrections to snapshot-shaped objects and live projection rows without mutation', () => {
    const input = { id: 'flutter', slug: 'flutter', name: 'Flutter', ogImageUrl: '/assets/flutter-logo-sharing.d744440971931f937269e060e720f5a7.png', pricing: { paid: 'unchanged' } };
    const corrected = applyAuditedToolUrls(input);
    expect(corrected.ogImageUrl).toBe('https://flutter.dev/assets/flutter-logo-sharing.d744440971931f937269e060e720f5a7.png');
    expect(corrected.pricing).toEqual(input.pricing);
    expect(input.ogImageUrl).toMatch(/^\/assets/);
    expect(applyAuditedToolUrls(corrected)).toEqual(corrected);
    const projected = catalogProjectionRowsToTool([{ id: 'flutter', slug: 'flutter', name: 'Flutter', lang: 'fr', data_contract: 'legacy', og_image_url: input.ogImageUrl } as CatalogProjectionRow]);
    expect(projected?.ogImageUrl).toBe(corrected.ogImageUrl);
  });
  it('corrects broken gallery references while retaining unrelated media', () => {
    const input = { slug: 'pika-labs', galleryImages: ['https://pika.art/images/og.jpeg', '/existing-image.png'] };
    expect(applyAuditedToolUrls(input).galleryImages).toEqual(['https://pika.art/brand/opengraph.png', '/existing-image.png']);
    expect(input.galleryImages[0]).toBe('https://pika.art/images/og.jpeg');
  });
  it('recognizes only an exact verified replacement as eligible to recover a blocked cover', () => {
    expect(isAuditedToolCoverUrl('ae-gifgun', '/tool-media/ae-gifgun/official-demo.jpg')).toBe(true);
    expect(isAuditedToolCoverUrl('ae-gifgun', '/og-screenshots/ae-gifgun.png')).toBe(false);
    expect(isAuditedToolCoverUrl('ae-gifgun', '/future-unknown-cover.png')).toBe(false);
    expect(isAuditedToolCoverUrl('openai', null)).toBe(false);
  });
});
