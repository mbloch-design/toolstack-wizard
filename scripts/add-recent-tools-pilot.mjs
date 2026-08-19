#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const toolsPath = "src/data/tools_v4.json";
const indexPath = "src/data/tools_index.json";
const manifestPath = "docs/tool-catalog-migration/contract-v3/manifest-1126.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const common = {
  logo: "",
  articles: [],
  personas: [],
  timeGainedHoursPerMonth: null,
  freeAlternative: null,
  betterAlternative: null,
  migrationGuide: null,
  downgradePlan: null,
  tool_type: "satellite",
  substitutable: true,
  host_app: null,
  bundle_parent: null,
  verticals: ["consultant-b2b", "createur-contenu"],
  prescription_quality: "question",
  prescription_output: null,
  prescription_block_reasons: [],
  prescription_context_questions: [],
  decision_policy_v3: null,
  force_silence: false,
};

const additions = [
  {
    ...common,
    id: "audionotes",
    slug: "audionotes",
    name: "Audionotes",
    category: "organization",
    shortDescription: "Transforme notes vocales, fichiers et vidéos en notes structurées et interrogeables.",
    shortDescriptionEn: "Turns voice notes, files and videos into structured, searchable notes.",
    description: "Audionotes centralise la capture vocale et transforme les enregistrements, fichiers, images ou vidéos en transcriptions, résumés et notes structurées. L’outil vise surtout les personnes qui veulent capturer une idée rapidement puis la retrouver sans reprendre leurs notes à la main.",
    longDescription: "Audionotes centralise la capture vocale et transforme les enregistrements, fichiers, images ou vidéos en transcriptions, résumés et notes structurées. Il convient aux indépendants, étudiants et créateurs qui accumulent des idées orales et veulent ensuite les rechercher ou les retravailler.\n\nLe plan gratuit sert à tester la capture courte. L’abonnement Pro devient pertinent lorsque les fichiers longs, les imports et les traitements IA font partie du travail courant. Pour des réunions multi-intervenants avec administration d’équipe avancée, un outil spécialisé dans les comptes rendus de réunion sera plus adapté.",
    longDescriptionEn: "Audionotes centralizes voice capture and turns recordings, files, images or videos into transcripts, summaries and structured notes. It suits independent workers, students and creators who collect spoken ideas and need to search or refine them later.\n\nThe free plan is useful for testing short captures. Pro becomes relevant when longer files, imports and AI processing are part of the regular workflow. A dedicated meeting-intelligence platform is a better fit for multi-speaker meetings and advanced team administration.",
    pricing: { free: "Plan gratuit durable avec limites de capture.", paid: "Pro annuel ; Enterprise sur devis." },
    pricingEn: { free: "Permanent free plan with capture limits.", paid: "Annual Pro plan; Enterprise by quote." },
    defaultMonthlyPrice: 0,
    affiliateLink: "https://www.audionotes.app/",
    websiteUrl: "https://www.audionotes.app/",
    pros: ["Capture vocale rapide sur plusieurs plateformes", "Transcription, résumé et recherche réunis", "Import de plusieurs formats de contenu"],
    prosEn: ["Fast voice capture across several platforms", "Transcription, summaries and search in one place", "Imports several content formats"],
    cons: ["Le plan gratuit limite fortement la durée des enregistrements", "Moins orienté gouvernance d’équipe qu’un outil de réunion", "La qualité dépend du son et du contexte de parole"],
    consEn: ["The free plan tightly limits recording length", "Less team-governance focused than a meeting tool", "Quality depends on audio and speech conditions"],
    useCases: ["Capturer et structurer des idées dictées", "Résumer un fichier audio ou une vidéo", "Retrouver une information dans des notes vocales"],
    useCasesEn: ["Capture and structure dictated ideas", "Summarize an audio file or video", "Retrieve information from voice notes"],
    covers: ["note-taking", "transcription", "voice-notes"],
    relevantFor: ["consultant", "createur-contenu", "etudiant"],
    functional_needs: ["note-taking", "transcription", "knowledge-management"],
    alternatives: ["otter", "granola"],
    soloRelevance: "high",
    teamRelevance: "medium",
    substitution_cluster_v2: "ai-note-taking",
    ia_use_case: ["transcription", "summarization"],
    verdict: { keepIf: ["Tu captures souvent tes idées à l’oral", "Tu veux rechercher et retravailler plusieurs formats dans un même espace"], avoidIf: ["Tu cherches surtout des comptes rendus de réunions d’équipe", "Tu as besoin d’un fonctionnement entièrement hors ligne"], threshold: "Pertinent lorsque la reprise manuelle des notes vocales devient une tâche récurrente." },
    verdictEn: { keepIf: ["You often capture ideas by voice", "You want to search and refine several formats in one workspace"], avoidIf: ["Your main need is team meeting minutes", "You require a fully offline workflow"], threshold: "Useful once manually processing voice notes becomes recurring work." },
    seo: { metaDescription: "Audionotes : transcription et structuration de notes vocales, usages, limites et choix du plan pour les indépendants.", aiAngle: { stance: "native", augmentFr: "L’IA assure la transcription, le résumé et la restructuration des captures.", augmentEn: "AI handles transcription, summarization and restructuring of captures.", replaceFr: "L’outil réduit la reprise manuelle des notes, sans remplacer le tri ni la décision humaine.", replaceEn: "The tool reduces manual note processing without replacing human selection or decisions.", aiTools: [] } },
    ogImageUrl: "https://tooltrim.com/og-screenshots/audionotes.png",
  },
  {
    ...common,
    id: "visualcv",
    slug: "visualcv",
    name: "VisualCV",
    category: "organization",
    shortDescription: "Crée, adapte et partage des CV avec modèles, exports PDF et suivi des consultations.",
    shortDescriptionEn: "Creates, adapts and shares resumes with templates, PDF exports and view analytics.",
    description: "VisualCV est un constructeur de CV en ligne avec modèles, versions ciblées, export PDF, lien partageable et suivi des consultations.",
    longDescription: "VisualCV aide à produire plusieurs versions ciblées d’un CV, les exporter en PDF et les partager via un lien. L’outil ajoute des modèles, une lettre de motivation, un site professionnel simple et des statistiques de consultation.\n\nLe compte gratuit suffit pour tester la structure et préparer un premier CV. Pro devient utile pour multiplier les candidatures ciblées et débloquer les exports et modèles avancés. Il ne remplace pas le travail de fond sur le positionnement, les preuves d’expérience et l’adaptation au poste.",
    longDescriptionEn: "VisualCV helps create targeted resume versions, export them as PDFs and share them through a link. It adds templates, cover-letter tooling, a simple professional website and view analytics.\n\nThe free account is enough to test the structure and prepare a first resume. Pro is useful for multiple targeted applications and advanced exports or templates. It does not replace the substantive work of positioning experience and adapting evidence to a role.",
    pricing: { free: "Compte gratuit durable.", paid: "Abonnement Pro mensuel ou trimestriel." },
    pricingEn: { free: "Permanent free account.", paid: "Monthly or quarterly Pro membership." },
    defaultMonthlyPrice: 0,
    affiliateLink: "https://www.visualcv.com/",
    websiteUrl: "https://www.visualcv.com/",
    pros: ["Plusieurs versions de CV dans un même compte", "Exports PDF et liens partageables", "Modèles et suivi des consultations"],
    prosEn: ["Several resume versions in one account", "PDF exports and shareable links", "Templates and view analytics"],
    cons: ["Les fonctions avancées nécessitent Pro", "Un modèle ne corrige pas un positionnement flou", "Moins flexible qu’un outil de mise en page généraliste"],
    consEn: ["Advanced features require Pro", "A template cannot fix unclear positioning", "Less flexible than a general layout tool"],
    useCases: ["Créer un CV ciblé par type de poste", "Partager un CV avec un lien suivi", "Maintenir plusieurs versions sans dupliquer des fichiers"],
    useCasesEn: ["Create a resume targeted to each role type", "Share a resume with a tracked link", "Maintain several versions without duplicating files"],
    covers: ["resume-builder", "cover-letter", "job-search"],
    relevantFor: ["all"],
    functional_needs: ["resume-building", "job-application"],
    alternatives: ["canva"],
    soloRelevance: "high",
    teamRelevance: "low",
    substitution_cluster_v2: "resume-builder",
    ia_use_case: null,
    verdict: { keepIf: ["Tu maintiens plusieurs CV ciblés", "Tu veux un export propre sans gérer la mise en page"], avoidIf: ["Tu maîtrises déjà un outil de mise en page", "Tu attends que l’outil définisse ton positionnement à ta place"], threshold: "Pro se justifie surtout pendant une période de candidatures actives et ciblées." },
    verdictEn: { keepIf: ["You maintain several targeted resumes", "You want clean exports without managing layout"], avoidIf: ["You already master a layout tool", "You expect the tool to define your positioning"], threshold: "Pro mainly makes sense during an active period of targeted applications." },
    seo: { metaDescription: "VisualCV : création de CV, modèles, exports et limites. Découvrez quand le compte Pro est réellement utile.", aiAngle: { stance: "augment", augmentFr: "Les fonctions d’assistance accélèrent la formulation, mais la sélection des expériences reste humaine.", augmentEn: "Assistance features speed up wording, while experience selection remains human.", replaceFr: "VisualCV remplace surtout la mise en page répétitive, pas le conseil de carrière ni la preuve des compétences.", replaceEn: "VisualCV mainly replaces repetitive layout work, not career advice or evidence of skills.", aiTools: [] } },
    ogImageUrl: "https://tooltrim.com/og-screenshots/visualcv.png",
  },
  {
    ...common,
    id: "jenni",
    slug: "jenni",
    name: "Jenni AI",
    category: "creation",
    shortDescription: "Assistant de rédaction académique avec autocomplétion, citations, bibliothèque et révision.",
    shortDescriptionEn: "Academic writing assistant with autocomplete, citations, a source library and review tools.",
    description: "Jenni AI accompagne la rédaction académique avec autocomplétion, chat, révision, citations et import de documents.",
    longDescription: "Jenni AI concentre dans un éditeur l’autocomplétion, la reformulation, le dialogue avec des documents et la gestion des citations. Il vise surtout les étudiants et chercheurs qui travaillent à partir d’une bibliothèque de sources et veulent accélérer les premières formulations.\n\nLe plan gratuit permet d’évaluer le flux de travail avec des limites. Plus convient à un usage régulier ; Pro vise un volume plus soutenu. L’outil ne doit pas être utilisé pour fabriquer des sources, masquer l’origine d’un texte ou remplacer la vérification des citations et le raisonnement de l’auteur.",
    longDescriptionEn: "Jenni AI combines autocomplete, rewriting, document chat and citation management in one editor. It mainly targets students and researchers working from a source library who want to accelerate early drafts.\n\nThe free plan lets users evaluate the workflow with limits. Plus fits regular use; Pro targets heavier volume. The tool should not be used to fabricate sources, conceal authorship or replace citation checks and the writer’s reasoning.",
    pricing: { free: "Plan gratuit durable avec limites d’usage.", paid: "Plans Plus et Pro, facturation mensuelle ou annuelle." },
    pricingEn: { free: "Permanent free plan with usage limits.", paid: "Plus and Pro plans, billed monthly or annually." },
    defaultMonthlyPrice: 0,
    affiliateLink: "https://jenni.ai/",
    websiteUrl: "https://jenni.ai/",
    pros: ["Éditeur centré sur les sources et citations", "Autocomplétion, révision et chat réunis", "Import de documents et nombreux styles bibliographiques"],
    prosEn: ["Editor focused on sources and citations", "Autocomplete, review and chat in one place", "Document imports and many citation styles"],
    cons: ["Les sorties et citations doivent être vérifiées", "Les limites du plan gratuit arrivent vite", "Risque de dépendance pour la formulation et le raisonnement"],
    consEn: ["Outputs and citations still require checking", "Free-plan limits are reached quickly", "Risk of over-reliance for wording and reasoning"],
    useCases: ["Structurer un premier brouillon académique", "Reformuler un passage à partir de sources", "Gérer citations et bibliothèque dans le même éditeur"],
    useCasesEn: ["Structure an initial academic draft", "Rewrite a passage from source material", "Manage citations and a library in one editor"],
    covers: ["academic-writing", "citations", "writing-assistant"],
    relevantFor: ["etudiant", "chercheur", "redacteur"],
    functional_needs: ["writing-assistance", "citation-management", "document-review"],
    alternatives: ["grammarly", "notebooklm"],
    soloRelevance: "high",
    teamRelevance: "low",
    substitution_cluster_v2: "ai-writing-assistant",
    ia_use_case: ["writing", "summarization"],
    verdict: { keepIf: ["Tu écris régulièrement à partir d’une bibliothèque de sources", "Tu veux citations et assistance dans le même éditeur"], avoidIf: ["Tu ne peux pas vérifier chaque source et citation", "Tu cherches à déléguer le raisonnement ou masquer l’usage de l’IA"], threshold: "Utile lorsque la préparation et la révision de textes sourcés deviennent récurrentes." },
    verdictEn: { keepIf: ["You regularly write from a source library", "You want citations and assistance in one editor"], avoidIf: ["You cannot verify every source and citation", "You want to outsource reasoning or conceal AI use"], threshold: "Useful when preparing and reviewing sourced writing becomes recurring work." },
    seo: { metaDescription: "Jenni AI : assistant de rédaction académique, citations, limites et différences entre les plans pour un usage responsable.", aiAngle: { stance: "native", augmentFr: "L’IA accélère le brouillon, la reformulation et l’exploration de documents fournis.", augmentEn: "AI accelerates drafting, rewriting and exploration of supplied documents.", replaceFr: "Elle ne remplace ni la vérification des sources, ni l’argumentation, ni la responsabilité de l’auteur.", replaceEn: "It does not replace source verification, argumentation or author accountability.", aiTools: [] } },
    ogImageUrl: "https://tooltrim.com/og-screenshots/jenni.png",
  },
];

const tools = JSON.parse(await readFile(toolsPath, "utf8"));
const existing = new Set(tools.map((tool) => tool.slug || tool.id));
const inserted = additions.filter((tool) => !existing.has(tool.slug));
for (const addition of additions) {
  const current = tools.find((tool) => (tool.slug || tool.id) === addition.slug);
  if (current) Object.assign(current, addition);
  else tools.push(addition);
}
tools.sort((a, b) => (a.name || "").localeCompare(b.name || "", "fr"));
const toolsRaw = `${JSON.stringify(tools, null, 2)}\n`;

const summaries = tools.map((tool) => ({
  id: tool.id,
  slug: tool.slug,
  name: tool.name,
  categoryId: tool.category,
  shortDescription: tool.shortDescription || "",
  shortDescriptionEn: tool.shortDescriptionEn || "",
  pricing: tool.pricing || { free: "", paid: "" },
  defaultMonthlyPrice: tool.defaultMonthlyPrice || 0,
  affiliateLink: tool.affiliateLink || "",
  websiteUrl: tool.websiteUrl || tool.affiliateLink || "",
  ogImageUrl: tool.ogImageUrl || "",
  logo: tool.logo || "",
  tool_type: tool.tool_type || "satellite",
  host_app: tool.host_app || null,
  bundle_parent: tool.bundle_parent || null,
  substitution_cluster_v2: tool.substitution_cluster_v2 || null,
  functional_needs: tool.functional_needs || [],
  verticals: tool.verticals || [],
  relevantFor: tool.relevantFor || [],
  freeAlternative: tool.freeAlternative || null,
  substitutable: tool.substitutable ?? true,
  betterAlternative: tool.betterAlternative || null,
}));

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const slugs = tools.map((tool) => tool.slug || tool.id).sort();
manifest.generatedOn = "2026-08-18";
manifest.gitCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
manifest.gitBranch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
manifest.source.sha256 = sha256(toolsRaw);
manifest.source.recordCount = tools.length;
manifest.slugCount = slugs.length;
manifest.slugListSha256 = sha256(`${slugs.join("\n")}\n`);
manifest.slugs = slugs;
manifest.legacyIsFreeReference.trueCount += inserted.length;
manifest.note = "Liste explicite des routes tool/ publiées, étendue par lots contrôlés. Aucun slug implicite.";

await writeFile(toolsPath, toolsRaw);
await writeFile(indexPath, `${JSON.stringify(summaries, null, 2)}\n`);
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ inserted: inserted.map((tool) => tool.slug), total: tools.length }, null, 2));
