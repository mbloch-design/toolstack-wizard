# R5 — Contre-revue du 9 octobre 2026

La première passe avait surtout borné les relations et sécurisé le build. La contre-revue a trouvé des défauts de promesse et de couverture des tests qui méritaient correction. Le lot reste **local, non publié** ; **R5 n’est pas validé éditorialement**. Base : `7793a5e1bc`. Les preuves de la première passe sont conservées.

## Défauts établis et corrections

| Défaut | Preuve | Correction |
|---|---|---|
| Parent/enfant déclarés pouvaient être classés comme alternatives | Fixtures avec `bundle_parent`, lien alternatif explicite et usage partagé, dans les deux sens | Le rattachement de suite précède la classification alternative |
| `host_app` était assimilé à un plugin, même pour les fonctions Figma intégrées | Dev Mode/Draw : descriptions catalogue et sources Figma | « Extension » réservé au type plugin ; autres dépendances : « Rattaché à » |
| Comparaisons ambiguës devenaient des alternatives | Figma/Framer et surfaces ChatGPT/Claude/DeepSeek/AI Studio | Réserves de périmètre explicites ; Framer→Figma exclu, autres comparaisons signalées à vérifier |
| Les tests synthétiques de suite ne couvraient pas les types réels erronés | Creative Cloud déclaré `metier` ; Lite lié à After Effects via `bundle_parent` | Tests catalogue réels et réserves précises, sans modifier silencieusement les données |
| Un tag de public métier était traité comme une fonctionnalité de production | Cinebench : benchmark CPU/GPU, tag `motion-design` | Comparaison à vérifier ; aucune assertion de production d’animation graphique |
| La diversification pouvait promouvoir une comparaison à vérifier | Quatre plugins du même hôte puis une comparaison faible | Les comparaisons explicitement réservées passent après les autres relations |
| L’URL `angle` était ignorée autour d’un outil | Recette réelle `vercel?angle=extensions`, avant correction | Angle et catégorie se combinent ; angle visible et effaçable ; reset de l’état vide efface les deux, conserve la destination |
| Les chiffres manuels pouvaient rester liés à un ancien classement | Fixtures de grades manquants, doublons, orphelins, rangs et libellés obsolètes | Commande de contrôle des preuves et calcul du seuil, distinct du succès technique |
| Type déclaré incomplet | Le catalogue contient déjà `tool_type:"bundle"`, absent de `ToolType` | Type aligné avec cette valeur existante ; aucun prix ni fait catalogue changé |

Le filtrage de l’URL est corrigé sur les routes outils, y compris hors pilote ; leur moteur de relations reste celui d’origine. Les routes sans filtre conservent donc leurs résultats hors pilote. Les objectifs et sélections multi-outils conservent leur politique antérieure.

Les neuf réserves sont des restrictions temporaires de **promesse**, pas une seconde base catalogue. Elles doivent être réexaminées lorsque R6 réconcilie les fiches. Leur maintien prudent ne certifie pas les 30 sources ni les éventuelles données distantes différentes. La comparaison automatique indépendante confirme encore les sorties identiques à `af8db1a9bf` pour les 1 210 sources visibles hors pilote et une sélection multi-source.

## Résultat éditorial

Les 236 paires de la nouvelle fenêtre top10 sont appréciées à partir des jugements précédents, d’une contre-revue ciblée et de vérifications officielles sélectionnées. Les cas partiels et inconnus ne sont pas promus grâce à une nouvelle phrase. Les grades incluent des limites d’identité et de fonction, pas seulement la présence d’un tag.

| Fenêtre | Disponibles | Crédibles | Partiels | Inconnus | Rejetés | Manquants | Réserves critiques de promesse |
|---|---:|---:|---:|---:|---:|---:|---:|
| Top4 | 114 / 120 | 69 | 39 | 6 | 0 | 6 | 0 |
| Top8 | 198 / 240 | 126 | 65 | 7 | 0 | 42 | 0 |
| Top10 | 236 / 300 | 147 | 82 | 7 | 0 | 64 | 0 |

Top8 : **63,64 % des résultats disponibles**, **52,50 % des 240 places prévues**. Les cinq réserves critiques de promesse des quatre premiers de la première passe sont levées dans cette fenêtre ; les identités assistant/API restent inconnues. Le top10 ne contient plus le rejet Framer→Figma. La comparaison Figma→Framer est toujours disponible plus bas, avec avertissement : sortie du top10 ne signifie pas suppression.

Le taux crédible disponible de 64,1 % dans la première passe n’est **pas** devenu un meilleur taux artificiellement : la contre-revue est plus prudente sur les fonctions intégrées et la synchronisation. Ce qui a été gagné est une réduction de promesses excessives et des filtres réellement vérifiés. Aucun gain SEO de classement ni validation par de vrais utilisateurs n’est annoncé.

Le seuil conservateur exige ≥80 % de relations crédibles sur les 240 places top8 et aucune réserve critique dans les quatre premiers. Les places vides, `partial` et `unknown` ne comptent jamais comme succès. **NOT_ATTAINED** demeure le verdict.

## Preuves reproductibles

- [Revue ciblée initiale](proofs/explorer-r5-second-2026-10-09/editorial-review.json), [candidat actuel](proofs/explorer-r5-second-2026-10-09/candidate.json), [jugements finaux et réserves hors top10](proofs/explorer-r5-second-2026-10-09/independent-review.json), [manifest et métriques calculées](proofs/explorer-r5-second-2026-10-09/manifest.json).
- `npm run audit:explorer-r5` : vérifie les empreintes catalogue/candidat/jugements, rejoue le moteur, exige les mêmes sources, rangs, directions et libellés, puis recalcule les chiffres. Une cohérence technique n’est pas une preuve d’authenticité de source ni d’exactitude éditoriale.
- `npm run audit:explorer-r5 -- --require-quality` : impose aussi le seuil éditorial ; retourne actuellement **1**, comme attendu. Un build vert ne ferme pas R5.
- [Vérification technique](proofs/explorer-r5-second-2026-10-09/verification.md). Tests de défauts constatés en échec avant correction ; première trace navigateur analysée plutôt que timeout augmenté.

Sources officielles supplémentaires : [Creative Cloud](https://www.adobe.com/creativecloud.html), [Cinema 4D Lite](https://helpx.adobe.com/after-effects/desktop/work-with-other-applications/work-with-cinema-4d-and-cineware/c4d.html), [Cinebench](https://www.maxon.net/en/cinebench), [Cineware](https://www.maxon.net/en/cineware). Les références ciblées restantes et leurs limites sont inscrites dans les revues.

## Suite nécessaire

R6 doit réconcilier les surfaces assistant/API, les rôles de suite/édition/fonction/plugin et les tags fonctionnels dans le catalogue commun. Ensuite rejouer ce pilote et réexaminer les restrictions. Le cas `workflows` reste insuffisamment précis pour assimiler orchestration, synchronisation et Copilot ; la contre-revue ne l’a pas certifié. La diversité des résultats après les premiers rangs et la compréhension utilisateur restent à observer. Le suivi focus/scroll/clavier après retour reste dans R8. Aucun paiement, email, stockage serveur, migration catalogue ou déploiement dans cette repasse.
