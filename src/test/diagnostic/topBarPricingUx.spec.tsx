// @vitest-environment jsdom

import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DiagTopBar from "@/components/diagnostic/DiagTopBar";
import type { SessionState, Tool } from "@/types/diagnostic";

const t = (_fr: string, en: string) => en;

function tool(patch: Partial<Tool> = {}): Tool {
  return {
    id: "adobe-photoshop",
    name: "Adobe Photoshop",
    price: 26,
    category: "creative",
    functional_needs: ["retouche-photo"],
    tool_type: "metier",
    usage: "medium",
    prescription_quality: "oui",
    force_silence: false,
    selectedOffer: "unknown",
    selectedPriceIsEstimate: true,
    ...patch,
  };
}

function session(patch: Partial<SessionState> = {}): SessionState {
  return {
    firstName: "",
    tjm: 0,
    language: "en",
    persona: "SOFIA",
    complementarySkills: [],
    selectedTools: [tool()],
    discoveryAnswers: new Map(),
    closingAnswers: ["", "", ""],
    ...patch,
  };
}

afterEach(cleanup);

describe("diagnostic top bar pricing", () => {
  it("does not present catalog estimates as a reliable monthly total", () => {
    render(
      <MemoryRouter>
        <DiagTopBar session={session()} step={1} totalSteps={5} t={t} />
      </MemoryRouter>
    );

    expect(screen.getByText("access to clarify")).toBeTruthy();
    expect(screen.queryByText(/26.*mo/)).toBeNull();
  });

  it("shows the grouped contract total once access is confirmed", () => {
    render(
      <MemoryRouter>
        <DiagTopBar
          session={session({
            selectedTools: [tool({
              price: 0,
              selectedOffer: "included",
              selectedPriceIsEstimate: false,
              includedInBundle: true,
              commercialContractId: "contract-adobe",
            })],
            commercialContracts: [{
              id: "contract-adobe",
              familyId: "adobe",
              familyName: "Adobe",
              accessMode: "suite",
              payer: "self",
              productIds: ["adobe-photoshop"],
              monthlyPrice: 70,
              currency: "EUR",
              confirmed: true,
            }],
          })}
          step={1}
          totalSteps={5}
          t={t}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText("access to clarify")).toBeNull();
    expect(screen.getByText(/70.*mo/)).toBeTruthy();
  });

});
