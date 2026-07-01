// @vitest-environment jsdom

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import DiagStepProfileGoal from "@/components/diagnostic/DiagStepProfileGoal";
import type { SessionState } from "@/types/diagnostic";
import type { Tool } from "@/types/diagnostic";

const t = (_fr: string, en: string) => en;

function session(patch: Partial<SessionState> = {}): SessionState {
  return {
    firstName: "",
    tjm: 0,
    language: "en",
    persona: "THEO",
    complementarySkills: [],
    selectedTools: [],
    discoveryAnswers: new Map(),
    closingAnswers: ["", "", ""],
    ...patch,
  };
}

function tool(id: string, name: string): Tool {
  return {
    id,
    name,
    price: 0,
    category: "creative",
    functional_needs: [],
    tool_type: "metier",
    usage: "medium",
    prescription_quality: "oui",
    force_silence: false,
  };
}

afterEach(cleanup);

describe("creative calibration UX", () => {
  it("moves from creative output to workflow mapping without a personal-details gate", () => {
    const onUpdate = vi.fn();
    const onNext = vi.fn();
    render(
      <DiagStepProfileGoal
        session={session()}
        onUpdate={onUpdate}
        onNext={onNext}
        variant="intro"
        t={t}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Creative/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: /Interfaces and prototypes/ }));

    expect(screen.getAllByText("Photography and retouching")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "I also produce other things" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("3/3")).toBeTruthy();
    expect(screen.queryByText("Two useful details, but optional.")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Map how I work" }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      persona: "SOFIA",
      primarySpecialty: "ui-product",
    }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("opens a one-step creative output editor while preserving the mapped stack", () => {
    render(
      <DiagStepProfileGoal
        session={session({
          persona: "SOFIA",
          primarySpecialty: "three-d",
          stackGoal: "save_time",
        })}
        onUpdate={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        variant="creative-edit"
        t={t}
      />
    );

    expect(screen.getByText("1/1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Update my workflow" })).toBeTruthy();
    expect(screen.queryByText("What do you mostly do day to day?")).toBeNull();
    expect(screen.queryByText("What do you want to improve first?")).toBeNull();
  });

  it("removes tools that only belong to a creative output removed from scope", () => {
    const onUpdate = vi.fn();
    const blender = tool("blender", "Blender");
    const captureOne = tool("capture-one", "Capture One");
    render(
      <DiagStepProfileGoal
        session={session({
          persona: "SOFIA",
          primarySpecialty: "three-d",
          selectedTools: [blender, captureOne],
          toolUsageMap: {
            blender: ["three-d-creation"],
            "capture-one": ["photo-development"],
          },
        })}
        onUpdate={onUpdate}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        variant="creative-edit"
        t={t}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Photography and retouching/ }));
    fireEvent.click(screen.getByRole("button", { name: "Update my workflow" }));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      primarySpecialty: "photo",
      selectedTools: [captureOne],
      toolUsageMap: {
        "capture-one": ["photo-development"],
      },
    }));
  });
});
