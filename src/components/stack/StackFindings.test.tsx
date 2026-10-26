import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import StackFindings from "./StackFindings";
import type { ToolSummary } from "@/hooks/useSupabaseData";
vi.mock("@/components/ToolLogo",()=>({default:()=> <span aria-hidden="true"/>}));
const tool=(id:string,name:string)=>({id,slug:id,name}) as ToolSummary;
const illustrator=tool('illustrator','Adobe Illustrator'),slack=tool('slack','Slack'),canva=tool('canva','Canva');
const change=vi.fn();
function view({pending=false,count=2,other=false,history=false}={}){
 const rows=Array.from({length:count},(_,i)=>({tool:i===0?illustrator:i===1?slack:tool('tool-'+i,'Tool '+i),cost:20,power:i===1?undefined:5,usage:pending&&i===0?undefined:3,setUsage:change,detailHref:'/fr/tool/illustrator',lighter:{alt:canva,cost:9,power:3,href:'/fr/comparatif/illustrator-vs-canva'}}));
 return render(<MemoryRouter><StackFindings lang="fr" total={40} format={n=>`${n} €`} spend={rows.map(row=>({tool:row.tool,amount:row.cost}))} areas={[]} toolCount={count} fit={rows} freeTools={[]} items={other?[{key:'price',kind:'price',tools:[slack],title:'Préciser Slack',detail:'Votre formule',actions:[]}]:[]} history={history ? <span>Baisse estimée : devise inconnue.</span> : undefined} saved={0} toReview={0} resolved={[]} onAddTool={()=>{}} onReviewTools={()=>{}} /></MemoryRouter>);
}
it('ends with a truthful summary and allows reviewing every answer without clearing it',()=>{
 view({count:4});
 expect(screen.getByRole('heading',{name:'Casting au complet.'})).toBeVisible();
 expect(screen.queryByText(/à la bonne taille|marathonien|Puissance non évaluée/)).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Revoir mes usages'}));
 expect(screen.getByRole('heading',{name:'Adobe Illustrator'})).toHaveFocus();
 for(let i=0;i<3;i++) fireEvent.click(screen.getByRole('button',{name:'Suivant'}));
 expect(screen.getByRole('group',{name:'Usage de Tool 3'})).toBeVisible();
 for(let i=0;i<3;i++) fireEvent.click(screen.getByRole('button',{name:'Outil précédent'}));
 const row=screen.getByRole('group',{name:'Usage de Adobe Illustrator'});
 expect(change).not.toHaveBeenCalled();
 expect(within(row).getByRole('radio',{name:'Régulier — Usage régulier'})).toHaveAttribute('aria-checked','true');
 fireEvent.click(within(row).getByRole('radio',{name:'Faible — Usage faible'}));
 expect(change).toHaveBeenCalledWith(1);
});
it('never declares completion while another question remains',()=>{
 view({other:true});
 expect(screen.queryByRole('heading',{name:'Casting au complet.'})).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Revoir mes usages'})).toBeVisible();
});
it('asks with explicit named choices and no catalogue power comparison',()=>{
 view({pending:true});
 expect(screen.getByRole('radio',{name:'Intensif — Usage intensif'})).toBeVisible();
 expect(screen.queryByText(/Puissance|marathonien|bonne taille/)).not.toBeInTheDocument();
});

it('keeps the currency caveat when one tool has no separate usage card',()=>{
 view({count:1,other:true,history:true});
 expect(screen.getByText('Baisse estimée : devise inconnue.')).toBeVisible();
});
