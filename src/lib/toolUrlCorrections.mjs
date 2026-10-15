import corrections from '../data/toolUrlCorrections.json' with { type: 'json' };

/** Exact matches leave future catalogue corrections, including canonical media, intact. */
export function resolveAuditedToolUrl(slug, field, url) {
  const correction = corrections.find((entry) => entry.slug === slug && entry.field === field && entry.expectedUrl === url);
  return correction ? correction.url : url;
}

/** Shared by the live mapper, public projection and local snapshot sync. No remote mutation. */
export function applyAuditedToolUrls(tool) {
  const slug = tool.slug || tool.id;
  const result = { ...tool };
  for (const field of ['ogImageUrl', 'websiteUrl', 'affiliateLink']) {
    if (Object.hasOwn(result, field)) {
      result[field] = resolveAuditedToolUrl(slug, field, result[field]);
    }
  }
  if (Array.isArray(result.galleryImages)) {
    result.galleryImages = result.galleryImages
      .map((url) => resolveAuditedToolUrl(slug, 'galleryImages', url))
      .filter((url) => typeof url === 'string' && url.length > 0);
  }
  return result;
}

/** True only for a nonempty exact replacement validated in the media audit. */
export function isAuditedToolCoverUrl(slug, url) {
  return typeof url === "string" && url.length > 0 && corrections.some((entry) => entry.slug === slug && entry.field === "ogImageUrl" && entry.url === url);
}
