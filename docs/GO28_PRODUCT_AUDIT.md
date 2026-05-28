# GO28 - Audit produit preprod

## Verdict

GO28 confirme que le socle technique est pret, mais que le produit visible ne donne pas encore assez la sensation d'un audit profond. L'utilisateur peut finir le diagnostic et les donnees sont bien captees, mais la valeur percue reste trop tardive et trop dispersee.

Score produit actuel : **68/100**.

## Ce qui est solide

- La session est creee tres tot dans `DiagnosticRouter`, puis mise a jour avec evenements, snapshots, contexte, scoring et restitution.
- Le modele de diagnostic est riche : persona, objectif, outils, usages, discovery, closing, risques, couverture fonctionnelle, confiance et calibration.
- La restitution possede deja des vues utiles : apercu, gaspillage, stack utile, optimisation, actions.
- Le back-office couvre les besoins operations : sessions, emails, restitutions, qualite, pilotage, exports.
- GO26 et GO27 sont verts sur preprod : app, Supabase, Edge Functions, protections et alertes.

## Frictions produit

### 1. Valeur percue trop tardive

Le diagnostic demande prenom, TJM, persona, email, complements, outils, discovery et closing avant que l'utilisateur voie une preuve forte. Le compteur lateral n'apparait qu'apres selection d'outils et reste surtout quantitatif.

Impact : l'utilisateur peut avoir l'impression de remplir un formulaire avant de recevoir un vrai diagnostic.

Recommandation GO29 : ajouter des micro-verdicts pendant le tunnel, par exemple "doublon probable", "stack deja lourde", "profil hybride capte".

### 2. Email demande deux fois

Il existe une etape email au debut et une recap email plus tard. Fonctionnellement c'est defendable, mais en experience cela peut creer une hesitation : est-ce obligatoire, optionnel, ou lie a la restitution ?

Impact : friction et doute sur la promesse "gratuit / rapide".

Recommandation GO29 : transformer le premier email en option discrete ou le repousser au moment ou la valeur est claire.

### 3. Selection d'outils encore trop mecanique

La selection par clusters est pertinente, mais elle ressemble encore a une liste de cases. Les toasts de doublons sont utiles, mais ils disparaissent vite et ne deviennent pas toujours une histoire visible.

Impact : ToolTrim detecte des choses, mais l'utilisateur ne ressent pas assez "l'audit est en train de travailler".

Recommandation GO29 : rendre les signaux persistants dans le panneau droit : doublons, cout, couverture, outils suspects.

### 4. Restitution riche mais fragmentee

Le dashboard final est complet, mais l'information est distribuee entre plusieurs tabs. L'apercu donne un montant fort, puis des cartes intelligence, puis des problemes. C'est utile, mais pas encore une narration executive.

Impact : le resultat peut paraitre serieux mais pas encore assez decisif.

Recommandation GO30 : creer une premiere page "Verdict" avec 3 blocs : diagnostic, preuves, plan.

### 5. Back-office operationnel mais pas encore orienté opportunite

Le back-office permet de lire les sessions, mais il ressemble encore a une console. Pour piloter une vraie opportunite, il manque une fiche session compacte : "qui est cette personne, probleme, valeur, prochaine action".

Impact : tu peux auditer, mais pas encore exploiter commercialement ou qualitativement chaque session.

Recommandation GO31 : vue detail session orientee lecture humaine.

## Risques UI/UX

- Beaucoup de petits boutons texte avec fleches : efficace mais parfois moins premium.
- Les cartes de persona et de resultat ont une bonne base, mais manquent de hierarchie emotionnelle.
- Mobile a surveiller : le tunnel est long, et les elements de reassurance doivent etre visibles sans alourdir.
- Les etats erreur existent, mais l'utilisateur n'a pas toujours une solution claire si la persistence echoue.

## Risques data/customer success

- Bonne capture technique, mais pas encore de score de "lead qualifie" ou "opportunite".
- Pas de NPS/feedback post-restitution.
- Pas de segmentation explicite : urgent, high-value, a relancer, a ignorer.
- Email worker volontairement skippe en recette automatique ; a tester sur queue controlee avant prod.

## Priorites recommandees

1. **GO29 - Tunnel visible**
   Ajouter des micro-verdicts pendant le diagnostic, clarifier email, renforcer le panneau droit.

2. **GO30 - Restitution executive**
   Refaire le premier ecran resultat autour d'un verdict clair, preuves et plan d'action.

3. **GO31 - Back-office opportunite**
   Transformer le detail session en fiche exploitable : profil, douleur, valeur, statut, prochaine action.

4. **GO32 - Emails**
   Tester et ameliorer l'email de restitution, puis worker sur queue preprod controlee.

## Gate GO28

GO28 est complet quand :

- un diagnostic preprod reel est termine ;
- `npm run validate:go28` passe ;
- `npm run validate:preprod` reste vert ;
- les priorites GO29-GO31 sont acceptees.
