

## Problem

All CTA buttons correctly link to `/fr/selector` (or `/en/selector`). The route exists and renders `SelectorPage.tsx`. But `SelectorPage.tsx` still contains the **old 5-step selector** (1009 lines). The new `DiagnosticRouter` component built in prompts 1-3 was never integrated — it exists but is not rendered anywhere.

## Fix

**1 file modified**: `src/pages/SelectorPage.tsx`

Replace the entire content of `SelectorPage.tsx` with a simple wrapper that renders `DiagnosticRouter`:

```tsx
import DiagnosticRouter from "@/components/DiagnosticRouter";

const SelectorPage = () => <DiagnosticRouter />;
export default SelectorPage;
```

This preserves the existing route (`/:lang/selector`), the `LangLayout` wrapper (Navbar, Footer, LangContext), and swaps in the new diagnostic tunnel.

**No other file changes needed.** The route in `App.tsx` already points to `SelectorPage`, and all CTAs already link to `${prefix}/selector`.

## Risk

The old selector code is fully replaced. If you want to keep it as fallback, I can rename it to `SelectorPageLegacy.tsx` first.

