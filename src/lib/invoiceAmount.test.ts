import { expect, it } from 'vitest';
import { parseInvoiceAmount } from './invoiceAmount';
it.each([
 ['0','en',0],['0,00','fr',0],['12.50','en',12.5],['12,50','en',12.5],['12,50','fr',12.5],['12.50','fr',12.5],
 ['1,234.56','en',1234.56],['1,234','en',1234],['12,345,678.90','en',12345678.9],
 ['1 234,56','fr',1234.56],['1\u00a0234,56','fr',1234.56],['1\u202f234,56','fr',1234.56],[' 25.10 ','en',25.1],
] as const)('parses invoice %j in %s exactly',(text,lang,value)=>{expect(parseInvoiceAmount(text,lang)).toBe(value)});
it.each(['',' ','-1','+1','1e3','1E3','0x10','NaN','Infinity','1.234','12,34,56','1,23.45','1..2','12.','12,','1\n234','9007199254740991.99'])('rejects unsafe or incomplete input %j',text=>{
 expect(parseInvoiceAmount(text,'en')).toBeNull();expect(parseInvoiceAmount(text,'fr')).toBeNull();
});
it('uses locale to distinguish a thousands group from unsupported decimal precision',()=>{expect(parseInvoiceAmount('1,234','fr')).toBeNull();expect(parseInvoiceAmount('1,234.56','fr')).toBeNull();expect(parseInvoiceAmount('1 234,56','en')).toBeNull()});
