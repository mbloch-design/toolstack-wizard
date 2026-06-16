# GO61 - Billing Model par outil

Date: 2026-06-15

## Pourquoi

Le mot "plan" est trop pauvre pour ToolTrim. Un utilisateur ne paie pas tous les outils de la meme maniere :

- un SaaS peut avoir Free / Pro / Team ;
- Adobe peut etre une app seule, un bundle Photography, Creative Cloud All Apps ou une licence entreprise ;
- un plugin After Effects peut etre un achat unique ;
- un outil IA ou d'assets peut fonctionner aux credits, a l'usage ou via marketplace ;
- certains outils sont deja inclus dans une suite ou une licence equipe.

L'interface doit donc demander le **mode d'usage / mode de paiement**, pas seulement "le plan".

## Taxonomie

`ToolBillingModel` decrit la logique economique de l'outil :

- `free`
- `subscription`
- `seat`
- `team`
- `bundle`
- `one_time`
- `usage_based`
- `credits`
- `marketplace`
- `custom_quote`
- `included`

`ToolBillingChoice` decrit ce que l'utilisateur choisit dans le diagnostic :

- `free`
- `paid`
- `team`
- `single_app`
- `bundle`
- `included`
- `one_time`
- `usage`
- `credits`
- `marketplace`
- `custom_quote`
- `unknown`

## Regles UX

- Le selecteur lit `pricing_v5.billing_options` si elles existent.
- Sans options explicites, il retombe sur un fallback coherent selon `billing_model`.
- Les libelles visibles sont adaptes : "Lightroom seul", "Photography plan", "Inclus Creative Cloud", "Achat unique", "Credits", etc.
- "Achat unique" et "Deja inclus" ne sont pas affiches comme "Gratuit".
- `usage`, `credits`, `marketplace`, `custom_quote` et `unknown` restent des signaux a verifier.
- Le budget mensuel confirme ne melange pas les montants confirmes et les montants variables.

## Cas traites

- Adobe Lightroom : `single_app`, `bundle`, `included`, `team`, `unknown`
- Adobe Creative Cloud / Photoshop / Illustrator / Premiere / After Effects : app seule, bundle, licence equipe, inclus, inconnu selon le cas
- Figma : Starter, Professional seat, Organization/equipe, inconnu
- Canva : Free, Canva Pro, Canva Teams, inclus equipe, inconnu
- Envato Elements : abonnement Core, Teams, achat marketplace, inconnu
- Outils one-time : Affinity Photo, Procreate, Topaz Video AI, Nik Collection, Overlord, GifGun, RightFont
- Outils credits/usage : Remove.bg, Adobe Firefly

## Validation

`npm run validate:go61` verifie que :

- les types ne sont plus limites a `free / paid / team`;
- la logique budget distingue achat unique, deja inclus et gratuit ;
- le selecteur n'utilise plus une grille universelle ;
- Adobe, outils one-time, outils credits et abonnements exposent les bons choix.
