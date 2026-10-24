import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import StackArrival from "./StackArrival";
vi.mock("@/components/Breadcrumb", () => ({ default: () => null }));
vi.mock("@/hooks/useLang", () => ({ useLang: () => ({ t: (fr: string) => fr }) }));
afterEach(() => vi.useRealTimers());
it("shows no amounts or invented tools, and acknowledges a slow response without fake progress", () => {
 vi.useFakeTimers();const view=render(<StackArrival />);
 expect(screen.getByRole('heading')).toHaveTextContent('Ma stack');
 expect(screen.getByRole('status')).toHaveTextContent('On retrouve vos outils');
 expect(view.container.querySelector('[role=progressbar]')).toBeNull();
 expect(view.container.textContent).not.toMatch(/0 ?€|0 outil/);
 act(()=>vi.advanceTimersByTime(8000));
 expect(screen.getByRole('status')).toHaveTextContent('Ça prend un peu plus de temps');
});
it("stops the waiting presentation when an actionable error replaces it", () => {
 const {rerender,container}=render(<StackArrival />);
 rerender(<StackArrival pending={false}><button>Réessayer</button></StackArrival>);
 expect(screen.queryByRole('status')).not.toBeInTheDocument();
 expect(container.querySelector('.ms-arrival-outline')).toBeNull();
 expect(screen.getByRole('button',{name:'Réessayer'})).toBeVisible();
 expect(container.firstChild).toHaveAttribute('aria-busy','false');
});
