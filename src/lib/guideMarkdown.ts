export interface GuideTocItem {
  id: string;
  level: 2 | 3;
  text: string;
}

export function buildGuideToc(markdown = ""): GuideTocItem[] {
  return [...markdown.matchAll(/^(#{2,3}) (.+)$/gm)].map((match, index) => ({
    id: `heading-${index}`,
    level: match[1].length as 2 | 3,
    text: match[2].replace(/^[\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u, ""),
  }));
}

/**
 * Small, deterministic renderer for ToolTrim's repository-owned guide copy.
 * The generated HTML is identical during prerender and hydration: there is no
 * browser-only sanitisation pass that can replace the article DOM on startup.
 */
export function renderGuideMarkdown(
  markdown: string,
  toc: GuideTocItem[],
  articleTitle: string,
  options: { isStory?: boolean; storyHero?: string | null } = {},
): string {
  const { isStory = false, storyHero } = options;
  let html = markdown;
  let tocIndex = 0;
  const codeBlocks: string[] = [];
  const cleanHeading = (value: string) =>
    value.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u, "");

  if (isStory && storyHero) {
    const escapedHero = storyHero.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(`!\\[[^\\]]*\\]\\(${escapedHero}\\)\\s*`), "");
  }

  html = html.replace(/```[^\n]*\n([\s\S]*?)```/g, (_match, source: string) => {
    const escaped = source
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const index = codeBlocks.push(`<pre class="ga-code-block"><code>${escaped.trim()}</code></pre>`) - 1;
    return `<div data-ga-code-block="${index}"></div>`;
  });

  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    isStory
      ? '<figure class="ga-story-figure"><img src="$2" alt="$1" loading="lazy" decoding="async" /><figcaption>$1</figcaption></figure>'
      : '<img src="$2" alt="$1" loading="lazy" decoding="async" />',
  );

  if (isStory) {
    html = html
      .replace(
        /^\[\[story-gallery\]\]$/gm,
        '<div class="ga-story-gallery" role="region" aria-label="Galerie photographique" tabindex="0">',
      )
      .replace(/^\[\[\/story-gallery\]\]$/gm, "</div>");
  }

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text: string, href: string) => {
    const isInternal = href.startsWith("/") || href.startsWith("#") || /^https?:\/\/(www\.)?tooltrim\.com/i.test(href);
    return isInternal
      ? `<a href="${href}">${text}</a>`
      : `<a href="${href}" target="_blank" rel="nofollow noopener noreferrer">${text}</a>`;
  });

  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/gm, (_match, header, _separator, body) => {
    const headings = header.split("|").filter((cell: string) => cell.trim());
    const rows = body.trim().split("\n").map((row: string) => row.split("|").filter((cell: string) => cell.trim()));
    return `<div class="overflow-x-auto my-6"><table><thead><tr>${headings.map((heading: string) => `<th>${heading.trim()}</th>`).join("")}</tr></thead><tbody>${rows.map((row: string[]) => `<tr>${row.map((cell) => `<td>${cell.trim()}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  });

  html = html.replace(/^(#{2,3}) (.+)$/gm, (_match, hashes, text) => {
    const level = hashes.length;
    const id = toc[tocIndex]?.id || `heading-${tocIndex}`;
    tocIndex += 1;
    return `<h${level} id="${id}">${cleanHeading(text)}</h${level}>`;
  });
  html = html.replace(/^#### (.+)$/gm, (_match, text) => `<h4>${cleanHeading(text)}</h4>`);
  html = html.replace(/^# (.+)$/gm, (_match, text) => (
    text.trim().toLowerCase() === articleTitle.trim().toLowerCase() ? "" : `<h1>${text}</h1>`
  ));
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^> (.+)$/gm, (_match, text) => {
    const lower = text.toLowerCase();
    if (lower.startsWith("à retenir") || lower.startsWith("key takeaway") || lower.startsWith("à noter") || lower.startsWith("note :")) {
      const colon = text.indexOf(":");
      const body = colon >= 0 && colon < 20 ? text.slice(colon + 1).trim() : text;
      const label = colon >= 0 && colon < 20 ? text.slice(0, colon).trim() : "À retenir";
      return `<div class="ga-takeaway"><p class="ga-takeaway-label">${label}</p><p>${body}</p></div>`;
    }
    return `<blockquote><p>${text}</p></blockquote>`;
  });
  html = html.replace(/(?:^\d+\. .+(?:\n|$))+/gm, (block) => {
    const items = block.trim().split("\n").map((line) => line.replace(/^\d+\.\s+/, ""));
    return `<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`;
  });
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^((?:<li>.*<\/li>\n?)+)/gm, "<ul>$1</ul>");
  html = html.replace(/^---$/gm, "<hr />");
  html = html.replace(
    /^(?!<(?:h[1-6]|ul|ol|li|blockquote|table|thead|tbody|tr|td|th|div|figure|figcaption|hr|p|pre)\b|<\/|$)(.+)$/gm,
    "<p>$1</p>",
  );
  html = html.replace(/<p>\s*<\/p>/g, "");

  if (isStory) {
    html = html
      .replace(/(<\/blockquote>)\s*<p>(Anna Morel[^<]*)<\/p>/g, '$1<p class="ga-quote-attribution">$2</p>')
      .replace(/(<\/blockquote>)\s*<p>@\s*([^<]+)<\/p>/g, '$1<p class="ga-quote-attribution">$2</p>');
  }

  html = html.replace(
    /<div data-ga-code-block="(\d+)"><\/div>/g,
    (_match, index) => codeBlocks[Number(index)] || "",
  );
  html = html.replace(/<hr \/>\s*(?=<h2\b)/g, "");
  html = html.replace(
    /(<h2\b[^>]*>[\s\S]*?<\/h2>)([\s\S]*?)(?=<h2\b|$)/g,
    '<section class="ga-article-section"><div class="ga-section-heading">$1</div><div class="ga-section-copy">$2</div></section>',
  );

  return html;
}
