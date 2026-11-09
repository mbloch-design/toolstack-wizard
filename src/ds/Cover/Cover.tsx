import type { ReactNode, Ref, SyntheticEvent } from "react";
import styles from "./Cover.module.css";

/**
 * The picture of a card: it fills its frame edge to edge. While it loads, a light sheen; without
 * a picture, the fallback (a logo) centred on the tile. The frame gives the ratio, never the cover.
 */
export default function Cover({ src, alt, loading, imgRef, onLoad, onError, fallback }: {
  src?: string; alt: string; loading?: boolean; imgRef?: Ref<HTMLImageElement>;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void; onError?: () => void; fallback: ReactNode;
}) {
  return (
    <span className={styles.cover} data-state={src ? (loading ? "loading" : "ready") : "fallback"}>
      {src
        ? <img ref={imgRef} className={styles.image} src={src} alt={alt} loading="lazy" decoding="async" width={800} height={500} onLoad={onLoad} onError={onError} />
        : <span className={styles.fallback}>{fallback}</span>}
    </span>
  );
}
