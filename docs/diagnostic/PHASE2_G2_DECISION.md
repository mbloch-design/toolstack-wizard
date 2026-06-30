# Tooltrim — Décision G2 Phase 2, vérité catalogue et commerciale

> Date : 30 juin 2026
> Périmètre : Créatif uniquement
> Type de décision : validation autonome interne
> Protocole source : `docs/diagnostic/PHASE2_COMMERCIAL_TRUTH_PROTOCOL.md`

## Décision

**G2 autonome : accepté avec réserves.**

Tooltrim possède maintenant une base commerciale suffisamment robuste pour poursuivre la roadmap interne : plusieurs contrats dans une même famille, coûts groupés sans double comptage, fonctions IA incluses, contrats sponsorisés et coûts variables.

Cette décision ne remplace pas une validation terrain ni un audit catalogue exhaustif.

## Ce qui est validé

- Un fournisseur reste un seul bloc de revue, mais peut contenir plusieurs lignes d’accès.
- Adobe peut représenter Photography personnel + une autre application payée par un client.
- Creative Cloud employeur peut coexister avec un plugin acheté personnellement.
- Figma payé par l’équipe reste distinct d’un Midjourney personnel.
- Canva AI incluse dans Canva Pro ne devient pas un abonnement séparé.
- Maxon One et Octane peuvent coexister comme contrats distincts dans une chaîne 3D.
- Un outil gratuit avec crédits payants peut porter un coût variable sans faux abonnement.
- Les produits couverts par un contrat confirmé passent à coût marginal nul dans le diagnostic.

## Changements appliqués

### Moteur commercial

- ajout de `contractsForFamily`, `contractProductNames`, `contractCoversProduct` et `contractsCoveringProduct` ;
- conservation de `contractForFamily` comme fallback de compatibilité ;
- ajout de plans `client_paid` et `included_elsewhere` dans les familles configurées pertinentes ;
- calculs de budget inchangés mais protégés par nouveaux scénarios multi-contrats.

### Revue commerciale

- `CommercialAccessReview` affiche plusieurs lignes d’accès dans une même famille ;
- une famille non couverte propose une première ligne ;
- une famille partiellement couverte propose une ligne supplémentaire pour les produits restants ;
- les coûts et enveloppes IA restent attachés à la ligne d’accès concernée.

### Tests

Scénarios ajoutés ou renforcés :

- Adobe Photography + Illustrator client ;
- Creative Cloud employeur + plugin personnel ;
- Canva Pro + Canva AI ;
- Maxon One + Octane séparé ;
- outil gratuit + crédits variables ;
- rendu de plusieurs lignes d’accès dans une famille.

## Réserves

- L’édition fine des produits couverts dans une ligne reste limitée.
- Les sources et dates tarifaires existent dans le modèle, mais leur exposition UX reste à améliorer.
- Les plans configurés par famille restent des fallbacks codés et doivent être audités avant bêta.
- Plusieurs payeurs complexes dans une même facture ne sont pas encore modélisés finement.
- G1 terrain reste non validé : la Phase 2 est acceptée pour autonomie interne.

## Validation attendue

Avant livraison :

- `npm run validate:phase2` ;
- `npm run validate:diagnostic` ;
- `npm run validate:g0` ;
- `git diff --check`.

## Décision finale

La Phase 2 peut être considérée comme **G2 autonome accepté avec réserves**.

La prochaine phase interne autorisée est la Phase 3 — diagnostic et restitution de confiance — si les validations restent vertes.

Si l’objectif est une validation marché, il faut toujours rejouer les sessions Phase 1 terrain et observer les cas Phase 2 avec de vrais créatifs.
