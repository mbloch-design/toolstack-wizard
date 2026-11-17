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
| 11/11/2026 | « N'hésite pas à utiliser la logique liquid glass quand c'est nécessaire » | Verre liquide (`--tt-glass-*`) seulement pour ce qui flotte au-dessus du contenu : barre d'onglets, menus, infobulle, barre d'outils collée. Jamais sur une surface posée dans la page | `src/ds/tokens.css` |
| 11/11/2026 | « Le point lumineux, plus fin et délicat » | Étoile filante de la planche à 55 % de son épaisseur, demi-intensité, filet à 14 % | `Button` |
| 11/11/2026 | « Fiche latérale, formulaires : on fait un vrai design system » ; « tout ce que je n'ai pas précisé, tu dois connaître ton taf » | Toute la planche passe dans `src/ds`, page par page ; fiche latérale flottante (16 px des bords, 28 px d'arrondi, voile flouté) ; formulaires de la planche (`Field`, `TextAreaField`, `SelectField`, `Checkbox`, `FormGrid`) | `Drawer`, `Field` |
| 11/11/2026 | « Côté catalogue, un gros travail de mise à plat : tout le design n'a rien à voir avec le reste » | Les sept pages du catalogue passent sur le système, en commençant par Outils : titre de page, puces de besoin, filtres dans la fiche latérale, « À la une » en cartes média, étagères en rangées d'outils | `src/ds/Catalog`, `ToolsPage` |
| 11/11/2026 | « Pourquoi tu ne différencies pas le bouton filtre des autres boutons ? » | « Filtres » est une action, pas un besoin : pilule posée à part du rail, icône, nombre de filtres actifs en pastille d'encre | `FiltersButton` |
| 11/11/2026 | « La barre est mal réfléchie, les boutons sont cassés, on ne voit pas qu'on peut les déplacer » ; « attention aux espaces, entre le titre et la barre » | Barre à 24 px sous le titre ; rail qui s'estompe du côté où il reste des besoins, flèches rondes sur ordinateur ; contours et anneau de focus jamais coupés ; collée sous la barre du haut, en verre | `FilterBar` |
| 12/11/2026 | « La barre mal positionnée, pas assez affirmée » ; « quid de la mettre en bas d'écran ? » ; « flash », « pas de fondu enchaîné, pas de bricolage » | Sous le titre, la barre est claire et à sa place (chapô réservé sur deux lignes : elle ne bouge jamais d'une catégorie à l'autre). Dépassée, elle flotte en bas d'écran sur la largeur du contenu, en verre fumé (les puces s'inversent), monte en 360 ms et redescend en 300 ms avant que la barre claire ne revienne : jamais deux endroits qui changent dans la même image | `FilterBar`, `--tt-smoke-*` |
| 12/11/2026 | « Nouvelle page, la page monte, la barre part : pas du tout ok » ; « tout saute » (mesuré : téléportation de 1 500 à 178 px) ; arbitrage « remonter en douceur » | Un filtre depuis le bas de la liste : la page remonte en douceur, la barre reprend sa place, puis le filtre s'applique. Pas de fondu enchaîné ; les captures apparaissent en fondu à leur chargement | `runCatalogFilter`, `ToolMediaCard` |
| 12/11/2026 | « Manque de fraîcheur, exploite le flou » ; « ratio original » ; « pas de coupure nette » ; « les textes flottent » | Carte média : capture entière au ratio des aperçus (40:21), fondue dans sa propre couleur floutée qui teinte la carte ; sans capture, le logo agrandi et flouté colore la carte. Étiquettes en pilules de verre sombre (catégorie, prix ; Sponsorisé en verre clair) ; légende en grille fixe : logo, nom 18 px sur une ligne, raison sur une ligne réservée ; retrait unique 16 px (12 en petite) | `MediaCard`, `--tt-card-*` |
| 12/11/2026 | « Pourquoi des pictos différents pour l'ajout ? Harmonisation d'action » | L'ajout à ma stack est le signet partout (coché, fond vert une fois ajouté), cartes comprises | `MediaCard` `.action` |
| 12/11/2026 | « Pas d'effet 3D, mou, grossier, l'ombre pique » | Survol : la carte monte de 1,5 px en 700 ms sans rebond, ombre en trois couches légères, bord en liseré de 0,5 px au-dessus de la couleur ; aucune inclinaison | `--tt-card-lift`, `--tt-card-edge` |
| 11/11/2026 | « Payant uniquement » débordait du sélecteur | Chaque option du sélecteur segmenté prend la largeur de son libellé ; la pastille se cale sur l'option réelle | `Segmented` |
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

## Comparatifs éditoriaux

| Date | Décision | Règle | Où |
|---|---|---|---|
| 12/11/2026 | « le champ `situation` des scénarios n'est jamais affiché : rends-le visible dans la carte de scénario pour qu'on comprenne à quel cas d'usage la recommandation répond » | La carte « Notre avis » affiche la situation du scénario au-dessus du choix, en 12 px muted : le cas d'usage d'abord, l'outil ensuite | `ComparisonDecisionPage`, `.cp-glance-situation` |

## Section agents (chantier ouvert le 16/11/2026)

| Date | Décision | Règle | Où |
|---|---|---|---|
| 17/11/2026 | Après la livraison S1 : « un peu brut de décoffrage. On doit accompagner, pas faire un énième annuaire » | La section part de la personne (ce qu'elle veut faire, ses outils), pas de la liste des serveurs. Une fiche raconte ce que ça change, notre avis, comment brancher et garder la main ; la technique (commandes, liste d'outils) passe en fin de fiche. La liste complète reste, mais en bas du hub, pas en ouverture. Vocabulaire de surface sans jargon (MCP, OAuth, local/distant) | `/agents`, `/mcp/:slug`, `/skills/:slug`, `AgentAccess` |
| 17/11/2026 | Sur la fiche : « revois la partie pour aller plus loin, plus digest, l'action copier-coller » ; « ça aussi » (liste des outils) ; sources ; puis, captures Toolfolio à l'appui : « je veux que ce soit ici plus fonctionnel et lisible » | Branchement guidé par client avec copie nommée ; outils par sujet, action en français, risque par ligne ; sources en liens courts ; bouton « Copier pour votre assistant » et son menu (Markdown, ouvrir dans ChatGPT ou Claude, commande, Cursor, VS Code) ; ligne de faits à icônes sous le titre ; cartes avec logo, éditeur et deux faits. Fonctions reprises, jamais les textes | `AgentSheet`, index, ROADMAP S1 bis |
| 17/11/2026 | Sur le menu « Copier pour votre assistant » : « c'est fini ? ça manque de picto » | Chaque entrée de menu porte une icône (Iconoir ou logo du client) et une ligne d'aide ; les assistants de « Fonctionne avec » portent leur logo à côté du nom | `AgentSheet` (menu, ligne de faits) |
| 17/11/2026 | Sur la liste des actions de Notion : « plus lisible ici, c'est des bouts de texte mis bout à bout, il y a une meilleure affordance à avoir » | Une action = une rangée structurée, pas une ligne de texte : libellé et identifiant empilés à gauche, pastille de risque dans une colonne alignée à droite ; la lecture a aussi sa pastille (« Lit ») pour que la colonne soit complète ; rangées posées comme des objets (fond blanc sur la tuile), sans filet ; filtre par risque en tête de liste | `AgentSheet` (liste des actions) |
| 17/11/2026 | Sur la grille « Fiche technique » : « quel intérêt ? » | Retirée : chaque case répétait un autre bloc (accès, date, nombre d'actions) ou n'aidait pas à décider (éditeur, date d'ajout au répertoire, assistants marginaux). L'adresse du serveur vit dans « Brancher » (choix « Autre outil »), la date dans « Sources ». Règle : un fait n'apparaît qu'une fois, et seulement s'il aide à décider ou à agir | `AgentSheet` |
| 17/11/2026 | Sur « Ce qu'il peut faire, et comment garder la main » : « je ne comprends pas ce que l'on dit ici » | Le chapitre répond en phrases à trois questions, sans libellés en capitales ni code de vocabulaire : ce qu'il peut faire chez vous ; comment garder la main (gestes concrets, sourcés) ; quel forfait (le cas courant d'abord, les options avancées en mots simples). Aucun libellé générique (« Réglages pour l'administrateur ») sans dire quoi | `AgentSheet` |
| 17/11/2026 | Sur l'en-tête de la fiche Notion : « bordel » | En-tête calme : un seul bord gauche ; logo et titre sur une ligne, titre sur une ligne à bureau ; une phrase d'accroche qui dit l'essentiel (ce qu'il fait, forfait, en un clic depuis…) et remplace sous-titre, faits et paragraphe ; une action principale et un lien vers « Brancher » ; pas de logos flottants, pas de rangée de 7 pastilles (les assistants vivent dans « Brancher ») ; cartes de citation sans ombre portée | `AgentSheet` (en-tête) |
| 17/11/2026 | Après l'étape 1 : « ça commence à devenir vraiment le bordel. J'aime que ce soit clean, mais aussi qu'il y ait de la structure et du rythme visuel. Apple style » | Fiche en 6 chapitres sur un modèle unique (titre 42, 21 sur téléphone ; chapeau 21 ; contenu) ; deux largeurs (lecture 720, grille 3 colonnes 1080), un seul bord gauche ; les tailles de l'échelle du système (titre de page 64, 42 sur téléphone ; corps 16, lecture 17 ; méta 14 ; aucune capitale) ; rythme par bandes blanches et grises alternées pleine largeur, pas par boîtes ; tuiles réservées aux objets manipulés, une seule forme de carte ; aucune carte orpheline. Détail : ROADMAP, « Étape 1 bis » | `AgentSheet`, `Chapter` |

## À arbitrer

- [ ] Section agents, étape 1 (fiche serveur, 17/11), à valider sur `/fr/mcp/notion-mcp` et dans « Agents / Fiche ». Choix faits : titre en 42 px (`title-section`, la plus petite grande taille du système) pour tenir sur une ligne avec le logo de 40 ; accroche en 17 px (taille « lead » du système, pas 18) ; ligne de confiance en 14 px atténué (pas 13, hors échelle) ; « Voir les étapes ↓ » sans compte, le nombre d'étapes changeant selon l'assistant ; « Vos premières demandes » en rangées grises avec pastille blanche ; « Si ça ne marche pas » et « Comment garder la main » en phrases sans puces, sur le bord gauche ; « Quel forfait » n'apparaît que s'il y a des options avancées : il redit le cas courant (« Fonctionne sur tous les forfaits Notion. ») puis « En plus, sur Business et Enterprise : … » ; l'accroche le résume, sans compter comme un doublon (relecture du 17/11). La taille 48 du `Logo` ajoutée pour l'emprunt au répertoire Claude est retirée.
- [ ] Section agents, S1 bis (17/11), à valider dans Storybook (« Agents / Hub », « Agents / Fiche », « Fiche outil / Assistant IA ») et sur `/fr/agents`, `/fr/mcp/notion-mcp`, `/fr/tool/notion#assistant-ia`. Choix faits sans validation : besoins en puces de taille « réponse », un seul conseil affiché sous le besoin choisi (tuile grise, logo 24, titre 21 « Branchez Calendly à votre assistant ») ; demande type en carte blanche soulevée, entre guillemets, comme un message ; étapes numérotées dans des ronds blancs ; « Avec votre stack » en `LinkRow` avec l'avis en note à droite ; « Par où commencer » en trois tuiles ; fiche en tuiles par chapitre, choix de l'assistant en puces, « Pour aller plus loin » replié par un bouton texte ; « savoir-faire » retenu pour les skills ; le risque en mots suit la capacité la plus risquée (payer, puis envoyer, puis supprimer). Ajouts de la revue du 17/11 : choix du client en puces qui passent à la ligne sur téléphone, au lieu de défiler (les invariants de mise en page refusent une boîte plus large que son parent) ; carte d'étapes blanche soulevée sur la tuile, numéros dans des ronds gris ; bouton de copie secondaire nommé, sous le bloc ; pastilles de risque avec `Tag` (orange pour Supprime et Paie, neutre pour Modifie et Envoie) ; menu « Copier pour votre assistant » en bouton secondaire avec menu flottant blanc ; « Sources » en titre 16 gras, liens de 44 px de haut ; cartes blanches à liseré, « Ajouter à ma stack » en bouton secondaire sous la carte de l'outil. Passe de mise en page du 17/11 (11 points de la ROADMAP) : besoins et choix du client en grille compacte (4 × 2 sur bureau, 2 colonnes sur téléphone) plutôt qu'en rangée qui défile, les invariants refusant une boîte plus large que son parent ; recommandation en tuile avec logo 40, demande en citation 21 px sur carte blanche, trois faits à icônes 20 px, bouton principal « Brancher Calendly » avec la flèche du bouton ; liens texte : flèche au survol, selon la règle « link » du système, plutôt qu'en permanence ; en-tête de fiche dessiné par la fiche (titre XL, « Copier pour votre assistant » en bouton principal à droite, pleine largeur sur téléphone) ; « Fonctionne avec » en pastilles grises, logo de 14 px puis le nom : chaque logo a sa place réservée, se charge sans différé et reste invisible tant qu'il n'est pas chargé (jamais de cercle vide) ; Claude Code reprend le logo de Claude, Codex un pictogramme de code ; menu « Copier pour votre assistant » à 360 px, chaque entrée avec son picto dans un carré de 32 px et une ligne d'aide atténuée (14 px, la taille « note » du système, plutôt que 13), petits logos des assistants servis à gauche du bouton sur bureau ; emprunts au répertoire Claude : grille de six cases en tuiles grises (libellé 14 px atténué, valeur 16 px), adresse copiable par un bouton rond de 44 px, logo de l'outil à 48 px dans son cadre clair à gauche du titre ; l'en-tête ne garde que trois faits et la date passe dans la grille ; chapitres alternés (seul « Brancher » reste en tuile) ; « Pour aller plus loin » en rangée pleine largeur avec son résumé ; cartes avec une phrase écrite pour elles (`card`, 90 signes au plus) et faits courts en pied.
- [ ] Section agents (S1, 16-17/11, axe MCP), à valider dans Storybook (« Agents / Fiche », « Fiche outil / Assistant IA ») et sur `/fr/agents`, `/fr/mcp/notion-mcp`. Choix faits sans validation : fiche en tuiles grises par partie (titre 21), verdict en titre 21 sous le titre de page ; capacités rangées du plus risqué au plus anodin en lignes libellé capitales 12 / texte 16 ; commandes d'installation en Inter 14 dans un cadre blanc défilant avec bouton de copie rond (aucune police à chasse fixe admise par l'audit) ; catalogue d'outils replié par défaut, groupé par risque ; index en `LinkRow` du catalogue, onglets en puces-liens, filtres en puces cochées dans la `FilterBar` ; passerelle de la fiche outil réduite au verdict, trois faits et le lien vers la fiche serveur. Références visuelles non posées.

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
- [x] Infobulle : petite pilule d'encre translucide, sans flèche (« pourquoi une flèche ? », 11/11), qui monte de 4 px en fondu ; sur la barre latérale repliée (`Tooltip`).
- [x] Retrait avec annulation : pastille d'encre avec « Annuler » (`UndoToast`) ; la ligne de coupe remontée par les ciseaux est refusée (« too much », 11/11).
- [x] Chargement : une phrase fixe qui patiente ; la rotation des phrases est refusée (« too much », 11/11).
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
