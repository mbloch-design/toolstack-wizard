import { aiCapabilityLabel } from "@/lib/aiWorkflow";
import type {
  AiDiagnosticActorSummary,
  AiDiagnosticGlobalActorSummary,
  AiDiagnosticFinding,
  AiDiagnosticWorkflowSummary,
  AiAccessStatus,
  AiAllowanceStatus,
  AiCapabilityId,
  AiUsageConstraint,
  AiUsageFrequency,
  AiWorkflowActor,
  DiagnosticAiAnalysis,
  Prescription,
  SessionState,
  Tool,
} from "@/types/diagnostic";

const SOURCE_LABELS = {
  integrated: { fr: "Fonction intégrée", en: "Built-in feature" },
  external: { fr: "Outil IA séparé", en: "Separate AI tool" },
  automation: { fr: "Chaîne automatisée", en: "Automated chain" },
} as const;

const FREQUENCY_LABELS: Record<AiUsageFrequency, { fr: string; en: string }> = {
  occasional: { fr: "Ponctuel", en: "Occasional" },
  regular: { fr: "Régulier", en: "Regular" },
  systematic: { fr: "Quasi systématique", en: "Almost systematic" },
};

const CONSTRAINT_LABELS: Record<AiUsageConstraint, { fr: string; en: string }> = {
  none: { fr: "aucune limite notable", en: "no notable limit" },
  credits: { fr: "crédits payants", en: "paid credits" },
  quota: { fr: "quota d’usage", en: "usage quota" },
  reliability: { fr: "fiabilité variable", en: "variable reliability" },
  privacy: { fr: "confidentialité", en: "privacy" },
  rights: { fr: "droits et propriété", en: "rights and ownership" },
  unknown: { fr: "limites à préciser", en: "limits to clarify" },
};

const FREQUENCY_RANK: Record<AiUsageFrequency | "unknown", number> = {
  unknown: 0,
  occasional: 1,
  regular: 2,
  systematic: 3,
};

const TOOL_USAGE_RANK: Record<Tool["usage"], number> = {
  dormant: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const ACCESS_LABELS: Record<AiAccessStatus, { fr: string; en: string }> = {
  included: { fr: "Inclus dans le contrat", en: "Included in the contract" },
  included_limited: { fr: "Inclus avec quota ou crédits", en: "Included with quota or credits" },
  separate_subscription: { fr: "Abonnement séparé", en: "Separate subscription" },
  usage_based: { fr: "Facturé à l’usage ou en crédits", en: "Usage or credit based" },
  sponsored: { fr: "Payé par l’équipe ou un client", en: "Paid by the team or a client" },
  free: { fr: "Accès gratuit", en: "Free access" },
  unresolved: { fr: "Accès à préciser", en: "Access to clarify" },
};

const ALLOWANCE_LABELS: Record<AiAllowanceStatus, { fr: string; en: string }> = {
  enough: { fr: "Enveloppe suffisante", en: "Allowance sufficient" },
  sometimes_limited: { fr: "Limite occasionnelle", en: "Occasional limit" },
  frequently_limited: { fr: "Limite fréquente", en: "Frequent limit" },
  extra_purchases: { fr: "Recharges ou dépassements", en: "Top-ups or overages" },
  unknown: { fr: "Consommation à préciser", en: "Consumption to clarify" },
};

function actorContract(
  contracts: NonNullable<SessionState["commercialContracts"]>,
  actor: AiWorkflowActor
) {
  const productIds = [actor.featureToolId, actor.toolId].filter(
    (id): id is string => Boolean(id)
  );
  return contracts.find(
    (contract) =>
      productIds.some((productId) => contract.productIds.includes(productId))
  );
}

function actorAccessStatus(
  actor: AiWorkflowActor,
  contract: ReturnType<typeof actorContract> | undefined,
  tool?: Tool
): AiAccessStatus {
  if (!contract || !contract.confirmed) {
    const hasSelectedCoveringPlan = Boolean(
      contract &&
      contract.planId &&
      contract.planId !== "unknown" &&
      actor.source === "integrated"
    );
    if (hasSelectedCoveringPlan) {
      const constraints = new Set(actor.constraints || []);
      return constraints.has("credits") || constraints.has("quota")
        ? "included_limited"
        : "included";
    }
    if (tool?.selectedOffer === "free") return "free";
    if (tool?.selectedOffer === "credits" || tool?.selectedOffer === "usage") {
      return "usage_based";
    }
    return "unresolved";
  }
  if (contract.aiAllowanceStatus === "extra_purchases") return "usage_based";
  if (contract.accessMode === "free") return "free";
  if (["team_employer", "client_paid", "included_elsewhere"].includes(contract.accessMode)) {
    return "sponsored";
  }
  if (contract.accessMode === "usage_based") return "usage_based";
  if (actor.source === "integrated") {
    if (contract.aiAllowanceStatus === "enough") return "included";
    const constraints = new Set(actor.constraints || []);
    return constraints.has("credits") || constraints.has("quota")
      ? "included_limited"
      : "included";
  }
  return "separate_subscription";
}

function actorName(
  toolMap: Map<string, Tool>,
  actor: AiWorkflowActor
) {
  if (actor.toolId) return toolMap.get(actor.toolId)?.name || actor.toolId;
  return actor.source === "automation" ? "Automation" : "AI";
}

function actorKey(actor: AiWorkflowActor, objectiveId: string) {
  const identity = actor.featureToolId || actor.toolId;
  return identity ? `tool:${identity}` : `${actor.source}:workflow:${objectiveId}`;
}

function summarizeActor(
  toolMap: Map<string, Tool>,
  contracts: NonNullable<SessionState["commercialContracts"]>,
  actor: AiWorkflowActor,
  objectiveId: string
): AiDiagnosticActorSummary {
  const sourceLabel = SOURCE_LABELS[actor.source];
  const frequencyLabel = actor.frequency ? FREQUENCY_LABELS[actor.frequency] : undefined;
  const hostTool = actor.toolId ? toolMap.get(actor.toolId) : undefined;
  const contract = actorContract(contracts, actor);
  const accessStatus = actorAccessStatus(actor, contract, hostTool);
  const accessLabel = ACCESS_LABELS[accessStatus];
  const allowanceLabel = contract?.aiAllowanceStatus
    ? ALLOWANCE_LABELS[contract.aiAllowanceStatus]
    : undefined;
  return {
    id: actor.id,
    actorKey: actorKey(actor, objectiveId),
    source: actor.source,
    sourceLabelFr: sourceLabel.fr,
    sourceLabelEn: sourceLabel.en,
    toolId: actor.toolId,
    toolName: actor.featureName || actorName(toolMap, actor),
    hostToolName: actor.source === "integrated" ? hostTool?.name : undefined,
    featureToolId: actor.featureToolId,
    featureName: actor.featureName,
    accessStatus,
    accessLabelFr: accessLabel.fr,
    accessLabelEn: accessLabel.en,
    commercialContractId: contract?.id,
    commercialContractName: contract?.familyName,
    allowanceStatus: contract?.aiAllowanceStatus,
    allowanceLabelFr: allowanceLabel?.fr,
    allowanceLabelEn: allowanceLabel?.en,
    variableMonthlyCost: contract?.variableMonthlyPrice,
    capabilityIds: actor.capabilityIds,
    capabilityLabelsFr: actor.capabilityIds.map((id) => aiCapabilityLabel(id).labelFr),
    capabilityLabelsEn: actor.capabilityIds.map((id) => aiCapabilityLabel(id).labelEn),
    frequency: actor.frequency,
    frequencyLabelFr: frequencyLabel?.fr,
    frequencyLabelEn: frequencyLabel?.en,
    constraints: (actor.constraints || []).filter((constraint) => constraint !== "none"),
    handlesSensitiveData: actor.handlesSensitiveData === true,
  };
}

function highestFrequency(
  frequencies: Array<AiUsageFrequency | undefined>
): AiUsageFrequency | undefined {
  return frequencies
    .filter((frequency): frequency is AiUsageFrequency => Boolean(frequency))
    .sort((a, b) => FREQUENCY_RANK[b] - FREQUENCY_RANK[a])[0];
}

function buildGlobalActors(
  workflows: AiDiagnosticWorkflowSummary[]
): AiDiagnosticGlobalActorSummary[] {
  const grouped = new Map<
    string,
    Array<{ workflow: AiDiagnosticWorkflowSummary; actor: AiDiagnosticActorSummary }>
  >();
  workflows.forEach((workflow) => {
    workflow.actors.forEach((actor) => {
      grouped.set(actor.actorKey, [
        ...(grouped.get(actor.actorKey) || []),
        { workflow, actor },
      ]);
    });
  });

  return [...grouped.entries()]
    .map(([key, occurrences]) => {
      const first = occurrences[0].actor;
      const frequency = highestFrequency(
        occurrences.map(({ actor }) => actor.frequency)
      );
      const frequencyLabel = frequency ? FREQUENCY_LABELS[frequency] : undefined;
      const capabilityIds = [
        ...new Set(
          occurrences.flatMap(({ actor }) => actor.capabilityIds)
        ),
      ];
      const constraints = [
        ...new Set(
          occurrences.flatMap(({ actor }) => actor.constraints)
        ),
      ];
      const sources = [
        ...new Set(occurrences.map(({ actor }) => actor.source)),
      ];
      const roles = occurrences.map(({ workflow, actor }) => ({
        objectiveId: workflow.objectiveId,
        objectiveLabelFr: workflow.objectiveLabelFr,
        objectiveLabelEn: workflow.objectiveLabelEn,
        source: actor.source,
        sourceLabelFr: actor.sourceLabelFr,
        sourceLabelEn: actor.sourceLabelEn,
        capabilityIds: actor.capabilityIds,
        capabilityLabelsFr: actor.capabilityLabelsFr,
        capabilityLabelsEn: actor.capabilityLabelsEn,
        frequency: actor.frequency,
        frequencyLabelFr: actor.frequencyLabelFr,
        frequencyLabelEn: actor.frequencyLabelEn,
      }));

      return {
        ...first,
        id: key,
        actorKey: key,
        sourceLabelFr:
          sources.length > 1 ? "Plusieurs modes" : first.sourceLabelFr,
        sourceLabelEn:
          sources.length > 1 ? "Multiple modes" : first.sourceLabelEn,
        capabilityIds,
        capabilityLabelsFr: capabilityIds.map(
          (id) => aiCapabilityLabel(id).labelFr
        ),
        capabilityLabelsEn: capabilityIds.map(
          (id) => aiCapabilityLabel(id).labelEn
        ),
        frequency,
        frequencyLabelFr: frequencyLabel?.fr,
        frequencyLabelEn: frequencyLabel?.en,
        constraints,
        handlesSensitiveData: occurrences.some(
          ({ actor }) => actor.handlesSensitiveData
        ),
        sources,
        objectiveCount: roles.length,
        roles,
      };
    })
    .sort(
      (a, b) =>
        b.objectiveCount - a.objectiveCount ||
        a.toolName.localeCompare(b.toolName)
    );
}

function severityRank(severity: AiDiagnosticFinding["severity"]) {
  return { high: 3, medium: 2, low: 1 }[severity];
}

function findingActorKeys(
  finding: AiDiagnosticFinding,
  workflows: AiDiagnosticWorkflowSummary[]
) {
  const workflow = workflows.find(
    (candidate) => candidate.objectiveId === finding.objectiveId
  );
  return (finding.actorIds || []).flatMap((actorId) => {
    const actor = workflow?.actors.find((candidate) => candidate.id === actorId);
    return actor ? [actor.actorKey] : [];
  });
}

function findingGroupKey(
  finding: AiDiagnosticFinding,
  workflows: AiDiagnosticWorkflowSummary[]
) {
  const keys = findingActorKeys(finding, workflows).sort();
  const actors = workflows
    .flatMap((workflow) => workflow.actors)
    .filter((actor) => keys.includes(actor.actorKey));
  const contractIds = [
    ...new Set(
      actors.flatMap((actor) =>
        actor.commercialContractId ? [actor.commercialContractId] : []
      )
    ),
  ].sort();

  if (finding.kind === "access_gap" || finding.kind === "usage_pressure") {
    return `${finding.kind}:${contractIds.join("+") || keys.join("+") || finding.objectiveId}`;
  }
  if (finding.kind === "risk" || finding.kind === "mapping_gap") {
    return `${finding.kind}:${keys.join("+") || finding.objectiveId}`;
  }
  if (finding.kind === "overlap") {
    return `${finding.kind}:${finding.capabilityId || "unknown"}:${keys.join("+")}`;
  }
  return `${finding.kind}:${finding.objectiveId}`;
}

function dedupeFindings(
  findings: AiDiagnosticFinding[],
  workflows: AiDiagnosticWorkflowSummary[]
) {
  const grouped = new Map<string, AiDiagnosticFinding[]>();
  findings.forEach((finding) => {
    const key = findingGroupKey(finding, workflows);
    grouped.set(key, [...(grouped.get(key) || []), finding]);
  });

  return [...grouped.values()]
    .map((occurrences) => {
      const first = occurrences[0];
      const objectiveIds = [
        ...new Set(occurrences.map((finding) => finding.objectiveId)),
      ];
      const objectiveLabelsFr = objectiveIds.map(
        (objectiveId) =>
          workflows.find((workflow) => workflow.objectiveId === objectiveId)
            ?.objectiveLabelFr || objectiveId
      );
      const objectiveLabelsEn = objectiveIds.map(
        (objectiveId) =>
          workflows.find((workflow) => workflow.objectiveId === objectiveId)
            ?.objectiveLabelEn || objectiveId
      );
      const actorKeys = [
        ...new Set(
          occurrences.flatMap((finding) =>
            findingActorKeys(finding, workflows)
          )
        ),
      ];
      const actors = workflows
        .flatMap((workflow) => workflow.actors)
        .filter((actor) => actorKeys.includes(actor.actorKey));
      const contractNames = [
        ...new Set(
          actors.flatMap((actor) =>
            actor.commercialContractName ? [actor.commercialContractName] : []
          )
        ),
      ];
      const hasVariableCost = actors.some(
        (actor) => Number(actor.variableMonthlyCost || 0) > 0
      );
      const detailFr = first.kind === "risk" && occurrences.length > 1
        ? [...new Set(occurrences.map((finding) => finding.detailFr))].join(" ")
        : objectiveIds.length > 1
          ? `${first.detailFr} Concerne ${objectiveIds.length} étapes : ${objectiveLabelsFr.join(", ")}.`
          : first.detailFr;
      const detailEn = first.kind === "risk" && occurrences.length > 1
        ? [...new Set(occurrences.map((finding) => finding.detailEn))].join(" ")
        : objectiveIds.length > 1
          ? `${first.detailEn} Applies to ${objectiveIds.length} steps: ${objectiveLabelsEn.join(", ")}.`
          : first.detailEn;
      const labelFr =
        occurrences.length > 1 &&
        contractNames.length === 1 &&
        first.kind === "access_gap"
          ? `Accès IA à préciser — ${contractNames[0]}`
          : occurrences.length > 1 &&
              contractNames.length === 1 &&
              first.kind === "usage_pressure"
            ? `${hasVariableCost ? "Coût IA variable" : "Enveloppe IA à surveiller"} — ${contractNames[0]}`
            : first.labelFr;
      const labelEn =
        occurrences.length > 1 &&
        contractNames.length === 1 &&
        first.kind === "access_gap"
          ? `AI access to clarify — ${contractNames[0]}`
          : occurrences.length > 1 &&
              contractNames.length === 1 &&
              first.kind === "usage_pressure"
            ? `${hasVariableCost ? "Variable AI cost" : "AI allowance to monitor"} — ${contractNames[0]}`
            : first.labelEn;

      return {
        ...first,
        labelFr,
        labelEn,
        severity: occurrences
          .map((finding) => finding.severity)
          .sort((a, b) => severityRank(b) - severityRank(a))[0],
        detailFr,
        detailEn,
        actionFr: [
          ...new Set(occurrences.map((finding) => finding.actionFr)),
        ].join(" "),
        actionEn: [
          ...new Set(occurrences.map((finding) => finding.actionEn)),
        ].join(" "),
        objectiveIds,
        objectiveLabelsFr,
        objectiveLabelsEn,
        occurrenceCount: occurrences.length,
        toolIds: [
          ...new Set(occurrences.flatMap((finding) => finding.toolIds)),
        ],
        actorIds: [
          ...new Set(
            occurrences.flatMap((finding) => finding.actorIds || [])
          ),
        ],
        actorKeys,
        reviewRecommended: occurrences.some(
          (finding) => finding.reviewRecommended
        ),
      };
    })
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function buildAllowanceFinding(
  workflow: AiDiagnosticWorkflowSummary,
  actor: AiDiagnosticActorSummary
): AiDiagnosticFinding | null {
  const hasAllowanceConstraint =
    actor.constraints.includes("credits") || actor.constraints.includes("quota");
  if (!hasAllowanceConstraint) return null;
  if (actor.accessStatus === "unresolved" && !actor.allowanceStatus) return null;
  if (actor.allowanceStatus === "enough") return null;

  const status = actor.allowanceStatus;
  const severity =
    status === "frequently_limited" ||
    status === "extra_purchases" ||
    (!status && actor.frequency === "systematic")
      ? "medium"
      : "low";
  const variableCost = Number(actor.variableMonthlyCost || 0);
  const detailFr =
    status === "extra_purchases"
      ? `${workflow.objectiveLabelFr} nécessite des recharges ou dépassements${variableCost > 0 ? ` d’environ ${variableCost} €/mois` : ""}.`
      : status === "frequently_limited"
        ? `${workflow.objectiveLabelFr} est régulièrement ralenti ou bloqué par la limite d’usage.`
        : status === "sometimes_limited"
          ? `${workflow.objectiveLabelFr} rencontre parfois la limite incluse.`
          : `${workflow.objectiveLabelFr} dépend de crédits ou d’un quota dont l’impact réel reste inconnu.`;
  const detailEn =
    status === "extra_purchases"
      ? `${workflow.objectiveLabelEn} requires top-ups or overages${variableCost > 0 ? ` of about €${variableCost}/month` : ""}.`
      : status === "frequently_limited"
        ? `${workflow.objectiveLabelEn} is regularly slowed down or blocked by the usage limit.`
        : status === "sometimes_limited"
          ? `${workflow.objectiveLabelEn} sometimes reaches the included limit.`
          : `${workflow.objectiveLabelEn} depends on credits or a quota whose real impact is still unknown.`;

  return {
    id: `ai-allowance-${workflow.objectiveId}-${actor.id}`,
    kind: "usage_pressure",
    severity,
    labelFr:
      status === "extra_purchases"
        ? `Coût IA variable — ${actor.toolName}`
        : `Enveloppe IA à surveiller — ${actor.toolName}`,
    labelEn:
      status === "extra_purchases"
        ? `Variable AI cost — ${actor.toolName}`
        : `AI allowance to monitor — ${actor.toolName}`,
    detailFr,
    detailEn,
    actionFr:
      status === "extra_purchases"
        ? "Comparer le coût total réel avec un palier supérieur ou une autre capacité avant d’ajouter un nouvel outil."
        : "Mesurer la fréquence des blocages pendant un mois avant de changer de formule ou d’outil.",
    actionEn:
      status === "extra_purchases"
        ? "Compare the real total cost with a higher tier or another capability before adding a new tool."
        : "Measure how often limits block work for one month before changing plan or tool.",
    objectiveId: workflow.objectiveId,
    toolIds: actor.toolId ? [actor.toolId] : [],
    actorIds: [actor.id],
    reviewRecommended: severity === "medium",
  };
}

function buildAccessFinding(
  workflow: AiDiagnosticWorkflowSummary,
  actor: AiDiagnosticActorSummary
): AiDiagnosticFinding | null {
  if (actor.accessStatus !== "unresolved") return null;
  const severity =
    actor.frequency === "systematic" ||
    actor.constraints.includes("credits") ||
    actor.constraints.includes("quota")
      ? "medium"
      : "low";
  const actorContext = actor.hostToolName && actor.hostToolName !== actor.toolName
    ? `${actor.toolName} dans ${actor.hostToolName}`
    : actor.toolName;
  const actorContextEn = actor.hostToolName && actor.hostToolName !== actor.toolName
    ? `${actor.toolName} in ${actor.hostToolName}`
    : actor.toolName;
  return {
    id: `ai-access-${workflow.objectiveId}-${actor.id}`,
    kind: "access_gap",
    severity,
    labelFr: `Accès IA à préciser — ${actor.toolName}`,
    labelEn: `AI access to clarify — ${actor.toolName}`,
    detailFr: `${workflow.objectiveLabelFr} utilise ${actorContext}, mais Tooltrim ne sait pas encore quel contrat, quota ou achat le finance.`,
    detailEn: `${workflow.objectiveLabelEn} uses ${actorContextEn}, but Tooltrim does not yet know which contract, quota, or purchase funds it.`,
    actionFr: "Rattacher cette capacité au contrat existant ou confirmer qu’elle est payée séparément.",
    actionEn: "Link this capability to the existing contract or confirm that it is paid separately.",
    objectiveId: workflow.objectiveId,
    toolIds: actor.toolId ? [actor.toolId] : [],
    actorIds: [actor.id],
    reviewRecommended: severity === "medium",
  };
}

function riskSeverity(actor: AiDiagnosticActorSummary) {
  const constraints = new Set(actor.constraints);
  if (
    (actor.handlesSensitiveData && constraints.has("privacy")) ||
    (actor.frequency === "systematic" && (
      constraints.has("rights") ||
      constraints.has("reliability")
    ))
  ) {
    return "high" as const;
  }
  if (actor.handlesSensitiveData || actor.constraints.length > 0) {
    return "medium" as const;
  }
  return "low" as const;
}

function riskAction(actor: AiDiagnosticActorSummary) {
  const constraints = new Set(actor.constraints);
  if (actor.handlesSensitiveData || constraints.has("privacy")) {
    return {
      fr: "Définir quels fichiers ou données peuvent être envoyés à cette IA, puis vérifier stockage, réutilisation et accès.",
      en: "Define which files or data may be sent to this AI, then verify storage, reuse, and access.",
    };
  }
  if (constraints.has("rights")) {
    return {
      fr: "Vérifier les droits d’entrée et de sortie avant d’utiliser le résultat dans un livrable client.",
      en: "Review input and output rights before using the result in a client deliverable.",
    };
  }
  if (constraints.has("reliability")) {
    return {
      fr: "Ajouter un contrôle humain explicite avant validation ou livraison.",
      en: "Add an explicit human check before approval or delivery.",
    };
  }
  if (constraints.has("credits") || constraints.has("quota")) {
    return {
      fr: "Suivre la consommation réelle et rattacher les crédits au contrat qui les finance.",
      en: "Track actual consumption and link credits to the contract that funds them.",
    };
  }
  return {
    fr: "Clarifier les limites avant de rendre cette IA indispensable au workflow.",
    en: "Clarify the limits before making this AI essential to the workflow.",
  };
}

function buildActorRiskFinding(
  workflow: AiDiagnosticWorkflowSummary,
  actor: AiDiagnosticActorSummary
): AiDiagnosticFinding | null {
  const riskConstraints = actor.constraints.filter(
    (constraint) => !["credits", "quota"].includes(constraint)
  );
  if (!actor.handlesSensitiveData && riskConstraints.length === 0) return null;
  const riskActor = { ...actor, constraints: riskConstraints };
  const severity = riskSeverity(riskActor);
  const constraintsFr = riskConstraints.map((constraint) => CONSTRAINT_LABELS[constraint].fr);
  const constraintsEn = riskConstraints.map((constraint) => CONSTRAINT_LABELS[constraint].en);
  const sensitiveFr = actor.handlesSensitiveData ? "données ou fichiers sensibles" : "";
  const sensitiveEn = actor.handlesSensitiveData ? "sensitive data or files" : "";
  const detailsFr = [...constraintsFr, sensitiveFr].filter(Boolean).join(", ");
  const detailsEn = [...constraintsEn, sensitiveEn].filter(Boolean).join(", ");
  const action = riskAction(riskActor);

  return {
    id: `ai-risk-${workflow.objectiveId}-${actor.id}`,
    kind: "risk",
    severity,
    labelFr: `Risque IA à cadrer — ${actor.toolName}`,
    labelEn: `AI risk to frame — ${actor.toolName}`,
    detailFr: `${workflow.objectiveLabelFr} : ${detailsFr}.`,
    detailEn: `${workflow.objectiveLabelEn}: ${detailsEn}.`,
    actionFr: action.fr,
    actionEn: action.en,
    objectiveId: workflow.objectiveId,
    toolIds: actor.toolId ? [actor.toolId] : [],
    actorIds: [actor.id],
    reviewRecommended: true,
  };
}

function buildOverlapFindings(
  workflow: AiDiagnosticWorkflowSummary
): AiDiagnosticFinding[] {
  const byCapability = new Map<string, AiDiagnosticActorSummary[]>();
  workflow.actors.forEach((actor) => {
    actor.capabilityIds.forEach((capabilityId) => {
      const actors = byCapability.get(capabilityId) || [];
      actors.push(actor);
      byCapability.set(capabilityId, actors);
    });
  });

  return Array.from(byCapability.entries()).flatMap(([capabilityId, actors]) => {
    const distinctActors = actors.filter(
      (actor, index, list) =>
        list.findIndex((candidate) => candidate.id === actor.id) === index
    );
    if (distinctActors.length < 2) return [];

    const paidOrSeparateActors = distinctActors.filter(
      (actor) => actor.source !== "integrated" && actor.toolId
    );
    const reviewRecommended = paidOrSeparateActors.length >= 2;
    const activeActors = distinctActors.filter(
      (actor) => FREQUENCY_RANK[actor.frequency || "unknown"] >= 2
    );
    const severity = reviewRecommended && activeActors.length >= 2 ? "medium" : "low";
    const capability = aiCapabilityLabel(capabilityId as AiCapabilityId);
    const names = distinctActors.map((actor) => actor.toolName).join(" + ");

    return [{
      id: `ai-overlap-${workflow.objectiveId}-${capabilityId}`,
      kind: "overlap",
      severity,
      labelFr: reviewRecommended ? "Chevauchement IA à arbitrer" : "Rôles IA à différencier",
      labelEn: reviewRecommended ? "AI overlap to decide" : "AI roles to differentiate",
      detailFr: `${names} couvrent « ${capability.labelFr} » dans ${workflow.objectiveLabelFr}.`,
      detailEn: `${names} cover “${capability.labelEn}” in ${workflow.objectiveLabelEn}.`,
      actionFr: reviewRecommended
        ? "Comparer les entrées, sorties et fréquences ; garder les deux seulement si leurs rôles sont réellement distincts."
        : "Vérifier que la fonction intégrée et l’outil séparé correspondent à deux moments différents du travail.",
      actionEn: reviewRecommended
        ? "Compare inputs, outputs, and frequency; keep both only if their roles are truly distinct."
        : "Check that the built-in feature and separate tool belong to two different moments of the work.",
      objectiveId: workflow.objectiveId,
      toolIds: distinctActors.flatMap((actor) => actor.toolId ? [actor.toolId] : []),
      actorIds: distinctActors.map((actor) => actor.id),
      capabilityId: capability.id,
      reviewRecommended,
    } satisfies AiDiagnosticFinding];
  });
}

export function buildAiDiagnosticAnalysis(
  sessionState: Pick<SessionState, "selectedTools" | "workflowUsages" | "commercialContracts">
): DiagnosticAiAnalysis {
  const toolMap = new Map(sessionState.selectedTools.map((tool) => [tool.id, tool]));
  const contracts = sessionState.commercialContracts || [];
  const workflows: AiDiagnosticWorkflowSummary[] = (sessionState.workflowUsages || [])
    .filter((usage) =>
      (usage.aiActors || []).length > 0 ||
      (usage.aiMode !== "none" && usage.aiMode !== "unknown")
    )
    .map((usage) => ({
      objectiveId: usage.objectiveId,
      objectiveLabelFr: usage.objectiveLabelFr,
      objectiveLabelEn: usage.objectiveLabelEn,
      mode: usage.aiMode,
      actors: (usage.aiActors || []).map((actor) =>
        summarizeActor(toolMap, contracts, actor, usage.objectiveId)
      ),
    }));

  const findings: AiDiagnosticFinding[] = [];
  workflows.forEach((workflow) => {
    workflow.actors.forEach((actor) => {
      const accessFinding = buildAccessFinding(workflow, actor);
      if (accessFinding) findings.push(accessFinding);
      const allowanceFinding = buildAllowanceFinding(workflow, actor);
      if (allowanceFinding) findings.push(allowanceFinding);
      const risk = buildActorRiskFinding(workflow, actor);
      if (risk) findings.push(risk);
      if (actor.capabilityIds.length === 0) {
        findings.push({
          id: `ai-mapping-gap-${workflow.objectiveId}-${actor.id}`,
          kind: "mapping_gap",
          severity: "low",
          labelFr: `Rôle IA à préciser — ${actor.toolName}`,
          labelEn: `AI role to clarify — ${actor.toolName}`,
          detailFr: `${workflow.objectiveLabelFr} mentionne cette IA sans préciser ce qu’elle accomplit.`,
          detailEn: `${workflow.objectiveLabelEn} mentions this AI without specifying what it does.`,
          actionFr: "Nommer la tâche réellement déléguée avant d’évaluer coût, risque ou doublon.",
          actionEn: "Name the task actually delegated before evaluating cost, risk, or overlap.",
          objectiveId: workflow.objectiveId,
          toolIds: actor.toolId ? [actor.toolId] : [],
          actorIds: [actor.id],
          reviewRecommended: false,
        });
      }
    });
    findings.push(...buildOverlapFindings(workflow));
  });

  (sessionState.workflowUsages || []).forEach((usage) => {
    const hasMappedAi = (usage.aiActors || []).some(
      (actor) => actor.capabilityIds.length > 0
    );
    if (
      !hasMappedAi &&
      (usage.aiMode === "none" || usage.aiMode === "unknown") &&
      (usage.satisfaction === "friction" || usage.satisfaction === "blocked")
    ) {
      findings.push({
        id: `ai-opportunity-${usage.objectiveId}`,
        kind: "automation_opportunity",
        severity: usage.satisfaction === "blocked" ? "medium" : "low",
        labelFr: "Étape à explorer avant d’ajouter un outil",
        labelEn: "Step to explore before adding a tool",
        detailFr: `${usage.objectiveLabelFr} crée une friction, sans rôle IA ou automatisation cartographié.`,
        detailEn: `${usage.objectiveLabelEn} creates friction, with no mapped AI or automation role.`,
        actionFr: "Isoler d’abord la tâche répétitive ou fragile ; tester ensuite une automatisation courte, sans remplacer tout le workflow.",
        actionEn: "First isolate the repetitive or fragile task; then test a small automation without replacing the whole workflow.",
        objectiveId: usage.objectiveId,
        toolIds: usage.toolIds,
        reviewRecommended: true,
      });
    }
  });

  const actorOccurrences = workflows.flatMap((workflow) => workflow.actors);
  const globalActors = buildGlobalActors(workflows);
  const dedupedFindings = dedupeFindings(findings, workflows);
  const capabilityKeys = new Set(
    globalActors.flatMap((actor) =>
      actor.capabilityIds.map(
        (capabilityId) => `${actor.actorKey}:${capabilityId}`
      )
    )
  );

  return {
    objectiveCount: workflows.length,
    actorCount: globalActors.length,
    actorOccurrenceCount: actorOccurrences.length,
    capabilityCount: capabilityKeys.size,
    integratedActorCount: globalActors.filter((actor) => actor.source === "integrated").length,
    externalActorCount: globalActors.filter((actor) => actor.source === "external").length,
    automationActorCount: globalActors.filter((actor) => actor.source === "automation").length,
    systematicActorCount: globalActors.filter((actor) => actor.frequency === "systematic").length,
    constrainedActorCount: globalActors.filter(
      (actor) => actor.handlesSensitiveData || actor.constraints.length > 0
    ).length,
    resolvedAccessCount: globalActors.filter((actor) => actor.accessStatus !== "unresolved").length,
    unresolvedAccessCount: globalActors.filter((actor) => actor.accessStatus === "unresolved").length,
    globalActors,
    workflows,
    findings: dedupedFindings,
  };
}

export function buildPreciseAiOverlapPrescriptions(
  sessionState: Pick<SessionState, "selectedTools" | "workflowUsages">
): Prescription[] {
  const analysis = buildAiDiagnosticAnalysis(sessionState);
  const toolMap = new Map(sessionState.selectedTools.map((tool) => [tool.id, tool]));

  return analysis.findings.flatMap((finding): Prescription[] => {
    if (
      finding.kind !== "overlap" ||
      !finding.reviewRecommended ||
      !finding.capabilityId
    ) {
      return [];
    }
    const relevantObjectiveIds = finding.objectiveIds || [finding.objectiveId];
    const relevantWorkflows = analysis.workflows.filter((candidate) =>
      relevantObjectiveIds.includes(candidate.objectiveId)
    );
    const candidatesByTool = new Map<
      string,
      { actor: AiDiagnosticActorSummary; tool: Tool }
    >();
    relevantWorkflows
      .flatMap((workflow) => workflow.actors)
      .filter(
        (actor) =>
          actor.source !== "integrated" &&
          actor.toolId &&
          actor.capabilityIds.includes(finding.capabilityId!)
      )
      .map((actor) => ({ actor, tool: toolMap.get(actor.toolId!) }))
      .filter((item): item is { actor: AiDiagnosticActorSummary; tool: Tool } =>
        Boolean(item.tool)
      )
      .forEach((item) => {
        const current = candidatesByTool.get(item.tool.id);
        if (
          !current ||
          FREQUENCY_RANK[item.actor.frequency || "unknown"] >
            FREQUENCY_RANK[current.actor.frequency || "unknown"]
        ) {
          candidatesByTool.set(item.tool.id, item);
        }
      });
    const candidates = [...candidatesByTool.values()]
      .sort((a, b) =>
        FREQUENCY_RANK[a.actor.frequency || "unknown"] -
          FREQUENCY_RANK[b.actor.frequency || "unknown"] ||
        TOOL_USAGE_RANK[a.tool.usage] - TOOL_USAGE_RANK[b.tool.usage] ||
        b.tool.price - a.tool.price
      );
    if (candidates.length < 2) return [];
    const challenged = candidates[0];
    const protectedActor = candidates[candidates.length - 1];
    const capability = aiCapabilityLabel(finding.capabilityId);

    return [{
      toolId: challenged.tool.id,
      type: "doublon-ia",
      verdict: "review",
      message: `${challenged.tool.name} et ${protectedActor.tool.name} couvrent tous deux « ${capability.labelFr} » dans ${relevantWorkflows.map((workflow) => workflow.objectiveLabelFr).join(", ")}. Clarifie leurs rôles avant de conserver les deux.`,
      savingsEstimate: challenged.tool.price,
    }];
  });
}
