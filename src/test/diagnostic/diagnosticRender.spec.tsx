import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DiagStepStackScan, { textMentionsTool } from "@/components/diagnostic/DiagStepStackScan";
import DiagStep6Discovery from "@/components/diagnostic/DiagStep6Discovery";
import CommercialAccessReview from "@/components/diagnostic/CommercialAccessReview";
import DashOverview from "@/components/dashboard/DashOverview";
import { buildActions } from "@/components/dashboard/DashActions";
import { mapDiscoveryQuestion } from "@/hooks/useDiagnosticData";
import { runDiagnostic } from "@/utils/scoring";
import {
  buildDiagnosticDecisionPlan,
  getProvenRecommendations,
} from "@/utils/diagnosticDecisionPlan";
import type { DiagnosticResult, DiscoveryQuestion, SessionState, Tool } from "@/types/diagnostic";

const t = (fr: string) => fr;
const tEn = (_fr: string, en: string) => en;
const noop = () => undefined;

function tool(input: Partial<Tool> & Pick<Tool, "id" | "name">): Tool {
  return {
    id: input.id,
    name: input.name,
    price: input.price ?? 0,
    category: input.category ?? "",
    functional_needs: input.functional_needs ?? [],
    verticals: input.verticals ?? [],
    tool_type: input.tool_type ?? "metier",
    usage: input.usage ?? "medium",
    prescription_quality: input.prescription_quality ?? "oui",
    force_silence: false,
    host_app: input.host_app,
    bundle_parent: input.bundle_parent,
    provider_id: input.provider_id,
    commercial_family: input.commercial_family,
    catalogMonthlyPrice: input.catalogMonthlyPrice,
    selectedOffer: input.selectedOffer,
    selectedPriceIsEstimate: input.selectedPriceIsEstimate,
    ia_use_case: input.ia_use_case,
    pertinence_by_persona: input.pertinence_by_persona,
  };
}

const tools = [
  tool({ id: "figma", name: "Figma", functional_needs: ["ui-design", "prototyping"] }),
  tool({ id: "adobe-photoshop", name: "Adobe Photoshop", bundle_parent: "adobe-cc", functional_needs: ["retouche-photo", "design-visuel"] }),
  tool({ id: "firefly", name: "Adobe Firefly", bundle_parent: "adobe-cc", tool_type: "ia", functional_needs: ["generation-image", "retouche-photo"], ia_use_case: "generation-image" }),
  tool({ id: "adobe-premiere-pro", name: "Adobe Premiere Pro", functional_needs: ["montage-video"] }),
  tool({ id: "adobe-after-effects", name: "Adobe After Effects", functional_needs: ["motion-design"] }),
  tool({ id: "procreate", name: "Procreate", functional_needs: ["illustration"] }),
  tool({ id: "blender", name: "Blender", functional_needs: ["modelisation-3d", "rendu-3d"], verticals: ["motion-video"] }),
  tool({ id: "cinema-4d", name: "Cinema 4D", functional_needs: ["3d", "motion-design"], verticals: ["motion-video"] }),
  tool({ id: "sketchup-pro", name: "SketchUp Pro", functional_needs: ["modelisation-3d", "plans-2d", "presentation-client"] }),
  tool({ id: "layout-sketchup", name: "LayOut", functional_needs: ["plugin-sketchup"] }),
  tool({ id: "fredo6-bundle", name: "Fredo6 Bundle", functional_needs: ["plugin-sketchup"] }),
  tool({ id: "revit", name: "Revit", functional_needs: ["bim", "plans-techniques", "modelisation-3d"] }),
  tool({ id: "enscape", name: "Enscape", tool_type: "plugin", host_app: "revit", functional_needs: ["rendu-3d", "presentation-client"] }),
  tool({ id: "twinmotion", name: "Twinmotion", functional_needs: ["rendu-3d", "temps-reel"] }),
  tool({ id: "logic-pro", name: "Logic Pro", functional_needs: ["montage-audio"] }),
  tool({ id: "buzzsprout", name: "Buzzsprout", tool_type: "satellite", functional_needs: ["hebergement-audio", "distribution-podcast"] }),
  tool({ id: "canva", name: "Canva", functional_needs: ["design-visuel", "social-media"] }),
  tool({ id: "buffer", name: "Buffer", tool_type: "satellite", functional_needs: ["planification-posts", "multi-plateformes"] }),
  tool({ id: "blenderkit", name: "BlenderKit", tool_type: "plugin", host_app: "blender", functional_needs: ["assets"] }),
  tool({ id: "cycles", name: "Cycles", tool_type: "plugin", host_app: "blender", functional_needs: ["rendu-3d"] }),
];

function session(patch: Partial<SessionState> = {}): SessionState {
  return {
    firstName: "",
    tjm: 0,
    language: "fr",
    persona: "SOFIA",
    complementarySkills: [],
    selectedTools: [],
    discoveryAnswers: new Map(),
    closingAnswers: ["", "", ""],
    ...patch,
  };
}

function renderScanner(state: SessionState) {
  return renderToStaticMarkup(
    <DiagStepStackScan
      session={state}
      tools={tools}
      onUpdate={noop}
      onNext={noop}
      t={t}
    />
  );
}

function renderDiscovery(state: SessionState, discoveryQuestions: DiscoveryQuestion[] = []) {
  return renderToStaticMarkup(
    <DiagStep6Discovery
      session={state}
      discoveryQuestions={discoveryQuestions}
      onUpdate={noop}
      onNext={noop}
      onPrev={noop}
      t={tEn}
    />
  );
}

describe("rendered diagnostic journeys", () => {
  it("does not infer Microsoft Project from the generic word project", () => {
    const microsoftProject = tool({ id: "microsoft-project", name: "Microsoft Project" });

    expect(textMentionsTool("I prepare client quotes when the project is visual.", microsoftProject)).toBe(false);
    expect(textMentionsTool("I plan production in Microsoft Project.", microsoftProject)).toBe(true);
  });

  it("maps legacy LLM discovery questions to English before rendering", () => {
    const chatgpt = tool({ id: "chatgpt", name: "ChatGPT", tool_type: "ia" });
    const question = mapDiscoveryQuestion({
      id: "legacy-llm-usage",
      persona: "ALL",
      question: "Comment utilises-tu tes LLMs au quotidien ?",
      subtitle: "Ça nous aide à savoir si tu as vraiment besoin de plusieurs abonnements",
      options: [
        { label: "Surtout du chat et des questions", impact: "keep" },
        { label: "Génération de contenu (articles, emails)", impact: "review" },
        { label: "Code et technique", impact: "review" },
        { label: "Je teste mais j'utilise peu", impact: "cancel" },
      ],
      condition_tool_ids: ["chatgpt"],
      condition_type: "any",
    });

    const html = renderDiscovery(session({
      language: "en",
      selectedTools: [chatgpt],
    }), [question]);

    expect(html).toContain("How do you use your LLMs day to day?");
    expect(html).toContain("Mostly chat and questions");
    expect(html).not.toContain("Comment utilises-tu");
    expect(html).not.toContain("Surtout du chat");
  });

  it.each([
    ["brand-visual", "Comment construis-tu aujourd’hui tes identités et visuels ?", "Identité et création visuelle"],
    ["ui-product", "Comment conçois-tu tes interfaces et design systems aujourd’hui ?", "Conception d’interfaces"],
    ["photo", "Comment développes-tu, classes-tu et ajustes-tu tes photos ?", "Développement photo"],
    ["video", "Comment montes-tu principalement tes vidéos aujourd’hui ?", "Montage vidéo"],
    ["motion", "Comment animes-tu, composes-tu ou crées-tu tes effets ?", "Motion et compositing"],
    ["illustration", "Comment dessines-tu ou construis-tu tes illustrations ?", "Illustration et dessin"],
    ["three-d", "Comment modélises-tu, sculptes-tu ou animes-tu en 3D ?", "Création 3D"],
    ["spaces", "Comment conçois-tu tes plans, espaces ou scènes ?", "Conception d’espaces"],
    ["audio", "Comment enregistres-tu, montes-tu ou mixes-tu l’audio ?", "Production audio"],
    ["social-content", "Comment produis-tu et déclines-tu tes contenus sociaux ?", "Formats sociaux"],
  ] as const)("renders the creative output %s", (output, question, label) => {
    const html = renderScanner(session({ primarySpecialty: output }));
    expect(html).toContain(question);
    expect(html).toContain(label);
  });

  it("renders Blender and Cinema 4D as peers in the 3D journey", () => {
    const html = renderScanner(session({
      primarySpecialty: "three-d",
    }));
    expect(html).toContain("Comment modélises-tu, sculptes-tu ou animes-tu en 3D ?");
    expect(html).toContain("Blender");
    expect(html).toContain("Cinema 4D");
  });

  it("separates spatial design, technical documentation and rendering", () => {
    const designHtml = renderScanner(session({ primarySpecialty: "spaces" }));
    expect(designHtml).toContain("Comment conçois-tu tes plans, espaces ou scènes ?");
    expect(designHtml).toContain("SketchUp Pro");
    expect(designHtml).toContain("Plans et dossier technique");
    expect(designHtml).toContain("Rendu 3D");

    const documentationHtml = renderScanner(session({
      primarySpecialty: "spaces",
      selectionCoverage: {
        covered: ["space-design", "creative-brief-input"],
        skipped: [],
        confidence: "low",
      },
    }));
    expect(documentationHtml).toContain("Comment produis-tu les plans, coupes, cotations et dossiers à livrer ?");
    expect(documentationHtml).toContain("LayOut");

    const renderHtml = renderScanner(session({
      primarySpecialty: "spaces",
      selectionCoverage: {
        covered: ["space-design", "creative-brief-input", "space-documentation"],
        skipped: [],
        confidence: "low",
      },
    }));
    expect(renderHtml).toContain("Comment produis-tu tes rendus finaux ?");
    expect(renderHtml).toContain("Enscape");
    expect(renderHtml).toContain("Twinmotion");
  });

  it("renders the SketchUp Pro ecosystem only after SketchUp Pro is selected", () => {
    const sketchup = tools.find((item) => item.id === "sketchup-pro")!;
    const html = renderScanner(session({
      primarySpecialty: "spaces",
      selectedTools: [sketchup],
      toolUsageMap: { "sketchup-pro": ["space-design"] },
      selectionCoverage: {
        covered: ["space-design", "creative-brief-input", "space-documentation", "three-d-render"],
        skipped: [],
        confidence: "low",
      },
    }));
    expect(html).toContain("Qu’est-ce qui complète ou accélère ton travail dans SketchUp Pro ?");
    expect(html).toContain("LayOut");
    expect(html).toContain("Fredo6 Bundle");
  });

  it("renders a selected Blender again for rendering without duplicating the stack", () => {
    const blender = tools.find((item) => item.id === "blender")!;
    const html = renderScanner(session({
      primarySpecialty: "three-d",
      selectedTools: [blender],
      toolUsageMap: { blender: ["three-d-creation"] },
      selectionCoverage: {
        covered: ["three-d-creation", "creative-brief-input"],
        skipped: [],
        confidence: "low",
      },
    }));
    expect(html).toContain("Comment produis-tu tes rendus finaux ?");
    expect(html).toContain("déjà dans ta stack");
  });

  it("renders the Blender ecosystem only after Blender is selected", () => {
    const blender = tools.find((item) => item.id === "blender")!;
    const html = renderScanner(session({
      primarySpecialty: "three-d",
      selectedTools: [blender],
      toolUsageMap: {
        blender: ["three-d-creation", "three-d-render"],
      },
      selectionCoverage: {
        covered: ["three-d-creation", "creative-brief-input", "three-d-render"],
        skipped: [],
        confidence: "medium",
      },
    }));
    expect(html).toContain("Qu’est-ce qui complète ou accélère ton travail dans Blender ?");
    expect(html).toContain("BlenderKit");
    expect(html).not.toContain("X-Particles");
  });

  it("does not keep a stale Blender ecosystem after switching away from 3D", () => {
    const blender = tools.find((item) => item.id === "blender")!;
    const html = renderScanner(session({
      primarySpecialty: "photo",
      selectedTools: [blender],
      toolUsageMap: {
        blender: ["three-d-creation"],
      },
    }));

    expect(html).toContain("Comment développes-tu, classes-tu et ajustes-tu tes photos ?");
    expect(html).not.toContain("Autour de Blender");
  });

  it("offers to link a known tool mentioned in the user's free-form method", () => {
    const captureOne = tool({
      id: "capture-one",
      name: "Capture One",
      functional_needs: ["retouche-photo", "color-grading"],
    });
    const html = renderScanner(session({
      primarySpecialty: "photo",
      selectedTools: [captureOne],
      toolUsageMap: {
        "capture-one": ["photo-development"],
      },
      workflowUsages: [{
        id: "usage-photo-development",
        objectiveId: "photo-development",
        objectiveLabelFr: "Développement photo",
        objectiveLabelEn: "Photo development",
        method: "mixed",
        toolIds: ["capture-one"],
        customMethod: "Je trie dans Capture One puis je termine dans Photoshop",
        aiMode: "none",
        aiToolIds: [],
      }],
    }));

    expect(html).toContain("Tu as cité");
    expect(html).toContain("Relier Adobe Photoshop");
  });

  it("renders precise built-in AI capabilities for the current objective", () => {
    const photoshop = tools.find((item) => item.id === "adobe-photoshop")!;
    const html = renderScanner(session({
      primarySpecialty: "photo",
      selectedTools: [photoshop],
      toolUsageMap: {
        "adobe-photoshop": ["photo-development"],
      },
      workflowUsages: [{
        id: "usage-photo-development",
        objectiveId: "photo-development",
        objectiveLabelFr: "Développement photo",
        objectiveLabelEn: "Photo development",
        method: "tool",
        toolIds: ["adobe-photoshop"],
        aiMode: "integrated",
        aiToolIds: [],
        aiActors: [{
          id: "ai-integrated-adobe-photoshop",
          source: "integrated",
          toolId: "adobe-photoshop",
          capabilityIds: ["remove_extend"],
          frequency: "regular",
          constraints: ["credits"],
        }],
      }],
    }));

    expect(html).toContain("Que fait précisément l’IA dans cette étape ?");
    expect(html).toContain("Si tu connais le nom de la fonction IA");
    expect(html).toContain("Adobe Firefly");
    expect(html).toContain("Supprimer, détourer ou étendre");
    expect(html).toContain("Crédits, fiabilité, confidentialité ou droits ?");
  });

  it("renders precise AI roles and declared risks in the restitution", () => {
    const photoshop = tools.find((item) => item.id === "adobe-photoshop")!;
    const chatgpt = tool({
      id: "chatgpt",
      name: "ChatGPT",
      price: 20,
      tool_type: "ia",
      functional_needs: ["brainstorming", "generation-texte"],
    });
    const state = session({
      primarySpecialty: "photo",
      selectedTools: [photoshop, chatgpt],
      toolUsageMap: {
        "adobe-photoshop": ["photo-development"],
        chatgpt: ["photo-development"],
      },
      workflowUsages: [{
        id: "usage-photo-development",
        objectiveId: "photo-development",
        objectiveLabelFr: "Développement photo",
        objectiveLabelEn: "Photo development",
        method: "tool",
        toolIds: ["adobe-photoshop"],
        aiMode: "mixed",
        aiToolIds: ["chatgpt"],
        aiActors: [{
          id: "ai-integrated-adobe-photoshop",
          source: "integrated",
          toolId: "adobe-photoshop",
          featureToolId: "firefly",
          featureName: "Adobe Firefly",
          capabilityIds: ["remove_extend"],
          frequency: "regular",
          constraints: ["privacy", "quota"],
          handlesSensitiveData: true,
        }, {
          id: "ai-external-chatgpt",
          source: "external",
          toolId: "chatgpt",
          capabilityIds: ["research_ideation"],
          frequency: "occasional",
        }],
      }],
      commercialContracts: [{
        id: "contract-adobe",
        familyId: "adobe",
        familyName: "Adobe",
        accessMode: "suite",
        planId: "photography",
        payer: "self",
        productIds: ["adobe-photoshop", "firefly"],
        monthlyPrice: 12,
        aiAllowanceStatus: "extra_purchases",
        variableMonthlyPrice: 8,
        currency: "EUR",
        confirmed: true,
      }],
    });
    const result = runDiagnostic(state, {
      allTools: [photoshop, chatgpt],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const html = renderToStaticMarkup(
      <DashOverview result={result} t={t} />
    );

    expect(html).toContain("Ce que l’IA fait réellement dans ta chaîne");
    expect(html).toContain("Supprimer, détourer ou étendre");
    expect(html).toContain("Recherche et idéation");
    expect(html).toContain("Risque IA à cadrer");
    expect(html).toContain("Adobe Firefly");
    expect(html).toContain("dans Adobe Photoshop");
    expect(html).toContain("Facturé à l’usage ou en crédits");
    expect(html).toContain("Recharges ou dépassements");
    expect(html).toContain("+8 €/mois");
  });

  it("asks about AI allowance effects only inside the relevant commercial family", () => {
    const photoshop = tools.find((item) => item.id === "adobe-photoshop")!;
    const firefly = tools.find((item) => item.id === "firefly")!;
    const html = renderToStaticMarkup(
      <CommercialAccessReview
        tools={[photoshop, firefly]}
        contracts={[{
          id: "contract-adobe",
          familyId: "adobe",
          familyName: "Adobe",
          accessMode: "suite",
          planId: "photography",
          planLabel: "Photography",
          payer: "self",
          productIds: ["adobe-photoshop", "firefly"],
          monthlyPrice: 12,
          aiAllowanceStatus: "sometimes_limited",
          confirmed: true,
        }]}
        aiAllowanceFamilyIds={["adobe"]}
        onChange={noop}
        t={t}
      />
    );

    expect(html).toContain("Pour les fonctions IA, l’enveloppe incluse te suffit-elle ?");
    expect(html).toContain("Pas besoin de connaître le nombre de crédits");
    expect(html).toContain("Je suis parfois limité");
    expect(html).not.toContain("En moyenne, combien cela ajoute-t-il par mois ?");
  });

  it("renders several access lines inside one commercial family", () => {
    const photoshop = tools.find((item) => item.id === "adobe-photoshop")!;
    const illustrator = tool({
      id: "adobe-illustrator",
      name: "Adobe Illustrator",
      functional_needs: ["illustration-vectorielle"],
    });
    const html = renderToStaticMarkup(
      <CommercialAccessReview
        tools={[photoshop, illustrator]}
        contracts={[{
          id: "contract-adobe-photography",
          familyId: "adobe",
          familyName: "Adobe",
          accessMode: "suite",
          planId: "photography",
          planLabel: "Photography plan",
          payer: "self",
          productIds: ["adobe-photoshop", "firefly"],
          monthlyPrice: 12,
          confirmed: true,
        }, {
          id: "contract-adobe-client-illustrator",
          familyId: "adobe",
          familyName: "Adobe",
          accessMode: "client_paid",
          planId: "client-paid",
          planLabel: "Paid by a client",
          payer: "client",
          productIds: ["adobe-illustrator"],
          monthlyPrice: 0,
          confirmed: true,
        }]}
        onChange={noop}
        t={t}
      />
    );

    expect(html).toContain("Adobe");
    expect(html).toContain("2 accès déclarés");
    expect(html).toContain("Photography plan");
    expect(html).toContain("Paid by a client");
    expect(html).toContain("Adobe Photoshop");
    expect(html).toContain("Adobe Illustrator");
  });

  it("renders a confirmed suite contract amount in the overview", () => {
    const illustrator = tool({
      id: "adobe-illustrator",
      name: "Adobe Illustrator",
      functional_needs: ["illustration-vectorielle", "design-visuel"],
    });
    const indesign = tool({
      id: "indesign",
      name: "Adobe InDesign",
      functional_needs: ["mise-en-page", "print"],
    });
    const state = session({
      selectedTools: [illustrator, indesign],
      toolUsageMap: {
        "adobe-illustrator": ["visual-identity"],
        indesign: ["layout-publishing"],
      },
      commercialContracts: [{
        id: "contract-adobe",
        familyId: "adobe",
        familyName: "Adobe",
        accessMode: "suite",
        planId: "all-apps",
        planLabel: "Creative Cloud — toutes les apps",
        payer: "self",
        productIds: ["adobe-illustrator", "indesign"],
        monthlyPrice: 70,
        currency: "EUR",
        confirmed: true,
      }],
    });
    const result = runDiagnostic(state, {
      allTools: [illustrator, indesign],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const html = renderToStaticMarkup(<DashOverview result={result} t={t} />);

    expect(result.stackTotalCost).toBe(70);
    expect(result.healthScore).toBeLessThan(80);
    expect(html).toContain("70 €/mois");
    expect(html).not.toContain("Optimisée");
  });

  it("does not present catalog estimates as a declared budget", () => {
    const figma = tool({
      id: "figma",
      name: "Figma",
      functional_needs: ["ui-design", "prototyping"],
      price: 16,
      catalogMonthlyPrice: 16,
      selectedOffer: "unknown",
      selectedPriceIsEstimate: true,
    });
    const state = session({
      language: "en",
      selectedTools: [figma],
      toolUsageMap: {
        figma: ["ui-design", "prototyping"],
      },
    });
    const result = runDiagnostic(state, {
      allTools: [figma],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const html = renderToStaticMarkup(<DashOverview result={result} t={tEn} />);

    expect(result.stackTotalCost).toBe(16);
    expect(html).toContain("Budget to confirm");
    expect(html).toContain("use it as a guide, not as declared spend");
    expect(html).toContain("pricing or access point(s) still need clarification");
    expect(html).not.toContain("tool(s) still have a usage mode");
    expect(html).not.toContain("Declared budget");
  });

  it("does not ask a redundant pricing question for tools covered by a confirmed contract", () => {
    const illustrator = tool({
      id: "adobe-illustrator",
      name: "Adobe Illustrator",
      price: 26,
      catalogMonthlyPrice: 26,
      selectedOffer: "unknown",
      selectedPriceIsEstimate: true,
    });
    const indesign = tool({
      id: "indesign",
      name: "Adobe InDesign",
      price: 26,
      catalogMonthlyPrice: 26,
      selectedOffer: "unknown",
      selectedPriceIsEstimate: true,
    });
    const stalePricingQuestion: DiscoveryQuestion = {
      id: "adaptive_plan_reality",
      persona: "ALL",
      question: "Pour Adobe Illustrator, Adobe InDesign, le prix catalogue peut être faux pour toi. Tu es plutôt sur quel cas ?",
      questionEn: "For Adobe Illustrator, Adobe InDesign, catalog pricing may be wrong for you. Which case is closest?",
      subtitle: "Je m'en sers pour éviter de surestimer ou sous-estimer ton budget réel.",
      subtitleEn: "I use this to avoid overestimating or underestimating your real budget.",
      options: [
        {
          label: "Plan gratuit ou inclus ailleurs",
          labelEn: "Free plan or included elsewhere",
          impact: "keep",
          affectedTools: ["adobe-illustrator", "indesign"],
        },
      ],
      condition_tool_ids: ["adobe-illustrator", "indesign"],
      condition_type: "any",
    };
    const staleAdobeUsageQuestion: DiscoveryQuestion = {
      id: "dq-adobe-usage",
      persona: "SOFIA",
      question: "Tu utilises combien d'apps Adobe régulièrement ?",
      questionEn: "How many Adobe apps do you use regularly?",
      subtitle: "Si 3+ apps, le pack complet est plus rentable",
      subtitleEn: "If you use 3+ apps, the full suite may be more cost-effective.",
      options: [
        {
          label: "1-2 apps seulement",
          labelEn: "Only 1–2 apps",
          impact: "review",
          affectedTools: ["indesign"],
        },
      ],
      condition_tool_ids: ["indesign"],
      condition_type: "any",
    };
    const html = renderDiscovery(session({
      language: "en",
      selectedTools: [illustrator, indesign],
      commercialContracts: [{
        id: "contract-adobe",
        familyId: "adobe",
        familyName: "Adobe",
        accessMode: "suite",
        planId: "all-apps",
        planLabel: "Creative Cloud — All Apps",
        payer: "self",
        productIds: ["adobe-illustrator", "indesign"],
        monthlyPrice: 70,
        currency: "EUR",
        confirmed: true,
      }],
    }), [stalePricingQuestion, staleAdobeUsageQuestion]);

    expect(html).not.toContain("catalog pricing may be wrong");
    expect(html).not.toContain("How many Adobe apps do you use regularly?");
    expect(html).not.toContain("Tu utilises combien");
    expect(html).toContain("No extra question needed");
  });

  it("does not ask a catalog pricing question after the commercial mode was declared", () => {
    const figma = tool({
      id: "figma",
      name: "Figma",
      price: 16,
      catalogMonthlyPrice: 16,
      selectedOffer: "paid",
      selectedPriceIsEstimate: true,
      functional_needs: ["ui-design"],
    });
    const html = renderDiscovery(session({
      language: "en",
      selectedTools: [figma],
      toolUsageMap: {
        figma: ["ui-design"],
      },
    }));

    expect(html).not.toContain("catalog pricing may be wrong");
  });

  it("renders one global AI actor with several objective-specific roles", () => {
    const chatgpt = tool({
      id: "chatgpt",
      name: "ChatGPT",
      price: 20,
      tool_type: "ia",
      functional_needs: ["brainstorming", "generation-texte"],
    });
    const state = session({
      selectedTools: [chatgpt],
      commercialContracts: [{
        id: "contract-chatgpt",
        familyId: "chatgpt",
        familyName: "ChatGPT",
        accessMode: "single_products",
        payer: "self",
        productIds: ["chatgpt"],
        monthlyPrice: 20,
        confirmed: true,
      }],
      workflowUsages: [{
        id: "usage-brief",
        objectiveId: "brief",
        objectiveLabelFr: "Brief créatif",
        objectiveLabelEn: "Creative brief",
        method: "tool",
        toolIds: [],
        aiMode: "external",
        aiToolIds: ["chatgpt"],
        aiActors: [{
          id: "ai-external-chatgpt",
          source: "external",
          toolId: "chatgpt",
          capabilityIds: ["research_ideation"],
          frequency: "regular",
        }],
      }, {
        id: "usage-variants",
        objectiveId: "variants",
        objectiveLabelFr: "Déclinaisons sociales",
        objectiveLabelEn: "Social variants",
        method: "tool",
        toolIds: [],
        aiMode: "automated",
        aiToolIds: ["chatgpt"],
        aiActors: [{
          id: "ai-automation-chatgpt",
          source: "automation",
          toolId: "chatgpt",
          capabilityIds: ["automate_workflow", "generate_text"],
          frequency: "systematic",
        }],
      }],
    });
    const result = runDiagnostic(state, {
      allTools: [chatgpt],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const html = renderToStaticMarkup(
      <DashOverview result={result} t={t} />
    );

    expect(html).toContain("Plusieurs modes");
    expect(html).toContain("2 étapes");
    expect(html).toContain("Brief créatif");
    expect(html).toContain("Déclinaisons sociales");
    expect(html).toContain("Outil IA séparé");
    expect(html).toContain("Chaîne automatisée");
  });

  it("does not repeat an AI overlap as both a prescription and a workflow action", () => {
    const chatgpt = tool({
      id: "chatgpt",
      name: "ChatGPT",
      price: 20,
      tool_type: "ia",
    });
    const claude = tool({
      id: "claude",
      name: "Claude",
      price: 18,
      tool_type: "ia",
    });
    const state = session({
      selectedTools: [chatgpt, claude],
      workflowUsages: [{
        id: "usage-brief",
        objectiveId: "brief",
        objectiveLabelFr: "Brief créatif",
        objectiveLabelEn: "Creative brief",
        method: "tool",
        toolIds: [],
        aiMode: "external",
        aiToolIds: ["chatgpt", "claude"],
        aiActors: [{
          id: "ai-external-chatgpt",
          source: "external",
          toolId: "chatgpt",
          capabilityIds: ["research_ideation"],
          frequency: "regular",
        }, {
          id: "ai-external-claude",
          source: "external",
          toolId: "claude",
          capabilityIds: ["research_ideation"],
          frequency: "regular",
        }],
      }],
    });
    const result = runDiagnostic(state, {
      allTools: [chatgpt, claude],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const actions = buildActions(result, [chatgpt, claude], t);

    expect(
      actions.filter((action) => action.label.includes("Résoudre doublon"))
    ).toHaveLength(1);
    expect(
      actions.some((action) =>
        action.detail ===
        "Comparer les entrées, sorties et fréquences ; garder les deux seulement si leurs rôles sont réellement distincts."
      )
    ).toBe(false);
  });

  it("keeps the main restitution to three proven decisions", () => {
    const a = tool({ id: "audit-a", name: "Audit A", price: 20 });
    const b = tool({ id: "audit-b", name: "Audit B", price: 30 });
    const c = tool({ id: "audit-c", name: "Audit C", price: 40 });
    const d = tool({ id: "audit-d", name: "Audit D", price: 50 });
    const unproved = tool({ id: "unproved-ai", name: "Unproved AI", tool_type: "ia" });
    const base = runDiagnostic(session({ selectedTools: [a, b, c, d] }), {
      allTools: [a, b, c, d, unproved],
      doublonRules: [],
      discoveryQuestions: [],
    });
    const result: DiagnosticResult = {
      ...base,
      prescriptions: {
        phase1: [
          { toolId: "audit-a", type: "pricing-tier", verdict: "review", message: "Preuve A", savingsEstimate: 20 },
          { toolId: "audit-b", type: "pricing-tier", verdict: "review", message: "Preuve B", savingsEstimate: 18 },
          { toolId: "audit-c", type: "pricing-tier", verdict: "review", message: "Preuve C", savingsEstimate: 16 },
          { toolId: "audit-d", type: "pricing-tier", verdict: "review", message: "Preuve D", savingsEstimate: 14 },
        ],
        phase2: [],
        phase3: [],
      },
      recommendations: [unproved],
      recommendationEvidence: {},
      insights: {
        ...base.insights,
        answerSignals: [],
        focusAreas: [],
      },
    };

    const decisions = buildDiagnosticDecisionPlan(result);
    const actions = buildActions(result, [a, b, c, d, unproved], t);

    expect(decisions).toHaveLength(3);
    expect(actions).toHaveLength(3);
    expect(decisions.every((decision) => decision.evidenceFr.trim().length > 0)).toBe(true);
    expect(decisions.some((decision) => decision.tool?.id === "unproved-ai")).toBe(false);
    expect(getProvenRecommendations(result)).toHaveLength(0);
  });

  it("tests the existing workflow before turning a friction into a new primary tool decision", () => {
    const indesign = tool({
      id: "indesign",
      name: "Adobe InDesign",
      functional_needs: ["mise-en-page", "print"],
    });
    const figma = tool({
      id: "figma-ui",
      name: "Figma",
      functional_needs: ["ui-design", "design-system", "wireframing"],
    });
    const result = runDiagnostic(session({
      primarySpecialty: "ui-product",
      selectedTools: [indesign],
      toolUsageMap: { indesign: ["ui-design"] },
      workflowUsages: [{
        id: "usage-ui-design",
        objectiveId: "ui-design",
        objectiveLabelFr: "Conception d’interfaces",
        objectiveLabelEn: "Interface design",
        method: "mixed",
        toolIds: ["indesign"],
        customMethod: "Je fais mes écrans dans InDesign",
        aiMode: "none",
        aiToolIds: [],
        satisfaction: "friction",
      }],
      selectionCoverage: {
        covered: ["ui-design"],
        skipped: [],
        confidence: "high",
      },
    }), {
      allTools: [indesign, figma],
      doublonRules: [],
      discoveryQuestions: [],
    });

    const decisions = buildDiagnosticDecisionPlan(result);

    expect(result.recommendations.map((item) => item.id)).toContain("figma-ui");
    expect(getProvenRecommendations(result).map((item) => item.tool.id)).toContain("figma-ui");
    expect(decisions.some((decision) => decision.tool?.id === "figma-ui")).toBe(false);
    expect(
      decisions.some((decision) =>
        decision.labelFr.includes("Tester une amélioration") &&
        decision.detailFr.includes("InDesign")
      )
    ).toBe(true);
  });
});
