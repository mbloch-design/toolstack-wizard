import { SMALL_MARKS, useToolLogoSource, type LogoTool } from "@/lib/useToolLogoSource";

interface ToolLogoProps {
  tool: LogoTool;
  size?: number;
  className?: string;
  allowRemoteSources?: boolean;
  /** Empty when the tool's name is printed right next to the logo. */
  alt?: string;
}

const ToolLogo = ({ tool, size = 32, className = "", allowRemoteSources = true, alt }: ToolLogoProps) => {
  const { src, shown, imgRef, loaded, loading, onLoad, onError } = useToolLogoSource(tool, size, allowRemoteSources);

  if (src) {
    return (
      <img
        ref={imgRef}
        key={src}
        src={shown}
        alt={alt ?? `${tool.name} logo`}
        width={size}
        height={size}
        loading={loading}
        // Styled as a soft tile until the file arrives: a lazy logo not yet
        // loaded otherwise shows as an empty white square.
        data-logo-loading={loaded ? undefined : ""}
        className={`shrink-0 rounded-lg bg-card object-contain ring-1 ring-border/50 ${className}`}
        data-tool={tool.slug || undefined}
        style={{ width: size, height: size, minWidth: size, minHeight: size, padding: Math.max(2, Math.round(size * (SMALL_MARKS.has(tool.slug || "") ? 0.05 : 0.14))) }}
        onLoad={onLoad}
        onError={onError}
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
