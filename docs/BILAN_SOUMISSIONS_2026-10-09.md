# Soumissions — bilan du plan du 9 octobre 2026

**Implémentation locale vérifiée, non publiée et non activée.** Le plan autorisé par « parfait, lance le plan » est exécuté dans le worktree isolé `submission-receipts`, depuis `32d493a5c1`. Les tâches de code et recette locale sont terminées ; les étapes du compte distant restent ouvertes. Aucun paiement, email client ou write distant réalisé.

## Résultat et gains démontrés

- Demande conservée avant les emails, avec deux jobs immuables. Une réservation Redis atomique associe un checkout à une seule demande ; même contenu accepté repris, contenu/destinataire ou ID différent refusé 409.
- Brouillons gratuits/payants complets et IDs stables. Le contenu exact envoyé est conservé avant le réseau. Après une réponse perdue, une demande acceptée est retrouvée même si Creem ou le badge ne répond plus ; cette recherche ne crée jamais une demande absente.
- Envois protégés par baux et clés Resend stables. Erreurs récupérables sans perdre la demande ; ambiguïtés après 24 heures à réconcilier manuellement. La réponse positive prouve l’enregistrement, pas la livraison des emails.
- Notifications intermédiaires bornées et non bloquantes. Maintenance authentifiée pour reprise, suspension après litige et archivage des charges personnelles terminées depuis 90 jours, sans libérer le reçu.
- Traitement manuel par email conservé, sans Supabase pour cette fonctionnalité ni nouveau back-office. Aucune modification catalogue, catégories, design ou parcours commercial.

Pas de promesse d’envoi exactement une fois, de capacité gratuite illimitée, de disponibilité sans perte ni de gain de référencement/encaissement. La protection contre une réutilisation n’est active en production qu’après déploiement et configuration vérifiés.

## Vérification finale

| Contrôle | Résultat |
|---|---|
| API | 175/175, dont scripts Lua exécutés sur Redis réel local 7.2.7 |
| App | 287/287, dont 21 tests de soumission/paiement |
| SEO | 23/23 ; balises de six pages et octets du sitemap identiques au build précédent |
| Navigateur Chromium | 14/14 FR/EN, APIs interceptées, aucun paiement/email réel |
| Types app/node/API, build production, diff | PASS |
| CI | Binaire Redis préparé pour éviter les tests d’intégration ignorés ; YAML valide, exécution GitHub encore non vérifiée |

Le build valide 13 137 URLs du sitemap et 13 162 documents HTML. Les noms de configuration Redis/maintenance et marqueurs de tokens de test sont absents des assets JavaScript. [Preuve structurée](proofs/submission-idempotency-2026-10-09/validation.json), [comparaison SEO](proofs/submission-idempotency-2026-10-09/seo-comparison.json).

Une relecture indépendante a identifié cinq points importants : notification badge encore bloquante, brouillon gratuit incomplet, reprise acceptée payante dépendante de Creem, bornes URL/langue insuffisantes et positions de page HSCAN instables. Tous corrigés avec tests négatifs puis positifs. Autres régressions ajoutées : recherche seule sans création, logs sans données privées, records corrompus refusés, réponse finale malformée préservant le brouillon, ancien reçu parmi plusieurs brouillons, reprise gratuite et grammaire checkout existante.

Le reviewer n’a pas pu lancer Redis dans son sandbox ; ce n’est pas une preuve indépendante d’intégration. Les 175 tests API du contrôle principal ont exécuté Redis avec succès. Un premier parcours navigateur a échoué sur le libellé du prix anglais du test, corrigé avant la recette finale. Une seule relecture finale, suivie d’une passe de corrections ; aucune deuxième approbation de reviewer prétendue.

## Décisions d’exécution et coûts

1. Titres `Task` dans le plan pour son extracteur : adaptation documentaire seulement.
2. `GIT_WORK_TREE` explicite : le dépôt hérite d’un `core.worktree` absolu ; sans cela Git pourrait comparer le checkout principal. Diff et fichiers de commit contrôlés.
3. Redis réel local en attendant le compte de recette du propriétaire : atomicité moteur prouvée, limites propres à Upstash non certifiées.
4. Orchestration maintenance dans son handler, séparée du stockage : évite import circulaire ; coût éventuel d’un déplacement de module.
5. L’offset HSCAN envisagé initialement est abandonné : le curseur conserve les IDs restants de la page. Plus grand curseur et lectures supplémentaires, effets bornés à une demande/deux emails par reprise et 25 archives.
6. Une erreur de finalisation de bail n’annule pas une acceptation persistée : reprise opérationnelle nécessaire pour l’email restant.
7. Charge tentée persistée et recherche `replayOnly` avant prestataire, gratuit/payant : une requête de reprise supplémentaire ; jamais de création sans preuve.
8. Logs prestataire privés et parsing des records corrompus traités comme importants : les imports invalides restent en quarantaine plutôt que de créer/réenvoyer silencieusement.
9. Grammaire checkout identique au vérificateur Creem existant : IDs non pris en charge toujours refusés par la preuve prestataire.
10. Redis préparé en CI : évite l’ignorance silencieuse des tests atomiques ; installation supplémentaire seulement si les binaires sont absents. Workflow distant non exécuté à ce stade.

## Points différés et limites restantes

- Anti-abus/rate limit global des notifications d’étapes, qui ne stockent pas les brouillons non vérifiés.
- Webhook automatique remboursements/litiges : suspension manuelle authentifiée fournie.
- Annulation réseau Resend après timeout : clés stables et réconciliation protègent la reprise, sans garantir l’arrêt de la requête déjà partie.
- UX de création d’un nouveau brouillon distinct quand un brouillon incomplet est restauré : décision produit ultérieure.
- Ancienne copie promotionnelle et changements commerciaux/design hors lot.
- Rétention des demandes ambiguës/incomplètes : pas de purge automatique, décision d’exploitation avant activation.
- Formatage compact de certains nouveaux modules : amélioration de lisibilité différée.

Ne sont pas revendiqués comme défauts résolus : configuration/quota/éviction/disponibilité du compte Upstash, recette réelle Creem/Resend, restauration d’une ancienne sauvegarde et pertes possibles. La procédure impose de fermer les nouvelles acceptations après une perte/restauration et de réconcilier les paiements postérieurs avant réouverture.

## Prochain lot : activation conditionnelle

1. Compte Upstash durable Free du propriétaire, éviction désactivée et absence de bascule payante vérifiées.
2. Variables serveur Vercel, clé/retour/métadonnées Creem et Resend attestés. Aucun secret dans le chat.
3. Recette Upstash indépendante, mesures des commandes/quota sur les branches et la maintenance ; aucune capacité chiffrée extrapolée des seules requêtes REST.
4. Sauvegarde/restauration privée testée, rétention et fréquence de reprise validées par l’exploitation.
5. Publication autorisée seulement ensuite, avec CI distante et recette publique adaptée.

[Procédure d’exploitation et variables](SOUMISSIONS_UPSTASH.md). L’accès de gestion Vercel précédemment testé renvoyait 403 ; aucune configuration actuelle n’est présumée présente. Les commits restent locaux et le worktree conservé.
