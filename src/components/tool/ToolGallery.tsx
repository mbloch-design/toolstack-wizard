import { useState, useCallback } from "react";
import { Play } from "@/lib/icons";
import type { ToolTutorial } from "@/data/toolTutorials";

interface Props {
  images: string[];
  videos?: ToolTutorial[];
  toolName: string;
  lang?: "fr" | "en";
  variant?: "default" | "hero";
}

type GalleryItem =
  | { type: "image"; key: string; src: string }
  | { type: "video"; key: string; video: ToolTutorial };

export default function ToolGallery({ images, videos = [], toolName, lang = "fr", variant = "default" }: Props) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

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

  if (!visible.length) return null;

  const safeActive = Math.min(active, visible.length - 1);
  const item = visible[safeActive];
  const heroPageStart = Math.floor(safeActive / 2) * 2;
  const heroItems = visible.slice(heroPageStart, heroPageStart + 2);
  const heroPageCount = Math.ceil(visible.length / 2);
  const heroPage = Math.floor(heroPageStart / 2) + 1;

  const renderMedia = (media: GalleryItem, index: number) => media.type === "image" ? (
    <img
      key={media.key}
      src={media.src}
      alt={lang === "en" ? `${toolName}, preview ${index + 1}` : `${toolName}, aperçu ${index + 1}`}
      className="tg-main-img"
      loading={index === 0 ? "eager" : "lazy"}
      fetchpriority={index === 0 ? "high" : "auto"}
      onError={() => {
        setFailed((current) => new Set([...current, media.key]));
        setActive(0);
      }}
    />
  ) : playingVideoId === media.video.videoId ? (
    <iframe
      key={media.key}
      className="tg-main-video"
      src={`https://www.youtube-nocookie.com/embed/${media.video.videoId}?autoplay=1&rel=0`}
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
      <img src={`https://i.ytimg.com/vi/${media.video.videoId}/hqdefault.jpg`} alt="" />
      <span className="tg-video-play"><Play aria-hidden fill="currentColor" /></span>
      <span className="tg-video-caption"><strong>{lang === "en" ? media.video.titleEn : media.video.titleFr}</strong><small>{media.video.duration}</small></span>
    </button>
  );

  if (variant === "hero") {
    const previousPage = () => select(heroPageStart > 0 ? heroPageStart - 2 : Math.max(0, (heroPageCount - 1) * 2));
    const nextPage = () => select(heroPageStart + 2 < visible.length ? heroPageStart + 2 : 0);

    return (
      <div className="tg-viewer tg-viewer--hero">
        <div className={`tg-hero-grid${heroItems.length === 1 ? " tg-hero-grid--single" : ""}`}>
          {heroItems.map((media, index) => (
            <div className="tg-hero-cell" key={media.key}>
              {renderMedia(media, heroPageStart + index)}
            </div>
          ))}
        </div>
        {heroPageCount > 1 && (
          <>
            <button type="button" className="tg-nav tg-nav-prev" onClick={previousPage} aria-label={lang === "en" ? "Previous media" : "Médias précédents"} />
            <button type="button" className="tg-nav tg-nav-next" onClick={nextPage} aria-label={lang === "en" ? "Next media" : "Médias suivants"} />
            <span className="tg-counter">{heroPage} / {heroPageCount}</span>
          </>
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
              aria-label={`Aperçu ${i + 1}`}
              aria-current={i === safeActive}
            >
              <img
                src={thumb.type === "image" ? thumb.src : `https://i.ytimg.com/vi/${thumb.video.videoId}/mqdefault.jpg`}
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
