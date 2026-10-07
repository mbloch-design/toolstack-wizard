# ToolTrim — revue technique du 7 octobre 2026

## Conclusion

Le frontend dispose d’une base exploitable (routes lazy, snapshots légers, catalogue par fragments, stack locale versionnée). Les risques prioritaires concernent la confiance dans les soumissions, la maintenance serveur, l’identité des données pendant la navigation et les contrôles de livraison. Les tests existants pouvaient passer malgré ces défauts d’intégration.

Revue menée avec Superpowers : diagnostic systématique, analyses parallèles architecture / sécurité / livraison, reproductions locales, tests écrits avant correction, contre-revue indépendante et vérification finale. L’audit couvre le dépôt actuel, y compris les chemins legacy encore consommés. Il ne certifie ni la production ni la configuration effective des services distants.

## Corrections locales réalisées

| Sujet | Correction | Preuve |
|---|---|---|
| Licences uniques et tarifs annuels | Montant natif et période réels ; aucune période mensuelle inventée | Tests helper et navigateur Ableton / Logic Pro FR/EN |
| Zéro ≠ gratuit | Gratuité explicite, essai, devis et prix absent distingués dans cartes, tableau et FAQ du comparatif | Tests helper et navigateur ; placeholder gratuit générique écarté |
| Budget incomplet | Coût inconnu affiché comme tel ; total partiel signalé si certains prix manquent | Tests Ma stack FR/EN |
| Économies persistées | Devise enregistrée puis conversion depuis cette devise ; anciennes décisions conservées sans montant deviné | Reload EUR→USD, suivi stack puis comparatif |
| Remplacement vers prix inconnu | Pas d’économie chiffrée si un des deux coûts manque | Test navigateur ChatGPT→ADP |
| ChatGPT / Claude | Guide existant des applications web utilisé pour les sections et le pitch ; pas de description API associée aux prix web | Tests navigateur FR/EN ; données catalogue inchangées |
| Comparaison et retour SSR | Paire précédente masquée pendant navigation, payload SSR restauré et réponse tardive ignorée | Trois tests hook rouges avant fix puis verts |
| Maintenance Supabase | POST + clé serveur SEED_ADMIN_KEY/x-admin-key avant création du client privilégié | 16 tests exécutant les handlers réels avec DB simulée ; 401/403/405/503 sans write |

La correction maintenance n’est pas déployée. Les scripts appelants doivent utiliser POST et la clé serveur configurée, selon le contrat déjà employé par les autres seeds. La configuration absente ferme l’accès (503). Aucun secret lu ou diffusé.

Le catalogue Logic Pro contient un libellé générique ambigu, sans prix attesté dans ces données. Le comparatif affiche désormais un manque de prix. La [page Apple officielle](https://www.apple.com/logic-pro/) distingue essai, abonnement Creator Studio et achat individuel : ce contrôle confirme que le placeholder ne constitue pas une preuve de gratuité. Aucune nouvelle grille tarifaire n’a été injectée.

## Risques encore ouverts — ordre de traitement

P1 = risque important de sécurité, de données ou de livraison ; P2 = défaut fonctionnel reproductible ou robustesse. Aucun P0 établi.

| Priorité | Constat vérifié | Emplacement principal | Suite recommandée |
|---|---|---|---|
| P1 | paid:true et badgeReview:false sont des déclarations client ; paiement ou badge contournables dans la validation email | api/contact.ts ; SubmitToolPage.tsx | Vérifier transaction liée côté serveur ; dériver les contrôles depuis cet état |
| P1 | Le premier gate CI vise sept tests diagnostic supprimés et termine avant les contrôles utiles | preprod-ci.yml ; validate-creative-diagnostic.mjs | Réaligner CI sur les suites du produit conservé |
| P1 | tsc --noEmit sur la racine analyse zéro fichier | tsconfig.json ; workflow ; verify:preprod | Contrôles explicites app/node ; traiter les diagnostics réels avant passage en gate obligatoire |
| P1 | Un HTML avec root vide et canonical passe la validation SEO ; les erreurs SSR peuvent être remplacées par des métadonnées | vite.config.ts ; validate-generated-seo.mjs | Échec explicite du SSR indexable + contrôle du contenu et couverture attendue |
| P2 | Cluster de substitution utilisé comme famille : Obsidian devient extension de Notion, Claude de ChatGPT | toolExploration.ts | Séparer famille/hôte et alternatives ; tester données réelles |
| P2 | Pages hôte vides après navigation depuis fiche SSR : rafraîchissement sauté et snapshot sans formFactor | useSupabaseData.ts ; HostPage.tsx | Exemption SSR limitée à la route courante et fallback visible |
| P2 | Stack absente ou shard échoué reste loading:true après résolution | useStackDetailData.ts | État de tentative terminé distinct de correspondance d’identité |
| P2 | Plans et décisions ne suivent pas storage ; un onglet peut écraser les choix d’un autre | useStackPaidPlans.ts ; useStackDecisions.ts | Invalidation / notifications entre onglets, tests d’écritures successives |
| P2 | Une décision null dans JSON valide provoque un crash au rendu | useStackDecisions.ts ; StackOverlapPairs.tsx | Valider chaque entrée et préserver les entrées valides |
| P2 | Shards stack à noms stables : force-cache + immutable un an | useStackDetailData.ts ; vercel.json | Revalidation comme les outils ou noms versionnés |
| P2 | Guides locaux sans id et guides distants à id numérique rejettent l’index Orama ; fallback conservé | useCatalogSearch.ts ; mapPost ; SearchModal.tsx | Identité stable par slug/lang et mapping UI cohérent |
| P2 | Playwright attend 8080, Vite sans port démarre normalement sur 5173 | playwright.config.ts | Port explicite strict ou URL d’un artefact identifié |
| P2 | Emails automatisables : protections applicatives de débit/déduplication absentes | api/contact.ts ; submission-progress.ts | Limitation persistante, déduplication et protection de la soumission |
| P2 | npm audit --omit=dev signale 25 entrées de dépendances (20 high, 4 moderate, 1 low ; 0 critical) | package-lock.json | Triage des avis et correctifs compatibles, puis recette ; pas de audit fix --force |

L’audit npm inclut les paquets déclarés production qui servent au build (Vite/Tailwind/PostCSS). Les 25 entrées incluent propagation aux dépendants, pas 25 exploits autonomes. DOMPurify et React Router sont aussi signalés. Le rapport JSON contient plages, avis et liens ; aucune exploitabilité propre à ToolTrim n’est démontrée par ce seul inventaire.

Observation distincte : DataFast est chargé et absent des prestataires présentés dans la page de confidentialité. Mettre l’information à jour ; aucune conclusion juridique sur le consentement d’un service cookieless tirée de cette observation.

## Vérifications et portée

- Suite générale en environnement prévu jsdom : **218/218 tests, 39 fichiers PASS** sur les changements finaux. Le forçage node provoque deux erreurs document is not defined dans des tests DOM ; ce mode de verify:preprod doit être corrigé.
- Ma stack : 80 tests PASS avant le dernier test du placeholder ; la suite générale finale inclut ce test supplémentaire.
- Régressions navigateur : **9/9 PASS** sur serveur local de sources, backend Supabase bloqué volontairement pour exercer les fallbacks.
- Reproductions architecture : 7 probes initiales établissent les bugs ; elles ne constituent pas un certificat de bonne santé. Les trois régressions SSR sont maintenant permanentes.
- TypeScript réel : 38 diagnostics baseline et 38 identiques après correction, aucun diagnostic ajouté dans les fichiers corrigés. Le succès de la commande racine ne vaut pas validation.
- Lint global interrompu : eslint . parcourt aussi les nombreuses copies/artefacts du checkout et ne fournissait pas de verdict borné. Contrôle ciblé des fichiers corrigés : zéro erreur, cinq warnings existants de hooks/fast-refresh ; ne pas le présenter comme lint global réussi.
- Build production : effectué dans une copie isolée des fichiers suivis et corrections nécessaires. Les fichiers modifiés par le build et la purge d’anciens artefacts restent dans cette copie. **PASS final** (exit 0), SEO/sitemap/Explorer/budgets inclus. 14 899 fichiers, 845,2 MiB dont 733,7 MiB HTML, 4,8 MiB JS et 35,1 MiB CSS. Contrôle additionnel : 2 478 fiches outils FR/EN ont exactement un H1 et aucun root vide. Cette preuve HTML ne valide pas toute l’hydratation.
- Audit UI préalable : 11 routes, desktop 1440 et mobile 390 (22 rendus), contenu/H1, erreurs page et débordement ; cinq scénarios de décision. Aucune certification accessibilité exhaustive ou Safari/WebKit. Un test mobile Escape intermittent a échoué une fois puis passé deux répétitions, cause non établie.

Aucune mutation DB, soumission réelle, email, déploiement, installation ou mise à jour de dépendance. Aucun test offensif d’endpoint de maintenance : il aurait écrit avant correction. RLS/Auth/WAF/transactions réellement déployés restent à vérifier séparément.

## Performance et dette

Le build snapshot final a produit main JS ~749 kB (gzip ~228 kB), index outils ~1 448 kB (~340 kB gzip), comparatif ~432 kB (~124 kB gzip), index stacks ~487 kB (~86 kB gzip). Ce sont tailles de fichiers, pas des mesures Core Web Vitals. Les budgets d’artefact existants passent sur ce build. Le total 845,2 MiB est proche du plafond 860 MiB : surveiller la croissance HTML. Deux pages de guide n’ont pas de résumé source dans le générateur llms, avertissement non bloquant à corriger. Aucune optimisation structurelle des sources pendant la migration catalogue.

useStackAccount n’a aucun consommateur actif : ses risques de merge/éditions concurrentes sont dette dormante, pas incident actuel. Les sources fiche canonique, liste/comparatif legacy et snapshot hybride restent une limite explicite de migration. tsx est utilisé par le build mais seulement transitif dans le lock : le déclarer directement fiabilisera un prochain lot.

## Preuves détaillées

Les sous-rapports conservent les emplacements et reproductions initiales ; les statuts de correction ci-dessus font foi après intervention :

- [Architecture](../output/tooltrim-technical-review-2026-10-07/architecture.md)
- [Sécurité](../output/tooltrim-technical-review-2026-10-07/security.md)
- [Livraison, SEO et recherche](../output/tooltrim-technical-review-2026-10-07/quality.md)
- [Tests et journaux](../output/tooltrim-technical-review-2026-10-07/)
- [Audit produit initial](AUDIT_PRODUIT_2026-10-07.md)

La modification préexistante CategoriesIndexPage.tsx et les travaux catalogue non suivis ne sont pas inclus dans le lot de corrections. Le snapshot build contient la modification de page présente, sans l’altérer ni la revendiquer.
