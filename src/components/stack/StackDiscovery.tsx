import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '@/lib/routerLinks';
import ToolCardImage from '@/components/tool/ToolCardImage';
import ToolLogo from '@/components/ToolLogo';
import { Button } from './StackKit';
import { Check, Plus, RefreshCw } from '@/lib/icons';
import { getExplorerHref, type ExplorationCandidate } from '@/lib/toolExploration';
import type { ToolSummary } from '@/hooks/useSupabaseData';
import { trackEvent } from '@/lib/analytics';

const firstRound = (candidates: ExplorationCandidate[]) => ({ cards: candidates.slice(0, 3), seen: candidates.slice(0, 3).map(candidate => candidate.tool.id) });
export default function StackDiscovery({ candidates, lang, prefix, sourceIds, selectedIds, pendingSlug, explorerSources, onAdd }: {
  candidates: ExplorationCandidate[]; lang: 'fr' | 'en'; prefix: string; sourceIds: string[]; selectedIds: string[]; pendingSlug?: string | null; explorerSources?: string[];
  onAdd: (tool: ToolSummary, origin: HTMLElement) => void;
}) {
  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;
  const [round, setRound] = useState(() => firstRound(candidates));
  const list = useRef<HTMLUListElement>(null);
  const focusNewRound = useRef(false);
  useLayoutEffect(() => {
    if (!focusNewRound.current) return;
    focusNewRound.current = false;
    if (list.current) { list.current.scrollLeft = 0; list.current.querySelector<HTMLAnchorElement>('.tt-mediacard-link')?.focus({ preventScroll: true }); }
  }, [round.cards]);
  const sourceKey = [...sourceIds].sort().join('|');
  useEffect(() => {
    // Adding a discovery keeps its card in place. Removing its source invalidates the reason.
    if ((!round.cards.length && candidates.length) || round.cards.some(card => !sourceIds.includes(card.relatedSource.id))) setRound(firstRound(candidates));
  }, [candidates, sourceKey, round.cards]);
  const more = candidates.some(candidate => !round.cards.some(card => card.tool.id === candidate.tool.id));
  const renew = () => {
    focusNewRound.current = true;
    setRound(previous => {
      const fresh = candidates.filter(candidate => !previous.seen.includes(candidate.tool.id));
      const pool = fresh.length ? fresh : candidates.filter(candidate => !previous.cards.some(card => card.tool.id === candidate.tool.id));
      const cards = pool.slice(0, 3);
      return { cards, seen: fresh.length ? [...previous.seen, ...cards.map(card => card.tool.id)] : cards.map(card => card.tool.id) };
    });
    trackEvent('stack_explorer_click', { source: 'recos_refresh' });
  };
  return <section className="tt-section" data-section="discovery" aria-labelledby="ms-recos-title">
    <header className="tt-sectionhead">
      <div><h2 id="ms-recos-title" className="tt-title-section">{t('À découvrir', 'Discover something new')}</h2>
        <p className="tt-text">{t('D’autres approches autour de vos outils. La prochaine bonne pioche est peut-être ici.', 'Fresh approaches around your tools. Your next good find could be here.')}</p>
      </div>
      <Link className="tt-link" to={getExplorerHref(prefix, { type: 'stack' })} state={{ explorerCanGoBack: true, explorerReturnTo: `${prefix}/ma-stack`, ...(explorerSources?.length ? { explorerStackSources: explorerSources } : {}) }} onClick={() => trackEvent('stack_explorer_click', { source: 'recos' })}>{t('Explorer les pistes', 'Explore more ideas')}</Link>
    </header>
    {round.cards.length > 0 ? <ul ref={list} className="tt-mediacards" aria-label={t("Idées à découvrir", "Ideas to discover")}>{round.cards.map(candidate => {
      const { tool } = candidate;
      const added = selectedIds.includes(tool.id);
      const pending = pendingSlug === (tool.slug || tool.id);
      return <li key={tool.id} className="ms-reco" data-discovery-tool={tool.slug || tool.id}>
        {/* Organisme « carte média » du système (planche, gabarit Ma stack) : l'image, l'outil, la raison ; l'ajout posé sur l'image. */}
        <article className="tt-mediacard">
          <Link className="tt-mediacard-link" to={`${prefix}/tool/${tool.slug ?? tool.id}`} aria-label={t(`Voir la fiche de ${tool.name}`, `View ${tool.name}`)} onClick={() => trackEvent('stack_reco_click', { tool: tool.slug || tool.id })}>
            <span className="tt-mediacard-shot"><ToolCardImage tool={tool} logoSize={44} overlayMode="static" /></span>
            <span className="tt-mediacard-id"><ToolLogo tool={tool} size={24} className="tt-logo-tile" /><span className="tt-label">{tool.name}</span>{candidate.categoryLabel && <span className="tt-note">· {candidate.categoryLabel}</span>}</span>
            {(lang === 'fr' ? candidate.reasonFr : candidate.reasonEn) && <span className="tt-note">{lang === 'fr' ? candidate.reasonFr : candidate.reasonEn}</span>}
          </Link>
          <button type="button" className="tt-mediacard-action" disabled={added || !!pendingSlug} aria-busy={pending || undefined}
            aria-label={pending ? t(`Ajout de ${tool.name} en cours`, `Adding ${tool.name}`) : added ? t(`${tool.name} ajouté à ma stack`, `${tool.name} added to my stack`) : t(`Ajouter ${tool.name} à ma stack`, `Add ${tool.name} to my stack`)}
            title={pending ? t('Ajout en cours', 'Adding') : added ? t('Dans ma stack', 'In my stack') : t('Ajouter à ma stack', 'Add to my stack')}
            onClick={event => { event.preventDefault(); event.stopPropagation(); onAdd(tool, event.currentTarget.closest('li')!); }}>
            {pending ? <RefreshCw aria-hidden /> : added ? <Check aria-hidden /> : <Plus aria-hidden />}
          </button>
        </article>
      </li>;
    })}</ul> : <p className="tt-text">{t('La curiosité ne s’arrête pas aux liens du catalogue. Ouvrez l’Explorer pour choisir votre piste.', 'Curiosity goes beyond catalogue connections. Open the Explorer to choose your direction.')}</p>}
    {more && <div className="tt-section-foot"><Button variant="secondary" onClick={renew}>{t('D’autres pistes', 'More ideas')}</Button></div>}
  </section>;
}
