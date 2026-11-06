/** Number of lines a range sits on. Boxes of different font sizes share a line when one's vertical centre falls inside the other. */
function lineCount(range: Range): number {
  const lines: DOMRect[] = [];
  for (const rect of [...range.getClientRects()].filter((r) => r.width > 0)) {
    const centre = rect.top + rect.height / 2;
    if (!lines.some((line) => centre > line.top && centre < line.bottom)) lines.push(rect);
  }
  return lines.length;
}

/** Words (runs without any space, non-breaking spaces included) that the browser split over two lines. */
export function brokenWords(root: HTMLElement): string[] {
  const found: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    for (const match of node.data.matchAll(/\S+/g)) {
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

/** Descendants that stick out of their parent's box, sideways. Positioned decoration and aria-hidden marks are ignored. */
export function overflowing(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("*")].filter((el) => {
    if (el.closest("[aria-hidden='true']") || getComputedStyle(el).display === "contents") return false;
    if (["absolute", "fixed"].includes(getComputedStyle(el).position)) return false;
    // A parent in display: contents has no box: measure against the nearest ancestor that has one.
    let parent = el.parentElement;
    while (parent && getComputedStyle(parent).display === "contents") parent = parent.parentElement;
    if (!parent) return false;
    const r = el.getBoundingClientRect(), box = parent.getBoundingClientRect();
    return r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1);
  });
}

/** Every invariant on a story's root; one readable failure lists them all. */
export function assertLayout(root: HTMLElement) {
  const problems = [
    ...brokenWords(root).map((word) => `mot coupé : « ${word} »`),
    ...splitUnits(root).map((unit) => `unité séparée : « ${unit} »`),
    ...overflowing(root).map((el) => `débordement : <${el.tagName.toLowerCase()} class="${el.className}">`),
  ];
  if (problems.length) throw new Error(problems.join("\n"));
}
