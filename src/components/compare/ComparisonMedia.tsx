import { useState } from 'react';
import { TOOL_IMAGE_BLOCKLIST } from '@/lib/toolImageBlocklist';
import ToolLogo from '@/components/ToolLogo';
import { ArrowLeft, ArrowRight, Layers } from '@/lib/icons';
import type { Tool } from '@/data/types';

/** Uses existing catalogue media only; never synthesises a product screenshot. */
export default function ComparisonMedia({ tool, lang }: { tool: Tool; lang: 'fr' | 'en' }) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const candidates = [...new Set([...(tool.galleryImages ?? []), TOOL_IMAGE_BLOCKLIST.has(tool.slug || tool.id) ? undefined : tool.ogImageUrl]
    .filter((url): url is string => typeof url === 'string' && /^(https?:\/\/|\/[^/])/.test(url)))];
  const images = candidates.filter(url => !failed.includes(url));
  const index = Math.min(active, Math.max(0, images.length - 1));
  return <figure className="cp-media">
    <div className="cp-media-stage">
      {images.length ? <img key={images[index]} src={images[index]} loading="lazy" decoding="async"
        alt={lang === 'fr' ? `Visuel du catalogue : ${tool.name}` : `Catalogue visual: ${tool.name}`}
        onError={() => { setFailed(current => [...current, images[index]]); setActive(0); }} />
        : <div className="cp-media-fallback"><Layers size={24} aria-hidden="true" /><span className="cp-media-connector" /><ToolLogo tool={tool} size={40} /><span className="cp-media-connector" /><Layers size={24} aria-hidden="true" /></div>}
    </div>
    <figcaption>
      <span>{images.length ? (lang === 'fr' ? 'Aperçu du catalogue' : 'Catalogue preview') : (lang === 'fr' ? 'Repère visuel · illustration' : 'Visual guide · illustration')}</span>
      {images.length > 1 && <div className="cp-media-controls">
        <button type="button" aria-label={lang === 'fr' ? `Visuel précédent : ${tool.name}` : `Previous visual: ${tool.name}`} onClick={() => setActive((index - 1 + images.length) % images.length)}><ArrowLeft size={16} aria-hidden="true" /></button>
        <span aria-live="polite">{index + 1} / {images.length}</span>
        <button type="button" aria-label={lang === 'fr' ? `Visuel suivant : ${tool.name}` : `Next visual: ${tool.name}`} onClick={() => setActive((index + 1) % images.length)}><ArrowRight size={16} aria-hidden="true" /></button>
      </div>}
    </figcaption>
  </figure>;
}
