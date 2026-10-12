# GA4 et consentement — correctif du 12 octobre 2026

## Comportement attendu

GA4 reste en consentement basique : aucune balise Google chargée avant accord. Une page courante est émise après configuration et chargement de la balise, même si l'accord arrive après l'effet de route ou si la navigation change pendant le téléchargement. Les actions antérieures à l'accord ne sont pas rejouées. Les pages vues identiques provenant de l'initialisation et de l'effet React sont dédupliquées ; les navigations A → B → A restent comptées.

Le choix accepté/refusé est versionné, horodaté et expire après six mois. Les anciens choix sans date et les valeurs invalides demandent un nouveau choix. Les préférences FR/EN sont accessibles dans le footer. Les boutons accepter/refuser ont le même aspect. L'ouverture explicite place le focus sur le panneau ; Fermer ou Échap rend le focus au contrôle d'origine.

Le retrait désactive les événements, efface les cookies GA accessibles au chemin racine et aux domaines parents, puis recharge la page pour retirer les écouteurs automatiques Google. Il se propage aux autres onglets lorsque localStorage est disponible. Si une écriture échoue, l'ancien choix est supprimé si possible et le nouveau choix passe en sessionStorage, puis, si celui-ci échoue aussi, dans un marqueur de préférence du nom de fenêtre conservé au rechargement sur le même site. Les trois supports sont arbitrés par date de décision : le plus récent gagne, et un refus gagne en cas d’égalité. Cela évite de réactiver GA sur un ancien accord après retrait, tout en laissant un refus durable plus récent dans un autre onglet prendre le dessus. Ce dernier repli contient seulement choix/expiration, aucun identifiant de visiteur.

DataFast cookieless et Vercel Web Analytics restent les mesures indépendantes déjà présentes. Leur absence de cookie persistant ne constitue pas, à elle seule, une attestation d'exemption CNIL. La politique de confidentialité décrit les trois outils sans prétendre que toute donnée GA est anonyme.

## Lecture des statistiques

GA4 représente les visiteurs consentants. La comparaison brute avant/après installation du consentement est une rupture de périmètre, et ne mesure pas directement une variation du trafic réel. Les données jamais collectées ne sont pas récupérables. L'audience agrégée doit être examinée dans un outil configuré pour ce besoin ; aucun taux de consentement ou coefficient correcteur n'est inventé.

Le mode avancé n'est pas activé : les pings sans cookies ne sont pas automatiquement exemptés, et la modélisation comportementale impose des seuils de trafic. Les volumes de la propriété n'ont pas été extrapolés.

## Vérification de la propriété distante

La balise du code est `G-DL5MJKQ3JE`. Elle appartient à la propriété historique `https://www.tooltrim.io/` (522378888), flux `tooltrim.io` (13388624249). La propriété `ToolTrim` (536401038), flux `tooltrim` (14822719117), utilise `G-PQPPPH19MH`. Ces identifiants ont été lus dans la session Chrome GA4 le 12 octobre 2026. Ne pas remplacer l'identifiant du site sans décision sur la continuité de l'historique.

Avec des pages vues manuelles, désactiver **Pages vues → paramètres avancés → changements de page basés sur les événements de l'historique du navigateur** dans le flux qui reçoit le site. `send_page_view: false` supprime la page vue automatique de configuration, mais ne remplace pas ce réglage distant. Réglage désactivé puis enregistré après autorisation explicite ; l’éditeur rouvert confirme la case décochée le 12 octobre 2026. Les autres mesures améliorées sont conservées.

## Recette

- Suite app : 291 tests / 55 fichiers passent avec `NODE_OPTIONS=--no-experimental-webstorage npm test` (Node 25 expose sinon un localStorage natif incompatible avec certains tests existants).
- Neuf parcours Chromium sur l’artefact production : acceptation tardive, navigations/rechargement/retrait, téléchargement lent avec changement de route, synchronisation du refus, choix expiré/ancien, mobile EN/clavier, stockage bloqué, ancienne acceptation lisible avec écriture refusée, et refus durable plus récent que l’accord de session d’un autre onglet, et expiration du repli d’onglet avec stockages bloqués.
- Services analytics simulés pendant les parcours : aucune visite de recette transmise aux propriétés réelles. Ces tests vérifient les commandes/états du site, pas l'ingestion des rapports Google ni les règles automatiques distantes.
- Rendu mobile 390 × 844 inspecté. Types app et build production complets PASS (prerender, équivalence HTML, SEO et budgets). Ne pas assimiler la compilation à l'ingestion GA4.

Sources :
- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://support.google.com/tagmanager/answer/11161109?hl=fr
- https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ
- https://datafa.st/docs/gdpr-cookieless-tracking

## Intégration pour publication

Le commit local a été isolé sur le main distant f36b511a66. Les conflits ont conservé le nouveau footer et les styles déjà publiés ; le contrôle existant de cookies ouvre désormais les préférences, et le dégagement de scroll --consent-h est maintenu avec mesure au redimensionnement. Relecture indépendante sans point bloquant. Sur cette intégration : 332 tests app, types app, build production complet et neuf parcours Chromium sur l’artefact isolé PASS. Le correctif seul est destiné au push main ; les catégories/catalogues et le commit local Newbi distinct sont exclus.
