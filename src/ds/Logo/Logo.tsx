import { SMALL_MARKS, useToolLogoSource, type LogoTool } from "@/lib/useToolLogoSource";
import styles from "./Logo.module.css";

type LogoProps = {
  tool: LogoTool;
  /** Side of the tile, in pixels. */
  size?: 24 | 32 | 40;
  /** Our own files only (Storybook, visual tests). */
  localOnly?: boolean;
};

/** A tool's logo on its tile. When no file answers, the tile shows the name's first letter. */
export default function Logo({ tool, size = 40, localOnly = false }: LogoProps) {
  const { src, imgRef, loaded, loading, onLoad, onError } = useToolLogoSource(tool, size, !localOnly);
  return (
    <span className={styles.tile} data-size={size} data-small={SMALL_MARKS.has(tool.slug || "") ? "" : undefined}>
      {src ? (
        <img ref={imgRef} key={src} src={src} alt="" width={size} height={size} loading={loading} data-loading={loaded ? undefined : ""} className={styles.image} onLoad={onLoad} onError={onError} />
      ) : (
        <span className={styles.initial} aria-hidden="true">{(tool.name ?? "?").charAt(0).toUpperCase()}</span>
      )}
    </span>
  );
}
