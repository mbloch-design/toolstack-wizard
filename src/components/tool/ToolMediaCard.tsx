import { useEffect, useState } from "react";
import MediaCard, { type MediaCardProps } from "@/ds/MediaCard/MediaCard";
import { CARD_THUMBS_ORIGIN, useToolCover, type ToolCoverTool } from "@/lib/useToolCover";

// Open the connection to the thumbnails' host as soon as a catalogue card exists, before the first image asks.
if (typeof document !== "undefined" && CARD_THUMBS_ORIGIN && !document.querySelector(`link[rel="preconnect"][href="${CARD_THUMBS_ORIGIN}"]`)) {
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = CARD_THUMBS_ORIGIN;
  document.head.appendChild(link);
}
import type { LogoTool } from "@/lib/useToolLogoSource";
import { useStackPins } from "@/hooks/useStackPins";
import { useAddToStack } from "@/hooks/useAddToStack";

/**
 * The system's media card for a catalogue tool: its screenshot when it has a usable one, otherwise no picture,
 * and the card draws its colour from the tool's logo. A screenshot that fails or is too small drops back too.
 * The round button on the picture adds the tool to my stack (the shared add story: flight, confirmation).
 */
export default function ToolMediaCard({ tool, priority = false, ...rest }: Omit<MediaCardProps, "image" | "glow" | "tool" | "add"> & { tool: ToolCoverTool & LogoTool & { slug?: string; id?: string };
  /** The first cards in view: loaded at once and first, not lazily (the page's first impression). */
  priority?: boolean }) {
  const cover = useToolCover(tool);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const { state, requestAddAccess } = useStackPins();
  const { addToStack, flyingSlug } = useAddToStack();
  const slug = tool.slug || tool.id || "";
  const added = state.pinnedToolSlugs.includes(slug);
  const image = cover.src
    ? <img ref={cover.imgRef} src={cover.src} srcSet={cover.srcSmall ? `${cover.srcSmall} 360w, ${cover.src} 720w` : undefined}
        sizes={cover.srcSmall ? "(max-width: 767px) 92vw, 360px" : undefined} alt="" width={1200} height={630} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" data-loading={cover.loading ? "" : undefined} onLoad={cover.onLoad} onError={cover.onError} />
    : undefined;
  // The glow is drawn at an eighth of its size: the small file, no handlers (the crisp picture owns load and error).
  const glow = cover.src ? <img src={cover.srcSmall ?? cover.src} alt="" width={360} height={189} loading="lazy" decoding="async" /> : undefined;
  return <MediaCard tool={tool} image={image} glow={glow} {...rest}
    add={slug ? { state: flyingSlug === slug ? "pending" : added ? "added" : "idle", disabled: !ready,
      onAdd: (origin) => { if (requestAddAccess()) addToStack(slug, tool.name, { origin, logoFrom: origin }); } } : undefined} />;
}
