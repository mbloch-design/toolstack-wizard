# GO13 - Calibration scoring et controle qualite

## Objectif

GO13 ajoute une couche de controle qualite au diagnostic ToolTrim. Le but est de detecter les cas ou le score, les economies, les signaux utilisateur et les actions recommandees ne racontent pas exactement la meme histoire.

Cette etape sert a eviter trois erreurs produit :

- presenter un arbitrage trop ferme avec peu de signaux declares ;
- produire un score faible sans action exploitable ;
- masquer un conflit entre bonne sante apparente et gaspillage eleve.

## Donnees ajoutees au diagnostic

Chaque `diagnostic_insights` contient maintenant :

- `confidence` : score de confiance calcule a partir de la profondeur outil, des questions complementaires, des reponses de fin de tunnel et des signaux explicites ;
- `calibration` : score qualite, indicateur `reviewRequired`, resume bilingue et flags de controle ;
- `calibration.flags[]` : anomalies lisibles par le back-office, avec dimension, severite, detail et action recommandee.

## Flags de calibration

GO13 detecte notamment :

- confiance faible ;
- discovery partielle ;
- score haut mais gaspillage significatif ;
- score faible sans action claire ;
- actions fortes avec confiance moyenne ;
- manques fonctionnels sans recommandation ;
- trop de risques hauts concurrents.

## Back-office

Un nouvel onglet `Qualite` est disponible dans le back-office diagnostic.

Il permet de voir :

- le nombre de diagnostics a revoir ;
- la confiance moyenne ;
- les flags hauts et moyens ;
- les sessions sans calibration GO13 ;
- l'action de revue conseillee par flag.

Le tiroir detail session affiche aussi une section `Calibration qualite GO13` avec confiance, calibration, revue humaine et flags.

## Exploitation

La calibration ne remplace pas le score metier. Elle sert de garde-fou pour savoir quand :

- relancer une session ;
- enrichir les questions complementaires ;
- revoir une regle de scoring ;
- corriger le mapping persona / besoins fonctionnels ;
- eviter de pousser une restitution trop certaine.
