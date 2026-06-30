# Tooltrim — Run Phase 1 utilisateur du 29 juin 2026

> Statut : replay autonome partiel terminé — validation utilisateur réelle encore à jouer
> Périmètre : parcours Créatif candidat
> Source : `PHASE1_CREATIVE_CANDIDATE_PROTOCOL.md` et `PHASE1_OBSERVATION_GRID.md`
> Règle : ne pas inventer de résultats. Chaque session doit être remplie après observation réelle ou replay explicitement qualifié.
> Qualification du 29 juin 2026 : les notes ci-dessous sont des replays proxy par l’équipe produit, pas des sessions avec utilisateurs externes.

## 1. Objectif du run

Vérifier si le parcours Créatif est compris par des créatifs réels comme une cartographie de leur travail actuel :

production réelle → besoins importants → façon réelle de faire → outils et IA → écosystème → inconnues → contrats → diagnostic.

Ce run doit surtout observer les réserves G0 :

- moment contrat ;
- suites Adobe / Canva / Maxon / Affinity ;
- outil multi-usage ;
- IA hybride ;
- zones sautées ;
- outil inconnu ;
- reprise ;
- restitution et décision finale.

## 2. Pré-vol

À vérifier avant chaque session :

- `npm run validate:phase1` : PASS ;
- `npm run validate:g0` : PASS si la session sert à une décision formelle ;
- URL testée : `http://localhost:8080/en/selector` ou URL déployée équivalente ;
- session navigateur propre ou état de reprise volontairement testé ;
- observateur prêt avec `PHASE1_OBSERVATION_GRID.md` ;
- aucun correctif non urgent pendant la session ;
- le participant comprend qu’on teste Tooltrim, pas sa manière de travailler.

## 3. Tableau de suivi

| Session | Profil | Statut | Score /20 | Temps pré-verdict | Fidèle ? | Décision citée ? | P0 | P1 | P2 | Notes |
|---|---|---|---:|---:|---|---|---:|---:|---:|---|
| P1-UI | UI / produit | Replay proxy observé | 15 proxy | non chronométré | Oui avec réserve | Oui | 0 | 0 après correction | 3 | Figma multi-usage OK ; question prix redondante corrigée |
| P1-Brand | Identité / illustration / édition | Replay proxy observé | 17 proxy | non chronométré | Oui | Oui | 0 | 0 | 1 | Usages atypiques Illustrator/InDesign bien captés ; Adobe groupé une fois |
| P1-Photo | Photo / retouche | Replay proxy observé puis P1 corrigé | 14 proxy avant correction | non chronométré | Oui mais confiance cassée avant correction | Oui | 0 | 1 corrigé | 2 | `100/100 Optimized` avec prix à préciser corrigé |
| P1-Video | Vidéo / motion / social vidéo | Replay proxy observé puis P1 corrigé | 14 proxy avant correction | non chronométré | Oui mais sortie bloquée avant correction | Oui | 0 | 1 corrigé | 2 | Email optionnel bloquait l’ouverture si case cochée vide ; corrigé |
| P1-3D | 3D / espaces | Replay proxy observé | 15 proxy | non chronométré | Oui avec réserve | Oui | 0 | 0 après correction | 2 | Cinema 4D + Redshift + Maxon One au bon niveau ; question prix redondante corrigée |
| P1-SocialAudio | Social / audio / contenu récurrent | Non observé en Phase 1 | — | — | Non prouvé | Non prouvé | — | — | — | Navigateur instable après test viewport ; ne pas compter comme résultat Phase 1 |

## 3.1 Synthèse du replay autonome du 29 juin 2026

Ce run n’est pas une validation terrain. Il sert à faire le travail autonome demandé : pousser la Phase 1 avec un œil de leader produit, repérer les contradictions fortes et corriger ce qui abîme immédiatement la confiance.

Constats confirmés :

- l’entrée par production fonctionne mieux que l’entrée par logiciel sur UI, Brand, Photo, Vidéo et 3D ;
- Figma, Illustrator, InDesign, Lightroom, Photoshop, Premiere Pro, Cinema 4D et Redshift restent des outils uniques reliés à plusieurs usages ;
- les usages atypiques sont acceptés : moodboards dans Illustrator, devis dans InDesign ;
- Adobe et Maxon sont globalement compris comme contrats ou familles commerciales, pas comme outils de production ;
- l’IA est captée au bon endroit dans le flux Photo/Vidéo : Firefly, ChatGPT et fonctions intégrées ;
- les écosystèmes hôtes sont cohérents dans les replays observés : Figma autour de Figma, Redshift autour de Cinema 4D.

P1 corrigés dans ce lot :

- un diagnostic ne peut plus afficher `100/100 Optimized` ou “Healthy stack” si un prix ou accès reste à préciser ;
- la restitution s’ouvre même si la case “Send me a copy of the report” est cochée sans email ;
- la question générique “catalog pricing may be wrong” n’est plus reposée après un mode commercial déjà déclaré.

P2 encore ouverts :

- libellés pluriels du type `1 tool(s)` / `1 tools` ;
- certaines questions sur zones sautées peuvent encore ressembler à une insistance ;
- la distinction “IA intégrée” vs “outil IA séparé” est utile mais peut rester ambiguë dans certains cas Adobe ;
- les montants déclarés sans saisie exacte restent à expliquer avec beaucoup de pédagogie.

Non prouvé :

- P1-SocialAudio n’a pas été rejoué en Phase 1 autonome ;
- le petit écran/mobile n’a pas été validé dans ce run, car l’automatisation navigateur est devenue instable après changement de viewport ;
- aucune session n’est une session utilisateur réelle avec verbalisation.

## 4. Sessions à jouer

### P1-UI — interfaces, prototypes, design system

Hypothèse principale : Figma ou Sketch doit être compris comme une réponse possible au besoin “concevoir des interfaces”, pas comme le point de départ du parcours.

Risques à observer :

- outil multi-usage : UI, prototype, design system, brief, review, handoff ;
- découvrabilité de Figma ou Sketch dans review / validation ;
- plugins et satellites dépendants du bon hôte ;
- licence Figma / Sketch demandée une fois ;
- confusion possible entre cartographie et recommandation.

Fiche session :

```md
- Date :
- Participant :
- Device :
- Production principale :
- Objectif choisi :
- Stack déclarée avant parcours :
- Stack capturée :
- IA déclarée :
- Suite / contrat :
- Outil inconnu :
- Reprise testée :
- Temps jusqu’au pré-verdict :
- Score : /20
- Cartographie fidèle ? oui / partiel / non
- Décision concrète citée ? oui / non
- P0 :
- P1 :
- P2 :
- P3 :
- Verbatim court :
- Décision session : PASS / PASS avec réserve / FAIL
```

### P1-Brand — identité, illustration, édition

Hypothèse principale : Tooltrim doit accepter les usages atypiques comme des faits, surtout dans l’écosystème Adobe.

Risques à observer :

- devis, moodboards, présentations ou documents client dans Illustrator / InDesign ;
- Adobe suite comprise comme contrat, pas comme outil de workflow ;
- apps incluses non ajoutées automatiquement ;
- assets, fonts, templates et bibliothèques capturés comme couche séparée ;
- contrat Adobe demandé au bon niveau.

Fiche session :

```md
- Date :
- Participant :
- Device :
- Production principale :
- Objectif choisi :
- Stack déclarée avant parcours :
- Stack capturée :
- Usage atypique :
- IA déclarée :
- Suite / contrat :
- Outil inconnu :
- Reprise testée :
- Temps jusqu’au pré-verdict :
- Score : /20
- Cartographie fidèle ? oui / partiel / non
- Décision concrète citée ? oui / non
- P0 :
- P1 :
- P2 :
- P3 :
- Verbatim court :
- Décision session : PASS / PASS avec réserve / FAIL
```

### P1-Photo — photo, retouche, livraison

Hypothèse principale : IA intégrée, IA séparée, presets, livraison et galerie client doivent apparaître au bon endroit sans double coût.

Risques à observer :

- Lightroom / Capture One / Photoshop sans mauvais écosystème ;
- Firefly ou fonction IA intégrée reliée à Photoshop ou Lightroom ;
- ChatGPT, Midjourney ou autre IA séparée reliée à l’étape réelle ;
- presets, Nik Collection, Pixieset ou stockage traités comme compléments ;
- Adobe Photography ou autre contrat demandé une fois.

Fiche session :

```md
- Date :
- Participant :
- Device :
- Production principale :
- Objectif choisi :
- Stack déclarée avant parcours :
- Stack capturée :
- IA intégrée :
- IA séparée :
- Suite / contrat :
- Outil inconnu :
- Reprise testée :
- Temps jusqu’au pré-verdict :
- Score : /20
- Cartographie fidèle ? oui / partiel / non
- Décision concrète citée ? oui / non
- P0 :
- P1 :
- P2 :
- P3 :
- Verbatim court :
- Décision session : PASS / PASS avec réserve / FAIL
```

### P1-Video — vidéo, motion, social vidéo

Hypothèse principale : montage, motion, templates, validation, transcription IA et publication ne doivent pas être mélangés.

Risques à observer :

- Premiere / DaVinci / Final Cut pour montage ;
- After Effects / templates / plugins séparés du montage ;
- Frame.io ou service de validation comme service associé ;
- transcription, sous-titres ou génération IA rattachés à l’étape réelle ;
- publication social vidéo sans transformer Canva ou CapCut en contrat global confus.

Fiche session :

```md
- Date :
- Participant :
- Device :
- Production principale :
- Objectif choisi :
- Stack déclarée avant parcours :
- Stack capturée :
- IA déclarée :
- Templates / assets :
- Publication / validation :
- Suite / contrat :
- Outil inconnu :
- Reprise testée :
- Temps jusqu’au pré-verdict :
- Score : /20
- Cartographie fidèle ? oui / partiel / non
- Décision concrète citée ? oui / non
- P0 :
- P1 :
- P2 :
- P3 :
- Verbatim court :
- Décision session : PASS / PASS avec réserve / FAIL
```

### P1-3D — 3D, rendu, espaces

Hypothèse principale : Blender et Cinema 4D doivent être des réponses au même besoin de production 3D, avec des écosystèmes différents.

Risques à observer :

- Blender sans satellites Cinema 4D non pertinents ;
- Cinema 4D avec Redshift / X-Particles / Maxon au bon niveau ;
- Octane ou moteur séparé non absorbé automatiquement ;
- assets, bibliothèques, rendu et livraison séparés de l’outil socle ;
- Maxon One ou autre bundle demandé comme accès, pas comme usage.

Fiche session :

```md
- Date :
- Participant :
- Device :
- Production principale :
- Objectif choisi :
- Stack déclarée avant parcours :
- Stack capturée :
- Moteur de rendu :
- Plugins :
- Assets / bibliothèques :
- IA déclarée :
- Suite / contrat :
- Outil inconnu :
- Reprise testée :
- Temps jusqu’au pré-verdict :
- Score : /20
- Cartographie fidèle ? oui / partiel / non
- Décision concrète citée ? oui / non
- P0 :
- P1 :
- P2 :
- P3 :
- Verbatim court :
- Décision session : PASS / PASS avec réserve / FAIL
```

### P1-SocialAudio — contenu récurrent, publication, audio

Hypothèse principale : Tooltrim doit comprendre une chaîne créative légère mais multi-rôles : création, templates, IA, publication, analytics, stockage.

Risques à observer :

- Canva multi-usage sans duplication ;
- Canva AI ou Magic Studio comme capacité potentiellement incluse ;
- CapCut pour vidéo courte, pas design system ;
- Buffer / Metricool / Later / Hootsuite ou équivalent comme publication ;
- audio : montage, hébergement, RSS, diffusion, analytics ;
- outil inconnu ou service niche accepté sans blocage.

Fiche session :

```md
- Date :
- Participant :
- Device :
- Production principale :
- Objectif choisi :
- Stack déclarée avant parcours :
- Stack capturée :
- IA déclarée :
- Publication / diffusion :
- Analytics :
- Suite / contrat :
- Outil inconnu :
- Reprise testée :
- Temps jusqu’au pré-verdict :
- Score : /20
- Cartographie fidèle ? oui / partiel / non
- Décision concrète citée ? oui / non
- P0 :
- P1 :
- P2 :
- P3 :
- Verbatim court :
- Décision session : PASS / PASS avec réserve / FAIL
```

## 5. Synthèse à remplir après six sessions

```md
## Synthèse G1 provisoire

- Sessions jouées :
- Score moyen :
- Temps médian jusqu’au pré-verdict :
- Cartographies fidèles :
- Décisions concrètes citées :
- Confusions cartographie / recommandation :
- Blocages mobiles :
- Questions répétitives par session :
- Usages atypiques correctement capturés :
- Contrats redemandés au même niveau :

### P0

### P1

### P2

### P3

### Enseignements

1.
2.
3.

### Lots candidats

| Lot | Problème observé | Résultat attendu | Métrique affectée | Critère d’acceptation |
|---|---|---|---|---|
|  |  |  |  |  |

### Décision proposée

- G1 accepté / accepté avec réserves / refusé :
- Pourquoi :
- Ce qui peut passer en Phase 2 :
- Ce qui doit rester Phase 1 :
```
