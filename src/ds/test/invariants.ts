/** Number of lines a range sits on. Boxes of different font sizes share a line when one's vertical centre falls inside the other. */
function lineCount(range: Range): number {
  const lines: DOMRect[] = [];
  for (const rect of [...range.getClientRects()].filter((r) => r.width > 0)) {
    const centre = rect.top + rect.height / 2;
    if (!lines.some((line) => centre > line.top && centre < line.bottom)) lines.push(rect);
  }
  return lines.length;
}

/** Words (runs without spaces or hyphens, non-breaking spaces included) that the browser split over two lines. */
export function brokenWords(root: HTMLElement): string[] {
  const found: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    // A word is a run between spaces and hyphens: a line may break after a hyphen (« Profitez-|en »), never inside a part.
    for (const match of node.data.matchAll(/[^\s\-\u2010\u2011]+/g)) {
      const range = document.createRange();
      range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
      if (lineCount(range) > 1) found.push(match[0]);
    }
  }
  return found;
}

/** Elements marked data-nowrap (an amount and its unit) that wrapped. */
export function splitUnits(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>("[data-nowrap]")].filter((el) => {
    const range = document.createRange(); range.selectNodeContents(el);
    return lineCount(range) > 1;
  }).map((el) => el.textContent ?? "");
}

/** Descendants that stick out of their parent's box, sideways. Positioned decoration, transformed boxes and aria-hidden marks are ignored. */
export function overflowing(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("*")].filter((el) => {
    if (el.closest("[aria-hidden='true']") || getComputedStyle(el).display === "contents") return false;
    if (["absolute", "fixed"].includes(getComputedStyle(el).position)) return false;
    // A transform (a tilted logo) moves the box on purpose; only a layout overflow is a defect.
    if (getComputedStyle(el).transform !== "none") return false;
    // A parent in display: contents has no box: measure against the nearest ancestor that has one.
    let parent = el.parentElement;
    while (parent && getComputedStyle(parent).display === "contents") parent = parent.parentElement;
    if (!parent) return false;
    const r = el.getBoundingClientRect(), box = parent.getBoundingClientRect();
    return r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1);
  });
}

/**
 * Action links (the system's linkClass: words and their arrow) wider than what they hold (18/11/2026, « Le guide pour
 * bien commencer » stretched over the whole page): a link is never stretched by its grid or flex parent.
 */
export function stretchedLinks(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("a, button")].filter((el) => {
    if (!/(^|\s)_link_/.test(el.className) || el.closest("[aria-hidden='true']")) return false;
    // Its own width (words, arrow, padding, a tap target's minimum) is what max-content gives; wider is a stretch.
    const box = el.getBoundingClientRect().width;
    const before = el.style.width;
    el.style.width = "max-content";
    const own = el.getBoundingClientRect().width;
    el.style.width = before;
    return own > 0 && box > own + 1;
  });
}

/**
 * Gaps inside a chapter (18/11/2026, « attention ici ça flotte »): between two children stacked in the same box, never
 * the 96 that separates two chapters. Positioned decoration, empty boxes and actions pinned to a card's foot are left
 * out.
 */
export function chapterGaps(root: HTMLElement): string[] {
  const found: string[] = [];
  for (const chapter of root.querySelectorAll<HTMLElement>("[data-chapter]")) {
    for (const box of [chapter, ...chapter.querySelectorAll<HTMLElement>("*")]) {
      if (box !== chapter && box.closest("[data-chapter]") !== chapter) continue;
      const kids = [...box.children].filter((kid): kid is HTMLElement => kid instanceof HTMLElement && !["absolute", "fixed"].includes(getComputedStyle(kid).position) && kid.getBoundingClientRect().height > 0);
      for (let i = 0; i + 1 < kids.length; i++) {
        // An action pinned to a card's foot (data-foot) sits as low as its row's tallest card asks: a gap by design.
        if (kids[i + 1].hasAttribute("data-foot")) continue;
        const above = kids[i].getBoundingClientRect(), below = kids[i + 1].getBoundingClientRect();
        if (below.top - above.bottom >= 96) found.push(`${kids[i].tagName.toLowerCase()} → ${kids[i + 1].tagName.toLowerCase()} (${Math.round(below.top - above.bottom)} px) dans « ${chapter.dataset.chapter} »`);
      }
    }
  }
  return found;
}

/**
 * A row of 4 media cards or fewer leaves no empty column (step 8d, « trou dans la grille »): the last card of each line
 * reaches the list's right edge.
 */
export function emptyColumns(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>("[data-media-cards]")].filter((list) => {
    const cards = [...list.children].filter((card): card is HTMLElement => card instanceof HTMLElement && card.getBoundingClientRect().width > 0);
    if (!cards.length || cards.length > 4) return false;
    const right = list.getBoundingClientRect().right;
    const lines = new Map<number, number>();
    for (const card of cards) { const box = card.getBoundingClientRect(); lines.set(Math.round(box.top), Math.max(lines.get(Math.round(box.top)) ?? 0, box.right)); }
    return [...lines.values()].some((end) => right - end > 2);
  }).map((list) => list.getAttribute("aria-label") ?? "");
}

/**
 * In a data table (step 8d, « aucune structure »), every cell of a column starts at the same left edge, all the way
 * down. Cells spanning both columns are left out.
 */
export function misalignedColumns(root: HTMLElement): string[] {
  const found: string[] = [];
  for (const table of root.querySelectorAll<HTMLElement>("[data-table]")) {
    const lefts: number[][] = [[], []];
    for (const row of table.querySelectorAll<HTMLTableRowElement>("tr")) {
      // Column heads kept for assistive tech only (out of sight on a narrow column) are not part of the layout.
      if (row.closest("thead") && getComputedStyle(row.closest("thead")!).position === "absolute") continue;
      const cells = [...row.cells].filter((cell) => cell.colSpan === 1 && cell.getBoundingClientRect().width > 0);
      if (cells.length !== 2) continue;
      cells.forEach((cell, index) => lefts[index].push(Math.round(cell.getBoundingClientRect().left)));
    }
    lefts.forEach((column, index) => { if (new Set(column).size > 1) found.push(`colonne ${index + 1} de « ${table.getAttribute("aria-labelledby") ?? ""} »`); });
  }
  return found;
}

/** A CSS colour as sRGB 0-255, read back from a 1 px canvas (computed colours may come as oklch or color-mix). */
function rgbOf(color: string): [number, number, number, number] {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}
const luminance = ([r, g, b]: number[]) => {
  const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
export const contrast = (a: string, b: string) => { const [x, y] = [luminance(rgbOf(a)), luminance(rgbOf(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

/**
 * Words on a coloured tile of the palette (trial, 18/11/2026) read at AA: 4.5 for running text, 3 for large text
 * (24 px, or 18.66 px bold). The ground is the nearest box with its own colour, up to the tile.
 */
export function lowContrast(root: HTMLElement): string[] {
  const found: string[] = [];
  for (const tile of root.querySelectorAll<HTMLElement>("[data-palette]:not([data-palette='plain'])")) {
    for (const el of [tile, ...tile.querySelectorAll<HTMLElement>("*")]) {
      const own = [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim());
      if (!own || el.closest("[aria-hidden='true']") || el.getBoundingClientRect().width === 0) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || Number(style.opacity) === 0) continue;
      let ground: HTMLElement | null = el, bg = "";
      while (ground) { const b = getComputedStyle(ground).backgroundColor; if (rgbOf(b)[3] > 0.5) { bg = b; break; } if (ground === tile) break; ground = ground.parentElement; }
      if (!bg) bg = getComputedStyle(tile).backgroundColor;
      const size = parseFloat(style.fontSize), bold = Number(style.fontWeight) >= 700;
      const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
      const ratio = contrast(style.color, bg);
      if (ratio < need) found.push(`« ${el.textContent!.trim().slice(0, 30)} » ${ratio.toFixed(2)} sur ${tile.dataset.palette}`);
    }
  }
  return found;
}

/** The colour an element's words actually sit on: its own and its ancestors' grounds composited, top to bottom. */
export function effectiveBackground(el: HTMLElement): string {
  const layers: [number, number, number, number][] = [];
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const layer = rgbOf(getComputedStyle(node).backgroundColor);
    if (layer[3] > 0) layers.push(layer);
    if (layer[3] >= 1) break;
  }
  let [r, g, b] = [255, 255, 255];
  for (const [lr, lg, lb, la] of layers.reverse()) { r = lr * la + r * (1 - la); g = lg * la + g * (1 - la); b = lb * la + b * (1 - la); }
  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
}

/**
 * One interactive element in its current state (hover, focus, press, open), 18/11/2026: its words at AA on the ground
 * they really sit on, and, when it shows a focus ring, the ring at 3:1 against the surface around it.
 */
export function stateProblems(el: HTMLElement, state: string): string[] {
  const found: string[] = [];
  const style = getComputedStyle(el);
  const words = (el.textContent ?? "").trim().slice(0, 24);
  const ratio = contrast(style.color, effectiveBackground(el));
  if (words && ratio < 4.5) found.push(`${state} « ${words} » : texte ${ratio.toFixed(2)}`);
  if (state === "focus" && style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) {
    const ring = contrast(style.outlineColor, effectiveBackground(el.parentElement ?? el));
    if (ring < 3) found.push(`focus « ${words} » : anneau ${ring.toFixed(2)}`);
  }
  return found;
}

/** Every invariant on a story's root; one readable failure lists them all. */
export function assertLayout(root: HTMLElement) {
  const problems = [
    ...brokenWords(root).map((word) => `mot coupé : « ${word} »`),
    ...splitUnits(root).map((unit) => `unité séparée : « ${unit} »`),
    ...overflowing(root).map((el) => `débordement : <${el.tagName.toLowerCase()} class="${el.className}">`),
    ...stretchedLinks(root).map((el) => `lien étiré : « ${el.textContent ?? ""} »`),
    ...chapterGaps(root).map((gap) => `écart de chapitre dans un chapitre : ${gap}`),
    ...emptyColumns(root).map((label) => `colonne vide dans une rangée de cartes : « ${label} »`),
    ...misalignedColumns(root).map((column) => `colonne de tableau mal alignée : ${column}`),
    ...lowContrast(root).map((words) => `contraste insuffisant : ${words}`),
  ];
  if (problems.length) throw new Error(problems.join("\n"));
}
