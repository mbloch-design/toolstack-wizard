# Refonte /submit — design approuvé le 14 octobre 2026

## Contexte

~150 emails de prospection pointent chaque jour directement vers `/submit`. Le
lecteur arrive froid, sans contexte sur ToolTrim, souvent sceptique ("payer
pour être évalué" sonne comme une arnaque potentielle). Objectif : faire
comprendre l'offre et installer la confiance en quelques secondes, sans
perdre l'ADN éditorial ni les garde-fous (pas de note achetée, pas de
statistique inventée).

Direction retenue : **B — landing froid, preuve d'abord**, avec les hacks
marketing Apple ci-dessous. Scope : hero, comparatif des formules, preuve
sociale, FAQ. Le moteur du formulaire multi-étapes (brouillons, reprise
paiement Creem, vérification badge) n'est pas touché fonctionnellement.

## Hacks marketing Apple appliqués

1. **Un seul message par écran.** Chaque section affirme une seule idée
   (comme une page produit Apple), pas une liste de sous-points.
2. **Un CTA dominant, un seul.** Le hero n'offre qu'une action principale
   nette ; l'option gratuite devient un lien secondaire discret, pas un
   deuxième bouton de même poids.
3. **Carte "Pro" sombre vs carte claire.** La formule prioritaire (29 $)
   reçoit un traitement visuel foncé/contrasté façon "Pro/Max", la formule
   gratuite reste claire et en retrait — la hiérarchie se lit sans lire le
   texte.
4. **Ancrage par comparaison honnête**, pas par chiffre inventé : le prix est
   mis en regard du temps/coût de se faire connaître autrement (texte court,
   pas de calcul fictif).
5. **Preuve sociale concrète, pas abstraite.** Remplace la ligne "DR 40 /
   Domain Rating" (signal que seul un éditeur SEO comprend) par une rangée de
   vrais logos d'outils déjà publiés, tirés de `src/data/tools_index.json`
   (aucun logo ni nom inventé).
6. **Réassurance silencieuse sous le CTA**, pas une bannière d'urgence
   criarde. L'offre datée reste, en petit texte, pas en bandeau clignotant.
7. **Contraste fort, peu de gris moyen.** Plus de blanc pur, plus de noir
   quasi-pur sur les éléments clés ; le gris sert uniquement aux métadonnées
   (conforme à la règle de contraste du design system).

## Changements par section

### Hero
- Titre plus court, plus grand, une seule affirmation.
- Un seul CTA primaire **noir** (`#1D1D1F`, pas bleu) : "Publier ma fiche · 29 $".
- Le lien vers la formule gratuite redevient un texte discret sous le CTA,
  pas un deuxième bouton.
- Le panneau "exemple de fiche" (CommuteBar) reste mais passe en second plan
  visuel derrière une preuve sociale plus large.

### Rangée de preuve sociale (nouvelle section, juste sous le hero)
- Rangée horizontale de ~8-10 vrais logos d'outils déjà publiés sur
  ToolTrim, scrollable sur mobile, défilement discret sur desktop si la
  largeur manque.
- Légende factuelle : "Déjà publiés sur ToolTrim" (pas de "+1000 clients"
  inventé).
- Remplace la ligne "Sous 5 jours / DR 40 / Lien dofollow" qui descend dans
  le comparatif des formules à la place.

### Comparatif des formules
- Carte prioritaire : fond sombre (`#1D1D1F`), texte clair, CTA clair sur
  fond sombre — traitement "Pro".
- Carte gratuite : fond clair existant, CTA secondaire sobre.
- Les 3 repères factuels (délai, dofollow, process) redescendent sous les
  cartes en ligne de métadonnées, pas en hero.

### Score ToolTrim / FAQ / closing
- Pas de changement structurel majeur. FAQ : regrouper visuellement par
  thème (offre / processus / garanties) avec un accordéon resserré, sans
  retirer de contenu (conformité juridique/transparence à préserver).
- Section closing : CTA identique au hero (répétition volontaire, cohérence
  du message unique).

## Contraintes à respecter

- Pas de bouton bleu, conforme à la doctrine du design system.
- Aucune statistique, témoignage ou logo inventé — uniquement des données
  réelles du catalogue (`tools_index.json`) ou déjà validées dans
  `docs/SUBMIT_CONVERSION_REVIEW.md`.
- Le moteur fonctionnel du formulaire (brouillons localStorage, Creem,
  vérification badge) reste inchangé : refonte visuelle et de narration
  uniquement.
- CSS dans `src/index.css`, classes préfixées `sp-*`, pas de Tailwind inline.
- Valider avec `npm run build` avant commit.

## Mesure

Les événements `submit_plan_select`, `submit_priority_checkout` et
`submit_tool` existants suffisent ; pas de nouvel événement nécessaire sauf
si la rangée de logos ou le nouveau CTA hero doivent être distingués dans la
source (`source` déjà paramétrable sur `choosePlan`).

## Ajouts après revue design et audit de conversion (même jour)

- Revue design-superpowers (L2) : 0 P0, 3 P1 corrigés. La section formules
  parlait encore d'un simple délai alors que la différence porte aussi sur le
  lien ; la FAQ était alignée ; DR 43 + dofollow sont remontés sous le CTA du hero.
- Mentions « offre jusqu'au 30 septembre » retirées : offre expirée encore affichée.
- Lien de prospection personnalisé : `https://tooltrim.com/en/submit?tool={{tool}}&site={{domain}}`.
  Le hero, le CTA et l'aperçu prennent le nom de l'outil ; le formulaire est
  prérempli (il ne reste que l'email) ; une ligne « réponds à mon email,
  Michael » prolonge la voix de l'email. Une variable non remplie (`{{tool}}`)
  retombe sur la page générique. `submit_plan_select` porte `personalized`.
- Test proposé : moitié des envois en lien personnalisé, moitié en lien nu,
  métrique `submit_priority_checkout` / visiteurs, 2 à 3 semaines complètes.
