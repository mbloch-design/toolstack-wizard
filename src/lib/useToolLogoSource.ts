import type { Tool } from "@/data/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { getToolLogoSources } from "@/lib/toolLogos";

export type LogoTool = Pick<Tool, "name"> & Partial<Pick<Tool, "id" | "slug" | "websiteUrl" | "affiliateLink" | "logo">>;

/**
 * A source that hangs instead of failing never fires `onError`, so relying on
 * that event alone leaves the <img> rendered but empty — a blank rounded tile.
 * That is exactly what happened when cdn.simpleicons.org became unreachable.
 * After this delay we give up on the current source and try the next one.
 *
 * A tool with no manual slug/local override can chain through 3-4 sources
 * (simpleicons probe, Google favicon, DuckDuckGo) before landing on the
 * fallback tile — at the old 1500ms this was up to ~6s of visible stall per
 * thumbnail. Real responses measured well under 300ms, so 900ms still gives
 * a genuinely slow-but-working source plenty of room while halving the
 * worst-case wait when a source is actually dead/blocked (ad-blockers
 * commonly target simpleicons.org and gstatic.com).
 */
const SOURCE_TIMEOUT_MS = 900;

/**
 * How long we wait for IntersectionObserver to report before proceeding without
 * it. Generous enough that a genuinely off-screen logo stays untouched while
 * the user reads, short enough that a dead observer cannot strand the image.
 */
const OBSERVER_GRACE_MS = 4000;

/**
 * Optical balance (art direction review, 9 Oct 2026): these marks cover only
 * 7 to 20 % of their square (n8n 0.07, Datawrapper 0.15, Make, Tally and
 * Airtable about 0.2), so with the standard 14 % inner padding they read as
 * specks next to full-bleed icons. They get a thinner padding instead.
 */
export const SMALL_MARKS = new Set(["n8n", "datawrapper", "make", "tally", "airtable", "calendly", "scribe", "chatgpt"]);

/**
 * Which logo file to show for a tool, with no styling: walks the source chain
 * (self-hosted, override, official, badges, SimpleIcons, favicons), gives up on
 * a source that hangs, and waits for the logo to come near the viewport.
 * Used by ToolLogo (site) and by Logo (design system).
 */
export function useToolLogoSource(tool: LogoTool, size: number, allowRemoteSources = true) {
  const sources = useMemo(() => {
    // Ask remote sources for twice the display size: a 42px logo fed a 64px
    // favicon looked soft on Retina screens.
    const wanted = size * 2;
    const candidates = getToolLogoSources(tool, wanted <= 32 ? 32 : wanted <= 64 ? 64 : wanted <= 128 ? 128 : 256);
    return allowRemoteSources
      ? candidates
      : candidates.filter((source) => source.startsWith("/") || source.startsWith("data:"));
  }, [allowRemoteSources, tool, size]);
  const sourceKey = sources.join("|");
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  // Only the visibility safety net may promote a nearby image to eager.
  const [eager, setEager] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const src = sources[sourceIndex];

  useEffect(() => {
    setSourceIndex(0);
    setLoaded(false);
  }, [sourceKey]);

  // The image is lazy-loaded, so the browser may not have requested it yet.
  // Starting the timeout before that would burn through every source while the
  // logo is still off-screen, leaving only the initial. Wait until it is near
  // the viewport — the same moment the browser starts fetching.
  //
  // The observer is an optimisation, never a gate: some environments expose
  // IntersectionObserver but never deliver entries, and gating on it there
  // would disable the fallback entirely and leave blank tiles forever. So we
  // also arm a geometry-based safety net, without fetching off-screen logos.
  useEffect(() => {
    if (inView) return;
    const el = imgRef.current;
    if (!el) return;
    const recoverIfVisible = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200 ||
          rect.right < -200 || rect.left > window.innerWidth + 200) return;
      setEager(true);
      setInView(true);
    };
    const startSafetyNet = () => {
      recoverIfVisible();
      // Capture also handles scrolling inside horizontal shelves.
      window.addEventListener("scroll", recoverIfVisible, { passive: true, capture: true });
      window.addEventListener("resize", recoverIfVisible, { passive: true });
    };
    const observer = typeof IntersectionObserver === "undefined" ? undefined : new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer?.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer?.observe(el);
    const failSafe = observer ? setTimeout(startSafetyNet, OBSERVER_GRACE_MS) : undefined;
    if (!observer) startSafetyNet();
    return () => {
      observer?.disconnect();
      clearTimeout(failSafe);
      window.removeEventListener("scroll", recoverIfVisible, true);
      window.removeEventListener("resize", recoverIfVisible);
    };
  }, [inView, src]);

  useEffect(() => {
    if (!src || loaded || !inView) return;
    // Same-origin and inline sources cannot hang, and a lazy image still
    // off-screen has not been requested yet: timing it out would skip a
    // perfectly good local icon. onError still covers a missing file.
    if (!src.startsWith("http")) return;
    // A cached image can be complete before React attaches onLoad.
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
      return;
    }
    const timer = setTimeout(() => setSourceIndex((index) => index + 1), SOURCE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [src, loaded, inView]);

  return {
    src,
    // What the <img> may actually request. Native lazy loading inside the app's own scroll container
    // fetched logos several screens below the fold (13/11/2026: 84 of 189 image requests on /fr/tools),
    // so a remote file waits until the logo is near view. Same-origin and inline files stay immediate.
    shown: inView || !src?.startsWith("http") ? src : undefined,
    imgRef,
    loaded,
    loading: (eager ? "eager" : "lazy") as "eager" | "lazy",
    onLoad: () => setLoaded(true),
    onError: () => setSourceIndex((index) => index + 1),
  };
}
