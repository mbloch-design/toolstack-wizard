import type { CreativeSpecialty, Persona, SessionState, Tool } from "@/types/diagnostic";
import { getCreativeSpecialtyCopy, isCreativeSpecialty } from "@/utils/creativeSpecialty";
import { CREATIVE_RECOMMENDATION_FAMILIES } from "@/utils/scoring";

type RecommendationNarrative = {
  badgeFr: string;
  badgeEn: string;
  reasonFr: string;
  reasonEn: string;
  detailFr: string;
  detailEn: string;
  evidenceFr: string;
  evidenceEn: string;
  actionTitleFr: string;
  actionTitleEn: string;
};

type CreativeNarrativeRule = {
  ids: readonly string[];
  badgeFr: string;
  badgeEn: string;
  goalFr: string;
  goalEn: string;
  detailFr: string;
  detailEn: string;
};

const PERSONA_REASONS: Record<Persona, { fr: string; en: string }> = {
  THEO: { fr: "Pertinent pour un workflow produit plus automatisé", en: "Relevant for a more automated product workflow" },
  SOFIA: { fr: "Pertinent pour fiabiliser le workflow créatif", en: "Relevant to make the creative workflow more reliable" },
  MARC: { fr: "Pertinent pour mieux structurer l'activité client", en: "Relevant to better structure client work" },
  ALIX: { fr: "Pertinent pour tenir une cadence de publication", en: "Relevant to sustain a publishing cadence" },
  CLAIRE: { fr: "Pertinent pour clarifier l'exécution quotidienne", en: "Relevant to clarify day-to-day execution" },
};

const CREATIVE_RULES: Record<CreativeSpecialty, CreativeNarrativeRule[]> = {
  ui_product: [
    {
      ids: ["figma-tokens", "figma-iconify", "figma-stark"],
      badgeFr: "Système design",
      badgeEn: "Design system",
      goalFr: "fiabiliser le système design",
      goalEn: "stabilize the design system",
      detailFr: "Ce maillon sert à garder composants, tokens, icônes et accessibilité cohérents quand la stack produit grandit.",
      detailEn: "This link keeps components, tokens, icons and accessibility aligned as the product stack grows.",
    },
    {
      ids: ["figma-anima", "zeplin", "protopie"],
      badgeFr: "Handoff UI",
      badgeEn: "UI handoff",
      goalFr: "fluidifier le handoff produit",
      goalEn: "smooth the product handoff",
      detailFr: "Le manque n'est pas dans l'outil principal, mais dans le passage design -> prototype -> équipe.",
      detailEn: "The gap is not in the main tool, but in the design -> prototype -> team handoff.",
    },
    {
      ids: ["rive", "spline"],
      badgeFr: "Interactions",
      badgeEn: "Interactions",
      goalFr: "prototyper les interactions sans bricolage",
      goalEn: "prototype interactions without patchwork",
      detailFr: "Cette recommandation sert à rendre les interactions plus lisibles avant livraison, sans surcharger Figma.",
      detailEn: "This recommendation makes interactions clearer before delivery without overloading Figma.",
    },
  ],
  brand_identity: [
    {
      ids: ["brandpad", "brand-kits"],
      badgeFr: "Gouvernance marque",
      badgeEn: "Brand governance",
      goalFr: "centraliser la marque",
      goalEn: "centralize the brand",
      detailFr: "Le gain vient d'un socle partagé pour les règles, templates et assets, pas seulement de l'outil de création.",
      detailEn: "The gain comes from a shared foundation for rules, templates and assets, not just the creation tool.",
    },
    {
      ids: ["fontbase", "rightfont"],
      badgeFr: "Fonts",
      badgeEn: "Fonts",
      goalFr: "sécuriser les fonts",
      goalEn: "secure the font layer",
      detailFr: "Ce maillon évite les pertes de temps sur les versions de police, les licences et les allers-retours entre machines.",
      detailEn: "This link avoids losing time on font versions, licensing and cross-device handoffs.",
    },
    {
      ids: ["envato-elements", "dynamic-mockups", "icons8", "hugeicons"],
      badgeFr: "Déclinaisons",
      badgeEn: "Variations",
      goalFr: "accélérer les déclinaisons",
      goalEn: "accelerate creative variations",
      detailFr: "La recommandation comble le maillon ressources/mockups/icônes qui accélère les livrables sans multiplier les créations ad hoc.",
      detailEn: "This recommendation fills the resources/mockups/icons link that speeds up deliverables without multiplying ad hoc work.",
    },
  ],
  motion_video: [
    {
      ids: ["frame-io", "descript"],
      badgeFr: "Review vidéo",
      badgeEn: "Video review",
      goalFr: "fluidifier la review vidéo",
      goalEn: "smooth video review",
      detailFr: "Le vrai manque vient souvent des validations, commentaires et versions, plus que du logiciel de montage lui-même.",
      detailEn: "The real gap often comes from review, comments and versioning more than from the editor itself.",
    },
    {
      ids: ["ae-animation-composer", "motion-bro", "ae-overlord", "ae-duik", "ae-red-giant", "topaz-video-ai"],
      badgeFr: "Accélération motion",
      badgeEn: "Motion acceleration",
      goalFr: "accélérer la production motion",
      goalEn: "speed up motion production",
      detailFr: "Ce maillon sert à réduire la répétition sur l'animation, les presets, la cleanup et les passes techniques.",
      detailEn: "This link reduces repetition across animation, presets, cleanup and technical passes.",
    },
    {
      ids: ["ae-bodymovin", "lottiefiles"],
      badgeFr: "Exports animés",
      badgeEn: "Animated exports",
      goalFr: "fiabiliser les exports animés",
      goalEn: "make animated exports reliable",
      detailFr: "Ici, la valeur est dans la continuité entre animation, export web/app et réutilisation produit.",
      detailEn: "Here, the value is in continuity between animation, web/app export and product reuse.",
    },
  ],
  photo_retouch: [
    {
      ids: ["pixieset", "dropbox", "wetransfer"],
      badgeFr: "Livraison client",
      badgeEn: "Client delivery",
      goalFr: "mieux livrer les projets photo",
      goalEn: "improve photo delivery",
      detailFr: "La friction est souvent en fin de chaîne : partage, validation, galerie et remise des fichiers finaux.",
      detailEn: "The friction often sits at the end of the chain: sharing, approval, gallery and final file delivery.",
    },
    {
      ids: ["lightroom-presets", "luminar-neo", "nik-collection", "remove-bg"],
      badgeFr: "Retouche récurrente",
      badgeEn: "Repeat retouching",
      goalFr: "accélérer la retouche récurrente",
      goalEn: "speed up recurring retouching",
      detailFr: "Cette recommandation comble le maillon presets/extensions/IA qui évite de refaire les mêmes passes à la main.",
      detailEn: "This recommendation fills the presets/extensions/AI link that avoids repeating the same edits by hand.",
    },
  ],
  content_social: [
    {
      ids: ["buffer", "later", "metricool"],
      badgeFr: "Publication",
      badgeEn: "Publishing",
      goalFr: "tenir la cadence de publication",
      goalEn: "sustain the publishing cadence",
      detailFr: "Le manque se situe entre création et diffusion : planifier, décliner et publier sans reprendre chaque format à la main.",
      detailEn: "The gap sits between creation and distribution: plan, repurpose and publish without redoing each format by hand.",
    },
    {
      ids: ["brevo", "mailerlite", "hubspot"],
      badgeFr: "Conversion",
      badgeEn: "Conversion",
      goalFr: "relier contenu et conversion",
      goalEn: "connect content to conversion",
      detailFr: "Cette reco n'ajoute pas un outil de création de plus : elle relie audience, capture et relance autour des contenus.",
      detailEn: "This recommendation does not add another creation tool: it connects audience, capture and follow-up around content.",
    },
    {
      ids: ["looker-studio", "google-analytics", "posthog", "hotjar"],
      badgeFr: "Mesure",
      badgeEn: "Measurement",
      goalFr: "mesurer ce qui convertit vraiment",
      goalEn: "measure what truly converts",
      detailFr: "Le manque ici est une lecture claire des formats, campagnes et points de friction, pas un nouveau canal de publication.",
      detailEn: "The gap here is a clear read of formats, campaigns and friction points, not a new publishing channel.",
    },
  ],
  illustration_3d: [
    {
      ids: ["blender", "adobe-substance-3d", "spline", "rive"],
      badgeFr: "Pipeline 3D",
      badgeEn: "3D pipeline",
      goalFr: "étendre la création vers l'interactif",
      goalEn: "extend creation into interactive outputs",
      detailFr: "La recommandation sert à relier illustration, rendu, matière et usage interactif sans casser le pipeline source.",
      detailEn: "This recommendation links illustration, rendering, materials and interactive use without breaking the source pipeline.",
    },
    {
      ids: ["google-drive", "dropbox", "wetransfer"],
      badgeFr: "Sources et livraisons",
      badgeEn: "Sources and delivery",
      goalFr: "sécuriser les sources et livraisons",
      goalEn: "secure source files and deliveries",
      detailFr: "Le maillon manquant est souvent la circulation propre des assets lourds, versions sources et exports finaux.",
      detailEn: "The missing link is often the clean circulation of heavy assets, source versions and final exports.",
    },
  ],
  creative_ops: [
    {
      ids: ["brandpad"],
      badgeFr: "Actifs studio",
      badgeEn: "Studio assets",
      goalFr: "centraliser les actifs studio",
      goalEn: "centralize studio assets",
      detailFr: "Le manque n'est pas un nouveau logiciel créatif, mais un point d'appui commun pour les assets et règles de diffusion.",
      detailEn: "The gap is not another creative app, but a shared anchor for assets and distribution rules.",
    },
    {
      ids: ["stripe", "indy"],
      badgeFr: "Opérations studio",
      badgeEn: "Studio operations",
      goalFr: "cadencer l'opérationnel studio",
      goalEn: "structure studio operations",
      detailFr: "Cette recommandation relie production créative, devis, facturation et exécution quotidienne.",
      detailEn: "This recommendation connects creative production, quoting, billing and day-to-day execution.",
    },
    {
      ids: ["brevo", "hubspot", "loom", "frame-io"],
      badgeFr: "Relation client",
      badgeEn: "Client relationship",
      goalFr: "fluidifier les retours client",
      goalEn: "smooth client feedback loops",
      detailFr: "Le vrai gain se cache dans la transmission, le suivi et les retours, bien plus que dans l'outil de création central.",
      detailEn: "The real gain hides in handoff, follow-up and feedback more than in the central creation tool.",
    },
    {
      ids: ["looker-studio"],
      badgeFr: "Pilotage",
      badgeEn: "Operations view",
      goalFr: "piloter la rentabilité créative",
      goalEn: "track creative profitability",
      detailFr: "Ici, on comble un manque de lecture : charge, revenus, clients et arbitrages studio au même endroit.",
      detailEn: "Here, we fill a visibility gap: workload, revenue, clients and studio tradeoffs in one place.",
    },
  ],
};

function findCreativeRule(primarySpecialty: CreativeSpecialty, toolId: string) {
  return CREATIVE_RULES[primarySpecialty].find((rule) => rule.ids.includes(toolId));
}

function findCreativeTriggerName(selectedTools: Tool[], primarySpecialty: CreativeSpecialty) {
  const triggerIds = CREATIVE_RECOMMENDATION_FAMILIES[primarySpecialty]?.triggerIds || [];
  return selectedTools.find((tool) => triggerIds.includes(tool.id))?.name;
}

function withTrigger(goal: string, triggerName?: string) {
  return triggerName ? `${goal} autour de ${triggerName}` : goal;
}

function withTriggerEn(goal: string, triggerName?: string) {
  return triggerName ? `${goal} around ${triggerName}` : goal;
}

export function buildCreativeRecommendationNarrative(
  tool: Tool,
  sessionState: SessionState
): RecommendationNarrative {
  const personaReason = PERSONA_REASONS[sessionState.persona] || PERSONA_REASONS.THEO;

  if (sessionState.persona !== "SOFIA" || !isCreativeSpecialty(sessionState.primarySpecialty)) {
    return {
      badgeFr: "Recommandation",
      badgeEn: "Recommendation",
      reasonFr: personaReason.fr,
      reasonEn: personaReason.en,
      detailFr: "Cette piste reste optionnelle: elle sert seulement si le besoin existe vraiment dans ton activité.",
      detailEn: "This remains optional: it matters only if the need truly exists in your work.",
      evidenceFr: "Signal : profil déclaré et fonctions encore peu couvertes.",
      evidenceEn: "Signal: declared profile and functions that remain lightly covered.",
      actionTitleFr: `Évaluer ${tool.name} plus tard`,
      actionTitleEn: `Review ${tool.name} later`,
    };
  }

  const primarySpecialty = sessionState.primarySpecialty;
  const specialtyCopy = getCreativeSpecialtyCopy(primarySpecialty);
  const rule = findCreativeRule(primarySpecialty, tool.id);
  const triggerName = findCreativeTriggerName(sessionState.selectedTools, primarySpecialty);

  if (!rule) {
    return {
      badgeFr: specialtyCopy.sidebarLabelFr,
      badgeEn: specialtyCopy.sidebarLabelEn,
      reasonFr: `Pour renforcer ${specialtyCopy.labelFr.toLowerCase()}.`,
      reasonEn: `To reinforce your ${specialtyCopy.labelEn.toLowerCase()} flow.`,
      detailFr: specialtyCopy.chainDescriptionFr,
      detailEn: specialtyCopy.chainDescriptionEn,
      evidenceFr: `Signal : spécialité ${specialtyCopy.labelFr}, sans maillon clairement identifié pour ce besoin.`,
      evidenceEn: `Signal: ${specialtyCopy.labelEn} specialty, without a clearly identified link for this need.`,
      actionTitleFr: `Évaluer ${tool.name} pour renforcer le flux`,
      actionTitleEn: `Review ${tool.name} to strengthen the workflow`,
    };
  }

  const reasonFr = `${tool.name} arrive ici pour ${withTrigger(rule.goalFr, triggerName)}.`;
  const reasonEn = `${tool.name} appears here to ${withTriggerEn(rule.goalEn, triggerName)}.`;

  return {
    badgeFr: rule.badgeFr,
    badgeEn: rule.badgeEn,
    reasonFr,
    reasonEn,
    detailFr: rule.detailFr,
    detailEn: rule.detailEn,
    evidenceFr: triggerName
      ? `Déclencheur : ${triggerName} est déjà dans la stack ; ${tool.name} complète son usage au lieu de le remplacer.`
      : `Déclencheur : le diagnostic a détecté un maillon faible autour de ${rule.goalFr}.`,
    evidenceEn: triggerName
      ? `Trigger: ${triggerName} is already in the stack; ${tool.name} extends its use instead of replacing it.`
      : `Trigger: the diagnostic found a weak link around the need to ${rule.goalEn}.`,
    actionTitleFr: `Ajouter ${tool.name} pour ${rule.goalFr}`,
    actionTitleEn: `Add ${tool.name} to ${rule.goalEn}`,
  };
}
