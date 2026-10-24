# Stack sign-in loading implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Open Ma stack during sign-in synchronization, with a calm branded loading state and no misleading empty or budget data.
**Architecture:** Keep the existing account coordinator and owner-scoped cache. Route successful default callbacks to Ma stack as soon as identity is known; gate initial stack content there until synchronization resolves. Retain contextual return destinations, draft/conflict choices, errors and recovery behavior. Profile and stack requests already run concurrently; do not add another auth listener or cache.
**Tech Stack:** Existing React, Router, CSS tokens and Supabase SDK.
**Spec:** User approved the preceding recommendations with “fais le”.

## Global constraints
- No fake progress, artificial minimum delay, speculative totals or old-owner content.
- Existing tokens, official ToolTrim pictogram, reduced-motion support, FR/EN.
- Cached content may appear only within the existing account isolation rules; synchronization errors remain actionable.

## Review focus
- Slow initial stack must not show onboarding or zero budget.
- Authentication denial must remain actionable.
- Anonymous draft and CAS conflict must retain explicit choices.
- Contextual return routes must remain intact.
- Account switch and route hydration privacy protections must remain unchanged.

## Tasks
- [x] Add failing browser checks for early Ma stack navigation, branded loading, no empty-state flash, delayed stack and contextual return.
- [x] Add shared loading presentation and initial-content guard; redirect default callbacks once authenticated; preserve choices/errors.
- [x] Check module loading and duplicate calls; prefetch the destination module where useful without starting another session or data request.
- [ ] Run relevant unit/browser checks, inspect rendered loading and arrival, record results and publish verified scope.

## Execution record
- Initial slow OAuth browser tests failed before implementation, then passed with early destination arrival.
- The existing onboarding journeys exposed an unmount during normal autosave; an owner-bound first-sync marker fixes it, and all four original journeys pass.
- Ruling: profile and stack already load concurrently; retain that architecture rather than adding another credential/data cache.
- Ruling: preserve contextual return journeys; only stack destinations can complete authentication presentation before synchronization.
- A reviewer suspected the generic Suspense fallback during slow module loading. An actually held CartPage request disproves it: Router retains the branded callback presentation. No speculative fallback change was made; reviewer withdrew the finding.
- Local tests: application 903, Ma stack 237, accounts 70, build enabled PASS. Visual proof: outputs/production-release-20261024/stack-arrival-new.png outside Git. Remote validation and publication pending.
