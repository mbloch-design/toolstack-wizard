import { useEffect, useState } from "react";

/**
 * L'attente qui parle (système ToolTrim, `.tt-loadcap`) : sous un reflet de
 * chargement, une phrase polie change toutes les 2,4 s. Figée sur la
 * première quand l'utilisateur réduit les animations.
 */
export default function LoadingCaption({ phrases }: { phrases: string[] }) {
  const [index, setIndex] = useState(0);
  const [swap, setSwap] = useState(false);
  useEffect(() => {
    if (phrases.length < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    let out: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setSwap(true);
      out = setTimeout(() => { setIndex((i) => (i + 1) % phrases.length); setSwap(false); }, 300);
    }, 2400);
    return () => { clearInterval(timer); clearTimeout(out); };
  }, [phrases.length]);
  return <p className="tt-loadcap" data-swap={swap ? "" : undefined} aria-live="off">{phrases[index]}</p>;
}
