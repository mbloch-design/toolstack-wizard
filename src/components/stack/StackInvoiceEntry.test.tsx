import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import StackInvoiceEntry from './StackInvoiceEntry';
import { convertAmount } from '@/lib/currencyRates';

it('preserves the invoice currency and amount while changing the budget display',()=>{
 const onSave=vi.fn(),onPreview=vi.fn();
 const {rerender}=render(<StackInvoiceEntry currency="USD" lang="en" onSave={onSave} onPreview={onPreview}/>);
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'12.50'}});
 rerender(<StackInvoiceEntry currency="EUR" lang="en" onSave={onSave} onPreview={onPreview}/>);
 expect(screen.getByRole('combobox')).toHaveValue('USD');
 expect(screen.getByRole('textbox')).toHaveValue('12.50');
 expect(screen.getByText(/Reference rate 2026-08-27/)).toHaveTextContent('USD → EUR');
 expect(onPreview).toHaveBeenLastCalledWith(convertAmount(12.5,'USD','EUR'));
 fireEvent.click(screen.getByRole('button',{name:'Save'}));
 expect(onSave).toHaveBeenCalledWith(12.5,'USD');
});
it.each(['EUR','USD','GBP'] as const)('saves an explicitly selected %s invoice in its native currency',currency=>{
 const onSave=vi.fn();render(<StackInvoiceEntry currency="USD" lang="fr" onSave={onSave} onPreview={()=>{}}/>);
 fireEvent.change(screen.getByRole('combobox'),{target:{value:currency}});
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'19,95'}});
 fireEvent.submit(screen.getByRole('button',{name:'Enregistrer'}).closest('form')!);
 expect(onSave).toHaveBeenCalledWith(19.95,currency);
});
it.each(['','-1','1e3','0x10','12,3456','invalid'])('blocks invalid quick invoice %s without saving',value=>{
 const onSave=vi.fn();render(<StackInvoiceEntry currency="GBP" lang="en" onSave={onSave} onPreview={()=>{}}/>);
 fireEvent.change(screen.getByRole('textbox'),{target:{value}});
 expect(screen.getByRole('button',{name:'Save'})).toBeDisabled();
 fireEvent.submit(screen.getByRole('button',{name:'Save'}).closest('form')!);
 expect(onSave).not.toHaveBeenCalled();
});
it('accepts explicit zero rather than treating it as an unknown price',()=>{
 const onSave=vi.fn();render(<StackInvoiceEntry currency="USD" lang="en" onSave={onSave} onPreview={()=>{}}/>);
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'0'}});
 fireEvent.click(screen.getByRole('button',{name:'Save'}));expect(onSave).toHaveBeenCalledWith(0,'USD');
});
