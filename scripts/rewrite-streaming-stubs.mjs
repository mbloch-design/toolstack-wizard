/** rewrite-streaming-stubs.mjs — réécriture de 4 stubs du cluster streaming créateur.
 * Prix vérifiés juin 2026. Twitch Studio : fait discontinué (Twitch lui-même
 * a arrêté son développement), point capital absent du stub d'origine. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  "streamlabs": {
    shortDescription: "Logiciel de streaming gratuit avec alertes et overlays ; Prime à 19$/mois pour le sans-marque.",
    shortDescriptionEn: "Free streaming software with alerts and overlays; Prime at $19/month removes branding.",
    pricing: { free: "Gratuit : capture, overlays de base, alertes, chat intégré.", paid: "Prime 19$/mois (149$/an, ~12,42$/mois) : thèmes premium, sans marque Streamlabs, sons d'alerte illimités. Ultra 27$/mois pour les outils d'équipe et de monétisation avancés." },
    pricingEn: { free: "Free: capture, basic overlays, alerts, integrated chat.", paid: "Prime $19/month ($149/year, ~$12.42/month): premium themes, no Streamlabs branding, unlimited alert sounds. Ultra $27/month for team tools and advanced monetization." },
    defaultMonthlyPrice: 0,
    longDescription: "Streamlabs est un logiciel de streaming gratuit (capture d'écran, scènes, overlays, chat) qui s'est construit une réputation sur ses alertes et widgets prêts à l'emploi, plus simples à configurer qu'OBS pour un débutant. Le plan gratuit couvre l'essentiel pour démarrer un stream.\n\nPrime (19$/mois, ou 149$/an soit environ 12,42$/mois) retire la marque Streamlabs des overlays, débloque des thèmes premium et des sons d'alerte illimités : surtout un confort esthétique, pas une fonctionnalité technique critique. Ultra (27$/mois) ajoute des outils pensés pour les équipes et la monétisation avancée. Pour un débutant qui veut juste streamer, le gratuit suffit ; pour une chaîne établie qui veut un rendu pro sans configuration manuelle, Prime se justifie.",
    longDescriptionEn: "Streamlabs is free streaming software (screen capture, scenes, overlays, chat) that built its reputation on ready-made alerts and widgets, easier to set up than OBS for a beginner. The free plan covers the essentials to start streaming.\n\nPrime ($19/month, or $149/year, about $12.42/month) removes the Streamlabs branding from overlays, unlocks premium themes and unlimited alert sounds: mostly an aesthetic comfort, not a critical technical feature. Ultra ($27/month) adds tools built for teams and advanced monetization. For a beginner who just wants to stream, free is enough; for an established channel wanting a polished look without manual setup, Prime earns its place.",
    verdict: {
      keepIf: ["Tu débutes et veux des alertes/overlays prêts à l'emploi sans configuration manuelle", "Tu veux un rendu pro sans marque Streamlabs (Prime)"],
      avoidIf: ["Tu es à l'aise techniquement : OBS Studio fait la même chose gratuitement et sans marque", "Tu cherches juste à streamer simplement sans personnalisation : le gratuit suffit largement"],
      threshold: "Le gratuit couvre le besoin de base. Prime (19$/mois) est un confort esthétique, pas une nécessité technique.",
    },
    verdictEn: {
      keepIf: ["You're starting out and want ready-made alerts/overlays with no manual setup", "You want a polished look with no Streamlabs branding (Prime)"],
      avoidIf: ["You're technically comfortable: OBS Studio does the same thing for free with no branding", "You just want to stream simply with no customization: free is plenty"],
      threshold: "Free covers the basic need. Prime ($19/month) is an aesthetic comfort, not a technical necessity.",
    },
    pros: ["Plan gratuit complet pour démarrer", "Alertes et overlays prêts à l'emploi, plus simples qu'OBS pour un débutant", "Large bibliothèque de thèmes et widgets"],
    prosEn: ["Complete free plan to get started", "Ready-made alerts and overlays, easier than OBS for beginners", "Large library of themes and widgets"],
    cons: ["Marque Streamlabs visible sur le gratuit", "Prime est surtout cosmétique, pas une nécessité technique", "OBS Studio fait l'équivalent gratuitement pour qui est à l'aise techniquement"],
    consEn: ["Streamlabs branding visible on the free plan", "Prime is mostly cosmetic, not a technical necessity", "OBS Studio does the equivalent for free for the technically comfortable"],
    useCases: ["Démarrer un stream Twitch ou YouTube avec des alertes prêtes à l'emploi", "Personnaliser des overlays sans compétence technique", "Retirer la marque Streamlabs pour une chaîne établie (Prime)"],
    useCasesEn: ["Start a Twitch or YouTube stream with ready-made alerts", "Customize overlays with no technical skill", "Remove Streamlabs branding for an established channel (Prime)"],
    alternatives: ["obs", "streamelements"],
  },
  "streamelements": {
    shortDescription: "Overlays, alertes et boutique merch pour streamers, sans abonnement obligatoire.",
    shortDescriptionEn: "Overlays, alerts and a merch store for streamers, no subscription required.",
    pricing: { free: "Gratuit : overlays, chatbot, alertes, boutique merch (tailles et designs limités).", paid: "Entrée payante dès 10$/mois pour plus de tailles de merch et d'overlays, et un meilleur accompagnement débutant." },
    pricingEn: { free: "Free: overlays, chatbot, alerts, merch store (limited sizes and designs).", paid: "Paid tier starting at $10/month for more merch sizes, overlays, and better beginner support." },
    defaultMonthlyPrice: 0,
    longDescription: "StreamElements fonctionne sans abonnement obligatoire : l'essentiel (overlays, chatbot, alertes, et même une boutique merch intégrée) est accessible gratuitement, ce qui le distingue de Streamlabs qui pousse plus fort vers Prime. La contrepartie, c'est que le plan gratuit limite les tailles de merch et certains designs d'overlay.\n\nÀ partir de 10$/mois, on débloque plus de tailles de merch, plus d'overlays et un meilleur accompagnement pour les nouveaux streamers. Pour qui veut juste streamer avec des widgets propres sans payer, c'est l'un des choix les plus généreux du marché.",
    longDescriptionEn: "StreamElements works with no subscription required: the essentials (overlays, chatbot, alerts, and even an integrated merch store) are accessible for free, which sets it apart from Streamlabs, which pushes harder toward Prime. The trade-off is that the free plan limits merch sizes and some overlay designs.\n\nStarting at $10/month, you unlock more merch sizes, more overlays and better support for new streamers. For anyone who just wants to stream with clean widgets without paying, it's one of the most generous options on the market.",
    verdict: {
      keepIf: ["Tu veux des overlays et alertes propres sans payer d'abonnement", "Tu veux vendre du merch directement intégré au stream"],
      avoidIf: ["Tu as besoin de beaucoup de tailles/designs de merch dès le départ : il faudra passer au payant (10$/mois)"],
      threshold: "L'un des choix gratuits les plus complets du marché. Le payant (10$/mois) ne devient utile que pour la boutique merch avancée.",
    },
    verdictEn: {
      keepIf: ["You want clean overlays and alerts with no subscription", "You want to sell merch directly integrated into the stream"],
      avoidIf: ["You need a lot of merch sizes/designs from day one: you'll need to go paid ($10/month)"],
      threshold: "One of the most complete free options on the market. The paid tier ($10/month) only becomes useful for the advanced merch store.",
    },
    pros: ["Gratuit sans pousser fort vers un abonnement", "Boutique merch intégrée dès le plan gratuit", "Overlays et chatbot complets sans payer"],
    prosEn: ["Free with no hard push toward a subscription", "Integrated merch store from the free plan", "Complete overlays and chatbot with no payment"],
    cons: ["Tailles et designs de merch limités sur le gratuit", "Moins de thèmes premium que Streamlabs Prime"],
    consEn: ["Limited merch sizes and designs on the free plan", "Fewer premium themes than Streamlabs Prime"],
    useCases: ["Streamer avec des overlays et alertes gratuits sur Twitch ou YouTube", "Vendre du merch directement depuis l'interface de stream", "Gérer un chatbot de modération sans payer"],
    useCasesEn: ["Stream with free overlays and alerts on Twitch or YouTube", "Sell merch directly from the streaming interface", "Manage a moderation chatbot with no payment"],
    alternatives: ["streamlabs", "obs"],
  },
  "elgato-stream-deck": {
    shortDescription: "Contrôleur physique à touches programmables pour streamers, du Mini (50$) au XL (250$).",
    shortDescriptionEn: "Physical programmable button controller for streamers, from the Mini ($50) to the XL ($250).",
    pricing: { free: "", paid: "Mini ~50$ (achat unique) ; MK.2 standard (15 touches) ~150$ ; Stream Deck + (touches + molette tactile) ~180$ ; XL (32 touches) ~250$." },
    pricingEn: { free: "", paid: "Mini ~$50 (one-time purchase); standard MK.2 (15 keys) ~$150; Stream Deck + (keys + touch dial) ~$180; XL (32 keys) ~$250." },
    defaultMonthlyPrice: 150,
    longDescription: "Le Stream Deck est un boîtier physique de touches LCD programmables : chaque touche déclenche une action (changer de scène OBS, lancer une alerte, couper le micro, poster sur les réseaux) sans toucher au clavier. C'est un achat matériel unique, pas un abonnement, avec plusieurs tailles selon le besoin.\n\nLe Mini (environ 50$, 6 touches) convient à un setup simple. Le MK.2 (environ 150$, 15 touches) est le format standard pour la plupart des streamers. Le modèle + ajoute une molette tactile pour des réglages analogiques (volume, luminosité). Le XL (environ 250$, 32 touches) vise les setups avec beaucoup d'actions à déclencher (multi-plateforme, équipe de production). C'est un investissement matériel ponctuel qui simplifie réellement la régie d'un stream en direct.",
    longDescriptionEn: "The Stream Deck is a physical box of programmable LCD keys: each key triggers an action (switch OBS scene, fire an alert, mute the mic, post to social media) without touching the keyboard. It's a one-time hardware purchase, not a subscription, with several sizes depending on the need.\n\nThe Mini (about $50, 6 keys) suits a simple setup. The MK.2 (about $150, 15 keys) is the standard format for most streamers. The + model adds a touch dial for analog adjustments (volume, brightness). The XL (about $250, 32 keys) targets setups with a lot of actions to trigger (multi-platform, production team). It's a one-time hardware investment that genuinely simplifies live stream control.",
    verdict: {
      keepIf: ["Tu streames régulièrement et changes souvent de scène, micro ou overlay en direct", "Tu veux éviter les raccourcis clavier compliqués pendant un live"],
      avoidIf: ["Tu streames rarement ou avec un setup très simple (1 scène fixe) : un raccourci clavier suffit"],
      threshold: "Rentable pour qui streame régulièrement. Le MK.2 standard (15 touches, ~150$) couvre la plupart des besoins.",
    },
    verdictEn: {
      keepIf: ["You stream regularly and frequently switch scenes, mic or overlay live", "You want to avoid complicated keyboard shortcuts during a live show"],
      avoidIf: ["You rarely stream or use a very simple setup (1 fixed scene): a keyboard shortcut is enough"],
      threshold: "Worth it for regular streamers. The standard MK.2 (15 keys, ~$150) covers most needs.",
    },
    pros: ["Achat unique, pas d'abonnement", "Contrôle physique fiable pendant un live, sans erreur de raccourci", "Plusieurs tailles selon le budget et le besoin (Mini à XL)"],
    prosEn: ["One-time purchase, no subscription", "Reliable physical control during a live, no shortcut mistakes", "Several sizes depending on budget and need (Mini to XL)"],
    cons: ["Investissement matériel non négligeable pour le modèle XL (~250$)", "Nécessite de configurer chaque touche manuellement au départ"],
    consEn: ["Significant hardware investment for the XL model (~$250)", "Requires manually configuring each key at the start"],
    useCases: ["Changer de scène OBS ou Streamlabs sans toucher au clavier", "Déclencher des alertes ou couper le micro en un clic pendant un live", "Poster sur les réseaux sociaux directement depuis le boîtier"],
    useCasesEn: ["Switch OBS or Streamlabs scenes with no keyboard", "Trigger alerts or mute the mic in one click during a live", "Post to social media directly from the device"],
    alternatives: ["obs"],
  },
  "twitch-studio": {
    shortDescription: "Logiciel de streaming de Twitch, désormais discontinué : préférer OBS Studio ou Streamlabs.",
    shortDescriptionEn: "Twitch's own streaming software, now discontinued: prefer OBS Studio or Streamlabs.",
    pricing: { free: "Gratuit, mais plus développé.", paid: "" },
    pricingEn: { free: "Free, but no longer developed.", paid: "" },
    defaultMonthlyPrice: 0,
    longDescription: "Twitch Studio était le logiciel de streaming gratuit développé par Twitch lui-même, pensé pour simplifier le démarrage (configuration guidée, intégration native au chat Twitch). Le point capital à connaître en 2026 : Twitch a arrêté son développement actif. L'application reste installable et fonctionne encore pour qui l'utilise déjà, mais elle ne reçoit plus de mises à jour, de correctifs ni de nouvelles fonctionnalités.\n\nTwitch a réorienté sa stratégie vers le support de logiciels tiers plutôt que de maintenir son propre outil. Pour démarrer un stream en 2026, OBS Studio (gratuit, open source, mises à jour actives) ou Streamlabs (plus simple à prendre en main) sont les choix recommandés, y compris pour streamer spécifiquement sur Twitch.",
    longDescriptionEn: "Twitch Studio was the free streaming software built by Twitch itself, designed to simplify getting started (guided setup, native Twitch chat integration). The key thing to know in 2026: Twitch has stopped actively developing it. The app remains installable and still works for those already using it, but it no longer receives updates, fixes or new features.\n\nTwitch shifted its strategy toward supporting third-party software rather than maintaining its own tool. To start streaming in 2026, OBS Studio (free, open source, actively updated) or Streamlabs (easier to pick up) are the recommended choices, including for streaming specifically on Twitch.",
    verdict: {
      keepIf: ["Tu l'utilises déjà et n'as pas de besoin nouveau non couvert"],
      avoidIf: ["Tu démarres un nouveau setup de stream : l'outil n'est plus maintenu, mieux vaut OBS Studio ou Streamlabs dès le départ"],
      threshold: "À éviter pour un nouveau setup : logiciel discontinué depuis l'arrêt de son développement par Twitch. OBS Studio ou Streamlabs sont les choix actuels.",
    },
    verdictEn: {
      keepIf: ["You already use it and have no new need it doesn't cover"],
      avoidIf: ["You're starting a new streaming setup: the tool is no longer maintained, better to start directly with OBS Studio or Streamlabs"],
      threshold: "Avoid for a new setup: discontinued since Twitch stopped developing it. OBS Studio or Streamlabs are the current choices.",
    },
    pros: ["Intégration native au chat et à la communauté Twitch", "Configuration guidée historiquement simple pour démarrer"],
    prosEn: ["Native integration with Twitch chat and community", "Historically simple guided setup to get started"],
    cons: ["Développement arrêté par Twitch : plus de mises à jour ni de correctifs", "Aucune nouvelle fonctionnalité à attendre", "OBS Studio et Streamlabs sont activement maintenus et recommandés à la place"],
    consEn: ["Development stopped by Twitch: no more updates or fixes", "No new features to expect", "OBS Studio and Streamlabs are actively maintained and recommended instead"],
    useCases: ["Usage existant pour qui l'a déjà configuré (sans urgence à migrer)", "Référence historique : à remplacer par OBS Studio ou Streamlabs pour tout nouveau setup"],
    useCasesEn: ["Existing use for those who already set it up (no urgency to migrate)", "Historical reference: replace with OBS Studio or Streamlabs for any new setup"],
    alternatives: ["obs", "streamlabs"],
  },
};

const tools = JSON.parse(readFileSync(PATH, "utf8"));
const present = new Set(tools.map((x) => x.slug || x.id));
let n = 0;
for (const x of tools) {
  const slug = x.slug || x.id;
  if (!A[slug]) continue;
  const fix = A[slug];
  Object.assign(x, fix);
  x.alternatives = (fix.alternatives || []).filter((s) => present.has(s));
  n++;
}
const out = JSON.stringify(tools, null, 2) + "\n";
JSON.parse(out);
writeFileSync(PATH, out);
console.log(`Réécriture streaming : ${n}/4 fiches | JSON OK`);
