# Tooltrim — Protocole Phase 2, vérité catalogue et commerciale

> Statut : actif en autonomie interne
> Date d’ouverture : 30 juin 2026
> Périmètre : verticale Créatif uniquement
> Pré-requis : G1 autonome accepté avec réserves fortes, sans revendiquer G1 terrain.

## 1. Objectif Phase 2

Garantir qu’un outil, une fonction IA, un plugin, une suite, un service et un contrat ont chacun une place claire.

La promesse n’est pas “Tooltrim connaît tous les prix”. La promesse est :

- ne pas compter deux fois ;
- ne pas confondre usage et financement ;
- ne pas transformer une suite en outil de workflow ;
- ne pas inventer un abonnement quand une fonction est incluse ;
- garder l’incertitude visible sans bloquer le diagnostic.

## 2. Grammaire commerciale cible

Chaque ligne commerciale doit pouvoir décrire :

- fournisseur ou famille commerciale ;
- contrat ou accès ;
- formule ou plan ;
- payeur : utilisateur, employeur, client, partagé ou inconnu ;
- produits couverts ;
- coût mensuel confirmé ;
- coût variable ou crédits ;
- statut de l’enveloppe IA ;
- état confirmé ou à vérifier.

Un fournisseur peut avoir plusieurs lignes d’accès.

Exemples :

- Adobe Photography personnel + Illustrator payé par un client ;
- Creative Cloud employeur + plugin acheté personnellement ;
- Figma payé par l’équipe + Midjourney personnel ;
- Maxon One + Octane séparé.

## 3. Règles produit

1. Une famille commerciale reste un seul bloc mental dans l’interface.
2. À l’intérieur du bloc, plusieurs accès peuvent coexister.
3. Un produit couvert par un contrat confirmé a un coût marginal nul.
4. Un contrat payé par employeur, client ou inclus ailleurs peut être confirmé à `0 €/mois` côté utilisateur.
5. Un coût variable ou des crédits sont rattachés au contrat concerné, pas à un outil dupliqué.
6. Une fonction IA intégrée doit hériter du contrat de son hôte ou de sa fonction incluse.
7. Un prix catalogue ou un contrat non confirmé ne peut pas produire un verdict “optimisé”.
8. Un outil inconnu peut rester dans la stack avec un contrat inconnu sans bloquer.

## 4. Scénarios G2 obligatoires

| Scénario | Attendu |
|---|---|
| Adobe Photography personnel + Illustrator client | Adobe reste une famille, deux accès, total utilisateur = Photography uniquement |
| Creative Cloud employeur + plugin personnel | Adobe = coût utilisateur nul, plugin séparé = coût personnel |
| Figma équipe + Midjourney personnel | Figma sponsorisé, Midjourney abonnement séparé |
| Canva Pro + Canva AI incluse | un contrat Canva, Canva AI sans abonnement séparé |
| Cinema 4D + Maxon One + Octane séparé | Maxon One et Octane restent deux contrats |
| outil gratuit avec crédits payants | abonnement nul, coût variable déclaré |

## 5. Implémentation Phase 2 autonome

Le lot autonome du 30 juin 2026 couvre :

- support de plusieurs contrats dans une même famille ;
- plans `client_paid` et `included_elsewhere` ajoutés aux familles pertinentes ;
- revue commerciale capable d’afficher plusieurs lignes d’accès dans un même bloc fournisseur ;
- calcul de coût fondé sur l’union des produits couverts par les contrats confirmés ;
- tests des six scénarios G2 obligatoires ;
- garde-fou documentaire `npm run validate:phase2`.

## 6. Réserves G2

Encore à renforcer avant bêta :

- édition fine des produits couverts dans une ligne de contrat ;
- politique de fraîcheur tarifaire plus visible côté UI ;
- audit exhaustif des métadonnées catalogue `provider_id`, `commercial_family`, `host_app` ;
- plusieurs contrats simultanés avec payeur partagé et refacturation partielle ;
- meilleure copie utilisateur pour les libellés `contrat`, `accès`, `plan`, `crédits`.

## 7. Critères de validation autonome

- `npm run validate:phase2` passe ;
- tests métier ciblés passent ;
- TypeScript passe ;
- `npm run validate:g0` passe avant livraison ;
- `AI_HANDOFF.md` indique Phase 2 active sans ouvrir Tech, Conseil, Content ou Ops.
