# GA4 Consent Mode avancé — 13 octobre 2026

## Demande et comportement

Demande explicite : régler la mesure avec GA4, sans nouveau service payant. Le site charge désormais le tag avec analytics_storage, ad_storage, ad_user_data et ad_personalization refusés. Avant accord ou après refus, GA4 reçoit des signaux limités sans cookies analytiques. Les événements applicatifs détaillés restent bloqués jusqu’à acceptation. Accepter met à jour le consentement sans rejouer les pages précédentes ni renvoyer manuellement la page courante. Le retrait efface les cookies GA accessibles et recharge le document en état refusé. Publicité, Google Signals et URL passthrough désactivés.

Le SDK peut envoyer ses propres signaux automatiques (par exemple scroll et user_engagement) en état refusé : ce mode ne signifie pas zéro envoi à Google. Le texte FR/EN de la bannière et de la politique le précise. Les URL/fragments et référents sont minimisés avant la configuration initiale et sur les pages vues refusées. Les choix datés, l’expiration, le repli de stockage et la synchronisation entre onglets sont conservés. DataFast et Vercel restent inchangés.

## Limites

Ce changement n’établit aucune exemption CNIL. La mesure sans cookies ne fournit pas un compte complet des visiteurs dans les rapports GA4. Selon Google, la modélisation comportementale exige notamment 1 000 événements refusés par jour pendant au moins 7 jours et 1 000 utilisateurs consentants par jour pendant au moins 7 des 28 jours précédents ; ces seuils ne garantissent pas l’éligibilité. L’éligibilité de ToolTrim n’a pas été vérifiée et aucune reconstruction des données historiques perdues n’est possible.

## Vérifications

- Tests applicatifs : 334 tests / 53 fichiers sur le correctif initial, puis 345 tests / 55 fichiers sur main à jour ; types application validés.
- Chromium sur artefact : 12 scénarios consentement/CSP, dont cookies témoins supprimés, lenteur du tag, choix expirés, refus entre onglets et stockage indisponible.
- Vrai SDK Google : aucun cookie GA avant accord ; cookies après accord ; aucun cookie GA après retrait. Les deux destinations G-DL5MJKQ3JE et G-PQPPPH19MH reçoivent des pages vues G100 (stockages refusés) puis G101 (analytique accordé, publicité refusée). Les requêtes groupées POST sont inspectées, pas seulement les paramètres GET.
- Minimisation réelle : quatre requêtes acceptées HTTP 204, aucun cookie GA, aucun paramètre sensible synthétique ni fragment d’URL dans les requêtes GET/POST en état refusé.
- Historique automatique déjà désactivé dans les deux flux ; une page vue par route et par destination observée sur l’artefact stable.
- Capture mobile 390 × 844 : texte explicite, boutons au même niveau, feuille au-dessus de la navigation.

## Sources officielles

- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://support.google.com/analytics/answer/11161109
- https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience
