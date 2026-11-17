import { useId, type ReactNode } from "react";
import styles from "./Chapter.module.css";

/*
 * A chapter of a long page (step 1 bis of the agents section, 17/11/2026): a title (42, 21 on a phone) and a one-line
 * standfirst (21) on the reading column, then its content, reading (720) or wide (1080, three columns). Chapters
 * all sit on the white sheet: the grey of the navigation is never a content background (Michael, 17/11); the rhythm
 * comes from the scale, the gaps and the objects. The title is never inside a container. 96 between chapters (64 on a phone), 24 from title to content, 8 between objects.
 */
export default function Chapter({ id, chapter, tone = "white", title, lead, width = "read", as = "section", children }: {
  /** The anchor (« Voir les étapes ↓ »). */
  id?: string;
  /** What the chapter is, for the content contract (data-chapter). */
  chapter: string;
  /** notes: footnotes under the last chapter (annexes, sources), no title, 48 under it. Never a grey band (17/11). */
  tone?: "white" | "notes";
  /** Absent for a head that draws its own title. */
  title?: string;
  lead?: ReactNode;
  width?: "read" | "wide";
  as?: "section" | "header";
  children: ReactNode;
}) {
  const titleId = useId();
  const Tag = as;
  return (
    <Tag id={id} className={styles.band} data-tone={tone} data-chapter={chapter} aria-labelledby={title ? titleId : undefined}>
      {(title || lead) && (
        <div className={styles.head}>
          {title && <h2 id={titleId} className={styles.title}>{title}</h2>}
          {lead && <p className={styles.lead}>{lead}</p>}
        </div>
      )}
      <div className={styles.body} data-width={width}>{children}</div>
    </Tag>
  );
}

/** The chapters of a page, 96 apart (64 on a phone, the system's chapter gap). */
export function Chapters({ children }: { children: ReactNode }) {
  return <div className={styles.chapters}>{children}</div>;
}
