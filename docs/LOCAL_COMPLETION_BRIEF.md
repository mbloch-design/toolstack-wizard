# Brief local : compléter un dossier « faits » en dossier complet

Pour les dossiers `research/dossiers/<slug>.json` au statut `facts_collected`
(produits par les sessions cloud, voir `docs/CLOUD_RESEARCH_BRIEF.md`). Le
travail se fait en local, sans recherche web, à partir des faits du dossier.
Le contrat complet du schéma v2 est la section 4 du brief cloud ; lis aussi
ses sections 5 (prix), 6 (note), 7 (alternatives) et 9 (rédaction).

## Ce que tu ajoutes

1. **Traduction française** de chaque texte `{ "en": … }` : `keyLimits`,
   `cautions`, `freePlan.limits` (si texte), `product.capabilities`,
   `product.limitations`, raisons des `alternatives`. Une vraie phrase
   française, pas un calque ; noms de plans et de produits inchangés.
2. **`rating`** : les 5 axes (entiers 1 à 5) avec, pour chacun, une preuve
   `{ en, fr, sourceIds }` qui s'appuie uniquement sur les faits du dossier et
   cite leurs `sourceIds`. Si les faits ne permettent pas de juger un axe
   (souvent `reversibilite`), mets 3 avec la preuve : « Neutral score: … not
   covered by the collected sources. » / « Note neutre : … ne figure pas dans
   les sources relevées. » Aucune faveur, aucun 5 sans preuve forte.
   `lastActivityVerifiedOn` : `null` sauf date présente dans le dossier.
3. **`audience`** : une seule cible (`THEO`, `SOFIA`, `MARC`, `ALIX`,
   `CLAIRE`, sinon `OTHER`), description `{ en, fr }`, `soloRelevance` et
   `teamRelevance` (`low` | `medium` | `high`).
4. **`useCases`** : 2 cas concrets `{ en, fr }`, au format « Usage : action,
   résultat ».
5. **`editorial`** :
   - `tagline` : ce que fait l'outil en 2 ou 3 mots ;
   - `shortDescription` : une phrase factuelle de **25 mots maximum**, sans
     prix ni liste de fonctionnalités ;
   - `longDescription` : 2 paragraphes courts, **120 mots maximum au total**
     par langue (logique produit, puis prix d'entrée et à qui ça sert). Pas
     d'énumération de toutes les limites ni de toutes les intégrations : la
     grille de prix et les listes de la fiche les affichent déjà ;
   - `pros`, `cons` : 2 ou 3 chacun, observables, sans répéter
     `capabilities` ;
   - `verdict.keepIf`, `verdict.avoidIf`, `verdict.threshold` ; `threshold`
     chiffré à partir des prix du dossier (ex. coût annuel du plan de
     comparaison), jamais d'un taux horaire ou d'un chiffre inventé ;
   - `verdict.billingTraps` seulement si le dossier montre un engagement,
     un minimum de sièges, des frais par usage.
6. **`status`** : `"needs_review"`, et `completedLocallyOn` à la date du jour.

## Ce que tu vérifies et peux corriger

- **Alternatives** : une alternative couvre le même besoin principal. Retire
  un outil complémentaire ou hors sujet. Complète avec des slugs du
  catalogue : `node scripts/research/seed.mjs <slug>` donne la liste
  `alternativeCandidates`. Un concurrent réel absent du catalogue va dans
  `missingAlternatives`. Tier A : 3 à 6 alternatives quand le catalogue le
  permet.
- **Prix** : ne change **aucun montant** (pas de recherche web ici). Si tu
  vois une incohérence (prix annuel noté mensuel, promotion dans `price`,
  modèle `usage` mal classé, plan de comparaison contraire à la règle 5.4),
  ne corrige pas : décris-la dans `reviewNotes` (tableau de chaînes) pour
  une vérification sur le site de l'éditeur.

## Règles de rédaction

- Anglais d'abord, puis une vraie version française ; tutoiement dans les
  conseils en français.
- **Jamais de tiret cadratin (—).** Pas de « puissant », « robuste »,
  « révolutionnaire », « intuitif ». Aucune statistique inventée.
- Montants toujours ceux du dossier, dans sa devise.

## Validation

`node scripts/research/validate.mjs <slugs>` (étape complète) doit finir sans
erreur. Ne commite rien : la relecture et la fusion se font à part.
