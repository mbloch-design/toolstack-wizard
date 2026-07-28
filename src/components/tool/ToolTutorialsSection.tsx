import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import type { ToolTutorial } from "@/data/toolTutorials";

interface Props {
  tutorials: ToolTutorial[];
  toolName: string;
  lang: string;
  t: (fr: string, en: string) => string;
}

export default function ToolTutorialsSection({ tutorials, toolName, lang, t }: Props) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  if (tutorials.length === 0) return null;

  return (
    <section className="td-tutorials" aria-labelledby="td-tutorials-title">
      <header className="td-tutorials-head">
        <div>
          <span className="td-eyebrow">{t("Tutoriel officiel", "Official tutorial")}</span>
          <h2 id="td-tutorials-title" className="td-title">
            {t(`Prendre en main ${toolName}.`, `Get started with ${toolName}.`)}
          </h2>
        </div>
        <p className="td-tutorials-intro">
          {t(
            "Une démonstration sélectionnée par ToolTrim, publiée par l’éditeur de l’outil.",
            "A demonstration selected by ToolTrim and published by the tool maker.",
          )}
        </p>
      </header>

      <div className="td-tutorials-grid">
        {tutorials.map((tutorial) => {
          const title = lang === "en" ? tutorial.titleEn : tutorial.titleFr;
          const isActive = activeVideoId === tutorial.videoId;
          return (
            <article className="td-tutorial-card" key={tutorial.videoId}>
              <div className="td-tutorial-media">
                {isActive ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${tutorial.videoId}?autoplay=1&rel=0`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <button
                    className="td-tutorial-poster"
                    type="button"
                    onClick={() => setActiveVideoId(tutorial.videoId)}
                    aria-label={t(`Lire la vidéo : ${title}`, `Play video: ${title}`)}
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${tutorial.videoId}/hqdefault.jpg`}
                      alt=""
                      width="480"
                      height="360"
                      loading="lazy"
                    />
                    <span className="td-tutorial-play" aria-hidden="true"><Play /></span>
                    <span className="td-tutorial-duration">{tutorial.duration}</span>
                  </button>
                )}
              </div>
              <div className="td-tutorial-copy">
                <div>
                  <h3>{title}</h3>
                  <p>{tutorial.author} · YouTube</p>
                </div>
                <a href={tutorial.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {t("Voir sur YouTube", "View on YouTube")}
                  <ExternalLink aria-hidden="true" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
      <p className="td-tutorials-privacy">
        {t("Le lecteur YouTube n’est chargé qu’après votre clic.", "The YouTube player loads only after you click.")}
      </p>
    </section>
  );
}
