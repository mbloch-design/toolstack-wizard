// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import StackCostEditor, { type CostDraft } from './StackCostEditor';
import type { ToolSummary } from '@/hooks/useSupabaseData';
import { CURRENCY_RATE_DATE } from '@/lib/currencyRates';
vi.mock('@/lib/analytics',()=>({trackEvent:vi.fn()}));
afterEach(cleanup);
const tool={id:'github',slug:'github',name:'GitHub'} as ToolSummary;
const custom:CostDraft={kind:'choice',choice:{source:'custom',amount:19.95,currency:'USD',period:'monthly'}};
function mount(initial:CostDraft=custom,currency:'EUR'|'USD'|'GBP'='USD'){
 const onSave=vi.fn(),onCancel=vi.fn();
 render(<StackCostEditor tool={tool} initial={initial} entryLabel="$4/mo" currency={currency} lang="en" freemium={false} onSave={onSave} onCancel={onCancel}/>);
 return {onSave,onCancel,input:screen.getByLabelText('Billed amount'),save:screen.getByRole('button',{name:'Save'})};
}
it.each(['','-1','NaN','1e3','0x10','1.234','12,34,56'])('does not replace a saved invoice with the catalogue after invalid input %j',value=>{
 const {input,save,onSave}=mount();fireEvent.change(input,{target:{value}});
 expect(save).toBeDisabled();fireEvent.click(save);fireEvent.keyDown(input,{key:'Enter'});expect(onSave).not.toHaveBeenCalled();
 expect(input).toHaveAttribute('aria-invalid','true');
});
it('keeps an explicit zero invoice as custom zero',()=>{
 const {input,save,onSave}=mount();fireEvent.change(input,{target:{value:'0'}});expect(save).toBeEnabled();fireEvent.click(save);
 expect(onSave).toHaveBeenCalledWith({kind:'choice',choice:{source:'custom',amount:0,currency:'USD',period:'monthly'}});
});
it('keeps cents and distinguishes invoice currency from budget currency',()=>{
 const {input,save,onSave}=mount({kind:'entry'},'EUR');fireEvent.change(input,{target:{value:'10.25'}});
 const selector=screen.getByRole('group',{name:'Invoice currency'});fireEvent.click(within(selector).getByRole('button',{name:'USD'}));
 expect(screen.getByText(/10\.25.*USD.*8\.80.*EUR/)).toBeVisible();expect(screen.getByText(new RegExp(CURRENCY_RATE_DATE))).toBeVisible();
 fireEvent.click(save);expect(onSave).toHaveBeenCalledWith({kind:'choice',choice:{source:'custom',amount:10.25,currency:'USD',period:'monthly'}});
});
it('divides an annual invoice by twelve without changing the billed total',()=>{
 const {input,save,onSave}=mount();fireEvent.change(input,{target:{value:'120.12'}});fireEvent.click(screen.getByRole('button',{name:'Yearly'}));
 expect(screen.getByText('$10.01/mo',{exact:true})).toBeVisible();fireEvent.click(save);
 expect(onSave).toHaveBeenCalledWith({kind:'choice',choice:{source:'custom',amount:120.12,currency:'USD',period:'annual'}});
});
it('retains seats when reviewing an annual per-user plan',()=>{
 const initial:CostDraft={kind:'choice',choice:{source:'plan',label:'Teams',amount:144,currency:'USD',period:'annual',perSeat:true,seats:5}};
 const {save,onSave}=mount(initial);expect(screen.getByText('$60/mo',{exact:true})).toBeVisible();fireEvent.click(screen.getByRole('button',{name:'One user more'}));
 expect(screen.getByText('$72/mo',{exact:true})).toBeVisible();fireEvent.click(save);expect(onSave).toHaveBeenCalledWith({kind:'choice',choice:{...initial.choice,seats:6}});
});
it('cancels an invoice draft without saving it',()=>{
 const {input,onSave,onCancel}=mount();fireEvent.change(input,{target:{value:'45.80'}});fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
 expect(onCancel).toHaveBeenCalledOnce();expect(onSave).not.toHaveBeenCalled();
});
it('recovers from an invalid intermediate edit without losing its invoice currency',()=>{
 const {input,save,onSave}=mount();fireEvent.change(input,{target:{value:''}});expect(save).toBeDisabled();
 fireEvent.change(input,{target:{value:'1,234.56'}});fireEvent.keyDown(input,{key:'Enter'});
 expect(onSave).toHaveBeenCalledWith({kind:'choice',choice:{source:'custom',amount:1234.56,currency:'USD',period:'monthly'}});
});
it('treats a copied invoice total as a total rather than multiplying the previous seats again',()=>{
 const initial:CostDraft={kind:'choice',choice:{source:'plan',label:'Teams',amount:40,currency:'USD',period:'monthly',perSeat:true,seats:5}};
 const {input,save,onSave}=mount(initial);fireEvent.change(input,{target:{value:'200'}});fireEvent.click(save);
 expect(onSave).toHaveBeenCalledWith({kind:'choice',choice:{source:'custom',amount:200,currency:'USD',period:'monthly'}});
});
it('keeps the invoice currency and amount when the budget display currency changes',()=>{
 const onSave=vi.fn();const props={tool,initial:custom,entryLabel:'$4/mo',currency:'USD' as const,lang:'en' as const,freemium:false,onSave,onCancel:vi.fn()};
 const view=render(<StackCostEditor {...props}/>);view.rerender(<StackCostEditor {...props} currency="EUR"/>);
 expect(screen.getByLabelText('Billed amount')).toHaveValue('19.95');expect(within(screen.getByRole('group',{name:'Invoice currency'})).getByRole('button',{name:'USD'})).toHaveAttribute('aria-pressed','true');
 fireEvent.click(screen.getByRole('button',{name:'Save'}));expect(onSave).toHaveBeenCalledWith(custom);
});
it('accepts a French grouped invoice and preserves its cents',()=>{
 const onSave=vi.fn();render(<StackCostEditor tool={tool} initial={{kind:'entry'}} entryLabel={null} currency="EUR" lang="fr" freemium={false} onSave={onSave} onCancel={vi.fn()}/>);
 fireEvent.change(screen.getByLabelText('Montant facturé'),{target:{value:'1\u202f234,56'}});fireEvent.click(screen.getByRole('button',{name:'Enregistrer'}));
 expect(onSave).toHaveBeenCalledWith({kind:'choice',choice:{source:'custom',amount:1234.56,currency:'EUR',period:'monthly'}});
});
