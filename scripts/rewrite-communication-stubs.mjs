/** rewrite-communication-stubs.mjs — réécriture de 4 stubs auto-générés
 * dans la catégorie communication (Discord, Crisp, Help Scout, Eventbrite).
 * Prix vérifiés juin 2026. */
import { readFileSync, writeFileSync } from "node:fs";
const PATH = "src/data/tools_v4.json";

const A = {
  "discord": {
    shortDescription: "Messagerie vocale et textuelle par serveurs, gratuite, avec Nitro en option (9,99$/mois).",
    shortDescriptionEn: "Voice and text messaging by servers, free, with optional Nitro ($9.99/mo).",
    pricing: { free: "Gratuit, sans limite de membres ni de serveurs.", paid: "Nitro Basic 2,99$/mois ; Nitro 9,99$/mois (99,99$/an) : avatars animés, fichiers jusqu'à 500 Mo, streaming 4K. Boost de serveur séparé à 2,99$/mois." },
    pricingEn: { free: "Free, no limit on members or servers.", paid: "Nitro Basic $2.99/mo; Nitro $9.99/mo ($99.99/yr): animated avatars, files up to 500MB, 4K streaming. Server boosts separately at $2.99/mo." },
    defaultMonthlyPrice: 0,
    longDescription: "Discord est devenu la messagerie de référence pour les communautés, bien au-delà du jeu vidéo : créateurs de contenu, équipes freelances, communautés professionnelles. Le coeur du produit (serveurs, salons texte et vocaux, partage d'écran) est entièrement gratuit, sans limite de membres.\n\nNitro (9,99$/mois) ajoute du confort personnel : avatars animés, emojis personnalisés utilisables partout, fichiers jusqu'à 500 Mo, streaming en 4K. Les Boosts de serveur (2,99$/mois chacun, payés par les membres pour soutenir un serveur) débloquent des avantages collectifs : meilleure qualité audio, plus d'emojis pour tout le serveur, bannière personnalisée. Pour un usage pro (communauté de clients, équipe freelance), le plan gratuit suffit largement ; Nitro reste un confort individuel optionnel.",
    longDescriptionEn: "Discord has become the go-to messaging app for communities, well beyond gaming: content creators, freelance teams, professional communities. The core product (servers, text and voice channels, screen sharing) is completely free, with no member limit.\n\nNitro ($9.99/mo) adds personal comfort: animated avatars, custom emojis usable everywhere, files up to 500MB, 4K streaming. Server Boosts ($2.99/mo each, paid by members to support a server) unlock collective perks: better audio quality, more server-wide emojis, custom banner. For pro use (client community, freelance team), the free plan is more than enough; Nitro stays an optional individual comfort.",
    verdict: {
      keepIf: ["Tu gères ou rejoins une communauté (clients, créateurs, équipe) : le gratuit couvre déjà tout l'essentiel", "Tu veux des salons vocaux permanents sans réserver de créneau, contrairement à Zoom"],
      avoidIf: ["Tu cherches un outil professionnel avec SSO, conformité ou support entreprise : Discord reste orienté communauté, pas B2B structuré"],
      threshold: "Gratuit et largement suffisant pour 95% des usages communautaires. Nitro n'est qu'un confort cosmétique individuel.",
    },
    verdictEn: {
      keepIf: ["You run or join a community (clients, creators, team): the free plan already covers the essentials", "You want always-on voice channels with no need to schedule a slot, unlike Zoom"],
      avoidIf: ["You need a professional tool with SSO, compliance or enterprise support: Discord stays community-oriented, not structured B2B"],
      threshold: "Free and more than enough for 95% of community use cases. Nitro is just an optional cosmetic individual comfort.",
    },
    pros: ["100% gratuit pour l'essentiel, sans limite de membres", "Salons vocaux permanents, pas de créneau à réserver", "Écosystème de bots et d'intégrations énorme", "Référence pour les communautés de créateurs"],
    prosEn: ["100% free for the essentials, no member limit", "Always-on voice channels, no slot to book", "Huge bot and integration ecosystem", "The reference for creator communities"],
    cons: ["Pas pensé pour le B2B structuré (pas de SSO natif, conformité limitée)", "Modération à mettre en place soi-même sur les grosses communautés", "Nitro ajoute peu de valeur pro, surtout cosmétique"],
    consEn: ["Not built for structured B2B (no native SSO, limited compliance)", "Moderation has to be set up yourself on large communities", "Nitro adds little professional value, mostly cosmetic"],
    useCases: ["Animer une communauté de clients ou de créateurs", "Coordonner une équipe freelance avec des salons vocaux permanents", "Héberger un serveur communautaire autour d'un produit ou d'une marque"],
    useCasesEn: ["Run a client or creator community", "Coordinate a freelance team with always-on voice channels", "Host a community server around a product or brand"],
    alternatives: ["slack"],
  },
  "crisp": {
    shortDescription: "Chat client avec tarification au workspace (pas par siège) : gratuit puis dès 45€/mois.",
    shortDescriptionEn: "Customer chat priced per workspace (not per seat): free, then from €45/month.",
    pricing: { free: "2 agents, 100 profils clients, widget de chat live.", paid: "Mini 45€/mois (4 agents, 5000 profils) ; Essentials 95€/mois (10 sièges, IA, workflows) ; Plus 295€/mois (sièges supplémentaires à 10€/agent)." },
    pricingEn: { free: "2 agents, 100 customer profiles, live chat widget.", paid: "Mini €45/mo (4 agents, 5,000 profiles); Essentials €95/mo (10 seats, AI, workflows); Plus €295/mo (extra seats at €10/agent)." },
    defaultMonthlyPrice: 45,
    longDescription: "Crisp se distingue par sa tarification : un prix fixe par workspace, pas par siège. Pour une équipe de 10 à 20 personnes, ça peut couper la facture de moitié comparé à des concurrents facturés à l'agent comme Zendesk ou Intercom, où chaque siège ajoute un coût.\n\nLe plan gratuit (2 agents, 100 profils) est un vrai point d'entrée utilisable, pas juste un essai limité. Mini (45€/mois) ajoute l'email dans la même boîte de réception. Essentials (95€/mois) ajoute l'IA, les workflows d'automatisation et 10 sièges inclus. Seul le plan Plus (295€/mois) permet d'ajouter des sièges supplémentaires à 10€/agent ; les plans inférieurs ont un plafond dur sans extension possible.",
    longDescriptionEn: "Crisp stands out for its pricing: a flat price per workspace, not per seat. For a team of 10 to 20 people, that can cut the bill in half compared to per-agent competitors like Zendesk or Intercom, where every seat adds cost.\n\nThe free plan (2 agents, 100 profiles) is a genuinely usable entry point, not just a limited trial. Mini (€45/mo) adds email into the same inbox. Essentials (€95/mo) adds AI, automation workflows and 10 included seats. Only the Plus plan (€295/mo) lets you add extra seats at €10/agent; lower plans have a hard cap with no expansion option.",
    verdict: {
      keepIf: ["Ton équipe support a plus de 5 personnes : la tarification au workspace devient nettement plus rentable qu'au siège", "Tu veux de l'IA et des workflows sans payer le prix d'Intercom"],
      avoidIf: ["Tu es seul ou en toute petite équipe : le gratuit ou un concurrent plus simple peut suffire", "Tu as besoin d'ajouter des sièges sur Mini ou Essentials : il faudra passer à Plus"],
      threshold: "Très rentable dès qu'on dépasse 5-10 agents support, grâce au prix fixe par workspace plutôt que par siège.",
    },
    verdictEn: {
      keepIf: ["Your support team has more than 5 people: per-workspace pricing becomes clearly more profitable than per-seat", "You want AI and workflows without paying Intercom's price"],
      avoidIf: ["You're solo or a very small team: the free plan or a simpler competitor may be enough", "You need to add seats on Mini or Essentials: you'll have to upgrade to Plus"],
      threshold: "Very cost-effective past 5-10 support agents, thanks to flat per-workspace pricing instead of per-seat.",
    },
    pros: ["Tarification au workspace, pas par siège : très rentable en équipe", "Plan gratuit réellement utilisable (pas juste un essai)", "IA et workflows inclus dès Essentials (95€/mois)"],
    prosEn: ["Per-workspace pricing, not per-seat: very cost-effective for teams", "Genuinely usable free plan (not just a trial)", "AI and workflows included from Essentials (€95/mo)"],
    cons: ["Plafond de sièges strict sur Free/Mini/Essentials, sans extension possible", "Moins connu qu'Intercom ou Zendesk, écosystème d'intégrations plus jeune"],
    consEn: ["Strict seat cap on Free/Mini/Essentials, with no expansion option", "Less known than Intercom or Zendesk, younger integration ecosystem"],
    useCases: ["Centraliser chat, email et réseaux sociaux dans une seule boîte de réception", "Automatiser les réponses support avec des workflows et de l'IA", "Réduire le coût du support client pour une équipe de 10+ agents"],
    useCasesEn: ["Centralize chat, email and social media in a single inbox", "Automate support replies with workflows and AI", "Cut customer support costs for a team of 10+ agents"],
    alternatives: ["intercom", "zendesk", "tidio"],
  },
  "helpscout": {
    shortDescription: "Support client par email avec base de connaissance, dès 25$/mois/utilisateur (annuel).",
    shortDescriptionEn: "Email-based customer support with a knowledge base, from $25/user/month (annual).",
    pricing: { free: "5 utilisateurs, 1 boîte de réception, 1 base de connaissance, 100 contacts/mois.", paid: "Standard ~25$/mois/utilisateur (annuel) ; Plus ~38$ ; Pro ~63-65$/mois/utilisateur (permissions avancées, conformité HIPAA). IA Réponses en option à 0,75$/résolution." },
    pricingEn: { free: "5 users, 1 inbox, 1 knowledge base, 100 contacts/month.", paid: "Standard ~$25/user/month (annual); Plus ~$38; Pro ~$63-65/user/month (advanced permissions, HIPAA compliance). AI Answers add-on at $0.75/resolution." },
    defaultMonthlyPrice: 25,
    longDescription: "Help Scout traite le support client comme de l'email partagé plutôt que comme un système de tickets impersonnel : la boîte de réception ressemble à du Gmail, ce qui rend la prise en main rapide pour une petite équipe. Il ajoute une base de connaissance (Docs) et un widget client (Beacon), souvent vendus ou inclus séparément selon le plan.\n\nLe plan gratuit (5 utilisateurs, 100 contacts/mois) couvre une vraie petite structure. Au-delà, les tarifs par utilisateur grimpent vite : Standard autour de 25$/mois/utilisateur en annuel, Pro jusqu'à 63-65$. Les réponses automatiques par IA sont facturées à part (0,75$ par résolution), un coût à surveiller si le volume de support est élevé.",
    longDescriptionEn: "Help Scout treats customer support like shared email rather than an impersonal ticketing system: the inbox looks like Gmail, making it quick to pick up for a small team. It adds a knowledge base (Docs) and a customer-facing widget (Beacon), often sold or included separately depending on the plan.\n\nThe free plan (5 users, 100 contacts/month) covers a genuinely small setup. Beyond that, per-user pricing climbs fast: Standard around $25/user/month annual, Pro up to $63-65. AI-powered replies are billed separately ($0.75 per resolution), a cost to watch if support volume is high.",
    verdict: {
      keepIf: ["Tu veux une boîte de réception qui ressemble à de l'email, pas un système de tickets complexe", "Ta petite équipe (jusqu'à 5) reste sous le plan gratuit"],
      avoidIf: ["Tu as une équipe de support nombreuse : le prix par utilisateur grimpe vite (jusqu'à 65$/mois chacun)", "Tu utilises beaucoup l'IA de réponse : le coût par résolution s'additionne"],
      threshold: "Excellent pour une petite équipe qui veut du support par email simple. Le coût par utilisateur devient un vrai sujet au-delà de 5-10 personnes.",
    },
    verdictEn: {
      keepIf: ["You want an inbox that feels like email, not a complex ticketing system", "Your small team (up to 5) stays within the free plan"],
      avoidIf: ["You have a large support team: per-user pricing climbs fast (up to $65/month each)", "You rely heavily on AI replies: the per-resolution cost adds up"],
      threshold: "Excellent for a small team that wants simple email-based support. Per-user cost becomes a real issue past 5-10 people.",
    },
    pros: ["Boîte de réception qui ressemble à de l'email, prise en main immédiate", "Plan gratuit utilisable jusqu'à 5 utilisateurs", "Base de connaissance (Docs) intégrée"],
    prosEn: ["Email-like inbox, immediate onboarding", "Usable free plan up to 5 users", "Integrated knowledge base (Docs)"],
    cons: ["Tarif par utilisateur qui grimpe vite (jusqu'à 65$/mois en Pro)", "IA Réponses facturée à part, au résultat (0,75$/résolution)", "Moins de fonctionnalités omnicanal que Crisp ou Intercom"],
    consEn: ["Per-user pricing that climbs fast (up to $65/month on Pro)", "AI Answers billed separately, per result ($0.75/resolution)", "Fewer omnichannel features than Crisp or Intercom"],
    useCases: ["Gérer le support client par email pour une petite équipe", "Centraliser une base de connaissance client (Docs)", "Ajouter un widget de support sur un site (Beacon)"],
    useCasesEn: ["Manage email-based customer support for a small team", "Centralize a customer knowledge base (Docs)", "Add a support widget to a website (Beacon)"],
    alternatives: ["intercom", "crisp", "zendesk"],
  },
  "eventbrite": {
    shortDescription: "Billetterie et gestion d'événements : événements gratuits illimités, 3,7% + 1,79$ par billet payant.",
    shortDescriptionEn: "Event ticketing and management: unlimited free events, 3.7% + $1.79 per paid ticket.",
    pricing: { free: "Publication d'événements gratuits illimitée, sans frais.", paid: "3,7% + 1,79$ par billet payant, plus 2,9% de frais de traitement de paiement. Plan Pro 15$ à 100$/mois pour plus de capacité email marketing (ne réduit pas les frais par billet)." },
    pricingEn: { free: "Unlimited free event publishing, no fees.", paid: "3.7% + $1.79 per paid ticket, plus 2.9% payment processing. Pro plan $15-$100/month for more email marketing capacity (doesn't reduce per-ticket fees)." },
    defaultMonthlyPrice: 0,
    longDescription: "Eventbrite reste la référence pour publier un événement rapidement, avec une vraie force de découverte (son moteur de recherche d'événements amène du trafic organique). Pour les événements gratuits, c'est sans frais et sans limite, ce qui en fait un bon choix par défaut pour une meetup ou un webinaire.\n\nDès qu'un billet est payant, les frais s'additionnent : 3,7% + 1,79$ par billet, plus 2,9% de frais de paiement. Sur un billet à 20$, ça représente environ 15% du prix, un taux d'autant plus élevé que le billet est bon marché (le montant fixe de 1,79$ pèse plus lourd sur un petit prix). Le plan Pro (15$ à 100$/mois) ajoute de la capacité d'email marketing mais ne réduit jamais ces frais par billet, contrairement à ce qu'on pourrait attendre d'un abonnement payant.",
    longDescriptionEn: "Eventbrite remains the reference for publishing an event quickly, with real discovery power (its event search engine drives organic traffic). For free events, it's fee-free and unlimited, making it a good default choice for a meetup or webinar.\n\nAs soon as a ticket is paid, fees add up: 3.7% + $1.79 per ticket, plus 2.9% payment processing. On a $20 ticket, that's about 15% of the price, an even higher rate the cheaper the ticket (the flat $1.79 weighs more on a small price). The Pro plan ($15-$100/month) adds email marketing capacity but never reduces these per-ticket fees, contrary to what you might expect from a paid subscription.",
    verdict: {
      keepIf: ["Tu organises des événements gratuits : aucun frais, publication illimitée", "Tu veux profiter de la découverte organique d'Eventbrite pour des billets payants ponctuels"],
      avoidIf: ["Tu vends beaucoup de billets payants à prix réduit : les frais (environ 10-15% par billet) rognent fortement la marge", "Tu cherches à réduire les frais via un abonnement : le plan Pro n'y change rien"],
      threshold: "Excellent et gratuit pour les événements gratuits. Pour du billet payant en volume, compare le coût réel des frais avec des alternatives à frais fixes.",
    },
    verdictEn: {
      keepIf: ["You organize free events: no fees, unlimited publishing", "You want to benefit from Eventbrite's organic discovery for occasional paid tickets"],
      avoidIf: ["You sell a lot of low-priced paid tickets: fees (roughly 10-15% per ticket) eat significantly into margin", "You're trying to cut fees via a subscription: the Pro plan doesn't change that"],
      threshold: "Excellent and free for free events. For paid tickets at volume, compare the real fee cost against flat-fee alternatives.",
    },
    pros: ["Événements gratuits illimités et sans frais", "Forte découverte organique (moteur de recherche d'événements)", "Référence connue, rassurante pour les participants"],
    prosEn: ["Unlimited and free for free events", "Strong organic discovery (event search engine)", "Well-known reference, reassuring for attendees"],
    cons: ["Frais élevés sur les billets payants (environ 10-15% selon le prix)", "Le plan Pro n'allège jamais les frais par billet", "Frais non remboursés sur événement annulé depuis 2026"],
    consEn: ["High fees on paid tickets (roughly 10-15% depending on price)", "The Pro plan never lowers per-ticket fees", "Fees no longer refunded on canceled events since 2026"],
    useCases: ["Publier un événement gratuit (meetup, webinaire) sans aucun frais", "Vendre des billets payants en profitant de la découverte organique", "Gérer les inscriptions et le check-in d'un événement"],
    useCasesEn: ["Publish a free event (meetup, webinar) with zero fees", "Sell paid tickets while benefiting from organic discovery", "Manage registrations and check-in for an event"],
    alternatives: [],
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
console.log(`Réécriture communication : ${n}/4 fiches | JSON OK`);
