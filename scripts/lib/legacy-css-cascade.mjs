/**
 * Tailwind 3 hoisted @layer blocks into its base/components/utilities directives
 * and emitted ordinary CSS. Native v4 layers would instead lose to every
 * unlayered editorial rule, regardless of specificity (ToolTrim uses both).
 * Keep that established cascade while using the maintained v4 compiler. This
 * does not alter selectors or declarations; it only restores their ordering.
 */
export function legacyCssCascade() {
  const order = ['theme', 'base', 'components', 'utilities'];
  return {
    postcssPlugin: 'tooltrim-legacy-cascade',
    OnceExit(root) {
      const collected = new Map(order.map(name => [name, []]));
      for (const node of [...root.nodes]) {
        if (node.type !== 'atrule' || node.name !== 'layer') continue;
        if (collected.has(node.params) && node.nodes) {
          collected.get(node.params).push(...node.nodes.map(child => child.clone()));
          node.remove();
        } else if (!node.nodes && node.params.split(',').every(name => collected.has(name.trim()))) {
          node.remove();
        }
      }
      root.prepend(...order.flatMap(name => collected.get(name)));
    },
  };
}
