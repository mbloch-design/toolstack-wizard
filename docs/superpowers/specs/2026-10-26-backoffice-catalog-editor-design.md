# Édition du catalogue et publication groupée

## Demande
Mike a demandé de mettre en place le circuit proposé (édition des JSON depuis le back-office, brouillons, aperçu, publication GitHub/rebuild), avec un bouton principal pour publier **toutes les modifications ensemble**, pas une publication par fiche. Cette demande vaut instruction d'exécution ; conserver le design du site déjà corrigé.

## Architecture retenue
Les visiteurs continuent de lire `src/data/tools_v4.json` et les artefacts du build. Aucune migration du catalogue vers Supabase. Les brouillons administrateurs sont persistés côté serveur dans un hash Redis dédié (`tt:catalog-editor:v1`), en réutilisant le transport Upstash existant ; ils ne modifient jamais le catalogue public avant publication.

L'API `api/backoffice-catalog.ts` vérifie la session Supabase active et l'email confirmé dans `BACKOFFICE_ADMIN_EMAILS` avant toute lecture privilégiée. Elle lit le catalogue à un SHA précis de `main` via GitHub ; ne pas utiliser le JSON périmé du déploiement comme référence. Secrets GitHub et Redis exclusivement serveur. Configuration GitHub : `BACKOFFICE_GITHUB_TOKEN`, contenu lecture/écriture limité au dépôt `mbloch-design/toolstack-wizard`. Le dépôt, la branche `main` et le chemin catalogue sont fixés dans le code ; jamais de chemin ou branche fourni par le client.

Approches considérées : brouillons dans une branche Git (provoquerait un déploiement preview à chaque sauvegarde), catalogue en BDD (migration sans nécessité), brouillons Redis + publication Git atomique (retenue). Redis est déjà utilisé par les soumissions. Son hash existant ne doit pas être modifié.

## Parcours
Nouvel onglet local « Fiches » dans le back-office existant. Recherche du catalogue, filtre brouillons, liste paginée ; formulaire FR/EN, rubriques Contenu / Décision / Prix / Liens et médias / SEO. Tous les champs non exposés sont conservés. Identifiants et slugs restent immuables. L'éditeur ne fabrique ni prix ni source ni traduction. Champs complexes sous forme de groupes et listes, sans demander à Mike de saisir un document JSON complet.

« Enregistrer le brouillon » enregistre sans publier. « Aperçu » présente les modifications éditoriales enregistrées localement et distingue le brouillon de la fiche actuellement publique. Un récapitulatif global montre les fiches et champs modifiés ; le seul bouton de publication est « Publier toutes les modifications (N) ». Il ouvre le récapitulatif avant l'envoi global. La publication envoie exactement le lot relu (révision globale), refuse un lot modifié entre temps, et produit un seul commit de catalogue sur `main`. Le build Vercel existant régénère index, shards, routes et SEO. Afficher « commit envoyé / reconstruction à venir », jamais « en ligne » sans preuve du déploiement.

## Concurrence et échecs
Chaque brouillon porte une version et l'empreinte de sa fiche de base. Sauvegarde et suppression font un compare-and-set Redis atomique ; un onglet périmé ne peut pas écraser un brouillon plus récent. Publication : recharger le HEAD courant, comparer les empreintes de chaque fiche. Changement extérieur sur une fiche du lot -> 409 sans écrire `main`, brouillons conservés. Les nouvelles modifications d'autres fiches du dépôt sont préservées. Créer blob/arbre/commit sur le HEAD courant puis avancer la référence avec `force:false` ; une course Git provoque un conflit, jamais un force push. Un nouvel état identique déjà présent sur `main` est idempotent. Après succès, effacer uniquement les versions publiées, jamais les nouvelles versions sauvegardées pendant l'envoi. Un échec réseau ou nettoyage ne doit jamais annoncer un succès sans commit vérifiable ; un nouvel essai réconcilie les fiches déjà publiées.

## Contrat API
GET `?mode=list&search=&page=1&draftsOnly=false` -> `CatalogWorkspace`.
GET `?mode=detail&slug=` -> `CatalogEditorDetail`.
PUT `{slug, version, baseHash, value}` -> `CatalogEditorDetail`.
DELETE `{slug,version}` -> `{ok:true}`.
POST `{revision}` -> `{commitSha,commitUrl,published:number,cleanupPending:boolean}`.

Types partagés dans `src/lib/backofficeCatalog.ts` :
`CatalogTool = Record<string, unknown> & {id:string;slug:string;name:string}`.
`CatalogDraftSummary = {slug:string;name:string;version:number;updatedAt:string;fields:string[]}`.
`CatalogWorkspace = {revision:number;tools:{slug:string;name:string;category:string;draft:CatalogDraftSummary|null}[];drafts:CatalogDraftSummary[];total:number;page:number;pageSize:number;headSha:string}`.
`CatalogEditorDetail = {tool:CatalogTool;published:CatalogTool;baseHash:string;version:number;draft:CatalogDraftSummary|null;conflict:boolean}`.
`CatalogPublication = {commitSha:string;commitUrl:string;published:number;cleanupPending:boolean}`.

Limites : 256 Kio par fiche entrante, 100 brouillons, recherche 200 caractères, page 25 éléments. Erreurs stables 400/401/403/404/409/413/503 et codes spécifiques ; aucune réponse de secret ou erreur brute fournisseur. Le formulaire garde les saisies lors d'un échec ; protection contre perte des saisies lors du changement de fiche et sortie. Configuration absente -> message explicite, aucun faux enregistrement local.

## Vérification
Tests de contrat, valeurs dangereuses, formes de prix/sources ; API auth, concurrence, échec Redis/GitHub, lot global, idempotence et récupération ; navigateur authentifié synthétique desktop/mobile : deux fiches sauvegardées, rafraîchissement, aperçu, publication groupée, conflit/échec conservant les brouillons. Validation TypeScript, design tokens et build complet. Relecture indépendante avant livraison. Aucun changement factuel de catalogue réel pour tester la publication.
