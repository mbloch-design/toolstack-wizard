import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { parse } from 'parse5';

// This is a conservative applicability index, not a browser selector matcher.
// State/ancestor/negative conditions can change before the deferred sheet loads.
// Anchor on the nearest positive-class compound, retaining unclassed alternatives.
function selectorAnchors(selector) {
  const classes = new Set();
  let global = false;
  try {
    selectorParser().astSync(selector).each(branch => {
      const collect = nodes => {
        const compounds = [[]];
        for (const node of nodes) {
          if (node.type === 'combinator') compounds.push([]);
          else compounds.at(-1).push(node);
        }
        for (const compound of compounds.reverse()) {
          const result = new Set();
          for (const node of compound) {
            if (node.type === 'class') result.add(node.value);
            if (node.type === 'pseudo' && [':is', ':where', ':matches', ':-webkit-any', ':-moz-any'].includes(node.value)) {
              const alternatives = node.nodes.map(alternative => collect(alternative.nodes));
              // :is(.missing,button) can match without any class at all.
              if (alternatives.every(alternative => alternative.size)) {
                for (const alternative of alternatives) for (const name of alternative) result.add(name);
              }
            }
          }
          if (result.size) return result;
        }
        return new Set();
      };
      const anchors = collect(branch.nodes);
      if (!anchors.size) global = true;
      for (const anchor of anchors) classes.add(anchor);
    });
  } catch {
    // A newer selector syntax must cost bytes, never silently lose styles.
    global = true;
  }
  return { classes, global };
}

/** Index a compiled sheet once; return source-ordered subsets for SSR documents. */
export function createCriticalCssExtractor(css, { coalesceFamilies = false } = {}) {
  const root = postcss.parse(css);
  const classIndex = new Map();
  // Production groups positive class anchors by their owner prefix. This is
  // a conservative superset: all emitted rules keep their original position.
  // It bounds variants caused by tiny markup differences (pricing/features)
  // without copying the complete application sheet into every document.
  const family = name => name.includes(':') ? '@utility-variants' : name.split('-')[0];
  const classKey = name => coalesceFamilies ? family(name) : name;
  const propertyIndex = new Map();
  const always = new Set();
  const globalProperties = new Set();
  const add = (index, key, record) => {
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(record);
  };

  function atom(node, global = true, classes = []) {
    const text = node.toString() + ((node.type === 'atrule' && !node.nodes) || node.type === 'decl' ? ';' : '');
    const record = { text, uses: new Set() };
    // A declaration's value can contain multiple/fallback variable references.
    // Keeping all token definitions is deliberately conservative, including
    // definitions under media/supports and themes absent from the SSR markup.
    const declarations = node.type === 'decl' ? [node] : [];
    node.walkDecls?.(decl => declarations.push(decl));
    for (const decl of declarations) {
      if (decl.prop.startsWith('--')) {
        add(propertyIndex, decl.prop, record);
        if (global) globalProperties.add(decl.prop);
      }
      for (const match of decl.value.matchAll(/var\(\s*(--[\w-]+)/g)) record.uses.add(match[1]);
    }
    if (node.type === 'atrule' && node.name === 'property') globalProperties.add(node.params.trim());
    if (global) always.add(record);
    for (const name of classes) add(classIndex, classKey(name), record);
    return record;
  }

  function indexNode(node) {
    if (node.type === 'comment') return { text: '' };
    if (node.type === 'rule') {
      const { classes, global } = selectorAnchors(node.selector);
      // Keep a matched native nesting subtree intact, including relative &
      // selectors, declarations and conditional descendants in their own order.
      return atom(node, global, classes);
    }
    if (node.type !== 'atrule' || !node.nodes) return atom(node);
    if (/^(?:font-face|(?:-\w+-)?keyframes|property)$/i.test(node.name)
      || (node.name === 'layer' && /^(?:theme|base|properties)(?:\.|$)/.test(node.params.trim()))) {
      return atom(node);
    }
    // Let PostCSS serialize both delimiters. No brace counting or selector
    // splitting: strings, comments, escapes and arbitrary wrapper depth survive.
    let before = '';
    let after = '';
    postcss.stringify(node.clone({ nodes: [] }), (text, _node, type) => {
      if (type === 'start') before += text;
      else after += text;
    });
    return { before, after, children: node.nodes.map(indexNode), keepEmpty: node.name === 'layer' };
  }

  const tree = root.nodes.map(indexNode);
  return markup => {
    const selected = new Set(always);
    const document = parse(markup);
    const visit = node => {
      for (const attr of node.attrs ?? []) {
        if (attr.name !== 'class') continue;
        for (const name of attr.value.split(/\s+/)) {
          for (const record of classIndex.get(classKey(name)) ?? []) selected.add(record);
        }
      }
      for (const child of node.childNodes ?? []) visit(child);
      // Template content is a separate parse5 fragment.
      if (node.content) visit(node.content);
    };
    visit(document);
    // Set iteration also visits appended records, resolving transitive tokens.
    for (const record of selected) {
      for (const property of record.uses) {
        // Global defaults/registrations already travel with every page. An
        // unrelated absent class overriding that token cannot affect this page.
        if (globalProperties.has(property)) continue;
        for (const dependency of propertyIndex.get(property) ?? []) selected.add(dependency);
      }
    }
    const render = node => {
      if (!node.children) return selected.has(node) ? node.text : '';
      const content = node.children.map(render).join('');
      return content || node.keepEmpty ? node.before + content + node.after : '';
    };
    return tree.map(render).join('');
  };
}
