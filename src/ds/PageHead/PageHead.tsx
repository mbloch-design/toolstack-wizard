import type { ReactNode, Ref } from "react";
import Tag from "../Tag/Tag";
import styles from "./PageHead.module.css";

export type PageHeadFact = { label: string; title?: string };
export type PageHeadProps = {
  /** « Bonjour, Michael » : a personal page greets first. */
  greeting?: ReactNode;
  eyebrow?: string;
  title?: string;
  titleRef?: Ref<HTMLHeadingElement>;
  /** The page in one line: « 3 outils · 85,87 €/mois · partiel ». */
  meta?: ReactNode;
  /** One sentence, with a smile. */
  message?: ReactNode;
  /** Short facts as tags: the trade, the value of an hour. */
  facts?: PageHeadFact[];
  /** The rare action, on the right on a wide page, below on a phone. */
  action?: ReactNode;
};

/** The head of a page: greeting, eyebrow, large title, one line of figures, a sentence, a few facts. */
export default function PageHead({ greeting, eyebrow, title, titleRef, meta, message, facts = [], action }: PageHeadProps) {
  return (
    <header className={styles.head} data-pagehead="">
      <div className={styles.intro}>
        {greeting && <p className={styles.text} data-greeting="">{greeting}</p>}
        {(eyebrow || title || meta) && <div className={styles.titles}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          {title && <h1 ref={titleRef} tabIndex={-1} className={styles.title}>{title}</h1>}
          {meta && <p className={styles.note}>{meta}</p>}
        </div>}
        {message && <p className={styles.text} data-welcome-message="">{message}</p>}
        {facts.length > 0 && <p className={styles.facts}>{facts.map((fact) => <Tag key={fact.label} title={fact.title}>{fact.label}</Tag>)}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </header>
  );
}
