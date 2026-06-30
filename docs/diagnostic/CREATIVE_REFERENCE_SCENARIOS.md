# Tooltrim — Scénarios de référence Créatif

> Statut : Phase 0
> Rôle : matrice de recette métier pour protéger le diagnostic Créatif.
> Principe : chaque scénario part de ce que la personne produit, pas de l’outil.

## Règles communes

Pour chaque scénario, Tooltrim doit :

- comprendre la production réelle ;
- rattacher un même outil à plusieurs usages sans le dupliquer ;
- accepter une méthode atypique sans la corriger pendant la capture ;
- séparer outil, fonction IA, plugin, ressource, service et contrat ;
- demander les plans au niveau commercial pertinent, pas à chaque application ;
- recommander seulement après la cartographie ;
- justifier chaque recommandation par une preuve lisible.

## Matrice minimale

| ID | Production réelle | Stack déclarée | Subtilité à protéger | Attendu métier |
|---|---|---|---|---|
| CR-01 | Interfaces et prototypes | Figma | Figma couvre UI, prototype, design system, brief, validation et handoff | Une seule entrée Figma, plusieurs usages reliés, plugins Figma uniquement |
| CR-02 | Interfaces et prototypes | Sketch | Même besoin que Figma, mais écosystème différent | Pas de plugins Figma proposés ; branches Sketch / Zeplin / Abstract si pertinentes |
| CR-03 | Identité et édition | Illustrator + InDesign | Illustrator sert aussi au moodboard ; InDesign sert à la mise en page | Les usages atypiques sont capturés comme faits, pas comme erreurs |
| CR-04 | Devis et documents client | InDesign | Cas volontairement “tordu” : devis dans InDesign | Pas de recommandation automatique tant qu’aucune friction n’est déclarée |
| CR-05 | Moodboards | Illustrator + Pinterest + assets | Moodboard dans un outil d’illustration | Illustrator garde plusieurs rôles ; les assets restent une couche séparée |
| CR-06 | Retouche photo | Lightroom + Photoshop | Suite Adobe partielle, usages complémentaires | Une revue Adobe regroupée, pas deux contrats imposés |
| CR-07 | Photo pro | Capture One + Photoshop | Alternative non Adobe au catalogage photo | Capture One n’ouvre pas de plugins Lightroom par défaut |
| CR-08 | Vidéo client | Premiere Pro + After Effects | Montage, motion, templates et validation | Premiere/After Effects restent distincts ; Frame.io et plugins AE sont satellites |
| CR-09 | Motion design | After Effects + Bodymovin + LottieFiles | Plugin/export/livraison | Bodymovin est plugin ou passerelle, pas outil socle du besoin principal |
| CR-10 | 3D produit | Blender | Création, rendu, assets, plugins | Blender est pair de Cinema 4D ; rendu et écosystème sont séparés |
| CR-11 | 3D motion | Cinema 4D + Redshift | Maxon One possible, moteur de rendu inclus ou séparé | Cinema 4D, Redshift et contrat Maxon sont reliés sans double coût |
| CR-12 | 3D avancée | Cinema 4D + Octane + X-Particles | Plugins/moteurs payés séparément | Octane et X-Particles ne sont pas absorbés automatiquement par Maxon |
| CR-13 | Espaces / architecture | SketchUp + LayOut + Enscape | Conception, plans, rendu | SketchUp n’est pas traité comme Blender ; LayOut et Enscape ont des rôles dédiés |
| CR-14 | Social content | Canva + CapCut + outil de publication | Production rapide, templates, IA et publication | Canva peut couvrir design, templates, brand kit et IA sans duplication |
| CR-15 | Chaîne IA hybride | ChatGPT + Firefly intégré + outil principal | IA séparée et IA incluse dans une app | L’acteur IA est relié à l’objectif ; Firefly n’est pas compté comme abonnement séparé si inclus |
| CR-16 | Outil inconnu | Nom libre saisi par l’utilisateur | L’outil n’existe pas au catalogue | Tooltrim l’ajoute sans bloquer, le rattache au besoin courant et marque l’incertitude |
| CR-17 | Suite Adobe | Creative Cloud avec plusieurs apps incluses | Sélectionner une suite ne veut pas dire tout utiliser | Les apps incluses sont proposées comme raccourcis, pas ajoutées automatiquement |
| CR-18 | Reprise | Session mobile interrompue puis reprise | Sauvegarde et restauration | Les productions, usages, IA, contrats et zones couvertes reviennent sans perte |

## Scénarios détaillés à jouer en recette

### CR-01 — UI avec Figma

La personne produit des interfaces, prototypes et design systems. Elle utilise Figma pour concevoir, prototyper, documenter, présenter et faire le handoff.

Attendus :

- Figma apparaît une seule fois dans la stack.
- Les usages multiples sont visibles et compréhensibles.
- Les satellites proposés sont compatibles Figma : Tokens Studio, Iconify, Stark, Anima, Zeplin si le contexte le justifie.
- La licence Figma est demandée une fois.
- Les recommandations n’arrivent pas pendant la capture.

### CR-02 — UI avec Sketch

La personne produit les mêmes résultats qu’un utilisateur Figma, mais travaille avec Sketch.

Attendus :

- La question reste formulée autour de la conception d’interfaces et prototypes.
- Sketch est accepté comme réponse équivalente au besoin.
- Les plugins ou passerelles Figma ne sont pas proposés.
- Les compléments affichés dépendent de Sketch.

### CR-06 / CR-17 — Adobe sans sur-demande de plans

La personne utilise plusieurs applications Adobe, mais pas forcément toute la suite. Certaines apps peuvent être incluses, d’autres payées par l’équipe ou un client.

Attendus :

- La capture ne bloque jamais sur le choix d’un plan.
- La revue commerciale regroupe Adobe au bon niveau.
- Une app incluse ne crée pas de coût marginal.
- Une app non utilisée n’est pas ajoutée juste parce qu’elle est incluse.
- Une incertitude de plan reste normale et actionnable.

### CR-10 / CR-11 — Blender et Cinema 4D

Deux personnes produisent de la 3D : l’une avec Blender, l’autre avec Cinema 4D.

Attendus :

- Blender et Cinema 4D couvrent le même besoin principal sans hiérarchie artificielle.
- Les moteurs de rendu, plugins, assets et passerelles sont séparés de l’outil socle.
- Redshift est relié à Cinema 4D / Maxon ; Octane reste potentiellement séparé.
- Les branches d’écosystème suivent l’outil réellement choisi.

### CR-14 — Social avec Canva, CapCut et publication

La personne produit des posts, stories, vidéos courtes, templates de marque et publications programmées.

Attendus :

- Canva peut couvrir plusieurs objectifs sans duplication.
- CapCut sert la vidéo courte, pas le design system.
- Les outils de publication et validation sont des services associés.
- Canva AI est capturé comme capacité IA potentiellement incluse, pas comme outil principal séparé par défaut.

## Grille d’observation

Pendant la recette, noter pour chaque scénario :

- la personne comprend-elle la première question ?
- croit-elle devoir choisir un logiciel ou décrire son travail ?
- repère-t-elle qu’un outil peut servir plusieurs usages ?
- voit-elle une question répétitive ?
- comprend-elle que les plans arrivent plus tard ?
- peut-elle dire “je ne sais pas” sans se sentir bloquée ?
- la restitution raconte-t-elle une histoire qu’elle reconnaît ?
- quelle est la première décision qu’elle prendrait après le diagnostic ?

## Statut de validation

| Élément | Statut Phase 0 |
|---|---|
| Scénarios listés | Fait |
| Scénarios automatisés | Partiel |
| Recette manuelle desktop | À faire |
| Recette manuelle mobile | À faire |
| Test utilisateurs réels | Phase 1 |
| Revue experte métier | Phase 3 |
