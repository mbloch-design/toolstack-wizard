import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  toolName: string;
}

export default function ToolGallery({ images, toolName }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [failed, setFailed] = useState<Set<number>>(new Set());

  const visible = images.filter((_, i) => !failed.has(i));

  const prev = useCallback(() => setActive((i) => (i - 1 + visible.length) % visible.length), [visible.length]);
  const next = useCallback(() => setActive((i) => (i + 1) % visible.length), [visible.length]);
  const close = useCallback(() => setLightbox(false), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, close, prev, next]);

  if (!visible.length) return null;

  const src = visible[active];

  return (
    <>
      {/* ── Main viewer ── */}
      <div className="tg-viewer" style={{ marginTop: 28 }}>

        {/* Full-width image */}
        <div className="tg-main" onClick={() => setLightbox(true)}>
          <img
            key={src}
            src={src}
            alt={`${toolName} — aperçu ${active + 1}`}
            className="tg-main-img"
            loading="lazy"
            onError={() => {
              setFailed((s) => new Set([...s, images.indexOf(src)]));
              if (active >= visible.length - 1) setActive(0);
            }}
          />
          <span className="tg-zoom-hint" aria-hidden="true">↗</span>
          {visible.length > 1 && (
            <span className="tg-counter">{active + 1} / {visible.length}</span>
          )}
        </div>

        {/* Thumbnails — only if more than 1 image */}
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

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="tg-lb"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          {visible.length > 1 && (
            <button className="tg-lb-nav tg-lb-prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Précédent">
              <ChevronLeft style={{ width: 22, height: 22 }} />
            </button>
          )}
          <img
            src={src}
            alt={`${toolName} — aperçu ${active + 1}`}
            className="tg-lb-img"
            onClick={(e) => e.stopPropagation()}
          />
          {visible.length > 1 && (
            <button className="tg-lb-nav tg-lb-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Suivant">
              <ChevronRight style={{ width: 22, height: 22 }} />
            </button>
          )}
          <button className="tg-lb-close" onClick={close} aria-label="Fermer">
            <X style={{ width: 18, height: 18 }} />
          </button>
          {visible.length > 1 && (
            <span className="tg-lb-count">{active + 1} / {visible.length}</span>
          )}
        </div>
      )}
    </>
  );
}
