import postcss from 'postcss';

function commonEdge(values, fromEnd = false) {
  if (!values.length) return '';
  let shared = values[0];
  for (const value of values.slice(1)) {
    let n = 0;
    while (n < Math.min(shared.length, value.length) && shared[fromEnd ? shared.length - 1 - n : n] === value[fromEnd ? value.length - 1 - n : n]) n++;
    shared = fromEnd ? shared.slice(shared.length - n) : shared.slice(0, n);
    if (!shared) break;
  }
  return shared;
}

/** Split only at complete top-level rules and preserve the original byte order. */
export function splitSharedCriticalCss(values, { minSharedBytes = 1024 } = {}) {
  const unique = [...new Set(values)];
  if (!unique.length) return { prefix: '', suffix: '', parts: [] };
  const reference = unique[0];
  const nodes = postcss.parse(reference).nodes;
  const tail = commonEdge(unique, true);
  const suffixStart = nodes.find(node => node.source.start.offset >= reference.length - tail.length)?.source.start.offset ?? reference.length;
  let suffix = reference.slice(suffixStart);
  if (Buffer.byteLength(suffix) < minSharedBytes) suffix = '';
  const own = values.map(css => suffix ? css.slice(0, -suffix.length) : css);
  const nonEmpty = [...new Set(own.filter(Boolean))];
  let prefix = '';
  if (nonEmpty.length > 1) {
    const edge = commonEdge(nonEmpty);
    let end = 0;
    for (const node of postcss.parse(nonEmpty[0]).nodes) {
      const boundary = node.source.end.offset;
      if (boundary > edge.length) break;
      end = boundary;
    }
    prefix = nonEmpty[0].slice(0, end);
    if (Buffer.byteLength(prefix) < minSharedBytes) prefix = '';
  }
  const parts = own.map(css => ({
    hasPrefix: Boolean(prefix && css.startsWith(prefix)),
    own: prefix && css.startsWith(prefix) ? css.slice(prefix.length) : css,
  }));
  return { prefix, suffix, parts };
}
