# Après R11 — exécution du 15 octobre 2026

## Décisions
- Sponsoring reporté par le propriétaire : « plus tard quand je l’aurais vendu ». Offre et prix conservés ; aucun nouvel emplacement construit. Au déclenchement d'une campagne, convenir des emplacements/durée et livrer le marquage Sponsorisé sans modifier les notes ou classements éditoriaux.
- R5/R6 et tests utilisateurs restent différés. Aucun paiement réel ni email client réalisé.

## Isolation des soumissions
Défaut reproduit : six branches localhost/127.0.0.1 utilisaient tooltrim.com pour contact, progression, badge et paiement, y compris reprises. Ces appels utilisent maintenant /api sur l'origine courante, comme en production. Vite ne configure pas de proxy vers la production. Sans API locale, les scénarios doivent utiliser les mocks Playwright ; le site local ne devient pas une API réelle et ne simule pas silencieusement un succès.

Deux défauts de test/rendu corrigés après contre-revue : observateur réseau indépendant des mocks spécialisés et refus d'une preuve badge absente, vide ou de mauvais type. Quatre tests unitaires rouges (HTML/objet vide/token vide/token numérique), puis verts. Deux parcours navigateur FR/EN couvrent le fallback HTML. Les requêtes de badges tiers du footer restent bloquées dans la recette ; elles ne sont pas confondues avec les API de soumission.

## Exploitation Redis — observation réelle
Base tooltrim-submissions, Free Tier, Francfort. Console Settings : éviction désactivée. Console Usage : 426 commandes sur 500 000/mois, 322 KB sur 10 GB, 22 KB sur 250 MB, coût 0 $. Observation datée, pas de capacité extrapolée ni de garantie de service.

La rotation n'est pas exécutée : Reset Credentials régénère les identifiants de la base et révoque les jetons par réinitialisation du mot de passe. La politique de contrôle navigateur impose un relais utilisateur pour modifier un identifiant d'authentification. Aucun secret révélé/copier dans les sorties. [Référence officielle](https://upstash.com/docs/redis/features/restapi).

### Bascule à réaliser dans une fenêtre convenue
1. Conserver une sauvegarde privée récente et vérifier la procédure de récupération ; ne pas imprimer les demandes ni partager de secret dans le chat.
2. Préparer Vercel → toolstack-wizard → Environment Variables → SUBMISSION_REDIS_TOKEN, Production, et le fichier privé local utilisé pour la maintenance/recette. Aucun token dans une variable VITE_*.
3. Le propriétaire effectue Reset Credentials dans Upstash et conserve le nouveau jeton REST en privé ; pas le mot de passe TCP à la place.
4. Le propriétaire remplace SUBMISSION_REDIS_TOKEN sur Vercel et la copie privée locale, puis déploie la configuration mise à jour. Jusqu'à cette bascule, les anciens déploiements utilisant l'ancien jeton peuvent échouer : ne pas promettre une rotation sans interruption.
5. Vérifier nouveau token en lecture sans mutation (PING), ancien token refusé, puis contrôle borné du handler et de la maintenance avec action invalide ; aucun retry/archive/suspend réel ni email de recette non autorisé.
6. Confirmer le SHA/configuration de production, vérifier les logs d'erreur et conserver uniquement les preuves non sensibles. Un rollback vers un artefact contenant l'ancien token n'est pas un rollback valide.

Sauvegarde durable indépendante du poste, responsabilité/cadence et accès maintenance restent à attester ; consignes existantes dans EXPLOITATION_SOUMISSIONS.md. Ne pas assimiler la présence d'une procédure à une tâche effectivement opérée.

## Mesure
GA4 accessible par la session connectée, propriété ToolTrim 536401038. Lecture seule ; aucun événement créé par cette visite de console. Rapport événements consulté sur 17 septembre–14 octobre 2026 ; filtres et nouveaux événements à confirmer avant conclusion. Filtre explorer : deux événements historiques seulement (explorer_recenter : 6 occurrences / 2 utilisateurs ; stack_explorer_click : 1 / 1). explorer_view/save/back absents de ce rapport jusqu’au 14 octobre au relevé ; ne pas conclure à une panne ni à une conversion nulle à partir de cette période. Les deux flux ne doivent pas être additionnés aveuglément et les recettes ne prouvent pas un usage réel.

## Processus R5/R6 proposé — aucune recherche lancée
Réutiliser les scripts catalog:review:check/report et le registre existant. Automatiser formats/provenance/doublons/devises/parité avant recherche. Prioriser par usages/impressions et gravité des faits, pas par longueur de catalogue. Proposer un premier canary de cinq outils maximum, une revue consolidée et un budget avant lancement ; sortir uniquement les exceptions nécessitant une preuve humaine. Mesurer temps de recherche/revue et nombre de corrections réutilisables. Le pilote R5 conserve son seuil 80 % et les places manquantes comptées explicitement ; aucune donnée inconnue ne devient vraie pour atteindre le seuil.

## Validation et livraison
R10/R11 : Vercel success pour ffbb3f7ac7, 21 contrôles publics R11 PASS (15 s), descriptions FR/EN des deux guides présentes (132/136 caractères), HTTP200. CI 38763760190 terminée avec succès. Correctif local : 379 tests app, types app et 16 parcours Chromium FR/EN sur Vite PASS ; build final complet PASS (équivalence HTML, SEO/routage et budgets inchangés). Relecture indépendante initiale : deux constats corrigés, aucune anomalie supplémentaire au delta final. Les erreurs initiales des nouveaux tests restent consignées dans les logs de recette ; pas d'assimilation d'un run corrigé à un premier passage réussi.

Recette finale de l’artefact : 16/16 parcours Chromium simulés FR/EN PASS (18,8 s), sans paiement/email réel. Correctif local prêt, non publié ; sponsoring exact conservé. Les opérations Redis et la lecture du second flux GA4 ne sont pas déclarées terminées.
