# Usage box complete-story acceptance

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Verify the finite states and realistic transitions of the usage box, repair reproduced defects and publish a bounded acceptance record.

**Architecture:** Preserve existing personal-stack persistence and round blue/peach usage controls. Separate pair-review cancellation from budget answers; keep previews tied to tool identity. Preserve the fixed original envelope, permitting internal content scrolling when text needs extra room.

**Tech Stack:** React18, TypeScript, CSS components layer, Vitest, Chromium Playwright with isolated accounts.

**Spec:** docs/MA_STACK_USAGE_ACCEPTANCE.md and docs/DESIGN_SYSTEM.md stable-envelope section.

## Global constraints
- No writes to real user accounts; test fixtures only. No source changes in the primary checkout.
- Original usage height: phone285px/tablet295px/desktop existing230–290px clamp; no content-driven outer growth.
- Humour supplements explicit labels; visible CTA wording must occur in its accessible name.
- Account boundaries, autosave errors and previous decisions remain truthful. No invented savings/suitability.
- Every reproduced defect gets a failing regression before its correction.

## Review focus
- Active tool disappears or changes price/order while a radio has keyboard focus.
- Earlier unanswered tools remain after skipping and finishing the current sequence.
- History opens a saved pair, cancel preserves state and returns focus; mobile target actually opens.
- Large text, short viewports, long names and history must not conceal actions.
- A failed server write or account switch must not lose or leak the answer.

## Task 1: Correct reproduced state, CTA and layout defects
- [x] Independent source/transition audit and independent rendered design audit.
- [x] RED regressions for stale preview, spoken labels and fourth cancellation tile.
- [x] Correct those defects and keyboard context without changing persistence format.
- [x] Prove enlarged-text readability inside the original envelope.
- [x] Unit and relevant browser regressions green.

## Task 2: Close the bounded story matrix and publish
- [x] Verify skip/pause/resume/review/empty/loading/reorder/add/remove states.
- [x] Verify cloud retry and A→B→A account isolation through the actual route.
- [x] Verify FR/EN,320/390/820/desktop/short viewport, keyboard, reduced motion, long history and pair cancel/confirm.
- [x] Record evidence, limits, independent final review, full suite/types/tokens/build.
- [ ] Scoped push; verify production commit, domain and served code separately.
