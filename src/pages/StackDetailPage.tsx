import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Lightbulb, X } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import {
  STACK_PERSONAS,
  STACK_STAGES,
  STACKS,
  type StackGuide,
  type StackInsight,
  type StackPersona,
  type StackStage,
  type StackToolSlot,
} from "@/data/stacks";

/* ─── Stack layer grouping ───────────────────────────────────────────────── */
const STACK_LAYERS = [
  {
    id: "sell",
    titleFr: "Acquisition & vente",
    titleEn: "Acquisition & sales",
    match: ["pipeline", "rendez-vous", "qualification", "formulaire", "email", "social", "vente", "crm", "seo", "prospection"],
  },
  {
    id: "create",
    titleFr: "Production & livraison",
    titleEn: "Production & delivery",
    match: ["création", "design", "contenu", "base de travail", "fichiers", "déploiement", "repo", "produit", "asset", "prototype", "handoff", "feedback", "plugin", "modélisation", "plans", "rendu", "image", "moodboard"],
  },
  {
    id: "ops",
    titleFr: "Ops & automatisation",
    titleEn: "Ops & automation",
    match: ["pilotage", "automatisation", "base", "documentation", "workspace", "operations", "stockage", "projet", "coordination", "planning", "sourcing", "fichiers", "rendez-vous", "ia", "assistant"],
  },
  {
    id: "money",
    titleFr: "Finance & admin",
    titleEn: "Finance & admin",
    match: ["paiement", "facturation", "billing", "payment", "compte pro", "signature", "compta"],
  },
  {
    id: "measure",
    titleFr: "Mesure & support",
    titleEn: "Measurement & support",
    match: ["analytics", "mesure", "support", "ux", "reporting", "tracking", "recherche"],
  },
];

/* ─── Expert tips ────────────────────────────────────────────────────────── */
const EXPERT_TIPS_BY_STACK: Record<string, StackInsight[]> = {
  "developpeur-freelance-shipper": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "GitHub + Vercel + Notion + Stripe. Ajoute Cursor seulement si tu livres du code chaque semaine, sinon ChatGPT suffit pour cadrer et débugger.", detailEn: "GitHub + Vercel + Notion + Stripe. Add Cursor only if you ship code weekly; otherwise ChatGPT is enough for scoping and debugging." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Crée un template Notion par mission avec brief, décisions, changelog et lien preview Vercel. Le client suit sans te relancer.", detailEn: "Create one Notion template per project with brief, decisions, changelog, and Vercel preview link. The client tracks progress without chasing you." },
    { title: "Plugin / réglage", titleEn: "Plugin / setting", detail: "Ajoute un fichier de règles projet pour Cursor ou ton IA : stack technique, conventions, composants à réutiliser, choses à ne pas modifier.", detailEn: "Add project rules for Cursor or your AI: tech stack, conventions, reusable components, and things not to touch." },
  ],
  "designer-freelance-solo": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Figma reste le centre. Plugins minimum : Tokens Studio si système maintenu, Iconify pour les icônes, Stark pour accessibilité. Canva sert aux déclinaisons, pas à la source design.", detailEn: "Figma stays central. Minimum plugins: Tokens Studio for maintained systems, Iconify for icons, Stark for accessibility. Canva handles variations, not the design source." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Prépare une page client Notion avec brief, moodboard, validations et liens Figma. Tu transformes ton process en livrable visible.", detailEn: "Prepare a client Notion page with brief, moodboard, approvals, and Figma links. Your process becomes visible deliverable value." },
    { title: "À challenger", titleEn: "Challenge", detail: "Adobe complet ne doit rester actif que si tu ouvres vraiment Photoshop, Illustrator ou Lightroom chaque mois. Sinon plan photo ou alternative dédiée.", detailEn: "Full Adobe should stay active only if you actually open Photoshop, Illustrator, or Lightroom monthly. Otherwise use the photo plan or a focused alternative." },
  ],
  "architecte-interieur": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "SketchUp Pro + LayOut + AutoCAD LT + D5 Render + Programa + Notion + Indy/Qonto/Yousign. C'est complet sans basculer trop tôt dans une stack BIM lourde.", detailEn: "SketchUp Pro + LayOut + AutoCAD LT + D5 Render + Programa + Notion + Indy/Qonto/Yousign. It is complete without moving too early into a heavy BIM stack." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Crée un modèle de dossier projet : 01_ADMIN, 02_BRIEF, 03_REFERENCES, 04_PLANS, 05_3D, 06_RENDUS, 07_SOURCING, 08_BUDGET, 09_CHANTIER, 10_LIVRAISON.", detailEn: "Create a project folder template: 01_ADMIN, 02_BRIEF, 03_REFERENCES, 04_PLANS, 05_3D, 06_RENDUS, 07_SOURCING, 08_BUDGET, 09_CHANTIER, 10_LIVRAISON." },
    { title: "À challenger", titleEn: "Challenge", detail: "V-Ray, Revit, Archicad, Rhino et Twinmotion doivent répondre à un livrable précis. Sinon, garde-les en outil projet, pas en abonnement permanent.", detailEn: "V-Ray, Revit, Archicad, Rhino, and Twinmotion must answer a precise deliverable. Otherwise keep them as project tools, not permanent subscriptions." },
  ],
  "scenographe-evenementiel": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "SketchUp ou Vectorworks pour le volume, D5 pour valider vite, InDesign pour le dossier, Notion pour les décisions et fournisseurs.", detailEn: "SketchUp ou Vectorworks pour le volume, D5 pour valider vite, InDesign pour le dossier, Notion pour les décisions et fournisseurs." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "OpenCutList, Transmutr et CleanUp évitent que la 3D devienne impossible à fabriquer ou trop lourde.", detailEn: "OpenCutList, Transmutr et CleanUp évitent que la 3D devienne impossible à fabriquer ou trop lourde." },
    { title: "À challenger", titleEn: "Challenge", detail: "Twinmotion et Skatter se justifient quand l'expérience ou l'ambiance vend vraiment le projet.", detailEn: "Twinmotion et Skatter se justifient quand l'expérience ou l'ambiance vend vraiment le projet." },
  ],
  "designer-stand-retail-popup": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "SketchUp + Illustrator + InDesign + Notion couvre déjà concept, signalétique, dossier et production.", detailEn: "SketchUp + Illustrator + InDesign + Notion couvre déjà concept, signalétique, dossier et production." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Airtable devient utile quand tu gères beaucoup de références, prix, prestataires et statuts.", detailEn: "Airtable devient utile quand tu gères beaucoup de références, prix, prestataires et statuts." },
    { title: "À challenger", titleEn: "Challenge", detail: "V-Ray doit rester lié à une image premium vendue, pas à chaque proposition.", detailEn: "V-Ray doit rester lié à une image premium vendue, pas à chaque proposition." },
  ],
  "designer-graphique-pro": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Illustrator, Photoshop et InDesign restent le noyau si tu livres print, identité et fichiers sources.", detailEn: "Illustrator, Photoshop et InDesign restent le noyau si tu livres print, identité et fichiers sources." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Eagle + FontBase font gagner du temps sur les assets et typographies, souvent plus que de nouveaux outils créatifs.", detailEn: "Eagle + FontBase font gagner du temps sur les assets et typographies, souvent plus que de nouveaux outils créatifs." },
    { title: "À challenger", titleEn: "Challenge", detail: "Canva et Adobe Express servent aux déclinaisons rapides, pas à la source de vérité.", detailEn: "Canva et Adobe Express servent aux déclinaisons rapides, pas à la source de vérité." },
  ],
  "brand-designer-systeme": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Figma ou Illustrator crée le système, Brandpad ou Notion le rend utilisable par le client.", detailEn: "Figma ou Illustrator crée le système, Brandpad ou Notion le rend utilisable par le client." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Ajoute Specify ou Tokens Studio seulement si la marque va vers un vrai système digital.", detailEn: "Ajoute Specify ou Tokens Studio seulement si la marque va vers un vrai système digital." },
    { title: "À challenger", titleEn: "Challenge", detail: "L'IA aide à explorer des territoires, mais la stratégie doit rester décidée et argumentée.", detailEn: "L'IA aide à explorer des territoires, mais la stratégie doit rester décidée et argumentée." },
  ],
  "directeur-artistique": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Are.na, ShotDeck, Eagle et Milanote doivent nourrir une décision, pas devenir une collection infinie.", detailEn: "Are.na, ShotDeck, Eagle et Milanote doivent nourrir une décision, pas devenir une collection infinie." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Frame.io est très utile dès que les retours portent sur vidéo, photo ou séquences.", detailEn: "Frame.io est très utile dès que les retours portent sur vidéo, photo ou séquences." },
    { title: "À challenger", titleEn: "Challenge", detail: "Runway, Krea ou Midjourney doivent servir une intention déjà formulée.", detailEn: "Runway, Krea ou Midjourney doivent servir une intention déjà formulée." },
  ],
  "developpeur-webflow-nocode-creatif": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Relume + Figma avant Webflow évitent beaucoup de pages mal cadrées.", detailEn: "Relume + Figma avant Webflow évitent beaucoup de pages mal cadrées." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Chaque script, app Webflow ou automation doit avoir une note de rôle et de maintenance.", detailEn: "Chaque script, app Webflow ou automation doit avoir une note de rôle et de maintenance." },
    { title: "À challenger", titleEn: "Challenge", detail: "Plausible et Search Console suffisent souvent avant d'ajouter une couche analytics lourde.", detailEn: "Plausible et Search Console suffisent souvent avant d'ajouter une couche analytics lourde." },
  ],
  "monteur-video": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Choisis un outil principal : DaVinci pour le tout-en-un, Premiere si le client vit dans Adobe.", detailEn: "Choisis un outil principal : DaVinci pour le tout-en-un, Premiere si le client vit dans Adobe." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Frame.io transforme les retours flous en actions timecodées.", detailEn: "Frame.io transforme les retours flous en actions timecodées." },
    { title: "À challenger", titleEn: "Challenge", detail: "Topaz Video et Runway restent des outils de finition ou de sauvetage, pas le cœur du montage.", detailEn: "Topaz Video et Runway restent des outils de finition ou de sauvetage, pas le cœur du montage." },
  ],
  "realisateur-videaste": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "La valeur est autant en préproduction qu'en montage : brief, moodboard, shotlist et planning doivent être visibles.", detailEn: "La valeur est autant en préproduction qu'en montage : brief, moodboard, shotlist et planning doivent être visibles." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "ShotDeck et Milanote aident à vendre une direction image avant le tournage.", detailEn: "ShotDeck et Milanote aident à vendre une direction image avant le tournage." },
    { title: "À challenger", titleEn: "Challenge", detail: "Yousign, Indy et Drive ferment la boucle : accord, acompte, livraison, archive.", detailEn: "Yousign, Indy et Drive ferment la boucle : accord, acompte, livraison, archive." },
  ],
  "consultant-b2b-propre": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Pipedrive si tu as un vrai pipeline, Notion si tu as surtout des missions. Calendly seulement si les rendez-vous sont fréquents.", detailEn: "Pipedrive if you have a real pipeline, Notion if you mostly manage projects. Calendly only if meetings are frequent." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Ajoute trois champs non négociables dans le CRM : montant, prochaine action, date de relance. Sans ça, l'outil ne sert qu'à se rassurer.", detailEn: "Add three non-negotiable CRM fields: amount, next action, follow-up date. Without them, the tool only provides reassurance." },
    { title: "Fiche à ajouter si besoin", titleEn: "Tool page to add if needed", detail: "Si ton conseil devient très réseau/intros, Folk mérite une vraie fiche produit et peut remplacer un CRM trop commercial.", detailEn: "If your consulting depends on network and intros, Folk deserves a full product page and can replace an overly sales-oriented CRM." },
  ],
  "createur-contenu-operateur": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Notion pour backlog, ChatGPT ou Claude pour transformer, Canva pour formats rapides, Buffer seulement si tu publies vraiment sur plusieurs canaux.", detailEn: "Notion for backlog, ChatGPT or Claude for transformation, Canva for fast formats, Buffer only if you truly publish on several channels." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Crée un template de recyclage : idée longue, post LinkedIn, newsletter, carrousel, script court. Un contenu doit générer plusieurs sorties.", detailEn: "Create a repurposing template: long idea, LinkedIn post, newsletter, carousel, short script. One content piece should create several outputs." },
    { title: "Réglage IA", titleEn: "AI setting", detail: "Configure un prompt permanent avec ton audience, ton niveau de langage, tes interdits éditoriaux et trois exemples de bons textes.", detailEn: "Configure persistent instructions with your audience, language level, editorial no-goes, and three examples of strong writing." },
  ],
  "ops-manager-fractional-coo": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "ClickUp ou Notion pour piloter, Make pour automatiser, Airtable seulement quand les données deviennent trop structurées pour Notion.", detailEn: "ClickUp or Notion for operating, Make for automation, Airtable only when data becomes too structured for Notion." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Vends ton kit de mission : kick-off, cadence hebdo, plan 30 jours, SOP, closing. Ce n'est pas l'outil qui fait l'expertise, c'est le système réutilisable.", detailEn: "Sell your engagement kit: kickoff, weekly cadence, 30-day plan, SOP, closing. Expertise is not the tool; it is the reusable system." },
    { title: "Automatisation utile", titleEn: "Useful automation", detail: "Dans Make, chaque scénario doit avoir un nom métier et une note d'intention. Sinon personne ne saura le maintenir dans trois mois.", detailEn: "In Make, every scenario needs a business name and intent note. Otherwise nobody will maintain it three months later." },
  ],
  "freelance-solo-zero-bloat": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Notion + Drive + Tally + Stripe. Ajoute Indy si l'administratif français devient le vrai irritant.", detailEn: "Notion + Drive + Tally + Stripe. Add Indy if French admin becomes the real pain point." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Un formulaire Tally bien écrit vaut mieux qu'un appel découverte flou. Demande contexte, budget, urgence, livrable attendu et décideur.", detailEn: "A well-written Tally form beats a vague discovery call. Ask context, budget, urgency, expected deliverable, and decision-maker." },
    { title: "À éviter", titleEn: "Avoid", detail: "Ne prends pas CRM, outil projet complet et newsletter avant d'avoir un canal d'acquisition stable.", detailEn: "Do not take CRM, full project management, and newsletter tools before you have a stable acquisition channel." },
  ],
  "ecommerce-retention-support": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Shopify, GA4, Klaviyo, Gorgias et Hotjar sur pages à friction.", detailEn: "Shopify, GA4, Klaviyo, Gorgias, and Hotjar on friction pages." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Commence par trois flows Klaviyo : abandon panier, post-achat, winback.", detailEn: "Start with three Klaviyo flows: cart abandonment, post-purchase, winback." },
    { title: "À challenger", titleEn: "Challenge", detail: "Les apps Shopify ralentissent la boutique. Coupe toute app sans métrique de marge associée.", detailEn: "Shopify apps slow the store. Cut any app without an attached margin metric." },
  ],
  "designer-ui-ux-systeme-produit": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Figma, Tokens Studio, Iconify, Stark. Ajoute Content Reel seulement si tu dois remplir beaucoup d'écrans réalistes.", detailEn: "Figma, Tokens Studio, Iconify, Stark. Add Content Reel only if you need to populate many realistic screens." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Avant le handoff, vérifie tokens, contrastes, états vides, erreurs, loading et responsive.", detailEn: "Before handoff, check tokens, contrast, empty states, errors, loading, and responsive." },
    { title: "Plugin / réglage", titleEn: "Plugin / setting", detail: "Tokens Studio devient utile quand les tokens sortent de Figma vers GitHub ou plusieurs thèmes.", detailEn: "Tokens Studio becomes useful when tokens leave Figma for GitHub or multiple themes." },
  ],
  "motion-video-studio-solo": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Screen Studio pour les démos produit, CapCut pour les formats sociaux, DaVinci Resolve pour le montage propre.", detailEn: "Screen Studio for product demos, CapCut for social formats, DaVinci Resolve for clean editing." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Décide le format de sortie avant l'outil : vidéo sociale, démo produit, Lottie web ou animation interactive.", detailEn: "Choose the output format before the tool: social video, product demo, web Lottie, or interactive animation." },
    { title: "Plugins / crédits", titleEn: "Plugins / credits", detail: "Bodymovin est utile si After Effects exporte vers le web. Rive est meilleur pour les animations avec états.", detailEn: "Bodymovin is useful when After Effects exports to web. Rive is better for state-based animations." },
  ],
  "consultant-revops-pipeline": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Pipedrive pour le pipe, Folk pour le réseau, Calendly pour la prise de rendez-vous, Notion pour la livraison.", detailEn: "Pipedrive for pipeline, Folk for network, Calendly for scheduling, Notion for delivery." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Sépare opportunité et mission. Le CRM s'arrête à la signature ; la mission commence dans Notion.", detailEn: "Separate opportunity and engagement. CRM stops at signature; delivery starts in Notion." },
    { title: "À challenger", titleEn: "Challenge", detail: "Aircall et DocuSign sont des outils de volume ou de preuve. S'ils ne changent pas le taux de closing, ils attendent.", detailEn: "Aircall and DocuSign are volume or proof tools. If they do not change close rate, they can wait." },
  ],
};

const EXPERT_TIPS_BY_PERSONA: Record<StackPersona, StackInsight[]> = {
  dev: EXPERT_TIPS_BY_STACK["developpeur-freelance-shipper"],
  designer: EXPERT_TIPS_BY_STACK["designer-freelance-solo"],
  consultant: EXPERT_TIPS_BY_STACK["consultant-b2b-propre"],
  content: EXPERT_TIPS_BY_STACK["createur-contenu-operateur"],
  ops: EXPERT_TIPS_BY_STACK["ops-manager-fractional-coo"],
  solo: EXPERT_TIPS_BY_STACK["freelance-solo-zero-bloat"],
};

/* ─── Main component ─────────────────────────────────────────────────────── */
const StackDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const stack = STACKS.find((item) => item.slug === slug);
  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);

  // Must be before conditional return (hooks rules)
  const relatedStacks = useMemo(() => {
    if (!stack) return [];
    const samePersona = STACKS.filter((s) => s.slug !== stack.slug && s.persona === stack.persona);
    if (samePersona.length >= 3) return samePersona.slice(0, 3);
    const fill = STACKS.filter((s) => s.slug !== stack.slug && s.persona !== stack.persona);
    return [...samePersona, ...fill].slice(0, 3);
  }, [stack]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!stack) return;
    const title = lang === "fr"
      ? `${stack.title} : outils, usages et budget | ToolTrim`
      : `${stack.titleEn}: tools, use cases and budget | ToolTrim`;
    const description = lang === "fr"
      ? `${stack.subtitle} Budget cible : ${stack.monthlyBudget}€/mois.`
      : `${stack.subtitleEn} Target budget: €${stack.monthlyBudget}/month.`;
    setSeoTags({ title, description, url: `${SEO_BASE}/${lang}/stacks/${stack.slug}`, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/stacks/${stack.slug}`);
    setJsonLd("stack-detail-jsonld", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      url: `${SEO_BASE}/${lang}/stacks/${stack.slug}`,
      about: stack.tools.map((slot) => toolBySlug.get(slot.slug)?.name || slot.slug),
    });
    return () => cleanupSeo(["stack-detail-jsonld"]);
  }, [lang, stack, toolBySlug]);

  if (!stack) return <Navigate to={`${prefix}/stacks`} replace />;

  const stackTools = stack.tools.map((slot) => ({ slot, tool: toolBySlug.get(slot.slug) })).filter((item) => item.tool);

  const stackLayersBase = STACK_LAYERS.map((layer) => ({
    ...layer,
    tools: stackTools.filter(({ slot }) => {
      const role = `${slot.role} ${slot.roleEn}`.toLowerCase();
      return layer.match.some((keyword) => role.includes(keyword));
    }),
  })).filter((layer) => layer.tools.length > 0);

  const assignedSlugs = new Set(stackLayersBase.flatMap((layer) => layer.tools.map(({ slot }) => slot.slug)));
  const unassignedTools = stackTools.filter(({ slot }) => !assignedSlugs.has(slot.slug));
  const stackLayers = unassignedTools.length > 0
    ? [...stackLayersBase, { id: "other", titleFr: "Autres outils utiles", titleEn: "Other useful tools", match: [], tools: unassignedTools }]
    : stackLayersBase;

  const expertTips = getExpertTips(stack);
  const hasTraps = (stack.traps?.length ?? 0) > 0;
  const personaText = t(personaLabel(stack.persona, "fr"), personaLabel(stack.persona, "en"));
  const stageText = t(stageLabel(stack.stage, "fr"), stageLabel(stack.stage, "en"));
  const budgetDisplay = stack.monthlyBudget > 0 ? `≈ ${stack.monthlyBudget}€/mois` : t("Gratuit", "Free");

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid #DADAD4", background: "#F8F8F4" }}>
        <div className="sd-container" style={{ padding: "56px var(--layout-gutter, 48px) 52px" }}>
          {/* Back link */}
          <Link
            to={`${prefix}/stacks`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-ui)",
              fontSize: 13,
              fontWeight: 500,
              color: "#6F6F68",
              textDecoration: "none",
              marginBottom: 28,
              transition: "color 140ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#222222"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#6F6F68"; }}
          >
            <ArrowLeft size={14} />
            {t("Toutes les stacks", "All stacks")}
          </Link>

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
            <span style={{
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#6F6F68",
              padding: "4px 10px",
              border: "1px solid #DADAD4",
              borderRadius: 4,
            }}>
              {personaText}
            </span>
            <span style={{
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#6F6F68",
              padding: "4px 10px",
              border: "1px solid #DADAD4",
              borderRadius: 4,
            }}>
              {stageText}
            </span>
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(3.5rem, 7vw, 7rem)",
            fontWeight: 600,
            letterSpacing: "-0.06em",
            lineHeight: 0.94,
            color: "#222222",
            margin: "0 0 28px",
            maxWidth: 900,
          }}>
            {t(stack.title, stack.titleEn)}
          </h1>

          {/* Editorial description */}
          <p style={{
            fontFamily: "var(--font-ui)",
            fontSize: 18,
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.55,
            color: "#6F6F68",
            maxWidth: 680,
            margin: "0 0 36px",
          }}>
            {t(stack.editorial, stack.editorialEn)}
          </p>

          {/* CTA black button */}
          <Link
            to={`${prefix}/selector`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 48,
              padding: "0 22px",
              background: "#222222",
              color: "#FFFFFF",
              borderRadius: 8,
              fontFamily: "var(--font-ui)",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              textDecoration: "none",
              transition: "background 160ms ease-out",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#000000"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#222222"; }}
          >
            {t("Analyser ma stack", "Analyze my stack")}
          </Link>
        </div>
      </section>

      {/* ── Sticky nav ──────────────────────────────────────────────────────── */}
      <nav className="sd-nav">
        <div className="sd-nav-inner">
          <a className="sd-nav-link" href="#apercu">{t("Verdict", "Verdict")}</a>
          <a className="sd-nav-link" href="#outils">{t("Outils", "Tools")}</a>
          <a className="sd-nav-link" href="#avis">{t("Avis", "Reviews")}</a>
          {hasTraps && <a className="sd-nav-link" href="#pieges">{t("Pièges", "Traps")}</a>}
          {relatedStacks.length > 0 && <a className="sd-nav-link" href="#stacks-proches">{t("Stacks proches", "Related")}</a>}
        </div>
      </nav>

      {/* ── Summary metrics ─────────────────────────────────────────────────── */}
      <div className="sd-summary">
        <div className="sd-summary-inner">
          <div className="sd-metric">
            <p className="sd-metric-label">{t("Budget cible", "Target budget")}</p>
            <p className="sd-metric-value">{budgetDisplay}</p>
            <p className="sd-metric-hint">{t("estimation mensuelle", "monthly estimate")}</p>
          </div>
          <div className="sd-metric">
            <p className="sd-metric-label">{t("Outils", "Tools")}</p>
            <p className="sd-metric-value">{stack.tools.length}</p>
            <p className="sd-metric-hint">{t("dans cette stack", "in this stack")}</p>
          </div>
          <div className="sd-metric">
            <p className="sd-metric-label">{t("Niveau", "Level")}</p>
            <p className="sd-metric-value" style={{ fontSize: "clamp(1rem, 2vw, 1.375rem)" }}>{stageText}</p>
            <p className="sd-metric-hint">{personaText}</p>
          </div>
          <div className="sd-metric">
            <p className="sd-metric-label">{t("Risque principal", "Main risk")}</p>
            <p style={{
              fontFamily: "var(--font-ui)",
              fontSize: 13,
              lineHeight: 1.45,
              color: "#6F6F68",
              marginTop: 6,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {t(stack.risk, stack.riskEn)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Verdict ─────────────────────────────────────────────────────────── */}
      <section id="apercu" className="sd-section scroll-mt-20">
        <div className="sd-container">
          <span className="sd-section-eyebrow">{t("Verdict ToolTrim", "ToolTrim verdict")}</span>
          <p className="sd-section-title" style={{ marginBottom: 24 }}>
            {t("Pour qui, pourquoi, à éviter si", "Who it's for, why, when to skip")}
          </p>
          <div className="sd-decision-grid">
            <div className="sd-decision-col">
              <p className="sd-decision-label">{t("À copier si", "Copy it if")}</p>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 15, lineHeight: 1.55, color: "#222222" }}>
                {t(stack.bestFor, stack.bestForEn)}
              </p>
            </div>
            <div className="sd-decision-col">
              <p className="sd-decision-label">{t("Risque principal", "Main risk")}</p>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 15, lineHeight: 1.55, color: "#222222" }}>
                {t(stack.risk, stack.riskEn)}
              </p>
            </div>
            <div className="sd-decision-col">
              <p className="sd-decision-label">{t("À éviter si", "Skip it if")}</p>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 15, lineHeight: 1.55, color: "#222222" }}>
                {t(stack.avoidIf, stack.avoidIfEn)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Outils ──────────────────────────────────────────────────────────── */}
      <section id="outils" className="sd-section scroll-mt-20">
        <div className="sd-container">
          <span className="sd-section-eyebrow">{t("Cartographie", "Tool map")}</span>
          <p className="sd-section-title" style={{ marginBottom: 24 }}>
            {t("Les outils, couche par couche", "Tools, layer by layer")}
          </p>

          {/* Legend */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 20px",
            marginBottom: 24,
            padding: "14px 0",
            borderBottom: "1px solid #DADAD4",
          }}>
            {[
              { key: "core",        label: t("Socle — indispensable", "Core — essential"),         color: "#4CAF50" },
              { key: "conditional", label: t("Conditionnel — selon usage", "Conditional"),          color: "#6F6F68" },
              { key: "challenge",   label: t("À challenger — justifier l'abonnement", "Challenge"), color: "#E53935" },
            ].map((item) => (
              <span key={item.key} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-ui)", fontSize: 12, color: "#6F6F68" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                {item.label}
              </span>
            ))}
          </div>

          {/* Layers */}
          {stackLayers.map((layer) => (
            <div key={layer.id} style={{ marginBottom: 32 }}>
              {/* Layer title */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 0 }}>
                <p style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#222222",
                  whiteSpace: "nowrap",
                }}>
                  {t(layer.titleFr, layer.titleEn)}
                </p>
                <div style={{ flex: 1, height: 1, background: "#DADAD4" }} />
                <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "#9A9A92" }}>
                  {layer.tools.length}
                </span>
              </div>

              {/* Tool rows */}
              <div>
                {layer.tools.map(({ slot, tool }) => {
                  const status = getToolDecisionStatus(slot);
                  const globalIndex = stackTools.findIndex((st) => st.slot.slug === slot.slug);
                  return (
                    <button
                      key={slot.slug}
                      type="button"
                      onClick={() => setSelectedIndex(globalIndex)}
                      className="sd-tool-row"
                    >
                      {/* Logo */}
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        background: "#F8F8F4",
                        border: "1px solid #E7E7E0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}>
                        <ToolLogo tool={tool!} size={28} />
                      </div>

                      {/* Name + role */}
                      <div style={{ minWidth: 0 }}>
                        <p style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: 14,
                          fontWeight: 600,
                          letterSpacing: "-0.02em",
                          color: "#222222",
                          lineHeight: 1.2,
                        }}>
                          {tool!.name}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: 12,
                          color: "#9A9A92",
                          marginTop: 2,
                          letterSpacing: "-0.01em",
                        }}>
                          {t(slot.role, slot.roleEn)}
                        </p>
                      </div>

                      {/* Reason (hidden on mobile via CSS) */}
                      <p style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: 13,
                        color: "#6F6F68",
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        letterSpacing: "-0.01em",
                      }}>
                        {t(slot.reason, slot.reasonEn)}
                      </p>

                      {/* Status badge (hidden on mobile via CSS) */}
                      <span style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: 3,
                        border: `1px solid`,
                        whiteSpace: "nowrap",
                        ...(status.key === "core"
                          ? { borderColor: "rgba(76,175,80,0.3)", background: "rgba(76,175,80,0.06)", color: "#2E7D32" }
                          : status.key === "conditional"
                          ? { borderColor: "#DADAD4", background: "#F8F8F4", color: "#6F6F68" }
                          : { borderColor: "rgba(229,57,53,0.25)", background: "rgba(229,57,53,0.05)", color: "#C62828" }),
                      }}>
                        {status.key === "core"
                          ? t("Socle", "Core")
                          : status.key === "conditional"
                          ? t("Conditionnel", "Conditional")
                          : t("À challenger", "Challenge")}
                      </span>

                      {/* Arrow */}
                      <span style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: 14,
                        color: "#9A9A92",
                        transition: "color 140ms",
                      }}>
                        →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Avis ────────────────────────────────────────────────────────────── */}
      <section id="avis" className="sd-section scroll-mt-20">
        <div className="sd-container">
          <span className="sd-section-eyebrow">{t("Avis & retours", "Reviews")}</span>
          <p className="sd-section-title" style={{ marginBottom: 24 }}>
            {t("Note ToolTrim", "ToolTrim editorial")}
          </p>

          {/* Editorial note */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #DADAD4",
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 16,
          }}>
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 24px",
              borderBottom: "1px solid #E7E7E0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: "#F8F8F4",
                  border: "1px solid #DADAD4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-ui)",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#222222",
                  letterSpacing: "0.04em",
                }}>
                  TT
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "#222222" }}>
                    {t("Note ToolTrim", "ToolTrim Editorial")}
                  </p>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "#9A9A92", marginTop: 1 }}>
                    {t("Analyse indépendante · Prix vérifiés", "Independent analysis · Verified pricing")}
                  </p>
                </div>
              </div>
              <span style={{
                fontFamily: "var(--font-ui)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "#9A9A92",
                border: "1px solid #DADAD4",
                borderRadius: 4,
                padding: "3px 8px",
              }}>
                {t("Vérifié avr. 2026", "Verified Apr. 2026")}
              </span>
            </div>

            {/* Tips content */}
            <div style={{ padding: "20px 24px" }}>
              {/* First tip — main */}
              <div style={{
                borderLeft: "2px solid #222222",
                paddingLeft: 16,
                marginBottom: 20,
              }}>
                <p style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#222222",
                  marginBottom: 8,
                }}>
                  {t(expertTips[0].title, expertTips[0].titleEn)}
                </p>
                <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, lineHeight: 1.6, color: "#222222" }}>
                  {t(expertTips[0].detail, expertTips[0].detailEn)}
                </p>
              </div>

              {/* Secondary tips */}
              {expertTips.slice(1).map((tip) => (
                <div
                  key={tip.title}
                  style={{
                    borderTop: "1px solid #E7E7E0",
                    paddingTop: 16,
                    marginTop: 16,
                  }}
                >
                  <p style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#222222",
                    marginBottom: 6,
                    letterSpacing: "-0.01em",
                  }}>
                    {t(tip.title, tip.titleEn)}
                  </p>
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, lineHeight: 1.55, color: "#6F6F68" }}>
                    {t(tip.detail, tip.detailEn)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Coming soon teaser */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #DADAD4",
            borderRadius: 8,
            padding: "28px 24px",
            textAlign: "center",
          }}>
            <p style={{
              fontFamily: "var(--font-ui)",
              fontSize: 14,
              fontWeight: 600,
              color: "#222222",
              marginBottom: 8,
              letterSpacing: "-0.01em",
            }}>
              {t("Tu utilises cette stack ?", "Using this stack?")}
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 13, lineHeight: 1.55, color: "#6F6F68", marginBottom: 16 }}>
              {t(
                "Les avis utilisateurs arrivent bientôt. Partage ce qui marche, ce qui coûte trop cher.",
                "User reviews are coming soon. Share what works and what costs too much.",
              )}
            </p>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#6F6F68",
              border: "1px solid #DADAD4",
              borderRadius: 4,
              padding: "6px 12px",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#DADAD4" }} />
              {t("Bientôt disponible", "Coming soon")}
            </span>
          </div>
        </div>
      </section>

      {/* ── Pièges fréquents ────────────────────────────────────────────────── */}
      {hasTraps && (
        <section id="pieges" className="sd-section scroll-mt-20">
          <div className="sd-container">
            <span className="sd-section-eyebrow">{t("Pièges fréquents", "Common traps")}</span>
            <p className="sd-section-title" style={{ marginBottom: 24 }}>
              {t("Ce qu'on fait trop souvent avec cette stack", "What people tend to get wrong")}
            </p>
            <div>
              {stack.traps!.map((trap) => (
                <div key={trap.title} className="sd-risk-row">
                  <p className="sd-risk-problem">{t(trap.title, trap.titleEn)}</p>
                  <p className="sd-risk-detail">{t(trap.detail, trap.detailEn)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA band ────────────────────────────────────────────────────────── */}
      <div className="sd-cta-band">
        <div className="sd-cta-inner">
          <span style={{
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#6F6F68",
            display: "block",
            marginBottom: 12,
          }}>
            {t("Diagnostic", "Diagnostic")}
          </span>
          <p style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(1.75rem, 4vw, 3.5rem)",
            fontWeight: 600,
            letterSpacing: "-0.055em",
            lineHeight: 0.98,
            color: "#222222",
            maxWidth: 720,
            marginBottom: 16,
          }}>
            {t(
              "Ce guide part d'un profil type. Toi, tu as déjà une stack.",
              "This guide starts from a typical profile. You already have a stack.",
            )}
          </p>
          <p style={{
            fontFamily: "var(--font-ui)",
            fontSize: 17,
            lineHeight: 1.5,
            color: "#6F6F68",
            maxWidth: 540,
            marginBottom: 32,
            letterSpacing: "-0.015em",
          }}>
            {t(
              "Le diagnostic personnalisé regarde ce que tu paies vraiment — outils actifs vs dormants, doublons, plans surévalués. Résultat en moins de 3 minutes.",
              "The personalized diagnostic looks at what you actually pay — active vs dormant tools, duplicates, overpriced plans. Result in under 3 minutes.",
            )}
          </p>
          <Link
            to={`${prefix}/selector`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 48,
              padding: "0 22px",
              background: "#222222",
              color: "#FFFFFF",
              borderRadius: 8,
              fontFamily: "var(--font-ui)",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              textDecoration: "none",
              transition: "background 160ms ease-out",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#000000"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#222222"; }}
          >
            {t("Analyser ma stack", "Analyze my stack")}
          </Link>
        </div>
      </div>

      {/* ── Related stacks ──────────────────────────────────────────────────── */}
      {relatedStacks.length > 0 && (
        <section id="stacks-proches" className="sd-section scroll-mt-20" style={{ borderBottom: "none" }}>
          <div className="sd-container">
            <span className="sd-section-eyebrow">{t("Stacks proches", "Related stacks")}</span>
            <p className="sd-section-title" style={{ marginBottom: 24 }}>
              {t("Tu pourrais aussi regarder", "You might also like")}
            </p>
            <div className="sd-related-grid">
              {relatedStacks.map((related) => (
                <Link key={related.slug} to={`${prefix}/stacks/${related.slug}`} className="sd-related-card">
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <span style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#9A9A92",
                      padding: "2px 6px",
                      border: "1px solid #DADAD4",
                      borderRadius: 3,
                    }}>
                      {t(personaLabel(related.persona, "fr"), personaLabel(related.persona, "en"))}
                    </span>
                  </div>
                  <p className="sd-related-name">{t(related.title, related.titleEn)}</p>
                  <p className="sd-related-sub">{t(related.subtitle, related.subtitleEn)}</p>
                  <div className="sd-related-footer">
                    <span className="sd-related-budget">≈ {related.monthlyBudget}€/mois</span>
                    <span className="sd-related-cta">{t("Voir", "See")} →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Tool quick panel ────────────────────────────────────────────────── */}
      <Sheet open={selectedIndex !== null} onOpenChange={(open) => { if (!open) setSelectedIndex(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] p-0 flex flex-col gap-0 overflow-hidden">
          {selectedIndex !== null && (
            <ToolPanel
              stackTools={stackTools}
              selectedIndex={selectedIndex}
              onNavigate={setSelectedIndex}
              prefix={prefix}
              t={t}
            />
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
};

/* ─── Tool Panel ─────────────────────────────────────────────────────────── */
interface ToolPanelProps {
  stackTools: Array<{ slot: StackToolSlot; tool: ToolSummary | undefined }>;
  selectedIndex: number;
  onNavigate: (index: number) => void;
  prefix: string;
  t: (fr: string, en: string) => string;
}

function ToolPanel({ stackTools, selectedIndex, onNavigate, prefix, t }: ToolPanelProps) {
  const { slot, tool } = stackTools[selectedIndex];
  const status = getToolDecisionStatus(slot);
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < stackTools.length - 1;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(selectedIndex - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate(selectedIndex + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, hasPrev, hasNext, onNavigate]);

  const callout = {
    core: {
      fr: "Outil central de cette stack. Inutile de chercher une alternative — c'est lui qui tient tout.",
      en: "Core tool in this stack. No need to look for an alternative — it holds everything together.",
      textClass: "text-keep",
      borderClass: "border-keep/25 bg-keep/[0.05]",
      dotClass: "bg-keep",
    },
    conditional: {
      fr: "Utile selon les contextes. Vérifie que tu l'utilises vraiment chaque mois avant de renouveler.",
      en: "Useful in some contexts. Check you actually use it every month before renewing.",
      textClass: "text-primary",
      borderClass: "border-primary/25 bg-primary/[0.04]",
      dotClass: "bg-primary",
    },
    challenge: {
      fr: "Candidat au downgrade. Cet outil doit prouver sa valeur par un résultat concret et mesurable.",
      en: "Downgrade candidate. This tool needs to prove its value through concrete, measurable results.",
      textClass: "text-destructive",
      borderClass: "border-destructive/25 bg-destructive/[0.04]",
      dotClass: "bg-destructive",
    },
  }[status.key];

  const headerTint = {
    core: "from-keep/[0.06]",
    conditional: "from-primary/[0.06]",
    challenge: "from-destructive/[0.06]",
  }[status.key];

  return (
    <>
      <div className={`relative border-b border-border px-6 pb-5 pt-5 bg-gradient-to-b ${headerTint} to-transparent`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <ToolLogo tool={tool!} size={64} className="rounded-2xl shrink-0 shadow-sm ring-1 ring-border" />
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground leading-tight truncate">{tool!.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{t(slot.role, slot.roleEn ?? slot.role)}</p>
              <span className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${status.className}`}>
                {t(status.labelFr, status.labelEn)}
              </span>
            </div>
          </div>
          <SheetClose className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
            <X className="h-4 w-4" />
          </SheetClose>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${callout.borderClass}`}>
          <div className={`mt-[5px] shrink-0 h-2 w-2 rounded-full ${callout.dotClass}`} />
          <p className={`text-sm font-medium leading-6 ${callout.textClass}`}>
            {t(callout.fr, callout.en)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t("Dans cette stack", "In this stack")}
          </p>
          <p className="text-sm leading-6 text-foreground/80">{t(slot.reason, slot.reasonEn ?? slot.reason)}</p>
          {slot.tip && (
            <div className="flex items-start gap-2.5 pt-3 border-t border-border/60">
              <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
              <p className="text-xs font-medium text-primary leading-5">
                {t(slot.tip, slot.tipEn ?? slot.tip)}
              </p>
            </div>
          )}
        </div>

        {(tool?.shortDescription || tool?.shortDescriptionEn) && (
          <div className="px-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              {t("En résumé", "About")}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t(tool.shortDescription ?? "", tool.shortDescriptionEn ?? "")}
            </p>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            {t("Tarifs", "Pricing")}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {tool?.pricing?.free ? (
              <div className="rounded-xl border border-keep/25 bg-keep/[0.05] p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-keep mb-2">{t("Gratuit", "Free")}</p>
                <p className="text-xs leading-5 text-muted-foreground">{tool.pricing.free}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex items-center justify-center">
                <p className="text-xs text-muted-foreground/50 text-center">{t("Pas de plan gratuit", "No free plan")}</p>
              </div>
            )}
            <div className="rounded-xl border border-border bg-secondary/30 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">{t("Payant", "Paid")}</p>
              {tool?.pricing?.paid ? (
                <p className="text-xs leading-5 text-muted-foreground">{tool.pricing.paid}</p>
              ) : (
                <p className="text-sm font-bold text-foreground">
                  {(tool?.defaultMonthlyPrice ?? 0) === 0
                    ? t("Gratuit", "Free")
                    : `${tool?.defaultMonthlyPrice}€/${t("mois", "mo")}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {tool?.websiteUrl && (
          <a
            href={tool.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-all hover:border-primary/40 hover:bg-primary/[0.02] group"
          >
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate pr-3">
              {tool.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        )}
      </div>

      <div className="border-t border-border px-5 py-4 flex items-center justify-between gap-3 bg-background/50">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => onNavigate(selectedIndex - 1)}
            title={t("Outil précédent (←)", "Previous tool (←)")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[3.25rem] text-center text-xs tabular-nums text-muted-foreground">
            {selectedIndex + 1} / {stackTools.length}
          </span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => onNavigate(selectedIndex + 1)}
            title={t("Outil suivant (→)", "Next tool (→)")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Link
          to={`${prefix}/tool/${tool!.slug}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 32,
            padding: "0 14px",
            background: "#222222",
            color: "#FFFFFF",
            borderRadius: 6,
            fontFamily: "var(--font-ui)",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            textDecoration: "none",
          }}
        >
          {t("Fiche complète", "Full details")}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function personaLabel(persona: StackPersona, locale: "fr" | "en") {
  const item = STACK_PERSONAS.find((option) => option.value === persona);
  return locale === "fr" ? item?.label || persona : item?.labelEn || persona;
}

function stageLabel(stage: StackStage, locale: "fr" | "en") {
  const item = STACK_STAGES.find((option) => option.value === stage);
  return locale === "fr" ? item?.label || stage : item?.labelEn || stage;
}

function getExpertTips(stack: StackGuide) {
  return EXPERT_TIPS_BY_STACK[stack.slug] || EXPERT_TIPS_BY_PERSONA[stack.persona];
}

function getToolDecisionStatus(slot: { role: string; decision?: "core" | "conditional" | "challenge" }) {
  if (slot.decision === "challenge") {
    return { key: "challenge" as const, labelFr: "À challenger", labelEn: "Challenge", className: "border-destructive/25 bg-destructive/8 text-destructive" };
  }
  if (slot.decision === "conditional") {
    return { key: "conditional" as const, labelFr: "Conditionnel", labelEn: "Conditional", className: "border-primary/25 bg-primary/8 text-primary" };
  }
  if (slot.decision === "core") {
    return { key: "core" as const, labelFr: "Socle", labelEn: "Core", className: "border-keep/25 bg-keep/10 text-keep" };
  }
  const normalizedRole = slot.role.toLowerCase();
  const challengeKeywords = ["avancé", "advanced", "suite", "backlinks", "connecteurs", "connectors", "handoff", "vectoriel", "photo", "crm agence"];
  const optionalKeywords = ["plugin", "feedback", "prospection", "social", "seo", "ux", "workshop", "atelier", "prototype", "ia"];
  if (challengeKeywords.some((kw) => normalizedRole.includes(kw))) {
    return { key: "challenge" as const, labelFr: "À challenger", labelEn: "Challenge", className: "border-destructive/25 bg-destructive/8 text-destructive" };
  }
  if (optionalKeywords.some((kw) => normalizedRole.includes(kw))) {
    return { key: "conditional" as const, labelFr: "Conditionnel", labelEn: "Conditional", className: "border-primary/25 bg-primary/8 text-primary" };
  }
  return { key: "core" as const, labelFr: "Socle", labelEn: "Core", className: "border-keep/25 bg-keep/10 text-keep" };
}

export default StackDetailPage;
