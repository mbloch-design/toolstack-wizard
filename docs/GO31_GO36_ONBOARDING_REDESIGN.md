# GO31-GO36 - Refonte onboarding et selection d'outils

## Objectif

Repenser le tunnel de diagnostic pour reduire la friction, eviter les questions redondantes et donner de la valeur avant de demander l'email.

Le tunnel precedent demandait d'abord le prenom, le TJM, le persona, l'email, les competences et plusieurs raffinements avant que l'utilisateur voie vraiment le diagnostic de sa stack. La selection d'outils arrivait trop tard et le parcours ressemblait davantage a un formulaire qu'a un audit.

## Nouveau Parcours V2

1. **Stack scan**
   - L'utilisateur selectionne directement les outils utilises ou payes.
   - Les outils frequents sont proposes en premier.
   - Recherche, categories, ajout d'un outil manquant, prix mensuel et niveau d'usage sont disponibles des le depart.
   - Si l'utilisateur vient d'une fiche outil, l'outil source est preselectionne quand il est reconnu.

2. **Profil et objectif**
   - Le persona est infere depuis la stack.
   - L'utilisateur confirme ou corrige en un clic.
   - L'objectif principal est capte : reduire les couts, simplifier, gagner du temps ou mieux choisir.
   - Le prenom et le TJM deviennent optionnels, dans un bloc compact.

3. **Questions utiles uniquement**
   - Le diagnostic ne pose que les questions conditionnelles qui peuvent changer le verdict.
   - La limite par defaut est de 3 questions.
   - Si aucune question n'est utile, l'ecran passe automatiquement a la suite.

4. **Pre-verdict avant email**
   - Score provisoire.
   - Economie annuelle estimee.
   - Nombre d'outils analyses, doublons et risques.
   - Top actions principales.
   - Lecture ToolTrim du profil et de la maturite.

5. **Email recap**
   - L'email arrive apres la preuve de valeur.
   - Le dashboard reste accessible meme sans friction supplementaire.

6. **Dashboard final**
   - Le diagnostic final continue d'ecrire les snapshots, les insights, la restitution dashboard, les evenements et les jobs email pour le back-office.

## Points techniques

- `FUNNEL_VERSION` passe a `v2`.
- Les anciens ecrans d'entree restent dans le codebase mais ne sont plus branches dans `DiagnosticRouter`.
- Le parcours public branche maintenant :
  - `DiagStepStackScan`
  - `DiagStepProfileGoal`
  - `DiagStep6Discovery`
  - `DiagStepPreVerdict`
  - `DiagStep6bEmailRecap`
  - `DiagResultsLoading`
  - `DiagDashboard`
- La persistence conserve :
  - session diagnostic
  - snapshots
  - step events
  - selected tools
  - onboarding context
  - diagnostic insights
  - dashboard restitution
  - email jobs

## Recette

Controle local minimum :

```bash
npx tsc --noEmit
npm run test:go14
npm run test:go15
npm run test:go21
npm run build
```

Controle preprod apres deploiement :

```bash
npm run validate:preprod-app
npm run validate:preprod-write
npm run validate:preprod
```

Puis faire un diagnostic complet sur `https://preprod.tooltrim.com/fr/selector` et relancer :

```bash
npm run validate:go28
```

## Validation produit attendue

- Le premier ecran doit permettre de comprendre et selectionner une stack sans explication externe.
- L'utilisateur doit pouvoir avancer avec seulement quelques outils.
- Le persona detecte doit etre corrigeable sans bloquer.
- Les questions ne doivent pas sembler generiques ou redondantes.
- Le pre-verdict doit donner une raison claire de continuer.
- L'email ne doit plus etre ressenti comme une barriere avant la valeur.
- Le back-office doit continuer a voir les sessions completes, les snapshots, les restitutions et les jobs email.
