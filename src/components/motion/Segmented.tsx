import type { CSSProperties, ReactNode } from "react";

/**
 * Sélecteur segmenté à pastille glissante : la pastille est un seul élément
 * qui se déplace d'une option à l'autre avec un léger ressort, au lieu de
 * clignoter d'un bouton à l'autre. Taille fixe, rien ne bouge autour.
 */
interface Option<T extends string> { value: T; label: ReactNode; ariaLabel?: string }

export default function Segmented<T extends string>({ options, value, onChange, ariaLabel, className = "" }: {
  options: Option<T>[]; value: T; onChange: (value: T) => void; ariaLabel: string; className?: string;
}) {
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  return (
    <div className={`tt-seg ${className}`} role="group" aria-label={ariaLabel} style={{ "--n": options.length, "--i": index } as CSSProperties}>
      <span className="tt-seg-thumb" aria-hidden="true" />
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={option.value === value} aria-label={option.ariaLabel} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
