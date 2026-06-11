# GO42 - Strategie UX onboarding ToolTrim

## Nom du pattern vise

Le tunnel ToolTrim ne doit pas etre pense comme un simple formulaire. Le bon pattern est :

**Adaptive guided audit onboarding**

En francais : **onboarding d'audit guide et adaptatif**.

Il combine quatre methodes UX :

- **Conversational onboarding** : une intention claire par ecran, langage humain, pas de formulaire administratif.
- **Branching onboarding** : les questions et suggestions changent selon le profil, l'objectif et les outils selectionnes.
- **Progressive profiling** : on demande l'information au moment ou elle devient utile, pas tout au depart.
- **Live configuration / stack builder** : l'utilisateur voit sa stack se construire en direct, avec un feedback satisfaisant.

La promesse ressentie doit etre :

> "Je ne remplis pas un questionnaire. Je suis accompagne par un expert qui reconstruit ma stack, verifie les angles morts, puis me raconte ce que je dois faire."

## Probleme UX actuel

Le tunnel a progresse, mais il reste une ambiguite de posture :

- parfois l'utilisateur a l'impression de remplir un formulaire ;
- parfois il croit devoir choisir parmi une liste de suggestions ;
- parfois il ne comprend pas comment ses choix influencent l'algorithme ;
- parfois il voit des elements d'analyse trop tot, avant d'avoir confiance dans la capture ;
- le dashboard ressemble encore trop a un espace de consultation, pas assez a une restitution guidee.

Le risque : l'utilisateur doute de la precision de l'audit.

## Architecture cible du parcours

### 1. Calibrage

Role UX : rassurer, personnaliser, limiter les mauvaises suggestions.

Pattern : **progressive profiling court**.

Questions utiles :

- "Tu fais surtout quoi ?"
- "Qu'est-ce que tu veux ameliorer en priorite ?"
- "Tu veux personnaliser le rapport avec ton prenom/email ?"

Regle UX :

- une seule decision principale par ecran ;
- expliquer pourquoi la question existe ;
- eviter les cartes trop nombreuses ;
- ne pas demander de budget outil ici.

### 2. Capture de stack

Role UX : construire la stack reelle sans oubli.

Pattern : **guided stack builder**.

Principe :

- on guide par zones de travail ;
- chaque zone pose une question simple ;
- les suggestions sont des reperes, pas une liste a cocher ;
- la stack visible suit l'utilisateur en permanence ;
- la selection d'un outil doit etre instantanement satisfaisante.

Interaction cible pour un outil :

- clic sur l'outil = ajout immediat ;
- la carte ne change pas de taille ;
- le choix du plan est dans la carte ;
- l'etat selectionne est clair ;
- le prix garde sa devise source ;
- la stack laterale se met a jour avec logo, plan, prix et couverture.

Regle importante :

> On ne doit jamais donner l'impression que ToolTrim force une liste. L'utilisateur doit sentir qu'il declare sa vraie stack.

### 3. Verification intelligente

Role UX : poser seulement les questions qui changent le verdict.

Pattern : **adaptive follow-up questions**.

Exemples :

- si plusieurs IA sont selectionnees : demander l'usage principal ;
- si outil payant avec plan gratuit possible : demander le plan reel ;
- si outil de recherche + outil IA generaliste : verifier le chevauchement ;
- si outil cher mais usage faible : verifier frequence ou criticite.

Regle UX :

- expliquer "je te pose cette question parce que..." ;
- ne jamais poser une question generique qui ne change pas la restitution ;
- limiter a 2-4 questions vraiment utiles.

### 4. Pre-verdict

Role UX : faire monter la confiance avant la restitution.

Pattern : **confidence bridge**.

But :

- confirmer que l'audit a bien compris ;
- montrer les signaux detectes ;
- annoncer ce que le dashboard va raconter.

Ce n'est pas encore le dashboard. C'est une transition :

> "J'ai capte ta stack. Voici les signaux principaux. Maintenant je te montre le plan."

### 5. Restitution

Role UX : raconter une histoire claire, pas afficher un dashboard dense.

Pattern recommande : **guided report**, pas dashboard classique.

Le premier ecran doit repondre a quatre questions :

1. "Qu'est-ce que ToolTrim a compris de moi ?"
2. "Quel est le verdict en une phrase ?"
3. "Quelles sont les 2-3 decisions prioritaires ?"
4. "Qu'est-ce que je dois faire maintenant ?"

Les onglets secondaires doivent etre des annexes :

- preuves ;
- carte de stack ;
- plans/prix a verifier ;
- alternatives ;
- export/partage.

Regle UX :

> Le dashboard ne doit pas etre le produit principal. La restitution guidee est le produit principal.

## Methodes UX a appliquer

### Methode Typeform

A garder :

- une question claire ;
- rythme calme ;
- progression visible ;
- feedback immediat ;
- langage conversationnel.

A ne pas copier aveuglement :

- une question par ecran partout, car la selection d'outils a besoin d'une vision de stack ;
- trop d'animations ;
- trop de vide si l'utilisateur doit comparer plusieurs outils.

### Methode TurboTax / assistant fiscal

Tres pertinente pour ToolTrim.

Pourquoi :

- l'utilisateur ne sait pas toujours quelles infos sont importantes ;
- le systeme doit guider sans culpabiliser ;
- chaque question doit sembler justifiee ;
- la restitution doit transformer des reponses en decisions.

### Methode setup wizard SaaS

Pertinente pour la partie "stack builder".

Pourquoi :

- progression par zones ;
- confirmation de couverture ;
- possibilite de revenir corriger ;
- sentiment d'avancement concret.

### Methode audit consultant

C'est la plus importante pour le ton.

ToolTrim doit sonner comme :

- "je clarifie" ;
- "je verifie" ;
- "je priorise" ;
- "je ne juge pas".

Pas comme :

- "remplis tout" ;
- "choisis dans ma liste" ;
- "voici un score brutal" ;
- "voici 12 onglets a comprendre".

## Roadmap UX recommandee

### Phase 1 - Clarifier le tunnel

- Renommer mentalement le parcours : audit guide, pas diagnostic formulaire.
- Revoir les titres d'etapes pour raconter une progression.
- Supprimer les repetitions de type "diagnostic guide" quand elles n'aident pas.
- Chaque ecran doit avoir une seule mission.

### Phase 2 - Renforcer la selection d'outils

- Stabiliser les cartes outil sans changement de hauteur.
- Garder le choix du plan dans la carte.
- Afficher la stack vivante comme un objet qui se construit.
- Ajouter une micro-satisfaction a l'ajout : logo qui apparait, compteur qui bouge, couverture qui progresse.
- Reinitialiser clairement la recherche a chaque nouvelle zone.

### Phase 3 - Rendre l'algo visible sans etre technique

- Montrer pourquoi chaque zone existe.
- Montrer pourquoi une question de verification apparait.
- Montrer ce que le profil et l'objectif changent dans l'analyse.
- Eviter le jargon "score", "algo", "coverage" cote utilisateur.

### Phase 4 - Transformer le dashboard en restitution guidee

- Premier ecran : verdict narratif + priorites.
- Les chiffres deviennent des preuves, pas le centre.
- Les onglets deviennent des annexes.
- Ajouter un chemin "Lire en 3 minutes".
- Ajouter un chemin "Agir maintenant".

### Phase 5 - Back-office et donnees

- Capturer les signaux de friction :
  - zone sautee ;
  - recherche sans resultat ;
  - outil ajoute manuellement ;
  - plan inconnu ;
  - retour arriere ;
  - abandon avant restitution.
- Ces signaux doivent aider a ameliorer le catalogue et les questions.

## Decision produit

La meilleure experience ToolTrim n'est pas un dashboard SaaS.

C'est un **audit guide avec restitution narrative**.

Le dashboard existe seulement pour explorer les preuves et les details apres la lecture principale.

La prochaine passe doit donc prioriser :

1. clarte de l'histoire ;
2. satisfaction de construction de stack ;
3. questions adaptatives utiles ;
4. restitution orientee decision ;
5. instrumentation back-office des zones de friction.

