import { useEffect, useState } from "react";
import MediaCard, { type MediaCardProps } from "@/ds/MediaCard/MediaCard";
import { useToolCover, type ToolCoverTool } from "@/lib/useToolCover";
import type { LogoTool } from "@/lib/useToolLogoSource";
import { useStackPins } from "@/hooks/useStackPins";
import { useAddToStack } from "@/hooks/useAddToStack";

/**
 * The system's media card for a catalogue tool: its screenshot when it has a usable one, otherwise no picture,
 * and the card draws its colour from the tool's logo. A screenshot that fails or is too small drops back too.
 * The round button on the picture adds the tool to my stack (the shared add story: flight, confirmation).
 */
export default function ToolMediaCard({ tool, ...rest }: Omit<MediaCardProps, "image" | "tool" | "add"> & { tool: ToolCoverTool & LogoTool & { slug?: string; id?: string } }) {
  const cover = useToolCover(tool);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const { state, requestAddAccess } = useStackPins();
  const { addToStack, flyingSlug } = useAddToStack();
  const slug = tool.slug || tool.id || "";
  const added = state.pinnedToolSlugs.includes(slug);
  const image = cover.src
    ? <img ref={cover.imgRef} src={cover.src} alt="" width={1200} height={630} loading="lazy" decoding="async" onLoad={cover.onLoad} onError={cover.onError} />
    : undefined;
  return <MediaCard tool={tool} image={image} {...rest}
    add={slug ? { state: flyingSlug === slug ? "pending" : added ? "added" : "idle", disabled: !ready,
      onAdd: (origin) => { if (requestAddAccess()) addToStack(slug, tool.name, { origin, logoFrom: origin }); } } : undefined} />;
}
