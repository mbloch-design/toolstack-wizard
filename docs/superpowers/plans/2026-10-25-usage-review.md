# Stable usage review implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Restore the original compact usage card and keep its outer height unchanged throughout answering, revisiting, editing, and history, with useful playful feedback.

**Architecture:** Keep StackUsageReview and the existing personal-stack store. One active tool occupies a reserved scene; changes save immediately, explicit navigation moves between tools, and summary/history replace the scene instead of extending the card. Remove content-sized overrides on the bento rows.

**Tech Stack:** React 18, TypeScript, existing Iconoir icons, CSS component layer, Vitest, Playwright.

**Spec:** docs/DESIGN_SYSTEM.md, “Usage review: stable envelope”.

## Global constraints
- Preserve the original desktop row-two height: clamp(230px, calc((100svh - 220px) * .44), 290px); keep a compact constant envelope at mobile breakpoints.
- No content-dependent outer height, including long names, history, empty state, edited answers and completion.
- Use the current store; no new persistence format, auth work or inferred suitability/savings.
- Explicit understandable levels remain; humour is supplementary, kind and translated FR/EN.
- Radio controls support arrows/Home/End, keyboard focus remains predictable, and reduced motion removes decorative movement.
- Preserve the blue/peach pair decision already published.

## Review focus
- Selecting an answer must not replace the focused tool unexpectedly; advancing is explicit.
- Removing a tool or switching account must not apply an answer to another tool.
- Five hit targets remain usable on 320px screens; labels and jokes fit reserved slots.
- Reopening prior pair decisions preserves their answers until confirmed and returns to the same history view.
- Question, feedback, summary and correction have identical bounding heights at each viewport, including after reload.

## Task 1: Usage scene and navigation
**Files:** src/components/stack/StackUsageReview.tsx; new neighbouring StackUsageReview.test.tsx; src/index.css.
- [x] Write failing tests for answer-in-place, next/previous, reviewing an answer, completion, no paid tools and row removal.
- [x] Run tests and confirm the missing behaviours.
- [x] Implement one-tool state and native radio keyboard navigation, preserving autosave.
- [x] Replace oversized copy and vertical choices with a five round icon choices and a fixed feedback slot.
- [x] Restore fixed outer dimensions; overflow is contained in the history scene, not the card.
- [x] Run targeted and full tests, typecheck and design-token check.

## Task 2: Complete journey and height contract
**Files:** e2e/account-experience.spec.ts; docs/DESIGN_SYSTEM.md; docs/CHANGELOG_AI.md.
- [x] Update existing completion/review journeys for explicit navigation.
- [x] Test bounding height invariance for question, hover, saved answer, next, summary, editing and history in FR/EN at desktop/mobile widths.
- [x] Test keyboard/reduced motion and many tools/long names; capture actual routes.
- [x] Run the relevant authenticated journeys, build and review the final diff.
- [x] Commit/push the scoped correction and verify publication separately from GitHub.
