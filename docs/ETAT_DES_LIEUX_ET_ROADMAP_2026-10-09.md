# ToolTrim — état des lieux et roadmap par lots

**État vérifié le 9 octobre 2026.** Ce document remet en perspective la séquence de revue technique du 7 au 9 octobre. Il distingue le code publié, les résultats locaux, les mesures historiques et les propositions futures. Il ne certifie pas tout le produit ni la base distante.

## Lecture rapide

**Le socle de livraison est plus fiable, plusieurs bugs de navigation/stockage/prix sont corrigés, et le catalogue reste intact.** Le site n’a pas subi de refonte d’architecture de données pendant ces correctifs. Les améliorations de poids sont mesurées ; l’utilité produit et l’accélération ressentie restent à démontrer.

- **Code publié sur main :** `4601f877cf` (R1 SDK de types), après R0 `bb4bc7f94b` incluant `13b631bc1d` (contrats API). CI et statut Vercel réussis pour R0/R1 ; recette publique R1 conforme. Le rendu du site reste identique à Router `88d7f5d7a5`.
- **R1 publié et clôturé :** SDK de types retiré, 82 contrats et types réussis, audit complet 15 → 9. Build réussi, 13 162 HTML/80 JS/sitemap identiques ; CI verte et API publiques conformes. [Rapport R1](REDUCTION_SDK_TYPES_2026-10-09.md).
- **À part :** refonte locale de CategoriesIndexPage, exports/catalogue/médias et scripts non suivis. Ils sont préservés et ne sont pas revendiqués dans ces publications.
- **R2 backend — contre-audit réalisé, certification partielle :** projet public Supabase INACTIVE ; écarts de statut payé/badge/doublons reproduits localement ; maintenance locale vérifiée sur deux handlers, RLS/code distant/WAF non certifiés. [Rapport R2](CONTRE_AUDIT_BACKEND_2026-10-09.md).

[Résumé machine actualisé](proofs/sdk-types-2026-10-09/summary.json) ; le [snapshot initial](../output/tooltrim-status-2026-10-09/summary.json) reste conservé. Le statut Git distant et la dernière CI ont été relus pendant ce bilan ; les recettes historiques ne sont pas présentées comme de nouveaux tests du 9 octobre.

## 1. Ce qui a été fait

| Lot livré | Statut | Changement concret | Bénéfice / preuve |
|---|---|---|---|
| T01 — Prix et décisions | Publié, séquence `b6a045171f` / `c381f346c0` | Licences uniques/annuelles respectées ; zéro ne veut plus dire gratuit ; total partiel signalé ; devises et décisions persistées corrigées ; comparatif Claude web aligné | Évite des prix mensuels, économies ou gratuités inventés. Données source non réécrites. [Revue et recettes](REVUE_TECHNIQUE_2026-10-07.md) |
| T02 — Livraison et SEO | Publié, `c381f346c0` | CI sur les suites actives, typechecks app/outils explicites ; échec obligatoire du build si SSR manquant ; root et H1 contrôlés | Un build ne peut plus passer sur des pages indexables vides. [Contrats](CORRECTIONS_TECHNIQUES_2026-10-07.md) |
| T03 — Navigation, recherche, cache, stockage | Publié, `c381f346c0` | Chargements terminés en erreur ; recherche des guides stable ; distinction hôte/alternative ; shards revalidés ; onglets synchronisés et décisions corrompues filtrées | Moins d’écrans vides, de données obsolètes et d’écrasements successifs de choix. [Recettes](CORRECTIONS_TECHNIQUES_2026-10-07.md) |
| T04 — Dépendances compatibles | Publié, `00e1f48bd8` | DOMPurify, Vite, Vitest et chaînes transitives mis à jour, React 18 et Tailwind 3 conservés | Audit complet 53 → 17, trois entrées critiques retirées ; omit-dev 25 → 9 au snapshot. [Rapport](DEPENDANCES_SECURITE_2026-10-08.md) |
| T05 — HTML compacté | Publié, `529f962db8` | Formatage/commentaires ciblés et JSON-LD compactés avec contrôle d’équivalence | **24,62 MiB** retirés des fichiers générés, contenu conservé sur 13 162 HTML. [Preuves](COMPACTAGE_HTML_2026-10-08.md) |
| T06 — Hydratation EN | Publié, `244d7a9d52` | Champs FR nécessaires aux calculs EN conservés dans le bootstrap | Corrige une vraie divergence serveur/client, notamment Notion EN. [Rapport](CORRECTIF_HYDRATATION_EN_2026-10-08.md) |
| T07 — Sélection enregistrée | Publié, `cccdbc002b` | Restauration du stockage après le premier rendu SSR | Hydratation correcte avec sélection préexistante ; choix et reload préservés. [Rapport](CORRECTIF_HYDRATATION_STACK_2026-10-08.md) |
| T08 — Bootstrap fiches | Publié, `90af59e551` | Sept champs historiques inutilisés retirés de la copie injectée, sources complètes conservées | **5,59 MiB** retirés de l’artefact ; prix/calculs/onglets préservés. [Preuves](PROJECTION_BOOTSTRAP_2026-10-08.md) |
| T09 — Gate design | Publié, `863e4737eb` | Valeurs regroupées en tokens/classes ; dette d’ajouts résorbée | Gate revenu à 137 couleurs CSS / 223 rayons / 125 styles inline, sans relever la baseline de ce lot. Rendu contrôlé. [Rapport](GATE_DESIGN_2026-10-08.md) |
| T10 — Hydratation automatisée | Publié, `34391450cc` | 56 tests sur le véritable HTML généré après build, sur main/PR ; traces et flakes bloquants | La CI protège les bugs découverts ; durée récente **5,4 minutes** pour cette phase. [Contrat](HYDRATATION_CI_2026-10-08.md) |
| T11 — Index navigateur | Publié, `81f44da6e0` | 109 lignes déjà invisibles filtrées avant transport ; 1 239 résumés inchangés | **17 595 octets / 4,99 %** gagnés en gzip CDN ; index source complet et champs conservés. [Rapport](PROJECTION_INDEX_NAVIGATEUR_2026-10-08.md) |
| T12 — React Router 7 | Publié, `88d7f5d7a5` | Version corrigée 7.18.4, imports SSR et liens adaptés ; React 18 conservé | Deux entrées npm Router retirées ; routes/anciennes URL/HTML préservés. Aucun gain de vitesse revendiqué. [Rapport](MIGRATION_REACT_ROUTER_2026-10-09.md) |
| T13 — Contrats API | **Publié**, `13b631bc1d` via `bb4bc7f94b` | Typecheck strict API, 82 fixtures Node intégrées aux commandes/CI configurée ; quatre mutations détectées | Précondition de réduction du SDK ; handlers et lockfile inchangés, zéro email réel. Les 82 contrats passent dans la CI R0 complète verte. [Rapport](CONTRATS_API_2026-10-09.md) |
| T14 — SDK de types API | **Publié**, `4601f877cf`, CI verte et API publiques conformes | Contrat HTTP Node/Vercel compatible, quatre imports type remplacés, SDK retiré | 104 entrées lock retirées ; audit complet 15 → 9 ; JS des handlers et 13 162 HTML/80 JS/sitemap identiques. [Rapport](REDUCTION_SDK_TYPES_2026-10-09.md) |

La présence du commit de maintenance dans l’historique ne prouve pas le déploiement de fonctions Supabase ou de leurs secrets. Le contre-audit R2 révèle des écarts applicatifs et un projet INACTIVE ; WAF, RLS et contrôles maintenance distants restent non certifiés. Le contre-audit initial ne modifiait pas l’application ; le correctif de preuve paiement est maintenant validé localement, sans activation distante.

## 2. Ce que nous avons gagné — et ce que cela ne prouve pas

### Fiabilité et confiance

Le gain principal est de détecter les défauts avant publication : TypeScript analyse réellement les fichiers ciblés, les erreurs SSR arrêtent le build, et Chromium vérifie l’égalité serveur/client avec choix enregistrés. Les correctifs de prix et devise empêchent certaines conclusions financières trompeuses. Le stockage reste local-first ; deux écritures exactement simultanées ne deviennent pas une transaction distribuée.

Dernière [CI complète verte, R1](https://github.com/mbloch-design/toolstack-wizard/actions/runs/37902184529) : **266 tests applicatifs, 82 contrats API, 23 contrats SEO, 99 tests Ma Stack**, types/design/build/budgets, puis **56 hydratations sans flake en 5,2 min**. Ces suites ont des périmètres qui se recoupent : on ne les additionne pas en un nombre de bugs corrigés. Les **82 tests API** sont un ajout distinct publié et exécuté avec succès dans les CI complètes R0/R1.

Recette publique Router : 12 anciennes URL réussies. Pour l’hydratation, 55 passages directs et un scénario passé au retry après une collision de dossiers de traces ; ce scénario a ensuite passé trois fois sans retry avec une sortie isolée. La première commande conserve son exit code 1 dans les preuves ; elle n’est pas décrite comme un run public parfait.

### Poids et performance

| Mesure | Gain établi | Interprétation correcte |
|---|---|---|
| Formatage HTML | 24,62 MiB | Somme de fichiers générés, pas téléchargement d’une page |
| Bootstrap des fiches | 5,59 MiB | JSON inutilisé retiré de milliers de pages, sans suppression des faits source |
| Index navigateur | 100 976 octets décodés ; 17 595 octets gzip CDN, 4,99 % | Vrai gain réseau mesuré sur un module ; ne démontre pas une accélération d’interaction |
| Artefact récent | 824,8 MiB, dont 713,2 MiB HTML | Sous les plafonds 831 / 716 MiB ; marge d’environ 6,2 / 2,8 MiB |

Les deux transformations HTML retirent environ 30,21 MiB dans leurs comparaisons isolées. Les instantanés globaux ont aussi évolué avec d’autres intégrations et la restauration de données d’hydratation : ne pas présenter cette somme comme une réduction nette uniforme de tout le site, ni l’additionner aux octets réseau. L’artefact complet n’est pas téléchargé par un visiteur.

**Aucun gain Core Web Vitals, INP, classement Google, conversion ou temps utilisateur n’a été établi.** Les 34 mesures de parcours du 8 octobre sont une baseline avec fallback local ; elles ne constituent pas un avant/après de vitesse.

### Dépendances

Audit R1 après retrait du SDK de types : **9 entrées complètes (5 high, 4 moderate)** contre 15 auparavant, et **7 omit-dev (5 high, 2 moderate)** inchangées, zéro critique. Séquence : complet **53 → 17 → 15 → 9**, omit-dev **25 → 9 → 7**. R1 est publié dans `4601f877cf` ; sa CI distante et sa recette publique sont réussies. Cela compte des paquets et leur propagation, pas des exploits autonomes ni un pourcentage de risque éliminé.

Après R1, les chaînes restantes concernent Tailwind / globs / parseur de sélecteurs et les outils associés. La vue omit-dev contient encore des outils de build : « production npm » ne signifie pas « exécuté dans le navigateur ». [Audits R1 comparés](../output/tooltrim-sdk-types-2026-10-09/audit-after.json).

### SEO et données

Contenu initial, liens, canonical/hreflang, JSON-LD, sitemap et hydratation sont couverts par les équivalences et contrats des lots concernés. Le build récent conserve **13 162 HTML**, **13 137 URL sitemap** et **2 478 fiches Explorer contrôlées**. Le lot API conserve les 80 assets JS et le sitemap octet pour octet ; six attributs de date du jour diffèrent entre builds du 8 et du 9 octobre, seuls écarts HTML identifiés.

Aucun outil, prix, traduction ou relation n’a été supprimé des sources par les projections de transport. Cela ne certifie pas la véracité de tout le catalogue. Aucune observation Search Console ne permet ici d’affirmer un gain ou l’absence absolue d’une variation de classement.

## 3. Ce qui reste ouvert

1. **Backend réellement déployé :** R2 confirme des écarts applicatifs de confiance paiement/badge/doublons, sans email réel. API de gestion Supabase : projet public INACTIVE ; SQL/source Edge indisponibles, WAF Vercel 403. Les protections externes ne sont pas présumées absentes ; la certification reste partielle. [Détails et sous-lots R2a–R2c](CONTRE_AUDIT_BACKEND_2026-10-09.md).
2. **API catalogue saine non mesurée :** DNS Supabase échouait le 8 octobre et échoue encore lors du contrôle de résolution hors restrictions réseau dans cet environnement le 9 ; GitHub résout correctement dans le même contrôle ([preuve DNS](../output/tooltrim-status-2026-10-09/dns-check.json)). Ce n’est pas une preuve de panne pour tous les visiteurs. Les recettes avec fallback ne certifient ni latence, ni droits, ni fraîcheur des réponses distantes.
3. **Catalogue et relations :** normalisation, sources officielles, qualité des huit premiers résultats et confiance éditoriale restent des chantiers produit/données.
4. **Promesse de Ma Stack :** le calcul de recoupement ne démontre pas que l’utilisateur paie réellement en double ni qu’il peut supprimer un outil. Le libellé « Payé en double » existe encore dans CartPage et mérite un arbitrage distinct.
5. **Roadmaps produit contradictoires :** les caps V1/V2 du 5 octobre annonçaient notamment l’absence de coût global ; le composant courant présente un coût et des recoupements. Il faut aligner la promesse sur l’existant avant de développer davantage. Les checkpoints de juillet ne sont pas des statuts actuels.
6. **Recettes élargies :** accessibilité complète, Safari/WebKit, essais utilisateurs et effets mesurés sur la rapidité restent à faire. Deux résumés llms manquants et des constats historiques de logos nécessitent une revalidation ciblée avant d’être comptés comme des défauts actuels.
7. **Volumétrie :** l’HTML reste proche de son budget. Supprimer encore des champs sur une estimation théorique de 3,09 MiB n’est pas autorisé sans audit des consommateurs.

## 4. Roadmap complète proposée par lots

**R0/R1 ont été clôturés ; le contre-audit R2 a été autorisé et réalisé avec certification distante partielle.** La preuve paiement et la reprise de brouillon de R2b ont été autorisées et implémentées localement ; leur activation Creem reste à vérifier. Les autres corrections R2a–R2c et R3–R11 restent proposées. Pas de date artificielle : chaque lot se ferme sur ses preuves et non sur le temps passé. Un lot applicatif comprend préparation, test local, relecture, publication autorisée, CI et recette publique adaptée.

| Ordre / lot | État et dépendance | Objectif et livrable | Critère de sortie | Valeur / effort indicatif |
|---|---|---|---|---|
| R0 — Clôturer les contrats API | Publié via `bb4bc7f94b` ; étape API verte, CI R0 complète verte | Commit publié et nouvelle étape API vérifiée en CI | 82 tests API et types stricts exécutés par la CI distante ; aucun changement de handler | Fiabilité ; faible |
| R1 — Réduire le SDK de types | Terminé et publié `4601f877cf` ; CI/Vercel/recette publique réussis | Contrat HTTP compatible Node/Vercel ; quatre imports de types remplacés et SDK retiré | Même comportement sur les 82 contrats ; types/build/lockfile/audit comparés ; runtime de déploiement vérifié ; résultat documenté même si certains avis restent | Maintenance/sécurité de l’arbre ; faible à moyen |
| R2 — Contre-vérifier le backend manuel | Audit réalisé ; certification distante partielle, cible inactive et preuves externes à confirmer | Vérifier les protections déployées sans envois ni écritures réels : paiement, débit/déduplication, maintenance, permissions | État réel et couverture documentés ; écarts seulement traités dans un lot autorisé | Confiance opérationnelle ; effort inconnu tant que preuves absentes |
| R3 — Établir une baseline API catalogue saine | Environnement avec résolution et lecture fonctionnelles | Mesurer réponse, fraîcheur, erreurs/fallback et coût du rafraîchissement ; retrouver la chaîne de publication actuelle | Lectures réelles contrôlées, paramètres/permissions attendus, mesures reproductibles ; aucun write | Prérequis aux décisions d’architecture ; moyen |
| R4 — Aligner promesse et lecture Ma Stack | Décision produit sur l’existant ; ne dépend pas de Tailwind | Unifier le cap avec la page réellement publiée ; distinguer coût catalogue, dépense déclarée, recoupement et économie décidée | Libellés/comportements cohérents FR/EN ; aucun montant de gain sans données suffisantes ; compréhension observée | Valeur visible pour choisir ; moyen |
| R5 — Qualité des relations Explorer | Cap R4 + catalogue courant | Pilote de référence : environ 30 sources, dix résultats examinés, distinction alternative/extension/complément expliquée | Cible de la roadmap produit : ≥80 % des huit premiers crédibles, aucun faux positif critique dans les quatre premiers ; critères de jugement explicités | Confiance éditoriale ; moyen |
| R6 — Catalogue factuel et migration par canary | Coordination avec la migration catalogue existante ; après état réel R3 | Sources et identités/slug réconciliés, tarifs/médias datés, projection publique et snapshot généré depuis la base commune ; pilote borné | Pas de prix inventé ni brouillon publié ; parité fiche/SSR/SEO, rollback et empreinte hors lot ; aucun JSON supprimé avant remplacement vérifié | Cœur produit ; élevé, à découper par pilote |
| R7 — Prochaine optimisation de chargement | Après R3 et alignement avec R6 | Étudier le chargement contextualisé des résumés, puis tester un canary sur le vrai parcours ; conserver SSR et fallback | Gain réseau/interaction mesuré au même protocole, cache/hydratation/relations/stack/SEO identiques ; abandon si gain trop faible | Performance utile ; moyen à élevé |
| R8 — Accessibilité et navigateurs | Sur les parcours stabilisés R4/R5 ; contrôles ciblés à maintenir entretemps | Focus/clavier, mobile, overlay, reduced-motion et Safari/WebKit ; corriger les écarts concrets | Parcours clés FR/EN réalisables, focus restauré, aucune régression bloquante | Qualité d’usage ; moyen |
| R9 — Instrumenter et tester la valeur | Après stabilisation des parcours ; consentement respecté | Mesurer source → exploration → ajout → retour, puis essais avec au moins cinq utilisateurs cibles | Cible produit : quatre sur cinq terminent sans aide ; ajouts involontaires/destinations erronées investigués ; décision garder/ajuster/retirer | Validation produit ; moyen |
| R10 — Réexaminer Tailwind et outils associés | Lot séparé, conditionnel ; pas une urgence de navigateur démontrée | Comparer migration de compilation et possibilité de retirer les outils inutiles ; éviter un override majeur aveugle | Audit amélioré sur les chaînes visées, build et comparaison visuelle/SEO complète ; conserver v3 si coût disproportionné | Maintenance ; élevé si migration v4 |
| R11 — Entretien SEO/GEO et médias | Revalidation ciblée, compatible avec R6 | Contrôler les résumés llms absents, logos/fallbacks, liens et qualité de fiches prioritaires ; observer indexation réelle si accès disponible | Défauts actuels établis puis corrigés ; métadonnées cohérentes, crawl lisible ; gains de classement annoncés seulement s’ils sont mesurés | Visibilité/confiance ; moyen, bornable |

Efforts relatifs de planification, sans estimation en jours ni engagement de délai. R2 peut révéler une priorité supérieure ; R4/R5/R9 évitent que toute la roadmap soit absorbée par des migrations techniques. R6 doit suivre le catalogue commun existant : aucune base parallèle, aucun back-office supplémentaire proposé ici.

### Recommandation de pilotage

1. **R0/R1 terminés** : contrats API et SDK clôturés avec CI et recette publique. [Preuves de clôture](proofs/sdk-types-2026-10-09/verification.json).
2. **R2 : clarifier la cible INACTIVE et les protections manuelles externes**, puis traiter les écarts attestés dans les sous-lots R2a–R2c. R3 attend un backend joignable ; aucune baseline saine n’est revendiquée.
3. Donner la priorité produit à la promesse Ma Stack, aux relations et à une première observation utilisateur. Ne pas attendre toutes les migrations de compilation pour faire progresser la valeur perçue.
4. N’engager un nouveau découpage catalogue ou Tailwind qu’avec un gain attendu et une porte de sortie explicites.

### Backlog séparé

Comptes/synchronisation multi-appareils, collaboration, nouvelle verticale/diagnostic, personnalisation avancée, conseiller IA et dark mode ne sont pas lancés par cette roadmap. Les anciens alias diagnostic/sélecteur redirigent aujourd’hui vers Ma Stack ; une ancienne roadmap diagnostic n’autorise pas leur réactivation. Un inventaire complet des travaux catalogue non suivis demande son propre périmètre.

## 5. Règle de suivi à partir de maintenant

Avant chaque lot, présenter **le problème utilisateur, le périmètre, le gain attendu et la preuve de sortie**. Après le lot, fournir **le commit, le statut local/publié, les résultats mesurés, les limites et la prochaine décision**. Ne pas laisser un lot réalisé dans la liste « prochaines étapes », ne pas cumuler les nombres de tests et ne pas confondre build réussi avec acceptation produit.

Bilan relu indépendamment : aucune correction factuelle matérielle nécessaire. Les liens locaux et JSON ont été contrôlés ; cette relecture ne remplace pas une nouvelle recette navigateur ou une certification distante.

Le bilan initial a été publié avec R0 après autorisation. L’actualisation R2 est locale ; la preuve paiement et la reprise R2b ont ensuite été autorisées et validées localement, sans publication. Les autres sous-lots R2 et R3–R11, catégories et catalogue distant restent inchangés.

### Actualisation : preuve de paiement Creem, correctif local

Le [correctif Creem](CORRECTIF_CREEM_2026-10-09.md) conserve le checkout existant et vérifie le paiement côté serveur avant confirmation/envoi payant. Gain attesté localement : `paid=true` falsifié refusé et brouillon conservé pendant les erreurs/reprises. 113 API, 278 app, 23 SEO, types et cinq scénarios navigateur simulés passent. Aucun gain d’encaissement, d’anti-replay durable ou de référencement n’est revendiqué. Publication attend la configuration de retour/clé et la validation prestataire réelle. Badge gratuit, réutilisation du checkout et emails idempotents restent à traiter.
