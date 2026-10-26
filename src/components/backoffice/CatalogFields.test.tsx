import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CatalogField } from "./CatalogFields";
it("creates a structured billing warning when the existing list is empty", () => {
  const change = vi.fn();
  render(
    <CatalogField
      field="billingTraps"
      path={["verdict", "billingTraps"]}
      value={[]}
      onChange={change}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Ajouter : Points de vigilance" }),
  );
  expect(change).toHaveBeenCalledWith([{ title: "", text: "" }]);
});
it("offers explicit structured initialization for missing verified prices instead of an invalid text input", () => {
  const change = vi.fn();
  render(<CatalogField field="pricing_v5" value={null} onChange={change} />);
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Créer les champs structurés" }),
  );
  expect(change).toHaveBeenCalledWith({
    official_source_url: "",
    verified_on: "",
    plans: [],
  });
});
it("preserves a legacy string pricing summary until the administrator explicitly replaces it", () => {
  const change = vi.fn();
  render(
    <CatalogField field="pricing" value="Ancien tarif" onChange={change} />,
  );
  expect(screen.getByText("Ancien tarif")).toBeVisible();
  expect(change).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Créer les champs structurés" }),
  );
  expect(change).toHaveBeenCalledWith({ free: "", paid: "" });
});
