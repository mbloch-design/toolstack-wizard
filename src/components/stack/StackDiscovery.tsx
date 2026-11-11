import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '@/lib/routerLinks';
import ToolCover from '@/components/tool/ToolCover';
import MediaCard, { MediaCards } from '@/ds/MediaCard/MediaCard';
import { Section, SectionFoot, SectionHead } from '@/ds/Toolbar/Toolbar';
import { atoms } from '@/ds/atoms';
import Button, { linkClass } from '@/ds/Button/Button';
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
    if (list.current) { list.current.scrollLeft = 0; list.current.querySelector<HTMLAnchorElement>('[data-media-link]')?.focus({ preventScroll: true }); }
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
  // The section and its cards are design system components (src/ds); the page only passes its router links and screenshots.
  return <Section labelledBy="ms-recos-title" name="discovery">
    <SectionHead title={t('Et pour la suite ?', 'And next?')} titleId="ms-recos-title" note={t('D’autres approches autour de vos outils. La prochaine bonne pioche est peut-être ici.', 'Fresh approaches around your tools. Your next good find could be here.')}
      action={<Link className={linkClass()} to={getExplorerHref(prefix, { type: 'stack' })} state={{ explorerCanGoBack: true, explorerReturnTo: `${prefix}/ma-stack`, ...(explorerSources?.length ? { explorerStackSources: explorerSources } : {}) }} onClick={() => trackEvent('stack_explorer_click', { source: 'recos' })}>{t('Explorer les pistes', 'Explore more ideas')}</Link>} />
    {round.cards.length > 0 ? <MediaCards listRef={list} label={t("Idées à découvrir", "Ideas to discover")}>{round.cards.map(candidate => {
      const { tool } = candidate;
      const added = selectedIds.includes(tool.id);
      const pending = pendingSlug === (tool.slug || tool.id);
      return <MediaCard key={tool.id} lang={lang} tool={tool} dataTool={tool.slug || tool.id} category={candidate.categoryLabel}
        image={<ToolCover tool={tool} alt={t(`Aperçu de ${tool.name}`, `${tool.name} preview`)} />}
        reason={(lang === 'fr' ? candidate.reasonFr : candidate.reasonEn) || undefined}
        renderLink={(className, content) => <Link className={className} data-media-link="" to={`${prefix}/tool/${tool.slug ?? tool.id}`} aria-label={t(`Voir la fiche de ${tool.name}`, `View ${tool.name}`)} onClick={() => trackEvent('stack_reco_click', { tool: tool.slug || tool.id })}>{content}</Link>}
        add={{ state: pending ? 'pending' : added ? 'added' : 'idle', disabled: !!pendingSlug, onAdd: (origin) => onAdd(tool, origin) }} />;
    })}</MediaCards> : <p className={atoms.text}>{t('La curiosité ne s’arrête pas aux liens du catalogue. Ouvrez l’Explorer pour choisir votre piste.', 'Curiosity goes beyond catalogue connections. Open the Explorer to choose your direction.')}</p>}
    {more && <SectionFoot><Button onClick={renew}>{t('D’autres pistes', 'More ideas')}</Button></SectionFoot>}
  </Section>;
}
