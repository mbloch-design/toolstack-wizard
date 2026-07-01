import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  toolName: string;
}

export default function ToolGallery({ images, toolName }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const prev = useCallback(() => setLightbox((i) => (i === null ? null : (i - 1 + images.length) % images.length)), [images.length]);
  const next = useCallback(() => setLightbox((i) => (i === null ? null : (i + 1) % images.length)), [images.length]);
  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, close, prev, next]);

  if (!images.length) return null;

  return (
    <>
      {/* ── Strip ── */}
      <div className="tg-strip" role="list" aria-label={`Aperçus de ${toolName}`}>
        {images.map((src, i) => (
          <button
            key={src}
            role="listitem"
            className="tg-thumb"
            onClick={() => setLightbox(i)}
            aria-label={`Voir l'image ${i + 1} de ${images.length}`}
          >
            <img
              src={src}
              alt={`${toolName} — aperçu ${i + 1}`}
              className="tg-thumb-img"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget.closest(".tg-thumb") as HTMLElement | null)?.remove();
              }}
            />
          </button>
        ))}
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div
          className="tg-lb"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={`Image ${lightbox + 1} sur ${images.length}`}
        >
          {/* prev */}
          {images.length > 1 && (
            <button
              className="tg-lb-nav tg-lb-prev"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Image précédente"
            >
              <ChevronLeft style={{ width: 22, height: 22 }} />
            </button>
          )}

          <img
            src={images[lightbox]}
            alt={`${toolName} — aperçu ${lightbox + 1}`}
            className="tg-lb-img"
            onClick={(e) => e.stopPropagation()}
          />

          {/* next */}
          {images.length > 1 && (
            <button
              className="tg-lb-nav tg-lb-next"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Image suivante"
            >
              <ChevronRight style={{ width: 22, height: 22 }} />
            </button>
          )}

          {/* close */}
          <button className="tg-lb-close" onClick={close} aria-label="Fermer">
            <X style={{ width: 18, height: 18 }} />
          </button>

          {/* counter */}
          {images.length > 1 && (
            <span className="tg-lb-count">{lightbox + 1} / {images.length}</span>
          )}
        </div>
      )}
    </>
  );
}
