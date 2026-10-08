import assert from "node:assert/strict";
import crypto from "node:crypto";
import { parse } from "parse5";

const isJsonLd = (node) => node.tagName === "script" &&
  node.attrs.some(({ name, value }) => name === "type" && value.toLowerCase().trim() === "application/ld+json");
const scriptText = (node) => (node.childNodes || []).map((child) => child.value || "").join("");
const isHeadSpace = (node) => node.nodeName === "#text" && node.parentNode?.tagName === "head" && /^\s+$/.test(node.value);
const isDocumentary = (node, inHead, comments) => inHead && node.nodeName === "#comment" && comments.has(node.data);

// Work from parser offsets, never a document-wide whitespace regex: body text,
// script/style contents and React's comment nodes must retain their bytes.
export function compactHtml(html, documentaryComments = new Set()) {
  const edits = [];
  function visit(node, inHead = false) {
    inHead ||= node.tagName === "head";
    const location = node.sourceCodeLocation;
    if (location && (isHeadSpace(node) || isDocumentary(node, inHead, documentaryComments))) {
      edits.push({ start: location.startOffset, end: location.endOffset, text: "" });
      return;
    }
    if (isJsonLd(node)) {
      const value = JSON.parse(scriptText(node));
      const text = JSON.stringify(value).replace(/</g, "\\u003c");
      // JSON.stringify must not silently turn a non-finite number into null.
      assert.deepEqual(JSON.parse(text), value, "JSON-LD values changed during compaction");
      if (!location?.startTag || !location?.endTag) throw new Error("Unclosed JSON-LD script");
      edits.push({ start: location.startTag.endOffset, end: location.endTag.startOffset, text });
      return;
    }
    for (const child of node.childNodes || []) visit(child, inHead);
    if (node.content) visit(node.content, inHead);
  }
  visit(parse(html, { sourceCodeLocationInfo: true }));
  let result = html;
  for (const { start, end, text } of edits.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, start) + text + result.slice(end);
  }
  return result;
}

// Independent publication gate: compare the parsed document, including every
// attribute, text, script, style, template and non-documentary comment. Only the
// approved head whitespace/comments and JSON-LD formatting are ignored.
function documentFingerprint(html, documentaryComments) {
  const hash = crypto.createHash("sha256");
  const put = (value) => hash.update(JSON.stringify(value) + "\n");
  function visit(node, inHead = false) {
    inHead ||= node.tagName === "head";
    if (isHeadSpace(node) || isDocumentary(node, inHead, documentaryComments)) return;
    put([node.nodeName, node.namespaceURI, node.attrs, node.name, node.publicId, node.systemId, node.value, node.data]);
    if (isJsonLd(node)) put(["jsonld", JSON.parse(scriptText(node))]);
    else for (const child of node.childNodes || []) visit(child, inHead);
    if (node.content) visit(node.content, inHead);
    put(["end", node.nodeName]);
  }
  visit(parse(html));
  return hash.digest("hex");
}

export function assertHtmlEquivalent(before, after, documentaryComments = new Set()) {
  assert.equal(documentFingerprint(after, documentaryComments), documentFingerprint(before, documentaryComments),
    "HTML content, metadata or hydration markers changed during compaction");
}
