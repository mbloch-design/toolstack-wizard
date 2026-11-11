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
| 11/11/2026 | Boutons : « je préfère la base de la planche », « sois très rigoureux » ; trois versions côte à côte, « go sur le 2 » | Actions (boutons, liens d'action, sélecteur segmenté) en Inter Tight comme la planche, 460 (430 en sombre), interlettrage 0, interligne 1 ; 16, sélecteur 15 ; hauteurs 40 / 52 / 36 ; même graisse sur l'encre. Le reste de l'interface garde Inter fin | `--tt-action-*`, `Button`, `Segmented` |
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

## Navigation (chantier ouvert le 11/11/2026)

| Date | Décision | Règle | Où |
|---|---|---|---|
| 11/11/2026 | « On passe à la navigation : menu de gauche, barre du haut, fil d'Ariane, éléments de navigation à droite » | Chantier coquille : bureau et téléphone (barre d'onglets du bas, menu) | `src/ds/Shell` |
| 11/11/2026 | Ma stack : « les deux » | Une entrée Ma stack dans la barre latérale, avec son compteur (cible du geste « le logo vole jusqu'à la stack ») ; le bouton en haut à droite reste l'appel principal | |
| 11/11/2026 | Réglages : « un menu en haut à droite » | Langue, devise et thème quittent la barre latérale pour un menu en haut à droite, état écrit en clair ; la barre latérale ne garde que la navigation | |
| 11/11/2026 | « Garde le logo replié » | Barre repliée : le petit signe ToolTrim reste ; le bouton pour déplier prend sa place au survol ou au focus clavier | `Sidebar mark` |
| 11/11/2026 | « Resserre à 16 px et applique au site » | Logo et liste à 16 px ; la coquille du système remplace l'ancienne sur tout le site (`AppShellV2`, `ShellMenuBody`) | `src/ds/Shell` |
| 11/11/2026 | « On n'a plus les séparateurs, ça manque de structure ; pas forcément un filet, mais là ça flotte » | Structure par la matière : la navigation (barre latérale, barre du haut, onglets) sur le gris des tuiles (`--tt-chrome`), le contenu posé dessus comme une feuille blanche aux coins hauts arrondis ; le lien courant se soulève en blanc | `src/ds/Shell`, `.shell-*` |
| 11/11/2026 | « Le fil d'Ariane doit être mieux posé, peut-être un picto ; attention à l'alignement » | Fil d'Ariane dans une pastille blanche qui s'ouvre sur une maison, pendant de la recherche ; la barre du haut s'aligne sur les bords de la feuille (fil à gauche, Ma stack à droite) | `Crumbs homeIcon` |
| 11/11/2026 | Accueil : « la zone du fil d'Ariane est vide, un truc malin à y mettre ? » ; choix « Bonjour et état de la stack » | Sur l'accueil, la pastille dit bonjour (prénom, moment de la journée) et l'état de la stack (outils, coût selon les règles de Ma stack), et mène à Ma stack ; sans outil : « Votre stack en deux minutes » | `ShellNote`, `HomeGreeting` |
| 11/11/2026 | Fusion avec le chantier back-office | En back-office, la coquille garde ses sections à la place des lieux du site, pas de recherche ni de Ma stack, « Me déconnecter » en haut, la langue en lien dans la barre latérale, un bouton « Ouvrir le menu » sur téléphone | `AppShellV2` (`isAdmin`) |
| 11/11/2026 | Planche « Naviguer » | Lien actif : fond gris et trait bleu de 3 px à gauche ; fil d'Ariane en note, page courante appuyée, séparateur « / » en filigrane ; jamais de rond qui tourne au chargement | |

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

Rien en attente.

Arbitrés le 11/11/2026 (bilan des refontes du 09 au 11/11) :
- [x] Humour d'accueil : revient, en fin de lead du hero, sous le coût. Appliqué, testé.
- [x] Décision au repos : la tuile question part ; la phrase « Rien à trancher. Profitez-en, ça ne dure jamais très longtemps. » passe dans le lead du hero. Appliqué, testé.
- [x] Flèche verte : abandonnée, le montant vert de la tuile Résultat suffit.
- [x] « Étape suivante » : gardé, en surtitre de la tuile question. Appliqué, testé.
- [x] « Répondre à la première » : abandonné, la question est juste sous le hero.

Rétablis le 11/11/2026 : le taux de référence (hero) et la note des outils sans prix (détail de la répartition).

## Planche du 30/10 : ce qui manque dans le système (relevé complet du 11/11/2026)

Michael, 11/11/2026 : « Il y a beaucoup de choses que l'on avait mis en place que je ne retrouve pas ici », puis « il y a pas mal de choses que tu n'as pas pris en compte encore ». Relevé section par section de la planche (https://claude.ai/artifact/9yUnHazHRZSXiSPdo8twAK), comparé aux stories de `src/ds`.

Abandonné : le clic des ciseaux du logo (Michael, 11/11).

### Fait
- [x] Bouton qui mène : matière, liseré, ombre, soulèvement, lumière qui suit le pointeur, filet P3 au survol.
- [x] Typographie des actions (arbitrage option 2).
- [x] Flèche de l'appel (deux flèches qui se relaient) et flèche de lien.
- [x] Trois verbes en étiquette (Garder, Remplacer, Ajouter).
- [x] Chargement par reflet.

### Interactions (« Un bouton est un objet qui répond »)
- [ ] Étoile filante qui parcourt le contour du bouton qui mène.
- [ ] Attraction de 3 px vers le pointeur ; pression −2 % et retour à ressort en 280 ms.
- [ ] « Ajouter à ma stack » : la coche se dessine, le compteur défile (2 → 3).
- [ ] « Envoyer » : un fil de progression, puis « Envoyée ».
- [ ] Sélecteur « Mensuel / Annuel −20 % » : l'économie en vert dans l'option.

### Contrôles (« Chaque contrôle du site, au même niveau de finition »)
- [x] Carte de verdict : « Garder Notion », « Garder les deux », le montant suit le verbe (existait ; « Remplacer par » viendra avec l'Explorer).
- [x] Carte de décision : anneau bleu du choix retenu (existait), coche qui rebondit et se dessine, autres choix qui s'effacent en 180 ms, économie en vert sans flèche (contraste 4,51:1) ; pied « Comparer en détail » et budget estimé (existaient).
- [x] Question de formule : temps de travail par formule et « Gratuite ou payante, on ne juge pas » (existaient).
- [ ] Rangée d'outil avec son verbe (Garder, Ajouter).
- [ ] Infobulle : monte de 4 px en fondu, au survol et au focus.
- [ ] Retrait avec annulation : le délai est une ligne de coupe que les ciseaux remontent.
- [ ] Chargement : une phrase qui patiente (« On aiguise les ciseaux… »).
- [ ] Case à cocher (« Prévenir quand le prix change »).
- [ ] Menu de compte.
- [ ] État vide : « Votre stack est vide. Ajoutez un premier outil : ToolTrim le range par domaine. »
- À trancher : la planche garde la carte de décision au repos avec le carnet des choix faits ; le registre du 11/11 la fait partir (phrase dans le hero).

### Données (« Le chiffre est le héros »)
- [ ] Chiffres en cascade : les barres se remplissent une fois, en cascade.
- [ ] Deux prix face à face, avec l'écart en vert.
- [ ] Variation : vert pour une économie, orange pour un surcoût.

### Gestes (« Huit gestes, à jouer »)
Carte de décision au repos : arbitrage du matin maintenu (la tuile part, la phrase va dans le hero), Michael 11/11.
- [ ] Ajouter : le logo vole jusqu'à la stack, le compteur rebondit.
- [ ] Couper : deux chutes de papier tombent.
- [x] Garder : le tampon « Gardé » se pose sur l'outil gardé d'un doublon (`Stamp`).
- [x] Doublon : les deux logos de la question se rapprochent, « Doublon », un seul reste, au moment où l'on tranche (`Meet`).
- [x] Économiser : l'économie de la tuile Résultat défile chiffre par chiffre (`Amount roll`).
- [ ] Copier : l'icône devient une coche, le libellé glisse. Aucun lien à copier sur Ma stack : viendra avec le partage (retiré du système pour ne pas garder de composant sans usage).
- [x] Survoler : les cartes de l'inventaire s'inclinent, un reflet suit le pointeur (`Tilt` dans `ToolCard`).
- [x] Le trim : la carte retirée de l'inventaire tombe (`ToolCard leaving`) ; la séquence complète se joue une fois dans la tuile Résultat quand une décision « garder l'un » fait économiser (Michael, « go sur tout », 11/11) : la ligne de coupe court, les doublons tombent (l'un s'accroche un instant), ce qui reste se resserre, l'économie s'affiche.
- [ ] Le fil : la ligne de coupe aux couleurs de l'aura (refusé entre les chapitres le 11/11 ; reste possible sous une économie).

### Hors Ma stack (chantiers suivants)
Fil d'Ariane, barre latérale et onglets, recherche ⌘K, pied de page, question fréquente, note ToolTrim, historique de prix et tableau de formules, formulaire de soumission, plaques de logo 28 à 80.
