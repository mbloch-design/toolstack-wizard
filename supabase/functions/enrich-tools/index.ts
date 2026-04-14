import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ToolEnrichment {
  long_description: string;
  pros: string[];
  cons: string[];
  verdict: { keepIf: string[]; avoidIf: string[]; threshold: string };
  use_cases: string[];
  pricing: { free: string; paid: string };
}

const ENRICHMENTS: Record<string, ToolEnrichment> = {
  // ─── FINANCE / NOTES DE FRAIS ───
  "moss": {
    long_description: "Moss centralise la gestion des dépenses d'entreprise avec des cartes physiques et virtuelles, des workflows d'approbation et une intégration comptable directe. Pour les freelances et petites équipes, c'est un moyen d'automatiser le suivi des frais sans tableur Excel. L'outil se distingue par la rapidité d'émission de cartes virtuelles et le contrôle granulaire des budgets par projet ou par personne.",
    pros: ["Cartes virtuelles illimitées avec plafonds personnalisables", "OCR automatique des reçus", "Intégration DATEV, Xero, QuickBooks", "Workflows d'approbation configurables"],
    cons: ["Prix élevé pour les solopreneurs", "Fonctionnalités avancées réservées aux plans supérieurs", "Disponibilité géographique limitée"],
    verdict: { keepIf: ["Équipe de 3+ personnes avec dépenses récurrentes", "Besoin de cartes virtuelles par projet"], avoidIf: ["Freelance solo avec peu de frais", "Budget serré"], threshold: "Rentable dès 10+ notes de frais par mois." },
    use_cases: ["Gérer les abonnements SaaS avec des cartes dédiées", "Suivre les dépenses d'équipe en temps réel", "Automatiser la réconciliation comptable"],
    pricing: { free: "Aucun plan gratuit", paid: "À partir de 9€/mois par utilisateur" },
  },
  "soldo": {
    long_description: "Soldo propose des cartes Mastercard prépayées pour contrôler les dépenses d'équipe. Chaque carte a un budget défini, et les dépenses sont catégorisées automatiquement. L'intégration comptable réduit le temps de rapprochement. C'est une alternative plus simple à Moss pour les petites structures qui veulent juste distribuer des budgets sans complexité.",
    pros: ["Interface simple et intuitive", "Catégorisation automatique des dépenses", "Cartes physiques et virtuelles", "Bon rapport qualité/prix"],
    cons: ["Moins de fonctionnalités que Moss ou Spendesk", "Support en anglais principalement", "Pas de gestion de paie intégrée"],
    verdict: { keepIf: ["Petite équipe (2-10) avec dépenses régulières", "Besoin de simplicité"], avoidIf: ["Freelance solo", "Besoin de fonctions RH avancées"], threshold: "Utile dès 5+ transactions mensuelles à suivre." },
    use_cases: ["Distribuer des budgets par département", "Éliminer les avances de frais", "Simplifier la comptabilité mensuelle"],
    pricing: { free: "Essai gratuit 30 jours", paid: "À partir de 6€/mois par utilisateur" },
  },
  "rydoo": {
    long_description: "Rydoo automatise les notes de frais avec la reconnaissance OCR des reçus, la conformité fiscale multi-pays et l'intégration directe avec les ERP. L'application mobile permet de scanner un reçu en 5 secondes. Pour les consultants qui voyagent, c'est un gain de temps considérable par rapport aux tableurs manuels.",
    pros: ["OCR puissant avec extraction automatique des montants", "Conformité TVA multi-pays européenne", "Application mobile excellente", "Intégration SAP, Oracle, NetSuite"],
    cons: ["Prix par utilisateur qui monte vite", "Interface desktop moins fluide que le mobile", "Overkill pour les indépendants sédentaires"],
    verdict: { keepIf: ["Déplacements professionnels fréquents", "Facturation multi-pays", "5+ notes de frais par mois"], avoidIf: ["Travail 100% remote sans déplacements", "Moins de 3 notes de frais par mois"], threshold: "Rentable dès 2+ déplacements professionnels par mois." },
    use_cases: ["Scanner les reçus restaurant et transport en déplacement", "Gérer les per diem automatiquement", "Exporter vers la comptabilité sans ressaisie"],
    pricing: { free: "Essai gratuit", paid: "À partir de 8€/mois par utilisateur" },
  },
  "payhawk": {
    long_description: "Payhawk combine cartes d'entreprise, notes de frais et gestion des factures fournisseurs dans une seule plateforme. C'est la solution la plus complète de cette catégorie, conçue pour les entreprises en croissance qui veulent un seul outil au lieu de trois. L'intégration ERP native et les workflows d'approbation multi-niveaux en font un choix solide pour les DAF exigeants.",
    pros: ["Tout-en-un : cartes, frais, factures fournisseurs", "Workflows d'approbation multi-niveaux", "Intégrations ERP natives (NetSuite, Xero, QBO)", "Gestion multi-devises"],
    cons: ["Prix premium justifié uniquement pour les PME 10+", "Courbe d'apprentissage pour la configuration initiale", "Trop complet pour un usage simple"],
    verdict: { keepIf: ["Équipe 10+ avec processus financiers complexes", "Besoin de consolider cartes + frais + factures"], avoidIf: ["Freelance ou micro-équipe", "Besoin uniquement de notes de frais"], threshold: "Rentable pour les équipes de 10+ personnes avec des flux financiers multiples." },
    use_cases: ["Centraliser toute la gestion des dépenses", "Automatiser les approbations de factures fournisseurs", "Gérer les dépenses internationales"],
    pricing: { free: "Aucun plan gratuit", paid: "À partir de 12€/mois par utilisateur" },
  },

  // ─── FINANCE / RH & PAIE ───
  "silae": {
    long_description: "Silae est le logiciel de paie de référence en France, utilisé par des milliers de cabinets comptables et PME. Il gère la complexité du droit social français (conventions collectives, DSN, prélèvement à la source) avec une fiabilité reconnue. Pour les entreprises françaises, c'est souvent le choix par défaut recommandé par leur expert-comptable.",
    pros: ["Référence du marché français de la paie", "Gestion complète des conventions collectives", "DSN automatisée et conforme", "Écosystème d'intégrations comptables"],
    cons: ["Interface datée par rapport aux nouveaux entrants", "Prix opaque (sur devis)", "Nécessite souvent un expert-comptable pour la configuration"],
    verdict: { keepIf: ["Entreprise française avec 5+ salariés", "Conventions collectives complexes", "Expert-comptable qui utilise déjà Silae"], avoidIf: ["Freelance sans salarié", "Micro-entreprise", "Préférence pour une interface moderne"], threshold: "Indispensable dès le premier salarié en CDI si votre comptable le recommande." },
    use_cases: ["Éditer les bulletins de paie conformes", "Générer la DSN mensuelle", "Gérer les absences et congés payés"],
    pricing: { free: "Aucun plan gratuit", paid: "À partir de 35€/mois (sur devis)" },
  },
  "sage-paie": {
    long_description: "Sage Paie est une solution de gestion de paie complète pour les PME françaises. Elle couvre l'ensemble du cycle de paie : édition des bulletins, déclarations sociales, gestion des absences et suivi des charges. L'intégration avec l'écosystème Sage (comptabilité, gestion commerciale) en fait un choix cohérent pour les entreprises déjà équipées.",
    pros: ["Écosystème Sage complet (compta + paie + gestion)", "Conformité française mise à jour automatiquement", "Support téléphonique en français", "Historique et fiabilité de la marque"],
    cons: ["Interface vieillissante", "Prix élevé pour les petites structures", "Déploiement initial complexe", "Cloud moins abouti que les concurrents récents"],
    verdict: { keepIf: ["Déjà dans l'écosystème Sage", "PME 10+ salariés", "Besoin d'un support téléphonique"], avoidIf: ["Startup cherchant une solution moderne", "Freelance", "Budget limité"], threshold: "Justifié pour les PME 10+ salariés déjà dans l'écosystème Sage." },
    use_cases: ["Produire les bulletins de paie mensuels", "Télédéclarer les charges sociales", "Suivre la masse salariale"],
    pricing: { free: "Aucun plan gratuit", paid: "À partir de 40€/mois" },
  },
  "kelio": {
    long_description: "Kelio (anciennement Bodet Software) gère le temps de travail, la planification et le contrôle d'accès. C'est un outil RH orienté terrain : pointeuse, planning d'équipe, suivi des heures. Pour les structures avec des horaires variables ou du travail posté, Kelio est un gain d'efficacité important par rapport au suivi manuel.",
    pros: ["Pointeuse intégrée (physique ou mobile)", "Planification des équipes intuitive", "Gestion des absences et congés", "Adapté au travail posté et horaires variables"],
    cons: ["Interface fonctionnelle mais peu moderne", "Orienté moyennes et grandes entreprises", "Pas de gestion de paie intégrée"],
    verdict: { keepIf: ["Équipe avec horaires variables", "Besoin de pointeuse", "Gestion de planning d'équipe"], avoidIf: ["Équipe 100% remote", "Freelance", "Horaires fixes simples"], threshold: "Utile dès 5+ personnes avec des horaires à gérer." },
    use_cases: ["Suivre les heures travaillées automatiquement", "Planifier les rotations d'équipe", "Gérer les demandes de congés"],
    pricing: { free: "Aucun plan gratuit", paid: "À partir de 8€/mois par utilisateur" },
  },
  "workday": {
    long_description: "Workday est la plateforme RH et finance cloud de référence pour les grandes entreprises. Elle couvre le HCM (gestion du capital humain), la planification financière, la paie et l'analytics RH. Pour les organisations de 200+ personnes, c'est un investissement structurant. Pour les petites structures, c'est surdimensionné et trop coûteux.",
    pros: ["Plateforme RH la plus complète du marché", "Analytics et reporting avancés", "Gestion des talents et performance", "Architecture cloud native"],
    cons: ["Prix très élevé (enterprise)", "Implémentation longue et complexe", "Surdimensionné pour les PME", "Nécessite un intégrateur spécialisé"],
    verdict: { keepIf: ["Organisation 200+ personnes", "Besoin d'analytics RH avancés", "Budget RH conséquent"], avoidIf: ["PME < 50 personnes", "Freelance", "Budget limité"], threshold: "Réservé aux organisations de 200+ personnes avec un budget RH structuré." },
    use_cases: ["Centraliser toute la gestion RH", "Analyser la performance et les talents", "Planifier la masse salariale"],
    pricing: { free: "Aucun plan gratuit", paid: "Sur devis (à partir de 99$/utilisateur/mois)" },
  },

  // ─── ORGANISATION / CONFORMITÉ LÉGALE ───
  "legifrance-pro": {
    long_description: "Legifrance Pro offre un accès structuré aux textes juridiques français : codes, lois, décrets, jurisprudence. Pour les freelances et dirigeants, c'est une ressource gratuite et officielle pour vérifier un point de droit sans passer par un avocat pour chaque question. L'outil est maintenu par l'État français.",
    pros: ["Gratuit et officiel", "Base de données juridique exhaustive", "Mise à jour en temps réel", "Recherche avancée par thème et date"],
    cons: ["Interface austère et technique", "Pas de vulgarisation juridique", "Nécessite des connaissances juridiques de base", "Pas de conseil personnalisé"],
    verdict: { keepIf: ["Besoin de vérifier des textes de loi", "Veille juridique régulière", "Complément à un conseil juridique"], avoidIf: ["Besoin de conseil juridique personnalisé", "Aucune connaissance juridique"], threshold: "Gratuit — à bookmarker pour toute vérification juridique ponctuelle." },
    use_cases: ["Vérifier une clause contractuelle", "Rechercher une convention collective", "Suivre les évolutions législatives"],
    pricing: { free: "Entièrement gratuit", paid: "N/A" },
  },
  "wolters-kluwer": {
    long_description: "Wolters Kluwer propose des solutions de veille juridique, fiscale et comptable pour les professionnels du droit et de la finance. Avec des bases documentaires enrichies, des outils de conformité et des analyses d'experts, c'est un investissement pour ceux qui gèrent la conformité réglementaire au quotidien.",
    pros: ["Bases documentaires très complètes", "Analyses et commentaires d'experts", "Outils de conformité réglementaire", "Mise à jour continue"],
    cons: ["Prix élevé (abonnement professionnel)", "Complexe pour les non-juristes", "Interface parfois dense"],
    verdict: { keepIf: ["Gestion de conformité réglementaire", "Cabinet comptable ou juridique", "Veille fiscale obligatoire"], avoidIf: ["Freelance sans obligation réglementaire complexe", "Budget limité"], threshold: "Justifié pour les professionnels avec des obligations réglementaires continues." },
    use_cases: ["Veille fiscale et sociale", "Conformité RGPD et réglementaire", "Documentation juridique approfondie"],
    pricing: { free: "Aucun plan gratuit", paid: "À partir de 49€/mois" },
  },
  "legalstart": {
    long_description: "Legalstart simplifie les démarches juridiques pour les entrepreneurs : création d'entreprise, rédaction de contrats, modification de statuts, dépôt de marque. L'outil guide pas à pas avec des formulaires intelligents et des documents générés automatiquement. C'est le choix pragmatique pour les freelances qui veulent gérer leur juridique sans avocat pour les actes courants.",
    pros: ["Formulaires guidés pas à pas", "Documents juridiques conformes", "Prix transparent et fixe", "Support juridique par chat"],
    cons: ["Documents standardisés (pas sur-mesure)", "Pas adapté aux cas complexes", "Coûts additionnels pour les modifications", "Support généraliste"],
    verdict: { keepIf: ["Création ou modification de structure juridique", "Rédaction de contrats standards", "Budget limité pour le juridique"], avoidIf: ["Cas juridiques complexes nécessitant un avocat", "Grande entreprise avec service juridique"], threshold: "Rentable dès le premier acte juridique (vs honoraires avocat)." },
    use_cases: ["Créer une SASU ou EURL en ligne", "Rédiger des CGV ou contrats de prestation", "Déposer une marque à l'INPI"],
    pricing: { free: "Estimation gratuite", paid: "À partir de 15€/mois ou actes à l'unité" },
  },
  "captaindoc": {
    long_description: "Captaindoc automatise la création de documents juridiques et contractuels à partir de modèles. L'outil permet de générer des contrats, avenants et documents légaux personnalisés en quelques clics. Pour les structures qui produisent régulièrement des documents similaires, c'est un gain de temps considérable.",
    pros: ["Modèles de documents personnalisables", "Génération automatisée et rapide", "Archivage et suivi des versions", "Interface intuitive"],
    cons: ["Catalogue de modèles à enrichir", "Pas de conseil juridique intégré", "Moins connu que les concurrents"],
    verdict: { keepIf: ["Production régulière de contrats similaires", "Besoin d'automatiser la documentation", "Petite structure sans service juridique"], avoidIf: ["Cas juridiques sur-mesure", "Volume faible de documents"], threshold: "Utile dès 5+ documents contractuels par mois." },
    use_cases: ["Générer des contrats de prestation personnalisés", "Automatiser les avenants", "Archiver les documents signés"],
    pricing: { free: "Essai gratuit", paid: "À partir de 19€/mois" },
  },

  // ─── ORGANISATION / SIGNATURE ÉLECTRONIQUE ───
  "signrequest": {
    long_description: "SignRequest (racheté par Box) offre une signature électronique simple et accessible. L'outil se concentre sur l'essentiel : envoyer un document, le faire signer, archiver. Pas de fioritures, pas de complexity inutile. Pour les freelances et petites équipes qui signent quelques documents par mois, c'est une alternative moins chère que DocuSign.",
    pros: ["Interface très simple", "Prix compétitif", "API disponible", "Intégration Box native"],
    cons: ["Fonctionnalités limitées vs DocuSign", "Signature qualifiée non disponible partout", "Racheté par Box (évolution incertaine)"],
    verdict: { keepIf: ["Volume modéré de signatures (5-20/mois)", "Budget limité", "Besoin de simplicité"], avoidIf: ["Volume élevé de signatures", "Besoin de signature qualifiée eIDAS"], threshold: "Économique dès 3+ signatures par mois vs envoyer des PDF manuellement." },
    use_cases: ["Signer des contrats de prestation", "Faire signer des devis clients", "Archiver les documents signés"],
    pricing: { free: "Plan gratuit (1 expéditeur)", paid: "À partir de 7€/mois" },
  },
  "connective": {
    long_description: "Connective est spécialisé dans la signature électronique et l'identité numérique avec un focus sur la conformité européenne (eIDAS). L'outil propose des signatures simples, avancées et qualifiées, ce qui le rend adapté aux secteurs réglementés. Pour les entreprises qui traitent avec des administrations ou des banques, c'est un avantage de conformité.",
    pros: ["Signatures qualifiées eIDAS", "Conformité réglementaire européenne", "Vérification d'identité intégrée", "Adapté aux secteurs réglementés"],
    cons: ["Prix plus élevé que les alternatives simples", "Interface moins intuitive que DocuSign", "Overkill pour des signatures simples"],
    verdict: { keepIf: ["Besoin de signature qualifiée eIDAS", "Secteur réglementé (finance, santé, public)", "Clients européens exigeants"], avoidIf: ["Signatures simples entre freelances", "Budget limité", "Pas de contrainte réglementaire"], threshold: "Nécessaire uniquement si la signature qualifiée est exigée par vos clients ou votre secteur." },
    use_cases: ["Signer des contrats avec valeur légale renforcée", "Vérifier l'identité des signataires", "Conformité dans les marchés publics"],
    pricing: { free: "Aucun plan gratuit", paid: "À partir de 15€/mois" },
  },
  "skribble": {
    long_description: "Skribble est une solution suisse de signature électronique qui propose les trois niveaux eIDAS : simple, avancée et qualifiée. L'outil se distingue par sa facilité d'usage et sa conformité suisse et européenne. Pour les entreprises qui travaillent entre la Suisse et l'UE, c'est un choix naturel.",
    pros: ["3 niveaux de signature (SES, AES, QES)", "Conformité suisse et européenne", "Interface moderne et simple", "Intégrations API et no-code"],
    cons: ["Prix élevé pour la signature qualifiée", "Moins d'intégrations que DocuSign", "Marché principal Suisse/DACH"],
    verdict: { keepIf: ["Activité en Suisse ou avec des clients suisses", "Besoin de signature qualifiée", "Conformité européenne requise"], avoidIf: ["Marché uniquement français", "Volume faible", "Budget serré"], threshold: "Pertinent si vous traitez avec la Suisse ou avez besoin de QES." },
    use_cases: ["Signer des contrats transfrontaliers CH/UE", "Obtenir des signatures qualifiées sans déplacement", "Intégrer la signature dans un workflow existant"],
    pricing: { free: "Essai gratuit", paid: "À partir de 12€/mois" },
  },

  // ─── PROJECT MANAGEMENT ───
  "coda": {
    long_description: "Coda fusionne document, tableur et application en un seul outil. Contrairement à Notion qui reste centré sur la documentation, Coda permet de construire de véritables applications métier sans code : CRM personnalisé, suivi de projet, automatisations internes. C'est l'outil pour ceux qui trouvent que les tableurs manquent de logique et que les outils dédiés manquent de flexibilité.",
    pros: ["Formules puissantes façon tableur dans un doc", "Packs d'intégration (Gmail, Slack, Jira...)", "Automatisations intégrées sans Zapier", "Templates communautaires riches"],
    cons: ["Courbe d'apprentissage significative", "Performance qui baisse sur les gros docs", "Moins d'écosystème que Notion", "Mobile moins abouti"],
    verdict: { keepIf: ["Besoin de logique métier dans les documents", "Construction d'outils internes sans code", "Automatisations complexes"], avoidIf: ["Usage simple de prise de notes", "Équipe non technique", "Besoin d'un wiki d'entreprise"], threshold: "Justifié si vous construisez des workflows personnalisés au-delà de la simple documentation." },
    use_cases: ["Construire un CRM personnalisé", "Automatiser des rapports hebdomadaires", "Créer un tracker de projets avec formules"],
    pricing: { free: "Plan gratuit généreux", paid: "À partir de 10$/mois par utilisateur" },
  },
  "microsoft-project": {
    long_description: "Microsoft Project est l'outil historique de gestion de projet, spécialisé dans la planification avancée avec diagrammes de Gantt, gestion des ressources et suivi des jalons. Il s'intègre nativement à l'écosystème Microsoft 365. Pour les chefs de projet classiques habitués à la méthode en cascade, c'est l'outil de référence. Pour les équipes agiles, il est souvent remplacé par des alternatives plus souples.",
    pros: ["Diagrammes de Gantt professionnels", "Gestion des ressources et capacités", "Intégration Microsoft 365 native", "Suivi des coûts de projet"],
    cons: ["Interface complexe et datée", "Peu adapté aux méthodes agiles", "Prix élevé", "Courbe d'apprentissage raide"],
    verdict: { keepIf: ["Gestion de projet en cascade ou hybride", "Déjà dans l'écosystème Microsoft", "Projets complexes avec dépendances"], avoidIf: ["Équipe agile/scrum", "Freelance solo", "Budget limité"], threshold: "Justifié pour les projets complexes avec planification de ressources et dépendances multiples." },
    use_cases: ["Planifier des projets avec dépendances", "Gérer l'allocation des ressources", "Suivre l'avancement avec diagrammes de Gantt"],
    pricing: { free: "Aucun plan gratuit", paid: "À partir de 25€/mois par utilisateur" },
  },

  // ─── ORGANISATION / PORTAILS CLIENTS ───
  "suitedash": {
    long_description: "SuiteDash est un portail client tout-en-un pour agences et freelances : CRM, facturation, gestion de projet, partage de fichiers et portail client brandé, le tout dans une seule plateforme. L'avantage principal est d'éviter de jongler entre 5 outils différents. Le compromis est que chaque fonction est moins poussée qu'un outil spécialisé.",
    pros: ["Tout-en-un : CRM + facturation + projet + portail", "Portail client personnalisable (white-label)", "Prix fixe (pas par utilisateur)", "Automatisations intégrées"],
    cons: ["Chaque module moins profond qu'un outil dédié", "Interface parfois chargée", "Courbe d'apprentissage", "Support anglophone uniquement"],
    verdict: { keepIf: ["Agence ou consultant avec 5+ clients actifs", "Besoin d'un portail client brandé", "Envie de consolider plusieurs outils"], avoidIf: ["Besoin d'un CRM puissant (préférer HubSpot)", "Freelance avec 1-2 clients", "Besoin d'outils best-of-breed"], threshold: "Rentable si vous remplacez 3+ outils distincts par SuiteDash." },
    use_cases: ["Offrir un portail client professionnel", "Centraliser la facturation et le suivi projet", "Automatiser l'onboarding client"],
    pricing: { free: "Essai gratuit 14 jours", paid: "À partir de 19$/mois (pas par utilisateur)" },
  },
  "honeybook": {
    long_description: "HoneyBook gère le cycle de vie client pour les créatifs et consultants : du premier contact à la facturation, en passant par les contrats et le suivi de projet. L'interface est pensée pour les non-techniciens qui veulent un workflow client fluide sans assembler 5 outils. Très populaire aux États-Unis chez les photographes, designers et planificateurs d'événements.",
    pros: ["Workflow client de bout en bout", "Contrats et paiements intégrés", "Templates professionnels", "Interface moderne et intuitive"],
    cons: ["Principalement anglophone", "Paiements en USD uniquement (limitations €)", "Moins flexible que des outils séparés", "Pas de plan gratuit"],
    verdict: { keepIf: ["Créatif ou consultant avec flux client récurrent", "Besoin de contrats + paiements intégrés", "Clients anglophones ou internationaux"], avoidIf: ["Marché exclusivement français", "Besoin d'un CRM puissant", "Budget très serré"], threshold: "Rentable dès 3+ projets clients par mois." },
    use_cases: ["Envoyer des propositions avec paiement intégré", "Automatiser le suivi client", "Gérer les contrats de prestation"],
    pricing: { free: "Essai gratuit 7 jours", paid: "À partir de 16$/mois" },
  },
  "bloom-crm": {
    long_description: "Bloom est un CRM conçu pour les créatifs indépendants : photographes, designers, vidéastes. Il combine gestion de leads, propositions, contrats, facturation et galeries clients dans une interface épurée. Moins complet que HoneyBook mais plus accessible en prix et plus simple à prendre en main.",
    pros: ["Conçu spécifiquement pour les créatifs", "Galeries clients intégrées", "Prix accessible", "Interface propre et moderne"],
    cons: ["Fonctionnalités limitées vs HoneyBook", "Écosystème d'intégrations restreint", "Communauté plus petite", "Principalement anglophone"],
    verdict: { keepIf: ["Photographe ou vidéaste freelance", "Besoin de galeries clients", "Budget limité"], avoidIf: ["Consultant non-créatif", "Besoin d'un CRM complet", "Volume élevé de clients"], threshold: "Bon choix pour les créatifs visuels avec 2-10 clients actifs." },
    use_cases: ["Envoyer des propositions à des clients potentiels", "Partager des galeries photos avec les clients", "Facturer directement après livraison"],
    pricing: { free: "Plan gratuit limité", paid: "À partir de 13$/mois" },
  },

  // ─── AUTOMATION / PROSPECTION ───
  "phantombuster": {
    long_description: "PhantomBuster automatise l'extraction de données et les actions sur LinkedIn, Instagram, Twitter et d'autres plateformes. C'est l'outil des growth hackers : scraper des profils LinkedIn, envoyer des connexions automatiques, enrichir des listes de prospects. Puissant mais à utiliser avec discernement pour rester dans les limites des plateformes.",
    pros: ["Extraction de données LinkedIn puissante", "100+ automations prêtes à l'emploi", "Enrichissement de données automatique", "API et webhooks"],
    cons: ["Prix élevé pour les indépendants", "Risque de ban LinkedIn si mal configuré", "Courbe d'apprentissage technique", "Zone grise légale (RGPD)"],
    verdict: { keepIf: ["Prospection B2B active sur LinkedIn", "Besoin d'enrichir des listes de prospects", "Approche growth hacking assumée"], avoidIf: ["Pas de prospection active", "Aversion au risque (ban LinkedIn)", "Budget < 50€/mois pour les outils"], threshold: "Rentable si vous générez 5+ leads qualifiés par mois grâce à l'outil." },
    use_cases: ["Scraper des listes de prospects LinkedIn", "Automatiser les demandes de connexion", "Enrichir des emails à partir de profils"],
    pricing: { free: "Essai gratuit", paid: "À partir de 56$/mois" },
  },
  "lemlist": {
    long_description: "Lemlist est une plateforme d'outreach email personnalisé avec séquences multi-canal (email + LinkedIn). L'outil se distingue par la personnalisation avancée des emails (images dynamiques, variables) et le suivi des performances. Pour les consultants et agences qui font de la prospection active, c'est un outil mature et bien pensé.",
    pros: ["Personnalisation avancée des emails", "Séquences multi-canal (email + LinkedIn)", "Détection de warmup intégrée", "Analytics détaillés par campagne"],
    cons: ["Prix significatif pour les solopreneurs", "Nécessite un volume minimum pour être rentable", "Configuration initiale demandant du temps", "Délivrabilité à surveiller"],
    verdict: { keepIf: ["Prospection outbound active", "Volume 100+ emails/mois", "Besoin de séquences multi-canal"], avoidIf: ["Pas de prospection email", "Volume < 50 emails/mois", "Inbound uniquement"], threshold: "Rentable dès 100+ emails de prospection par mois avec un taux de conversion de 2%+." },
    use_cases: ["Envoyer des séquences de prospection personnalisées", "Combiner outreach email et LinkedIn", "A/B tester des approches commerciales"],
    pricing: { free: "Essai gratuit 14 jours", paid: "À partir de 39$/mois" },
  },
  "la-growth-machine": {
    long_description: "La Growth Machine (LGM) automatise la prospection sur LinkedIn, Email et Twitter simultanément. L'outil français se distingue par son approche multi-canal séquentielle : si le prospect ne répond pas sur LinkedIn, il est relancé par email, puis par Twitter. L'enrichissement de données est intégré.",
    pros: ["Multi-canal natif (LinkedIn + Email + Twitter)", "Enrichissement de données intégré", "Éditeur de séquences visuel", "Entreprise française (support FR)"],
    cons: ["Prix élevé (60€/mois minimum)", "Nécessite un Sales Navigator LinkedIn", "Complexe pour les débutants", "Risques LinkedIn si mal paramétré"],
    verdict: { keepIf: ["Prospection multi-canal active", "Budget outbound > 100€/mois", "Marché B2B avec cycle de vente long"], avoidIf: ["Prospection occasionnelle", "Budget limité", "Pas de Sales Navigator"], threshold: "Rentable si vous signez 1+ client par mois grâce aux séquences." },
    use_cases: ["Automatiser la prospection LinkedIn + Email", "Enrichir des contacts depuis LinkedIn", "Créer des séquences multi-canal conditionnelles"],
    pricing: { free: "Essai gratuit 14 jours", paid: "À partir de 60€/mois" },
  },
  "waalaxy": {
    long_description: "Waalaxy automatise la prospection LinkedIn avec une approche plus accessible que PhantomBuster. L'outil propose des séquences d'actions (visite de profil, connexion, message) et un CRM intégré pour suivre les prospects. C'est le choix populaire en France pour la prospection LinkedIn, avec un bon équilibre entre simplicité et puissance.",
    pros: ["Interface intuitive (pas besoin d'être technique)", "CRM de prospection intégré", "Séquences LinkedIn + Email", "Communauté française active"],
    cons: ["Limité à LinkedIn principalement", "Extension Chrome (dépendance navigateur)", "Quotas LinkedIn à respecter", "Fonctionnalités email basiques vs Lemlist"],
    verdict: { keepIf: ["Prospection LinkedIn active", "Besoin d'un outil simple sans courbe d'apprentissage", "Marché français B2B"], avoidIf: ["Pas de prospection LinkedIn", "Besoin d'outreach email avancé", "Aversion aux outils d'automatisation LinkedIn"], threshold: "Utile dès 20+ connexions LinkedIn par semaine." },
    use_cases: ["Automatiser les demandes de connexion LinkedIn", "Envoyer des séquences de messages personnalisés", "Suivre les prospects dans un CRM simple"],
    pricing: { free: "Plan gratuit (quotas limités)", paid: "À partir de 40€/mois" },
  },

  // ─── ORGANISATION / PROPOSITIONS COMMERCIALES ───
  "proposify": {
    long_description: "Proposify permet de créer des propositions commerciales professionnelles avec suivi en temps réel. L'outil offre des templates personnalisables, la signature électronique intégrée et des analytics sur l'engagement du client (temps passé par section). Pour les consultants et agences qui envoient 5+ devis par mois, c'est un upgrade significatif par rapport aux PDF statiques.",
    pros: ["Templates professionnels personnalisables", "Suivi en temps réel (qui a lu quoi)", "Signature électronique intégrée", "Analytics d'engagement par section"],
    cons: ["Prix élevé pour les solopreneurs", "Courbe d'apprentissage pour les templates", "Intégrations CRM limitées sur le plan basique"],
    verdict: { keepIf: ["5+ propositions par mois", "Cycle de vente B2B", "Besoin de suivi d'engagement"], avoidIf: ["1-2 devis par mois", "Devis simples en 1 page", "Budget limité"], threshold: "Rentable dès 5+ propositions commerciales par mois." },
    use_cases: ["Créer des propositions commerciales interactives", "Suivre l'engagement des prospects sur les devis", "Faire signer les propositions directement"],
    pricing: { free: "Essai gratuit 14 jours", paid: "À partir de 35$/mois" },
  },
  "better-proposals": {
    long_description: "Better Proposals propose une alternative plus accessible à Proposify avec des templates web modernes. Les propositions sont des pages web (pas des PDF) ce qui permet un suivi précis de la lecture et une expérience mobile optimale. L'outil inclut la signature et le paiement intégrés.",
    pros: ["Propositions web (pas PDF) — meilleure expérience", "Paiement intégré (Stripe, PayPal)", "Templates modernes et responsive", "Prix plus accessible que Proposify"],
    cons: ["Moins de personnalisation que Proposify", "Pas de mode hors-ligne", "Bibliothèque de templates plus petite"],
    verdict: { keepIf: ["Propositions clients régulières", "Besoin de paiement intégré", "Clients qui consultent sur mobile"], avoidIf: ["Besoin de propositions PDF traditionnelles", "1-2 devis par mois", "Grands comptes exigeants"], threshold: "Bon choix dès 3+ propositions par mois avec des clients modernes." },
    use_cases: ["Envoyer des propositions web interactives", "Collecter les paiements à la signature", "Suivre les taux d'ouverture et conversion"],
    pricing: { free: "Essai gratuit 14 jours", paid: "À partir de 19$/mois" },
  },
  "nusii": {
    long_description: "Nusii est un outil de propositions commerciales conçu pour les agences et consultants. Il se distingue par sa simplicité et son focus sur l'essentiel : créer, envoyer et suivre des propositions. Pas de fonctionnalités superflues. L'outil est apprécié pour son design épuré et sa rapidité de prise en main.",
    pros: ["Interface épurée et rapide", "Focus sur l'essentiel (pas de bloat)", "Notifications en temps réel", "Templates réutilisables"],
    cons: ["Moins de fonctionnalités que Proposify", "Pas de signature électronique native", "Communauté plus petite", "Intégrations limitées"],
    verdict: { keepIf: ["Besoin d'un outil simple pour les propositions", "Agence ou consultant", "Préférence pour la simplicité"], avoidIf: ["Besoin de signature intégrée", "Fonctionnalités avancées requises", "Grande équipe commerciale"], threshold: "Bon choix pour les agences qui veulent un outil sans complexité." },
    use_cases: ["Rédiger des propositions rapidement", "Suivre les propositions envoyées", "Réutiliser des templates de propositions"],
    pricing: { free: "Essai gratuit 15 jours", paid: "À partir de 29$/mois" },
  },
  "loopio": {
    long_description: "Loopio automatise les réponses aux appels d'offres (RFP) et questionnaires de sécurité. L'outil maintient une bibliothèque de réponses réutilisables et utilise l'IA pour suggérer les meilleures réponses. Pour les entreprises qui répondent régulièrement à des RFP, c'est un gain de temps de 50-70% par réponse.",
    pros: ["Bibliothèque de réponses centralisée", "IA pour suggérer les meilleures réponses", "Collaboration d'équipe sur les réponses", "Analytics sur les taux de succès"],
    cons: ["Prix enterprise élevé", "Surdimensionné pour les freelances", "Implémentation initiale chronophage", "Principalement anglophone"],
    verdict: { keepIf: ["Réponses régulières à des RFP/appels d'offres", "Équipe qui collabore sur les réponses", "Volume 5+ RFP par trimestre"], avoidIf: ["Freelance solo", "Pas de réponses à des appels d'offres", "Budget limité"], threshold: "Rentable dès 3+ RFP par trimestre." },
    use_cases: ["Répondre rapidement aux appels d'offres", "Maintenir une base de réponses à jour", "Collaborer entre experts sur les RFP"],
    pricing: { free: "Aucun plan gratuit", paid: "Sur devis (à partir de 50$/mois)" },
  },

  // ─── ORGANISATION / KNOWLEDGE MANAGEMENT ───
  "roam-research": {
    long_description: "Roam Research a popularisé les notes en réseau avec liens bidirectionnels. Chaque note peut référencer n'importe quelle autre, créant un graphe de connaissances personnel. Pour les consultants, chercheurs et penseurs qui connectent des idées entre elles, c'est un outil transformateur. Pour ceux qui veulent juste prendre des notes, c'est overkill.",
    pros: ["Liens bidirectionnels natifs", "Graphe de connaissances visuel", "Outliner puissant", "Communauté intellectuelle active"],
    cons: ["Courbe d'apprentissage significative", "Interface minimaliste (pas pour tous)", "Prix élevé pour un outil de notes", "Pas d'application mobile native"],
    verdict: { keepIf: ["Prise de notes intensive (recherche, consulting)", "Besoin de connecter des idées entre projets", "Pensée non-linéaire"], avoidIf: ["Notes simples et linéaires", "Besoin d'une interface visuelle", "Budget limité"], threshold: "Justifié si vous prenez 30+ notes par semaine et avez besoin de les relier." },
    use_cases: ["Construire une base de connaissances personnelle", "Connecter des idées entre projets et clients", "Prendre des notes de recherche structurées"],
    pricing: { free: "Aucun plan gratuit", paid: "15$/mois" },
  },
  "logseq": {
    long_description: "Logseq est l'alternative open-source à Roam Research. Il offre les mêmes fonctionnalités de notes en réseau (liens bidirectionnels, graphe de connaissances, outliner) mais avec un stockage local en Markdown. Pour ceux qui veulent la puissance de Roam sans le prix et avec le contrôle total de leurs données, c'est le choix évident.",
    pros: ["Gratuit et open-source", "Stockage local en Markdown", "Liens bidirectionnels et graphe", "Plugins communautaires riches", "Contrôle total des données"],
    cons: ["Performance parfois lente sur les gros graphes", "Synchronisation multi-device à configurer", "Interface moins polie que Notion", "Courbe d'apprentissage"],
    verdict: { keepIf: ["Besoin de notes en réseau sans abonnement", "Souveraineté des données importante", "Profil technique à l'aise avec Markdown"], avoidIf: ["Besoin de collaboration d'équipe", "Préférence pour le cloud natif", "Interface visuelle requise"], threshold: "Gratuit — à essayer si Roam Research vous intéresse mais pas son prix." },
    use_cases: ["Construire un second cerveau local", "Prendre des notes de réunion liées entre elles", "Organiser des projets de recherche"],
    pricing: { free: "Entièrement gratuit (open-source)", paid: "Sync cloud optionnel à 5$/mois" },
  },
  "reflect-notes": {
    long_description: "Reflect combine la prise de notes en réseau avec l'IA pour créer un assistant de réflexion personnel. L'outil transcrit les notes vocales, génère des résumés et suggère des connexions entre vos idées. C'est un Roam Research plus accessible avec une couche IA qui ajoute de la valeur au quotidien.",
    pros: ["IA intégrée pour résumer et connecter", "Transcription vocale", "Interface moderne et épurée", "Synchronisation rapide multi-device"],
    cons: ["Prix pour un outil de notes", "Moins de personnalisation que Roam/Logseq", "Écosystème de plugins limité", "Dépendance au cloud"],
    verdict: { keepIf: ["Besoin d'IA dans la prise de notes", "Notes vocales fréquentes", "Interface moderne importante"], avoidIf: ["Souveraineté des données requise", "Budget serré", "Préférence pour l'open-source"], threshold: "Intéressant si l'IA et la voix changent votre workflow de prise de notes." },
    use_cases: ["Prendre des notes vocales transcrites automatiquement", "Retrouver des idées grâce à l'IA", "Résumer des réunions rapidement"],
    pricing: { free: "Essai gratuit", paid: "10$/mois" },
  },
  "heptabase": {
    long_description: "Heptabase organise la connaissance visuellement sur des tableaux blancs infinis. Contrairement à Miro (collaboration), Heptabase est pensé pour la réflexion individuelle : organiser des idées, structurer un cours, planifier un projet complexe. C'est le croisement entre un outil de mind mapping et un PKM.",
    pros: ["Organisation visuelle intuitive", "Cartes et tableaux blancs connectés", "Idéal pour la pensée spatiale", "Notes Markdown complètes"],
    cons: ["Moins adapté au travail collaboratif", "Communauté encore petite", "Pas d'API publique", "Mobile limité"],
    verdict: { keepIf: ["Pensée visuelle et spatiale", "Organisation de projets complexes", "Apprentissage et recherche"], avoidIf: ["Besoin de collaboration d'équipe", "Notes simples linéaires", "Mobile-first"], threshold: "Utile si la pensée visuelle est votre mode de réflexion principal." },
    use_cases: ["Structurer un projet complexe visuellement", "Organiser des notes de recherche spatiales", "Planifier un cours ou une formation"],
    pricing: { free: "Essai gratuit 7 jours", paid: "12$/mois" },
  },

  // ─── CREATION / IA VOIX ───
  "podcastle": {
    long_description: "Podcastle est un studio de podcast tout-en-un : enregistrement, édition, transcription et publication. L'outil utilise l'IA pour améliorer la qualité audio, transcrire automatiquement et même générer des voix synthétiques. Pour les créateurs de contenu audio qui veulent un workflow simplifié, c'est une alternative plus accessible que Descript.",
    pros: ["Enregistrement et édition intégrés", "Transcription IA automatique", "Amélioration audio par IA", "Interface intuitive pour débutants"],
    cons: ["Moins puissant que Descript pour l'édition vidéo", "Voix synthétiques de qualité variable", "Stockage limité sur les plans basiques", "Moins d'intégrations"],
    verdict: { keepIf: ["Production de podcasts régulière", "Besoin d'un outil simple tout-en-un", "Budget modéré"], avoidIf: ["Production vidéo + audio (préférer Descript)", "Besoin d'édition audio professionnelle (Audition)", "Volume très faible"], threshold: "Utile dès 2+ épisodes de podcast par mois." },
    use_cases: ["Enregistrer et éditer des podcasts", "Transcrire des épisodes automatiquement", "Améliorer la qualité audio des enregistrements"],
    pricing: { free: "Plan gratuit (3h/mois)", paid: "À partir de 12$/mois" },
  },
  "cleanvoice": {
    long_description: "Cleanvoice nettoie automatiquement les fichiers audio par IA : suppression des euh/ah, des silences morts, du bruit de fond et des clics de bouche. L'outil est spécialisé dans le post-traitement audio et fonctionne en batch. Pour les podcasteurs et créateurs qui passent des heures à nettoyer leur audio manuellement, c'est un gain de temps direct.",
    pros: ["Nettoyage audio automatique par IA", "Suppression des hésitations et silences", "Traitement en batch", "Supporte le français et l'anglais"],
    cons: ["Fonction unique (pas d'édition)", "Résultats parfois trop agressifs", "Nécessite un upload/download", "Pas d'édition en temps réel"],
    verdict: { keepIf: ["Production audio régulière", "Temps de post-production à réduire", "Qualité audio à améliorer sans compétence technique"], avoidIf: ["Production audio rare", "Déjà un bon setup micro", "Besoin d'édition complète"], threshold: "Rentable dès 2+ heures d'audio à nettoyer par mois." },
    use_cases: ["Nettoyer un épisode de podcast en 1 clic", "Supprimer le bruit de fond des interviews", "Préparer des fichiers audio pour publication"],
    pricing: { free: "30 min gratuites", paid: "À partir de 10$/mois" },
  },

  // ─── ANALYTICS ───
  "shield-app": {
    long_description: "Shield App fournit des analytics détaillés pour LinkedIn : croissance des abonnés, performance des posts, meilleurs horaires de publication et benchmarks. Pour les créateurs de contenu LinkedIn qui veulent optimiser leur stratégie, c'est le dashboard manquant que LinkedIn ne propose pas.",
    pros: ["Analytics LinkedIn détaillés et visuels", "Historique de performance illimité", "Benchmarks et comparaisons", "Rapports exportables"],
    cons: ["Limité à LinkedIn uniquement", "Prix pour un outil d'analytics niche", "Pas de scheduling intégré", "Données dépendantes de l'API LinkedIn"],
    verdict: { keepIf: ["LinkedIn est un canal d'acquisition majeur", "Publication 3+ fois par semaine", "Besoin de données pour optimiser"], avoidIf: ["LinkedIn occasionnel", "Publication < 1 fois par semaine", "Budget serré"], threshold: "Utile si LinkedIn génère des leads ou de la visibilité business." },
    use_cases: ["Analyser les performances de ses posts LinkedIn", "Identifier les meilleurs horaires de publication", "Suivre la croissance de son audience"],
    pricing: { free: "Essai gratuit", paid: "À partir de 8$/mois" },
  },
  "notionlytics": {
    long_description: "Notionlytics ajoute des analytics aux pages Notion partagées publiquement. L'outil permet de savoir qui visite vos pages, combien de temps ils restent et quelles sections ils lisent. Pour les freelances qui utilisent Notion comme portfolio ou documentation client, c'est un insight précieux.",
    pros: ["Analytics simples pour pages Notion", "Pas de configuration technique", "Vues, temps passé, sources", "Intégration Notion native"],
    cons: ["Limité aux pages Notion publiques", "Données basiques vs Google Analytics", "Niche très spécifique", "Prix pour une fonctionnalité limitée"],
    verdict: { keepIf: ["Notion utilisé comme site public ou portfolio", "Besoin de savoir qui consulte vos docs", "Documentation client partagée via Notion"], avoidIf: ["Notion en usage privé uniquement", "Site web classique (utiliser Plausible)", "Budget très limité"], threshold: "Utile si vous partagez régulièrement des pages Notion avec des clients ou prospects." },
    use_cases: ["Suivre les vues sur un portfolio Notion", "Mesurer l'engagement sur une documentation client", "Identifier les sections les plus lues"],
    pricing: { free: "Plan gratuit limité", paid: "À partir de 5$/mois" },
  },
  "beehiiv-analytics": {
    long_description: "Beehiiv Analytics est le module d'analytics intégré à la plateforme de newsletter Beehiiv. Il fournit des métriques détaillées : taux d'ouverture, clics, croissance, revenus et attribution. Inclus dans tous les plans Beehiiv, c'est un avantage compétitif par rapport à Substack dont les analytics sont basiques.",
    pros: ["Inclus dans Beehiiv (pas de coût supplémentaire)", "Métriques détaillées et visuelles", "Attribution et suivi des revenus", "Segmentation avancée"],
    cons: ["Uniquement pour les utilisateurs Beehiiv", "Pas d'export avancé sur le plan gratuit", "Comparaisons limitées sans historique long"],
    verdict: { keepIf: ["Déjà sur Beehiiv", "Newsletter comme canal principal", "Besoin de metrics avancées"], avoidIf: ["Pas sur Beehiiv", "Newsletter occasionnelle"], threshold: "Gratuit avec Beehiiv — exploiter au maximum les données disponibles." },
    use_cases: ["Analyser les taux d'ouverture par segment", "Suivre la croissance des abonnés", "Mesurer le revenu par abonné"],
    pricing: { free: "Inclus avec Beehiiv gratuit", paid: "Métriques avancées dans les plans payants" },
  },
  "convertkit-analytics": {
    long_description: "ConvertKit Analytics fournit les métriques essentielles de votre newsletter ConvertKit : abonnés, taux d'ouverture, clics et revenus des produits numériques. Intégré nativement, il ne nécessite aucune configuration. Les données sont présentées de manière claire avec des tendances sur la durée.",
    pros: ["Intégré nativement à ConvertKit", "Suivi des revenus de produits numériques", "Interface claire et lisible", "Aucune configuration nécessaire"],
    cons: ["Uniquement pour ConvertKit", "Moins détaillé que Beehiiv Analytics", "Pas de segmentation avancée sur le plan gratuit"],
    verdict: { keepIf: ["Déjà sur ConvertKit", "Vente de produits numériques", "Besoin de suivi simple"], avoidIf: ["Pas sur ConvertKit", "Besoin d'analytics poussés"], threshold: "Gratuit avec ConvertKit — consultez au moins une fois par semaine." },
    use_cases: ["Suivre les performances de chaque email", "Mesurer les revenus des produits numériques", "Identifier les emails les plus performants"],
    pricing: { free: "Inclus avec ConvertKit", paid: "N/A" },
  },

  // ─── AUTOMATION ───
  "pabbly-connect": {
    long_description: "Pabbly Connect est une alternative à Zapier avec un avantage majeur : prix fixe, workflows illimités. Là où Zapier facture par tâche (et l'addition monte vite), Pabbly propose un abonnement fixe sans limite de workflows ni de tâches. La bibliothèque d'intégrations est plus petite mais couvre les cas courants.",
    pros: ["Prix fixe sans limite de tâches", "Workflows illimités", "Interface drag-and-drop", "Bon rapport qualité/prix"],
    cons: ["Moins d'intégrations que Zapier (1000 vs 6000+)", "Interface moins polie", "Documentation en anglais", "Support moins réactif"],
    verdict: { keepIf: ["Budget Zapier devenu trop élevé", "Volume important de tâches automatisées", "Intégrations standard (Gmail, Sheets, Slack)"], avoidIf: ["Besoin d'intégrations rares", "Préférence pour la fiabilité maximale", "Équipe technique (préférer n8n)"], threshold: "Économique dès que Zapier dépasse 30$/mois." },
    use_cases: ["Automatiser les flux CRM + email", "Synchroniser des données entre apps", "Remplacer Zapier à moindre coût"],
    pricing: { free: "Aucun plan gratuit", paid: "À partir de 16$/mois (illimité)" },
  },
  "activepieces": {
    long_description: "Activepieces est une plateforme d'automatisation open-source, alternative à Zapier et Make. Self-hosted ou cloud, elle offre un éditeur visuel de workflows avec des intégrations croissantes. Pour les développeurs qui veulent contrôler leur infrastructure d'automatisation, c'est le choix souverain.",
    pros: ["Open-source et self-hostable", "Interface visuelle moderne", "Communauté active et croissante", "Gratuit en self-hosted"],
    cons: ["Moins d'intégrations que Zapier/Make", "Self-hosting nécessite des compétences DevOps", "Produit encore jeune", "Documentation en construction"],
    verdict: { keepIf: ["Profil technique, à l'aise avec le self-hosting", "Souveraineté des données importante", "Budget limité pour l'automatisation"], avoidIf: ["Pas de compétences DevOps", "Besoin de fiabilité maximale", "Intégrations rares requises"], threshold: "Gratuit en self-hosted — à tester si vous êtes technique et que Zapier est trop cher." },
    use_cases: ["Héberger ses automatisations en propre", "Remplacer Zapier/Make sans dépendance cloud", "Contribuer à un projet open-source"],
    pricing: { free: "Gratuit (open-source, self-hosted)", paid: "Cloud à partir de 0$/mois (plan gratuit)" },
  },
  "integrately": {
    long_description: "Integrately propose des automatisations pré-configurées en 1 clic. Là où Zapier demande de construire chaque workflow, Integrately propose des millions d'automatisations prêtes à l'emploi. C'est l'outil pour les non-techniciens qui veulent automatiser sans configurer.",
    pros: ["Automatisations en 1 clic (pré-configurées)", "8 millions+ d'automatisations prêtes", "Interface très simple", "Prix compétitif"],
    cons: ["Moins de personnalisation que Zapier/Make", "Intégrations parfois superficielles", "Documentation limitée", "Support basique"],
    verdict: { keepIf: ["Besoin d'automatisations simples sans configuration", "Non technique", "Budget limité"], avoidIf: ["Workflows complexes et personnalisés", "Besoin de fiabilité enterprise", "Intégrations avancées"], threshold: "Bon choix pour les automatisations standards sans complexité." },
    use_cases: ["Connecter deux apps en 1 clic", "Automatiser des tâches répétitives simples", "Synchroniser des contacts entre outils"],
    pricing: { free: "Plan gratuit limité", paid: "À partir de 20$/mois" },
  },

  // ─── PRODUCTIVITÉ DEV ───
  "warp": {
    long_description: "Warp est un terminal moderne pour développeurs avec IA intégrée, édition de texte façon IDE et collaboration d'équipe. L'outil repense l'expérience du terminal : chaque commande est un bloc éditable, l'historique est recherchable, et l'IA peut expliquer ou générer des commandes. Pour les développeurs qui passent 2h+ par jour dans le terminal, c'est un upgrade significatif.",
    pros: ["IA intégrée pour expliquer/générer des commandes", "Blocs de commande éditables", "Historique searchable et partageable", "Vitesse native (Rust)"],
    cons: ["macOS et Linux uniquement (pas Windows)", "Nécessite un compte (pas offline-first)", "Certaines fonctionnalités IA requièrent un plan payant", "Habitudes à changer vs iTerm/Terminal"],
    verdict: { keepIf: ["2h+ par jour dans le terminal", "Envie d'IA dans le terminal", "macOS ou Linux"], avoidIf: ["Windows", "Usage terminal occasionnel", "Réticence à créer un compte"], threshold: "Gratuit — à essayer si vous passez du temps significatif dans le terminal." },
    use_cases: ["Rechercher dans l'historique des commandes", "Demander à l'IA de générer une commande", "Partager des outputs de terminal avec l'équipe"],
    pricing: { free: "Gratuit pour un usage individuel", paid: "Plan Team à partir de 15$/mois" },
  },
  "fig-terminal": {
    long_description: "Fig ajoute une autocomplétion visuelle à votre terminal existant (pas un remplacement). L'outil propose des suggestions contextuelles pour les commandes, les flags et les arguments, similaire à l'IntelliSense d'un IDE mais dans le terminal. Racheté par AWS, l'avenir du produit est lié à Amazon Q Developer.",
    pros: ["Autocomplétion visuelle puissante", "Fonctionne avec votre terminal existant", "Support de 500+ CLI", "Suggestions contextuelles intelligentes"],
    cons: ["Racheté par AWS (évolution incertaine)", "macOS principalement", "Parfois lent sur les gros répertoires", "Transition vers Amazon Q Developer"],
    verdict: { keepIf: ["Usage intensif de CLI variées", "macOS", "Besoin d'autocomplétion sans changer de terminal"], avoidIf: ["Déjà sur Warp (inclut l'autocomplétion)", "Windows", "Terminal occasionnel"], threshold: "Gratuit — à installer si vous tapez 50+ commandes par jour." },
    use_cases: ["Autocompléter les commandes git complexes", "Découvrir les flags disponibles d'une CLI", "Accélérer la navigation dans le terminal"],
    pricing: { free: "Gratuit", paid: "N/A (transition vers Amazon Q)" },
  },
  "zed": {
    long_description: "Zed est un éditeur de code haute performance écrit en Rust, conçu par les créateurs d'Atom. Il démarre en millisecondes, gère les gros fichiers sans ralentir et propose une collaboration en temps réel native. C'est l'alternative à VS Code pour les développeurs qui privilégient la vitesse et la légèreté.",
    pros: ["Performance exceptionnelle (Rust)", "Démarrage quasi-instantané", "Collaboration en temps réel native", "Interface épurée et moderne"],
    cons: ["Écosystème d'extensions naissant", "Moins de plugins que VS Code", "macOS et Linux (Windows en beta)", "Fonctionnalités encore en développement"],
    verdict: { keepIf: ["VS Code trop lent sur vos projets", "Besoin de collaboration en temps réel", "Préférence pour les outils légers"], avoidIf: ["Dépendance à des extensions VS Code spécifiques", "Windows (pour l'instant)", "Workflow établi avec VS Code"], threshold: "Gratuit — à tester si VS Code ralentit sur vos projets." },
    use_cases: ["Éditer du code sur de gros projets sans lag", "Pair-programmer en temps réel", "Remplacer VS Code par un éditeur plus rapide"],
    pricing: { free: "Gratuit et open-source", paid: "N/A" },
  },
  "arc-browser": {
    long_description: "Arc repense le navigateur web autour de la productivité : espaces de travail, onglets organisés automatiquement, mini-apps et un design minimaliste. Pour les développeurs et designers qui ont 50+ onglets ouverts, Arc impose une discipline d'organisation qui réduit le chaos cognitif.",
    pros: ["Organisation automatique des onglets par espace", "Interface minimaliste et esthétique", "Mini-apps (Easels, Notes, Boosts)", "Archivage automatique des vieux onglets"],
    cons: ["Basé sur Chromium (mêmes limites)", "macOS, Windows et iOS uniquement", "Courbe d'apprentissage pour changer ses habitudes", "Consommation RAM similaire à Chrome"],
    verdict: { keepIf: ["50+ onglets ouverts régulièrement", "Multi-projets (besoin d'espaces séparés)", "Sensibilité au design et UX"], avoidIf: ["Satisfait de Chrome/Firefox", "Peu d'onglets", "Linux"], threshold: "Gratuit — à essayer pendant 1 semaine pour voir si l'organisation d'onglets vous convient." },
    use_cases: ["Séparer les onglets par projet/client", "Réduire le chaos des 50+ onglets", "Personnaliser des sites avec les Boosts"],
    pricing: { free: "Entièrement gratuit", paid: "N/A" },
  },

  // ─── SÉCURITÉ / GESTION DES SECRETS ───
  "doppler": {
    long_description: "Doppler centralise la gestion des variables d'environnement et secrets pour les équipes de développement. Au lieu de fichiers .env dispersés, Doppler fournit un dashboard unique avec versioning, permissions et déploiement automatique vers tous les environnements. C'est le standard moderne pour la gestion des secrets en équipe.",
    pros: ["Dashboard centralisé pour tous les secrets", "Versioning et audit trail", "Intégrations CI/CD natives", "Permissions granulaires par environnement"],
    cons: ["Dépendance à un service cloud tiers", "Overkill pour un développeur solo", "Plan gratuit limité", "Vendor lock-in potentiel"],
    verdict: { keepIf: ["Équipe de 2+ développeurs", "Secrets partagés entre environnements", "Besoin d'audit et compliance"], avoidIf: ["Développeur solo", "1-2 projets simples", "Préférence pour le self-hosted"], threshold: "Utile dès 2+ développeurs partageant des secrets sur 2+ environnements." },
    use_cases: ["Centraliser les clés API de tous les projets", "Déployer les secrets automatiquement en CI/CD", "Auditer qui a accédé à quel secret"],
    pricing: { free: "Plan gratuit (5 projets)", paid: "À partir de 18$/mois par utilisateur" },
  },
  "vault": {
    long_description: "HashiCorp Vault est la référence enterprise pour la gestion des secrets, le chiffrement et le contrôle d'accès. L'outil gère les secrets dynamiques, la rotation automatique des clés et le chiffrement as-a-service. Pour les grandes infrastructures, c'est un pilier de la sécurité. Pour les petites équipes, c'est trop complexe.",
    pros: ["Secrets dynamiques et rotation automatique", "Chiffrement as-a-service", "Politique d'accès granulaire", "Open-source avec option enterprise"],
    cons: ["Complexité de déploiement et maintenance", "Nécessite des compétences DevOps avancées", "Overkill pour les petites équipes", "Documentation dense"],
    verdict: { keepIf: ["Infrastructure complexe multi-cloud", "Exigences de sécurité enterprise", "Équipe DevOps/SRE dédiée"], avoidIf: ["Petite équipe < 5 devs", "Pas d'équipe DevOps", "Préférence pour la simplicité"], threshold: "Justifié pour les organisations avec des exigences de sécurité strictes et une équipe DevOps." },
    use_cases: ["Gérer les secrets dynamiques de base de données", "Chiffrer des données sensibles", "Rotation automatique des clés API"],
    pricing: { free: "Open-source (self-hosted)", paid: "Enterprise sur devis" },
  },
  "infisical": {
    long_description: "Infisical est une alternative open-source et moderne à Doppler pour la gestion des secrets. L'outil offre un dashboard intuitif, des intégrations CI/CD et la possibilité de self-host. C'est le choix pour les équipes qui veulent la simplicité de Doppler avec le contrôle de l'open-source.",
    pros: ["Open-source et self-hostable", "Interface moderne et intuitive", "Intégrations CI/CD complètes", "SDK pour Node, Python, Go, etc."],
    cons: ["Produit plus jeune que Vault/Doppler", "Self-hosting à maintenir", "Communauté plus petite", "Fonctionnalités enterprise en développement"],
    verdict: { keepIf: ["Besoin de gestion de secrets sans vendor lock-in", "Préférence pour l'open-source", "Petite à moyenne équipe technique"], avoidIf: ["Besoin de fonctionnalités enterprise matures", "Pas de compétences DevOps", "Préférence pour le full-managed"], threshold: "Gratuit en self-hosted — excellent choix pour les équipes techniques de 2-20 devs." },
    use_cases: ["Centraliser les secrets sans dépendance cloud", "Intégrer la gestion de secrets dans le CI/CD", "Self-host ses secrets pour la souveraineté"],
    pricing: { free: "Gratuit (open-source)", paid: "Cloud à partir de 0$/mois" },
  },
  "dotenv-vault": {
    long_description: "Dotenv Vault étend le concept du fichier .env avec du chiffrement et de la synchronisation. L'outil chiffre vos .env, les synchronise entre développeurs et les déploie en production de manière sécurisée. C'est la solution la plus simple pour les petites équipes qui utilisent déjà dotenv.",
    pros: ["Extension naturelle de dotenv", "Chiffrement des fichiers .env", "Synchronisation entre développeurs", "Déploiement simplifié"],
    cons: ["Fonctionnalités limitées vs Doppler/Infisical", "Pas de rotation automatique", "Dashboard basique", "Dépendance à l'écosystème dotenv"],
    verdict: { keepIf: ["Déjà utilisateur de dotenv", "Besoin de partager des .env en équipe", "Solution simple sans complexité"], avoidIf: ["Besoin de gestion de secrets avancée", "Infrastructure complexe", "Rotation automatique requise"], threshold: "Gratuit — upgrade naturel si vous partagez déjà des fichiers .env par Slack." },
    use_cases: ["Chiffrer les fichiers .env du projet", "Synchroniser les variables entre développeurs", "Déployer les secrets en production de manière sécurisée"],
    pricing: { free: "Gratuit", paid: "Plans team disponibles" },
  },

  // ─── NOCODE-WEB / WORKFLOW CRÉATIF ───
  "readymag": {
    long_description: "Readymag est un outil de création de sites web orienté design éditorial. L'outil offre un contrôle pixel-perfect avec des animations avancées, des grilles flexibles et un rendu typographique soigné. C'est le choix des designers qui veulent créer des expériences web uniques sans coder, avec un résultat proche d'un site codé sur-mesure.",
    pros: ["Contrôle pixel-perfect du design", "Animations et interactions avancées", "Rendu typographique excellent", "Templates éditoriaux de haute qualité"],
    cons: ["Pas adapté aux sites e-commerce ou SaaS", "Courbe d'apprentissage pour les non-designers", "SEO moins optimisé que Webflow", "Prix par projet publié"],
    verdict: { keepIf: ["Portfolio créatif haut de gamme", "Projet éditorial visuel", "Contrôle pixel-perfect nécessaire"], avoidIf: ["Site e-commerce ou SaaS", "SEO prioritaire", "Budget limité"], threshold: "Justifié pour les portfolios et sites éditoriaux où le design est la priorité absolue." },
    use_cases: ["Créer un portfolio créatif remarquable", "Publier un magazine en ligne", "Concevoir une landing page artistique"],
    pricing: { free: "Plan gratuit (1 projet)", paid: "À partir de 16$/mois" },
  },
  "cargo-site": {
    long_description: "Cargo est la plateforme des créatifs qui veulent un portfolio qui se démarque. L'outil propose des templates expérimentaux et un contrôle total du design avec des fonctionnalités typographiques et d'animation avancées. C'est le choix de la communauté créative internationale pour les portfolios qui sortent de l'ordinaire.",
    pros: ["Templates créatifs et expérimentaux", "Communauté de designers reconnue", "Typographie et animations avancées", "Effet galerie d'art numérique"],
    cons: ["Pas pour les sites fonctionnels/business", "Courbe d'apprentissage", "Options e-commerce limitées", "Performance variable selon le template"],
    verdict: { keepIf: ["Designer ou artiste cherchant un portfolio unique", "Esthétique et originalité prioritaires", "Communauté créative internationale"], avoidIf: ["Site business classique", "SEO et performance critiques", "Non-designer"], threshold: "Le bon choix si votre portfolio EST votre produit et doit impressionner visuellement." },
    use_cases: ["Créer un portfolio artistique unique", "Présenter des projets créatifs avec impact visuel", "Se démarquer dans la communauté design internationale"],
    pricing: { free: "Plan gratuit limité", paid: "À partir de 13$/mois" },
  },

  // ─── ORGANISATION / CRM CRÉATIF ───
  "17hats": {
    long_description: "17hats est un outil de gestion tout-en-un pour freelances créatifs : CRM, devis, contrats, facturation, planification et formulaires. Le nom vient de l'idée qu'un freelance porte 17 casquettes différentes. L'outil consolide les fonctions administratives pour que le créatif puisse se concentrer sur son métier.",
    pros: ["Tout-en-un (CRM + facturation + contrats)", "Conçu pour les freelances créatifs", "Automatisation des workflows clients", "Templates de contrats et devis"],
    cons: ["Interface datée par rapport aux concurrents", "Principalement anglophone", "Pas de galeries clients (vs Bloom)", "Prix pour un freelance débutant"],
    verdict: { keepIf: ["Freelance créatif avec 5+ clients actifs", "Besoin de consolider CRM + facturation", "Workflow client récurrent"], avoidIf: ["Photographe (préférer Bloom ou Táve)", "Besoin d'un CRM puissant", "Interface moderne importante"], threshold: "Utile si vous jonglez entre 3+ outils pour gérer vos clients." },
    use_cases: ["Automatiser le workflow client (devis → contrat → facture)", "Planifier des rendez-vous clients", "Envoyer des questionnaires de brief"],
    pricing: { free: "Essai gratuit", paid: "À partir de 15$/mois" },
  },
  "tave": {
    long_description: "Táve (anciennement Táve Studio Manager) est un outil de gestion conçu spécifiquement pour les photographes et vidéastes professionnels. Il gère le pipeline complet : de la demande de renseignements à la livraison finale, en passant par les contrats, la facturation et la planification des séances. Le reporting financier intégré donne une vue claire de la rentabilité par type de prestation.",
    pros: ["Conçu pour photographes et vidéastes", "Pipeline complet du lead à la livraison", "Reporting financier par type de prestation", "Automatisation des workflows de booking"],
    cons: ["Niche très spécifique (photo/vidéo)", "Interface à prendre en main", "Prix plus élevé que Bloom", "Principalement anglophone"],
    verdict: { keepIf: ["Photographe ou vidéaste professionnel", "10+ bookings par mois", "Besoin de reporting financier détaillé"], avoidIf: ["Designer ou illustrateur (préférer Bloom)", "Volume faible de clients", "Besoin d'un outil généraliste"], threshold: "Rentable pour les photographes avec 5+ bookings par mois." },
    use_cases: ["Gérer les demandes et les bookings photo", "Automatiser les contrats et factures", "Analyser la rentabilité par type de prestation"],
    pricing: { free: "Essai gratuit 30 jours", paid: "À partir de 22$/mois" },
  },

  // ─── EMAIL PRODUCTIVITY ───
  "lemlist": {
    long_description: "Lemlist est une plateforme d'outreach email personnalisé avec séquences multi-canal (email + LinkedIn). L'outil se distingue par la personnalisation avancée des emails (images dynamiques, variables) et le suivi des performances. Pour les consultants et agences qui font de la prospection active, c'est un outil mature et bien pensé.",
    pros: ["Personnalisation avancée des emails", "Séquences multi-canal (email + LinkedIn)", "Détection de warmup intégrée", "Analytics détaillés par campagne"],
    cons: ["Prix significatif pour les solopreneurs", "Nécessite un volume minimum pour être rentable", "Configuration initiale demandant du temps", "Délivrabilité à surveiller"],
    verdict: { keepIf: ["Prospection outbound active", "Volume 100+ emails/mois", "Besoin de séquences multi-canal"], avoidIf: ["Pas de prospection email", "Volume < 50 emails/mois", "Inbound uniquement"], threshold: "Rentable dès 100+ emails de prospection par mois avec un taux de conversion de 2%+." },
    use_cases: ["Envoyer des séquences de prospection personnalisées", "Combiner outreach email et LinkedIn", "A/B tester des approches commerciales"],
    pricing: { free: "Essai gratuit 14 jours", paid: "À partir de 39$/mois" },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let updated = 0;
  let errors: string[] = [];

  for (const [toolId, data] of Object.entries(ENRICHMENTS)) {
    const { error } = await supabase
      .from("tools")
      .update({
        long_description: data.long_description,
        pros: data.pros,
        cons: data.cons,
        verdict: data.verdict,
        use_cases: data.use_cases,
        pricing: data.pricing,
      })
      .eq("id", toolId);

    if (error) {
      errors.push(`${toolId}: ${error.message}`);
    } else {
      updated++;
    }
  }

  return new Response(JSON.stringify({
    success: errors.length === 0,
    updated,
    total_in_payload: Object.keys(ENRICHMENTS).length,
    errors: errors.length > 0 ? errors : undefined,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
