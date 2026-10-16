import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ToolFeaturesBlock from "./ToolFeaturesBlock";

describe("informative feature tags", () => {
  it("renders translated, deduplicated labels without interactive semantics", () => {
    const { container } = render(<ToolFeaturesBlock
      covers={["security-compliance"]}
      functionalNeeds={["security-compliance", "gdpr-processing-register"]}
      toolName="Example"
      t={fr => fr}
    />);
    expect(screen.getAllByText("Conformité et sécurité")).toHaveLength(1);
    expect(screen.getByText("Registre des traitements RGPD")).toBeInTheDocument();
    expect(container.querySelectorAll(".td-feature")).toHaveLength(2);
    expect(container.querySelector("a, button, [role=button], [tabindex]")).toBeNull();
  });
});
