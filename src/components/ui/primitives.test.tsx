import { createRef, useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionRow, Button, ButtonLink, Field, IconButton, Input, PageHeader, Segmented, Select, Surface, Textarea, TextLink, Toolbar } from "./primitives";

afterEach(cleanup);

function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }

describe("shared actions and navigation", () => {
  it("preserves native layout items for composed actions and structured rows", () => {
    render(<><Button style={{ display: "grid", gridTemplateColumns: "auto 1fr" }}><svg aria-hidden="true" data-testid="action-icon" /><span>Continue</span></Button><ActionRow lead={<svg />} name="Subscription" sub="Renews monthly" end="24 €" /></>);
    expect(screen.getByTestId("action-icon").parentElement).toBe(screen.getByRole("button", { name: "Continue" }));
    const row = screen.getByRole("button", { name: /Subscription/ });
    expect(screen.getByText("Subscription").parentElement?.parentElement).toBe(row);
    expect(screen.getByText("24 €").parentElement).toBe(row);
  });
  it("defaults to button and preserves explicit submit and reset semantics", () => {
    const submit = vi.fn((event) => event.preventDefault());
    const reset = vi.fn();
    render(<form onSubmit={submit} onReset={reset}><Button>Ordinary</Button><Button type="submit">Submit</Button><Button type="reset">Reset</Button></form>);
    fireEvent.click(screen.getByText("Ordinary"));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Submit"));
    expect(submit).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Reset"));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it.each([{ disabled: true }, { loading: true }])("suppresses blocked button activation: %j", (state) => {
    const activate = vi.fn();
    const submit = vi.fn((event) => event.preventDefault());
    render(<form onSubmit={submit}><Button type="submit" onClick={activate} {...state}>Publish</Button></form>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(activate).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    if ("loading" in state) expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("forwards native button props and its focusable ref", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref} name="choice" value="accept" aria-pressed="true">Accept</Button>);
    ref.current?.focus();
    expect(ref.current).toHaveFocus();
    expect(ref.current).toHaveAttribute("name", "choice");
    expect(ref.current).toHaveAttribute("value", "accept");
    expect(ref.current).toHaveAttribute("aria-pressed", "true");
  });

  it("renders router navigation as real anchors and keeps modifier activation native", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<MemoryRouter><ButtonLink ref={ref} to="/fr/stack">Stack</ButtonLink><TextLink to="/fr/account" target="_blank" rel="noreferrer">Account</TextLink><Location /></MemoryRouter>);
    expect(ref.current).toHaveAttribute("href", "/fr/stack");
    // Observe native modifier handling before cancelling jsdom's unsupported
    // full-page navigation default at the document boundary.
    const nativeDefault = vi.fn((event: MouseEvent) => {
      expect(event.defaultPrevented).toBe(false);
      event.preventDefault();
    });
    document.addEventListener("click", nativeDefault, { once: true });
    fireEvent.click(ref.current!, { ctrlKey: true });
    expect(nativeDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("location")).toHaveTextContent("/");
    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute("target", "_blank");
    fireEvent.click(ref.current!);
    expect(screen.getByTestId("location")).toHaveTextContent("/fr/stack");
  });

  it.each([ButtonLink, TextLink])("removes blocked navigation destinations and suppresses callbacks", (LinkComponent) => {
    const activate = vi.fn();
    render(<MemoryRouter><LinkComponent to="/publish" loading onClick={activate}>Wait</LinkComponent><Location /></MemoryRouter>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("aria-busy", "true");
    expect(link).not.toHaveAttribute("href");
    expect(link).toHaveAttribute("tabindex", "-1");
    expect(fireEvent.click(link, { ctrlKey: true })).toBe(false);
    expect(fireEvent(link, new MouseEvent("auxclick", { button: 1, bubbles: true, cancelable: true }))).toBe(false);
    expect(activate).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });

  it("suppresses capture-phase activation callbacks on disabled navigation", () => {
    const activate = vi.fn();
    render(<MemoryRouter><ButtonLink to="/publish" disabled onClickCapture={activate} onAuxClickCapture={activate}>Unavailable</ButtonLink></MemoryRouter>);
    const link = screen.getByRole("link");
    fireEvent.click(link);
    fireEvent(link, new MouseEvent("auxclick", { button: 1, bubbles: true, cancelable: true }));
    expect(activate).not.toHaveBeenCalled();
  });

  it.each([{ disabled: true }, { loading: true }])("suppresses keyboard activation in both phases of blocked navigation: %j", (state) => {
    const capture = vi.fn();
    const bubble = vi.fn();
    render(<MemoryRouter><ButtonLink to="/publish" {...state} onKeyDownCapture={capture} onKeyDown={bubble}>Publish</ButtonLink><TextLink to="/settings" {...state} onKeyDownCapture={capture} onKeyDown={bubble}>Settings</TextLink></MemoryRouter>);
    for (const link of screen.getAllByRole("link")) {
      expect(fireEvent.keyDown(link, { key: "Enter" })).toBe(false);
      expect(fireEvent.keyDown(link, { key: " " })).toBe(false);
    }
    expect(capture).not.toHaveBeenCalled();
    expect(bubble).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("link", { name: "Settings" }), { key: "Tab" });
    expect(capture).toHaveBeenCalledTimes(1);
    expect(bubble).toHaveBeenCalledTimes(1);
  });

  it("preserves enabled native key capture and bubble callbacks in order", () => {
    const phases: string[] = [];
    render(<MemoryRouter><TextLink to="/settings" onKeyDownCapture={(event) => phases.push(`capture:${event.key}`)} onKeyDown={(event) => phases.push(`bubble:${event.key}`)}>Settings</TextLink></MemoryRouter>);
    const link = screen.getByRole("link");
    expect(fireEvent.keyDown(link, { key: "Enter" })).toBe(true);
    expect(fireEvent.keyDown(link, { key: " " })).toBe(true);
    expect(phases).toEqual(["capture:Enter", "bubble:Enter", "capture: ", "bubble: "]);
  });

  it("requires an accessible name for icon controls and keeps icons decorative", () => {
    render(<IconButton aria-label="Close editor"><svg data-testid="icon" /></IconButton>);
    expect(screen.getByRole("button", { name: "Close editor" })).toHaveAttribute("type", "button");
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("preserves row button props, ref, activation and loading", () => {
    const ref = createRef<HTMLButtonElement>();
    const activate = vi.fn();
    const { rerender } = render(<ActionRow ref={ref} lead={<svg />} name="Open Notion" sub="Workspace" end="10 €" onClick={activate} />);
    expect(ref.current).toHaveAttribute("type", "button");
    fireEvent.click(ref.current!);
    expect(activate).toHaveBeenCalledTimes(1);
    rerender(<ActionRow ref={ref} name="Open Notion" loading onClick={activate} />);
    fireEvent.click(ref.current!);
    expect(activate).toHaveBeenCalledTimes(1);
  });
});

describe("accessible native fields", () => {
  it("associates label, help, error and existing descriptions without dropping native props", () => {
    const ref = createRef<HTMLInputElement>();
    const change = vi.fn();
    render(<><p id="existing-description">Account policy</p><Field label="Email" help="Use a work email" error="Address missing"><Input ref={ref} id="email" name="email" type="email" required aria-describedby="existing-description" onChange={change} /></Field></>);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toBe(ref.current);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Account policy Use a work email Address missing");
    expect(input).toHaveAttribute("aria-errormessage", screen.getByRole("alert").id);
    fireEvent.change(input, { target: { value: "mike@example.com" } });
    expect(change).toHaveBeenCalledTimes(1);
  });

  it("generates distinct field IDs and removes stale invalid/error state", () => {
    const { rerender } = render(<><Field label="First" error="Missing"><Input /></Field><Field label="Second"><Input /></Field></>);
    expect(screen.getByLabelText("First").id).not.toBe(screen.getByLabelText("Second").id);
    rerender(<><Field label="First" help="Ready"><Input /></Field><Field label="Second"><Input /></Field></>);
    expect(screen.getByLabelText("First")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText("First")).not.toHaveAttribute("aria-errormessage");
    expect(screen.getByLabelText("First")).toHaveAccessibleDescription("Ready");
  });

  it("retains native select and textarea value, disabled and refs", () => {
    const selectRef = createRef<HTMLSelectElement>();
    const textareaRef = createRef<HTMLTextAreaElement>();
    render(<><Field label="Language"><Select ref={selectRef} defaultValue="en" name="language"><option value="fr">French</option><option value="en">English</option></Select></Field><Field label="Notes"><Textarea ref={textareaRef} defaultValue="A note" rows={5} disabled /></Field></>);
    expect(screen.getByLabelText("Language")).toBe(selectRef.current);
    expect(selectRef.current).toHaveValue("en");
    expect(screen.getByLabelText("Notes")).toBe(textareaRef.current);
    expect(textareaRef.current).toHaveValue("A note");
    expect(textareaRef.current).toHaveAttribute("rows", "5");
    expect(textareaRef.current).toBeDisabled();
  });

  it("preserves numeric native field sizes alongside explicit compact controls", () => {
    render(<><Input aria-label="Short code" size={6} /><Select aria-label="Options" size={4} multiple><option>One</option></Select><Input aria-label="Compact" size="compact" /></>);
    expect(screen.getByLabelText("Short code")).toHaveAttribute("size", "6");
    expect(screen.getByLabelText("Options")).toHaveAttribute("size", "4");
    expect(screen.getByLabelText("Options")).toHaveAttribute("multiple");
    expect(screen.getByLabelText("Compact")).not.toHaveAttribute("size");
    expect(screen.getByLabelText("Compact")).toHaveAttribute("data-size", "compact");
  });

  it("retains controlled checkbox checked/change semantics and its ref", () => {
    const ref = createRef<HTMLInputElement>();
    function Checkbox() {
      const [checked, setChecked] = useState(false);
      return <label><Input ref={ref} type="checkbox" name="consent" value="accepted" checked={checked} onChange={(event) => setChecked(event.currentTarget.checked)} />Accept updates</label>;
    }
    render(<Checkbox />);
    const checkbox = screen.getByRole("checkbox", { name: "Accept updates" });
    expect(checkbox).toBe(ref.current);
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveAttribute("name", "consent");
    expect(checkbox).toHaveAttribute("value", "accepted");
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("retains native mutually exclusive radio groups and change callbacks", () => {
    const changed = vi.fn();
    render(<><label><Input type="radio" name="scope" value="personal" defaultChecked onChange={changed} />Personal</label><label><Input type="radio" name="scope" value="team" onChange={changed} />Team</label></>);
    const personal = screen.getByRole("radio", { name: "Personal" });
    const team = screen.getByRole("radio", { name: "Team" });
    expect(personal).toBeChecked();
    fireEvent.click(team);
    expect(team).toBeChecked();
    expect(personal).not.toBeChecked();
    expect(changed).toHaveBeenCalledTimes(1);
  });
});

describe("segmented navigation and filters", () => {
  it("retains status counts independently of tab selection, including zero", () => {
    function StatusTabs() {
      const [value, change] = useState("watch");
      return <Segmented label="Findings" value={value} onChange={change} options={[
        { id: "watch", label: "Review", count: 0, countTone: "watch" },
        { id: "overlap", label: "Overlaps", count: 2, countTone: "overlap" },
      ]} />;
    }
    render(<StatusTabs />);
    expect(screen.getByText("0")).toHaveAttribute("data-tone", "watch");
    expect(screen.getByText("2")).toHaveAttribute("data-tone", "overlap");
    fireEvent.click(screen.getByRole("tab", { name: "Overlaps 2" }));
    expect(screen.getByRole("tab", { name: "Overlaps 2" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("0")).toHaveAttribute("data-tone", "watch");
    expect(screen.getByText("2")).toHaveAttribute("data-tone", "overlap");
  });
  const options = [{ id: "one", label: "One" }, { id: "skip", label: "Unavailable", disabled: true }, { id: "two", label: "Two" }, { id: "three", label: "Three" }];
  function Tabs() {
    const [value, change] = useState("one");
    return <Segmented label="Sections" options={options} value={value} onChange={change} controls="panel" />;
  }
  it("uses one tab stop and arrows/Home/End to select, focus and skip disabled tabs", () => {
    render(<Tabs />);
    const [one, skip, two, three] = screen.getAllByRole("tab");
    expect(one).toHaveAttribute("tabindex", "0");
    expect(two).toHaveAttribute("tabindex", "-1");
    expect(skip).toBeDisabled();
    one.focus();
    fireEvent.keyDown(one, { key: "ArrowRight" });
    expect(two).toHaveFocus();
    expect(two).toHaveAttribute("aria-selected", "true");
    expect(two).toHaveAttribute("aria-controls", "panel");
    fireEvent.keyDown(two, { key: "End" });
    expect(three).toHaveFocus();
    fireEvent.keyDown(three, { key: "ArrowRight" });
    expect(one).toHaveFocus();
    fireEvent.keyDown(one, { key: "ArrowLeft" });
    expect(three).toHaveFocus();
    fireEvent.keyDown(three, { key: "Home" });
    expect(one).toHaveFocus();
  });

  it("keeps toggle filters as independent buttons with pressed state", () => {
    const change = vi.fn();
    render(<Segmented mode="toggle" label="Filters" options={options} value="one" onChange={change} />);
    expect(screen.getByRole("group", { name: "Filters" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "One" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Two" }));
    expect(change).toHaveBeenCalledWith("two");
    fireEvent.click(screen.getByRole("button", { name: "Unavailable" }));
    expect(change).toHaveBeenCalledTimes(1);
  });

  it("provides an initial tab stop when value is empty or unavailable", () => {
    render(<Segmented label="Empty" options={options} value={null} onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("tabindex", "0");
  });
});

it("composes semantic layout and long content without domain ancestors", () => {
  render(<Surface aria-label="Editor"><PageHeader title="A sufficiently long catalogue editor heading" description="Review the changes" actions={<Button>Publish a long translated action label</Button>} /><Toolbar aria-label="Tools"><TextLink to="/help">Help</TextLink></Toolbar></Surface>, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("catalogue editor heading");
  expect(screen.getByRole("button")).toHaveAccessibleName("Publish a long translated action label");
  expect(screen.getByText("Review the changes")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
});
