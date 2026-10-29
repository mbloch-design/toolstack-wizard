import { createRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { ActionRow, Button, Segmented, TextLink } from "./StackKit";
afterEach(cleanup);
for (const ancestor of ["", "ms-page mf ac-form"]) {
  it(`composes native stack actions, forwarded refs and navigation under ${ancestor || "neutral"}`, () => {
    const ref = createRef<HTMLButtonElement>();
    const act = vi.fn();
    const submit = vi.fn(event => event.preventDefault());
    render(<MemoryRouter><form className={ancestor} onSubmit={submit}>
      <Button ref={ref} onClick={act}>Decide</Button>
      <Button type="submit">Save</Button>
      <TextLink onClick={act}>Reopen</TextLink>
      <TextLink to="/fr/tools">Browse</TextLink>
      <ActionRow lead={<span>Icon</span>} name="Tool" sub="Details" end="10 €" onClick={act} />
    </form></MemoryRouter>);
    expect(ref.current).toBe(screen.getByRole("button", { name: "Decide" }));
    expect(ref.current).toHaveClass("ui-button");
    expect(ref.current).toHaveAttribute("data-appearance", "stack");
    expect(ref.current).toHaveAttribute("data-size", "compact");
    fireEvent.click(ref.current!);
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));
    expect(act).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Reopen" })).toHaveAttribute("data-variant", "quiet");
    expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute("href", "/fr/tools");
    expect(screen.getByRole("button", { name: /Tool Details 10/ })).toHaveClass("ui-action-row");
  });
  it(`uses shared roving focus for stack tabs under ${ancestor || "neutral"}`, () => {
    const change = vi.fn();
    render(<div className={ancestor}><Segmented label="View" value="one" onChange={change} controls="panel" options={[{id:"one",label:"One"},{id:"two",label:"Two"}]} /></div>);
    expect(screen.getByRole("tablist")).toHaveClass("ui-segmented");
    expect(screen.getByRole("tablist")).toHaveAttribute("data-appearance", "stack");
    fireEvent.keyDown(screen.getByRole("tab", { name: "One" }), { key: "End" });
    expect(change).toHaveBeenCalledWith("two");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
  });
}
for (const ancestor of ["", "ms-page mf ac-form"]) {
  it(`forwards an explicit default44 density for actions and destinations under ${ancestor || "neutral"}`, () => {
    render(<MemoryRouter><div className={ancestor}>
      <TextLink size="default" onClick={vi.fn()}>Cancel review</TextLink>
      <TextLink size="default" to="/fr/tools">Read tools</TextLink>
    </div></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Cancel review" })).toHaveAttribute("data-size", "default");
    expect(screen.getByRole("link", { name: "Read tools" })).toHaveAttribute("data-size", "default");
  });
  it(`preserves explicit semantic count tones under ${ancestor || "neutral"}`, () => {
    render(<div className={ancestor}><Segmented mode="toggle" label="Inventory status" value="review" onChange={vi.fn()} options={[
      { id:"review",label:"To check",count:2,countTone:"watch" },
      { id:"overlap",label:"Overlaps",count:3,countTone:"overlap" },
    ]} /></div>);
    expect(screen.getByText("2")).toHaveAttribute("data-tone", "watch");
    expect(screen.getByText("3")).toHaveAttribute("data-tone", "overlap");
  });
}
