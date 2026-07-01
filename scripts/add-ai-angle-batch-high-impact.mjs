/** add-ai-angle-batch-high-impact.mjs — angle IA sur 8 fiches à forte notoriété,
 * choisies pour leur volume de recherche ET leur pertinence directe pour
 * l'audience freelance/solopreneur de ToolTrim : Fiverr, LinkedIn, PayPal,
 * Toggl Track, DocuSign, 1Password, WordPress, Deel. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";
const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));

const ANGLES = {
  fiverr: {
    stance: "challenge",
    augmentFr: "Fiverr a lancé son propre hub IA (logos, voix off, montage) pour que les acheteurs testent une option rapide avant de payer un freelance. Côté vendeurs, beaucoup utilisent ChatGPT ou Midjourney pour aller plus vite sur les briefs simples.",
    augmentEn: "Fiverr launched its own AI hub (logos, voiceover, editing) so buyers can try a quick option before paying a freelancer. On the seller side, many use ChatGPT or Midjourney to move faster on simple briefs.",
    replaceFr: "Remplacer Fiverr par une IA ? Pour une tâche générique et ponctuelle (un logo basique, une légende), oui, un outil IA fait souvent l'affaire en quelques minutes — c'est un vrai défi pour les petites missions à faible valeur. Mais pour du travail sur-mesure, un brief complexe ou la fiabilité d'un humain qui comprend le contexte business, le marché de freelances reste difficile à remplacer. Verdict : l'IA challenge la partie basse du marché, pas le cœur du métier.",
    replaceEn: "Replace Fiverr with an AI? For a generic, one-off task (a basic logo, a caption), yes, an AI tool often does the job in minutes — a real challenge for small, low-value gigs. But for custom work, a complex brief, or the reliability of a human who understands business context, the freelance marketplace remains hard to replace. Verdict: AI challenges the low end of the market, not the core of the business.",
    aiTools: ["chatgpt", "midjourney"],
  },
  linkedin: {
    stance: "augmente",
    augmentFr: "LinkedIn a intégré son propre assistant IA pour réécrire des posts et résumer des profils, mais l'usage le plus répandu reste externe : rédiger ses posts ou messages de prospection avec ChatGPT ou Claude avant de les publier sur la plateforme.",
    augmentEn: "LinkedIn built its own AI assistant for rewriting posts and summarizing profiles, but the most common use stays external: drafting posts or outreach messages with ChatGPT or Claude before publishing them on the platform.",
    replaceFr: "Remplacer LinkedIn par une IA ? Non : la valeur de LinkedIn, c'est le réseau et la base de contacts professionnels, pas la rédaction. Une IA peut écrire le post ou le message à ta place, mais elle ne remplace ni les relations construites ni la visibilité auprès de ton réseau. Verdict : l'IA augmente la production de contenu, LinkedIn reste la plateforme de diffusion.",
    replaceEn: "Replace LinkedIn with an AI? No: LinkedIn's value is the network and the professional contact base, not the writing. An AI can draft the post or message for you, but it doesn't replace either the relationships you've built or the visibility with your network. Verdict: AI augments content production, LinkedIn remains the distribution platform.",
    aiTools: ["chatgpt", "claude"],
  },
  paypal: {
    stance: "augmente",
    augmentFr: "PayPal utilise l'IA en interne depuis des années pour la détection de fraude et le scoring de risque, plus récemment pour l'assistance client automatisée. Rien de tout ça ne change ta façon d'utiliser l'outil au quotidien.",
    augmentEn: "PayPal has used AI internally for years for fraud detection and risk scoring, more recently for automated customer support. None of that changes how you use the tool day to day.",
    replaceFr: "Remplacer PayPal par une IA ? La question ne se pose pas vraiment : un agent IA ne peut pas, lui-même, déplacer de l'argent sans passer par un rail de paiement réglementé comme PayPal, Stripe ou un virement bancaire. L'IA optimise la fraude et le support en coulisses, mais l'infrastructure de paiement reste la même. Verdict : aucun changement pour l'utilisateur, l'IA travaille côté back-office.",
    replaceEn: "Replace PayPal with an AI? The question barely applies: an AI agent can't move money itself without going through a regulated payment rail like PayPal, Stripe, or a bank transfer. AI optimizes fraud and support behind the scenes, but the payment infrastructure stays the same. Verdict: no change for the user, AI works on the back office side.",
    aiTools: [],
  },
  toggl: {
    stance: "challenge",
    augmentFr: "Toggl reste un tracker manuel (start/stop), sans IA native pour deviner ton activité. Des concurrents misent sur la détection automatique du temps passé par app ou fenêtre, ce qui réduit l'oubli de lancer le chrono — le vrai point faible du suivi manuel.",
    augmentEn: "Toggl stays a manual tracker (start/stop), with no native AI to guess your activity. Competitors are betting on automatic detection of time spent per app or window, which reduces the classic failure mode of forgetting to start the timer.",
    replaceFr: "Remplacer Toggl par une IA ? Pas totalement, mais le suivi automatique (sans bouton à cliquer) challenge sérieusement le modèle manuel pour qui facture au temps passé et oublie souvent de lancer le chrono. Pour une facturation précise au forfait ou par projet, Toggl reste simple et suffisant. Verdict : challengé sur la fiabilité du suivi, pas remplacé sur la simplicité d'usage.",
    replaceEn: "Replace Toggl with an AI? Not entirely, but automatic tracking (no button to click) seriously challenges the manual model for anyone billing by time who often forgets to start the timer. For precise project or flat-rate billing, Toggl stays simple and sufficient. Verdict: challenged on tracking reliability, not replaced on ease of use.",
    aiTools: [],
  },
  docusign: {
    stance: "augmente",
    augmentFr: "DocuSign a ajouté l'analyse IA de contrats (résumé des clauses, détection de risques) à son offre Intelligent Agreement Management. Pour la signature elle-même, rien ne change : c'est toujours un acte juridique, pas une tâche IA.",
    augmentEn: "DocuSign added AI contract analysis (clause summaries, risk detection) to its Intelligent Agreement Management offer. For the signature itself, nothing changes: it's still a legal act, not an AI task.",
    replaceFr: "Remplacer DocuSign par une IA ? Non : une signature électronique a une valeur juridique précise (horodatage, identité, conformité eIDAS/ESIGN) qu'une IA généraliste ne peut pas produire seule. L'IA aide à relire et résumer le contrat avant de signer, mais la signature reste un acte qui doit passer par un prestataire certifié. Verdict : l'IA augmente la relecture, pas la signature.",
    replaceEn: "Replace DocuSign with an AI? No: an electronic signature carries a precise legal value (timestamp, identity, eIDAS/ESIGN compliance) that a general-purpose AI can't produce on its own. AI helps review and summarize the contract before signing, but the signature itself still has to go through a certified provider. Verdict: AI augments the review, not the signature.",
    aiTools: ["ironclad"],
  },
  "1password": {
    stance: "augmente",
    augmentFr: "1Password a ajouté des alertes IA sur les mots de passe compromis et la détection de phishing, mais le cœur du produit (chiffrement, coffre, partage d'équipe) reste un problème de sécurité, pas un problème que l'IA résout différemment.",
    augmentEn: "1Password added AI-driven alerts for compromised passwords and phishing detection, but the core of the product (encryption, vault, team sharing) remains a security problem, not one that AI solves differently.",
    replaceFr: "Remplacer 1Password par une IA ? Non, et ça ne devrait même pas être tenté : confier ses mots de passe à un assistant IA généraliste serait un vrai risque de sécurité (l'historique de conversation devient une cible). Un gestionnaire de mots de passe dédié, chiffré de bout en bout, reste l'option la plus sûre. Verdict : l'IA améliore les alertes de sécurité, elle ne remplace pas le coffre-fort.",
    replaceEn: "Replace 1Password with an AI? No, and it shouldn't even be attempted: handing your passwords to a general-purpose AI assistant would be a real security risk (the conversation history becomes a target). A dedicated, end-to-end encrypted password manager remains the safest option. Verdict: AI improves security alerts, it doesn't replace the vault.",
    aiTools: [],
  },
  wordpress: {
    stance: "challenge",
    augmentFr: "WordPress a son propre assistant IA (Jetpack AI) pour rédiger du contenu, mais le vrai bouleversement vient de l'extérieur : des constructeurs de sites pilotés par prompt comme Lovable, v0 ou Framer AI permettent de lancer un site vitrine sans thème, sans plugin, sans maintenance.",
    augmentEn: "WordPress has its own AI assistant (Jetpack AI) for writing content, but the real disruption comes from outside: prompt-driven site builders like Lovable, v0, or Framer AI let you launch a showcase site without a theme, without plugins, without maintenance.",
    replaceFr: "Remplacer WordPress par une IA ? Pour un site vitrine simple ou une landing page, oui, de plus en plus — les générateurs IA produisent un résultat propre en quelques minutes, sans la dette technique des plugins WordPress. Pour un site éditorial complexe, un blog à fort volume de contenu ou un usage e-commerce avancé (WooCommerce), l'écosystème WordPress reste plus mature et plus personnalisable. Verdict : challengé sur les sites simples, encore solide sur le contenu et le e-commerce.",
    replaceEn: "Replace WordPress with an AI? For a simple showcase site or a landing page, increasingly yes — AI generators produce a clean result in minutes, without WordPress plugins' technical debt. For a complex editorial site, a high-volume content blog, or advanced e-commerce (WooCommerce), the WordPress ecosystem remains more mature and customizable. Verdict: challenged on simple sites, still solid on content and e-commerce.",
    aiTools: ["lovable", "v0-vercel", "framer"],
  },
  deel: {
    stance: "augmente",
    augmentFr: "Deel utilise l'IA pour générer des contrats conformes selon le pays et accélérer l'onboarding, mais le statut d'Employer of Record (EOR) — l'entité qui embauche légalement à ta place à l'étranger — reste une responsabilité humaine et réglementaire que l'IA ne peut pas porter seule.",
    augmentEn: "Deel uses AI to generate country-compliant contracts and speed up onboarding, but the Employer of Record (EOR) status — the entity that legally hires on your behalf abroad — remains a human, regulatory responsibility that AI can't carry on its own.",
    replaceFr: "Remplacer Deel par une IA ? Non : la paie internationale et le statut d'EOR impliquent une responsabilité légale et fiscale réelle dans chaque pays, pas seulement de la génération de documents. L'IA accélère la rédaction des contrats et la conformité, mais l'infrastructure légale derrière (entités locales, droit du travail) reste le vrai produit. Verdict : l'IA augmente la rapidité, pas la couverture légale.",
    replaceEn: "Replace Deel with an AI? No: international payroll and EOR status involve real legal and tax liability in each country, not just document generation. AI speeds up contract drafting and compliance, but the legal infrastructure behind it (local entities, labor law) remains the actual product. Verdict: AI augments speed, not legal coverage.",
    aiTools: [],
  },
};

let updated = 0;
for (const [slug, angle] of Object.entries(ANGLES)) {
  if (!present.has(slug)) {
    console.warn(`⚠️  ${slug} not found in tools_v4.json, skipping`);
    continue;
  }
  const tool = tools.find((x) => (x.slug || x.id) === slug);
  tool.seo = Object.assign({}, tool.seo, { aiAngle: angle });
  updated++;
  console.log(`✓ ${tool.name} (${slug}): aiAngle added (${angle.stance})`);
}

writeFileSync(PATH, JSON.stringify(tools, null, 2) + "\n", "utf8");
console.log(`\n${updated}/${Object.keys(ANGLES).length} fiches updated.`);
