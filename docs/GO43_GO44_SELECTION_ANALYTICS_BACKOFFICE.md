# GO43-GO44 - Analytics UX et qualite de selection

## Objectif

Ne plus juger le selecteur de stack uniquement au ressenti. Le tunnel capture maintenant des signaux UX et le back-office expose la qualite de la selection.

## GO43 - Evenements UX du selecteur

Les evenements suivants sont enregistres dans `diagnostic_step_events` sur l'etape 0 :

- `selector_tool_added`
- `selector_tool_removed`
- `selector_custom_tool_added`
- `selector_moment_next`
- `selector_moment_skipped`
- `selector_search_opened`
- `selector_review_opened`
- `selector_review_area_reopened`
- `selector_review_back_to_edit`
- `selector_review_confirmed`

Ces signaux permettent de comprendre :

- si les utilisateurs ajoutent surtout via suggestions ou via recherche ;
- quelles zones sont souvent ignorees ;
- si la revue finale est utilisee ;
- si les utilisateurs reviennent corriger leur stack avant le scoring.

## GO44 - Back-office qualite de selection

L'onglet Qualite affiche maintenant une section `Qualite de selection utilisateur`.

Indicateurs :

- selections a revoir ;
- couverture absente ;
- couverture faible ;
- zones moyennes couvertes ;
- zones ignorees.

Une session est marquee a revoir si :

- aucune couverture n'est captee ;
- la confiance est `low` ;
- moins de 4 zones sont couvertes ;
- plus de 3 zones restent non verifiees.

## Recette preprod

1. Appliquer la mise a jour de vue back-office :

```bash
npm run copy:go44-backoffice-sql
```

Coller le SQL dans Supabase SQL Editor, puis executer.

2. Ouvrir :

```text
https://preprod.tooltrim.com/fr/selector
```

3. Faire un diagnostic complet avec :

- au moins 4 outils ajoutes ;
- une zone ignoree ;
- un outil ajoute manuellement ;
- passage par la revue finale.

4. Relancer :

```bash
npm run validate:go28
```

5. Back-office :

- ouvrir l'onglet Qualite ;
- verifier que la session apparait avec sa couverture ;
- ouvrir le detail session ;
- verifier les evenements `selector_*` dans le journal d'evenements.

## Lecture produit

Si beaucoup de sessions ont une couverture faible, le probleme vient du selecteur.

Si beaucoup de sessions ouvrent la recherche, les suggestions ne sont pas assez bonnes.

Si peu de sessions ouvrent la revue finale, le CTA de verification n'est pas assez clair.

Si les zones ignorees se concentrent sur facturation, securite ou analytics, il faudra reformuler ces questions dans un langage plus concret.
