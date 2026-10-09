# R2 — Contre-audit du backend manuel

> Actualisation après autorisation : [correctif paiement implémenté et validé localement](CORRECTIF_CREEM_2026-10-09.md), sans publication. Les constats ci-dessous décrivent le code initial audité.
**9 octobre 2026 — audit réalisé, certification distante partielle. Rapport local, sans correction ni publication applicative.** Sources : commit `050a4c10d9`, JavaScript public et API de gestion Supabase. R0/R1 restent clôturés ; leurs tests ne certifient pas le paiement, l’anti-abus ou les permissions distantes.

## Conclusion

Le point 1 annoncé traité manuellement ne peut pas être déclaré entièrement confirmé. Le projet ToolTrim référencé par le JavaScript public (`rtfyfuwfdpnsogovkwai`) est déclaré **INACTIVE** par l’API de gestion. Son hostname ne résout pas dans cet environnement et la requête SQL de métadonnées expire. Cela confirme l’état rapporté par le control plane, pas la cause de l’inactivité ni une panne constatée pour chaque visiteur.

Le code de soumission présente toujours des écarts de confiance : statut payé fourni par le client et contrôle de badge conditionné par un indicateur client. La prévention des doublons n’est pas assurée dans les handlers examinés. Des protections externes peuvent exister ; aucune règle WAF ou preuve manuelle ne les atteste ici.

## Précision sur Creem

Le propriétaire confirme que Creem fonctionne. Les écarts de R2 portent sur la confiance accordée par ToolTrim au statut de soumission, pas sur l’encaissement du prestataire. La [vérification du lien paiement → soumission](VERIFICATION_LIEN_CREEM_2026-10-09.md) propose de conserver le checkout et de valider la preuve côté serveur. URL de retour et configuration serveur restent à confirmer ; aucun changement de paiement engagé.

## Matrice des contrôles

| Contrôle | Résultat actuel | Preuve et limite |
|---|---|---|
| Identité du backend du site | Confirmée pour le build public contrôlé | Module JS principal : hostname du projet ; hash identique au build livré R1. L’environnement peut être changé ultérieurement. |
| État Supabase | INACTIVE | API de gestion du projet nommé ToolTrim. Le rétablissement n’est pas déclenché par cet audit. |
| Paiement serveur | Écart applicatif confirmé, P1 | `api/contact.ts` dérive le statut de `Boolean(paid)` ; aucun identifiant de transaction ni vérification Creem dans ce handler. La reproduction avec `paid:true` sans reçu renvoie 200 et deux emails simulés dont la confirmation payée. Cela ne prouve pas une publication automatique de fiche ni un débit frauduleux. |
| Retour de paiement UI | Déclaration client | `SubmitToolPage.tsx` active le statut payé à partir de `?paid=1` et d’un brouillon local. Module de soumission public identique au build contrôlé. Le retour de paiement doit être vérifié côté serveur avant toute promesse de statut payé. |
| Badge gratuit | Écart applicatif confirmé, P2 | Sans paiement ni badge, `badgeReview:false` contourne le bloc de vérification ; reproduction 200 et deux emails simulés. Le mécanisme de vérification existant reste effectif lorsque l’indicateur vaut true. |
| Déduplication contact/progress | Absence dans les handlers examinés, P2 | Deux requêtes identiques sont acceptées et exécutent chacune l’envoi simulé. Le Set de la page de soumission ne couvre qu’une instance du navigateur. Aucun test de charge ou email réel ; aucune extrapolation à une règle externe. |
| Limitation de débit/WAF | Non certifiée | Pas de limitation applicative visible dans ces deux handlers ; lecture du firewall Vercel actif refusée 403 dans le scope du projet. CLI Vercel absente. Aucune rafale publique n’a été lancée. |
| Maintenance locale | Confirmée sur deux handlers | 16 tests frais sur `enrich-tools` et `seed-tools-enrichment` : méthodes/clé serveur/absence de secret refusées avant travail privilégié, DB simulée. Les autres seeds ont des contrôles locaux de clé, avec des contrats différents ; ils ne sont pas couverts par ces 16 tests. |
| Maintenance déployée | Non certifiée | 11 métadonnées Edge Functions lisibles, mais lecture des sources de trois fonctions indisponible. Les versions et `verify_jwt:false` ne prouvent ni l’absence ni la présence d’un contrôle interne. Aucun endpoint de seed n’a été invoqué. |
| RLS, grants, vues, fonctions privilégiées | Non certifiés | Requête SELECT sur pg_class/pg_namespace expirée ; aucune ligne client lue. Des migrations locales ne constituent pas une preuve d’application distante. |
| Security advisors | Résultat vide, couverture non certifiée | API retourne `lints:[]`. Avec projet INACTIVE et SQL inaccessible, ce résultat ne permet pas de conclure à une sécurité complète. |

## Reproductions et périmètre

Quatre reproductions de caractérisation passent dans le répertoire isolé R1, avec Resend intégralement simulé : statut payé non attesté, soumission sans badge, répétition contact et répétition progress. **PASS signifie que l’écart a été reproduit**, pas que la protection est correcte. Le fixture est archivé comme preuve texte ; il n’est pas ajouté à la CI comme comportement à conserver.

Les 16 tests de maintenance ont été relancés et passent. Aucun besoin de reconstruire les 13 162 pages : aucun code applicatif n’est modifié par l’audit.

Contrôles distants : métadonnées de projet/fonctions/advisors, tentative de SELECT de métadonnées, lecture de configuration firewall et GET de deux assets publics. Aucun POST de formulaire, aucun email réel, aucune écriture DB, aucun appel de maintenance, aucune lecture de secret, aucune reprise de projet ou modification WAF.

## Suite concrète

1. **Confirmer la cible et les corrections manuelles.** Le projet déclaré INACTIVE est-il toujours le backend attendu ? Identifier les règles Vercel/Creem éventuellement ajoutées, sans transmettre leurs secrets. Une question est ouverte au propriétaire.
2. **R2a — Rétablir la possibilité de vérifier.** Après décision du propriétaire, retrouver un environnement actif et relire le code déployé, les droits/grants/policies et les règles WAF. Une réactivation de service ou migration est un changement distinct, à décider avec sa cible et son éventuel coût.
3. **R2b — Sécuriser le statut de soumission.** Définir une preuve de paiement serveur liée à la soumission (transaction validée et non réutilisable), dériver le besoin de badge depuis le parcours serveur ; ajouter les tests de refus avant correction. Ne pas inventer des identifiants de transaction ou une nouvelle base en parallèle.
4. **R2c — Rendre les emails idempotents et limiter les abus.** Choisir un mécanisme persistant compatible avec le backend réel ; vérifier doublons, concurrence et quotas sans livraison d’email. Un WAF peut compléter ce contrôle, mais son périmètre doit être établi.
5. **R3 reste dépendant d’un backend joignable.** La baseline d’une API catalogue saine ne doit pas être annoncée à partir du fallback. R4 produit peut avancer indépendamment après arbitrage.

Ces sous-lots sont des recommandations, pas des correctifs déjà exécutés. La contre-vérification distante de R2 reste ouverte tant que les preuves ci-dessus manquent.

## Preuves

- [État distant et erreurs exactes](proofs/r2-backend-2026-10-09/remote-state.json)
- [Identification des modules publics et DNS](proofs/r2-backend-2026-10-09/public-source.json)
- [Quatre reproductions](proofs/r2-backend-2026-10-09/reproductions.json) et [fixture archivé](proofs/r2-backend-2026-10-09/reproduction-fixture.txt)
- Référence des permissions : [documentation officielle RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), qui distingue grants et policies ; ces contrôles distants restent à effectuer.
