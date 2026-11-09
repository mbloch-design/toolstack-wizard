import { createRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button, Field, IconButton, Input, LinkAction, Select, Textarea } from "./Controls";

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

  it("keeps the published comparison destination a native link", () => {
    render(<LinkAction href="/fr/tool/notion" target="_blank" rel="noreferrer">Compare</LinkAction>);
    const link = screen.getByRole("link", { name: "Compare" });
    expect(link).toHaveAttribute("href", "/fr/tool/notion");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });
});
