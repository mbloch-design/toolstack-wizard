---
name: ToolTrim
description: Verdict éditorial pour choisir les bons outils SaaS — sobre, sans ornement, avec autorité.
colors:
  bg: "#F8F8F4"
  surface: "#FFFFFF"
  surface-soft: "#F1F1EC"
  near-black: "#222222"
  deep-black: "#111111"
  muted: "#6F6F68"
  muted-light: "#9A9A92"
  border: "#DADAD4"
  border-soft: "#E7E7E0"
  border-strong: "#222222"
typography:
  display:
    fontFamily: "Uncut Sans, system-ui, sans-serif"
    fontSize: "clamp(64px, 8vw, 124px)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.07em"
  headline:
    fontFamily: "Uncut Sans, system-ui, sans-serif"
    fontSize: "clamp(44px, 5vw, 76px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.06em"
  title:
    fontFamily: "Uncut Sans, system-ui, sans-serif"
    fontSize: "clamp(28px, 4vw, 40px)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.055em"
  body-large:
    fontFamily: "Inter Tight, Inter, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.5vw, 22px)"
    fontWeight: 400
    lineHeight: 1.42
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter Tight, Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter Tight, Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  default: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "32px"
  pill: "9999px"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  4xl: "96px"
components:
  button-primary:
    backgroundColor: "{colors.near-black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.default}"
    padding: "0 18px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "#3A3A38"
    textColor: "{colors.surface}"
    rounded: "{rounded.default}"
    padding: "0 18px"
    height: "40px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.near-black}"
    rounded: "{rounded.default}"
    padding: "0 18px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.near-black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.default}"
    padding: "0 18px"
    height: "40px"
---

# Design System: ToolTrim

## 1. Overview

**Creative North Star: "Le Conseiller Silencieux"**

ToolTrim's visual system is built around one conviction: the design should disappear so the judgment can speak. Not minimalism as aesthetic posture, but minimalism as discipline — every element that isn't load-bearing gets removed. The result is a surface that feels neither cold nor warm, but *exact*. Like a well-annotated page in a technical report: nothing decorative, everything purposeful.

The palette is essentially achromatic. Warm near-black text on a warm off-white ground, depth achieved entirely through tonal layering rather than shadow or color contrast. Three surface tones (#F8F8F4 → #F1F1EC → #FFFFFF) create hierarchy without noise. The single blue carried in the codebase is a technical residual — not a design choice, not a brand signal. This system trusts monochrome completely.

Typography does all the expressive work. Uncut Sans at extreme scale and tight tracking (-0.07em) creates authority at the display level. Inter Tight handles everything else — lean, functional, legible at 16px. The gap between display and body is large by design: hierarchy by contrast, not by color.

**Key Characteristics:**
- Achromatic in practice: black, warm grey, off-white
- Tonal depth with zero box-shadow on content surfaces
- Uncut Sans for display scale only; Inter Tight owns all content
- Borders as section markers, not decoration
- No gradients, no blurs, no glass effects, no badge multiplication

## 2. Colors: The Achromatic Ground

A near-monochrome system where depth comes from surface layering, not color contrast.

### Primary

- **Near-Black** (#222222): The system's primary text color and button fill. Used for all body text, headings, interactive element fills. Never pure `#000` — the faint warmth prevents harshness.
- **Deep Black** (#111111): Maximum contrast text, used for strong emphasis (`color-text-strong`). Reserved; not a general-purpose color.

### Neutral

- **Warm Editorial Off-White** (#F8F8F4): The page background — the ground everything rests on. Faintly warm, not clinical white.
- **Pure White** (#FFFFFF): Card and panel surfaces. Sits one tonal layer above the background.
- **Warm Light Surface** (#F1F1EC): Secondary surfaces — hover states, muted panels, section fills. The middle tier in the tonal stack.
- **Warm Mid-Grey** (#6F6F68): Metadata, secondary text, subtitles, kicker labels. Perceptible but clearly subordinate.
- **Light Warm Grey** (#9A9A92): Tertiary text — smallest captions, de-emphasized context.
- **Standard Border** (#DADAD4): Section dividers, card borders, input strokes. Visible but not heavy.
- **Soft Border** (#E7E7E0): The lightest structural line — used where borders must exist but shouldn't draw attention.
- **Strong Border** (#222222): Full-weight separator. Reserved for emphasis or inverted context.

### Named Rules

**The Monochrome Commitment Rule.** This system has no accent color. The blue (`hsl(224 76% 50%)`) in the codebase is a technical residual from a previous design pass — its use should be audited and removed over time. Do not introduce new color to fill the void; the void is the point. Restraint is the signal.

**The Tonal Stack Rule.** Depth is encoded in three surface steps: bg (#F8F8F4) → surface-soft (#F1F1EC) → white (#FFFFFF). Use this stack to communicate hierarchy — do not reach for shadow or color to do the same job.

## 3. Typography

**Display Font:** Uncut Sans (with system-ui, sans-serif fallback)
**Body Font:** Inter Tight → Inter (with system-ui, sans-serif fallback)

**Character:** A two-register system built on contrast, not compromise. Uncut Sans at headline scale is bold, tightly tracked, and compressed — an editorial authority voice. Inter Tight everywhere else is exactly that: tight. The two fonts share geometric DNA but play entirely different roles. The display scale is expressive; the body scale is invisible.

### Hierarchy

- **Display** (700, clamp(64px–124px), lh 0.92, ls -0.07em): H1 on compare pages and tool detail heroes. Compressed, commanding. Used once per view.
- **Headline** (700, clamp(44px–76px), lh 0.95, ls -0.06em): Section titles. Same DNA as Display, smaller. Anchors each content block.
- **Title** (600, clamp(28px–40px), lh 0.98, ls -0.055em): CTA band headings, secondary section anchors. The bridge between editorial scale and content scale.
- **Body Large** (400, clamp(18px–22px), lh 1.42, ls -0.02em): Framing copy, introductions, verdict summaries. The primary reading voice on editorial sections.
- **Body** (400, 16px, lh 1.5): Standard prose — all running text, descriptions, explanations. Maximum 65–75ch line length.
- **Label** (700, 11px, lh 1, ls +0.08em, uppercase): Kickers / eyebrow labels above headings. Metadata categories. Never decorative — only used where a label earns its presence.

### Named Rules

**The Display Monopoly Rule.** Uncut Sans is used exclusively at display scale (headlines, section titles, CTA headings). It never appears at body size. Inter Tight owns everything under 26px. Mixing them at comparable scales makes both fonts lose their identity.

**The Tight-Track Hierarchy Rule.** Letter-spacing decreases as text grows: display uses -0.07em, body uses -0.01 to -0.02em, labels use +0.08em (uppercase only). Never apply positive tracking to lowercase text.

## 4. Elevation

ToolTrim uses tonal layering as its sole depth mechanism. There are no content-level shadows. The three-step surface stack (bg → surface-soft → surface) creates all necessary visual hierarchy without introducing the decorative weight of `box-shadow`.

Shadows appear in one context only: floating UI elements detached from the document flow (dropdowns, modals, tooltips, mobile sheets). These are utility shadows — they communicate float, not importance.

### Shadow Vocabulary

- **Floating UI** (`box-shadow: 0 8px 32px rgba(34,34,34,0.08), 0 2px 8px rgba(34,34,34,0.04)`): Dropdowns, command palettes, popovers. Never used on inline cards or content blocks.
- **Modal/Sheet** (`box-shadow: 0 28px 80px rgba(34,34,34,0.08)`): Large overlay panels. One use only.

### Named Rules

**The Flat-By-Default Rule.** Content surfaces are always flat. Borders — not shadows — define card boundaries. If you're tempted to add `box-shadow` to a card, use a `border: 1px solid #DADAD4` instead.

**The Float-Signals-Detachment Rule.** A shadow means the element has left the document flow. If it hasn't left the flow, it doesn't get a shadow.

## 5. Components

### Buttons

Flat, solid, unambiguous. No rounded pill shape, no gradient, no shadow. State changes are pure color inversions.

- **Shape:** Gently squared edges (8px radius)
- **Primary:** Black fill (#222222), white text, 40px height, 18px horizontal padding. `font-size: 13px, font-weight: 600`. Hover: slightly lifted black (#3A3A38).
- **Secondary / Ghost:** Transparent fill, 1.5px black stroke, black text. Hover: inverts to solid black — same as primary. The inversion is deliberate: both buttons converge to the same final state.
- **Transitions:** `background 0.15s ease` only. No scale, no shadow, no translate.

### Kicker Labels

The editorial eyebrow that establishes context before a heading. Always uppercase, always `#6F6F68 / #8D8D86`, always 10–11px at +0.08em tracking. Used sparingly — one per section, never as decoration.

### Cards / Tool Comparison Panels

- **Corner Style:** Gently curved (12–24px radius, from `--tt-radius-sm` to `--tt-radius-lg` depending on panel prominence)
- **Background:** White (#FFFFFF) on the off-white page ground, or surface-soft (#F1F1EC) for muted panels
- **Elevation Strategy:** Tonal only — `border: 1px solid #DADAD4` defines the boundary. No box-shadow on content cards.
- **Internal Padding:** Varies by panel size — compact rows use 12–16px, editorial verdict panels use 24–32px. Rhythm is deliberate; uniform padding everywhere signals laziness.

### Verdict / Recommendation Blocks

ToolTrim's signature component. A direct recommendation anchored with a kicker label above a bold fact-value, followed by supporting body text. Structure: `tt-fact-label` (kicker) → `tt-fact-value` (verdict headline) → `tt-body` or `tt-body-large` (rationale). No icon, no color highlight, no star rating — the verdict earns authority through the quality of the words, not through visual signaling.

### Navigation

- Sticky top bar, 68px height, background #F8F8F4, `border-bottom: 1px solid #DADAD4`
- Logo and nav links left-aligned. CTA button right-aligned (`tt-button-primary`).
- Mobile: collapses to hamburger. No mega-menu, no hover panels.

## 6. Do's and Don'ts

### Do:
- **Do** use tonal layering (surface-soft → white) to create depth. This is the only elevation tool for content surfaces.
- **Do** use `border: 1px solid #DADAD4` as the canonical card boundary. It communicates structure without weight.
- **Do** keep Uncut Sans exclusively at display scale (44px and above). Below that, Inter Tight takes over completely.
- **Do** let whitespace vary deliberately — tighter within a section, generous between sections. `--tt-section-y: clamp(80px, 9vw, 140px)` governs vertical rhythm.
- **Do** lead every verdict section with the decision itself. The judgment precedes the rationale, always.
- **Do** use the `tt-kicker` pattern (uppercase, +0.08em, #6F6F68) as the singular metadata label above headings.
- **Do** write `border-bottom: 1px solid #DADAD4` as section separators — horizontal lines that divide content, not contain it.

### Don't:
- **Don't** add box-shadow to inline cards or content panels. Shadows signal float; if the element isn't floating, it stays flat.
- **Don't** use gradient text (`background-clip: text`). One solid color. Emphasis via weight or scale.
- **Don't** use `border-left` thicker than 1px as a colored accent stripe. Rewrite with a background tint or full border.
- **Don't** create badge proliferation — star ratings, upvote counts, affiliate signals. These are the exact patterns of G2/Capterra and Product Hunt that ToolTrim explicitly rejects.
- **Don't** use the blue accent (`#1E4FCC`) for decorative purposes. It is a technical residual being phased out. When in doubt, use black.
- **Don't** use pastel fills, emojis in UI, or gamification cues. No upvote buttons, no emoji kickers, no progress streak animations — these are Product Hunt patterns.
- **Don't** add three-column feature grids with icon + heading + text. This is the SaaS landing page cliché that ToolTrim exists in opposition to.
- **Don't** repeat CTAs at every scroll position. The trust is earned by judgment quality; aggressive button repetition undermines it.
- **Don't** apply glassmorphism or blur-based layering. This system has no backdrop-filter. Ever.
- **Don't** use identical padding everywhere. Uniform spacing is monotony; rhythm requires variation.
