import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/** Strip a tool detail sub-route suffix so /tool/x and /tool/x/prix share a base. */
const toolBase = (p: string) =>
  p.replace(/\/(prix|pricing|alternatives|avis|reviews|faq)\/?$/, "");

const ScrollToTop = () => {
  const { hash, pathname } = useLocation();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (hash) {
      window.setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ block: "start" });
      }, 0);
      prevPath.current = pathname;
      return;
    }

    // Don't yank to the top when moving between sub-routes of the same tool
    // detail page — the in-page pill nav owns scrolling there.
    const sameToolPage =
      /\/tool\//.test(pathname) && toolBase(prevPath.current) === toolBase(pathname);

    prevPath.current = pathname;
    if (sameToolPage) return;

    window.scrollTo(0, 0);
  }, [hash, pathname]);

  return null;
};

export default ScrollToTop;
