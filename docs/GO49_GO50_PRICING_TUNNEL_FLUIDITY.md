# GO49-GO50 — Prix fiables et tunnel plus fluide

## Intention UX

Le diagnostic ne doit pas faire semblant de connaître le vrai abonnement d'un utilisateur. Il doit capter ce qui est sûr, signaler ce qui est encore approximatif, puis raconter les recommandations sans additionner des devises différentes comme si tout était homogène.

## GO49 — Prix, offres et devises

- Chaque outil sélectionné porte maintenant un statut de prix : gratuit déclaré, plan confirmé, prix catalogue, devise à vérifier ou plan à vérifier.
- Les outils ajoutés manuellement peuvent recevoir une devise au moment de l'ajout.
- La vérification finale permet de corriger le prix et la devise d'un outil.
- Le pré-verdict n'affiche plus une économie annuelle forcée en euros.
- Le back-office reçoit aussi `selectedPriceIsEstimate` et `pricing_capture` pour relire les incertitudes.

## GO50 — Fluidité du tunnel

- À chaque nouvelle zone de sélection, la recherche et l'ajout manuel sont remis à zéro.
- Le libellé de recherche est contextualisé par zone.
- La question active est remontée au focus pour renforcer la sensation de nouvelle demande.
- L'indicateur d'enregistrement est localisé.
- L'overlay de transition utilise une icône du design system.

## Recette

1. Lancer `npm run validate:go49`.
2. Lancer `npm run validate:go50`.
3. Lancer `npx tsc --noEmit`.
4. Lancer `npm run build`.
5. Déployer sur préprod, ouvrir un nouveau diagnostic et vérifier :
   - sélection d'un outil payant USD ;
   - sélection d'un outil gratuit ;
   - ajout manuel avec prix + devise ;
   - passage d'une zone à l'autre sans ancienne recherche persistante ;
   - pré-verdict sans euro arbitraire.
