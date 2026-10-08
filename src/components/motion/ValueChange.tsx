import { useEffect, useRef, type ReactNode } from "react";

/**
 * Un chiffre qui change : fondu bref vers le haut, ou défilement façon
 * compteur quand on connaît le sens (places + / −). Jamais au premier
 * affichage, jamais d'agrandissement qui ferait bouger la ligne.
 */
export default function ValueChange({ value, children, className = "", direction }: { value: string | number; children: ReactNode; className?: string; direction?: "up" | "down" }) {
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);
  const changed = mounted.current ? ` tt-value--changed${direction ? ` tt-value--${direction}` : ""}` : "";
  return <span key={String(value)} className={`tt-value${changed}${className ? ` ${className}` : ""}`}>{children}</span>;
}
