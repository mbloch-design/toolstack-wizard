import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '@/lib/routerLinks';
import ToolCover from '@/components/tool/ToolCover';
import MediaCard, { MediaCards } from '@/ds/MediaCard/MediaCard';
import { Section, SectionFoot, SectionHead } from '@/ds/Toolbar/Toolbar';
import { atoms } from '@/ds/atoms';
import Button, { linkClass, LinkArrow } from '@/ds/Button/Button';
import { getExplorerHref, type ExplorationCandidate } from '@/lib/toolExploration';
import type { ToolSummary } from '@/hooks/useSupabaseData';
import { trackEvent } from '@/lib/analytics';

/** Ideas come by rows of four, the width of the media grid, so a row is never left with a hole (M01). */
const BATCH = 4;
const firstRound = (candidates: ExplorationCandidate[]) => ({ cards: candidates.slice(0, BATCH), seen: candidates.slice(0, BATCH).map(candidate => candidate.tool.id) });
export default function StackDiscovery({ candidates, lang, prefix, sourceIds, selectedIds, pendingSlug, explorerSources, onAdd, note }: {
  /** What the first ideas answer, when the stack has a gap (M01): replaces the general sentence. */
  note?: string;
  candidates: ExplorationCandidate[]; lang: 'fr' | 'en'; prefix: string; sourceIds: string[]; selectedIds: string[]; pendingSlug?: string | null; explorerSources?: string[];
  onAdd: (tool: ToolSummary, origin: HTMLElement) => void;
}) {
  const t = (fr: string, en: string) => lang === 'fr' ? fr : en;
  const [round, setRound] = useState(() => firstRound(candidates));
  const list = useRef<HTMLUListElement>(null);
  // Index of the first card a « more » added: focus lands on it, the cards already read stay where they were.
  const focusFrom = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (focusFrom.current === null) return;
    const index = focusFrom.current;
    focusFrom.current = null;
    list.current?.querySelectorAll<HTMLAnchorElement>('[data-media-link]')[index]?.focus();
  }, [round.cards]);
  const sourceKey = [...sourceIds].sort().join('|');
  useEffect(() => {
    // Adding a discovery keeps its card in place. Removing its source invalidates the reason.
    if ((!round.cards.length && candidates.length) || round.cards.some(card => !sourceIds.includes(card.relatedSource.id))) setRound(firstRound(candidates));
  }, [candidates, sourceKey, round.cards]);
  // « More » loads the next ideas after the ones shown, never swaps them (M01, 16/11/2026: « pas une roulette russe »).
  const next = candidates.filter(candidate => !round.cards.some(card => card.tool.id === candidate.tool.id)).slice(0, BATCH);
  const more = next.length > 0;
  const loadMore = () => {
    focusFrom.current = round.cards.length;
    setRound(previous => ({ cards: [...previous.cards, ...next], seen: [...previous.seen, ...next.map(card => card.tool.id)] }));
    trackEvent('stack_explorer_click', { source: 'recos_more' });
  };
  // The section and its cards are design system components (src/ds); the page only passes its router links and screenshots.
  return <Section labelledBy="ms-recos-title" name="discovery">
    <SectionHead title={t('Et pour la suite ?', 'And next?')} titleId="ms-recos-title" note={note ?? t('D’autres approches autour de vos outils. La prochaine bonne pioche est peut-être ici.', 'Fresh approaches around your tools. Your next good find could be here.')}
      action={<Link className={linkClass()} to={getExplorerHref(prefix, { type: 'stack' })} state={{ explorerCanGoBack: true, explorerReturnTo: `${prefix}/ma-stack`, ...(explorerSources?.length ? { explorerStackSources: explorerSources } : {}) }} onClick={() => trackEvent('stack_explorer_click', { source: 'recos' })}>{t('Explorer les pistes', 'Explore more ideas')}<LinkArrow /></Link>} />
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
    {/* The site's convention (src/pages/ToolsPage.tsx): the way to everything sits in the section head, « Afficher plus »
        ends the list and loads the next ones in place, after the others. */}
    {more && <SectionFoot><Button onClick={loadMore}>{t('Afficher plus', 'Show more')}</Button></SectionFoot>}
  </Section>;
}
