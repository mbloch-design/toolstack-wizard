# Creem — lien entre paiement et soumission ToolTrim

> Actualisation après autorisation : [correctif paiement implémenté et validé localement](CORRECTIF_CREEM_2026-10-09.md), sans publication. Les constats ci-dessous décrivent le code initial audité.
**9 octobre 2026 — vérification documentaire et du code, sans modification de l’intégration.** Le propriétaire indique que Creem fonctionne. Le constat R2 ne remet pas en cause l’encaissement Creem ; il concerne le statut donné à la soumission par ToolTrim.

## Parcours actuel vérifié

- Le bouton conserve le lien produit `https://www.creem.io/payment/prod_2LMoN4zyRhNAb53r3rWpwX`, avec le script embed Creem.
- Avant départ, la page sauvegarde le brouillon `tt_submit_draft` et notifie le début du parcours. Cette notification décrit un paiement lancé, non encore confirmé.
- Au retour, `SubmitToolPage.tsx` lit uniquement `paid=1`. Elle supprime le brouillon, puis active `paid` si des informations d’outil sont retrouvées.
- La soumission finale envoie ce booléen à `api/contact.ts`. Le handler ne reçoit/vérifie actuellement aucun identifiant de checkout ou transaction Creem.
- Aucun handler Creem/webhook/vérification de paiement n’existe dans `api` au commit applicatif audité. Cela ne préjuge pas d’une configuration externe au dépôt.

## Capacités officielles compatibles avec l’existant

La [documentation du retour de checkout](https://docs.creem.io/features/checkout/checkout-api#verifying-redirect-signatures) décrit `checkout_id`, `order_id`, `customer_id`, `product_id`, éventuellement `request_id`/`subscription_id`, et `signature`. La vérification de cette signature se fait côté serveur, en préservant l’ordre des paramètres et les règles d’exclusion des valeurs vides/null ; la clé ne doit pas aller dans le navigateur. Les paramètres effectivement envoyés par ce produit n’ont pas encore été observés.

L’API permet aussi de [relire un checkout par son identifiant](https://docs.creem.io/skills/creem-api/REFERENCE) avec une clé serveur. Les [liens produits existants](https://docs.creem.io/features/checkout/checkout-link) acceptent `metadata[key]`, données ensuite disponibles via API/webhook : cela offre une piste pour rattacher le paiement à une soumission sans remplacer le checkout. La prise en compte dans l’embed utilisé doit être vérifiée en mode test avant de s’appuyer dessus.

Un callback navigateur seul ne constitue pas une preuve serveur. Creem le précise dans la [documentation embedded checkout](https://docs.creem.io/features/checkout/embedded-checkout). Les [webhooks signés](https://docs.creem.io/code/webhooks) sont une autre voie de confirmation ; ajouter cette voie serait un sous-lot distinct, avec livraison répétée/idempotence à traiter.

## Changement ciblé recommandé — non implémenté

1. Conserver le produit, le lien Creem et le checkout actuel. Identifier d’abord l’URL de retour réellement configurée et les noms des paramètres qu’il transmet.
2. Faire vérifier le checkout par le serveur ToolTrim avant toute confirmation payée : statut, produit attendu et association à la soumission. `paid=1` devient une indication de retour, jamais une preuve.
3. Conserver le brouillon et les éléments de reprise jusqu’à la soumission réussie. Une erreur réseau ou de configuration affiche une vérification en attente ; elle ne prouve pas un paiement refusé et ne doit pas inviter à repayer.
4. Refuser un statut payé déclaré sans preuve dans le handler final. Tester signature altérée, mauvais produit, checkout incomplet, association incorrecte et erreurs Creem, avec API/emails simulés.
5. Distinguer preuve de paiement et non-réutilisation : une signature valide ou une relecture API ne consomme pas un paiement. Garantir une seule soumission par checkout demande un enregistrement durable et atomique, à choisir avec le backend réel ; Supabase déclaré INACTIVE n’est pas un support validé pour cela.

## Informations encore nécessaires

L’URL de retour du produit est demandée au propriétaire, sans clé ni URL d’une transaction client. L’existence d’une clé serveur Creem dans l’environnement de déploiement, ainsi que la présence éventuelle de webhooks externes, restent non vérifiées. Aucun secret n’a été lu ou demandé.

Aucune publication, création de checkout, commande, paiement, webhook ou email n’a été déclenchée. Le checkout fonctionnel reste intact. Le passage à un correctif sera proposé sur ce contrat confirmé, avec sa recette en mode test, avant activation en production.
