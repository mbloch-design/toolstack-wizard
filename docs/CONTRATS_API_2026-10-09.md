# Contrats des handlers API — 9 octobre 2026

**Lot publié sur main via `bb4bc7f94b` ; nouvelle étape API verte dans la [CI R0](https://github.com/mbloch-design/toolstack-wizard/actions/runs/37900711727), CI R0 complète verte.** La précondition du futur retrait du SDK de types est mise en place. Aucun handler, dépendance, lockfile, email ou accès distant n’a été modifié par ce lot.

## Changements

- `tsconfig.api.json` contrôle en mode strict tous les fichiers `api/**/*.ts`, les fixtures `tests/api/**/*.ts` et leur configuration Vitest.
- `npm run typecheck` inclut désormais `typecheck:api` ; le projet API est référencé depuis le tsconfig racine.
- `npm run test:api` exécute les contrats dans un environnement Node distinct des tests DOM. Les tests restent hors du répertoire déployable `api/`.
- `verify:preprod` et le workflow Preprod CI lancent les tests API ; le typecheck global existant impose aussi ce nouveau contrôle dans la CI.

## Contrats couverts

**82 tests** exercent les vrais handlers `contact`, `submission-progress`, `verify-badge` et le helper de badge : méthodes GET/POST/OPTIONS, préflight local, refus du CORS sur les origines tierces, corps manquants/invalides/trop longs, réponses 200/204/400/405/500, échappement HTML et sujets sans retour à la ligne, confirmations bilingues et erreurs de livraison.

Le parcours badge garde les vraies vérifications et la vraie signature HMAC : durée du token, liens aux deux URL, token absent/altéré/expiré, badge retiré après émission du token. Les tests du helper couvrent HTTPS, URL avec credentials/port, plusieurs adresses privées et réponses DNS mixtes, domaines, badges liés et masqués inline, redirections de même site et redirections refusées, boucle et pages inutilisables.

Resend, DNS et `fetch` sont remplacés aux frontières externes. La fixture utilise les objets Node IncomingMessage/ServerResponse pour les headers, statut et fin de réponse, puis fournit les méthodes de commodité Vercel. Aucun message réel n’est envoyé et aucun site tiers n’est téléchargé.

## Preuves de détection

Dans une copie isolée, une erreur TypeScript volontaire ajoutée dans `api/` était ignorée par l’ancien typecheck (exit 0) ; le nouveau contrôle la rejette avec TS2322 (exit 2). Le fichier de sonde a été supprimé.

Quatre mutations volontaires échouent aux tests : mauvais statut de méthode HTTP, durée de token doublée, retrait du refus des adresses loopback IPv4, retrait du lien du token à l’URL outil. Tous les handlers originaux sont restaurés et vérifiés octet pour octet contre le commit de référence `7ee809e146`.

La relecture indépendante n’a plus de constat restant après ajout des statuts manquants et du test indépendant de l’URL outil.

## Validation et limites

82 contrats API, 266 tests applicatifs, 23 contrats SEO et typecheck global PASS. Build production et budgets PASS : 824,8 MiB au total, 713,2 MiB HTML, plafonds 831/716 MiB inchangés. Les 80 assets JavaScript et le sitemap sont identiques au build publié précédent. 13 156 HTML sont identiques octet pour octet ; six pages À propos/Contact/Transparence FR/EN ne diffèrent que par leur attribut dateTime calculé au jour du build (8 → 9 octobre), sans changement de texte visible. Aucune matrice navigateur supplémentaire n’a été rejouée pour ces assets identiques.

Ces fixtures ne certifient pas l’adaptation HTTP déployée par Vercel, le parsing de corps, les headers JSON fournis par la plateforme, les secrets, les livraisons réelles ou la sécurité exhaustive des URL/DNS. Le type SDK de `body` reste `any` : le typecheck ne remplace pas les validations runtime. Aucun test public envoyant des emails n’est nécessaire à cette précondition.

Les vulnérabilités du SDK sont **inchangées**, puisque ni les paquets ni le lockfile ne changent. La réduction du SDK est maintenant un lot distinct autorisé, suivi dans [le rapport R1](REDUCTION_SDK_TYPES_2026-10-09.md). Les travaux locaux de catégories, catalogue et médias restent hors périmètre.

[Preuves de vérification](../output/tooltrim-api-contracts-2026-10-09/verification.json), [détection des mutations](../output/tooltrim-api-contracts-2026-10-09/mutation-proof.json), [hash des handlers/lockfile](../output/tooltrim-api-contracts-2026-10-09/source-proof.json).
