---
target: ComparePage /fr/comparatif/[slug]
total_score: 29
p0_count: 0
p1_count: 2
p2_count: 2
timestamp: 2026-05-24T06-57-41Z
slug: src-pages-comparepage-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Spinner fixed; no accessible text label on loading state |
| 2 | Match System / Real World | 3 | Editorial vocabulary correct; nav label "Features" = G2/Capterra vocabulary |
| 3 | User Control and Freedom | 3 | Breadcrumb + sticky nav solid; "Analyser ma stack" CTA appears twice |
| 4 | Consistency and Standards | 3 | Section numbering correct; two h2 elements use inline style={{ marginBottom: 28 }} |
| 5 | Error Prevention | 3 | Editorial not-found state; alt tool graceful fallback |
| 6 | Recognition Rather Than Recall | 3 | Mobile criterion labels added; verdict list (section 03) thin on tool-name context at mobile |
| 7 | Flexibility and Efficiency | 2 | Sticky nav works; no keyboard shortcuts; no "jump to verdict" from hero |
| 8 | Aesthetic and Minimalist Design | 3 | Achromatic, no badges, no ratings; hero has 7 content layers; double CTA violates ToolTrim principle |
| 9 | Error Recovery | 3 | Editorial 404; fallback content system |
| 10 | Help and Documentation | 3 | FAQ + tipping signals; asEnglishCopy no-op means EN dynamic comparisons serve French text |
| **Total** | | **29/40** | **Good — editorially coherent, craft pressure remains** |

## Anti-Patterns Verdict

**LLM assessment:** No AI-slop signals. Section-counter / eyebrow / title / intro stack creates genuine editorial rhythm. Achromatic palette consistent. Minor concern: hero's 7-layer content stack creates "everything at once" density that real editorial sites pace differently.

**Deterministic scan:** CLI detector unavailable. Manual scan: no gradient text, no glassmorphism, no hero-metric template, no border-left accent stripes, no badge proliferation, no identical card grids. Dead anti-pattern components deleted in previous pass. One brand-voice violation: `label: t("Features", "Features")` in navSections at ComparePage.tsx:1485.

## Overall Impression

Structurally sound. Two polish passes removed the worst friction (broken spinner, non-editorial 404, mobile context loss, dead anti-pattern code, wrong schema). What remains: one brand-voice nav label, one i18n architecture gap, and a hero that could breathe more. Highest-leverage remaining fix is the "Features" label — one-line change that removes the most visible contradiction.

## What's Working

1. **Section-counter rhythm.** 01/02/03 counter + eyebrow + title creates genuine editorial cadence. The dark tipping point section correctly acts as visual climax.

2. **Tipping point flow card.** "Par défaut → Bascule si" is the clearest decision affordance on the page. No G2 or Product Hunt page has this.

3. **Graceful content fallback.** Three-tier system (battle JSON → editorial registry → auto-generated fallback) means the page never breaks on unknown slug pairs.

## Priority Issues

**[P1] "Features" nav label is G2/Capterra vocabulary**
- What: navSections at ComparePage.tsx:1485 — label: t("Features", "Features"). Section eyebrow calls it "Critères décisifs"; nav calls it "Features" in both languages.
- Why: "Features" is the exact vocabulary the PRODUCT.md anti-references call out from G2/Capterra. Visible in sticky nav on every scroll.
- Fix: Change to t("Critères", "Criteria") or t("Décision", "Decision"). One line.
- Command: /impeccable clarify

**[P1] asEnglishCopy is a no-op — EN path serves French text**
- What: function asEnglishCopy(value: string): string { return value; } at ComparePage.tsx:363. All dynamic comparisons built from battle JSON serve identical text in FR and EN.
- Why: EN users on /en/comparatif/claude-vs-gemini read French copy. Functional failure of the i18n promise.
- Fix: Architecture problem — battle JSON needs EN fields, or buildBattleEditorialContent needs a language parameter. Scope: significant.
- Command: /impeccable harden then content work

**[P2] Double "Analyser ma stack" CTA**
- What: Appears in hero verdict callout (ComparePage.tsx:1562) and bottom CTA band (ComparePage.tsx:1938). Same URL, same intent.
- Why: PRODUCT.md: "Pas de CTA répétés." Repetition signals commercial pressure; undermines advisor-voice.
- Fix: Remove the CTA from compare-verdict-callout-footer. Keep bottom CTA band only.
- Command: /impeccable clarify

**[P2] Hero density — 7 content layers in a single section**
- What: breadcrumb → eyebrow → H1 → hero-promise → hero-brief → duel cards → verdict callout → microfact. Too much before any section begins.
- Why: Pace collapses. Wirecutter leads with the verdict, then supporting context. This tries to do everything at once.
- Fix: Move verdict callout to first content section, or integrate microfact inside duel cards.
- Command: /impeccable layout

**[P3] Inline style on section headings**
- What: Alternatives and FAQ h2 use style={{ marginBottom: 28 }} at lines 1864, 1905 instead of CSS class.
- Why: Minor consistency failure; breaks responsive override capability.
- Fix: Add cp-section-title--tight modifier to CSS, or remove if base .cp-title handles spacing.
- Command: /impeccable polish

## Persona Red Flags

**Solo Freelance (decision-calm):** Microfact row values ("Notion par défaut pour centraliser") require a second read — compound phrase. Verdict callout above it actually gives a more direct answer. Microfact adds noise at the hero stage.

**EN-language user:** Navigates to /en/comparatif/claude-vs-gemini. Gets the page in French. Complete content block for monolingual English users on any battle-JSON-driven comparison.

## Minor Observations

- cp-hero-duel-vs "VS" is aria-hidden; duel cards use article + h2 for tool names. Landmark structure clean.
- FAQ uses details/summary natively. onToggle syncing to React state for chevron is correct pattern.
- tt-button-light correctly defined as global class (not scoped to .cp-section--tipping). Works in dark tipping section.
- scroll-mt-20 Tailwind class accounts for sticky nav height on section anchors.

## Questions to Consider

- What if the microfact row moved inside the duel, directly below each card's verdict text?
- Is there a one-word French label for "decisive criteria that change the choice" — "Critères" or "Décision"?
- Is there a near-term plan for proper EN translation in battle JSON, or is EN expected to stay French for now?
