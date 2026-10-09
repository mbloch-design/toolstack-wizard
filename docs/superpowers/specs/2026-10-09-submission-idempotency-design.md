# Soumissions ToolTrim — déduplication durable sans Supabase

**Statut : proposition révisée, non implémentée.** Le propriétaire exclut Supabase pour cette fonctionnalité, son quota gratuit étant épuisé, et choisit de préparer Upstash Redis gratuit. Il traite actuellement les demandes par email : ce traitement manuel doit être conservé. Aucun compte, stockage distant, raccordement ou abonnement n'est créé. Les emails actuels restent la voie de traitement ; Redis n'ajoute pas de back-office. La correction locale du badge gratuit est indépendante de ce contrat.

## Résultat attendu

Un checkout Creem vérifié ne finance qu'une soumission. Un nouvel essai identique retrouve la demande acceptée sans ajouter d'email. Un changement de contenu ou de destinataire après acceptation renvoie un conflit. Une panne de stockage conserve le brouillon ; une panne d'email ne perd pas une demande déjà acceptée.

## Contraintes

- Aucune dépendance Supabase pour la soumission, la réservation du reçu ou les reprises d'email. Aucun changement du catalogue ni du diagnostic.
- Creem et Resend restent les prestataires actuels. Leurs secrets restent côté serveur.
- Vercel renvoie 403 à l'accès de gestion testé ; la clé serveur et le retour réel Creem restent à attester avant publication du correctif paiement.
- Les handlers actuels envoient directement les emails. Ils ne consomment pas durablement un checkout. Un stockage local navigateur ou en mémoire de fonction serverless ne peut pas assurer cette consommation entre instances et redémarrages.

## Options

| Option | Avantage | Limite |
|---|---|---|
| Resend uniquement | Déduplique des retries pendant 24 heures | Pas de réservation durable du paiement ni de conservation de la demande |
| Stockage serveur déjà actif, hors Supabase | Pas de nouveau fournisseur | Aucun stockage répondant à ces exigences n'a encore été identifié |
| Upstash Redis gratuit, dédié aux soumissions | REST adapté aux handlers serverless, données persistées, scripts serveur | Nouveau compte/configuration ; quota borné, à surveiller |

**Recommandation proposée : Upstash Redis gratuit**, si aucun stockage durable déjà actif ne convient. Le propriétaire a choisi de préparer cette option ; le présent contrat écrit reste à relire avant le plan détaillé. Ce choix ne vaut pas activation de facturation. REST via `fetch`, sans importer un SDK dans le navigateur. Ni fichiers catalogue ni médias dans ce stockage.

## Coût et conservation

Tarifs officiels consultés le 9 octobre 2026 : offre gratuite à 0 $, une base, 256 Mo de données, 500 000 commandes et 10 Go de bande passante par mois. Ce sont des limites, pas une garantie de capacité suffisante pour un volume de soumissions encore inconnu. Mesurer les commandes par parcours et les octets par demande avant activation ; éviter un polling continu.

Maintenir l'offre Free, sans ajout de carte ni bascule payante automatique. Vérifier ces paramètres dans le compte réel. L'éviction destructive doit rester désactivée : une saturation refuse les nouvelles écritures au lieu d'effacer des reçus consommés. Les preuves minimales de consommation n'ont pas de TTL. La rétention des données personnelles et des contenus email est distincte et doit être définie avant activation ; leur archivage ne libère pas le checkout.

La persistence Upstash est activée selon sa documentation ; l'offre Free ne dispose pas de la redondance supplémentaire des offres payantes. Export/restauration des preuves et comportement après restauration sont des critères de recette. Ne pas utiliser une base anonyme temporaire supprimée après 72 heures.

## Contrat proposé

1. Le navigateur conserve un `submission_id` stable dans le brouillon gratuit ou payant. Cet ID n'est jamais une preuve de paiement.
2. Le serveur valide les champs et les preuves : Creem pour une nouvelle demande payante ; badge, HMAC et présence publique pour une nouvelle demande gratuite.
3. Une réservation atomique associe le checkout à une demande, fige le contenu normalisé et son empreinte, et conserve deux tâches email (interne et confirmation). La demande gratuite est réservée par son ID, sans checkout.
4. Un retry du même ID et du même contenu retrouve la même acceptation. Un checkout déjà réservé sous un autre ID ou un contenu/destinataire changé provoque un conflit 409, sans email. Changer l'ID ne permet pas de recycler le paiement.
5. Une réponse perdue peut être récupérée depuis le reçu enregistré avant de dépendre d'un nouvel appel Creem. Cette reprise n'autorise aucune modification du contenu ou de la preuve.
6. La réservation et les changements d'état utilisent des opérations atomiques serveur, jamais un `GET` suivi d'un `SET` client non protégé. EVAL est disponible chez Upstash. Attention : un script Lua n'apporte pas un rollback SQL des écritures précédant une erreur. Le plan doit regrouper les écritures indispensables dans une seule commande validée, avec les index de reprise dérivés/reconstructibles ; les échecs et la saturation doivent être testés.
7. Chaque tâche conserve une charge email immuable et une clé Resend stable. Un bail et un propriétaire empêchent deux exécutants de traiter simultanément la même tâche ; seuls ces propriétaires peuvent confirmer les résultats.
8. L'appel initial tente l'envoi après persistance. La reprise est bornée et déclenchée par une requête ou un mécanisme serveur authentifié. Pas de boucle permanente ni de nouveau service de queue implicite. La cadence et le mécanisme de reprise seront fixés dans le plan après inspection de l'hébergement actif.
9. Un résultat certain est persisté avec l'ID prestataire. Un résultat ambigu reste à réconcilier ; aucune promesse d'« exactement une fois » sur le réseau.

## Resend et erreurs ambiguës

Les clés Resend sont conservées 24 heures. Les retries sous la même clé et le même contenu restent dans cette fenêtre, mesurée depuis la première tentative. Après un crash entre envoi et persistance, une tâche ambiguë au-delà de la fenêtre passe en réconciliation manuelle, sans renvoi automatique. Le reçu reste consommé.

## Sécurité et périmètre

URL et jeton Redis uniquement dans les variables serveur ; aucun `VITE_*`, endpoint client direct, clé dans une URL ou log de contenu privé. Préfixe dédié aux soumissions. Délais réseau et nombre de reprises bornés. Une indisponibilité/quota dépassé renvoie une erreur récupérable avant nouvelle acceptation/email ; un paiement reste récupérable avec son brouillon et son reçu.

Les notifications `submission-progress` ont leur propre déduplication par brouillon/étape et ne consomment jamais le paiement. Leur anti-abus doit être borné avant de leur ajouter des écritures : déplacer une saturation Supabase vers Redis ne résout pas l'abus. Les remboursements/litiges changent l'état d'un droit sans supprimer son historique.

## Recette et lots

- **Lot A, local terminé :** preuve paiement et reprise du brouillon ; badge gratuit imposé côté serveur. Activation Creem encore à vérifier.
- **Lot B, proposé :** adaptateur serveur hors Supabase, IDs stables, réservation atomique et contenu immuable. Concurrence, retry identique, nouveau destinataire/ID, saturation et erreur interne ne créent pas d'état partiel.
- **Lot C, proposé :** tâches email persistées, baux, idempotence Resend et reprise bornée. Tester crash avant/après envoi, réponse perdue et résultat ambigu après 24 heures.
- **Lot D, recette avant publication :** test d'intégration sur Redis réel de recette, absence d'accès navigateur/Supabase, comptage du quota, conservation/restauration des reçus ; vérification de la configuration réelle Creem/Vercel. Aucun email client ni paiement réel pendant les tests automatisés.

Avant implémentation : approuver ce contrat écrit, puis rédiger et relire le plan détaillé. Le choix de préparer Upstash est confirmé ; sa configuration réelle n'est pas encore attestée.

Sources : [tarifs Redis](https://upstash.com/pricing/redis), [REST](https://upstash.com/docs/redis/features/restapi), [persistance](https://upstash.com/docs/redis/features/durability), [éviction](https://upstash.com/docs/redis/features/eviction), [EVAL](https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval), [idempotence Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).
