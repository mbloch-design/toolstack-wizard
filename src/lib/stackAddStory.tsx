import { toast } from "sonner";

/**
 * Add-to-stack story, shared by every "add to my stack" control of the site:
 * the clicked button releases a bookmark token that arcs to the visible
 * "Ma stack" target and is absorbed by it, the stack updates on landing
 * (counter roll + target bump), then a dark confirmation pill offers Undo and
 * View. Timings and easings are design tokens (--stack-add-* in index.css).
 */

const TARGET_SELECTORS = [
  ".ex-tag-filter.is-pinned .ex-filter-stack-icon",
  ".asv2-topbar-cta-icon",
  ".nav-audit-btn",
];

function cssNumber(name: string, fallback: number) {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

function isVisible(element: Element | null): element is HTMLElement {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return rect.width > 0 && rect.bottom > 0 && style.visibility !== "hidden" && Number(style.opacity) > .5;
}

/** First visible logo image inside the origin, for the confirmation pill. */
export function findStackLogo(origin?: Element | null) {
  const logo = origin?.querySelector<HTMLImageElement>(
    "img.ex-card-logo, .ex-card-logo img, img.ex-tool-focus-logo, .ex-tool-focus-logo img, img[alt$=' logo'], img[alt$=' logo ']",
  );
  return logo?.currentSrc || logo?.src || "";
}

/**
 * Runs the flight from the clicked button to the visible "Ma stack" target,
 * then calls `onLand`. The button releases a small dark bookmark token that
 * arcs to the target and is absorbed by it: the target squashes as the token
 * lands, then springs back while its counter rolls. Without motion (reduced
 * motion, no visible target, hidden page, tests) `onLand` runs at once.
 */
export function flyToStack(origin: Element | null | undefined, onLand: () => void, imageSrc = "") {
  const reduce = typeof window.matchMedia !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const target = TARGET_SELECTORS.map((selector) => document.querySelector(selector)).find(isVisible);
  if (reduce || !target || !origin || document.visibilityState !== "visible" || typeof requestAnimationFrame !== "function") {
    onLand();
    return;
  }
  const from = origin.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width === 0) { onLand(); return; }
  const size = cssNumber("--stack-add-token-size", 40);
  const pop = cssNumber("--stack-add-gather", 220);
  const travel = cssNumber("--stack-add-travel", 640);
  const ghost = document.createElement("div");
  ghost.className = "stack-fly-ghost";
  // The token carries the tool itself (its logo); the bookmark glyph is the
  // fallback when no logo is available.
  if (imageSrc) {
    const image = document.createElement("img");
    image.src = imageSrc;
    image.alt = "";
    ghost.classList.add("stack-fly-ghost--logo");
    ghost.appendChild(image);
  } else {
    const glyph = origin.querySelector("svg")?.cloneNode(true) as SVGElement | undefined;
    if (glyph) { glyph.removeAttribute("class"); ghost.appendChild(glyph); }
  }
  Object.assign(ghost.style, { height: `${size}px`, width: `${size}px` });
  document.body.appendChild(ghost);

  const p0 = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
  const p2 = { x: to.left + to.width / 2, y: to.top + to.height / 2 };
  const lift = Math.min(200, 70 + Math.hypot(p2.x - p0.x, p2.y - p0.y) * .22);
  const p1 = { x: p0.x + (p2.x - p0.x) * .3, y: Math.min(p0.y, p2.y) - lift };
  const endScale = Math.max(.35, Math.min(to.width, to.height) / size);
  const easeOutBack = (x: number) => 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2;
  // Fast start, long gentle arrival: the token is thrown, then glides in.
  const easeOutQuart = (x: number) => 1 - (1 - x) ** 4;
  const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
  const start = performance.now();
  let absorbed = false;
  // The add must never depend on the animation: if frames stop (tab hidden
  // mid-flight), a timer lands it anyway and the token is cleared.
  let landed = false;
  const land = () => {
    if (landed) return;
    landed = true;
    window.clearTimeout(safety);
    onLand();
  };
  const safety = window.setTimeout(() => { ghost.remove(); land(); }, pop + travel + 400);

  const frame = (now: number) => {
    const elapsed = now - start;
    if (landed) { ghost.remove(); return; }
    if (elapsed < pop) {
      // Released by the button: grows out of it with a spring.
      const k = easeOutBack(elapsed / pop);
      ghost.style.transform = `translate(${p0.x - size / 2}px, ${p0.y - size / 2 - 6 * k}px) scale(${Math.max(.2, k)})`;
      requestAnimationFrame(frame);
      return;
    }
    const t = Math.min(1, (elapsed - pop) / travel);
    const e = .55 * easeOutQuart(t) + .45 * easeInOutSine(t);
    const x = (1 - e) ** 2 * p0.x + 2 * (1 - e) * e * p1.x + e ** 2 * (p2.x);
    const y = (1 - e) ** 2 * (p0.y - 6) + 2 * (1 - e) * e * p1.y + e ** 2 * p2.y;
    const scale = 1 + (endScale - 1) * easeInOutSine(t);
    ghost.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px) scale(${scale})`;
    // The target braces just before contact, so the landing reads as caught.
    if (!absorbed && t > .86) {
      absorbed = true;
      target.animate([
        { transform: "scale(1)" }, { transform: "scale(.82)", offset: .3 }, { transform: "scale(1.18)", offset: .65 }, { transform: "scale(1)" },
      ], { duration: cssNumber("--stack-add-bump", 520), easing: "cubic-bezier(.34,1.56,.64,1)" });
    }
    if (landed) { ghost.remove(); return; }
    if (t < 1) { requestAnimationFrame(frame); return; }
    // Merge: the token shrinks into the target in one last frame burst.
    ghost.animate([
      { transform: ghost.style.transform, opacity: 1 },
      { transform: `translate(${p2.x - size / 2}px, ${p2.y - size / 2}px) scale(${endScale * .4})`, opacity: 0 },
    ], { duration: 140, easing: "ease-in", fill: "forwards" }).onfinish = () => ghost.remove();
    land();
  };
  requestAnimationFrame(frame);
}

interface StackToastOptions {
  name: string;
  logoSrc?: string;
  addedLabel: string;
  undoLabel: string;
  viewLabel: string;
  onUndo: () => void;
  onView: () => void;
}

/** Dark confirmation pill. Rendered by the global Toaster, outside the
 *  router and page providers: plain elements only, no <Link>. */
export function showStackAddedToast({ name, logoSrc, addedLabel, undoLabel, viewLabel, onUndo, onView }: StackToastOptions) {
  if (typeof toast.custom !== "function") {
    toast.success?.(`${name} ${addedLabel}.`);
    return;
  }
  toast.custom((id) => (
    <div className="stack-toast" role="status">
      {logoSrc
        ? <img className="stack-toast-logo" src={logoSrc} alt="" width={32} height={32} />
        : <span className="stack-toast-logo stack-toast-logo--letter" aria-hidden>{name.charAt(0)}</span>}
      <span className="stack-toast-text">
        <strong>{name}</strong>
        <span>{addedLabel}</span>
      </span>
      <button type="button" className="stack-toast-undo" onClick={() => { onUndo(); toast.dismiss(id); }}>{undoLabel}</button>
      <button type="button" className="stack-toast-open" onClick={() => { toast.dismiss(id); onView(); }}>{viewLabel}</button>
    </div>
  ), { duration: 5000, position: "bottom-center", unstyled: true });
}
