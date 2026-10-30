import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "@/lib/icons";
import type { ToolTutorial } from "@/data/toolTutorials";

interface Props {
  images: string[];
  imageAlts?: string[];
  videos?: ToolTutorial[];
  toolName: string;
  lang?: "fr" | "en";
  variant?: "default" | "hero";
}

type GalleryItem =
  | { type: "image"; key: string; src: string }
  | { type: "video"; key: string; video: ToolTutorial };

export default function ToolGallery({ images, imageAlts = [], videos = [], toolName, lang = "fr", variant = "default" }: Props) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const items: GalleryItem[] = [
    ...images.map((src) => ({ type: "image" as const, key: `image:${src}`, src })),
    ...videos.map((video) => ({ type: "video" as const, key: `video:${video.videoId}`, video })),
  ];
  const visible = items.filter((item) => item.type === "video" || !failed.has(item.key));

  const select = useCallback((index: number) => {
    setPlayingVideoId(null);
    setActive(index);
  }, []);
  const prev = useCallback(() => select((active - 1 + visible.length) % visible.length), [active, select, visible.length]);
  const next = useCallback(() => select((active + 1) % visible.length), [active, select, visible.length]);

  // Hero track: arrows follow the real scroll position, so swipe, trackpad and buttons stay in sync.
  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setEdges({ start: track.scrollLeft <= 2, end: track.scrollLeft >= max - 2 });
  }, []);
  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges, visible.length]);

  if (!visible.length) return null;

  const safeActive = Math.min(active, visible.length - 1);
  const item = visible[safeActive];

  const renderMedia = (media: GalleryItem, index: number) => media.type === "image" ? (
    <img
      key={media.key}
      src={media.src}
      alt={imageAlts[index] || (lang === "en" ? `${toolName}, preview ${index + 1}` : `${toolName}, aperçu ${index + 1}`)}
      className="tg-main-img"
      loading={index === 0 ? "eager" : "lazy"}
      {...{ fetchpriority: index === 0 ? "high" : "auto" }}
      onError={() => {
        setFailed((current) => new Set([...current, media.key]));
        setActive(0);
      }}
    />
  ) : playingVideoId === media.video.videoId && media.video.provider === 'native' ? (
    <video key={media.key} className="tg-main-video" src={media.video.videoUrl}
      poster={media.video.posterUrl} controls autoPlay playsInline preload="metadata"
      aria-label={lang === 'en' ? media.video.titleEn : media.video.titleFr} />
  ) : playingVideoId === media.video.videoId ? (
    <iframe
      key={media.key}
      className="tg-main-video"
      src={media.video.provider === 'wistia'
        ? `https://fast.wistia.net/embed/iframe/${media.video.videoId}?autoPlay=true`
        : `https://www.youtube-nocookie.com/embed/${media.video.videoId}?autoplay=1&rel=0`}
      title={lang === "en" ? media.video.titleEn : media.video.titleFr}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  ) : (
    <button
      key={media.key}
      type="button"
      className="tg-video-poster"
      onClick={() => setPlayingVideoId(media.video.videoId)}
      aria-label={lang === "en" ? `Play video: ${media.video.titleEn}` : `Lire la vidéo : ${media.video.titleFr}`}
    >
      <img src={media.video.posterUrl || `https://i.ytimg.com/vi/${media.video.videoId}/hqdefault.jpg`} alt="" />
      <span className="tg-video-play"><Play aria-hidden fill="currentColor" /></span>
      <span className="tg-video-caption"><strong>{lang === "en" ? media.video.titleEn : media.video.titleFr}</strong><small>{media.video.duration}</small></span>
    </button>
  );

  if (variant === "hero") {
    const scrollPage = (direction: 1 | -1) => {
      const track = trackRef.current;
      if (!track) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollBy({ left: direction * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
    };
    const scrollable = !(edges.start && edges.end);

    return (
      <div className={`tg-viewer tg-viewer--hero${scrollable ? " is-scrollable" : ""}`}>
        <div
          ref={trackRef}
          className={`tg-hero-grid${visible.length === 1 ? " tg-hero-grid--single" : ""}`}
          onScroll={updateEdges}
          tabIndex={scrollable ? 0 : undefined}
          role="group"
          aria-label={lang === "en" ? `${toolName} media` : `Médias ${toolName}`}
        >
          {visible.map((media, index) => (
            <div className="tg-hero-cell" key={media.key}>
              {renderMedia(media, index)}
            </div>
          ))}
        </div>
        {scrollable && (
          <div className="tg-hero-controls">
            <button type="button" className="tg-hero-arrow" onClick={() => scrollPage(-1)} disabled={edges.start} aria-label={lang === "en" ? "Previous media" : "Médias précédents"}>
              <ChevronLeft aria-hidden />
            </button>
            <button type="button" className="tg-hero-arrow" onClick={() => scrollPage(1)} disabled={edges.end} aria-label={lang === "en" ? "Next media" : "Médias suivants"}>
              <ChevronRight aria-hidden />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tg-viewer">

      <div className="tg-main">
        {renderMedia(item, safeActive)}
        {visible.length > 1 && (
          <>
            <button type="button" className="tg-nav tg-nav-prev" onClick={prev} aria-label={lang === "en" ? "Previous" : "Précédent"} />
            <button type="button" className="tg-nav tg-nav-next" onClick={next} aria-label={lang === "en" ? "Next" : "Suivant"} />
            <span className="tg-counter">{safeActive + 1} / {visible.length}</span>
          </>
        )}
      </div>

      {visible.length > 1 && (
        <div className="tg-thumbs">
          {visible.map((thumb, i) => (
            <button
              type="button"
              key={thumb.key}
              className={`tg-dot-thumb${i === safeActive ? " tg-dot-thumb--active" : ""}`}
              onClick={() => select(i)}
              aria-label={lang === "en" ? `Show media ${i + 1} of ${visible.length}` : `Afficher le média ${i + 1} sur ${visible.length}`}
              aria-current={i === safeActive ? "true" : undefined}
            >
              <img
                src={thumb.type === "image" ? thumb.src : thumb.video.posterUrl || `https://i.ytimg.com/vi/${thumb.video.videoId}/mqdefault.jpg`}
                alt=""
                className="tg-dot-img"
              />
              {thumb.type === "video" && <Play className="tg-dot-play" aria-hidden fill="currentColor" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
