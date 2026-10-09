# Creem — correctif local de vérification du paiement

9 octobre 2026. Implémentation autorisée par le propriétaire (« fais »), sur le checkout existant. **Local, non publié et non activé en production.** Le fonctionnement de l’encaissement Creem n’est pas remis en cause.

## Comportement corrigé

`paid=1` indique seulement un retour. Avant d’afficher « Paiement confirmé », `/api/verify-payment` relit le checkout avec une clé serveur. Avant tout email payant, `/api/contact` effectue indépendamment la même vérification : identifiant exact, environnement `prod`, checkout `completed`, commande `paid`, produit `prod_2LMoN4zyRhNAb53r3rWpwX`, référence et URL de l’outil identiques aux métadonnées du checkout. Une erreur de configuration/réseau/prestataire donne une erreur récupérable 503 ; aucune donnée privée Creem ni clé n’est renvoyée au navigateur.

Le lien produit et le script embed sont conservés. Le lien reçoit `metadata[tooltrim_submission_id]` (UUID du brouillon) et `metadata[tooltrim_tool_url]` (URL canonique). L’adresse du payeur peut différer de celle du soumetteur. Aucune nouvelle dépendance, création de checkout, signature navigateur ou base parallèle n’est ajoutée.

Le brouillon est sauvegardé avant d’exposer le lien, y compris lors du passage gratuit → payant et pour une ouverture dans un autre onglet. Des clés par référence préservent les brouillons distincts. Le retour tente au plus 20 brouillons locaux ; il garde le reçu pour une reprise après rechargement. Un échec n’efface rien et ne propose pas de repayer. Les détails finaux restent sauvegardés ; seules les données correspondant à la soumission acceptée sont supprimées après réponse positive. Un stockage devenu indisponible n’annule pas un envoi déjà accepté.

## Vérifications

- Tests reproduisant avant correction : flag payé seul accepté ; confirmation navigateur sans preuve ; brouillon supprimé ; commande non payée acceptée ; perte de reprise entre brouillons.
- 113 tests API : preuve valide, mauvais identifiant/produit/mode/statut/association, flags invalides, configuration absente, données malformées, erreurs réseau/HTTP et absence d’envoi avant validation. Resend et Creem simulés.
- 278 tests applicatifs, dont 12 tests du parcours de paiement : reprise, rechargement, brouillon historique, sauvegarde impossible, champs malformés, envoi échoué, changement de formule et brouillons distincts.
- TypeScript app/node/API et 23 contrats SEO passent.
- Cinq scénarios Chromium sur le build local, FR/EN, avec APIs interceptées et trafic externe bloqué. Retour valide, indisponibilité/retry/reload, faux `paid=1`, métadonnées et sauvegarde avant navigation ; aucune erreur JavaScript navigateur.
- Relecture Superpowers indépendante : six problèmes corrigés, seconde revue sans point important restant.
- Build de production PASS : 13 162 HTML, 13 137 URL sitemap, 824,8 MiB dont 713,2 MiB HTML ; budgets passent. Sitemap identique au build précédent, titres/descriptions/robots/canonicals/hreflang/H1 identiques sur submit, catalogue et Notion FR/EN. Preuves dans `docs/proofs/creem-verification-2026-10-09/validation.json`.
- Commande `npm run test:e2e:payment` ajoutée à la CI ; recette 5/5 sur le serveur de HTML générés, trafic externe bloqué. Rapports/traces séparés de l’hydratation. Aucune CI distante de ce correctif n’a encore été déclenchée.

## Activation encore à vérifier

La clé **serveur** `CREEM_API_KEY` doit être configurée dans l’environnement Vercel concerné, jamais en `VITE_*`. Le retour du produit doit atteindre `/fr/submit` ou `/en/submit` avec `checkout_id`. `paid=1` peut rester présent mais ne suffit plus. Les redirections déjà payées sans nouvelles métadonnées restent en reprise manuelle avec reçu : aucun fallback ne les déclare payées sur parole.

L’URL réellement configurée, la présence de la clé et la propagation des métadonnées par le checkout réel n’ont pas été attestées. La recette navigateur simule Creem ; elle ne remplace pas cette validation d’intégration. Avant publication, vérifier ces éléments et prévoir le traitement des anciens retours pour préserver les clients déjà payés. Le propriétaire a reçu une demande d’information, sans demande de secret ni transaction client. Aucun déploiement n’est exécuté dans ce lot local.

## Limites maintenues explicites

La preuve serveur ne consomme pas un checkout. Une soumission identique peut encore être répétée ; une réponse perdue après un email accepté peut conduire à un nouvel email au retry. Une protection durable et atomique contre réutilisation, concurrence et doublons reste le sous-lot R2c, à raccorder au backend réel. Le contrôle des remboursements/litiges et des notifications prestataire reste à traiter avec ce contrat durable. Le bypass du badge gratuit relevé par R2 est distinct et reste ouvert.

La récupération dépend du stockage local de ce navigateur ; un autre navigateur sans brouillon ou plus de 20 brouillons concurrents demande une reprise manuelle. Les brouillons distincts ne sont pas purgés automatiquement.

## Sources du contrat prestataire

[Relecture d’un checkout](https://docs.creem.io/api-reference/endpoint/get-checkout), [métadonnées des liens produits](https://docs.creem.io/features/checkout/checkout-link), [checkout embarqué](https://docs.creem.io/features/checkout/embedded-checkout) et [événements de paiement](https://docs.creem.io/code/webhooks). Les paramètres réels de ce produit restent à observer avant activation.
