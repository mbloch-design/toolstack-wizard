import { hasGenuineFreeTier } from "@/lib/pricing";

export type StackPricedTool = {
  id: string;
  slug?: string;
  name: string;
  bundle_parent?: string | null;
  defaultMonthlyPrice: number;
  pricing?: { free?: string | null; paid?: string | null } | null;
};

export type StackBundleLine<T extends StackPricedTool = StackPricedTool> = {
  id: string;
  parent: T;
  tools: T[];
  bundleTotal: number;
};

export type StackPricingSummary<T extends StackPricedTool = StackPricedTool> = {
  total: number;
  unknownPriceCount: number;
  pricedToolCount: number;
  freeToolCount: number;
  uniqueToolCount: number;
  bundleLines: StackBundleLine<T>[];
  lineByToolKey: Map<string, StackBundleLine<T>>;
};

export type StackToolPriceKind = "free" | "unknown" | "starting-at";

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getStackToolKey(tool: StackPricedTool) {
  return tool.slug || tool.id;
}

function getToolPrice(tool: StackPricedTool | undefined) {
  return Math.max(0, Number(tool?.defaultMonthlyPrice) || 0);
}

function getToolLookupKeys(tool: StackPricedTool) {
  return Array.from(new Set([tool.id, tool.slug, getStackToolKey(tool)].map((key) => normalizeKey(key || "")).filter(Boolean)));
}

function isSameTool(a: StackPricedTool, b: StackPricedTool) {
  const bKeys = new Set(getToolLookupKeys(b));
  return getToolLookupKeys(a).some((key) => bKeys.has(key));
}

function buildToolLookup<T extends StackPricedTool>(tools: T[]) {
  const lookup = new Map<string, T>();
  tools.forEach((tool) => {
    getToolLookupKeys(tool).forEach((key) => {
      if (!lookup.has(key)) lookup.set(key, tool);
    });
  });
  return lookup;
}

function getBundleParentTool<T extends StackPricedTool>(tool: T, lookup: Map<string, T>) {
  const parentKey = normalizeKey(tool.bundle_parent || "");
  if (!parentKey) return null;
  const parent = lookup.get(parentKey);
  if (!parent || isSameTool(tool, parent)) return null;
  return parent;
}

export function getStackToolPriceKind(tool: StackPricedTool): StackToolPriceKind {
  if (getToolPrice(tool) > 0) return "starting-at";
  if (hasGenuineFreeTier(tool.pricing?.free)) return "free";
  return "unknown";
}

export function formatStackToolPrice(tool: StackPricedTool, lang: string) {
  const kind = getStackToolPriceKind(tool);
  if (kind === "free") return lang === "en" ? "Free" : "Gratuit";
  if (kind === "unknown") return lang === "en" ? "Price unknown" : "Prix inconnu";
  const price = Math.round(getToolPrice(tool));
  return lang === "en" ? `From €${price}/mo` : `À partir de ${price} €/mois`;
}

export function computeStackPricing<T extends StackPricedTool>(selectedTools: T[], allTools: T[]): StackPricingSummary<T> {
  const uniqueSelectedTools = Array.from(new Map(
    selectedTools.map((tool) => [normalizeKey(getStackToolKey(tool)), tool]),
  ).values());
  const lookup = buildToolLookup(allTools);
  const processed = new Set<string>();
  const lineByToolKey = new Map<string, StackBundleLine<T>>();
  const groups = new Map<string, { parent: T; children: T[] }>();

  uniqueSelectedTools.forEach((tool) => {
    const parent = getBundleParentTool(tool, lookup);
    if (!parent) return;
    const parentKey = normalizeKey(getStackToolKey(parent));
    const group = groups.get(parentKey) || { parent, children: [] };
    group.children.push(tool);
    groups.set(parentKey, group);
  });

  const selectedParentFor = (parent: T) => uniqueSelectedTools.find((tool) => isSameTool(tool, parent));
  const groupCandidates = Array.from(groups.values())
    .map((group) => {
      const parentSelected = selectedParentFor(group.parent);
      const selectedGroupTools = Array.from(new Map(
        [parentSelected, ...group.children]
          .filter(Boolean)
          .map((tool) => [getStackToolKey(tool as T), tool as T]),
      ).values());
      const unit = selectedGroupTools.reduce((sum, tool) => sum + getToolPrice(tool), 0);
      const bundlePrice = getToolPrice(group.parent);
      return { ...group, parentSelected, selectedGroupTools, unit, bundlePrice };
    })
    .filter((group) => group.parentSelected || (group.children.length >= 2 && group.unit > group.bundlePrice))
    .filter((group) => group.bundlePrice > 0)
    .sort((a, b) => (b.unit - b.bundlePrice) - (a.unit - a.bundlePrice) || b.children.length - a.children.length);

  const bundleLines: StackBundleLine<T>[] = [];
  groupCandidates.forEach((group) => {
    const availableTools = group.selectedGroupTools.filter((tool) => !processed.has(normalizeKey(getStackToolKey(tool))));
    if (availableTools.length === 0) return;
    const line: StackBundleLine<T> = {
      id: getStackToolKey(group.parent),
      parent: group.parent,
      tools: availableTools,
      bundleTotal: group.bundlePrice,
    };
    bundleLines.push(line);
    availableTools.forEach((tool) => {
      getToolLookupKeys(tool).forEach((key) => {
        processed.add(key);
        lineByToolKey.set(key, line);
      });
    });
  });

  const standaloneTotal = uniqueSelectedTools.reduce((sum, tool) => (
    processed.has(normalizeKey(getStackToolKey(tool))) ? sum : sum + getToolPrice(tool)
  ), 0);
  const bundleTotal = bundleLines.reduce((sum, line) => sum + line.bundleTotal, 0);
  const priceKinds = uniqueSelectedTools.map(getStackToolPriceKind);

  return {
    total: standaloneTotal + bundleTotal,
    unknownPriceCount: priceKinds.filter((kind) => kind === "unknown").length,
    pricedToolCount: priceKinds.filter((kind) => kind === "starting-at").length,
    freeToolCount: priceKinds.filter((kind) => kind === "free").length,
    uniqueToolCount: uniqueSelectedTools.length,
    bundleLines,
    lineByToolKey,
  };
}
