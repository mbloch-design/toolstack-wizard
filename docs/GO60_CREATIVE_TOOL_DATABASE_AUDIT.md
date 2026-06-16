# GO60 - Creative Tool Database Audit

Date: 2026-06-15

## Objectif

Nettoyer le socle de donnees qui alimente le parcours Creatif. Le probleme n'etait pas seulement UX : le diagnostic proposait parfois des placeholders, des doublons ou des prix faux comme s'il s'agissait de vrais outils verifies.

## Sources officielles consultees

- Figma pricing: https://www.figma.com/pricing/
- Adobe Creative Cloud plans: https://www.adobe.com/creativecloud/plans.html
- Adobe Lightroom plans: https://www.adobe.com/products/photoshop-lightroom/plans.html
- Envato Elements pricing: https://elements.envato.com/pricing
- LottieFiles pricing: https://lottiefiles.com/pricing
- Rive pricing: https://rive.app/pricing
- Spline pricing: https://spline.design/pricing
- Tella pricing: https://www.tella.tv/pricing
- Canva pricing: https://www.canva.com/pricing/

## Corrections appliquees

- Les suggestions Creatif ne poussent plus les placeholders comme `mockup-plugins`, `presets-lightroom`, `lightroom-presets`, `brand-kits`, `canva-kits` ou le doublon `krea`.
- Les doublons d'id sont retires lors de la normalisation. Le cas le plus visible etait `framer`, present deux fois avec le meme id.
- Le type `Tool.tool_type` accepte maintenant les valeurs reellement presentes dans le catalogue: `metier`, `plugin`, `specialise`, `bundle`.
- Les outils Creatif suggeres doivent avoir des `functional_needs`, sinon ils ne peuvent pas etre correctement compris par le scoring.
- `Adobe Lightroom`, `Envato Elements`, `Nik Collection`, `Topaz Video AI`, `Overlord` et `GifGun` ne sont plus marques comme gratuits quand l'usage pro implique un plan payant ou une licence non mensuelle.
- Les prix sources en USD gardent leur devise source et un taux de conversion explicite vers EUR quand le comparatif a besoin d'un montant mensuel.

## Doctrine produit

Un outil peut rester dans la base comme reference faible, mais il ne doit pas etre suggere dans le parcours si ce n'est pas un vrai choix utilisateur clair. Pour le persona Creatif, la valeur vient surtout des satellites: plugins Figma, librairies d'assets, font managers, mockups, outils de livraison client, audio/video add-ons et gestion des droits.

## Validation

La validation `npm run validate:go60` echoue si:

- une suggestion Creatif pointe vers un outil absent;
- une suggestion pousse un placeholder ou un doublon connu;
- une suggestion n'a pas de `functional_needs`;
- un outil payant/non mensuel connu est encore marque `Free`;
- un outil price dans les suggestions n'a pas de source.

## Suite

La prochaine passe doit traiter les autres personas avec la meme methode:

- Tech / Dev: frameworks, observabilite, hosting, tests, API, auth, DB, CI.
- Conseil: CRM, proposal, signature, visio, knowledge, delivery, facturation.
- Content: newsletter, SEO, social scheduling, AI writing, asset management.
- Ops / Business: finance, BI, process, HR, legal, automation.
