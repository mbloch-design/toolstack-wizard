import type { Tool } from "@/data/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { getToolLogoSources } from "@/lib/toolLogos";

type LogoTool = Pick<Tool, "name"> & Partial<Pick<Tool, "id" | "slug" | "websiteUrl" | "affiliateLink" | "logo">>;

interface ToolLogoProps {
  tool: LogoTool;
  size?: number;
  className?: string;
  allowRemoteSources?: boolean;
}

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

const ToolLogo = ({ tool, size = 32, className = "", allowRemoteSources = true }: ToolLogoProps) => {
  const sources = useMemo(() => {
    // Ask remote sources for twice the display size: a 42px logo fed a 64px
    // favicon looked soft on Retina screens.
    const wanted = size * 2;
    const candidates = getToolLogoSources(tool, wanted <= 32 ? 32 : wanted <= 64 ? 64 : 128);
    return allowRemoteSources
      ? candidates
      : candidates.filter((source) => source.startsWith("/") || source.startsWith("data:"));
  }, [allowRemoteSources, tool, size]);
  const sourceKey = sources.join("|");
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  // Set when the grace period ends before the observer fired (e.g. a card
  // scrolled off to the side of a horizontal shelf): the image is then
  // requested eagerly, so the source timeout measures a real download.
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
  // also arm a grace period, after which we proceed regardless.
  useEffect(() => {
    if (inView) return;
    const el = imgRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    const failSafe = setTimeout(() => {
      setEager(true);
      setInView(true);
    }, OBSERVER_GRACE_MS);
    return () => {
      observer.disconnect();
      clearTimeout(failSafe);
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

  if (src) {
    return (
      <img
        ref={imgRef}
        key={src}
        src={src}
        alt={`${tool.name} logo`}
        width={size}
        height={size}
        loading={eager ? "eager" : "lazy"}
        // Styled as a soft tile until the file arrives: a lazy logo not yet
        // loaded otherwise shows as an empty white square.
        data-logo-loading={loaded ? undefined : ""}
        className={`shrink-0 rounded-lg bg-card object-contain ring-1 ring-border/50 ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size, padding: Math.max(2, Math.round(size * 0.14)) }}
        onLoad={() => setLoaded(true)}
        onError={() => setSourceIndex((index) => index + 1)}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-hidden="true"
    >
      {(tool.name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
};

export default ToolLogo;
