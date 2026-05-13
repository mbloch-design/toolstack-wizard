import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Lightbulb, X } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import { STACK_PERSONAS, STACK_STAGES, STACKS, type StackGuide, type StackInsight, type StackPersona, type StackStage, type StackToolSlot } from "@/data/stacks";

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
    { title: "À challenger", titleEn: "Challenge", detail: "Twinmotion et Skatter se justifient quand l’expérience ou l’ambiance vend vraiment le projet.", detailEn: "Twinmotion et Skatter se justifient quand l’expérience ou l’ambiance vend vraiment le projet." },
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
    { title: "À challenger", titleEn: "Challenge", detail: "L’IA aide à explorer des territoires, mais la stratégie doit rester décidée et argumentée.", detailEn: "L’IA aide à explorer des territoires, mais la stratégie doit rester décidée et argumentée." },
  ],
  "directeur-artistique": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Are.na, ShotDeck, Eagle et Milanote doivent nourrir une décision, pas devenir une collection infinie.", detailEn: "Are.na, ShotDeck, Eagle et Milanote doivent nourrir une décision, pas devenir une collection infinie." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Frame.io est très utile dès que les retours portent sur vidéo, photo ou séquences.", detailEn: "Frame.io est très utile dès que les retours portent sur vidéo, photo ou séquences." },
    { title: "À challenger", titleEn: "Challenge", detail: "Runway, Krea ou Midjourney doivent servir une intention déjà formulée.", detailEn: "Runway, Krea ou Midjourney doivent servir une intention déjà formulée." },
  ],
  "developpeur-webflow-nocode-creatif": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Relume + Figma avant Webflow évitent beaucoup de pages mal cadrées.", detailEn: "Relume + Figma avant Webflow évitent beaucoup de pages mal cadrées." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Chaque script, app Webflow ou automation doit avoir une note de rôle et de maintenance.", detailEn: "Chaque script, app Webflow ou automation doit avoir une note de rôle et de maintenance." },
    { title: "À challenger", titleEn: "Challenge", detail: "Plausible et Search Console suffisent souvent avant d’ajouter une couche analytics lourde.", detailEn: "Plausible et Search Console suffisent souvent avant d’ajouter une couche analytics lourde." },
  ],
  "monteur-video": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Choisis un outil principal : DaVinci pour le tout-en-un, Premiere si le client vit dans Adobe.", detailEn: "Choisis un outil principal : DaVinci pour le tout-en-un, Premiere si le client vit dans Adobe." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Frame.io transforme les retours flous en actions timecodées.", detailEn: "Frame.io transforme les retours flous en actions timecodées." },
    { title: "À challenger", titleEn: "Challenge", detail: "Topaz Video et Runway restent des outils de finition ou de sauvetage, pas le cœur du montage.", detailEn: "Topaz Video et Runway restent des outils de finition ou de sauvetage, pas le cœur du montage." },
  ],
  "realisateur-videaste": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "La valeur est autant en préproduction qu’en montage : brief, moodboard, shotlist et planning doivent être visibles.", detailEn: "La valeur est autant en préproduction qu’en montage : brief, moodboard, shotlist et planning doivent être visibles." },
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
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Shopify, GA4, Klaviyo, Gorgias et Hotjar sur pages à friction. Chaque app doit prouver conversion, réachat, panier moyen ou temps support gagné.", detailEn: "Shopify, GA4, Klaviyo, Gorgias, and Hotjar on friction pages. Each app must prove conversion, repeat purchase, AOV, or support time saved." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Commence par trois flows Klaviyo : abandon panier, post-achat, winback. Le reste vient après un revenu email mesurable.", detailEn: "Start with three Klaviyo flows: cart abandonment, post-purchase, winback. Everything else comes after measurable email revenue." },
    { title: "À challenger", titleEn: "Challenge", detail: "Les apps Shopify ralentissent la boutique. Coupe toute app sans métrique de marge associée.", detailEn: "Shopify apps slow the store. Cut any app without an attached margin metric." },
  ],
  "designer-ui-ux-systeme-produit": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Figma, Tokens Studio, Iconify, Stark. Ajoute Content Reel seulement si tu dois remplir beaucoup d'écrans réalistes.", detailEn: "Figma, Tokens Studio, Iconify, Stark. Add Content Reel only if you need to populate many realistic screens." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Avant le handoff, vérifie tokens, contrastes, états vides, erreurs, loading et responsive. C'est là que le designer gagne la confiance dev.", detailEn: "Before handoff, check tokens, contrast, empty states, errors, loading, and responsive. This is where designers win developer trust." },
    { title: "Plugin / réglage", titleEn: "Plugin / setting", detail: "Tokens Studio devient utile quand les tokens sortent de Figma vers GitHub ou plusieurs thèmes. Sinon les styles natifs suffisent.", detailEn: "Tokens Studio becomes useful when tokens leave Figma for GitHub or multiple themes. Otherwise native styles are enough." },
  ],
  "motion-video-studio-solo": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Screen Studio pour les démos produit, CapCut pour les formats sociaux, DaVinci Resolve pour le montage propre. After Effects vient seulement si le motion complexe ou le Lottie est un livrable régulier.", detailEn: "Screen Studio for product demos, CapCut for social formats, DaVinci Resolve for clean editing. After Effects only comes in when complex motion or Lottie is a recurring deliverable." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Décide le format de sortie avant l'outil : vidéo sociale, démo produit, Lottie web ou animation interactive. Le mauvais format crée vite le mauvais abonnement.", detailEn: "Choose the output format before the tool: social video, product demo, web Lottie, or interactive animation. The wrong format quickly creates the wrong subscription." },
    { title: "Plugins / crédits", titleEn: "Plugins / credits", detail: "Bodymovin est utile si After Effects exporte vers le web. Rive est meilleur pour les animations avec états. Runway doit rester en crédits ou mois ponctuel tant qu'il ne produit pas un format récurrent.", detailEn: "Bodymovin is useful when After Effects exports to web. Rive is better for state-based animations. Runway should stay on credits or occasional months until it powers a recurring format." },
  ],
  "consultant-revops-pipeline": [
    { title: "Mon setup recommandé", titleEn: "Recommended setup", detail: "Pipedrive pour le pipe, Folk pour le réseau, Calendly pour la prise de rendez-vous, Notion pour la livraison. HubSpot seulement si marketing et CRM doivent fusionner.", detailEn: "Pipedrive for pipeline, Folk for network, Calendly for scheduling, Notion for delivery. HubSpot only if marketing and CRM must merge." },
    { title: "Le petit plus", titleEn: "Small edge", detail: "Sépare opportunité et mission. Le CRM s'arrête à la signature ; la mission commence dans Notion avec objectifs, décisions et livrables.", detailEn: "Separate opportunity and engagement. CRM stops at signature; delivery starts in Notion with goals, decisions, and deliverables." },
    { title: "À challenger", titleEn: "Challenge", detail: "Aircall et DocuSign sont des outils de volume ou de preuve. S'ils ne changent pas le taux de closing ou le risque, ils attendent.", detailEn: "Aircall and DocuSign are volume or proof tools. If they do not change close rate or risk, they can wait." },
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

const StackDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const stack = STACKS.find((item) => item.slug === slug);
  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);

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
  const relatedStacks = useMemo(() => {
    const samePersona = STACKS.filter((s) => s.slug !== stack.slug && s.persona === stack.persona);
    if (samePersona.length >= 3) return samePersona.slice(0, 3);
    const fill = STACKS.filter((s) => s.slug !== stack.slug && s.persona !== stack.persona);
    return [...samePersona, ...fill].slice(0, 3);
  }, [stack]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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
    ? [
      ...stackLayersBase,
      {
        id: "other",
        titleFr: "Autres outils utiles",
        titleEn: "Other useful tools",
        match: [],
        tools: unassignedTools,
      },
    ]
    : stackLayersBase;
  const expertTips = getExpertTips(stack);

  return (
    <div className="min-h-screen bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">

          <Link
            to={`${prefix}/stacks`}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("Toutes les stacks", "All stacks")}
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              {t(personaLabel(stack.persona, "fr"), personaLabel(stack.persona, "en"))}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              {t(stageLabel(stack.stage, "fr"), stageLabel(stack.stage, "en"))}
            </span>
            <span className="rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
              {stack.monthlyBudget}€/mois
            </span>
          </div>

          <h1
            className="font-display text-foreground"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.15 }}
          >
            {t(stack.title, stack.titleEn)}
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            {t(stack.editorial, stack.editorialEn)}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-lg">
              <Link to={`${prefix}/selector`}>
                {t("Analyser ma stack", "Analyze my stack")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-6 py-3 text-sm font-semibold text-muted-foreground">
          <a className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary hover:text-primary" href="#overview">
            {t("Verdict", "Verdict")}
          </a>
          <a className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary hover:text-primary" href="#stack">
            {t("Cartographie", "Map")}
          </a>
          <a className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary hover:text-primary" href="#avis">
            {t("Avis", "Reviews")}
          </a>
          <a className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary hover:text-primary" href="#stacks-proches">
            {t("Stacks proches", "Related")}
          </a>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6">

        {/* ── VERDICT ─────────────────────────────────────────────────── */}
        <section id="overview" className="scroll-mt-24 border-b border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-6">
            {t("Verdict ToolTrim", "ToolTrim verdict")}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-secondary/70 p-5">
              <DecisionNote title={t("À copier si", "Copy it if")} text={t(stack.bestFor, stack.bestForEn)} />
            </div>
            <div className="rounded-lg bg-secondary/70 p-5">
              <DecisionNote title={t("Le principal risque", "Main risk")} text={t(stack.risk, stack.riskEn)} />
            </div>
            <div className="rounded-lg bg-secondary/70 p-5">
              <DecisionNote title={t("À éviter si", "Skip it if")} text={t(stack.avoidIf, stack.avoidIfEn)} />
            </div>
          </div>
        </section>

        {/* ── OUTILS ─────────────────────────────────────────────────────── */}
        <section id="stack" className="scroll-mt-24 border-b border-border py-12">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              {t("Cartographie", "Map")}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-keep/60" />
                {t("Socle — indispensable", "Core — essential")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary/60" />
                {t("Conditionnel — selon usage", "Conditional — depends on use")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-destructive/60" />
                {t("À challenger — justifier l'abonnement", "Challenge — justify the cost")}
              </span>
            </div>
          </div>

          {/* ── Tool cards grouped by layer ── */}
          <div className="space-y-10">
            {stackLayers.map((layer) => (
              <div key={layer.id}>

                {/* Layer header */}
                <div className="flex items-center gap-3 mb-4">
                  <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground">
                    {t(layer.titleFr, layer.titleEn)}
                  </p>
                  <div className="flex-1 h-px bg-border" />
                  <span className="shrink-0 text-[10px] font-mono text-muted-foreground">
                    {layer.tools.length}
                  </span>
                </div>

                {/* Tool cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {layer.tools.map(({ slot, tool }) => {
                    const status = getToolDecisionStatus(slot);
                    const globalIndex = stackTools.findIndex((st) => st.slot.slug === slot.slug);
                    return (
                      <button
                        key={slot.slug}
                        type="button"
                        onClick={() => setSelectedIndex(globalIndex)}
                        className="group flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 text-left transition-all duration-150 hover:border-primary/40 hover:bg-primary/[0.02] cursor-pointer"
                      >
                        {/* Logo */}
                        <ToolLogo tool={tool!} size={44} className="shrink-0 rounded-lg mt-0.5" />

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                              {tool!.name}
                            </p>
                            <span className={`shrink-0 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold leading-none pt-[3px] ${status.className}`}>
                              {t(status.labelFr, status.labelEn)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                            {t(slot.role, slot.roleEn)}
                          </p>
                          <p className="mt-1.5 text-[11px] leading-[1.55] text-muted-foreground line-clamp-2">
                            {t(slot.reason, slot.reasonEn)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="avis" className="scroll-mt-24 border-b border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-6">
            {t("Avis & retours", "Reviews")}
          </p>

          {/* ── Note éditoriale ToolTrim ── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
            {/* Header encart */}
            <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-xs font-black text-primary">TT</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("Note ToolTrim", "ToolTrim Editorial")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("Analyse indépendante · Prix vérifiés", "Independent analysis · Verified pricing")}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                {t("Vérifié avr. 2026", "Verified Apr. 2026")}
              </span>
            </div>

            {/* Corps éditorial */}
            <div className="px-6 py-5 space-y-5">
              {/* Premier tip = note principale */}
              <div className="border-l-2 border-primary pl-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                  {t(expertTips[0].title, expertTips[0].titleEn)}
                </p>
                <p className="text-sm leading-7 text-foreground/80">
                  {t(expertTips[0].detail, expertTips[0].detailEn)}
                </p>
              </div>

              {/* Tips suivants = insights secondaires */}
              {expertTips.slice(1).map((tip) => (
                <div key={tip.title} className="flex gap-3">
                  <div className="mt-[7px] shrink-0 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">
                      {t(tip.title, tip.titleEn)}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t(tip.detail, tip.detailEn)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Teaser avis communauté ── */}
          <div className="rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-secondary border border-border">
              <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1.5">
              {t("Tu utilises cette stack ?", "Using this stack?")}
            </p>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
              {t(
                "Les avis utilisateurs arrivent bientôt. Partage ton retour d'expérience réel — ce qui marche, ce qui coûte trop cher, ce que tu changerais.",
                "User reviews are coming soon. Share your real-world experience — what works, what costs too much, what you'd change."
              )}
            </p>
            <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-muted-foreground cursor-default select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {t("Bientôt disponible", "Coming soon")}
            </span>
          </div>
        </section>


        {/* ── STACKS PROCHES ──────────────────────────────────────────────── */}
        {relatedStacks.length > 0 && (
          <section id="stacks-proches" className="scroll-mt-24 border-b border-border py-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-6">
              {t("Stacks proches", "Related stacks")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedStacks.map((related) => (
                <Link
                  key={related.slug}
                  to={`${prefix}/stacks/${related.slug}`}
                  className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 cursor-pointer"
                >
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {t(personaLabel(related.persona, "fr"), personaLabel(related.persona, "en"))}
                      </span>
                      <span className="rounded-full border border-primary/30 bg-primary/8 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                        {related.monthlyBudget}€/mois
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {t(related.title, related.titleEn)}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {t(related.subtitle, related.subtitleEn)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-5 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    {t("Voir la stack", "View stack")}
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            {t("Diagnostic", "Diagnostic")}
          </p>
          <h2
            className="font-display text-foreground mb-4"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            {t("Ce guide part d'un profil type. Toi, tu as déjà une stack.", "This guide starts from a typical profile. You already have a stack.")}
          </h2>
          <p className="text-sm leading-7 text-muted-foreground mb-8 max-w-xl">
            {t(
              "Le diagnostic personnalisé regarde ce que tu paies vraiment — outils actifs vs dormants, doublons, plans surévalués. Résultat en moins de 3 minutes.",
              "The personalized diagnostic looks at what you actually pay — active vs dormant tools, duplicates, overpriced plans. Result in under 3 minutes."
            )}
          </p>
          <Button asChild size="lg" className="rounded-lg">
            <Link to={`${prefix}/selector`}>
              {t("Analyser ma stack", "Analyze my stack")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

      </div>

      {/* ── TOOL QUICK PANEL ────────────────────────────────────────────── */}
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

// ── TOOL PANEL ──────────────────────────────────────────────────────────────

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

  // Keyboard navigation
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
      {/* ── Header ── */}
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

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

        {/* Decision callout */}
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${callout.borderClass}`}>
          <div className={`mt-[5px] shrink-0 h-2 w-2 rounded-full ${callout.dotClass}`} />
          <p className={`text-sm font-medium leading-6 ${callout.textClass}`}>
            {t(callout.fr, callout.en)}
          </p>
        </div>

        {/* Dans cette stack */}
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

        {/* Description courte */}
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

        {/* Pricing — deux cases côte à côte */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            {t("Tarifs", "Pricing")}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Gratuit */}
            {tool?.pricing?.free ? (
              <div className="rounded-xl border border-keep/25 bg-keep/[0.05] p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-keep mb-2">
                  {t("Gratuit", "Free")}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">{tool.pricing.free}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex items-center justify-center">
                <p className="text-xs text-muted-foreground/50 text-center">
                  {t("Pas de plan gratuit", "No free plan")}
                </p>
              </div>
            )}
            {/* Payant */}
            <div className="rounded-xl border border-border bg-secondary/30 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                {t("Payant", "Paid")}
              </p>
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

        {/* Lien site officiel */}
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

      {/* ── Footer ── */}
      <div className="border-t border-border px-5 py-4 flex items-center justify-between gap-3 bg-background/50">
        {/* Prev / Next */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => onNavigate(selectedIndex - 1)}
            title={t("Outil précédent (←)", "Previous tool (←)")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
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
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Fiche complète */}
        <Link
          to={`${prefix}/tool/${tool!.slug}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("Fiche complète", "Full details")}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </>
  );
}

function personaLabel(persona: StackPersona, locale: "fr" | "en") {
  const item = STACK_PERSONAS.find((option) => option.value === persona);
  return locale === "fr" ? item?.label || persona : item?.labelEn || persona;
}

function stageLabel(stage: StackStage, locale: "fr" | "en") {
  const item = STACK_STAGES.find((option) => option.value === stage);
  return locale === "fr" ? item?.label || stage : item?.labelEn || stage;
}

function StackMetric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs font-medium text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DecisionNote({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function getExpertTips(stack: StackGuide) {
  return EXPERT_TIPS_BY_STACK[stack.slug] || EXPERT_TIPS_BY_PERSONA[stack.persona];
}

function ToolStatusBadge({
  status,
  t,
}: {
  status: ReturnType<typeof getToolDecisionStatus>;
  t: (fr: string, en?: string) => string;
}) {
  return (
    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
      {t(status.labelFr, status.labelEn)}
    </span>
  );
}

function getToolDecisionStatus(slot: { role: string; decision?: "core" | "conditional" | "challenge" }) {
  if (slot.decision === "challenge") {
    return {
      key: "challenge" as const,
      labelFr: "À challenger",
      labelEn: "Challenge",
      className: "border-destructive/25 bg-destructive/8 text-destructive",
    };
  }

  if (slot.decision === "conditional") {
    return {
      key: "conditional" as const,
      labelFr: "Conditionnel",
      labelEn: "Conditional",
      className: "border-primary/25 bg-primary/8 text-primary",
    };
  }

  if (slot.decision === "core") {
    return {
      key: "core" as const,
      labelFr: "Socle",
      labelEn: "Core",
      className: "border-keep/25 bg-keep/10 text-keep",
    };
  }

  const normalizedRole = slot.role.toLowerCase();
  const challengeKeywords = [
    "avancé",
    "advanced",
    "suite",
    "backlinks",
    "connecteurs",
    "connectors",
    "handoff",
    "vectoriel",
    "photo",
    "crm agence",
  ];
  const optionalKeywords = [
    "plugin",
    "feedback",
    "prospection",
    "social",
    "seo",
    "ux",
    "workshop",
    "atelier",
    "prototype",
    "ia",
  ];

  if (challengeKeywords.some((keyword) => normalizedRole.includes(keyword))) {
    return {
      key: "challenge" as const,
      labelFr: "À challenger",
      labelEn: "Challenge",
      className: "border-destructive/25 bg-destructive/8 text-destructive",
    };
  }

  if (optionalKeywords.some((keyword) => normalizedRole.includes(keyword))) {
    return {
      key: "conditional" as const,
      labelFr: "Conditionnel",
      labelEn: "Conditional",
      className: "border-primary/25 bg-primary/8 text-primary",
    };
  }

  return {
    key: "core" as const,
    labelFr: "Socle",
    labelEn: "Core",
    className: "border-keep/25 bg-keep/10 text-keep",
  };
}

export default StackDetailPage;
