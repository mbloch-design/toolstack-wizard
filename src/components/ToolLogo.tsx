import type { Tool } from "@/data/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { getToolLogoSources } from "@/lib/toolLogos";

type LogoTool = Pick<Tool, "name"> & Partial<Pick<Tool, "id" | "slug" | "websiteUrl" | "affiliateLink" | "logo">>;

interface ToolLogoProps {
  tool: LogoTool;
  size?: number;
  className?: string;
}

/**
 * A source that hangs instead of failing never fires `onError`, so relying on
 * that event alone leaves the <img> rendered but empty — a blank rounded tile.
 * That is exactly what happened when cdn.simpleicons.org became unreachable.
 * After this delay we give up on the current source and try the next one.
 */
const SOURCE_TIMEOUT_MS = 1500;

/**
 * How long we wait for IntersectionObserver to report before proceeding without
 * it. Generous enough that a genuinely off-screen logo stays untouched while
 * the user reads, short enough that a dead observer cannot strand the image.
 */
const OBSERVER_GRACE_MS = 4000;

const ToolLogo = ({ tool, size = 32, className = "" }: ToolLogoProps) => {
  const sources = useMemo(() => getToolLogoSources(tool, size <= 32 ? 32 : size <= 64 ? 64 : 128), [tool, size]);
  const sourceKey = sources.join("|");
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
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
    const failSafe = setTimeout(() => setInView(true), OBSERVER_GRACE_MS);
    return () => {
      observer.disconnect();
      clearTimeout(failSafe);
    };
  }, [inView, src]);

  useEffect(() => {
    if (!src || loaded || !inView) return;
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
        loading="lazy"
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
