# Soumissions — exploitation sans Supabase

9 octobre 2026. Implémentation locale dans le worktree `submission-receipts`. **Non activée, non publiée.** Le propriétaire traite toujours les demandes par email ; aucun back-office n'est ajouté. Redis conserve uniquement les demandes et les reçus utilisés. Catalogue/diagnostic inchangés.

## Configuration serveur avant activation

Créer une base durable appartenant au compte du propriétaire en offre Upstash **Free**, jamais une base temporaire de 72 heures. Vérifier dans le compte : éviction désactivée, pas de carte ni de bascule payante. La création de compte et la configuration ne sont pas exécutées ici faute d'accès connecté. Ne pas envoyer de secret dans le chat.

Variables de l'environnement Vercel concerné, exclusivement serveur :

| Variable | Usage |
|---|---|
| `SUBMISSION_REDIS_URL` | Endpoint REST HTTPS racine `https://…upstash.io` |
| `SUBMISSION_REDIS_TOKEN` | Jeton lecture/écriture serveur de cette base |
| `SUBMISSION_MAINTENANCE_TOKEN` | Secret indépendant pour les reprises/archivage/suspension |
| `CREEM_API_KEY` | Vérification serveur Creem existante |
| `RESEND_API_KEY` | Envoi des emails existants |
| `BADGE_VERIFICATION_SECRET` | Jeton du parcours gratuit, existant |

Aucune variable `VITE_*` ni connexion Redis navigateur. Aucune clé dans les URL/logs. Les nouvelles acceptations échouent avec 503 si Redis n'est pas disponible/configuré ; le brouillon reste conservé. Ne pas publier avant ces vérifications, celles du retour et des métadonnées Creem et la recette dédiée. L'accès de gestion Vercel précédemment testé renvoyait 403.

## Acceptation et emails

Un identifiant stable suit le brouillon gratuit/payé. Le serveur vérifie le badge ou Creem avant une nouvelle réservation. Un hash privé contient le record de demande et l'index du checkout, écrits ensemble par HSET dans EVAL. Le contenu normalisé et les deux charges email sont figés. Même ID/contenu : reprise ; autre contenu, destinataire ou ID utilisant le même checkout : 409. Cette protection ne limite pas les demandes gratuites créées sous de nouveaux IDs.

Le navigateur sauvegarde le contenu exact tenté, avant l’envoi final. Après une réponse perdue, il recherche la demande déjà acceptée avant de redemander une preuve Creem ou badge. Cette recherche seule ne crée jamais de demande absente ; une nouvelle réservation exige toujours les preuves.

La réponse positive signifie **demande enregistrée**, pas « email livré ». L'appel tente les deux emails après persistance. Un bail de 60 secondes protège les transitions ; Resend reçoit une clé stable par message. Un échec conserve les jobs et la première tentative. Après 24 heures, une issue ambiguë passe en réconciliation manuelle ; elle ne sera pas renvoyée automatiquement.

Les notifications intermédiaires restent des indications de parcours, sans preuve de paiement/badge. Elles ne stockent pas de brouillon non vérifié dans Redis et ne bloquent plus le formulaire. Leur clé Resend déduplique les retries identiques pendant sa fenêtre de 24 heures. L'anti-abus global de cet endpoint reste ouvert.

## Reprise manuelle authentifiée

`POST /api/submission-maintenance`, header `Authorization: Bearer <secret serveur indépendant>`, corps JSON :

- `{"action":"retry","cursor":"0"}` : traite au plus une demande, donc deux messages. Réutiliser le curseur renvoyé pour poursuivre ; `0` indique la fin du passage. Le curseur peut être opaque : le réutiliser tel quel ; il conserve les IDs restants de la page scannée pour éviter les changements de position. Pas de cron ou polling permanent installé.
- `{"action":"archive","cursor":"0"}` : traite au plus 25 demandes par appel. Retire les charges personnelles uniquement si les deux emails sont livrés depuis au moins **90 jours**. Garde ID, empreinte, checkout et états/preuves de consommation ; aucune expiration du reçu. Les demandes incomplètes/ambiguës ne sont pas purgées automatiquement.
- `{"action":"suspend","id":"<UUID de demande>"}` : conserve le reçu et suspend les nouveaux envois, utile après remboursement/litige constaté. Pas de webhook de remboursement installé ; le contrôle reste manuel.

Aucun payload personnel dans les réponses de maintenance. Une suspension ne peut pas annuler un email déjà accepté/en cours chez Resend. Pour un job `reconcile`, vérifier l'envoi dans Resend et les emails reçus avant toute intervention ; ne pas supprimer le reçu ni réinitialiser ses clés pour forcer un retry.

La rétention 90 jours et la fréquence de ces actions sont à valider avec l'exploitation avant activation. Le traitement manuel actuel par email continue.

## Sauvegarde et incident

Exporter le hash privé `tt:submissions:v1` par le compte serveur vers un stockage privé, jamais dans Git ou les pièces de preuve publiques. Conserver les horodatages et les index checkout ; vérifier un export/restauration sur une base de recette indépendante.

Après perte de données ou restauration d'une sauvegarde ancienne : **désactiver les nouvelles acceptations** (retirer temporairement la configuration Redis de la fonction ou suspendre la fonction), conserver les brouillons et traiter les reçus par email. Réconcilier les paiements acceptés après la sauvegarde avec Creem et les traces email avant de rouvrir. Une sauvegarde ancienne seule ne prouve pas qu'un checkout est inutilisé. Ne pas présenter Redis gratuit comme une garantie de disponibilité sans perte.

## Recette et quota

- Local : `SUBMISSION_TEST_REDIS_BIN=/chemin/vers/bin npm run test:api` démarre un Redis éphémère dédié, sans connexion à une base réelle utilisateur. Sans ce paramètre, les tests Redis réels sont explicitement ignorés ; les tests REST/contrat/auth restent exécutés. La CI prépare désormais le binaire Redis et transmet ce paramètre, sans dépendre d’Upstash distant ; cette modification CI n’a pas encore été exécutée sur GitHub.
- Upstash recette : base indépendante ; `SUBMISSION_REDIS_TEST_URL` et `SUBMISSION_REDIS_TEST_TOKEN` dans l'environnement local, puis `node --import tsx scripts/test-submission-redis.mjs`. Le script refuse l'URL de production, réserve 20 fois concurremment, vérifie un seul record et un conflit, mesure requêtes REST/octets, puis supprime seulement son hash temporaire. Pas d'email/paiement réel.
- Les mesures REST ne sont pas automatiquement le compteur facturé : EVAL exécute plusieurs commandes internes. Mesurer aussi le quota du compte avant/après chaque branche et un passage maintenance. Aucune capacité mensuelle chiffrée n'est revendiquée sans cette mesure.
- Saturation : conserver les preuves, jamais activer l'éviction pour faire de la place ; erreur récupérable et traitement des reçus par email. Exporter/archiver les données personnelles terminées selon la procédure, sans libérer les paiements consommés.

Les tarifs/limites vérifiés lors du contrat sont sourcés dans la [spec](superpowers/specs/2026-10-09-submission-idempotency-design.md). La recette locale du moteur Redis ne certifie pas la configuration, l'offre, les limites ni la disponibilité du compte Upstash distant.

[Bilan local, preuves et limites](BILAN_SOUMISSIONS_2026-10-09.md).

## Passage à l’activation — contrôle du 9 octobre 2026

La suite a été demandée après la recette locale. Le connecteur Vercel retrouve `toolstack-wizard` (`prj_gOLJN2t7sFiFA49LbIGfadbC4P9n`, équipe `team_7KjhctKdeGqM6ApVdG9uF55F`), mais la lecture des métadonnées des variables, sans déchiffrement, est refusée 403 : accès au scope `mbloch-designs-projects` à rétablir. Aucun CLI Vercel installé disponible en repli. Les consoles Upstash et Vercel du navigateur intégré affichent une connexion requise.

Aucune des variables Redis/maintenance/Creem/badge requises n’est présente dans le processus ou les fichiers locaux contrôlés ; seule `RESEND_API_KEY` est définie dans `.env.preprod` du checkout principal. La valeur n’a pas été affichée. Cela ne prouve pas l’absence de variables distantes, qui restent inaccessibles.

Le [modèle sans secrets](../.env.submissions.example) permet de préparer la configuration. Un fichier local rempli doit porter le suffixe `.local` (ignoré par Git) ; les scripts Node ne le chargent pas automatiquement. Exemple de recette avec Node compatible `--env-file`, fichier privé et base indépendante :

```bash
node --env-file=.env.submissions.local --import tsx scripts/test-submission-redis.mjs
```

Ordre de mise en service :

- [ ] Connexion Upstash du propriétaire et accès Vercel au scope du projet rétablis.
- [ ] Base durable Free, éviction désactivée et absence de bascule payante attestées dans le compte.
- [ ] Variables de Preview propres à la recette, séparées de Production, puis variables Production attestées sans afficher les valeurs.
- [ ] Recette Upstash dédiée passée et compteur du compte relevé sur chaque branche/reprise ; capacité évaluée seulement ensuite.
- [ ] Retour et métadonnées Creem, expéditeur Resend, rétention 90 jours, traitement manuel des ambiguïtés et sauvegarde/restauration attestés.
- [ ] Publication puis CI/recette publique vérifiées, lorsque les prérequis sont réunis.

État actuel : **activation en attente des accès**. Aucune modification de variable distante, création de compte/base, écriture Redis distante, email ou paiement réalisé lors de ce contrôle.

### Avancement après connexion Upstash

Le propriétaire a connecté son compte et autorisé la suite. Base `tooltrim-submissions` créée dans son espace Personal : [console](https://console.upstash.com/redis/3beef924-b484-4891-b3ab-381e409635f7/details), Free Tier, région Francfort `eu-central-1`, persistance/TLS/REST inclus, prix affiché $0/mois. Éviction contrôlée `aria-checked=false` après création. Le compte affiche 500 000 commandes/mois, 10 GB de bande passante et 238 MB de stockage (250 MB dans le formulaire). Aucun moyen de paiement ajouté ; les offres payantes affichent « Add a payment method ». Ces limites observées ne constituent pas une capacité applicative mesurée.

Le token n’a pas été révélé ni copié. Aucun payload ni paiement enregistré dans Redis et aucune recette distante exécutée. Les variables Vercel n’ont pas été modifiées : le connecteur est encore refusé 403 dans le scope du propriétaire et la console Vercel affiche une connexion requise. La création de la base ne signifie pas activation sur le site. Prochaine action : connexion Vercel du propriétaire, puis configuration serveur et recette indépendante.

### Accès Vercel rétabli par le navigateur

Après connexion du propriétaire, le tableau de bord du projet affiche les variables : seule `RESEND_API_KEY` est présente, ciblée Production et Preview. Les noms Redis/maintenance/Creem/badge attendus ne sont pas listés. Aucun secret existant révélé. Formulaire `SUBMISSION_REDIS_URL` préparé pour Production, non enregistré. Confirmation de transfert du jeton Upstash vers les fonctions Vercel demandée avant accès lecture/écriture aux demandes ; pas de publication à ce stade. La clé Creem serveur et le secret badge restent à renseigner/vérifier avant activation.

### Redis et maintenance configurés en Production

Après autorisation explicite du transfert, `SUBMISSION_REDIS_URL`, `SUBMISSION_REDIS_TOKEN` et `SUBMISSION_MAINTENANCE_TOKEN` sont enregistrés comme **Secret**, environnement **Production**, dans `toolstack-wizard`. Le jeton REST provient de la base dédiée ; affichage Upstash remasqué après lecture, aucune valeur imprimée. Secret maintenance généré avec 32 octets aléatoires cryptographiques, conservé par Vercel, sans copie locale. Les valeurs Secret ne sont pas révélables après sauvegarde : avant exploitation manuelle, l’opérateur doit prévoir son propre stockage privé du token maintenance ou le remplacer par une valeur qu’il conserve, sans partage dans le chat/Git.

Aucun redéploiement effectué ; ces variables ne prouvent pas l’activation sur l’artefact existant. `CREEM_API_KEY` de Production et `BADGE_VERIFICATION_SECRET` restent absents du tableau. Le propriétaire est invité à renseigner sa clé Creem existante directement dans Vercel ; création du secret badge proposée séparément. Preview ne reçoit pas la base Production. Recette Redis dédiée, consommation réelle, sauvegarde/restauration et validation prestataires restent ouvertes.

### Secret badge enregistré ; clé Creem à obtenir

`BADGE_VERIFICATION_SECRET` créé après autorisation explicite, 32 octets aléatoires cryptographiques, enregistré Secret en Production et valeur non affichée. Le propriétaire indique ne pas avoir encore de clé API Creem. Le tableau de bord Creem ouvert demande une connexion ; aucun produit/lien/checkout modifié ni clé créée. La [documentation officielle Creem](https://docs.creem.io/skills/creem-api/REFERENCE) indique les clés dans Settings > API Keys et distingue clés de test/production. Le raccordement doit utiliser la clé du compte Production du produit existant. Aucun déploiement effectué.

### Clé Creem dédiée configurée

Après « ok » validant la confirmation de création/transfert : clé `ToolTrim — vérification des reçus` créée, permission unique `checkouts:read`, accès complet désactivé. L’interface de création indique une clé LIVE et le sélecteur Mode test est `false`. Clé enregistrée dans `CREEM_API_KEY`, type Secret, environnement Production, valeur non affichée et modal de clé fermé après transfert. L’ancienne clé Default n’a pas été touchée.

Produit inspecté : `prod_2LMoN4zyRhNAb53r3rWpwX`, identique au code, Fast Track existant. Retour configuré `https://tooltrim.com/submit?paid=1` ; `RedirectSubmitReturn` préserve la query et restaure la langue depuis le brouillon. Aucun champ produit ni URL sauvegardé/modifié. La propagation effective `checkout_id`/métadonnées et l’authentification API restent à valider en recette ; la lecture de configuration ne vaut pas paiement réel vérifié.

Les six noms requis sont maintenant présents en Production (Redis URL/token, maintenance, badge, Creem et Resend existant). Aucun déploiement effectué. Recette Upstash dédiée/compteurs, sauvegarde/restauration, accès opérateur maintenance, rétention et recette prestataire restent ouverts avant publication.
