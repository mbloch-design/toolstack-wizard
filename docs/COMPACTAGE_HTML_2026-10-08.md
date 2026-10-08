# Compactage du HTML généré — 8 octobre 2026

Statut : compactage vérifié ; recette de publication complétée après intégration de main.

## Résultat

Comparaison avec le build isolé des dépendances publiées (`00e1f48bd8`), sur le même catalogue et le même ensemble de fichiers :

| Mesure | Avant | Après |
|---|---:|---:|
| Artefact complet | 845,2 MiB | 820,6 MiB |
| HTML | 733,6 MiB | 709,0 MiB |
| Fichiers | 14 908 | 14 908 |
| Documents HTML | 13 162 | 13 162 |
| URL du sitemap | 13 137 | 13 137 |

Gain exact : **25 816 519 octets, soit 24,62 MiB (2,91 % de l'artefact)**. Il s'agit de la taille des fichiers générés, pas d'un gain équivalent garanti sur le transfert HTTP déjà compressé.

## Transformation autorisée

- Neuf commentaires documentaires du template source sont sélectionnés par leur rôle et retirés du head uniquement si leur texte correspond exactement. Les commentaires de vérification, les commentaires conditionnels et les marqueurs React sont conservés.
- Les espaces de mise en forme entre les enfants directs du head sont retirés. Aucun remplacement global des espaces : les textes visibles, attributs, styles et scripts restent inchangés.
- Les blocs JSON-LD sont compactés après parsing ; leurs valeurs sont vérifiées. Le caractère `<` est échappé pour éviter toute fermeture accidentelle d'un script. Un JSON malformé ou une valeur modifiée fait échouer le build.

Le parseur HTML utilise les positions du document source ; le document complet n'est pas réécrit par un sérialiseur. Les données de prix FR/EN et tous les bootstraps d'hydratation sont conservés : la version française des prix sert aussi à des calculs en anglais.

## Garde de publication et preuves

- Avant l'écriture de chaque HTML, une empreinte de son arbre parsé compare la structure, tous les attributs, les textes, les scripts, les styles, les templates et les commentaires conservés. Seules les transformations autorisées ci-dessus sont ignorées. **13 162 équivalences PASS** pendant le build complet.
- Liste des fichiers identique ; liste ordonnée des URL du sitemap identique ; **tous les fichiers hors HTML identiques octet pour octet** au build précédent, dont JavaScript, CSS et médias.
- Validation SEO générée : **13 137 URL rendues, indexables, auto-canoniques et hreflang valides PASS** ; audit Explorer **2 478 pages PASS**.
- Tests applicatifs **243 PASS** ; fixtures SEO/compactage **22 PASS**, dont six tests de compactage ajoutés à la commande CI existante ; TypeScript app/node PASS ; build complet PASS.
- Chromium : **15/15** régressions FR/EN sur le build compacté. La première recette utilisait Vite preview, qui renvoie la coque SPA sur certaines URL propres : elle ne suffisait pas à prouver l'absence d'erreurs d'hydratation du HTML prérendu. Le complément ci-dessous utilise les fichiers HTML générés réellement servis aux bonnes URL.
- Relecture indépendante : aucune anomalie actionable ; les six tests de compactage ont également été exécutés par le reviewer.
- Budgets abaissés de 24 MiB : total **836 MiB**, HTML **721 MiB**, autres plafonds inchangés. Le nouvel artefact passe ; l'ancien est rejeté sur ces deux budgets.

Mesures exactes : `output/tooltrim-html-compaction-2026-10-08/verification.json`.

Cette passe conserve les signaux SEO techniques et le contenu initial ; elle ne mesure pas les positions dans les moteurs de recherche. Les avertissements de gros chunks et les deux résumés llms manquants préexistants restent visibles. Aucun changement de routes, de composants éditoriaux ou de dépendances catalogue ; refonte locale des catégories exclue.

## Complément de recette avant publication

- 25 commits main de Ma stack intégrés sans modifier leur interface. Version fusionnée : 248 tests applicatifs, 98 tests Ma stack, 22 fixtures SEO/compactage, TypeScript et build PASS. Gain et budgets conservés : 820,6 MiB, 13 162 équivalences HTML et 13 137 URL validées.
- Le test multi-onglets conserve les mêmes assertions ; ses sélecteurs utilisent désormais les libellés « Abonnement payant pour Figma/Canva » introduits par main. 15/15 scénarios PASS sur un serveur temporaire servant les HTML prérendus exacts, puis leurs assets.
- Limite préexistante : Notion EN déclenche les erreurs React d'hydratation #418/#422 sur ce HTML réel, et les mêmes erreurs sont reproduites sans instrumentation sur la production avant publication. FR ne présente pas ces erreurs. Restaurer les champs FR retirés du bootstrap EN rétablit exactement le rendu serveur de Notion EN : diagnostic conservé dans l'audit d'hydratation. Le compactage conserve ces données à l'identique et ne corrige pas ce défaut.
- Contrôle de design : ÉCHEC déjà présent dans main (8 couleurs CSS, 18 rayons CSS et 2 styles inline au-dessus de la baseline). Les fichiers analysés sont identiques entre origin/main et la fusion du compactage ; aucune dette supplémentaire attribuable à ce lot. La baseline reste inchangée.
