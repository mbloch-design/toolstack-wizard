# Registre des décisions design

Ce que Michael a validé, refusé ou demandé, pour que rien ne se perde d'une refonte à l'autre.

**Règles d'usage**
- Chaque validation, refus ou demande de Michael entre ici, datée, avec sa phrase, la règle qui en découle et la story qui la montre.
- Avant toute modification d'un module : relire les entrées qui le concernent.
- Une règle de contenu (ce qu'un module doit toujours dire) devient aussi un test de contrat (`src/test/ma-stack/StackHeroParts.test.tsx`, bloc « content contract »).
- Fin d'étape : un bilan gardé / perdu / à décider, ajouté en bas (« À arbitrer ») avant de commiter.
- Storybook ne garde que le vivant : une proposition est supprimée ou promue à la décision ; `npm run audit:ds-usage` (CI) refuse un composant sans usage.

## Process et outils

| Date | Décision | Règle | Où |
|---|---|---|---|
| 06/11/2026 | Refonte du process (« repartir d'une base saine ») | Composants React `src/ds` comme seule source, Storybook comme référence, CSS Modules, Stylelint, invariants, a11y, captures en CI | `docs/superpowers/specs/2026-11-06-design-process-design.md` |
| 09/11/2026 | « Continue dans le nettoyage, on fera une vraie repasse ensuite » | Migration fidèle d'abord, identité ensuite | |
| 09/11/2026 | « On doit aller plus loin côté molécule » | Un module n'écrit jamais son bouton, lien, montant, étiquette ou puce : il importe la molécule | Storybook, Molécules |
| 11/11/2026 | « Idem les molécules CTA », « Pourquoi tu n'as pas une logique de récupérer les molécules » | Toute interaction passe par une molécule (lien, bouton, puce, choix, sélecteur segmenté) ; le relevé de passe complète le vérifie | |
| 11/11/2026 | « Fais des vrais cleans de Storybook au fur et à mesure » | Pas de story morte ; `audit:ds-usage` en CI | |

## Typographie et couleur

| Date | Décision | Règle | Où |
|---|---|---|---|
| 09/11/2026 | « Trop gras, je veux retrouver de la vraie finesse » ; base D « mais plus équilibrée » | Graisses fines par rôle, compensées par la taille (64 : 280 … 12 capitales : 480 ; texte 370) ; Inter pour l'interface ; −30 en sombre | `src/ds/tokens.css`, Fondations / Typographie |
| 11/11/2026 | « Pas de structure typo », « tu oublies l'architecture et la structure typo » | Prémisse 64 (une par page) ; titre de section 42, un seul par section ; phrase de passage 16 sous le titre ; libellé de tuile 12 capitales ; fait de tuile 42, toujours un chiffre ; question 21 | Ma stack / Page |
| 11/11/2026 | « On quitte le design system avec les couleurs que tu proposes » | Couleurs de la planche seulement : neutres partout, une seule dose de lumière par page (l'aura), bleu sur les chiffres clés, orange pour le doublon, vert pour le gain | Fondations / Couleurs |
| 11/11/2026 | Aura : « bien plus diffuse et mêlée », « doit partir vraiment de la droite », « pas de cercles entiers », « hors de la page jusqu'au bord de la fenêtre » | Lavis d'aura coupé par le bord droit de la fenêtre, jamais sous le texte | `src/ds/Narrative` |
| 11/11/2026 | « Attention au contraste du bouton » | Près de la couleur, le bouton secondaire passe en variante posée (fond page, filet) | `Button` variant `raised` |

## Ma stack : structure

| Date | Décision | Règle | Où |
|---|---|---|---|
| 06/11/2026 | « Le budget est avant tout la vue d'ensemble », « je dois voir de manière macro, stack / budget » | Le coût de la stack est le fait premier de la page | Hero |
| 06/11/2026 | Répartition : « une box répartition, c'est tout » | Pas de jauge de coupe dans la répartition | `Split` |
| 09/11/2026 | « On n'ajoute pas de nouvelle box, de filet ou autre séparateur » | Agencement, taille, espace, groupe ; jamais de séparateur | |
| 09/11/2026 | « Il doit y avoir du rythme » | Quatre distances : 8, 24, 48, 96 (64 et 32 sur téléphone) | `--tt-gap-*` |
| 09/11/2026 | Bento évolutif, minimum de hauteur ; « une box de question qui n'a plus de question peut partir » ; « un vrai côté ludique » | Tuiles fixes (stack, répartition) et tuiles question qui partent une fois répondues | `src/ds/Bento` |
| 11/11/2026 | « Remets la pastille sur chaque carte » | Grille d'inventaire continue, pastille de domaine sur chaque carte | `ToolCard` |
| 11/11/2026 | « Quand on clique sur plus de détail, il gagne de l'espace sur la largeur, les autres box se réduisent ; la zone garde une hauteur identique » | Une tuile ouverte s'élargit dans sa rangée ; ses voisines se resserrent ; hauteur de rangée fixe | `BentoRow` |
| 11/11/2026 | « On a perdu pas mal de niveau de détail », « quid d'agrandir la box » | Le module complet devient le détail de sa tuile | `Tile detail` |
| 11/11/2026 | Hero : « un vrai hero », « divise la hauteur par 2 », « le système visuel à droite est naze », « pas une mise en boîte » | Hero sans boîte, sans illustration, une bande courte | `StoryHero` |
| 11/11/2026 | « Notre page doit raconter une histoire » ; « tu as oublié le bento » | Le bento est le récit : chaque tuile est un chapitre (Où va l'argent, Ce qui se recoupe, Ce qui sert vraiment, Résultat) | Ma stack / Page |
| 11/11/2026 | « Enlève le séparateur » | Pas de fil pointillé entre les chapitres | |

## Contrat de contenu de Ma stack

Ce que la page doit toujours dire, quel que soit son dessin (testé) :
- le coût par mois et par an ;
- ce que la stack contient (payants, gratuits, à préciser) ;
- jusqu'où les prix sont connus, et la prochaine question à ouvrir ;
- le taux de référence quand un montant est converti ;
- les outils sans prix, laissés hors des chiffres de la répartition ;
- l'économie déjà faite, en mots ;
- le nom de chaque outil (inventaire).

## À arbitrer

Perdus pendant les refontes du 09 au 11/11/2026 (bilan du 11/11) :
- [ ] L'humour d'accueil (« 9 petites décisions vous attendent. Promis, aucune ne mord. ») : le hero porte maintenant le coût.
- [ ] La décision au repos (« Rien à trancher. Profitez-en, ça ne dure jamais très longtemps. »).
- [ ] La flèche verte devant l'économie.
- [ ] Le surtitre « Étape suivante » qui guide la première visite après l'accueil.
- [ ] L'appel « Répondre à la première » (la question est juste sous le hero).

Rétablis le 11/11/2026 : le taux de référence (hero) et la note des outils sans prix (détail de la répartition).
