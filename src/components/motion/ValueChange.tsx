import { useEffect, useRef, type ReactNode } from "react";

/**
 * Un chiffre qui change entre en fondu bref vers le haut, une seule fois, et
 * seulement quand la valeur change : jamais au premier affichage, jamais
 * d'agrandissement qui ferait bouger la ligne.
 */
export default function ValueChange({ value, children, className = "" }: { value: string | number; children: ReactNode; className?: string }) {
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);
  return <span key={String(value)} className={`tt-value${mounted.current ? " tt-value--changed" : ""}${className ? ` ${className}` : ""}`}>{children}</span>;
}
