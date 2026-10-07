# ToolTrim — suivi technique : points 2 et 3

Périmètre autorisé le 7 octobre 2026 : livraison/CI et fiabilité frontend. Le point 1 sécurité/paiement a été annoncé traité manuellement ; il n'est pas contre-vérifié ici. Aucun push, déploiement, write DB ou email réel.

## Livraison et SSR

- La CI exécute les tests actuels en jsdom, les fixtures SEO, le contrôle des tokens, les deux projets TypeScript, Ma stack et le build. Les sept tests diagnostic supprimés ne bloquent plus les contrôles utiles.
- `npm run typecheck` analyse explicitement l'application et la configuration Vite. Les diagnostics réels sont corrigés par des types de projection adaptés, des gardes et des contrats de modules ; les options strictes restent activées.
- Un renderer absent, un import SSR échoué ou une exception de rendu arrête le build. La validation examine le contenu du root et exige un H1 non vide dans chaque page du sitemap et chaque autre HTML indexable. Un canonical vers une autre page ne permet pas de cacher un root vide. Les pages explicitement noindex peuvent rester clientes.
- Mentions légales, conditions et Ma stack utilisent leurs composants existants au prérendu. Sept guides avaient un second H1 markdown : leur titre secondaire est conservé en H2. Le guide facturation dispose d'un composant synchrone en SSR et conserve son chunk lazy côté navigateur.
- Playwright lance son propre Vite sur 8080, avec port strict et sans réutiliser un serveur inconnu. Le scan Vite est limité à l'entrée applicative, pour éviter les copies HTML/archives locales.
- Le gate design disposait d'une référence périmée. La baseline est recalée sur la dette existante : 137 couleurs CSS, 223 rayons CSS, 15 couleurs TSX et 125 styles inline TSX. Aucun CSS n'est modifié. Ce recalage n'est pas une réduction de dette ; un ajout volontaire de couleur/rayon dans une copie de contrôle est bien rejeté.

## Navigation, recherche et Ma stack

- L'exemption de rafraîchissement SSR est limitée à la fiche outil correspondant à l'URL courante. Les listes/hôtes rechargent les données lorsqu'on quitte cette fiche. Les requêtes résumés échouées terminent le chargement et les réponses annulées ne remplacent pas l'écran courant.
- Une page hôte sans données affiche un état de chargement puis retourne à une fiche/catalogue visible. Une stack absente ou une erreur de shard termine également sa tentative et laisse la page gérer son fallback.
- Les fragments stacks à noms stables utilisent `no-cache` et des en-têtes de revalidation, comme les outils ; ils sont exclus du cache immutable annuel.
- Les guides locaux sont disponibles dans la recherche après une fiche SSR. Orama et les deux interfaces de recherche utilisent une identité langue/slug stable, compatible avec les IDs numériques distants.
- Un cluster de substitution décrit des alternatives ; il ne crée plus une famille hôte/extension. Les relations explicites hôte et bundle restent exploitées.
- Plans payés, outils déjà examinés et décisions suivent les événements storage entre onglets, relisent la persistence avant mutation et préservent les choix successifs. Chaque décision JSON est validée individuellement : une entrée null/corrompue ne fait plus tomber les décisions valides.

## Vérification

- Copie isolée des seuls fichiers à committer : **242 tests / 45 fichiers PASS**. Le checkout complet, qui contient également des copies de tests non suivies, passe 248 tests / 48 fichiers ; cette seconde valeur n'est pas le périmètre du commit.
- Contrats SSR/SEO : **16 tests PASS** ; contrôles positifs et négatifs pour root vide, commentaires, scripts, H1, renderer manquant, sitemap vide et page indexable hors sitemap.
- Ma stack : **93 tests / 11 fichiers PASS**.
- TypeScript : **application + configuration Vite PASS**, dans le checkout et dans la copie isolée. Options strictes inchangées.
- Playwright avec configuration du dépôt, Chromium et Vite démarré automatiquement sur 8080 : **6/6 PASS**. Chrome sur serveur de sources : **15/15 PASS**, incluant les neuf scénarios tarifaires précédents.
- Build isolé final : **PASS**, 13 136 URL du sitemap contrôlées, plus les autres HTML indexables ; audit Explorer 2 478 pages PASS et budgets PASS (14 902 fichiers, 845,1 MiB). Les 56 fichiers de code/config/tests staged sont identiques à ceux de cette recette, y compris la seule garde de description dans CategoriesIndexPage.
- Chromium contre ce build de production local sur 8081 : **15/15 PASS**, FR/EN, erreurs de chargement, stockage multi-onglets et non-régression des tarifs.
- Design tokens : **PASS** ; fixture volontairement régressive **FAIL attendu**. Lint ciblé : **0 erreur / 17 warnings de types any**. `git diff --check` PASS.

Les fixtures de régression sont conservées dans le dépôt. Logs complets locaux : `/private/tmp/tooltrim-point23-unit-clean.log`, `typecheck-clean.log`, `seo-contracts-green.log`, `mastack-final.log`, `playwright-auto.log`, `browser-production.log`, `build-clean-final.log`, `lint-final.log` (chaque basename porte le même préfixe `tooltrim-point23-`).

## Limites conservées

- localStorage ne fournit pas de transaction entre processus : deux écritures exactement simultanées peuvent encore subir la règle du dernier écrivain. La synchronisation et les écritures successives sont couvertes ; ce suivi ne promet pas une atomicité distribuée.
- Le build reste volumineux et les avertissements de chunks Vite et de deux résumés llms absents restent visibles. Optimisation structurelle catalogue, migration des sources et triage des dépendances restent des chantiers séparés.
- Les warnings lint historiques sont conservés ; aucune certification lint globale, accessibilité exhaustive, Safari/WebKit ou infrastructure distante.
- La refonte préexistante CategoriesIndexPage et les données/catalogues non suivis restent dans le checkout. Seul le fallback de description anglaise nécessaire au typage est inclus dans ce fichier ; la recette isolée emploie sa version HEAD avec cette unique correction.
