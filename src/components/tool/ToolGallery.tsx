import { useState, useCallback } from "react";

interface Props {
  images: string[];
  toolName: string;
}

export default function ToolGallery({ images, toolName }: Props) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());

  const visible = images.filter((_, i) => !failed.has(i));

  const prev = useCallback(() => setActive((i) => (i - 1 + visible.length) % visible.length), [visible.length]);
  const next = useCallback(() => setActive((i) => (i + 1) % visible.length), [visible.length]);

  if (!visible.length) return null;

  const src = visible[active];

  return (
    <div className="tg-viewer" style={{ marginTop: 28 }}>

      {/* Full-width image */}
      <div className="tg-main">
        {/* The first frame is the fiche's hero image and a likely LCP
            element — load it eagerly with high priority instead of lazy,
            which was deferring the fetch until after layout. Later frames
            are user-triggered, so lazy is fine for them. */}
        <img
          key={src}
          src={src}
          alt={`${toolName} — aperçu ${active + 1}`}
          className="tg-main-img"
          loading={active === 0 ? "eager" : "lazy"}
          fetchPriority={active === 0 ? "high" : "auto"}
          onError={() => {
            setFailed((s) => new Set([...s, images.indexOf(src)]));
            if (active >= visible.length - 1) setActive(0);
          }}
        />
        {visible.length > 1 && (
          <>
            <button className="tg-nav tg-nav-prev" onClick={prev} aria-label="Précédent" />
            <button className="tg-nav tg-nav-next" onClick={next} aria-label="Suivant" />
            <span className="tg-counter">{active + 1} / {visible.length}</span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {visible.length > 1 && (
        <div className="tg-thumbs">
          {visible.map((thumbSrc, i) => (
            <button
              key={thumbSrc}
              className={`tg-dot-thumb${i === active ? " tg-dot-thumb--active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Aperçu ${i + 1}`}
              aria-current={i === active}
            >
              <img src={thumbSrc} alt="" className="tg-dot-img" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
