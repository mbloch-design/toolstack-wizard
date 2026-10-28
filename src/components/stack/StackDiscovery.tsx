import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '@/lib/routerLinks';
import ToolCardEditorial from '@/components/ToolCardEditorial';
import { Button } from './StackKit';
import { Check, Compass, Plus, RefreshCw } from '@/lib/icons';
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
    if (list.current) { list.current.scrollLeft = 0; list.current.querySelector<HTMLAnchorElement>('.tce-primary-link')?.focus({ preventScroll: true }); }
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
  return <section className="ms-mod ms-recos" aria-labelledby="ms-recos-title">
    <header className="ms-stage-bar">
      <div><h2 id="ms-recos-title" className="ms-stage-title">{t('À découvrir', 'Discover something new')}</h2>
        <p className="ms-recos-sub">{t('D’autres approches à découvrir autour de vos outils. La prochaine bonne pioche est peut-être ici.', 'Fresh approaches around your tools. Your next good find could be here.')}</p>
      </div>
      <Link className="ms-recos-more" to={getExplorerHref(prefix, { type: 'stack' })} state={{ explorerCanGoBack: true, explorerReturnTo: `${prefix}/ma-stack`, ...(explorerSources?.length ? { explorerStackSources: explorerSources } : {}) }} onClick={() => trackEvent('stack_explorer_click', { source: 'recos' })}><Compass size={16} aria-hidden />{t('Explorer les pistes', 'Explore more ideas')}</Link>
    </header>
    {round.cards.length > 0 ? <ul ref={list} className="ms-recos-grid" aria-label={t("Idées à découvrir", "Ideas to discover")}>{round.cards.map(candidate => {
      const { tool } = candidate;
      const added = selectedIds.includes(tool.id);
      const pending = pendingSlug === (tool.slug || tool.id);
      return <li key={tool.id} className="ms-reco" data-discovery-tool={tool.slug || tool.id}>
        <ToolCardEditorial tool={tool} prefix={prefix} t={t} lang={lang} variant="media" showPin={false} showPrice={false}
          onOpen={() => trackEvent('stack_reco_click', { tool: tool.slug || tool.id })}
          categoryLabel={candidate.categoryLabel} contextRole={lang === 'fr' ? candidate.reasonFr : candidate.reasonEn}
          mediaActions={<button type="button" className="tce-hover-action" disabled={added || !!pendingSlug} aria-busy={pending || undefined}
            aria-label={pending ? t(`Ajout de ${tool.name} en cours`, `Adding ${tool.name}`) : added ? t(`${tool.name} ajouté à ma stack`, `${tool.name} added to my stack`) : t(`Ajouter ${tool.name} à ma stack`, `Add ${tool.name} to my stack`)}
            title={pending ? t('Ajout en cours', 'Adding') : added ? t('Dans ma stack', 'In my stack') : t('Ajouter à ma stack', 'Add to my stack')}
            onClick={event => { event.preventDefault(); event.stopPropagation(); onAdd(tool, event.currentTarget.closest('li')!); }}>
            {pending ? <RefreshCw size={20} aria-hidden /> : added ? <Check size={20} aria-hidden /> : <Plus size={20} aria-hidden />}
          </button>} />
      </li>;
    })}</ul> : <p className="ms-discovery-empty">{t('La curiosité ne s’arrête pas aux liens du catalogue. Ouvrez l’Explorer pour choisir votre piste.', 'Curiosity goes beyond catalogue connections. Open the Explorer to choose your direction.')}</p>}
    {more && <div className="ms-discovery-renew"><Button variant="secondary" icon={<RefreshCw size={16} aria-hidden />} onClick={renew}>{t('D’autres pistes', 'More ideas')}</Button></div>}
  </section>;
}
