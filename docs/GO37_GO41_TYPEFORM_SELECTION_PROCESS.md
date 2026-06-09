# GO37-GO41 - Selection guidee Typeform-like

## Objectif

Rendre la selection d'outils plus fiable. Le probleme principal n'etait pas seulement la longueur du tunnel, mais le risque d'oubli : si l'utilisateur ne pense qu'a ses outils IA visibles, le diagnostic ignore la communication, la facturation, la securite, les rendez-vous ou les automatisations.

La nouvelle logique transforme le premier ecran en assistant de couverture.

## Inspiration UX

Typeform met en avant des formulaires adaptatifs, une logique conversationnelle et des analyses de reponses / drop-off. L'implementation ToolTrim reprend ces principes sans copier l'interface :

- une question principale a la fois ;
- progression visible ;
- suggestions adaptees ;
- possibilite de passer si l'utilisateur n'est pas concerne ;
- catalogue libre toujours disponible ;
- valeur produit avant demande d'email.

## Nouveau Process

L'utilisateur est guide par moments de travail :

1. IA et recherche
2. Docs et connaissance
3. Creation visuelle
4. Automatisation
5. Communication client
6. Projet et livraison
7. Rendez-vous et video
8. Securite et acces
9. Facturation et admin
10. Analytics et croissance

Pour chaque moment :

- ToolTrim pose une question courte ;
- affiche des suggestions fortes ;
- laisse ajouter un outil manquant ;
- permet de marquer le moment comme non concerne ;
- avance vers la prochaine zone non couverte.

## Donnees Capturees

Le tunnel conserve maintenant une information de couverture dans `selectionCoverage` :

```ts
{
  covered: string[];
  skipped: string[];
  confidence: "low" | "medium" | "high";
}
```

Cette information est ecrite dans les snapshots et dans `diagnostic_context.selection_coverage`, afin que le back-office puisse distinguer :

- une stack courte mais volontaire ;
- une stack courte probablement incomplete ;
- une stack large et fiable ;
- les zones explicitement ignorees.

## Definition GO37-GO41

GO37 - Recette UX tunnel V2
- Verification du parcours complet.
- Identification du vrai point de friction : oubli de stack.

GO38 - Selection intelligente
- Ajout des moments de travail.
- Suggestions par moment.
- Progression et skip volontaire.

GO39 - Capture de qualite
- Persistance `selectionCoverage`.
- Confiance de selection pour le back-office.

GO40 - Restitution coherente
- Le pre-verdict reste apres la couverture.
- Le diagnostic garde les memes donnees finales : score, insights, restitution dashboard, email jobs.

GO41 - Release readiness
- Documentation, tests, build et recette preprod.

## Recette Locale

```bash
npx tsc --noEmit
npm run test:go14
npm run test:go15
npm run test:go21
npm run build
```

## Recette Preprod

Apres push et deploiement Vercel :

```bash
npm run validate:preprod-app
npm run validate:preprod-write
npm run validate:preprod
```

Puis faire trois diagnostics complets sur :

```text
https://preprod.tooltrim.com/fr/selector
```

Scenarios :

1. Profil dev : ChatGPT, Claude, Cursor/Copilot, GitHub, Linear/Jira, Slack, Vercel.
2. Profil createur : Canva, Figma, Midjourney, Runway/CapCut, Notion, Google Drive, Calendly.
3. Profil business/ops : Notion, Airtable, Make/Zapier, Slack, Stripe, Calendly, Brevo/HubSpot.

Verifier :

- l'utilisateur comprend la question sans aide externe ;
- les zones oubliees sont visibles ;
- le bouton "Pas concerne" ne donne pas l'impression d'echec ;
- la selection reste rapide ;
- le pre-verdict arrive avant l'email ;
- `npm run validate:go28` passe apres un diagnostic complet.

## Critere de Succes

Le tunnel est valide si un utilisateur non technique peut reconstruire une stack realiste en moins de 4 minutes, sans penser spontanement a toutes les categories, et si le back-office garde une session complete avec restitution dashboard.
