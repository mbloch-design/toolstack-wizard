import type {
  CommercialAccessMode,
  CommercialContract,
  Tool,
} from "@/types/diagnostic";

export interface CommercialPlanOption {
  id: string;
  accessMode: CommercialAccessMode;
  labelFr: string;
  labelEn: string;
  includedProductIds?: string[];
}

export interface CommercialFamily {
  id: string;
  name: string;
  tools: Tool[];
  plans: CommercialPlanOption[];
}

const ADOBE_PHOTOGRAPHY_IDS = [
  "adobe-photoshop",
  "adobe-lightroom",
  "firefly",
];

const FAMILY_CONFIG: Array<{
  id: string;
  name: string;
  matches: (tool: Tool) => boolean;
  plans: CommercialPlanOption[];
}> = [
  {
    id: "adobe",
    name: "Adobe",
    matches: (tool) =>
      tool.id === "indesign" ||
      tool.id === "firefly" ||
      tool.id.startsWith("adobe-"),
    plans: [
      { id: "all-apps", accessMode: "suite", labelFr: "Creative Cloud — toutes les apps", labelEn: "Creative Cloud — All Apps" },
      {
        id: "photography",
        accessMode: "suite",
        labelFr: "Formule Photography",
        labelEn: "Photography plan",
        includedProductIds: ADOBE_PHOTOGRAPHY_IDS,
      },
      {
        id: "photography-plus",
        accessMode: "mixed",
        labelFr: "Photography + autre(s) application(s)",
        labelEn: "Photography + other app(s)",
      },
      { id: "single-products", accessMode: "single_products", labelFr: "Une ou plusieurs applications seules", labelEn: "One or more single apps" },
      { id: "team-employer", accessMode: "team_employer", labelFr: "Licence équipe ou employeur", labelEn: "Team or employer license" },
      { id: "client-paid", accessMode: "client_paid", labelFr: "Payé par un client", labelEn: "Paid by a client" },
      { id: "included-elsewhere", accessMode: "included_elsewhere", labelFr: "Inclus ailleurs", labelEn: "Included elsewhere" },
      { id: "unknown", accessMode: "unknown", labelFr: "Je ne sais pas encore", labelEn: "I’m not sure yet" },
    ],
  },
  {
    id: "maxon",
    name: "Maxon",
    matches: (tool) =>
      tool.id === "maxon-one" ||
      ["cinema-4d", "redshift", "zbrush", "red-giant-universe"].includes(tool.id),
    plans: [
      { id: "maxon-one", accessMode: "suite", labelFr: "Maxon One", labelEn: "Maxon One" },
      { id: "single-products", accessMode: "single_products", labelFr: "Produits séparés", labelEn: "Separate products" },
      { id: "team-employer", accessMode: "team_employer", labelFr: "Licence équipe ou employeur", labelEn: "Team or employer license" },
      { id: "client-paid", accessMode: "client_paid", labelFr: "Payé par un client", labelEn: "Paid by a client" },
      { id: "unknown", accessMode: "unknown", labelFr: "Je ne sais pas", labelEn: "I’m not sure" },
    ],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    matches: (tool) =>
      tool.id === "microsoft-365" ||
      tool.id.startsWith("microsoft-") ||
      ["word", "excel", "powerpoint", "onedrive", "microsoft-teams"].includes(tool.id),
    plans: [
      { id: "microsoft-365", accessMode: "suite", labelFr: "Microsoft 365", labelEn: "Microsoft 365" },
      { id: "single-products", accessMode: "single_products", labelFr: "Produits séparés", labelEn: "Separate products" },
      { id: "team-employer", accessMode: "team_employer", labelFr: "Licence équipe ou employeur", labelEn: "Team or employer license" },
      { id: "client-paid", accessMode: "client_paid", labelFr: "Payé par un client", labelEn: "Paid by a client" },
      { id: "unknown", accessMode: "unknown", labelFr: "Je ne sais pas", labelEn: "I’m not sure" },
    ],
  },
  {
    id: "affinity",
    name: "Affinity",
    matches: (tool) => tool.id.startsWith("affinity-"),
    plans: [
      { id: "universal", accessMode: "suite", labelFr: "Licence universelle Affinity", labelEn: "Affinity Universal License" },
      { id: "single-products", accessMode: "single_products", labelFr: "Applications séparées", labelEn: "Separate apps" },
      { id: "one-time", accessMode: "one_time", labelFr: "Achat unique déjà payé", labelEn: "One-time purchase already paid" },
      { id: "client-paid", accessMode: "client_paid", labelFr: "Payé par un client", labelEn: "Paid by a client" },
      { id: "unknown", accessMode: "unknown", labelFr: "Je ne sais pas", labelEn: "I’m not sure" },
    ],
  },
  {
    id: "figma",
    name: "Figma",
    matches: (tool) => ["figma", "figjam", "figma-slides"].includes(tool.id),
    plans: [
      { id: "starter", accessMode: "free", labelFr: "Starter gratuit", labelEn: "Free Starter" },
      { id: "professional", accessMode: "single_products", labelFr: "Professional — siège payant", labelEn: "Professional — paid seat" },
      { id: "organization", accessMode: "single_products", labelFr: "Organization / Enterprise", labelEn: "Organization / Enterprise" },
      { id: "team-employer", accessMode: "team_employer", labelFr: "Payé par mon équipe ou employeur", labelEn: "Paid by my team or employer" },
      { id: "client-paid", accessMode: "client_paid", labelFr: "Payé par un client", labelEn: "Paid by a client" },
      { id: "unknown", accessMode: "unknown", labelFr: "Je ne sais pas", labelEn: "I’m not sure" },
    ],
  },
  {
    id: "canva",
    name: "Canva",
    matches: (tool) => ["canva", "canva-pro"].includes(tool.id),
    plans: [
      { id: "free", accessMode: "free", labelFr: "Canva Free", labelEn: "Canva Free" },
      { id: "pro", accessMode: "single_products", labelFr: "Canva Pro", labelEn: "Canva Pro" },
      { id: "teams", accessMode: "single_products", labelFr: "Canva Teams", labelEn: "Canva Teams" },
      { id: "team-employer", accessMode: "team_employer", labelFr: "Payé par mon équipe ou employeur", labelEn: "Paid by my team or employer" },
      { id: "client-paid", accessMode: "client_paid", labelFr: "Payé par un client", labelEn: "Paid by a client" },
      { id: "unknown", accessMode: "unknown", labelFr: "Je ne sais pas", labelEn: "I’m not sure" },
    ],
  },
];

function normalizedDomain(tool: Tool) {
  try {
    return tool.websiteUrl ? new URL(tool.websiteUrl).hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
}

export function commercialFamilyId(tool: Tool) {
  if (tool.commercial_family) return tool.commercial_family;
  const known = FAMILY_CONFIG.find((family) => family.matches(tool));
  if (known) return known.id;
  if (tool.bundle_parent) {
    const parentProxy = { ...tool, id: tool.bundle_parent };
    const parentFamily = FAMILY_CONFIG.find(
      (family) => family.id === tool.bundle_parent || family.matches(parentProxy)
    );
    if (parentFamily) return parentFamily.id;
  }
  if (tool.provider_id) return tool.provider_id;
  if (tool.bundle_parent) return tool.bundle_parent;
  const domain = normalizedDomain(tool);
  return domain || tool.id;
}

export function buildCommercialFamilies(tools: Tool[]): CommercialFamily[] {
  const groups = new Map<string, Tool[]>();
  tools.forEach((tool) => {
    const familyId = commercialFamilyId(tool);
    groups.set(familyId, [...(groups.get(familyId) || []), tool]);
  });

  return [...groups.entries()].map(([id, familyTools]) => {
    const configured = FAMILY_CONFIG.find((family) => family.id === id);
    return {
      id,
      name: configured?.name || familyTools[0]?.name || id,
      tools: familyTools,
      plans: configured?.plans || [
        { id: "single-products", accessMode: "single_products", labelFr: "Je paie cet outil", labelEn: "I pay for this tool" },
        { id: "team-employer", accessMode: "team_employer", labelFr: "Payé par mon entreprise", labelEn: "Paid by my employer" },
        { id: "client-paid", accessMode: "client_paid", labelFr: "Payé par un client", labelEn: "Paid by a client" },
        { id: "free", accessMode: "free", labelFr: "Gratuit", labelEn: "Free" },
        { id: "unknown", accessMode: "unknown", labelFr: "Je ne sais pas", labelEn: "I’m not sure" },
      ],
    };
  });
}

export function contractForFamily(
  contracts: CommercialContract[] = [],
  family: CommercialFamily
) {
  return contracts.find((contract) => contract.familyId === family.id);
}

export function contractsForFamily(
  contracts: CommercialContract[] = [],
  family: CommercialFamily
) {
  return contracts.filter((contract) => contract.familyId === family.id);
}

export function contractCoversProduct(
  contract: CommercialContract,
  productId: string,
) {
  return contract.productIds.includes(productId);
}

export function contractProductNames(
  contract: CommercialContract,
  tools: Tool[],
) {
  const byId = new Map(tools.map((tool) => [tool.id, tool.name]));
  return contract.productIds
    .map((productId) => byId.get(productId) || productId)
    .filter(Boolean);
}

export function productsCoveredByContract(
  family: CommercialFamily,
  plan: CommercialPlanOption
) {
  if (plan.includedProductIds) {
    const allowed = new Set(plan.includedProductIds);
    return family.tools.filter((tool) => allowed.has(tool.id)).map((tool) => tool.id);
  }
  return family.tools.map((tool) => tool.id);
}

export function contractMonthlyTotal(contracts: CommercialContract[] = []) {
  return contracts.reduce(
    (sum, contract) =>
      sum +
      (contract.confirmed
        ? Number(contract.monthlyPrice || 0) + Number(contract.variableMonthlyPrice || 0)
        : 0),
    0
  );
}

export function contractCoveredProductIds(contracts: CommercialContract[] = []) {
  return new Set(
    contracts
      .filter((contract) => contract.confirmed)
      .flatMap((contract) => contract.productIds)
  );
}

export function contractsCoveringProduct(
  contracts: CommercialContract[] = [],
  productId: string,
) {
  return contracts.filter((contract) => contract.productIds.includes(productId));
}
