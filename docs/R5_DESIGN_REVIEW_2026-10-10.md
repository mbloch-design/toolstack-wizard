# Explorer — passe design avant publication, 10 octobre 2026

Passe commencée le 10 octobre, reprise et finalisation le 12 octobre 2026.

## Périmètre et constat

Revue du build de production local R5, notamment Anima (hors pilote), Figma, Vercel et ChatGPT. La passe conserve les médias et cartes existants, les routes, le catalogue, les justifications et le classement. Elle porte sur la lecture et les contrôles de l’interface.

Constats avant correction : noms longs tronqués sur une ligne ; raison d’association à 12 px dans une couleur secondaire ; contrôle « Voir toutes les relations » de 19,5 px de hauteur ; boutons d’ajout de 42 px avec ombre et déplacement au survol. Les règles du design system demandent des surfaces et survols sobres.

## Corrections

- Noms sur deux lignes maximum avec le token de titre de carte existant. Hauteur commune en grille ; aucune hauteur vide réservée en colonne unique mobile. Le nom accessible complet reste disponible sur les liens.
- Raison d’association sur le token `--tt-size-card-body` (14 px), poids 500 et couleur texte ; elle conserve son contenu entier et précède la description.
- Contenu aligné en haut : les différences de longueur des noms et des raisons ne distribuent plus l’espace vide entre les lignes. Espacement média/contenu de 12 px.
- Boutons d’ajout de 44 × 44 px et effacement du filtre de 44 px de hauteur ; ombre et déplacement de l’ajout supprimés.
- Focus clavier des liens média, identité, fiche et ajout nettement visible, avec contour de 2 px. Le bouton superposé au média dispose aussi d’un anneau de séparation clair.
- Footer du hero autorisé à revenir à la ligne : le lien vers la fiche ne se comprime plus sur trois lignes à 768 px. Lien de fiche de 44 px de hauteur et suppression du déplacement de l’ajout du hero au survol.

Ces styles concernent les cartes Explorer, y compris les routes hors pilote. Les raisons R5 restent limitées aux sources auditées : leur absence sur Anima correspond au périmètre déjà documenté.

- Toutes les tailles typographiques du bloc Explorer utilisent les tokens existants : H1 `page-title`, H2 `section-h`, texte du hero `body`, noms `card-title`, descriptions/relations/contrôles `card-body`, surtitres `kicker`. Aucun nouveau token de taille n’est créé ; l’override mobile local du H1 est supprimé.
- À la demande de l’utilisateur, le paragraphe explicatif au-dessus des résultats et le surtitre de catégorie répété sont supprimés. Le compteur conserve seulement le nombre d’outils, sans la mention « classés par pertinence ». Les raisons propres à chaque carte restent visibles.

- Titres d’objectif longs : débordement reproduit à 320 px en FR/EN après harmonisation ; titre sous le bouton retour, sur toute la largeur en petit écran, avec retour à la ligne sûr. Deux parcours de régression ajoutés.

- Recette finale initiale : 9/10 ; ajout bureau intermittent après retour arrière (le contrôle invisible laisse le média intercepter le clic si le survol se perd). Le même parcours passe seul, confirmant la fragilité temporelle. Ajout maintenant visible et cliquable en permanence, sans animation de révélation ; marge de défilement du bouton pour le filtre fixe. Aucun clic forcé ni délai artificiel ajouté aux tests.

## Vérification

Revue visuelle en développement à 320, 390, 768 et 1440 px, Figma et ChatGPT FR/EN : aucun débordement sur les vues contrôlées. Vérification clavier réelle : bouton « Add Gemini to My stack » focalisé, contour opaque de 2 px et séparation blanche de 3 px. Mesures : effacement 44 px, ajout 44 × 44 px, raisons 14 px / 500.

Huit parcours existants R5 en développement PASS (18,0 s), intégrité des preuves PASS. Relecture CSS indépendante, remarques de rythme, focus et objectif intégrées, aucun blocage statique restant. Validation finale le 12 octobre : `npm run build` PASS (contrats SEO, 13 172 HTML équivalents, 2 480 routes Explorer contrôlées et budgets), `npm run typecheck` PASS, intégrité R5 PASS, `git diff --check` PASS. Recette Chromium sur preview de production : **10/10 PASS en 20,3 s**, avec ajout direct sans étape de survol et objectifs FR/EN à 320 px après chargement des polices. Les tests conservent une isolation du catalogue distant ; cette recette ne certifie pas les services externes ni la qualité éditoriale des relations. Aucune nouvelle assertion éditoriale n’est créée par les styles.

Captures de la recette finale :

- [Bureau FR](proofs/explorer-r5-design-2026-10-12/desktop-fr.png)
- [Objectif FR 320 px](proofs/explorer-r5-design-2026-10-12/objective-fr-320.png)
- [Objectif EN 320 px](proofs/explorer-r5-design-2026-10-12/objective-en-320.png)

Version locale sur `http://127.0.0.1:5197`, non publiée. Les preuves des premières passes R5 sont conservées.

## Roadmap

Cette passe ne clôt pas R5 éditorialement : 126/198 relations crédibles dans le top8, soit 63,64 % disponibles et 52,50 % des 240 places cibles. Les cas partiels et inconnus restent ouverts. Après la revue avant push, reprendre R6 sur les identités, rôles et tags dans le catalogue commun, puis rejouer le pilote.
