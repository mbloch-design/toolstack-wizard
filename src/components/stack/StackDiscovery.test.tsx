// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import StackDiscovery from './StackDiscovery';
import type { ExplorationCandidate } from '@/lib/toolExploration';
vi.mock('@/components/ToolLogo',()=>({default:()=> <span aria-hidden />}));
afterEach(cleanup);
const candidates=Array.from({length:7},(_,i)=>({tool:{id:`tool-${i}`,slug:`tool-${i}`,name:`Tool ${i}`,shortDescription:'Une idée à explorer.',shortDescriptionEn:'An idea to explore.'},relatedSource:{id:'source',name:'Source'},direction:'adjacent',reasonFr:'Usage commun avec Source',reasonEn:'Shared use with Source',categoryLabel:'Design',stackState:'new',score:80})) as ExplorationCandidate[];
const props={candidates,lang:'fr' as const,prefix:'/fr',sourceIds:['source'],selectedIds:[] as string[],onAdd:vi.fn()};
const view=(overrides={})=><MemoryRouter><StackDiscovery {...props} {...overrides}/></MemoryRouter>;
it('offers three discoveries, renews them without editing the stack and keeps detail and Explorer links distinct',()=>{
 render(view());
 expect(screen.getAllByRole('link',{name:/^Voir la fiche de Tool/})).toHaveLength(3);
 expect(screen.getByRole('link',{name:'Voir la fiche de Tool 0'})).toHaveAttribute('href','/fr/tool/tool-0');
 expect(screen.getByRole('link',{name:'Explorer les pistes'})).toHaveAttribute('href','/fr/explorer?type=stack&source=ma-stack');
 fireEvent.click(screen.getByRole('button',{name:'D’autres pistes'}));
 expect(screen.queryByRole('link',{name:'Voir la fiche de Tool 0'})).toBeNull();
 expect(screen.getByRole('link',{name:'Voir la fiche de Tool 3'})).toBeVisible();
 expect(props.onAdd).not.toHaveBeenCalled();
});
it('keeps the added idea visible and disables repeat addition until another batch is requested',()=>{
 const result=render(view());
 result.rerender(view({candidates:candidates.slice(1),selectedIds:['tool-0']}));
 expect(screen.getByRole('link',{name:'Voir la fiche de Tool 0'})).toBeVisible();
 expect(screen.getByRole('button',{name:'Tool 0 ajouté à ma stack'})).toBeDisabled();
});
it('keeps an exploration destination when no supported suggestion exists',()=>{
 render(view({candidates:[]}));
 expect(screen.getByRole('link',{name:'Explorer les pistes'})).toBeVisible();
 expect(screen.queryByRole('button',{name:'D’autres pistes'})).toBeNull();
});
it('clears suggestions linked to a removed source',()=>{
 const result=render(view());result.rerender(view({sourceIds:['other'],candidates:[]}));
 expect(screen.queryByRole('link',{name:'Voir la fiche de Tool 0'})).toBeNull();
});
it('returns focus to the first new discovery when ideas are renewed',()=>{
 render(view());fireEvent.click(screen.getByRole('button',{name:'D’autres pistes'}));
 expect(screen.getByRole('link',{name:'Voir la fiche de Tool 3'})).toHaveFocus();
});
it('blocks repeat additions during the shared flight without claiming the tool is added',()=>{
 render(view({pendingSlug:'tool-0'}));
 expect(screen.getByRole('button',{name:'Ajout de Tool 0 en cours'})).toBeDisabled();
 expect(screen.getByRole('button',{name:'Ajouter Tool 1 à ma stack'})).toBeDisabled();
 expect(screen.queryByRole('button',{name:'Tool 0 ajouté à ma stack'})).toBeNull();
});

it('keeps keyboard context when the last fresh idea removes the renewal button',()=>{
 const result=render(view({candidates:candidates.slice(0,4)}));
 result.rerender(view({candidates:candidates.slice(3,4),selectedIds:['tool-0','tool-1','tool-2']}));
 fireEvent.click(screen.getByRole('button',{name:'D’autres pistes'}));
 expect(screen.queryByRole('button',{name:'D’autres pistes'})).toBeNull();
 expect(screen.getByRole('link',{name:'Voir la fiche de Tool 3'})).toHaveFocus();
});
