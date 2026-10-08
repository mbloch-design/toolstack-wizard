# Compactage du HTML généré — 8 octobre 2026

Statut : implémentation locale vérifiée, sans push ni déploiement de ce lot.

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
- Chromium : **15/15** régressions FR/EN sur le build compacté. Quatre pages supplémentaires (Notion FR/EN, guide facturation, stack agence créative) : H1 présent sans JavaScript ; après chargement JavaScript, aucune exception de page ni erreur d'hydratation détectée.
- Relecture indépendante : aucune anomalie actionable ; les six tests de compactage ont également été exécutés par le reviewer.
- Budgets abaissés de 24 MiB : total **836 MiB**, HTML **721 MiB**, autres plafonds inchangés. Le nouvel artefact passe ; l'ancien est rejeté sur ces deux budgets.

Mesures exactes : `output/tooltrim-html-compaction-2026-10-08/verification.json`.

Cette passe conserve les signaux SEO techniques et le contenu initial ; elle ne mesure pas les positions dans les moteurs de recherche. Les avertissements de gros chunks et les deux résumés llms manquants préexistants restent visibles. Aucun changement de routes, de composants éditoriaux ou de dépendances catalogue ; refonte locale des catégories exclue.
