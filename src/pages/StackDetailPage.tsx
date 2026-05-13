import { useEffect, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import { STACK_PERSONAS, STACK_STAGES, STACKS, STACK_USES, type StackGuide, type StackInsight, type StackPersona, type StackStage } from "@/data/stacks";

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

  const uses = STACK_USES[stack.id] || [];
  const stackTools = stack.tools.map((slot) => ({ slot, tool: toolBySlug.get(slot.slug) })).filter((item) => item.tool);
  const toolDecisionStats = stack.tools.reduce(
    (stats, slot) => {
      const status = getToolDecisionStatus(slot).key;
      stats[status] += 1;
      return stats;
    },
    { core: 0, conditional: 0, challenge: 0 }
  );
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
            <Button asChild variant="outline" size="lg" className="rounded-lg">
              <a href="#utilisations">{t("Voir les cas d'usage", "See use cases")}</a>
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
          <a className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary hover:text-primary" href="#expert">
            {t("Conseil expert", "Expert read")}
          </a>
          <a className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary hover:text-primary" href="#utilisations">
            {t("Scénarios", "Scenarios")}
          </a>
          <a className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary hover:text-primary" href="#questions">
            {t("Auto-check", "Self-check")}
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
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              {t("Cartographie", "Map")}
            </p>
            <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
              {t("Les outils rangés par rôle, avec le niveau de décision.", "Tools grouped by role, with the decision level.")}
            </h2>
          </div>

          {/* ── Tech stack grid ── */}
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
            <div
              className="grid min-w-max border-t border-border"
              style={{ gridTemplateColumns: `repeat(${stackLayers.length}, minmax(168px, 1fr))` }}
            >
              {/* Column headers */}
              {stackLayers.map((layer, i) => (
                <div
                  key={`h-${layer.id}`}
                  className={`py-5 px-6 ${i > 0 ? "border-l border-dashed border-border" : ""}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground">
                    {t(layer.titleFr, layer.titleEn)}
                  </p>
                  <div className="mt-1.5 h-[2px] w-5 rounded-full bg-primary" />
                </div>
              ))}

              {/* Tool columns */}
              {stackLayers.map((layer, i) => (
                <div
                  key={`col-${layer.id}`}
                  className={`border-t border-border py-7 px-6 flex flex-col gap-6 ${i > 0 ? "border-l border-dashed border-border" : ""}`}
                >
                  {layer.tools.map(({ slot, tool }) => {
                    const status = getToolDecisionStatus(slot);
                    return (
                      <Link
                        key={slot.slug}
                        to={`${prefix}/tool/${tool!.slug}`}
                        className="group flex flex-col items-center gap-2.5 text-center cursor-pointer"
                      >
                        <div className={`rounded-xl p-1.5 ring-1 transition-all duration-150 group-hover:ring-2 ${status.className}`}>
                          <ToolLogo tool={tool!} size={44} className="rounded-lg" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                            {tool!.name}
                          </p>
                          <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                            {t(slot.role, slot.roleEn)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="expert" className="scroll-mt-24 border-b border-border py-12">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              {t("Conseil expert", "Expert read")}
            </p>
            <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
              {t("Ce que je garderais vraiment dans ce métier.", "What I would actually keep for this role.")}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {expertTips.map((tip) => (
              <div key={tip.title} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-base font-semibold text-foreground">{t(tip.title, tip.titleEn)}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{t(tip.detail, tip.detailEn)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CAS D'USAGE ────────────────────────────────────────────────── */}
        <section id="utilisations" className="scroll-mt-24 border-b border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-8">
            {t("Dans la vraie vie", "In real life")}
          </p>
          <div className="space-y-12">
            {uses.map((use, index) => {
              const useTools = use.toolSlugs.map((toolSlug) => toolBySlug.get(toolSlug)).filter(Boolean);
              return (
                <article key={use.title}>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground mb-1">
                        {t("Scénario", "Scenario")} {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3
                        className="font-display text-foreground"
                        style={{ fontSize: "clamp(1.125rem, 2vw, 1.375rem)", fontWeight: 600, letterSpacing: "-0.015em" }}
                      >
                        {t(use.title, use.titleEn)}
                      </h3>
                    </div>
                    <div className="flex -space-x-2 shrink-0">
                      {useTools.map((tool) => (
                        <ToolLogo key={tool!.id} tool={tool!} size={32} className="rounded-md border-2 border-background bg-background" />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-muted-foreground mb-6">
                    {t(use.description, use.descriptionEn)}
                  </p>

                  <ol className="space-y-3 border-l-2 border-border pl-5">
                    {(lang === "fr" ? use.workflow : use.workflowEn).map((step, stepIndex) => (
                      <li key={step} className="relative">
                        <span className="absolute -left-[1.65rem] flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border">
                          <span className="font-mono text-[10px] font-bold text-primary">
                            {String(stepIndex + 1)}
                          </span>
                        </span>
                        <p className="text-sm leading-6 text-foreground">{step}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {useTools.map((tool) => (
                      <Link
                        key={tool!.id}
                        to={`${prefix}/tool/${tool!.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        <ToolLogo tool={tool!} size={14} className="rounded" />
                        {tool!.name}
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── AUTO-CHECK ─────────────────────────────────────────────────── */}
        <section id="questions" className="scroll-mt-24 border-b border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-8">
            {t("Avant d'adopter cette stack", "Before adopting this stack")}
          </p>
          <div className="space-y-10">
            {stack.checkpoints.map((cp, i) => (
              <div key={i} className="grid grid-cols-[2rem_1fr] gap-4">
                <span
                  className="font-mono text-2xl font-bold leading-none"
                  style={{ color: "hsl(var(--muted-foreground) / 0.25)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-base font-semibold leading-6 text-foreground">
                    {t(cp.q, cp.qEn)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(cp.hint, cp.hintEn)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

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
    </div>
  );
};

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
