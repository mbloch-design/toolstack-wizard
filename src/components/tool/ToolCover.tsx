import ToolLogo from "@/components/ToolLogo";
import Cover from "@/ds/Cover/Cover";
import { useToolCover, type ToolCoverTool } from "@/lib/useToolCover";

/** A tool's cover in the design system: its screenshot, or its logo on the tile. */
export default function ToolCover({ tool, alt, logoSize = 44 }: { tool: ToolCoverTool; alt: string; logoSize?: number }) {
  const { src, loading, imgRef, onLoad, onError } = useToolCover(tool);
  return <Cover src={src} alt={alt} loading={loading} imgRef={imgRef} onLoad={onLoad} onError={onError}
    fallback={<ToolLogo tool={tool} size={logoSize} />} />;
}
