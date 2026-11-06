import { SMALL_MARKS, useToolLogoSource, type LogoTool } from "@/lib/useToolLogoSource";
import styles from "./Logo.module.css";

type LogoProps = {
  tool: LogoTool;
  /** Side of the tile, in pixels. */
  size?: 24 | 32 | 40;
  /** Our own files only (Storybook, visual tests). */
  localOnly?: boolean;
};

/** Two letters that still say which tool it is: the first two words (Microsoft Dynamics: MD), the capitals of one word (CallTrackingMetrics: CT), or its first two letters (Vercel: Ve). */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  const capitals = (words[0] ?? "").match(/[A-Z]/g) ?? [];
  if (capitals.length > 1) return capitals.slice(0, 2).join("");
  const word = words[0] ?? "?";
  return word.charAt(0).toUpperCase() + word.slice(1, 2);
}

/** A tool's logo on its tile. When no file answers, the tile shows two letters of its name. */
export default function Logo({ tool, size = 40, localOnly = false }: LogoProps) {
  const { src, imgRef, loaded, loading, onLoad, onError } = useToolLogoSource(tool, size, !localOnly);
  return (
    <span className={styles.tile} data-size={size} data-small={SMALL_MARKS.has(tool.slug || "") ? "" : undefined}>
      {src ? (
        <img ref={imgRef} key={src} src={src} alt="" width={size} height={size} loading={loading} data-loading={loaded ? undefined : ""} className={styles.image} onLoad={onLoad} onError={onError} />
      ) : (
        <span className={styles.initial} aria-hidden="true">{initials(tool.name ?? "?")}</span>
      )}
    </span>
  );
}
