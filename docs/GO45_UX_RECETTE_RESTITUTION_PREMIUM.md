# GO45 - Recette UX restitution premium

## Objectif

Valider que ToolTrim n'est plus percu comme un formulaire suivi d'un dashboard, mais comme un diagnostic guide qui comprend la stack, explique le verdict et donne un plan clair.

La recette doit juger le ressenti utilisateur, pas seulement le fonctionnement technique.

## Personas a tester

### Persona A - Freelance non technique

- Profil : conseil, ops ou createur de contenu.
- Stack attendue : Notion, Google Drive, Gmail, Canva, Stripe, Calendly, Zoom.
- Risque UX : ne pas comprendre les termes techniques, se sentir juge.

### Persona B - Createur / content

- Profil : content ou creatif.
- Stack attendue : Canva, Figma, CapCut, ChatGPT, Notion, Brevo, Metricool.
- Risque UX : outils proposes trop generalistes, restitution trop financiere.

### Persona C - Stack avancee

- Profil : tech, consultant ou ops.
- Stack attendue : 12 a 18 outils, IA, automation, analytics, facturation, projet.
- Risque UX : restitution trop simplifiee, pas assez credible.

## Grille de lecture par ecran

Pour chaque ecran, noter de 1 a 5 :

1. Je comprends pourquoi on me demande ca.
2. Je sais quoi faire sans reflechir.
3. Mon action donne un feedback visible.
4. Le vocabulaire est humain et non culpabilisant.
5. Je sens que ToolTrim comprend mon contexte.

Score cible : 4/5 minimum sur chaque critere.

## Parcours a verifier

### 1. Onboarding

- Le premier ecran doit etre accueillant.
- Le profil doit sembler utile, pas intrusif.
- L'email et le TJM doivent etre percus comme optionnels.
- Le CTA doit etre evident.

### 2. Selection d'outils

- L'utilisateur doit voir sa stack se construire.
- Le feedback `Ajoute` doit etre immediat.
- Le companion stack doit donner envie de continuer.
- La recherche doit rassurer si les suggestions ne suffisent pas.
- Le bouton `Je n'utilise rien ici` doit etre compris comme une reponse valide.
- La revue finale doit ressembler a une verification, pas a une correction d'erreur.

### 3. Questions utiles

- L'utilisateur doit comprendre que ces questions servent a ameliorer le verdict.
- Le nombre de questions doit sembler court.
- La reponse doit etre confirmee visuellement.
- Le passage au pre-verdict doit etre naturel.

### 4. Pre-verdict

- Le score provisoire ne doit pas voler la vedette a la lecture humaine.
- L'email doit rester optionnel.
- Le CTA principal doit etre unique et clair.

### 5. Restitution

- La premiere phrase doit raconter le vrai sujet.
- Le verdict doit etre comprehensible sans lire toute la page.
- Les preuves doivent expliquer pourquoi.
- Le plan doit donner une premiere action evidente.
- Les vues detaillees doivent etre percues comme des annexes, pas comme des onglets obligatoires.

## Evenements a verifier en back-office

Les evenements suivants doivent apparaitre dans `diagnostic_step_events` :

- `restitution_tab_viewed`
- `restitution_share_opened`
- `restitution_share_link_copied`
- `restitution_share_channel_clicked`
- `restitution_pdf_export_clicked`

Lecture produit :

- Si peu d'utilisateurs cliquent `Plan`, la synthese ne pousse pas assez vers l'action.
- Si beaucoup cliquent `Carte stack`, ils cherchent a verifier la credibilite.
- Si beaucoup cliquent `A revoir`, le vocabulaire de synthese peut manquer de preuves.
- Si peu de PDF/export, la restitution n'est peut-etre pas assez partageable.

## Definition of done

- Un utilisateur non technique termine le diagnostic sans aide.
- Il peut resumer le verdict en une phrase.
- Il identifie une premiere action concrete.
- Il comprend que les details sont optionnels.
- La session est captee en base avec la selection, les evenements et la restitution.

