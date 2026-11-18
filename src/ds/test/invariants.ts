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

/** Every invariant on a story's root; one readable failure lists them all. */
export function assertLayout(root: HTMLElement) {
  const problems = [
    ...brokenWords(root).map((word) => `mot coupé : « ${word} »`),
    ...splitUnits(root).map((unit) => `unité séparée : « ${unit} »`),
    ...overflowing(root).map((el) => `débordement : <${el.tagName.toLowerCase()} class="${el.className}">`),
    ...stretchedLinks(root).map((el) => `lien étiré : « ${el.textContent ?? ""} »`),
    ...chapterGaps(root).map((gap) => `écart de chapitre dans un chapitre : ${gap}`),
  ];
  if (problems.length) throw new Error(problems.join("\n"));
}
