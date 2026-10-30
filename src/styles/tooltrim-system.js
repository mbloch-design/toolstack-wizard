/* ─────────────────────────────────────────────────────────────────────────
   Système ToolTrim : le comportement partagé (pendant de tooltrim-system.css).
   Lu par le site (src/main.tsx) et inliné dans la planche (npm run planche).

   L'étoile filante des appels qui mènent : au survol, un filet P3 et une
   traînée de lumière douce courent le long de la pilule. Rien n'est ajouté
   au DOM avant le premier survol ; « réduire les animations » coupe tout.
   ───────────────────────────────────────────────────────────────────────── */

/* Segments [décalage, mélange violet vers bleu en pour cent, opacité,
   épaisseur] ; un mélange de -1 est le cœur blanc. Fenêtres en cosinus. */
const GLOW = [[-4.0,100,0.0,1.0],[-3.52,92,0.004,1.02],[-3.05,84,0.013,1.06],[-2.57,76,0.028,1.12],[-2.1,68,0.046,1.18],[-1.62,60,0.068,1.25],[-1.14,52,0.094,1.32],[-0.67,44,0.123,1.4],[-0.19,36,0.155,1.48],[0.29,28,0.189,1.57],[0.76,20,0.225,1.66],[1.24,12,0.263,1.75],[1.71,4,0.303,1.85],[2.19,-1,0.343,1.94],[2.67,-1,0.384,2.03],[3.14,-1,0.425,2.12],[3.62,-1,0.466,2.21],[4.1,-1,0.506,2.3],[4.57,-1,0.546,2.38],[5.05,-1,0.584,2.46],[5.52,-1,0.621,2.54],[6.0,-1,0.656,2.61],[6.48,-1,0.689,2.68],[6.95,-1,0.719,2.74],[7.43,-1,0.747,2.8],[7.9,-1,0.772,2.85],[8.38,-1,0.794,2.89],[8.86,-1,0.812,2.93],[9.33,-1,0.827,2.95],[9.81,-1,0.838,2.98],[10.29,-1,0.846,2.99],[10.76,-1,0.85,3.0],[11.24,-1,0.85,3.0],[11.71,-1,0.846,2.99],[12.19,-1,0.838,2.98],[12.67,-1,0.827,2.95],[13.14,-1,0.812,2.93],[13.62,-1,0.794,2.89],[14.1,-1,0.772,2.85],[14.57,-1,0.747,2.8],[15.05,-1,0.719,2.74],[15.52,-1,0.689,2.68],[16.0,-1,0.656,2.61],[16.48,-1,0.621,2.54],[16.95,-1,0.584,2.46],[17.43,-1,0.546,2.38],[17.9,-1,0.506,2.3],[18.38,-1,0.466,2.21],[18.86,-1,0.425,2.12],[19.33,-1,0.384,2.03],[19.81,-1,0.343,1.94],[20.29,4,0.303,1.85],[20.76,12,0.263,1.75],[21.24,20,0.225,1.66],[21.71,28,0.189,1.57],[22.19,36,0.155,1.48],[22.67,44,0.123,1.4],[23.14,52,0.094,1.32],[23.62,60,0.068,1.25],[24.1,68,0.046,1.18],[24.57,76,0.028,1.12],[25.05,84,0.013,1.06],[25.52,92,0.004,1.02],[26.0,100,0.0,1.0]];
const CORE = [[0.0,100,0.0,0.6],[0.37,91,0.0,0.6],[0.75,83,0.003,0.6],[1.12,74,0.008,0.6],[1.49,66,0.018,0.61],[1.86,57,0.031,0.62],[2.24,49,0.049,0.64],[2.61,40,0.072,0.66],[2.98,32,0.1,0.68],[3.36,23,0.134,0.72],[3.73,15,0.172,0.76],[4.1,6,0.214,0.8],[4.47,-1,0.261,0.85],[4.85,-1,0.311,0.91],[5.22,-1,0.365,0.97],[5.59,-1,0.42,1.04],[5.97,-1,0.478,1.11],[6.34,-1,0.536,1.18],[6.71,-1,0.594,1.26],[7.08,-1,0.651,1.33],[7.46,-1,0.706,1.4],[7.83,-1,0.759,1.47],[8.2,-1,0.808,1.54],[8.58,-1,0.853,1.6],[8.95,-1,0.893,1.65],[9.32,-1,0.927,1.7],[9.69,-1,0.956,1.74],[10.07,-1,0.977,1.77],[10.44,-1,0.992,1.79],[10.81,-1,0.999,1.8],[11.19,-1,0.999,1.8],[11.56,-1,0.992,1.79],[11.93,-1,0.977,1.77],[12.31,-1,0.956,1.74],[12.68,-1,0.927,1.7],[13.05,-1,0.893,1.65],[13.42,-1,0.853,1.6],[13.8,-1,0.808,1.54],[14.17,-1,0.759,1.47],[14.54,-1,0.706,1.4],[14.92,-1,0.651,1.33],[15.29,-1,0.594,1.26],[15.66,-1,0.536,1.18],[16.03,-1,0.478,1.11],[16.41,-1,0.42,1.04],[16.78,-1,0.365,0.97],[17.15,-1,0.311,0.91],[17.53,-1,0.261,0.85],[17.9,6,0.214,0.8],[18.27,15,0.172,0.76],[18.64,23,0.134,0.72],[19.02,32,0.1,0.68],[19.39,40,0.072,0.66],[19.76,49,0.049,0.64],[20.14,57,0.031,0.62],[20.51,66,0.018,0.61],[20.88,74,0.008,0.6],[21.25,83,0.003,0.6],[21.63,91,0.0,0.6],[22.0,100,0.0,0.6]];

const NS = "http://www.w3.org/2000/svg";
const stroke = (mix) => mix < 0 ? "var(--tt-edge-head)" : `color-mix(in oklch, var(--tt-edge-3), var(--tt-edge-2) ${mix}%)`;

function svg(rows, glow) {
  const el = document.createElementNS(NS, "svg");
  el.setAttribute("class", glow ? "tt-spark tt-spark--glow" : "tt-spark");
  el.setAttribute("aria-hidden", "true");
  for (const [o, mix, opacity, width] of rows) {
    const rect = document.createElementNS(NS, "rect");
    rect.setAttribute("pathLength", "100");
    rect.setAttribute("style", `--o:${o};stroke:${stroke(mix)};stroke-opacity:${opacity};stroke-width:${width}`);
    el.appendChild(rect);
  }
  return el;
}

function arm(host) {
  // React may rewrite a host's children (textContent): re-arm when the trail is gone.
  if (host.querySelector(":scope > .tt-spark")) return;
  const edge = document.createElement("span");
  edge.className = "tt-edge";
  edge.setAttribute("aria-hidden", "true");
  host.prepend(edge);
  host.append(svg(GLOW, true), svg(CORE, false));
}

/* The trail follows the pill's own outline: its corner radius, inset 1.5px. */
function fit(host) {
  const height = host.getBoundingClientRect().height;
  const radius = parseFloat(getComputedStyle(host).borderTopLeftRadius) || 0;
  host.style.setProperty("--tt-spark-rx", `${Math.max(0, Math.min(radius, height / 2) - 1.5)}px`);
}

/**
 * Installe le comportement du système. L'étoile filante s'arme au premier
 * survol des éléments [data-tt-spark] et de ceux qui correspondent à
 * `sparkSelector`. Un seul écouteur délégué pour toute la page.
 */
export function installToolTrimSystem({ sparkSelector = "", tiltSelector = "" } = {}) {
  if (typeof window === "undefined" || window.__ttSystem) return;
  window.__ttSystem = true;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hover = window.matchMedia("(hover: hover)");
  const match = ["[data-tt-spark]", sparkSelector].filter(Boolean).join(", ");
  document.addEventListener("pointerover", (event) => {
    if (reduce.matches || !hover.matches || !(event.target instanceof Element)) return;
    const host = event.target.closest(match);
    if (!host) return;
    host.classList.add("tt-spark-host");
    fit(host);
    arm(host);
  }, { passive: true });
  // La carte qui s'incline : quelques degrés vers le pointeur, et retour au repos.
  const tilt = ["[data-tt-tilt]", tiltSelector].filter(Boolean).join(", ");
  document.addEventListener("pointermove", (event) => {
    if (reduce.matches || !hover.matches || !(event.target instanceof Element)) return;
    const card = event.target.closest(tilt);
    if (!card) return;
    card.classList.add("tt-tilt-host");
    const box = card.getBoundingClientRect(), x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height;
    card.style.setProperty("--tt-ry", `${((x - .5) * 8).toFixed(2)}deg`);
    card.style.setProperty("--tt-rx", `${((.5 - y) * 6).toFixed(2)}deg`);
    card.style.setProperty("--tt-sx", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--tt-sy", `${(y * 100).toFixed(1)}%`);
  }, { passive: true });
  document.addEventListener("pointerout", (event) => {
    if (!(event.target instanceof Element)) return;
    const card = event.target.closest(".tt-tilt-host");
    if (!card || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) return;
    card.style.setProperty("--tt-rx", "0deg");
    card.style.setProperty("--tt-ry", "0deg");
  }, { passive: true });
  document.addEventListener("pointermove", (event) => {
    if (!(event.target instanceof Element)) return;
    const host = event.target.closest(".tt-spark-host");
    if (!host) return;
    const box = host.getBoundingClientRect();
    host.style.setProperty("--tt-mx", `${event.clientX - box.left}px`);
    host.style.setProperty("--tt-my", `${event.clientY - box.top}px`);
  }, { passive: true });
}
