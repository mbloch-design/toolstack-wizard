import { useEffect, useState, useMemo, useRef } from "react";
import { Check, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import type { SessionState, DiscoveryQuestion, Tool } from "@/types/diagnostic";
import { getCreativeSpecialtyCopy } from "@/utils/creativeSpecialty";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev: () => void;
  discoveryQuestions: DiscoveryQuestion[];
  maxQuestions?: number;
  t: (fr: string, en: string) => string;
}

function hasRealFreeTier(tool: Tool) {
  const freeText = `${tool.pricing?.free || ""} ${tool.pricingEn?.free || ""}`.toLowerCase();
  if (!freeText.trim()) return false;
  return !/(no free|aucun|pas de|none|non disponible)/i.test(freeText);
}

function isAiTool(tool: Tool) {
  return tool.tool_type === "ia" || /(^|[^a-z])(ai|ia)([^a-z]|$)|chatgpt|claude|copilot|perplexity|gemini|mistral|deepseek/i.test(
    `${tool.category} ${tool.name} ${tool.ia_use_case || ""}`
  );
}

function toolList(tools: Tool[], max = 3) {
  const names = tools.slice(0, max).map((tool) => tool.name);
  if (tools.length > max) names.push(`+${tools.length - max}`);
  return names.join(", ");
}

const CREATIVE_FIGMA_PLUGIN_IDS = [
  "figma-iconify",
  "figma-tokens",
  "figma-stark",
  "figma-anima",
  "zeplin",
  "figma-slides",
];

const CREATIVE_RESOURCE_IDS = [
  "envato-elements",
  "dynamic-mockups",
  "mockup-plugins",
  "icons8",
  "hugeicons",
  "fontbase",
  "rightfont",
  "canva-templates",
  "figma-templates",
  "brand-kits",
];

const CREATIVE_UI_HANDOFF_IDS = [
  "figma-tokens",
  "figma-anima",
  "zeplin",
  "protopie",
  "rive",
  "spline",
  "framer",
  "webflow-framer",
];

const CREATIVE_MOTION_CORE_IDS = [
  "adobe-after-effects",
  "adobe-premiere-pro",
  "davinci-resolve",
  "capcut",
  "runway",
];

const CREATIVE_MOTION_PLUGIN_IDS = [
  "ae-bodymovin",
  "lottiefiles",
  "ae-animation-composer",
  "motion-bro",
  "ae-overlord",
  "ae-duik",
  "ae-gifgun",
  "ae-red-giant",
  "topaz-video-ai",
  "descript",
  "frame-io",
];

const CREATIVE_PHOTO_CORE_IDS = [
  "adobe-lightroom",
  "capture-one",
  "adobe-photoshop",
];

const CREATIVE_PHOTO_DELIVERY_IDS = [
  "presets-lightroom",
  "lightroom-presets",
  "luminar-neo",
  "nik-collection",
  "pixieset",
];

const CREATIVE_VISUAL_AI_IDS = [
  "midjourney",
  "krea-ai",
  "firefly",
  "stable-diffusion",
  "flux",
  "ideogram",
  "leonardo-ai",
  "runway",
];

const CREATIVE_CONTENT_DISTRIBUTION_IDS = [
  "brevo",
  "mailerlite",
  "hubspot",
  "buffer",
  "later",
  "metricool",
  "looker-studio",
  "google-analytics",
  "posthog",
  "hotjar",
];

const CREATIVE_STUDIO_OPS_IDS = [
  "stripe",
  "indy",
  "paypal",
  "notion",
  "airtable",
  "brandpad",
  "frame-io",
  "loom",
  "google-drive",
  "dropbox",
];

const CREATIVE_BRAND_SYSTEM_IDS = [
  "brandpad",
  "brand-kits",
  "fontbase",
  "rightfont",
  "envato-elements",
  "dynamic-mockups",
  "icons8",
  "hugeicons",
];

const CREATIVE_ILLUSTRATION_PIPELINE_IDS = [
  "blender",
  "spline",
  "rive",
  "adobe-substance-3d",
  "dropbox",
  "google-drive",
  "wetransfer",
];

function selectedByIds(tools: Tool[], ids: readonly string[]) {
  const idSet = new Set(ids);
  return tools.filter((tool) => idSet.has(tool.id));
}

function hasAnyTool(tools: Tool[], ids: readonly string[]) {
  return selectedByIds(tools, ids).length > 0;
}

function buildCreativeQuestions(
  session: SessionState,
  t: (fr: string, en: string) => string
): DiscoveryQuestion[] {
  if (session.persona !== "SOFIA") return [];

  const selectedTools = session.selectedTools;
  const questions: DiscoveryQuestion[] = [];
  const selectedCreativeAiTools = selectedByIds(selectedTools, CREATIVE_VISUAL_AI_IDS);
  const selectedMotionTools = selectedByIds(selectedTools, CREATIVE_MOTION_CORE_IDS);
  const selectedPhotoTools = selectedByIds(selectedTools, CREATIVE_PHOTO_CORE_IDS);
  const selectedDesignCoreTools = selectedByIds(selectedTools, [
    "figma",
    "canva",
    "adobe-photoshop",
    "adobe-illustrator",
    "adobe-creative-cloud",
  ]);
  const specialty = getCreativeSpecialtyCopy(session.primarySpecialty);

  if (session.primarySpecialty && selectedTools.length > 0) {
    questions.push({
      id: `adaptive_creative_${specialty.id}_focus`,
      persona: "SOFIA",
      question: t(specialty.discoveryQuestionFr, specialty.discoveryQuestionEn),
      subtitle: t(
        "Cette réponse m’aide à lire ta stack avec le bon prisme métier, pas comme une simple liste d’abonnements.",
        "This helps me read your stack through the right craft lens, not as a simple subscription list."
      ),
      options: specialty.discoveryOptions.map((option) => ({
        label: t(option.labelFr, option.labelEn),
        impact: option.impact,
        affectedTools: selectedTools.map((tool) => tool.id),
      })),
      condition_tool_ids: selectedTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  if (hasAnyTool(selectedTools, ["figma"]) && !hasAnyTool(selectedTools, CREATIVE_FIGMA_PLUGIN_IDS)) {
    questions.push({
      id: "adaptive_creative_figma_plugins",
      persona: "SOFIA",
      question: t(
        "Tu as Figma. Tu gères comment icônes, tokens, accessibilité ou handoff ?",
        "You selected Figma. How do you handle icons, tokens, accessibility or handoff?"
      ),
      subtitle: t(
        "Chez un créatif, la valeur est souvent dans les plugins et la méthode autour de Figma, pas seulement dans Figma.",
        "For a creative profile, value often sits in the plugins and workflow around Figma, not only in Figma itself."
      ),
      options: [
        {
          label: t("J’ai déjà une bibliothèque/plugins clairs", "I already have clear libraries/plugins"),
          impact: "keep",
          affectedTools: ["figma"],
        },
        {
          label: t("J’utilise surtout Figma seul", "I mostly use Figma alone"),
          impact: "review",
          affectedTools: ["figma"],
        },
        {
          label: t("Je dois vérifier tokens, icônes ou accessibilité", "I need to check tokens, icons or accessibility"),
          impact: "review",
          affectedTools: ["figma"],
        },
        {
          label: t("Pas utile pour mes livrables", "Not useful for my deliverables"),
          impact: "keep",
          affectedTools: ["figma"],
        },
      ],
      condition_tool_ids: ["figma"],
      condition_type: "any",
    });
  }

  if (selectedCreativeAiTools.length >= 2) {
    questions.push({
      id: "adaptive_creative_ai_visual_overlap",
      persona: "SOFIA",
      question: t(
        `Tu as plusieurs IA visuelles (${toolList(selectedCreativeAiTools)}). Elles ont chacune un rôle ?`,
        `You have several visual AI tools (${toolList(selectedCreativeAiTools)}). Does each one have a clear role?`
      ),
      subtitle: t(
        "Je distingue exploration, production client, retouche, vidéo et veille pour éviter les faux doublons.",
        "I separate exploration, client production, retouching, video and research to avoid false duplicates."
      ),
      options: [
        {
          label: t("Oui, chaque IA a un usage précis", "Yes, each AI tool has a precise use"),
          impact: "keep",
          affectedTools: selectedCreativeAiTools.map((tool) => tool.id),
        },
        {
          label: t("Une seule sert vraiment en production", "Only one is really used in production"),
          impact: "review",
          affectedTools: selectedCreativeAiTools.map((tool) => tool.id),
        },
        {
          label: t("Je teste beaucoup, je dois trier", "I test a lot and need to sort them out"),
          impact: "review",
          affectedTools: selectedCreativeAiTools.map((tool) => tool.id),
        },
        {
          label: t("Je peux en couper au moins une", "I can cut at least one"),
          impact: "cancel",
          affectedTools: selectedCreativeAiTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: selectedCreativeAiTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  if (selectedDesignCoreTools.length > 0 && !hasAnyTool(selectedTools, CREATIVE_RESOURCE_IDS)) {
    questions.push({
      id: "adaptive_creative_resources_rights",
      persona: "SOFIA",
      question: t(
        "Pour templates, fonts, icônes, mockups et droits d’usage, tu as déjà une source fiable ?",
        "For templates, fonts, icons, mockups and usage rights, do you already have a reliable source?"
      ),
      subtitle: t(
        "C’est une zone souvent invisible dans l’audit, alors qu’elle évite les achats dispersés et les risques de licence.",
        "This area is often invisible in audits, yet it avoids scattered purchases and licensing risk."
      ),
      options: [
        {
          label: t("Oui, c’est déjà cadré", "Yes, it is already covered"),
          impact: "keep",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
        {
          label: t("J’achète au cas par cas", "I buy case by case"),
          impact: "review",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
        {
          label: t("Je dois clarifier les licences", "I need to clarify licenses"),
          impact: "review",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
        {
          label: t("Pas important dans mon activité", "Not important for my work"),
          impact: "keep",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: selectedDesignCoreTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  if (selectedMotionTools.length > 0 && !hasAnyTool(selectedTools, CREATIVE_MOTION_PLUGIN_IDS)) {
    questions.push({
      id: "adaptive_creative_motion_plugins",
      persona: "SOFIA",
      question: t(
        `Autour de ${toolList(selectedMotionTools)}, tu utilises des templates, plugins, sous-titres ou validation vidéo ?`,
        `Around ${toolList(selectedMotionTools)}, do you use templates, plugins, subtitles or video review tools?`
      ),
      subtitle: t(
        "En motion/vidéo, les extensions et outils de review changent souvent plus le flux que le logiciel principal.",
        "In motion/video, extensions and review tools often change the workflow more than the main app."
      ),
      options: [
        {
          label: t("Oui, c’est structuré", "Yes, it is structured"),
          impact: "keep",
          affectedTools: selectedMotionTools.map((tool) => tool.id),
        },
        {
          label: t("Je fais surtout tout à la main", "I mostly do it manually"),
          impact: "review",
          affectedTools: selectedMotionTools.map((tool) => tool.id),
        },
        {
          label: t("J’ai des plugins dormants à vérifier", "I have dormant plugins to check"),
          impact: "review",
          affectedTools: selectedMotionTools.map((tool) => tool.id),
        },
        {
          label: t("Pas besoin sur mes livrables", "Not needed for my deliverables"),
          impact: "keep",
          affectedTools: selectedMotionTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: selectedMotionTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  if (selectedPhotoTools.length > 0 && !hasAnyTool(selectedTools, CREATIVE_PHOTO_DELIVERY_IDS)) {
    questions.push({
      id: "adaptive_creative_photo_delivery",
      persona: "SOFIA",
      question: t(
        `Avec ${toolList(selectedPhotoTools)}, comment gères-tu presets, galeries client ou exports ?`,
        `With ${toolList(selectedPhotoTools)}, how do you handle presets, client galleries or exports?`
      ),
      subtitle: t(
        "Je vérifie le workflow complet : retouche, livraison, sauvegarde et expérience client.",
        "I check the full workflow: retouching, delivery, backup and client experience."
      ),
      options: [
        {
          label: t("Tout est clair et utile", "Everything is clear and useful"),
          impact: "keep",
          affectedTools: selectedPhotoTools.map((tool) => tool.id),
        },
        {
          label: t("J’ai surtout l’outil principal", "I mostly have the main tool"),
          impact: "review",
          affectedTools: selectedPhotoTools.map((tool) => tool.id),
        },
        {
          label: t("Je dois vérifier presets ou galeries", "I need to check presets or galleries"),
          impact: "review",
          affectedTools: selectedPhotoTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: selectedPhotoTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  if (
    session.primarySpecialty === "ui_product" &&
    selectedDesignCoreTools.length > 0 &&
    !hasAnyTool(selectedTools, CREATIVE_UI_HANDOFF_IDS)
  ) {
    questions.push({
      id: "adaptive_creative_ui_handoff",
      persona: "SOFIA",
      question: t(
        `Avec ${toolList(selectedDesignCoreTools)}, comment tu gères composants, prototype et handoff ?`,
        `With ${toolList(selectedDesignCoreTools)}, how do you handle components, prototyping and handoff?`
      ),
      subtitle: t(
        "En UI produit, la vraie friction se cache souvent entre le design principal et la transmission vers les autres équipes.",
        "In product design, the real friction often sits between the core design tool and the handoff to other teams."
      ),
      options: [
        {
          label: t("Le handoff et les composants sont déjà nets", "Handoff and components are already clear"),
          impact: "keep",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
        {
          label: t("Je fais encore beaucoup sans système clair", "I still do a lot without a clear system"),
          impact: "review",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
        {
          label: t("Je dois clarifier tokens, prototype ou QA", "I need to clarify tokens, prototyping or QA"),
          impact: "review",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: selectedDesignCoreTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  if (
    session.primarySpecialty === "content_social" &&
    (selectedCreativeAiTools.length > 0 || hasAnyTool(selectedTools, ["canva", "adobe-express", "capcut", "descript"])) &&
    !hasAnyTool(selectedTools, CREATIVE_CONTENT_DISTRIBUTION_IDS)
  ) {
    const contentCoreTools = selectedByIds(selectedTools, [
      "canva",
      "adobe-express",
      "capcut",
      "descript",
      "midjourney",
      "runway",
      "tella",
    ]);
    questions.push({
      id: "adaptive_creative_content_distribution",
      persona: "SOFIA",
      question: t(
        `Tu produis avec ${toolList(contentCoreTools)}. Comment tu gères publication, diffusion et mesure ?`,
        `You create with ${toolList(contentCoreTools)}. How do you handle publishing, distribution and measurement?`
      ),
      subtitle: t(
        "Pour le contenu social, la valeur ne se joue pas seulement à la production, mais dans la chaîne publication → mesure.",
        "For social content, value does not stop at production. It lives in the publish-to-measure chain."
      ),
      options: [
        {
          label: t("La diffusion et la mesure sont déjà cadrées", "Distribution and measurement are already covered"),
          impact: "keep",
          affectedTools: contentCoreTools.map((tool) => tool.id),
        },
        {
          label: t("Je publie surtout à la main", "I mostly publish manually"),
          impact: "review",
          affectedTools: contentCoreTools.map((tool) => tool.id),
        },
        {
          label: t("Je dois clarifier analytics ou CRM", "I need to clarify analytics or CRM"),
          impact: "review",
          affectedTools: contentCoreTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: contentCoreTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  if (
    session.primarySpecialty === "creative_ops" &&
    selectedTools.length > 0 &&
    !hasAnyTool(selectedTools, CREATIVE_STUDIO_OPS_IDS)
  ) {
    questions.push({
      id: "adaptive_creative_studio_ops",
      persona: "SOFIA",
      question: t(
        "Comment tu gères validation client, droits, suivi et facturation de ton studio ?",
        "How do you handle client review, rights, follow-up and billing for your studio?"
      ),
      subtitle: t(
        "Sur un profil studio/ops créa, le risque n’est pas l’outil principal mais l’opérationnel autour.",
        "For a creative ops/studio profile, the risk is not the main app but the surrounding operations."
      ),
      options: [
        {
          label: t("Le pilotage est déjà structuré", "Operations are already structured"),
          impact: "keep",
          affectedTools: selectedTools.map((tool) => tool.id),
        },
        {
          label: t("Je gère ça de manière dispersée", "I manage this in a fragmented way"),
          impact: "review",
          affectedTools: selectedTools.map((tool) => tool.id),
        },
        {
          label: t("Je dois clarifier validation ou facturation", "I need to clarify review or billing"),
          impact: "review",
          affectedTools: selectedTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: selectedTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  if (
    session.primarySpecialty === "brand_identity" &&
    selectedDesignCoreTools.length > 0 &&
    !hasAnyTool(selectedTools, CREATIVE_BRAND_SYSTEM_IDS)
  ) {
    questions.push({
      id: "adaptive_creative_brand_system",
      persona: "SOFIA",
      question: t(
        `Autour de ${toolList(selectedDesignCoreTools)}, tu as un vrai socle de marque réutilisable ?`,
        `Around ${toolList(selectedDesignCoreTools)}, do you already have a reusable brand system?`
      ),
      subtitle: t(
        "Je cherche le socle invisible : fonts, kits, mockups, assets, règles et droits d’usage.",
        "I am looking for the invisible foundation: fonts, kits, mockups, assets, rules and usage rights."
      ),
      options: [
        {
          label: t("Oui, le socle est déjà en place", "Yes, the foundation is already in place"),
          impact: "keep",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
        {
          label: t("Je compose encore au cas par cas", "I still assemble it case by case"),
          impact: "review",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
        {
          label: t("Je dois clarifier assets, fonts ou droits", "I need to clarify assets, fonts or rights"),
          impact: "review",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: selectedDesignCoreTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  if (
    session.primarySpecialty === "illustration_3d" &&
    selectedDesignCoreTools.length > 0 &&
    !hasAnyTool(selectedTools, CREATIVE_ILLUSTRATION_PIPELINE_IDS)
  ) {
    questions.push({
      id: "adaptive_creative_illustration_pipeline",
      persona: "SOFIA",
      question: t(
        `Autour de ${toolList(selectedDesignCoreTools)}, comment tu sécurises exports, sources et pipeline 3D ?`,
        `Around ${toolList(selectedDesignCoreTools)}, how do you secure exports, source files and the 3D pipeline?`
      ),
      subtitle: t(
        "Je vérifie la continuité entre création, rendu, exports et réutilisation des sources.",
        "I check continuity between creation, rendering, exports and source-file reuse."
      ),
      options: [
        {
          label: t("Le pipeline est cadré", "The pipeline is already framed"),
          impact: "keep",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
        {
          label: t("Je gère encore ça à la main", "I still handle this manually"),
          impact: "review",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
        {
          label: t("Je dois clarifier sources, rendus ou exports", "I need to clarify sources, renders or exports"),
          impact: "review",
          affectedTools: selectedDesignCoreTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: selectedDesignCoreTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  return questions;
}

function buildAdaptiveQuestions(
  session: SessionState,
  t: (fr: string, en: string) => string
): DiscoveryQuestion[] {
  const selectedTools = session.selectedTools;
  const questions: DiscoveryQuestion[] = [];
  const aiTools = selectedTools.filter(isAiTool);
  const uncertainPlanTools = selectedTools.filter((tool) => {
    const catalogPrice = Number(tool.catalogMonthlyPrice ?? tool.price ?? 0);
    return catalogPrice > 0 && (tool.selectedOffer === "unknown" || tool.selectedPriceIsEstimate === true);
  });
  const paidFreeTierTools = selectedTools.filter((tool) =>
    hasRealFreeTier(tool) && tool.selectedOffer !== "free"
  );
  const skippedCount = session.selectionCoverage?.skipped.length || 0;

  questions.push(...buildCreativeQuestions(session, t));

  if (aiTools.length >= 2) {
    questions.push({
      id: "adaptive_ai_overlap",
      persona: "ALL",
      question: t(
        `Tu as plusieurs outils IA dans ta stack (${toolList(aiTools)}). Comment les utilises-tu vraiment ?`,
        `You have several AI tools in your stack (${toolList(aiTools)}). How do you really use them?`
      ),
      subtitle: t(
        "Cette réponse évite de recommander une coupure trop rapide si chaque outil a un rôle clair.",
        "This avoids recommending a cut too quickly if each tool has a clear role."
      ),
      options: [
        {
          label: t("Ils ont chacun un rôle clair", "Each has a clear role"),
          impact: "keep",
          affectedTools: aiTools.map((tool) => tool.id),
        },
        {
          label: t("Un seul est central, les autres dépannent", "One is central, the others are occasional"),
          impact: "review",
          affectedTools: aiTools.map((tool) => tool.id),
        },
        {
          label: t("Je paie plusieurs IA sans règle claire", "I pay for several AI tools without a clear rule"),
          impact: "review",
          affectedTools: aiTools.map((tool) => tool.id),
        },
        {
          label: t("Je pense pouvoir en couper au moins un", "I could probably cut at least one"),
          impact: "cancel",
          affectedTools: aiTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: aiTools.map((tool) => tool.id),
      condition_type: "all",
    });
  }

  if (uncertainPlanTools.length > 0) {
    questions.push({
      id: "adaptive_plan_reality",
      persona: "ALL",
      question: t(
        `Pour ${toolList(uncertainPlanTools)}, le prix catalogue peut être faux pour toi. Tu es plutôt sur quel cas ?`,
        `For ${toolList(uncertainPlanTools)}, catalog pricing may be wrong for you. Which case is closest?`
      ),
      subtitle: t(
        "Je m'en sers pour éviter de surestimer ou sous-estimer ton budget réel.",
        "I use this to avoid overestimating or underestimating your real budget."
      ),
      options: [
        {
          label: t("Plan gratuit ou inclus ailleurs", "Free plan or included elsewhere"),
          impact: "keep",
          affectedTools: uncertainPlanTools.map((tool) => tool.id),
        },
        {
          label: t("Plan individuel payant", "Paid individual plan"),
          impact: "keep",
          affectedTools: uncertainPlanTools.map((tool) => tool.id),
        },
        {
          label: t("Plan équipe ou facture plus élevée", "Team plan or higher invoice"),
          impact: "review",
          affectedTools: uncertainPlanTools.map((tool) => tool.id),
        },
        {
          label: t("Je ne sais pas encore", "I am not sure yet"),
          impact: "review",
          affectedTools: uncertainPlanTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: uncertainPlanTools.map((tool) => tool.id),
      condition_type: "any",
    });
  } else if (paidFreeTierTools.length > 0) {
    questions.push({
      id: "adaptive_free_tier_check",
      persona: "ALL",
      question: t(
        `${toolList(paidFreeTierTools)} semble avoir une version gratuite ou un palier inférieur. Tu as déjà vérifié ton plan ?`,
        `${toolList(paidFreeTierTools)} seems to have a free version or lower tier. Have you checked your plan?`
      ),
      subtitle: t(
        "C'est souvent là que se cachent les économies faciles, sans changer d'outil.",
        "This is often where easy savings hide, without changing tools."
      ),
      options: [
        {
          label: t("Oui, le plan payant est justifié", "Yes, the paid plan is justified"),
          impact: "keep",
          affectedTools: paidFreeTierTools.map((tool) => tool.id),
        },
        {
          label: t("Non, je dois vérifier", "No, I need to check"),
          impact: "review",
          affectedTools: paidFreeTierTools.map((tool) => tool.id),
        },
        {
          label: t("Je pourrais descendre de plan", "I could downgrade"),
          impact: "cancel",
          affectedTools: paidFreeTierTools.map((tool) => tool.id),
        },
      ],
      condition_tool_ids: paidFreeTierTools.map((tool) => tool.id),
      condition_type: "any",
    });
  }

  if (skippedCount >= 3) {
    questions.push({
      id: "adaptive_skipped_areas",
      persona: "ALL",
      question: t(
        "Tu as passé plusieurs zones sans outil. C'est bien volontaire ?",
        "You skipped several areas without tools. Was that intentional?"
      ),
      subtitle: t(
        "Je préfère vérifier maintenant plutôt que conclure à tort qu'il manque des briques.",
        "I prefer checking now instead of wrongly concluding that pieces are missing."
      ),
      options: [
        { label: t("Oui, je n'ai rien dans ces zones", "Yes, I have nothing in those areas"), impact: "keep" },
        { label: t("J'ai peut-être oublié un outil", "I may have forgotten a tool"), impact: "review" },
        { label: t("Ces zones ne concernent pas mon activité", "Those areas do not apply to my work"), impact: "keep" },
      ],
      condition_tool_ids: [],
      condition_type: "any",
    });
  }

  return questions;
}

export default function DiagStep6Discovery({ session, onUpdate, onNext, onPrev, discoveryQuestions, maxQuestions = 3, t }: Props) {
  const selectedToolIds = useMemo(
    () => new Set(session.selectedTools.map((t) => t.id)),
    [session.selectedTools]
  );
  const adaptiveQuestions = useMemo(
    () => buildAdaptiveQuestions(session, t),
    [session, t]
  );

  // Filter questions based on conditions
  const activeQuestions = useMemo(() => {
    const candidateQuestions = [...adaptiveQuestions, ...discoveryQuestions];
    const seen = new Set<string>();
    return candidateQuestions.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      // Persona filter
      if (q.persona !== "ALL" && q.persona !== session.persona) return false;
      // Tool condition
      if (q.condition_tool_ids.length === 0) return true;
      if (q.condition_type === "all") {
        return q.condition_tool_ids.every((id) => selectedToolIds.has(id));
      }
      return q.condition_tool_ids.some((id) => selectedToolIds.has(id));
    }).slice(0, maxQuestions);
  }, [adaptiveQuestions, discoveryQuestions, maxQuestions, session.persona, selectedToolIds]);

  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(() => new Map(session.discoveryAnswers));
  const [autoAdvanced, setAutoAdvanced] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const answeredCount = activeQuestions.filter((question) => answers.has(question.id)).length;
  const activeAdaptiveQuestions = activeQuestions.filter((question) => question.id.startsWith("adaptive_"));

  useEffect(() => {
    if (activeQuestions.length === 0) return;
    if (questionIdx >= activeQuestions.length) {
      setQuestionIdx(activeQuestions.length - 1);
    }
  }, [activeQuestions.length, questionIdx]);

  useEffect(() => {
    if (activeQuestions.length === 0 && !autoAdvanced) {
      setAutoAdvanced(true);
      onUpdate({ discoveryAnswers: answers, adaptiveDiscoveryQuestions: [] });
      onNext();
    }
  }, [activeQuestions.length, answers, autoAdvanced, onNext, onUpdate]);

  // Stable fallback state when there is no discovery question for this profile/tools set.
  if (activeQuestions.length === 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          {t("Pas besoin de question en plus", "No extra question needed")}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {t(
            "Ta stack suffit déjà pour générer un premier verdict.",
            "Your stack is already enough to generate a first verdict."
          )}
        </p>
        <button
          onClick={() => {
            onUpdate({ discoveryAnswers: answers, adaptiveDiscoveryQuestions: activeAdaptiveQuestions });
            onNext();
          }}
          className="diagnostic-primary-action rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
        >
          {t("Continuer", "Continue")}
        </button>
      </div>
    );
  }

  const current = activeQuestions[questionIdx];
  const currentAnswer = answers.get(current?.id);
  const reasonTools = session.selectedTools
    .filter((tool) => current?.condition_tool_ids.includes(tool.id))
    .slice(0, 3);

  useEffect(() => {
    headingRef.current?.focus();
  }, [current?.id]);

  const handleAnswer = (idx: number) => {
    const next = new Map(answers);
    next.set(current.id, idx);
    setAnswers(next);
    onUpdate({ discoveryAnswers: next, adaptiveDiscoveryQuestions: activeAdaptiveQuestions });
    if (questionIdx < activeQuestions.length - 1) {
      window.setTimeout(() => {
        setQuestionIdx((i) => i === questionIdx ? Math.min(i + 1, activeQuestions.length - 1) : i);
      }, 220);
    }
  };

  const handleNext = () => {
    onUpdate({ discoveryAnswers: answers, adaptiveDiscoveryQuestions: activeAdaptiveQuestions });
    if (questionIdx < activeQuestions.length - 1) {
      setQuestionIdx((i) => i + 1);
    } else {
      onNext();
    }
  };

  const handlePrev = () => {
    if (questionIdx > 0) {
      setQuestionIdx((i) => i - 1);
    } else {
      onPrev();
    }
  };

  return (
    <div className="diagnostic-card mx-auto flex min-h-[54vh] max-w-2xl flex-col justify-center gap-7 p-5 md:p-7">
      <header className="space-y-4 text-center">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>{t("Vérification courte", "Short check")}</span>
          <span className="text-primary/40">·</span>
          <span>{questionIdx + 1}/{activeQuestions.length}</span>
        </div>
        <div className="mx-auto flex max-w-sm gap-1.5" aria-hidden="true">
          {activeQuestions.map((question, i) => (
            <div
              key={question.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < questionIdx || answers.has(question.id)
                  ? "bg-primary"
                  : i === questionIdx
                    ? "bg-primary/50"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>
        <div className="space-y-2">
          {questionIdx === 0 && (
            <p className="text-xs font-semibold uppercase text-primary">
              {t("Seulement les questions qui changent le verdict", "Only questions that change the verdict")}
            </p>
          )}
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mx-auto max-w-xl text-2xl font-bold leading-tight text-foreground outline-none md:text-3xl"
          >
            {current.question}
          </h2>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
            {current.subtitle || t(
              "Réponds au plus proche de ta réalité. Il n’y a pas de mauvaise réponse.",
              "Pick the closest answer. There is no wrong answer."
            )}
          </p>
          {reasonTools.length > 0 && (
            <p className="mx-auto max-w-lg rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm leading-relaxed text-primary">
              {t(
                `Je te pose ça parce que tu as sélectionné ${reasonTools.map((tool) => tool.name).join(", ")}.`,
                `I ask because you selected ${reasonTools.map((tool) => tool.name).join(", ")}.`
              )}
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {current.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            aria-pressed={currentAnswer === idx}
            className={`flex min-h-[58px] items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all
              ${currentAnswer === idx
                ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/15"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/30"
              }`}
          >
            <span className="flex-1">{opt.label}</span>
            {currentAnswer === idx && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                <Check className="h-3.5 w-3.5" />
                {t("Noté", "Saved")}
              </span>
            )}
          </button>
        ))}
      </div>

      {currentAnswer !== undefined && (
        <p className="rounded-2xl bg-primary/5 px-3 py-2 text-center text-sm font-medium text-primary" role="status">
          {questionIdx < activeQuestions.length - 1
            ? t("Réponse prise en compte. On passe à la suivante.", "Answer saved. Moving to the next one.")
            : t("Réponse prise en compte. Ton premier verdict est prêt.", "Answer saved. Your first verdict is ready.")}
        </p>
      )}

      <footer className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={handlePrev}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("Retour", "Back")}
        </button>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            {answeredCount}/{activeQuestions.length} {t("réponse(s) utiles", "useful answer(s)")}
          </p>
        <button
          onClick={handleNext}
          disabled={currentAnswer === undefined}
            className="diagnostic-primary-action inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {questionIdx < activeQuestions.length - 1
            ? t("Question suivante", "Next question")
            : t("Voir le premier verdict", "See first verdict")}
            <ChevronRight className="h-4 w-4" />
        </button>
        </div>
      </footer>
    </div>
  );
}
