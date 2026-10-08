import type { ReactNode } from "react";

/**
 * Hauteur animée sans mesure : la grille passe de 0fr à 1fr. Le contenu reste
 * monté (rien n'apparaît d'un coup sous les yeux) et devient inerte une fois
 * replié, pour le clavier et les lecteurs d'écran.
 */
export default function Collapse({ open, children, className = "" }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={`tt-collapse ${className}`} data-open={open || undefined} {...(!open ? { inert: "" } : {})} aria-hidden={!open || undefined}>
      <div className="tt-collapse-inner">{children}</div>
    </div>
  );
}
