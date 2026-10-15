# Search Console — lecture UI du 15 octobre 2026

Source mesurée : session Chrome native déjà connectée à la propriété `sc-domain:tooltrim.com`, observée via CUA et arbre d’accessibilité. Aucune API GSC disponible dans les connecteurs découverts. Aucune nouvelle connexion, demande d’indexation, soumission de sitemap, validation ou modification de propriété effectuée. Cette transcription conserve uniquement les données ToolTrim utiles, sans données de compte personnel.

## Couverture

URL du rapport : https://search.google.com/u/0/search-console/index?resource_id=sc-domain%3Atooltrim.com

Périmètre affiché : « Toutes les pages connues ». Dernière mise à jour affichée : **09/10/2026**, six jours avant cette lecture. Compteurs arrondis affichés : « Dans l’index 13,3 k » ; « Non indexées 10 k », « 11 motifs ». Tableau visible : lignes 1–10 sur 11 ; le onzième motif n’a pas été relevé et n’est pas inventé.

| Motif affiché | Pages | Validation affichée |
|---|---:|---|
| Page avec redirection | 5 571 | Échec |
| Autre page avec balise canonique correcte | 143 | Échec |
| Page en double sans URL canonique sélectionnée par l’utilisateur | 115 | Échec |
| Exclue par la balise noindex | 48 | Échec |
| Soft 404 | 5 | Échec |
| Explorée, actuellement non indexée | 1 689 | Échec |
| Page en double : Google n’a pas choisi la même URL canonique que l’utilisateur | 72 | Échec |
| Bloquée par le fichier robots.txt | 1 072 | Commencé |
| Introuvable (404) | 41 | Commencé |
| Erreur liée à des redirections | 1 | Commencé |

Amélioration « Indexée malgré le blocage par le fichier robots.txt » : 0.

Les statuts de validation sont ceux du rapport historique. Une redirection, une exclusion noindex ou une autre canonical peuvent être intentionnelles ; leur présence dans cette liste ne démontre pas un défaut actuel de la page cible.

## Exemples de blocage robots

Rapport ouvert : https://search.google.com/u/0/search-console/index/drilldown?resource_id=sc-domain%3Atooltrim.com&item_key=CAMYByAC

Validation commencée le 08/09/2026. Exemples affichés, explorations anciennes du 6 au 8 septembre :

- https://tooltrim.com/en/selector?from=nusii — 8 septembre
- https://tooltrim.com/en/selector?from=nearst — 8 septembre
- https://tooltrim.com/fr/selector?from=coupler-io — 8 septembre
- https://tooltrim.com/fr/selector?from=coreldraw — 7 septembre
- https://tooltrim.com/fr/selector?from=wized — 7 septembre
- https://tooltrim.com/fr/selector?from=harvest — 7 septembre
- https://tooltrim.com/en/selector?from=boompop — 7 septembre
- https://tooltrim.com/en/selector?from=claude — 7 septembre
- https://tooltrim.com/en/selector?from=motion — 7 septembre
- https://tooltrim.com/fr/selector?from=fontbase — 6 septembre

Le robots public actuel ne bloque que `/api/` dans le groupe général et permet ces anciennes URLs. La configuration serveur redirige `/selector` vers `/ma-stack`. Ne pas déduire des 1 072 anciennes exclusions un blocage actuel des URLs canoniques du sitemap.

## Sitemap

Rapport : https://search.google.com/u/0/search-console/sitemaps?resource_id=sc-domain%3Atooltrim.com

Seule ligne affichée : `https://tooltrim.com/sitemap.xml`, type « Sitemap », envoyé le **9 septembre 2026**, dernière lecture **15 octobre 2026**, état **« Opération effectuée »**, **13 148 pages découvertes**, 0 vidéos. Le nombre découvert ne signifie pas que toutes ces pages sont indexées.

## Inspection des deux guides corrigés dans le lot 1

FR : https://search.google.com/u/0/search-console/inspect?resource_id=sc-domain%3Atooltrim.com&id=ksHKMCrh33QFdaRN7Qt0Cg

URL inspectée exacte : `https://tooltrim.com/fr/guide/stack-redactrice-freelance`. Résultat « Cette URL est sur Google », « La page est indexée ». Dernière exploration **17 juillet 2026, 15:49:41**, Googlebot smartphone ; exploration autorisée Oui, récupération Réussie, indexation autorisée Oui. Canonical déclarée : URL inspectée ; canonical choisie par Google : « URL inspectée ». HTTPS valide ; Fils d’Ariane, 2 éléments valides détectés. Champ Sitemaps : « Erreur de traitement temporaire » ; page d’origine historique `https://www.tooltrim.com/fr/tool/perplexity/alternatives`. Ce champ historique ne remplace pas le sitemap global lu avec succès le 15 octobre.

EN : https://search.google.com/u/0/search-console/inspect?resource_id=sc-domain%3Atooltrim.com&id=BMThrYc60mXJ2hfKmy2h1Q

URL inspectée exacte : `https://tooltrim.com/en/guide/stack-freelance-writer`. Résultat « Cette URL est sur Google », « La page est indexée ». Dernière exploration **25 juillet 2026, 13:41:23**, Googlebot smartphone ; exploration autorisée Oui, récupération Réussie, indexation autorisée Oui. Canonical déclarée : URL inspectée ; canonical choisie par Google : « URL inspectée ». HTTPS valide ; Fils d’Ariane, 2 éléments valides détectés. Champ Sitemaps : « Aucun sitemap référent détecté » ; page d’origine historique `https://tooltrim.com/en/tool/calendly/prix`.

Ces deux inspections portent sur l’état connu de Google avant publication des descriptions du lot 1 ; elles ne prouvent ni leur réexploration, ni une progression de classement causée par le lot.

## Contexte performances, sans causalité attribuée

Rapport Performances déjà ouvert : type Web, fenêtre affichée du 13 juillet au 12 octobre 2026 (3 mois), dernière mise à jour « il y a 11,5 heures ». Compteurs UI arrondis : **1,12 k clics, 370 k impressions, CTR moyen 0,3 %, position moyenne 31,1**. Aucun comparatif avant/après ni export complet n’a été réalisé ; aucune amélioration liée aux correctifs n’est revendiquée.

## Inspection d’une page Explorer canonique

https://search.google.com/u/0/search-console/inspect?resource_id=sc-domain%3Atooltrim.com&id=oIMtkFsb3HMrcxQ3DuSGwA

URL inspectée exacte : `https://tooltrim.com/en/explorer/around/notion`. Résultat « Cette URL est sur Google », « La page est indexée ». Dernière exploration **29 août 2026, 08:59:18**, Googlebot smartphone ; exploration autorisée Oui, récupération Réussie, indexation autorisée Oui. Canonical déclarée : URL inspectée ; canonical choisie Google : « URL inspectée ». HTTPS valide. Champ Sitemaps « Aucun sitemap référent détecté ». Pages d’origine affichées : `/en/explorer/around/bamboohr`, `/fr/explorer/around/notion`, et ancien `https://www.tooltrim.io/sitemap.xml`. Ce sont des références historiques affichées par Google ; elles ne changent pas la canonical actuelle `https://tooltrim.com`.
