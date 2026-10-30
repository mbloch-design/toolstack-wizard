import { createRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Button, ButtonLink, Field, IconButton, Input, Segmented, Select, Textarea } from "./primitives";

describe("shared neutral controls", () => {
  it("defaults actions to non-submit and blocks activation while loading", () => {
    const activate = vi.fn();
    const { rerender } = render(<Button onClick={activate}>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
    fireEvent.click(screen.getByRole("button"));
    expect(activate).toHaveBeenCalledTimes(1);
    rerender(<Button loading onClick={activate}>Save</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    fireEvent.click(screen.getByRole("button"));
    expect(activate).toHaveBeenCalledTimes(1);
  });

  it("keeps explicit form semantics, variants and accessible icon labels", () => {
    render(<><Button type="submit" variant="primary">Publish</Button><IconButton aria-label="Delete" variant="danger" disabled icon={<svg />} /></>);
    expect(screen.getByRole("button", { name: "Publish" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("button", { name: "Publish" })).toHaveAttribute("data-variant", "primary");
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute("data-variant", "danger");
  });

  it("associates labels, help and errors without discarding caller descriptions or refs", () => {
    const ref = createRef<HTMLInputElement>();
    render(<><p id="external">Existing description</p><Field label="Name" help="Official name" error="Required"><Input ref={ref} aria-describedby="external" /></Field></>);
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveAccessibleDescription("Existing description Official name Required");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(input.getAttribute("aria-errormessage")!)).toHaveTextContent("Required");
    expect(ref.current).toBe(input);
  });

  it("keeps controlled zero and empty values, read-only fields and disabled choices", () => {
    function Form() {
      const [description, setDescription] = useState("");
      return <><Field label="Price"><Input type="number" value={0} readOnly /></Field>
        <Field label="Description"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <Field label="Category"><Select defaultValue="design" disabled><option value="design">Design</option></Select></Field></>;
    }
    render(<Form />);
    expect(screen.getByRole("spinbutton", { name: "Price" })).toHaveValue(0);
    expect(screen.getByRole("spinbutton")).toHaveAttribute("readonly");
    expect(screen.getByRole("combobox", { name: "Category" })).toBeDisabled();
    const textarea = screen.getByRole("textbox", { name: "Description" });
    expect(textarea).toHaveValue("");
    fireEvent.change(textarea, { target: { value: "Updated" } });
    expect(textarea).toHaveValue("Updated");
  });

  it("removes disabled navigation destinations including auxiliary activation", () => {
    const activate = vi.fn();
    render(<MemoryRouter><ButtonLink to="/fr/back-office" disabled onClick={activate}>Edit</ButtonLink></MemoryRouter>);
    const link = screen.getByRole("link", { name: "Edit" });
    expect(link).not.toHaveAttribute("href");
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabindex", "-1");
    fireEvent.click(link);
    fireEvent(link, new MouseEvent("auxclick", { button: 1, bubbles: true, cancelable: true }));
    expect(activate).not.toHaveBeenCalled();
  });

  it("moves tab focus across enabled segments with arrow keys", () => {
    function Tabs() {
      const [value, setValue] = useState("fr");
      return <Segmented label="Language" value={value} onChange={setValue} options={[{ id: "fr", label: "FR" }, { id: "skip", label: "Unavailable", disabled: true }, { id: "en", label: "EN" }]} />;
    }
    render(<Tabs />);
    const first = screen.getByRole("tab", { name: "FR" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "EN" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "EN" })).toHaveAttribute("aria-selected", "true");
    expect(first).toHaveAttribute("tabindex", "-1");
  });
});
