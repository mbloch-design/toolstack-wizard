# ToolTrim — AI Changelog

## 2026-08-31 · Revue de 25 fiches design et IA

- Deux groupes complémentaires couvrent 9 outils design et 16 outils IA, dont FigJam, Fusion 360, Pacdora, Claude, ChatGPT, Adobe Podcast AI et GitHub Copilot.
- Les preuves média comprennent 7 galeries de quatre médias, 1 de trois médias, 3 de deux médias et 14 fiches avec un seul média lorsque les sources officielles bloquent la collecte.
- Manifest AI reste une marque active, mais son positionnement catalogue obsolète a été remplacé par son activité actuelle d'extraction de documents logistiques ; une seule capture officielle a été réalisée faute de média réutilisable.
- L'application d'un lot ignore désormais les fiches déjà publiées afin d'éviter de les invalider lors d'une repasse voisine.
- Validation : registre complet PASS, 25 fiches publiées, build production PASS et seize routes FR/EN contrôlées sans image cassée.

## 2026-08-31 · Revue de 24 fiches IA

- Le lot `review-ai-general-critical-002` couvre 24 fiches de génération d'images, vidéo, audio, code, prise de notes et observabilité IA ; Meshy a été revalidé sans perdre son lien affilié.
- Les preuves média comprennent 8 galeries de quatre médias, 1 de trois médias, 4 de deux médias et 11 fiches avec un seul média lorsque le site officiel bloque la collecte.
- Un générateur réutilisable transforme désormais une sélection éditoriale auditable en preuves média, déduplique les variantes responsives et distingue médias officiels et captures de secours.
- Validation : registre complet PASS, 24 fiches publiées, Meshy republié, build production PASS et quatorze routes FR/EN contrôlées sans image cassée.

## 2026-08-31 · Revue complète de la fiche Meshy

- Le lien principal utilise désormais l'attribution `https://www.meshy.ai?via=tooltrim` tout en conservant le domaine officiel comme URL canonique.
- Les tarifs et conditions du plan gratuit ont été remis à jour depuis la page officielle Meshy.
- La galerie présente quatre images produit officielles couvrant la génération, l'interface Image to 3D et la préparation à l'impression 3D.
- Validation : registre complet PASS, build production PASS et rendus FR/EN contrôlés sans image cassée, avec lien affilié actif.

## 2026-08-31 · Revue média de 25 fiches design et 3D

- Le lot `review-design-tools-critical-003` couvre 25 fiches de design, prototypage, animation, architecture, rendu et extensions créatives.
- Les preuves média comprennent 13 galeries de quatre médias, 5 de trois médias, 1 de deux médias et 6 fiches avec un média lorsque les sources officielles ne permettent pas d'en retenir davantage.
- Les sources tarifaires de Specify et Twinmotion ont été actualisées depuis leurs pages officielles ; Magic Bullet pointe désormais vers la page Red Giant active de Maxon.
- Validation : registre complet PASS, 25 preuves média valides, 25 fiches publiées, build production PASS et douze routes FR/EN contrôlées sans image cassée.

## 2026-08-31 · Revue média de 25 fiches design

- Le lot `review-design-tools-critical-002` couvre 25 fiches Adobe, After Effects, Autodesk, Figma, photo et rendu 3D.
- Les fiches utilisent de une à quatre images issues des pages officielles ; une seule capture existante est conservée lorsque le site bloque la collecte des médias.
- Le collecteur réutilisable `collect-review-media-candidates.mjs` filtre les logos, portraits, images décoratives, doublons et formats trop petits avant la sélection éditoriale.
- L’application d’un lot ne vide plus une galerie existante lorsque la preuve média ne contient qu’une image de remplacement.
- Validation : registre complet PASS, 25 preuves média valides, 25 fiches publiées, build production PASS et dix routes FR/EN contrôlées sans image cassée.

## 2026-08-25 · Collections obligatoires à l’ajout

- Chaque ajout depuis Ma Stack ou Explorer ouvre désormais le choix de collection avant toute écriture dans la stack.
- Le bouton de confirmation reste désactivé tant qu’aucune collection n’est sélectionnée ; une suggestion peut être présélectionnée, mais l’internaute garde le choix.
- L’ancien écran secondaire « Organiser mes outils » et l’état « À organiser » sont retirés : les actions renommer, déplacer et supprimer vivent directement dans le menu de chaque collection personnelle.
- Un accès global « Organiser » est conservé à droite de la barre des collections ; il ouvre un panneau compact pour créer, réordonner, renommer ou supprimer les collections sans réintroduire l’ancien écran.
- Le panneau « Organiser » n’affiche plus que les collections réellement utilisées et se limite au tri, au renommage et à la suppression, sans taxonomie vide ni création décontextualisée.
- La modale adopte des marges éditoriales plus généreuses ; l’édition apparaît au survol ou au focus sur chaque collection active, y compris les collections ToolTrim, dont le nouveau nom est désormais persistant.
- Le menu contextuel « … » des onglets est supprimé : l’accès « Organiser » devient l’unique endroit où modifier une collection.
- Depuis la vue globale, « Explorer les outils » ouvre désormais le catalogue au lieu d’imbriquer une seconde page d’ajout dans Ma Stack ; le sélecteur interne reste réservé aux collections dont la destination est explicite.
- Explorer devient un flux de découverte visuel inspiré des boards : Ma Stack peut servir de source, les cartes utilisent leurs médias dans une grille masonry, et le recentrage sur un outil reste dans le même parcours.
- Le vocabulaire est unifié autour des collections et le compteur de Ma Stack ne change qu’après confirmation explicite.
- Validation : TypeScript PASS, 55 tests Ma Stack PASS, build production PASS et parcours Ma Stack / Explorer vérifiés dans le navigateur local.

## 2026-08-25 · Ajout à Ma Stack et collection Mes envies

- L’ajout d’un outil ouvre désormais une popin de classement inspirée des collections : statut `Je l’utilise` ou `Ça me tente`, sélection de plusieurs tableaux, suggestion contextuelle et création d’un tableau personnel sans quitter le parcours.
- Un outil déjà enregistré ouvre la même popin pour modifier son statut ou ses tableaux ; le retrait devient une action explicite et ne se déclenche plus au premier clic.
- L’état local passe en version 3 et migre les anciennes sélections vers `Dans ma stack` sans perte d’ordre ni d’affectation.
- Ma Stack adopte une navigation horizontale de bibliothèque : `Tous les outils`, chaque tableau actif, puis `Mes envies` après une séparation discrète.
- La wishlist devient `Mes envies` dans toute l’interface. Son vocabulaire valorise l’inspiration et retire l’idée d’une tâche à accomplir plus tard.
- Les onglets filtrent désormais directement une grille de cartes outils ; les cartes-tableaux quittent la vue principale et restent accessibles dans un panneau secondaire `Gérer mes tableaux` fermé par défaut.
- Le haut de page adopte une structure de profil anticipant la future création de compte : avatar neutre, identité `Ma stack`, profil déduit et métriques, sans inventer de données personnelles.
- L’onglet actif reçoit un traitement de surface et de contraste persistant ; `Mes envies` utilise désormais un cœur plutôt qu’un marque-page.
- L’architecture de compte retient Supabase Auth, avec une approche local-first puis synchronisation volontaire, Google et email au premier niveau et LinkedIn OIDC comme option professionnelle.
- Validation : build production PASS, 55 tests Ma Stack PASS, navigation Tous les outils → tableaux → Mes envies et états vides vérifiés dans le navigateur local.

## 2026-08-25 · Harmonisation typographique des fiches outils

- Le fil d’Ariane des fiches outils adopte Inter Variable pour mieux appartenir à l’interface produit, sans modifier le traitement éditorial des autres familles de pages.
- Le nom de l’outil passe en graisse 400, les introductions en 400 et les titres de section en 500 afin de restaurer une hiérarchie plus calme et cohérente sur toute la fiche.
- Les libellés de fonctionnalités passent à 14 px, la ponctuation du résumé avantages/inconvénients est simplifiée et le footer exprime désormais la promesse produit : choisir les bons outils sans abonnements inutiles.
- Les catégories de la colonne d’information ouvrent désormais leur page catalogue et le logo officiel Rive remplace l’initiale de secours, y compris lorsque la carte utilise un résumé catalogue incomplet.
- La description courte du hero adopte un interlettrage légèrement resserré pour mieux s’accorder au titre dans les états développé et sticky.
- Le shell des fiches harmonise à 10 px les rayons de la barre latérale, de la topbar et de la surface d’identité du hero.
- Les usages concrets adoptent une graisse 500 et les paragraphes d’analyse retrouvent la couleur principale afin de maintenir une hiérarchie éditoriale lisible.
- La grande surface de travail du shell passe elle aussi à un rayon de 10 px, désormais cohérent avec la sidebar, la topbar et le hero.
- Toutes les surfaces rectangulaires d’une fiche outil utilisent désormais un rayon de 10 px ; seules les actions en pilule, icônes circulaires et marques conservent leur géométrie propre.
- Le verdict associe désormais la note à un indicateur directionnel haut, neutre ou bas, placé au centre vertical avant le score pour accélérer sa lecture sans créer un nouveau CTA.

## 2026-08-24 · Hiérarchie des actions sur les fiches outils

- « Ajouter à ma stack » reste le seul CTA principal plein dans le contenu de la fiche.
- « Visiter le site » devient une action externe secondaire, claire et bordée, dont le texte et l’icône utilisent l’accent ToolTrim pour rester repérables sans concurrencer le CTA principal.
- L’accès global « Ma stack » conserve son rôle de navigation dans la topbar avec un traitement utilitaire discret sur les fiches outils.
- Le verdict ToolTrim est désormais présenté comme une information statique : le lien, la flèche directionnelle et les états de survol ont été retirés.
- La compaction du hero se déclenche dès qu’il atteint sa position sticky, et non après le passage de toute sa hauteur développée, ce qui synchronise la transition avec le contenu quelle que soit la longueur de la fiche.
- Le hero abandonne la composition publicitaire en deux colonnes : l’identité éditoriale passe en premier avec le logo associé au nom, tandis que l’image OG devient un support visuel pleine largeur placé sous les informations et disparaît dans l’état sticky compact.
- Le support visuel devient un viewer média unique pouvant combiner image OG, captures supplémentaires et vidéos officielles ; les miniatures permettent de changer de média sans allonger le hero et le lecteur vidéo n’est chargé qu’après une action explicite.
- Deel sert de premier cas complet avec son image OG et une démo de plateforme issue de sa chaîne YouTube officielle, vérifiée via oEmbed.
- Le hero ne répète plus la formule SEO « Avis, prix et alternatives » ni le prix : ces informations restent dans leurs sections dédiées, tandis que l’ouverture se concentre sur le nom, la catégorie et la promesse de l’outil.
- La galerie du hero adopte une grille de deux médias côte à côte inspirée de la référence ; au-delà de deux éléments, le slider avance par paire, tandis que le mobile conserve une carte principale et un aperçu horizontal de la suivante.

## 2026-08-18 · Pilote d’extension du catalogue canonique

- Trois nouvelles identités explicites ont été préparées : Audionotes, Jenni AI et VisualCV ; les index locaux et le manifeste passent de 1 126 à 1 129 outils.
- Les sources tarifaires officielles ont été collectées avec des adaptateurs dédiés et un éditorial complet FR/EN sans montants dans la prose canonique.
- Audionotes et Jenni passent les gates éditoriaux et tarifaires ainsi que le dry-run transactionnel avec rollback stable.
- VisualCV reste bloqué : son prix présenté par mois est facturé trimestriellement, engagement que le contrat canonique actuel ne représente pas sans ambiguïté.
- Les trois identités publiques et leur présence dans le manifeste matérialisé ont été créées dans Supabase.
- Après autorisation explicite, Audionotes et Jenni ont été publiés en canonical avec leurs contenus FR/EN et leurs observations tarifaires approuvées ; VisualCV reste volontairement en fallback legacy.
- Le contrôle global reflète désormais l’architecture hybride réelle : parité entre identités et manifeste, deux localisations pour chaque outil projeté, aucune fiche canonical absente de la projection et suivi explicite des fallbacks legacy.

---

## 2026-08-18 · Recherche globale, couvertures et seuils de lisibilité

- Les articles utilisent leur image de couverture avec un pictogramme de repli lorsqu'aucun visuel n'est disponible.
- Les métadonnées passent à un corps minimal de 13 px et les libellés de navigation à 15 px.
- Les titres gagnent un niveau de corps sans alourdir la composition.
- Les gris secondaires utilisent une opacité renforcée du texte principal afin de préserver le contraste dans les deux thèmes.

---

## 2026-08-18 · Fil d’Ariane JSON-LD dédupliqué

- Les fiches outils, comparatifs et guides ne publient plus un second `BreadcrumbList` depuis leur composant visuel.
- Le schéma canonique généré par chaque page reste la seule source structurée.
- Le libellé anglais de catégorie retombe désormais sur le libellé principal lorsqu’il est absent.
- La correction vise l’erreur Google Search Console sur `itemListElement.name` observée pour Red Giant.

---

## 2026-08-18 — Footer recentré sur la décision

- Le footer se termine désormais par deux suites logiques du parcours : composer sa sélection d’outils ou explorer le catalogue.
- La promesse évite la contradiction entre choix et découverte, et formule directement la réduction des abonnements inutiles.
- Les liens sont regroupés par intention — décider, explorer, comprendre ToolTrim — plutôt que par taxonomie interne.
- Le traitement visuel abandonne le grand panneau sombre et le wordmark décoratif au profit d’une surface claire, d’une marque compacte et d’une grille de liens plus fine inspirée des proportions du footer OpenAI.
- La date de mise à jour générée automatiquement a été retirée afin de ne pas simuler une fraîcheur éditoriale.
- Les actions produit restent visibles sans dominer la navigation de fin de page.

---

## 2026-08-17 — Grille Explorer réalignée

- La fiche source et les six premières recommandations forment désormais un bloc à deux colonnes dont les bords supérieur et inférieur sont strictement alignés.
- Les recommandations suivantes repartent sur une grille pleine largeur, sans effet de masonry ni remontée indépendante des colonnes.
- Les variantes tablette et mobile conservent une lecture régulière en trois, deux puis une colonne.
- Validation : build production PASS et contrôle navigateur sur l’exploration autour de Figma Tokens.

---

## 2026-08-17 — Story scénographie Atelier Hors-Champ

- Nouvelle Story fictive consacrée à une agence de scénographie, depuis la maquette et les essais lumière jusqu’au montage et à l’ouverture de l’exposition.
- Le récit distingue les outils du jugement métier : la stack accompagne les changements d’échelle sans remplacer les arbitrages spatiaux, matériels ou humains.
- Direction photographique originale en quatre images : documentaire de chantier cinématographique, cadrages obliques, flash latéral, bois brut, textile indigo et lumière tungstène — sans portrait corporate ni écran décoratif.
- Sources éditoriales synchronisées dans `src/data` et `public/data`, avec métadonnées SEO et déclaration fictive explicite.

---

## 2026-08-17 — Visuel ChatGPT ressourcé

- La couverture ChatGPT utilise désormais une capture publique et actuelle de la page produit officielle française.
- La capture exclut toute session et donnée personnelle, tout en conservant le format historique 1200 × 630 utilisé par les cartes et les métadonnées sociales.
- Source : https://chatgpt.com/fr-FR/overview/ (consultée le 17 août 2026).

---

## 2026-07-31 — Performance mobile de l’accueil

- Le fond du hero est désormais servi en WebP responsive : 51 Ko sur mobile et 193 Ko sur grand écran, contre 1,3 Mo pour la PNG d’origine.
- L’image LCP possède des dimensions intrinsèques et une priorité de téléchargement élevée ; le navigateur sélectionne la variante adaptée au viewport.
- La section « Outils en vedette » réserve sa géométrie pendant le chargement Supabase afin que l’apparition des recommandations ne décale plus tout le catalogue.
- Le skeleton reprend la grille responsive et les proportions finales des cartes, sans animation ni contenu annoncé aux technologies d’assistance.
- Les couvertures et logos visibles sur l’accueil sont maintenant servis localement en WebP dimensionnés, ce qui supprime les téléchargements d’images OG tierces sur cette route.
- L’accueil utilise un index éditorial de 12 guides par langue au lieu de charger les catalogues d’articles complets ; le générateur est intégré au build de production.
- Le prérendu des trois routes d’accueil annonce l’image LCP dans le document initial avec un preload responsive, avant l’exécution de React.
- Validation : build production et prérendu PASS, rendu Chrome contrôlé à 390 × 844 et 1440 × 1000, variante WebP correcte, aucune erreur d’overlay et CLS local mesuré à 0,00026.

---

## 2026-07-28 — Typographie des catalogues et des fiches harmonisée

- Les index Outils, Stacks et Comparatifs utilisent désormais le même token de titre de page, la même famille Inter Tight et les mêmes paramètres de graisse, d’interlettrage et de hauteur de ligne.
- La navigation, les commandes de filtre, la recherche et le tri partagent une échelle UI unique afin d’éviter les écarts subtils entre les trois routes.
- Les cartes conservent leur densité propre, mais leurs rôles sont normalisés : titre décisionnel, libellé, métadonnée, résumé et CTA suivent chacun un token commun du design system.
- Les styles calculés ont été contrôlés côte à côte dans le navigateur : H1 56/500, navigation 15/500–620, métadonnées 14/400, labels 11/700 et titres décisionnels fluides 25–32/600 sur desktop.
- Les fiches Outil, Stack et Comparatif reprennent cette même hiérarchie : H1 56/500, chapô 19/400 et titres de section 31/620 sur le viewport de contrôle.
- Les anciennes variantes de détail qui mélangeaient Inter Tight et Uncut Sans, un H1 Outil à 820 et des sections Stack à 51 px sont neutralisées par une couche canonique commune.
- Contrôle navigateur effectué sur Notion, Stack dev freelance et ChatGPT vs Claude, puis build production et prérendu validés.

## 2026-07-28 — Respiration supérieure des heroes catalogue

- Les pages catalogue gagnent une marge haute plus éditoriale avant leur titre, alignée sur le rythme de la référence.
- La distance entre le titre et la navigation reste compacte afin de ne pas recréer un hero surdimensionné.
- Les valeurs tablette et mobile sont ajustées séparément pour conserver une entrée de page équilibrée.

## 2026-07-28 — Chargement progressif des comparatifs

- L’index Comparatifs monte désormais 12 cartes au premier affichage au lieu de toute la collection.
- Un bouton charge les résultats suivants par lots de 12 et indique combien de comparatifs restent à découvrir.
- Une recherche, un changement de catégorie ou de tri réinitialise automatiquement la liste à son format court.

## 2026-07-28 — Actions des catalogues harmonisées

- Les commandes Filtrer, Rechercher et Trier utilisent désormais le même format circulaire 40 × 40 px, des icônes de 18 px et un espacement constant de 4 px.
- Les états de survol et de focus sont partagés sur Outils, Catégories, Stacks, Comparatifs et Guides.
- La recherche fermée ne peut plus se compresser sous la commande de tri : le groupe reste aligné et sans chevauchement, quelle que soit la longueur de la navigation thématique.

---

## 2026-07-28 — Mode recherche stable dans les catalogues

- Sur Outils, Catégories, Stacks, Comparatifs et Guides, l’ouverture de la recherche remplace désormais la navigation thématique au lieu de la compresser.
- Les commandes Filtrer et Trier conservent leur position pendant la saisie, sans libellé tronqué ni débordement horizontal.
- Une croix reste toujours disponible pour quitter le mode recherche ; la touche Échap ferme également le champ et réinitialise la requête.

---

## 2026-07-28 — En-têtes et filtres des catalogues simplifiés

- Les index Outils, Catégories, Stacks, Comparatifs et Guides partagent désormais une même architecture d’en-tête : titre court, espace éditorial maîtrisé, navigation thématique et commandes sur une seule ligne.
- Les filtres secondaires des catalogues sont regroupés derrière une action `Filtrer`, tandis que recherche, compteur et tri conservent une place stable et prévisible.
- Les thèmes des Guides ont été intégrés à la ligne de commandes afin de supprimer la double barre.
- Les suggestions populaires ont été retirées de l’en-tête Comparatifs et remplacées par un tri explicite `Sélection / A → Z`.
- La recherche globale du shell s’efface sur les catalogues : il ne reste qu’une recherche contextuelle, au même niveau que les filtres et le tri.
- Le sticky reste pleine largeur, léger et contrasté, sans coque supplémentaire ni double barre.
- Les breadcrumbs ont été retirés du HTML de ces cinq index et les anciens `padding-top` des conteneurs neutralisés : le titre, la barre et la première rangée suivent désormais un rythme vertical unique, sans espace fantôme.
- L’écart titre–commandes a été resserré et la barre Stacks ne repasse plus sur deux lignes aux grands écrans ; compteur, tri et accès Ma stack restent lisibles pendant le scroll.
- Les séparateurs et compteurs de volume ont été retirés des barres de catalogue. Filtre, recherche et tri sont désormais des commandes iconiques alignées à droite, avec leurs libellés conservés pour l’accessibilité.

---

## 2026-07-28 — Identité visuelle des collections de stacks

- Les collections de la page d’accueil utilisent neuf palettes de dégradés granuleux inspirées des références fournies, sans dépendre d’images bitmap figées.
- Chaque stack possède un pictogramme géométrique, un verbe d’usage et son intitulé directement intégrés au visuel.
- Les libellés restent du vrai contenu HTML, localisé et accessible ; les formes restent vectorielles et nettes à toutes les résolutions.
- Les trois univers éditoriaux reprennent le système complet : dégradé granuleux, pictogramme métier, forme géométrique et nom de l’univers directement dans le visuel.
- Le visuel d’univers ne privilégie plus artificiellement le premier outil : il ouvre la catégorie, et les trois premiers outils retrouvent tous le même traitement dans la liste.
- La section Nouveautés abandonne ses éléments flottants au profit d’une seule surface éditoriale dense, structurée par des séparateurs internes discrets et adaptée de quatre à une colonne.

---

## 2026-07-28 — Allègement prioritaire du catalogue Stacks

- `/stacks` ne charge plus le catalogue riche `stacks.ts` : un index dédié conserve uniquement les 212 stacks, leurs facettes pré-calculées et les 395 outils nécessaires aux aperçus des cartes.
- La recherche plein texte est préparée au build et les calculs de disponibilité des facettes sont différés jusqu’à l’ouverture du panneau de filtres.
- La requête Supabase `tools` de `useToolSummaries()` est supprimée du chargement de cette page.
- Le générateur de l’index catalogue est exécuté automatiquement avant chaque build production pour éviter toute dérive avec les fiches détail.
- Poids dédié au catalogue de la route : environ 164 Ko gzip auparavant contre 107 Ko gzip après découpage, soit une réduction d’environ 35 %. Le bundle riche de 141 Ko gzip est désormais téléchargé uniquement à l’ouverture d’une fiche Stack.
- Validation : TypeScript, build/prérendu de 424 pages stack, inventaire réseau de la liste et d’une fiche détail, recherche, filtres, 12 cartes progressives et rendu mobile 390 × 844 sans débordement.

---

## 2026-07-28 — Tutoriels officiels sur les fiches outils prioritaires

- Notion, Figma, Canva, Loom et Linear affichent une vidéo officielle vérifiée sur leur vue d’ensemble FR/EN.
- Le lecteur YouTube en mode confidentialité renforcée n’est créé qu’après un clic explicite ; la page charge d’abord une vignette légère et accessible.
- Les métadonnées éditoriales (titre localisé, auteur, durée, dates et source) vivent dans un registre partagé, sans modifier les 1 126 fiches du catalogue.
- Les pages concernées publient un balisage `VideoObject` issu de la même source que le contenu visible.
- Validation : TypeScript, build production et prérendu, puis rendu navigateur desktop 1280 × 900 et mobile 390 × 844 sans débordement horizontal.

---

## 2026-07-28 — Guide « Visualiser sa stack SaaS »

- Le brouillon initial est remanié dans le ton éditorial ToolTrim : angle direct, promesse resserrée, distinction entre inventaire financier et compréhension d’un workflow.
- La promesse de « Board façon Pinterest », absente du produit actuel, est remplacée par une présentation fidèle de Ma stack et d’Explorer.
- Trois photographies éditoriales locales donnent du rythme à l’article : surcharge numérique, cartographie du workflow et décision de simplification.
- Le CTA final ouvre `/fr/ma-stack` et invite à commencer par les outils réellement utilisés cette semaine.
- Le guide est ajouté aux sources française embarquée et publique, avec métadonnées SEO et date de publication.

---

## 2026-07-27 — Réparation et refonte de l’index Guides

- `GuidesPage` ne réutilise plus les cards `sk-*` de Stacks, dont la nouvelle structure créait de grandes zones vides sur `/fr/guides`.
- Le premier article reçoit une ouverture éditoriale large ; les suivants utilisent une grille `gi-card` dédiée, responsive de trois à une colonne.
- Les cards de grille adoptent la logique ouverte ToolTrim : visuel autonome arrondi, aucun cadre autour du texte, 36 px entre colonnes et 64 px entre rangées ; la grille reste limitée à trois colonnes sur desktop.
- Les visuels reprennent l’image OG d’un outil cité avec fallback logo, sans dépendre d’un champ image article absent du modèle courant.
- Les thèmes deviennent des tags de filtrage visibles, une recherche plein texte est ajoutée et le compteur reflète les résultats.
- La section « Par thème », dont les liens ne filtraient rien, est supprimée.
- Validation : TypeScript, build production, recherche et rendu navigateur desktop/mobile.

---

## 2026-07-27 — Cards Stacks enrichies par les visuels OG

- Les résultats de `/fr/stacks` passent d’une grille de petites cards textuelles à une liste de cards larges, plus éditoriales et plus faciles à parcourir.
- Chaque card se limite à l’identité de la stack, son budget, son nombre d’outils et l’action d’ouverture ; le verdict, le niveau et les blocs de contexte sont réservés à la fiche détail.
- Une galerie de quatre outils exploite en priorité leurs images OG, avec le fallback logo partagé du catalogue et un aperçu des outils restants.
- Les rôles couverts ferment la card sous forme de tags compacts, à la manière des compétences de la référence visuelle.
- Un nuage de navigation propose six besoins généralistes sous le titre. Un clic remplace ce premier niveau par six spécialités contextualisées ; un bouton Retour restaure les besoins.
- Les deux niveaux restent synchronisés avec les facettes Objectif et Spécialité ainsi qu’avec l’URL, et défilent horizontalement sur mobile.
- Une séparation et le titre « Explorer les stacks » distinguent clairement la navigation éditoriale des filtres structurés.
- Le responsive conserve deux visuels utiles sur mobile sans débordement horizontal.
- Validation : build production, rendu desktop et viewport mobile 390 × 844.

---

## 2026-07-27 — Barre sticky canonique des catalogues

- Les catalogues Outils, Stacks, Guides, Catégories et Comparatifs partagent désormais le même hook de détection, la même hauteur de 68 px et le même traitement glass au scroll.
- La page Stacks adopte aussi la composition interne canonique : groupe de filtres, recherche compacte avec effacement, compteur de résultats et tri dans une seule barre.
- Le compteur et le tri spécifiques auparavant répétés sous le sticky Stacks sont supprimés.
- Vérification navigateur comparative Outils / Stacks : padding, espacements, hauteur des contrôles, position sticky, fond translucide et flou sont identiques.
- Le calque glass dépasse de 8 px au-dessus de la barre afin de masquer le fin gutter du workspace et empêcher le contenu défilant d’apparaître dans la jointure.
- Au scroll, la recherche globale disparaît mais l’accès Ma stack reste visible dans la barre unique ; le contenu du sticky lui réserve sa place sans chevauchement.
- Le passage à l’état sticky reçoit une micro-animation de 180 ms sur le glass, les contrôles et l’action Ma stack, neutralisée avec `prefers-reduced-motion`.
- Les washes colorés pleine largeur sont retirés de tous les catalogues : les pages reviennent sur un fond neutre commun et leur accent n’apparaît plus que dans le petit repère du fil d’Ariane.

---

## 2026-07-22 — Ouverture éditoriale du catalogue outils

- La sélection recommandée est ramenée de huit à trois outils afin de jouer un rôle éditorial clair plutôt que de dupliquer une rangée du catalogue.
- Le haut de page présente trois recommandations homogènes et amples, sans hiérarchie de taille arbitraire entre les outils.
- Un titre de section compact, son sous-titre rapproché et une action discrète laissent les visuels porter la présence éditoriale.
- Le catalogue complet retrouve sa propre entrée, son nombre de résultats et une séparation visuelle plus respirante.
- Sur tablette, les trois recommandations conservent le même ratio ; sur mobile, elles deviennent un rail horizontal homogène avec scroll snap.
- La hiérarchie typographique devient une règle globale : les H2 de section utilisent désormais une échelle compacte de 25 à 32 px, distincte des H1 et héros éditoriaux.
- L'accueil actif applique ce système à tous ses rails avec un sous-titre rapproché et des actions secondaires alignées à droite.
- Les composants partagés des fiches outil, comparatifs, guides, pages institutionnelles, catégories et FAQ sont raccordés aux mêmes tokens.
- Les actions secondaires des en-têtes de section partagent désormais `.tt-section-action` sur l'accueil, le catalogue et les sections éditoriales : même graisse, même flèche Lucide et même mouvement au survol.
- Les carrousels éditoriaux de l'accueil et le rail d'alternatives utilisent désormais les mêmes contrôles de 36px et la même pagination accessible ; les rails paginés de l'accueil acceptent aussi le balayage horizontal tactile.
- Les surfaces publiques sont ramenées à trois niveaux : média sans coque (18px), card informative bordée (12px) et panneau neutre sans double séparation (24px). Les ombres et translations des cards de stacks sont supprimées.

---

## 2026-07-22 — Socle d’accessibilité des parcours de découverte

- Audit Axe automatisé sur Catalogue, Recherche, Explorer et Ma Stack, sans violation critique ou sérieuse sur les quatre routes.
- Correction des filtres de recherche : abandon de la sémantique d’onglets incomplète au profit d’un groupe de filtres avec état `aria-pressed` explicite.
- Renforcement des contrastes des filtres, compteurs de résultats et métadonnées de la barre Ma Stack afin de respecter le seuil WCAG AA.
- Respect de `prefers-reduced-motion` sur les cards média et compactes : transitions neutralisées et zoom de miniature supprimé.
- Couverture Playwright des états de filtre, de la navigation clavier du menu contextuel, de la restitution du focus après Échap et de la réduction des animations.
- Nouvelle commande `npm run test:e2e:a11y` pour rejouer les garde-fous d’accessibilité.
- Cycle clavier complet des overlays : focus initial, confinement dans Recherche, Explorer et filtres Ma Stack, fermeture avec Échap puis retour au déclencheur.
- Recherche globale reliée explicitement à sa liste de résultats via `aria-controls` / `aria-activedescendant`, avec annonce vocale du nombre de résultats.
- Popovers de filtres nommés, focusés à l’ouverture et refermés sans perte de position clavier ; déclencheur Ma Stack synchronisé avec son état ouvert/fermé.
- Audit Axe étendu aux états ouverts des overlays, et pas seulement aux pages au repos.

---

## 2026-07-22 — Lancement des chantiers images, navigation et cohérence éditoriale

- Baseline versionnée des 17 références d’images locales déjà cassées et nouvelle commande `validate:card-images` qui bloque uniquement les régressions supplémentaires.
- Projection `getToolPresentation()` partagée par les cards média, décisionnelles et compactes pour normaliser nom, description localisée, prix mensuel, libellé de plan et remplaçabilité sans réécrire les données pendant la migration base de données.
- Audit éditorial non destructif du catalogue léger : slugs, catégories, descriptions FR/EN, prix et contradictions de remplacement, avec rapport JSON optionnel.
- Correction du choix du conteneur de scroll mobile : `#main-content` n’est retenu que lorsqu’il est réellement scrollable, sinon le document porte la mémorisation et la restauration.
- Couverture E2E de la continuité de navigation : nouvelle fiche en haut, retour catalogue restauré, rechargement profond réinitialisé et comportement mobile verrouillé.

---

## 2026-07-22 — Passe responsive globale catalogue, recherche, Explorer et Ma stack

- Recherche restructurée avec des classes `sp-*` dédiées : largeur intrinsèque des catégories corrigée à 320 px, onglets confinés à un rail horizontal et cibles tactiles portées à 40–44 px.
- Styles utilitaires dispersés de `SearchPage` remplacés par une architecture CSS responsive alignée sur les tokens du design system.
- Nouvelle couverture Playwright à 320, 768 et 1280 px sur `/tools`, `/search`, `/explorer` et `/ma-stack`, avec détection des débordements de page et contrôle de la largeur réelle des résultats.

---

## 2026-07-22 — Allègement du système de cards catalogue

- Suppression de la coque bordée autour des cards média du catalogue : la miniature, la typographie et l'espacement portent désormais la hiérarchie.
- Conservation des coques uniquement pour les variantes fonctionnelles et décisionnelles.
- Regroupement des actions « Explorer » et « Ajouter à la stack » dans un menu contextuel unique afin de réduire la concurrence visuelle.
- Miniatures autonomes avec rayon harmonisé et mouvement de survol discret.
- Réduction des piles de logos à 36px maximum, sans ombre ni animation décorative.
- Documentation des trois niveaux de profondeur de cards dans le design system.
- Renforcement du lien miniature-identité : espace interne resserré, titre plus distinctif et métadonnées ramenées à une échelle secondaire.
- Séparation des lignes de la grille portée à 44px pour éviter qu'un titre soit visuellement rattaché à la miniature suivante.
- Raffinement de la ligne d'identité sur le modèle des galeries éditoriales : logo 30px, titre 16px, catégorie et description 12px, menu compact 30px.
- Recomposition finale d'après Contra Projects : la zone sous l'image devient une légende unique (logo rond 24px, nom 15px, catégorie inline, menu 28px) et la description est retirée de la card média.
- Suppression du badge « ToolTrim Pick » des miniatures, dont le signal éditorial n'était pas explicite pour l'utilisateur.
- Allègement des prix en micro-label clair, harmonisation des miniatures par une bordure interne discrète et un zoom de survol contenu.
- Toute la légende produit est désormais cliquable ; le menu contextuel se ferme au clic extérieur, après une action et avec Échap.
- Mise en place d'une politique de miniatures `curated / og / fallback`, avec normalisation locale des captures ToolTrim et rejet runtime des images inférieures à 320×160.
- Ajout de `npm run audit:card-images` pour contrôler les fichiers locaux, les URLs, les réponses HTTP, les types MIME et les dimensions sans modifier les données.
- Navigation unifiée sur toute la surface des cards média, sans liens imbriqués, avec menu contextuel indépendant et focus clavier visible.
- Ajout d'un état de chargement stable pour les miniatures, d'un squelette respectant `prefers-reduced-motion` et de cibles tactiles de 44 px pour les actions.
- Exposition de `data-image-state` (`loading`, `ready`, `fallback`) pour les tests et diagnostics visuels.
- Consolidation des cards outils autour de trois usages explicites : média (`ToolCardEditorial`), décision (`variant="decision"`) et compacte (`ToolCardCompact`).
- Migration des résultats de recherche vers la card compacte partagée, avec cible principale complète et action Explorer indépendante.
- Suppression des anciens composants `ToolCard` et `ToolRowEditorial`, devenus orphelins après la migration du catalogue et des catégories.
- Ajout d'une suite Playwright dédiée aux cards média, compactes et décisionnelles, avec références visuelles desktop/mobile et contrats clavier/tactile.
- Nettoyage des coques CSS historiques `tc-card` et du bloc `tcr-*` ; les primitives d’image et de grille restent partagées sous `tc-*`.
- Les routes catalogue `/tools`, catégories, guides et articles consomment désormais `useToolSummaries()` au lieu de déclencher le chargement de `tools_v4.json`.
- Le texte de recherche du catalogue est calculé depuis l’index léger (identité, descriptions et signaux de classement), sans champs éditoriaux de fiche complète.
- Les quatre signaux nécessaires aux filtres de catégorie sont intégrés au résumé (`relevantFor`, alternatives, substituabilité), ce qui retire aussi `tools_v4.json` des fiches catégorie.

---

## 2026-07-16 — Brief d’industrialisation des fiches outils

- Ajout d’un brief Claude Code canonique pour auditer, rechercher, sourcer et enrichir les fiches outils par lots.
- Séparation explicite entre dossiers de recherche traçables et données éditoriales publiées dans le catalogue.
- Formalisation de la hiérarchie des sources, du traitement des conflits, du pricing et des règles anti-hallucination.
- Cartographie des champs ToolTrim vers leur emplacement dans la fiche afin de limiter répétitions et mauvais usages.
- Ajout de garde-fous pour Supabase, les champs de prescription et l’automatisation du scraping.
- Définition d’un lot pilote, de contrôles qualité, d’un format de compte rendu et d’un prompt maître prêt à exécuter.
- Ajout d’une architecture de migration vers Supabase comme source éditoriale unique, tout en conservant un snapshot de build indispensable au prerender SEO.
- Documentation des tables de recherche, claims, révisions, vues publiées, phases de suppression des JSON et gates anti-régression.

---

## 2026-07-16 — Stabilisation du scroll entre catalogue et fiches

- Le reset de scroll lors d’une navigation est exécuté avant le premier affichage de la nouvelle route.
- Le vrai conteneur de scroll est recalculé lors de chaque restauration pour couvrir AppShell, mobile et routes legacy.
- Le document et le rail interne sont remis à zéro lors d’une navigation classique.
- Désactivation de l’ancrage automatique sur le contenu principal afin qu’une fiche chargée progressivement ne maintienne pas le footer dans le viewport.

---

## 2026-07-16 — Lancement de la roadmap Ma stack + Explorer

- La roadmap Ma stack existante a été réorientée pour intégrer le pivot vers l’exploration contextuelle télescopique.
- Le chantier est organisé en six étapes : checkpoint, qualité des relations, micro-interactions, contenu catalogue, validation utilisateur et performance/préproduction.
- Les invariants produit, critères de sortie et limites du MVP sont désormais explicites dans `docs/MA_STACK_ROADMAP.md`.
- La roadmap générale référence maintenant les deux documents actifs : diagnostic et Ma stack + Explorer.
- Le checkpoint technique passe sur TypeScript, design tokens, build, 54 tests Ma stack et 10 parcours E2E.
- La CI exécute désormais `npm run test:ma-stack`. Le seul test global restant en échec est le scénario diagnostic GO14 `marc-under-instrumented` (74 pour un seuil de 80), conservé comme dette dédiée sans abaissement artificiel du seuil.

---

## 2026-05-23 — Sprint 77 : Palette chromatique Awwwards — tout = var(--color-text)

### Objectif
Appliquer le vrai système de couleur de la référence Awwwards (`awwwards.com/jobs/senior-developer-cape-town.html`) : **une seule couleur pour tout** — texte ET bordures. Inspecté en live via computed styles JS (`rgb(34,34,34)` pour tout sur fond `#F8F8F8`). La hiérarchie se crée uniquement par la taille (`10px` label → `20px` décision) et le poids (`500` → `300`), pas par la couleur.

### Changements CSS (`src/index.css`)

#### Bordures : `var(--color-border)` / `var(--color-border-soft)` → `var(--color-text)` sur tous les éléments `cp-crit-table-*`
- `.cp-criterion-table` border : `1px solid var(--color-border, #DADAD4)` → `1px solid var(--color-text)`
- `.cp-crit-table-head` border-bottom : `1.5px solid var(--color-border)` → `1px solid var(--color-text)`
- `.cp-crit-table-th:first-child` border-right : `var(--color-border)` → `var(--color-text)`
- `.cp-crit-table-block` border-bottom : `var(--color-border-soft)` → `var(--color-text)`
- `.cp-crit-table-label-row` border-bottom : `var(--color-border-soft)` → `var(--color-text)`
- `.cp-crit-table-tool:first-child` border-right : `var(--color-border-soft)` → `var(--color-text)`
- Mobile : `.cp-crit-table-tool:first-child` border-bottom : `var(--color-border-soft)` → `var(--color-text)`

#### Couleur des labels TH : `var(--color-muted)` → `var(--color-text)`
- `.cp-crit-table-th` color : `var(--color-muted, #6F6F68)` → `var(--color-text)`
- `.cp-crit-table-label` color : `var(--color-muted, #6F6F68)` → `var(--color-text)`

#### Typographie TH : ajustée pour correspondre aux mesures Awwwards exactes
- `.cp-crit-table-th` padding : `14px 20px` → `16px` (uniforme, comme Awwwards)
- `.cp-crit-table-th` font-weight : `700` → `500`
- `.cp-crit-table-th` letter-spacing : `0.08em` → `0.05em`
- `.cp-crit-table-label` font-weight : `700` → `500`
- `.cp-crit-table-label` letter-spacing : `0.08em` → `0.05em`
- `.cp-crit-table-label-row` padding : `18px 20px 14px` → `20px 16px 16px`

#### Typographie décision + outil : taille grande + poids léger (style TD Awwwards)
- `.cp-crit-table-decision` font-size : `clamp(14px, 1.3vw, 16px)` → `clamp(16px, 1.5vw, 20px)`
- `.cp-crit-table-decision` font-weight : `600` → `300`
- `.cp-crit-table-decision` line-height : `1.35` → `1.3`
- `.cp-crit-table-tool` padding : `14px 20px` → `20px 16px`
- `.cp-crit-table-tool-text` color : `var(--color-muted)` → `var(--color-text)`
- `.cp-crit-table-tool-text` font-weight : `(non défini)` → `300`
- `.cp-crit-table-tool--winner` : suppression du `color` (identique) — différenciation uniquement par `font-weight: 500`
- Mobile : `.cp-crit-table-decision` font-size : `14px` → `16px`, padding uniforme `16px`

### Résultat visuel
- **Dark (section 02)** : bordures `#DEDED6` sur fond `#111111` — grille claire éditoriale
- **Light (section 03)** : bordures `#222222` sur fond `#F1F1EC` — identique à la référence Awwwards
- Système monochrome : zéro couleur secondaire dans les tableaux, tout repose sur contraste taille/poids

---

## 2026-05-23 — Sprint 76 : Layout pleine largeur + harmonisation dark/light

### Objectif
Supprimer le layout 2 colonnes (`cp-section-grid` heading gauche / tableau droite) sur les sections 02 et 03. Titre en pleine largeur, tableau en pleine largeur en dessous. Harmoniser toutes les couleurs hardcodées des composants de comparaison via les variables CSS `var(--color-*)`.

### Changements layout (`src/pages/ComparePage.tsx`)
- **Section 02** : suppression de `cp-section-grid` + `cp-section-heading` → structure plate avec `cp-matrix-header` (counter → eyebrow → title → intro) puis `cp-criterion-table` en pleine largeur
- **Section 03** : idem, avec `cp-matrix-header` incluant aussi `cp-matrix-intro` + `cp-cost-reco` avant le tableau

### Harmonisation CSS (`src/index.css`)
- **`.cp-eyebrow`** : `color: #6F6F68` → `var(--color-muted, #6F6F68)`, `margin-bottom: 28px → 16px`
- **`.cp-title`** : `color: #222222` → `var(--color-text, #222222)`, `max-width: 620px → none`, `font-size` max étendu à 44px
- **`.cp-matrix-intro`** : `color: #9A9A92` → `var(--color-muted, #6F6F68)`
- **`.cp-matrix-header`** : `margin-bottom: 32px → 40px`
- **`.cp-section-counter`** : `color: #E4E4DF` → `var(--color-border, #DADAD4)` — fantôme architectural subtil dans les deux modes
- **`.cp-section--tipping .cp-section-counter`** : `rgba(255,255,255,0.1)` → `rgba(255,255,255,0.08)` — encore plus discret
- **`.cp-cost-reco`** : `border-top: #CECECA` → `var(--color-border-soft)`, texte `#3A3A38` → `var(--color-text)`

### Résultat
- Sections 02 et 03 : titre pleine largeur → table pleine largeur, rythme vertical clair
- Mode sombre : tous les textes lisibles via variables CSS
- Mode clair (section 03) : variables light-mode scoped (Sprint 75) + harmonisation confirmée

---

## 2026-05-23 — Sprint 75 : cp-criterion-table — pattern Awwwards (container bordé + grid)

### Objectif
Remplacer `cp-editorial-rows` (liste ouverte sans bordure) par `cp-criterion-table` : un composant grille bordée arrondie identique au pattern Awwwards jobs/profil (WORKS|SOTM|SOTD|HM, DATE|CATEGORIES|COUNTRY|TYPE). Analyse directe de `awwwards.com/RezoZero` et du détail d'offre emploi avant toute implémentation.

### Pattern de référence extrait (Awwwards)
- Container : `border: 1px solid`, `border-radius: 12px`, `overflow: hidden`
- Header row : labels uppercase 11px, `border-bottom: 1.5px`, vertical divider `border-right: 1px`
- Data rows : label kicker (10px uppercase) + décision (16px 600) sur pleine largeur, séparée par `border-bottom: 1px soft`
- Cells outils : 2 colonnes 1fr/1fr, `border-right: 1px soft` sur première, padding 14px 20px
- Gagnant : `font-weight: 500` + `color-text` vs `color-muted` seul — zéro badge

### Nouveaux composants CSS (`src/index.css`)
- **`.cp-criterion-table`** : container bordé arrondi 12px, `overflow: hidden`
- **`.cp-crit-table-head`** : grid 1fr/1fr, `border-bottom: 1.5px`
- **`.cp-crit-table-th`** : flex logo+nom, uppercase 11px, `border-right` sur premier
- **`.cp-crit-table-block`** : bloc par critère, `border-bottom: 1px soft`
- **`.cp-crit-table-label-row`** : padding 18px 20px, `border-bottom: 1px soft`
- **`.cp-crit-table-label`** : kicker 10px uppercase +0.08em muted
- **`.cp-crit-table-decision`** : `clamp(14px, 1.3vw, 16px)` 600, `color-text` — hero de la ligne
- **`.cp-crit-table-tools`** : grid 1fr/1fr, vertical divider sur première cellule
- **`.cp-crit-table-tool-text`** : 13px muted par défaut, `font-weight: 500` + `color-text` si winner
- **`.cp-section--cost`** : ajout variables CSS light-mode scopées (`--color-text: #222222` etc.) pour corriger les couleurs sur le fond `#F1F1EC` dans un contexte dark global

### Changements TSX (`src/pages/ComparePage.tsx`)
- Sections 02 et 03 : `cp-editorial-rows` → `cp-criterion-table` avec `cp-crit-table-*`
- Logos outils réduits à 16px dans le header (était 20px)
- Structure : header outils → N blocs (label-row + tools-row)

---

## 2026-05-23 — Sprint 74 : cp-editorial-rows — remplacement cp-matrix sections 02 et 03

### Objectif
Remplacer la grille `cp-matrix` à 4 colonnes (critère | toolA badge | toolB badge | décision) par un format éditorial sans cellules, verdict en tête de ligne. Inspiré d'une analyse approfondie de sites Awwwards (The Pudding, Pitch, Stripe, Are.na) : pas de tableaux, pas de cases — hiérarchie par typographie et règles horizontales seules.

### Principe de conception
- **Verdict-first** : la décision (texte le plus grand, le plus visible) précède les données des outils
- **Pas de cellules, pas de bordures de case** : règles horizontales `border-bottom` uniquement
- **Critère comme ancre micro-label** : uppercase, muted, 11px — posture de kicker
- **Distinction gagnant par couleur texte uniquement** : `var(--color-text)` vs `var(--color-muted)` — pas de badges, pas d'icônes

### Nouveaux composants CSS (`src/index.css`)
- **`.cp-editorial-rows`** : conteneur, `width: 100%`
- **`.cp-editorial-colheads`** : 2 colonnes 1fr/1fr, séparées par `border-bottom: 1.5px`
- **`.cp-editorial-colhead`** : flex avec logo outil (20px) + nom, 13px 600
- **`.cp-editorial-row`** : `padding: 28px 0 24px`, séparé par `border-bottom: 1px soft`
- **`.cp-editorial-row-label`** : kicker 11px uppercase +0.08em, couleur muted
- **`.cp-editorial-row-decision`** : `clamp(16px, 1.5vw, 19px)` 600 -0.025em, max-width 68ch — texte hero de la ligne
- **`.cp-editorial-row-tools`** : grille 2 colonnes 1fr/1fr, gap 32px
- **`.cp-editorial-tool-label`** : micro-label outil 10px uppercase, muted
- **`.cp-editorial-tool-text`** : 13px muted par défaut
- **`.cp-editorial-tool--winner`** : override `color-text` sur label et texte
- Toutes les couleurs via variables CSS (`var(--color-text)`, `var(--color-muted)`, `var(--color-border)`, `var(--color-border-soft)`) — compatible thème sombre

### Changements TSX (`src/pages/ComparePage.tsx`)
- **Section 02** (Critères décisifs) : `cp-matrix` 4 colonnes → `cp-editorial-rows` avec `decisiveCriteria.slice(0, 6)`, `getCriterionLevels()` pour déterminer le gagnant
- **Section 03** (Coût réel) : `cp-matrix` coûts → `cp-editorial-rows` avec `costReality`, pas de distinction gagnant (neutre)
- Les deux sections conservent les entêtes colonnes avec logos outils (`<ToolLogo size={20} />`)

---

## 2026-05-23 — Sprint 73 : Compteurs architecturaux + section sombre tipping point

### Objectif
Différenciation architecturale des sections 02–05 par grands numéros de section, et inversion tonale de la section 05 (Tipping Point) pour signal de rupture.

### Nouveaux composants CSS (`src/index.css`)
- **`.cp-section-counter`** : compteur architectural `clamp(72px, 7vw, 96px)`, Uncut Sans 700, `letter-spacing: -0.07em`, couleur `var(--color-border, #DADAD4)` (muted structurel, pas décoratif)
- **`.cp-section--tipping`** : modificateur dark `background: #111111`, texte `#DEDED6`, muted `#8A8A82`, border `#2E2E2E` — variables CSS locales scoped à la section
- **`tt-button-light`** : variante bouton pour contexte sombre — border + texte `#DEDED6`, hover fond `#DEDED6` texte `#111111`

### Changements TSX (`src/pages/ComparePage.tsx`)
- Sections 02–05 : ajout `<span className="cp-section-counter">02</span>` etc. avant l'eyebrow label dans la colonne gauche
- Section 05 (`cp-section--tipping`) : classe sombre appliquée, bouton CTA switché vers `tt-button-light`
- Verdict bump : `cp-section-heading` augmenté pour section 02 (hiérarchie décisive)

---

## 2026-05-22 — Sprint 72 : Refonte tronçon 02–04 ComparePage

### Objectif
Différenciation visuelle des trois sections identiques (02 Critères / 03 Coût réel / 04 Ce qui change vraiment). Supprimer l'effet "trois tables identiques" signalé dans l'audit /impeccable critique.

### Corrections CSS (`src/index.css`)
- **`.cp-section-heading .cp-eyebrow`** : override `margin-bottom: 12px` (réduit dans contexte grille éditoriale)
- **`.cp-section--cost`** : fond `#F1F1EC` (surface-soft) pour isoler visuellement la section Coût réel
- **`.cp-cost-reco`** : nouveau composant — recommandation intégrée dans la colonne gauche (verdict avant matrice), séparée par `border-top: 1px solid #CECECA`
- **`.cp-verdict-list` / `.cp-verdict-item`** : nouvelle structure 2 colonnes (critère+outils gauche, verdict droite) pour section 04 — remplace `cp-table` 4 colonnes
- Classes associées : `cp-verdict-item-num`, `cp-verdict-item-criterion`, `cp-verdict-item-tools`, `cp-verdict-item-tool`, `cp-verdict-item-tool-name`, `cp-verdict-item-tool-value`, `cp-verdict-item-tool-note`, `cp-verdict-item-tool--win`, `cp-verdict-item-right`, `cp-verdict-item-verdict`
- Responsive 900px : `cp-verdict-item` passe en 1 colonne, verdict sous les outils avec `border-top`

### Corrections TSX (`src/pages/ComparePage.tsx`)
- **Section 02** : `cp-matrix-header` → `cp-section-grid` avec `cp-section-heading` gauche + `cp-matrix` droite (layout éditorial 2 colonnes)
- **Section 03** : fond `cp-section--cost` + `cp-section-grid` avec recommandation intégrée dans colonne gauche (`cp-cost-reco`) — verdict exposé avant la matrice, `cp-cost-callout` supprimé
- **Section 04** : `cp-table` 4 colonnes → `cp-verdict-list` (liste numérotée, verdict en colonne droite comme hero de chaque ligne)

### Résultat
- Section 02 : grille éditoriale, contexte ancré à gauche, matrice à droite
- Section 03 : surface distincte (`#F1F1EC`), recommandation exposée avant les données
- Section 04 : format liste décisionnelle, numérotée, verdict mis en valeur

---

## 2026-05-22 — Sprint 71 : Comparatif — audit hiérarchie et fluidité

### Objectif
Corrections issues de l'audit /comparatif/* : espacement, hiérarchie typographique, logo symétrie, badges, CTA trop intrusif, ordre hero.

### Corrections
- **`src/index.css`** — `--tt-size-section-h` max réduit de 76px → 56px (clamp 40–56px)
- **`src/index.css`** — `--tt-size-cta-h` max réduit de 56px → 36px (clamp 22–36px) : CTA Diagnostic moins agressif
- **`src/index.css`** — `.cp-hero-title` margin-bottom 20px → 28px (respiration H1/H2)
- **`src/index.css`** — `.cp-hero-duel-logo` : ajout `width: 48px; height: 48px` pour symétrie des logos dans les cartes héro
- **`src/index.css`** — `.cp-section-grid` gap 80px → 60px
- **`src/index.css`** — `.cp-matrix-badge--sufficient` : fond `#F3F3EE` (badge visible sans couleur agressive)
- **`src/index.css`** — `.cp-cta-band .cp-container` : suppression du box blanc/bordé → border-top éditorial seul
- **`src/pages/ComparePage.tsx`** — Hero : contrat ToolTrim déplacé AVANT les cartes duel (verdict avant tools)
- **`src/pages/ComparePage.tsx`** — Label tipping point : "Passe à l'autre si" → "Bascule si"

---

## 2026-05-22 — Context impeccable : PRODUCT.md + DESIGN.md

### Objectif
Installer le contexte de design ToolTrim pour le skill `/impeccable`.

### Fichiers créés
- **`PRODUCT.md`** — register `brand`, utilisateurs, personnalité, anti-références, 5 principes
- **`DESIGN.md`** — système visuel complet : North Star "Le Conseiller Silencieux", palette achromatique, règles nommées
- **`.impeccable/design.json`** — sidecar avec 5 composants HTML/CSS, tonal ramps, narrative

---

## 2026-05-21 — Sprint 77 : Comparatif — comportement post-vigilance + polish CTA band

### Objectif
Affiner le hover des cartes erreurs, le padding mobile, et nettoyer le CTA band final (inline styles → classes).

### Corrections

**`src/index.css`**
- Ajout `transition` + `.cp-pitfall-card:hover` : `border-color #B8B8B2`, `background #FDFDFB` — signal discret sans scale ni ombre.
- Ajout `@media (max-width: 480px)` : padding carte `22px 20px 24px`.
- `.cp-cta-band .cp-container` : padding top/bottom 36px (vs 28px).
- Ajout `.cp-cta-band-desc` : classe CSS pour la description (remplace inline style `fontSize: 17, color: #6F6F68`).
- Ajout responsive ≤640px : padding conteneur 28px 20px, bouton pleine largeur.

**`src/pages/ComparePage.tsx`**
- CTA band : remplacement du `<Link>` avec inline styles + `onMouseEnter/Leave` par `className="tt-button-primary"`.
- CTA band : remplacement du `<p style={...}>` par `<p className="cp-cta-band-desc">`.
- Suppression des 2 handlers `onMouseEnter` / `onMouseLeave` — le hover est désormais en CSS pur.

**`docs/DESIGN_SYSTEM.md`**
- Section `cp-pitfall-*` mise à jour avec règles hover + mobile Sprint 77.
- Section `cp-cta-band` documentée : `.cp-cta-band-desc`, `tt-button-primary`, règle "un seul CTA final".

---

## 2026-05-21 — Sprint 76 : Comparatif — section erreurs fréquentes en bloc anti-pattern

### Objectif
Transformer `#vigilance` en grille de 3 cartes avec sémantique Erreur → Conséquence → Correction ToolTrim.

### Corrections

**`src/pages/ComparePage.tsx`**
- Suppression du layout `cp-section-grid` pour la section vigilance.
- Header migré vers `cp-matrix-header` + `cp-matrix-intro` éditoriale fixe.
- `cp-watchout-list / cp-watchout-row` remplacés par `cp-pitfall-grid` (3 cartes `repeat(3, 1fr)`).
- Structure de chaque carte : `cp-pitfall-index` (numéro) + `cp-pitfall-title` (h3) + `cp-pitfall-consequence` + `cp-pitfall-fix` (encadré correction).
- Slice limité à 3 items (vs 5 avant).
- Pas de CTA ajouté ici — `cp-cta-band` existant en bas de page suffit.

**`src/index.css`**
- Suppression `.cp-watchout-list`, `.cp-watchout-row`, `.cp-watchout-row span/p`, `.cp-watchout-row--rich`, `.cp-watchout-title`, `.cp-watchout-copy`, `.cp-watchout-reco`.
- Ajout `.cp-pitfall-grid` : `repeat(3, 1fr)` → `1fr` sur ≤768px.
- Ajout `.cp-pitfall-card` : `border-top: 3px solid #C8600A` (accent orange sobre), fond blanc, border radius 8px.
- Ajout `.cp-pitfall-index` : `#C8600A`, `font-size: 11px`, lettrée.
- Ajout `.cp-pitfall-title` : 700, 16px, couleur #222222.
- Ajout `.cp-pitfall-consequence` : 14px, couleur `#555554` (contraste amélioré vs #6F6F68).
- Ajout `.cp-pitfall-fix` : bg `#FDF5EE`, border `#EDD9C8`, `tt-fact-label` + `<p>` couleur `#3A2010`.

**`docs/DESIGN_SYSTEM.md`**
- Section `cp-pitfall-*` documentée (remplace `cp-watchout-*`).
- Règles éditoriales : 3 erreurs max, structure Erreur → Conséquence → Correction, pas de CTA en double.

---

## 2026-05-21 — Sprint 75 : Comparatif — section seuil de bascule en section signature

### Objectif
Transformer `#seuil` en section pleine largeur avec carte directionnelle (PAR DÉFAUT → PASSE À L'AUTRE SI), 3 règles numérotées et CTA sélecteur.

### Corrections

**`src/pages/ComparePage.tsx`**
- Suppression du layout `cp-section-grid` pour la section seuil.
- Header migré vers `cp-matrix-header` + `cp-matrix-intro` éditoriale fixe.
- `cp-tipping-panel` (2 cols) remplacé par `cp-tipping-card` (grille `1fr 48px 1fr`) avec SVG flèche centrale.
  - Gauche : `cp-tipping-card-state` — label `tt-fact-label` "Par défaut" + `cp-tipping-card-text`.
  - Centre : `cp-tipping-card-arrow` — SVG `→` rotatif sur mobile.
  - Droite : `cp-tipping-card-state--switch` — bg `#F8F8F4`, bordure gauche.
- `cp-tipping-signals` (liste à tirets) remplacé par `cp-tipping-rules` : `<ol>` max 3 items, chaque item `cp-tipping-rule-num` + `<p>`.
- `cp-tipping-cta` ajouté avec `tt-button-primary` → `/selector?from={slugPair}`.

**`src/index.css`**
- Suppression `.cp-tipping-panel span` (règle micro-label partagée — dernière occurrence, retirée Sprint 75).
- Suppression `.cp-tipping-panel`, `.cp-tipping-panel div`, `.cp-tipping-panel p`, `.cp-tipping-panel div + div`.
- Suppression `.cp-tipping-signals`, `.cp-tipping-signals li`, `.cp-tipping-signals li::before`.
- Ajout `.cp-tipping-card`, `.cp-tipping-card-state`, `.cp-tipping-card-state--switch`, `.cp-tipping-card-arrow`, `.cp-tipping-card-text`.
- Ajout `.cp-tipping-rules`, `.cp-tipping-rules-heading`, `.cp-tipping-rules-list`, `.cp-tipping-rule`, `.cp-tipping-rule-num`.
- Ajout `.cp-tipping-cta` + responsive ≤640px.
- Mobile ≤768px : carte stacked, flèche pivotée 90°.

**`docs/DESIGN_SYSTEM.md`**
- Section `cp-tipping-*` mise à jour avec Sprint 75 (structure carte + règles + CTA).

---

## 2026-05-21 — Sprint 74 : Comparatif — section coût en matrice financière

### Objectif
Transformer la section `#cout` en matrice lisible, sans redondance, avec callout de recommandation.

### Corrections

**`src/pages/ComparePage.tsx`**
- Suppression du layout `cp-section-grid` pour la section coût.
- Remplacement de `cp-cost-grid / cp-cost-row` par `cp-matrix` (réutilise les classes Sprint 73).
- En-têtes avec `<ToolLogo size={28} />` + nom outil — plus de `<span>toolName</span>` par ligne.
- Colonne "Lecture ToolTrim" (label renommé depuis "Recommandation") avec `data-label` pour mobile.
- `cp-cost-note` remplacé par `cp-cost-callout` (encadré `#EDEDE8`, `tt-fact-label` + `tt-body-large`).
- `pricingFraming` utilisé comme intro `cp-matrix-intro` au lieu d'être perdu dans `cp-section-body`.

**`src/index.css`**
- Suppression `cp-cost-grid`, `cp-cost-row`, `cp-cost-label`, `cp-cost-row p`, `cp-cost-reco`, `cp-cost-note`.
- Mise à jour règle partagée `span` : retrait de `.cp-cost-row span` et `.cp-cost-note span` (ne reste que `.cp-tipping-panel span`).
- Ajout `.cp-cost-callout` (fond `#EDEDE8`, border `#DADAD4`, radius 8px, padding 28px 32px).

**`docs/DESIGN_SYSTEM.md`**
- Remplacement `### Coût réel (cp-cost-*)` par documentation complète Sprint 74.

### Règles confirmées
- Zéro prix inventé. Données `costReality` uniquement depuis les données vérifiées.
- Colonne "Lecture ToolTrim" renommée "Lecture" (différenciation de "Décision" dans les critères).
- `cp-matrix` et ses classes réutilisés pour la cohérence visuelle entre les sections.
- Mobile : même comportement cards que la matrice critères (via classes partagées).

---

## 2026-05-21 — Sprint 73 : Comparatif — section critères en matrice de décision

### Objectif
Transformer la section `#criteres` de chaque page comparatif en vraie matrice 4 colonnes, lisible et sans redondance.

### Corrections

**`src/pages/ComparePage.tsx`**
- Section `#criteres` : suppression du layout `cp-section-grid` (titre gauche / contenu droite).
- Remplacement de `cp-score-list / cp-score-row / cp-score-tool / cp-score-level` par une matrice `cp-matrix`.
- En-têtes de colonnes avec `<ToolLogo size={28} />` + nom outil — plus de répétition dans chaque ligne.
- Cellules outil : badge `cp-matrix-badge--{level}` + texte — suppression du nom outil dans la cellule.
- Cellules décision : `data-label` pour labels mobiles via `::before { content: attr(data-label) }`.
- Intro section ajoutée : "Pas les features les plus visibles…"

**`src/index.css`**
- Suppression complète `cp-score-list`, `cp-score-row`, `cp-score-title`, `cp-score-decision`, `cp-score-tools`, `cp-score-tool`, `cp-score-tool--winner`, `cp-score-tool-head`, `cp-score-level`, `cp-score-level--advantage/sufficient/context`.
- Règle partagée `span` conservée uniquement pour `cp-cost-row`, `cp-tipping-panel`, `cp-cost-note`.
- Ajout bloc `cp-matrix-*` (180 lignes CSS) : header, matrice 4 col, badges, mobile cards.
- Badges : "Avantage" fond `#222222` blanc ; "Suffisant" outline gris ; "Dépend" transparent.
- Mobile ≤900px : `cp-matrix-thead` masqué, chaque `cp-matrix-row` → card autonome.
- Mobile `::before` injecte le nom outil / "Décision ToolTrim" via `content: attr(data-label)`.

**`docs/DESIGN_SYSTEM.md`**
- Ajout `### Critères décisionnels — Matrice de décision (Sprint 73)`.
- Tableau badges, structure colonnes, règles logos et données.

### Règles confirmées
- Noms outils dans les en-têtes, pas dans chaque cellule.
- Décision = conséquence pratique d'usage, pas doublon du badge.
- Badges non colorés agressivement (pas de vert saturé).
- ToolLogo uniquement dans les headers — jamais répété par ligne.
- Mobile : zéro scroll horizontal, chaque critère = card autonome.

---

## 2026-05-21 — Sprint 72 : Comparatif — hero logos + VS badge + verdict scannabilité + boutons globaux

### Objectif
Rendre les pages `/comparatif/*` plus scannables, plus décisionnelles et visuellement plus riches sans sortir de la sobriété ToolTrim.

### Corrections

**`src/pages/ComparePage.tsx`**
- Hero : ajout `<ToolLogo size={48} />` dans chaque carte duel (`.cp-hero-duel-head`).
- Hero : badge VS encapsulé dans `<span>` stylisé (cercle 28px, fond `#EDEDEA`, texte `#6F6F68`).
- Hero : bloc contrat ToolTrim déplacé **après** les cartes duel (reconnaissance outil avant arbitrage).
- Hero : label "Verdict ToolTrim" → "Contrat ToolTrim" / "ToolTrim contract".
- Verdict `#verdict` : ajout `<ToolLogo size={40} />` + `.compare-verdict-choice-head` dans chaque carte choix.
- Verdict `#verdict` : `.compare-verdict-warning` (bandeau plat) → `.compare-verdict-callout` (encadré `#EDEDE8`).
- Verdict `#verdict` : CTA intégré dans le callout — bouton `.tt-button-primary` "Analyser ma stack →" (était lien ghost externe au callout).
- Verdict `#verdict` : suppression du `<div className="compare-verdict-cta">` autonome.

**`src/index.css`**
- Ajout bloc `GLOBAL BUTTONS` : `.tt-button-primary` et `.tt-button-secondary` — classes globales réutilisables.
- `.cp-hero-duel-vs` : wrap du texte dans `<span>` + styles cercle (28px, `#EDEDEA`, `#6F6F68`).
- `.cp-hero-contract` : `margin-bottom` conservé, `margin-top: 28px` ajouté (contract maintenant après duel).
- `.compare-verdict-choice-grid` : `margin-bottom` 24px → 32px.
- `.compare-verdict-choice` : `background: transparent` → `background: #FFFFFF`, padding 32px → 28px 32px.
- Ajout `.compare-verdict-choice-head` (flex row, gap 14px, margin-bottom 20px).
- `.compare-verdict-choice-body` : couleur `#444440` (précédemment héritée de `.tt-card-body` `#6F6F68`).
- Suppression `.compare-verdict-warning` + `.compare-verdict-cta` + `.compare-verdict-cta-link`.
- Ajout `.compare-verdict-callout` (encadré `#EDEDE8`, border `#DADAD4`, border-radius 8px, padding 28px 32px).
- Ajout `.compare-verdict-callout-footer` (flex row, border-top, margin-top 24px).
- Mobile ≤640px : `compare-verdict-callout-footer` passe en colonne.

**`docs/DESIGN_SYSTEM.md`**
- Ajout section "Boutons globaux `.tt-button-primary` / `.tt-button-secondary`" avec règle de choix.
- Mise à jour `### Verdict ToolTrim` : anatomie callout, règle logos, règle CTA.
- Mise à jour `### Structure hero` : ordre duel → contract, badge VS, logos obligatoires.

### Règles confirmées
- Tout logo passe par `<ToolLogo>` — jamais d'img directe ni de carré vide.
- Bouton noir (`.tt-button-primary`) uniquement si l'action mène vers l'audit ou le sélecteur.
- Ne pas dupliquer le verdict entre hero (contrat) et section #verdict (cartes choix).
- Pas de code couleur rouge/alerte dans la section verdict.
- Pas de bouton bleu sur les pages comparatif.

---

## 2026-05-19 — Sprint 71 : Corrections UI comparatif — hero, hiérarchie, coût, seuil, CTA

### Objectif
Corriger les pages `/comparatif/*` selon l'audit UI : hero plus décisionnel, hiérarchie H1/H2 claire, coût réel non répétitif, seuil plus lisible, CTA Diagnostic moins intrusif.

### Corrections

**`src/pages/ComparePage.tsx`**
- Hero comparatif réordonné : label → H1 → standfirst → Verdict ToolTrim → cartes outils → triptyque.
- Suppression du paragraphe hero secondaire quand il répétait le standfirst.
- Cartes hero rendues symétriques sans zone logo, pour éviter l'asymétrie logo vide / logo présent.
- Libellé "Contrat ToolTrim" remplacé par "Verdict ToolTrim".
- CTA Diagnostic déplacé après la FAQ.
- Adaptateur coût réel enrichi avec recommandations par ligne : plan gratuit, quand payer, coût caché.

**`src/data/comparison-battles/chatgpt-vs-gemini.json`**
- Standfirst hero fusionné en une phrase décisionnelle.
- Ajout de recommandations coût spécifiques par ligne pour éviter les répétitions mot pour mot.

**`src/index.css`**
- H2 comparatif `.cp-title` réduit à `32–36px`.
- Titres de critères/cartes ajustés à `18–20px`.
- Espacement `.cp-section` réduit à `64–80px`.
- Pills du seuil de bascule remplacées par une liste éditoriale à tiret fin.
- CTA Diagnostic transformé en encadré inline blanc, bordure fine, radius `6px`.
- Badges `AVANTAGE` / `SUFFISANT` passés en version légère.
- Radius des cartes comparatif touchées ramené à `8px`.

### Vérifications attendues
- H1 nettement dominant par rapport aux H2.
- Verdict visible avant les cartes outils.
- Tableau Coût réel sans recommandation répétée mot pour mot.
- Seuil de bascule lisible sans longues pills.
- CTA Diagnostic intégré en clôture de page, après FAQ.

---

## 2026-05-19 — Sprint 70 : Stack cards — logos, hiérarchie Socle/Compléments, wording, layout

### Objectif
Rendre les cards "Carte de la stack" plus lisibles, plus fiables et moins massives. Corriger les logos vides, renommer les groupes, raccourcir le wording décisionnel, rendre le bouton "voir plus" secondaire.

### Problèmes corrigés

| Fichier | Problème | Type |
|---|---|---|
| `toolLogos.ts` | `figma-tokens` et `figma-iconify` sans entrée SimpleIcons → multiples tentatives CDN → flash blanc | Logo |
| `index.css` | `.sd-tool-logo` `background: #FFFFFF` → flash blanc visible pendant chargement img | CSS |
| `index.css` | `.sd-tool-logo img` `background: transparent` → shell blanc visible entre tentatives sources | CSS |
| `StackDetailPage.tsx` | "Socle recommandé" et "Selon ton usage" → libellés trop longs pour des tags | UX |
| `StackDetailPage.tsx` | `getWorkflowDecisionCopy` → phrases trop longues et répétitives | Contenu |
| `StackDetailPage.tsx` | Micro-info "X visibles sur Y" → trop verbeux | UX |
| `StackDetailPage.tsx` | Expand label "Voir tous les outils de cette étape" → trop générique | UX |
| `index.css` | `.sd-expand-btn` → trop visible pour une action secondaire (pill épais, 1px solid foncé) | UX |
| `index.css` | Card padding 40×44px → trop généreux | Layout |

### Corrections

**`src/lib/toolLogos.ts`**
- Ajout de `"figma-tokens": "tokensstudio"`, `"tokens-studio": "tokensstudio"`, `"figma-iconify": "iconify"` dans `SIMPLE_ICON_SLUGS`
- Tokens Studio et Iconify résolus immédiatement via SimpleIcons CDN sans fallback favicon

**`src/index.css`**
- `.sd-tool-logo` : `background: #FFFFFF` → `#F5F5F0` (neutre, harmonise avec fond de card)
- `.sd-tool-logo img` : `background: transparent !important` → `background: #F5F5F0 !important` (correspond au shell, aucun flash blanc pendant chargement)
- `.sd-stack-map-family` layout : `0.75fr / 1.25fr` → `0.52fr / 1fr` (approche 34%/66%)
- `.sd-stack-map-family` padding : `40px 44px` → `36px 40px`, gap `52px` → `44px`
- `.sd-expand-btn` : suppression du pill (border-radius 999px, padding 8px 14px) → lien souligné discret (border-bottom seulement, color #6F6F68, font-weight 500)

**`src/pages/StackDetailPage.tsx`**
- Labels de groupe : "Socle recommandé" → "Socle" / "Selon ton usage" → "Compléments"
- `getWorkflowDecisionCopy` : phrases raccourcies — "Socle : X + Y. Compléments seulement si le livrable l'exige." — 2 lignes max, pas de répétition
- Micro-info : "X visibles sur Y" → "+N masqués" (ne s'affiche que si masqués)
- Expand label : logique simplifiée → "Afficher les N compléments" quelle que soit la composition du groupe caché

### Résultat
- Zéro logo blanc pour `figma-tokens` et `figma-iconify`
- Flash blanc pendant chargement supprimé pour tous les logos de stack cards
- Groupes Socle / Compléments lisibles et courts
- Wording décisionnel 2x plus court et plus actionnable
- Expand button secondaire (lien discret plutôt que pill)
- Cards moins massives (padding réduit de ~10%)

---

## 2026-05-19 — Sprint 69 : Correction audit UI/UX — slugs bruts, alternatives enrichies, CTA verdict

### Objectif
Appliquer les corrections identifiées lors de l'audit UI/UX de `/fr/comparatif/figma-vs-canva` : bug critique des slugs de comparaison injectés dans la liste d'alternatives, descriptions génériques, FAQ insuffisante, CTA secondaire absent dans la section Verdict.

### Problèmes corrigés

| Fichier | Problème | Priorité |
|---|---|---|
| `ComparePage.tsx` | `otherComparisons` (slugs) injectés dans le tableau `alternatives` (noms d'outils) → slug brut affiché | Critique |
| `ComparePage.tsx` | Toutes les alternatives ont la même description générique hardcodée | Contenu |
| `ComparePage.tsx` | Pas de CTA secondaire dans la section Verdict | UX |
| `figma-vs-canva.json` | `alternatives` en format `string[]` sans raisons par outil | Contenu |
| `figma-vs-canva.json` | 1 seule question FAQ | Contenu |
| `figma-vs-canva.json` | `tooltrimAtAGlance` sans `heroPositionA/B`, `verdictCardTitleA/B`, `verdictWarning` | Contenu |

### Corrections

**`src/pages/ComparePage.tsx`**
- `BattleRawData.related.alternatives` : type changé de `string[]` vers `Array<string | { name, reason?, reasonEn? }>` — support format objet avec raison spécifique par outil
- Construction du tableau `alternatives` : suppression de l'injection de `otherComparisons` — les slugs de comparaison ne sont pas des noms d'outils
- Mapping `alternatives` : extraction de la raison spécifique si format objet, fallback générique si format string
- Section Verdict : ajout d'un bloc `.compare-verdict-cta` après la bande d'avertissement — lien vers le sélecteur ToolTrim avec passage du `slugPair`

**`src/data/comparison-battles/figma-vs-canva.json`**
- `related.alternatives` : passage au format objet avec 4 entrées (Adobe Express, Penpot, Sketch, Framer) + raison distincte + traduction EN pour chacune
- `faq` : 4 nouvelles questions ajoutées (Figma gratuit ? ; Canva adapté au design produit ? ; Principale différence ? ; Petite équipe sans designer ?)
- `tooltrimAtAGlance` : ajout de `heroPositionA/B`, `heroBrief`, `verdictCardTitleA/B`, `verdictCardTextA/B`, `verdictWarning`

**`src/index.css`**
- Ajout de `.compare-verdict-cta`, `.compare-verdict-cta .tt-card-body`, `.compare-verdict-cta-link` (layout flex, bordure, hover noir) et responsive `@media (max-width: 640px)`

### Résultat
- Zéro slug brut dans la section alternatives
- 4 descriptions d'alternatives contextualisées et uniques
- 5 questions FAQ (minimum recommandé pour le SEO)
- CTA secondaire visible dans le Verdict pour toutes les pages comparatives
- `figma-vs-canva` : section Verdict complètement enrichie avec titres de cartes, textes et avertissement spécifiques

---

## 2026-05-19 — Sprint 68 : Centralisation des logos outils — ToolLogo comme composant unique

### Objectif
Stabiliser l'affichage des logos outils partout sur ToolTrim. Éliminer les carrés vides, les `<img>` sans fallback, et les composants locaux qui dupliquaient la logique de `ToolLogo`.

### Problèmes identifiés

| Fichier | Problème |
|---|---|
| `ResultsPage.tsx` | Composant `Logo` local — seulement 2 niveaux de fallback, couleur de fond aléatoire |
| `ProfileRecapPanel.tsx` | `<img onError style.display=none>` → **carré blanc vide** quand l'image échoue |
| `ToolSelectionStep.tsx` | `getToolLogoUrl()` = première source seulement, perd la chaîne multi-source |
| `ComparePage.tsx:1841` | Fallback `alt.name.slice(0,2)` manuel pour outils non trouvés dans l'index |

### Corrections

**`ResultsPage.tsx`**
- Suppression du composant `Logo` local (30 lignes de logique dupliquée)
- Import `ToolLogo` + alias `const Logo = ...` → compatibilité de tous les call-sites sans modifier chaque `<Logo>`
- Suppression de `getToolLogoUrl` / `getToolLogoUrlHD` de cet import

**`ProfileRecapPanel.tsx`**
- Suppression du pattern `{ getToolLogoUrl(tool) ? <img onError display=none> : <div initial> }`
- Remplacement par `<ToolLogo tool={tool} size={20} />` — fallback initial garanti, jamais de carré vide
- Suppression import `getToolLogoUrl`

**`ToolSelectionStep.tsx`**
- Suppression du pattern `getToolLogoUrl + logoFailed useState + img + fallback div`
- Remplacement par `<ToolLogo tool={tool} size={32} />` — chaîne complète : SimpleIcons → Google Favicon → DuckDuckGo → initiale
- Suppression import `getToolLogoUrl`

**`ComparePage.tsx`**
- Fallback des alternatives non-résolues : suppression du `<span>` hardcodé `alt.name.slice(0,2)`
- Remplacement par `<ToolLogo tool={{ name: alt.name, slug: slugifyName(alt.name) }} size={24} />` — essaie SimpleIcons + favicon avant les initiales

### Nouveaux tokens CSS (`src/index.css`)
Ajout des classes utilitaires `.tt-tool-logo-sm/md/lg/xl` pour documenter les tailles standard :
- `sm` = 28px (ticker, inline, recap strip)
- `md` = 40px (cards, tables, sidebar)
- `lg` = 52px (hero, stack cards)
- `xl` = 64px (compare duel, tool detail hero)

Note : `ToolLogo` utilise le prop `size` en inline style — ces classes servent de référence documentaire et peuvent optionnellement encadrer le composant dans des wrappers.

### Résultat
- **Zéro carré vide** — le fallback initial est toujours affiché si toutes les sources CDN échouent
- **Chaîne multi-source** — SimpleIcons → Google Favicon V2 → DuckDuckGo → initiale lettre
- **Logique unique** — tout logo outil passe par `ToolLogo` (sauf composants homepage intentionnellement isolés : HeroSection, TickerBar, HomePage)
- TypeScript `exit:0` · Build `exit:0` · Lint `exit:0` (0 erreurs)

---

## 2026-05-19 — Sprint 67 : Section Verdict — layout 2 cartes, hiérarchie décisionnelle, zéro benchmark

### Objectif
Transformer le verdict comparatif en vraie aide à la décision. Remplacer la grille 3 colonnes compressée (textes trop longs, labels rouges "Évite…", framing répété, benchmarks techniques) par une structure claire : header 2 colonnes + 2 cartes de choix + bandeau doublon pleine largeur.

### Problèmes résolus
- Grille 3 colonnes trop étroite pour des textes de décision
- Labels rouges "Évite A/B si…" ajoutaient du bruit visuel
- `cp-verdict-statement` ("Recommandation ToolTrim") répétait le hero
- `chooseAIfList.join(" ")` = liste entière concaténée, trop longue dans une colonne compressée
- Benchmarks, noms de modèles, pourcentages dans `verdictShort` visibles dans le verdict

### Nouvelle structure verdict

1. **Header 2 colonnes** — kicker + titre h2 à gauche / phrase intro à droite (`tt-section-intro`)
2. **Grille 2 cartes** — une carte par outil, label uppercase + titre + texte court
3. **Bandeau warning** — pleine largeur, séparateurs haut/bas, texte doublon IA

### Nouvelles classes CSS (`src/index.css`)
- `.compare-verdict-header` — grid 2 col (0.85fr / 1.4fr), gap clamp(48px–96px)
- `.compare-verdict-header-left` — colonne flex pour eyebrow + titre
- `.compare-verdict-intro` — alias margin:0 pour `tt-section-intro` dans le header
- `.compare-verdict-choice-grid` — grid 2 col, gap 24px
- `.compare-verdict-choice` — carte avec `border: 1px solid var(--color-border)`, `border-radius: var(--tt-radius-lg)`, `padding: 32px`
- `.compare-verdict-choice-title` — modifier pour `tt-card-title` dans les cartes
- `.compare-verdict-choice-body` — modifier pour `tt-card-body` dans les cartes
- `.compare-verdict-warning` — bandeau `border-top/bottom: 1px solid var(--color-border)`, `padding: 28px 0`
- Mobile `≤900px` : header et choice-grid en 1 colonne

### Typographie : uniquement tokens globaux
- Kicker : `cp-eyebrow` → `var(--tt-size-kicker)`
- Titre section : `cp-title` → `var(--tt-size-section-h)`
- Intro header : `.tt-section-intro` → `var(--tt-size-section-intro)`
- Label carte : `.tt-fact-label` (10px uppercase)
- Titre carte : `.tt-card-title` → `var(--tt-size-card-title)`
- Corps carte : `.tt-card-body` → `var(--tt-size-card-body)`
- Bandeau texte : `.tt-body-large` → `var(--tt-size-body-large)`
- Aucune valeur px/clamp locale créée

### Nouveaux champs TypeScript
**`BattleRawData.tooltrimAtAGlance`** — 5 nouveaux champs optionnels :
- `verdictCardTitleA/B` — titre de la carte outil (ex: "Le choix polyvalent")
- `verdictCardTextA/B` — texte court, 1 phrase décisive
- `verdictWarning` — texte du bandeau doublon

**`CompareEditorialContent`** — 10 nouveaux champs optionnels (fr + En pairs)

**`buildBattleEditorialContent`** — mapping avec fallback :
- CardTitle : `aglance?.verdictCardTitleA` (vide si absent — h3 conditionnel)
- CardText : `aglance?.verdictCardTextA` → `verd?.chooseAIf?.[0]` → `comparison.chooseAIf[0]`
- Warning : `aglance?.verdictWarning` → `verd?.avoidBothIf?.[0]` → `comparison.avoidBothIf?.[0]`

### Contenu ChatGPT vs Gemini (`chatgpt-vs-gemini.json`)
Nouveaux champs dans `tooltrimAtAGlance` :
- `verdictCardTitleA` : "Le choix polyvalent"
- `verdictCardTitleB` : "Le choix Google-first"
- `verdictCardTextA` : "À privilégier si tu veux un assistant unique pour écrire, analyser, coder, manipuler des fichiers et produire vite au quotidien."
- `verdictCardTextB` : "À considérer si ton travail vit déjà dans Google Workspace, avec beaucoup de documents, recherche, fichiers et usages multimodaux."
- `verdictWarning` : doublon IA avec règle de séparation des usages

### Règle ZÉRO REDONDANCE appliquée
- Hero = contexte écosystème
- Verdict = règle de choix (1 titre + 1 phrase par outil)
- Critères = détails comparatifs (section 02)
- Coût = section dédiée
- Plus de répétition du `finalRecommendation` dans le verdict

### QA
- TypeScript : `exit:0`
- Build : `exit:0` (0 erreurs)
- Lint : `exit:0` (0 erreurs, 156 warnings préexistants)

---

## 2026-05-19 — Sprint 66 : Hero comparatif — logos, contenu éditorial, battle ChatGPT vs Gemini

### Objectif
Clarifier la valeur ToolTrim dans le hero comparatif. Résoudre six problèmes : logos absents, position label trop long, heroContract trop technique, microfact budget montrant un prix brut, microfact risque vague, et absence de la battle ChatGPT vs Gemini.

### Corrections CSS (`src/index.css`)
- `.cp-hero-duel-logo` — suppression de `border`, `background`, `border-radius` : le conteneur est neutre, `ToolLogo` gère sa propre présentation visuelle
- `.cp-hero-promise` — margin réduit de `0 0 40px` à `0 0 20px` pour serrer avec `.cp-hero-brief`
- Nouvelle classe `.cp-hero-brief` — paragraphe éditorial court entre sous-titre et duel cards, `font-size: var(--tt-size-body)`, `color: #6F6F68`, `max-width: 720px`

### Corrections `src/lib/toolLogos.ts`
- Ajout `gemini: "googlegemini"` dans `SIMPLE_ICON_SLUGS` (section G) — résout le logo absent pour Gemini

### Corrections `src/pages/ComparePage.tsx`
- `getBudgetSignal()` — refactorisé pour retourner un signal éditorial, plus jamais un prix brut (ex: `"Compare le plan utile, pas le prix d'entrée"`)
- `CompareEditorialContent` — nouveau champ `aglanceHeroBrief?: string`
- `BattleRawData.tooltrimAtAGlance` — nouveau champ `heroBrief?: string`
- `buildBattleEditorialContent` — mapping `aglanceHeroBrief: aglance?.heroBrief`
- `heroBrief` dans le render — affiché si présent, null sinon (pas de fallback générique)
- `heroPositionA / heroPositionB` — utilisent `?? null` : label affiché uniquement si explicitement renseigné dans le JSON (plus de fallback `bestForA` trop long)
- Logo `ToolLogo` — taille passée à `size={48}` pour une meilleure lisibilité dans les duel cards
- JSX hero — `{heroBrief && <p className="cp-hero-brief">{heroBrief}</p>}` inséré après le sous-titre
- JSX duel positions — `{heroPositionA && ...}` conditionnel pour éviter les labels vides

### Nouvelle battle : ChatGPT vs Gemini
- Nouveau fichier `src/data/comparison-battles/chatgpt-vs-gemini.json`
- Contenu éditorial intégral selon brief de mission :
  - heroPromise : `"Deux assistants généralistes. Deux écosystèmes."`
  - heroBrief : paragraphe explicatif sur le choix par écosystème
  - heroPositionA : `"Assistant polyvalent"` / bestFor : `"Écriture · analyse · code · images · fichiers"`
  - heroPositionB : `"Assistant Google-first"` / bestFor : `"Workspace · recherche · documents · multimodal"`
  - heroContract : `"Ne choisis pas l'IA \"la plus forte\". Choisis celle qui s'insère le mieux dans ton workflow réel."`
  - defaultChoiceLabel : `"ChatGPT"`, budgetShort : `"Compare le plan utile, pas le prix d'entrée"`, mainRisk : `"Payer deux IA généralistes sans usages séparés"`
- Enregistrement dans `src/data/comparisonBattles.ts` (import + entrée `"chatgpt-vs-gemini"`)

### Règles préservées
- Aucune taille typographique locale créée — tout référence `var(--tt-size-*)`
- Fallback logo propre : `ToolLogo` affiche initiale stylée si toutes les sources CDN échouent
- TypeScript : `exit:0` confirmé

---

## 2026-05-19 — Sprint 65 : Design system typographique scalable — tokens globaux

### Objectif
Créer une source unique de vérité pour toute la typographie ToolTrim. Plus aucune page ne code ses tailles en dur. Changer un token `--tt-size-*` dans `:root` propage le changement partout.

### Nouveaux tokens CSS dans `:root`
13 variables `--tt-size-*` couvrant tous les niveaux typographiques :
- `--tt-size-hero` → `clamp(64px, 8vw, 124px)`
- `--tt-size-hero-sub` → `clamp(22px, 2vw, 30px)`
- `--tt-size-section-h` → `clamp(44px, 5vw, 76px)`
- `--tt-size-section-intro` → `clamp(20px, 1.8vw, 26px)`
- `--tt-size-body-large` → `clamp(18px, 1.5vw, 22px)`
- `--tt-size-body` → `16px`
- `--tt-size-kicker` → `11px`
- `--tt-size-fact` → `clamp(18px, 1.2vw, 22px)`
- `--tt-size-fact-compact` → `14px`
- `--tt-size-card-title` → `15px`
- `--tt-size-card-body` → `14px`
- `--tt-size-metric` → `clamp(24px, 1.8vw, 32px)`
- `--tt-size-cta-h` → `clamp(28px, 4vw, 56px)`

Variables de section : `--tt-section-y`, `--tt-hero-pt`, `--tt-hero-pb`
Variables de radius : `--tt-radius-sm/md/lg/xl`

### Migration classes `tt-*`
Toutes les 12 classes `tt-*` existantes référencent maintenant `var(--tt-size-*)` au lieu de clamp() codés en dur.

### Nouvelles classes `tt-*`
- `.tt-cta-title` — titre de bande CTA (`--tt-size-cta-h`)
- `.tt-container` / `.tt-hero` / `.tt-section` / `.tt-section--last` — primitives layout
- `.tt-section-header` / `.tt-section-grid` — patterns de section
- `.tt-content-narrow` / `.tt-content-wide` — conteneurs à largeur contrainte
- `.tt-table-head-cell` / `.tt-table-criterion` / `.tt-table-value` / `.tt-table-note` / `.tt-table-decision` — tokens table
- `.tt-statement` / `.tt-statement-label` / `.tt-statement-text` — pattern bloc éditorial

### Migration `cp-*` → tokens
Classes clés migrées sur `var(--tt-size-*)` :
- `.cp-hero-title` → `var(--tt-size-hero)`
- `.cp-hero-promise` → `var(--tt-size-hero-sub)`
- `.cp-eyebrow` → `var(--tt-size-kicker)`
- `.cp-title` → `var(--tt-size-section-h)`
- `.cp-section-framing` → `var(--tt-size-section-intro)`
- `.cp-verdict-statement-label` → `var(--tt-size-kicker)`
- `.cp-table-cell--criterion` → `var(--tt-size-fact-compact)`
- `.cp-table-tool-note` → `var(--tt-size-card-body)`
- `.cp-section` → `padding: var(--tt-section-y) 0`
- `.cp-hero` → `padding: var(--tt-hero-pt) 0 var(--tt-hero-pb)`
- `.cp-hero-duel-card` → `border-radius: var(--tt-radius-md)`

### Migration `sd-*` → tokens
- Toutes les occurrences de `font-size: 11px` dans les eyebrows → `var(--tt-size-kicker)`
- Groupe sélecteur (`.sd-hero-eyebrow, .sd-section-eyebrow, …`) migré

### Migration JSX pages
- `ComparePage.tsx` CTA band title → `.tt-cta-title`
- `StackDetailPage.tsx` CTA band title → `.tt-cta-title` + kicker → `.tt-kicker`

### Règle anti-exception renforcée
FORBIDDEN : `font-size: clamp(...)` ou px en dur dans un class `cp-*` / `sd-*` couverte par un token
REQUIRED : référencer `var(--tt-size-*)` ou utiliser directement une class `tt-*`

---

## 2026-05-19 — Sprint 64 : Table décisionnelle "Ce qui change vraiment le choix"

### Objectif
Transformer la table comparative en vraie aide à la décision. Chaque ligne répond : "Sur ce critère, A ou B ?" — pas un catalogue de features.

### Changements de données (Slack vs Teams)
- Remplacement des 5 lignes plates par 6 lignes structurées avec `{ title, note }` pour chaque outil
- Suppression des lignes redondantes avec la section Coût (plan gratuit, prix d'entrée)
- Nouvelles lignes : Usage principal, Collaboration externe, Coût réel, Réunions et documents, Stack d'outils, Risque principal
- Contenu basé sur le brief éditorial de la mission (wording validé)

### Nouveaux types TypeScript
- `BattleRowCellValue = string | { title: string; note?: string }` — rétro-compatible
- `cellTitle()` / `cellNote()` — helpers pour extraire les champs selon le type
- `CompareTableRow` étendu avec `toolANote?`, `toolANoteEn?`, `toolBNote?`, `toolBNoteEn?`
- `BattleRawData.comparisonRows.toolA/toolB` accepte maintenant l'union type

### Architecture JSX
- Cellules outil : `<p className="cp-table-tool-title">` + `{note && <p className="cp-table-tool-note">}` — note absente = pas d'espace vide
- Cellule décision : `<div className="cp-table-verdict">` avec `data-label` pour mobile
- Header : "Décision ToolTrim" au lieu de "Verdict"
- Attribut `role="table/row/cell/columnheader"` pour accessibilité

### Nouveau CSS `cp-table`
- Grille : `minmax(140px,0.8fr) minmax(220px,1.25fr) minmax(220px,1.25fr) minmax(240px,1.3fr)` (verdict large, pas 110px)
- `align-items: start` (plus `baseline`) — hauteur naturelle
- `.cp-table-tool-title` : 17px · weight 650 · -0.03em
- `.cp-table-tool-note` : 14px · 400 · #6F6F68
- `.cp-table-verdict` : `border-left: 2px solid #222222` · 16px · weight 600
- Mobile (≤900px) : stacked card, labels via `::before`, décision avec `border-top` accent

### Fallback
- Autres JSON (strings plates) : `cellTitle()` retourne la string, `cellNote()` retourne `undefined` → `<p className="cp-table-tool-note">` non rendu
- `NOTION_VS_AIRTABLE` : non affecté (note fields `undefined`)
- `buildFallbackContent` : non affecté (pas de notes générées)

### Build
✅ 0 erreur TypeScript · build OK · 32 comparisons pré-rendus

---


## 2026-05-19 — Sprint 63 : Harmonisation typographique Comparatif ↔ Stack

### Objectif
Recaler les pages Comparatif sur le système typographique global ToolTrim. La page Stack est la référence. Supprimer les tailles spécifiques trop agressives introduites au Sprint 62.

### Écarts corrigés

| Élément | Avant | Après |
|---|---|---|
| `cp-hero-title` | `clamp(72px, 12vw, 170px)` | `clamp(64px, 8vw, 124px)` |
| `cp-hero-promise` | `clamp(24px, 2.2vw, 36px)` | `clamp(22px, 2vw, 30px)` |
| `cp-eyebrow` | `12px` | `11px` (aligne Stack) |
| `cp-title` (section) | `clamp(44px, 5vw, 72px)` · ls -0.065em | `clamp(44px, 5vw, 76px)` · ls -0.06em |
| `cp-section-framing` | `clamp(21px, 2vw, 29px)` | `clamp(20px, 1.8vw, 26px)` |
| `cp-verdict-statement p` | `clamp(22px, 2.2vw, 32px)` | `clamp(21px, 2vw, 28px)` |
| Mobile hero (640px) | `clamp(52px, 15vw, 72px)` | `clamp(44px, 12vw, 64px)` |
| Tablet section heading | `clamp(42px, 13vw, 60px)` | `clamp(40px, 9vw, 56px)` |

### Nouveaux tokens globaux `tt-*`
Ajout d'une section `TT TYPE SCALE` dans `src/index.css` avec 12 classes documentées :
`tt-hero-title`, `tt-hero-subtitle`, `tt-kicker`, `tt-section-title`, `tt-section-intro`, `tt-body`, `tt-body-large`, `tt-fact-label`, `tt-fact-value`, `tt-fact-value-compact`, `tt-card-title`, `tt-card-body`, `tt-metric-value`.

### Règle anti-exception documentée
Interdiction de définir des font-sizes spécifiques par page si couverts par `tt-*`. Pages Stack = référence. Comparatif = même échelle, structure différente.

### Fichiers modifiés
- `src/index.css` — tokens `tt-*`, corrections `cp-hero-title`, `cp-hero-promise`, `cp-eyebrow`, `cp-title`, `cp-section-framing`, `cp-verdict-statement p`, overrides mobile/tablet
- `docs/DESIGN_SYSTEM.md` — section typographie canonique avec table `tt-*` et règle anti-exception
- `docs/CHANGELOG_AI.md` — cette entrée

### Build
✅ 0 erreur TypeScript · build OK

---

## 2026-05-19 — Sprint 62 : Hero comparatif face-à-face de décision

### Objectif
Transformer le hero des pages Comparatif en vrai face-à-face de décision. Remplacer la table froide de 6 faits par un duel orienté, un contrat éditorial et 3 signaux clés.

### Principe
Le hero doit répondre en 5 secondes : quels outils, quelle logique pour chacun, quel arbitrage ToolTrim, quel risque principal. Zéro redondance avec le Verdict (conditions si-alors) et le Coût (détails pricing).

### Structure hero cible
1. Breadcrumb + eyebrow COMPARATIF
2. Titre `h1` en display typographique
3. Phrase de promesse ToolTrim (editorial, pas générique)
4. Face-à-face duel (`cp-hero-duel`) — 2 cards avec logo, position, nom, description courte
5. Contrat ToolTrim (`cp-hero-contract`) — statement éditorial entre filets, sans carte
6. Micro-fiche 3 cellules (`cp-hero-microfact`) — PAR DÉFAUT / COÛT RÉEL / RISQUE

### Nouveaux champs JSON (`tooltrimAtAGlance`)
- `heroPromise` — phrase de promesse hero (subtitle éditorial)
- `heroPositionA` — titre de position court pour l'outil A (ex. "Le hub externe")
- `heroPositionB` — titre de position court pour l'outil B (ex. "Le hub Microsoft 365")
- `heroContract` — arbitrage ToolTrim en une phrase forte (sans fioritures)

### Fichiers modifiés
- `src/data/comparison-battles/slack-vs-microsoft-teams.json` — ajout des 4 nouveaux champs dans `tooltrimAtAGlance`
- `src/pages/ComparePage.tsx` — extension de `BattleRawData.tooltrimAtAGlance`, `CompareEditorialContent`, `buildBattleEditorialContent()`, `buildFallbackContent()`, `NOTION_VS_AIRTABLE` ; ajout des variables hero duel ; réécriture du JSX hero
- `src/index.css` — mise à jour `cp-hero-title` (clamp 72px→170px, weight 700, tracking -0.075em), `cp-hero-promise` (clamp 24px→36px) ; suppression de `cp-battle-stage/card/center/hero-fact-sheet/fact` ; ajout de `cp-hero-duel`, `cp-hero-duel-card`, `cp-hero-duel-vs`, `cp-hero-contract`, `cp-hero-microfact`, `cp-hero-microfact-cell`

### Résultats
- Le hero oriente en 5 secondes sans dupliquer le contenu des sections suivantes
- Le contrat ToolTrim remplace la recommandation générique par une phrase d'arbitrage directe
- La micro-fiche 3 cellules remplace la table 6 faits — plus lisible, plus focalisée
- Fallback gracieux : toutes les nouvelles propriétés sont optionnelles — si absentes, les valeurs dérivées existantes prennent le relais
- Build : ✅ 0 erreur TypeScript

---

## 2026-05-19 — Sprint 61 : Architecture typographique éditoriale des sections Comparatif

### Objectif
Transformer la mise en page des pages Comparatif en mise en page éditoriale : hiérarchie typographique forte, sections à 2 colonnes (titre / contenu), recommandation comme temps fort editorial (et non card SaaS), colonnes de décision lisibles et scannables.

### Architecture section (nouveau système)

Chaque section suit désormais la structure :
```
cp-container
  cp-eyebrow          ← 12px caps, margin-bottom 28px, poids 700
  cp-section-grid     ← 2 colonnes desktop : 0.9fr / 1.6fr, gap 80px
    cp-section-heading  ← gauche : titre h2 cp-title
    cp-section-body     ← droite : contenu décisionnel
```

Sauf exceptions full-width (features table, alternatives list, FAQ) → `margin-bottom: 28px` sur le titre.

### Verdict (section 01) — refonte complète

| Avant | Après |
|-------|-------|
| p.cp-title + p.cp-section-intro + p.cp-final-recommendation (card border-radius) + cp-verdict-grid (bullet lists ✓/✕) | h2.cp-title + p.cp-section-framing + div.cp-verdict-statement (editorial) + div.cp-decision-columns (prose éditoriale) |

Structure :
1. **`cp-section-framing`** — phrase de cadrage (22–29px, muted, max-width 760px)
2. **`cp-verdict-statement`** — recommandation entre 2 filets horizontaux, sans fond ni card, texte 22–32px 600 noir
3. **`cp-decision-columns`** — 3 colonnes prose éditoriale, 18–24px, séparateurs fins

### CSS — classes supprimées

`.cp-verdict-grid`, `.cp-verdict-col`, `.cp-verdict-col--full`, `.cp-verdict-text`, `.cp-verdict-label`, `.cp-verdict-list`, `.cp-verdict-list--avoid`, `.cp-verdict-avoid-label`, `.cp-final-recommendation`

### CSS — classes ajoutées / mises à jour

| Classe | Changement |
|--------|-----------|
| `.cp-section` | padding `56px 0` → `clamp(80px, 9vw, 140px) 0` |
| `.cp-eyebrow` | font-size 11→12px, margin-bottom 10→28px, font-weight 600→700 |
| `.cp-title` | size `clamp(1.75rem, 3vw, 2.625rem)` → `clamp(44px, 5vw, 72px)`, weight 600→700, tracking -0.055→-0.065em, line-height 0.98→0.92, max-width 620px |
| `.cp-section-grid` | NEW — 2-col grid layout |
| `.cp-section-heading` | NEW — gauche du grid |
| `.cp-section-framing` | NEW — clamp(21px, 2vw, 29px), muted, max-width 760px |
| `.cp-verdict-statement` | NEW — border-top/bottom, no bg, texte clamp(22px, 2.2vw, 32px) 600 |
| `.cp-verdict-statement-label` | NEW — 11px caps, muted |
| `.cp-decision-columns` | NEW — repeat(3, 1fr), border-top |
| `.cp-decision-col` | NEW — padding 28px, border-left sur col 2/3 |
| `.cp-decision-label` | NEW — 11px 700 caps |
| `.cp-decision-text` | NEW — clamp(18px, 1.6vw, 24px), prose |
| `.cp-decision-note` | NEW — 14px muted, label rouge pour "Évite si" |

### JSX — sections mises à jour

- **Verdict** : h2 + cp-section-grid complet + cp-section-framing + cp-verdict-statement + cp-decision-columns
- **Critères** : h2 + cp-section-grid
- **Coût** : h2 + cp-section-grid  
- **Seuil** : h2 + cp-section-grid
- **Vigilance** : h2 + cp-section-grid
- **Alternatives, Features, FAQ** : h2 (full-width, marginBottom 28px inline)

Toutes les balises `<p className="cp-title">` → `<h2 className="cp-title">` (amélioration sémantique SEO)

### Mobile

- Grille en 1 colonne sous 1023px, gap 32px
- Titre mobile : `clamp(42px, 13vw, 60px)`
- Colonnes de décision empilées, border-left supprimé, border-top par article
- cp-section-framing : 20px
- cp-verdict-statement p : 21px

### Build
- `npx tsc --noEmit` → ✅ 0 errors
- `npm run build` → ✅ built in 13s, 0 errors

## 2026-05-19 — Sprint 60 : Verdict structuré + données pricing réelles

### Objectif
Zéro redondance entre sections de la page comparatif. Chaque section répond à une question distincte. Le verdict affiche des listes à puces contextuelles au lieu d'un bloc de texte. Le coût réel utilise les données `pricingComparison` vérifiées.

### Principe de non-redondance
| Section | Question unique |
|---------|----------------|
| Hero fact sheet | Qui utilise quoi en un regard (étiquettes courtes) |
| 01 Verdict | Conditions précises pour choisir A / B / éviter chacun / éviter les deux |
| 02 Critères | Les critères qui changent vraiment le score final |
| 03 Coût réel | Réalité des plans gratuits, quand payer, coûts cachés (jamais dans le hero) |
| 04 Features | Fonctions qui changent le résultat (table comparative) |
| 05 Seuil | À quel moment on bascule de A vers B |
| 06 Vigilance | Erreurs de choix fréquentes et conséquences |

### Fichiers modifiés

**`src/pages/ComparePage.tsx`**
- `BattleRawData` — 3 nouveaux types top-level : `tooltrimAtAGlance`, `verdict`, `pricingComparison`
- `CompareEditorialContent` — 11 nouveaux champs : `chooseAIfList[]`, `chooseBIfList[]`, `avoidAIfList[]`, `avoidBIfList[]`, `avoidBothIfList[]`, `aglanceBestForA/B`, `aglanceBudget`, `aglanceRisk`, `aglanceDefaultLabel`, `aglanceLevel`
- `buildBattleEditorialContent()` — lit `data.verdict.*` pour les listes puces, `data.pricingComparison.*` pour les 3 lignes coût, `data.tooltrimAtAGlance.*` pour les signaux hero
- Hero fact sheet — préfère les overrides `aglance*` quand disponibles
- Section `#verdict` JSX — remplace les 3 blocs de texte par des listes `✓ / ✕` avec `cp-verdict-list` et `cp-verdict-avoid-label`
- `NOTION_VS_AIRTABLE` inline const — ajout des 11 nouveaux champs
- `buildFallbackContent()` — ajout des 11 champs stub

**`src/data/comparison-battles/*.json`** (11 fichiers)
- Merge de `verdict` (summary, chooseAIf[], chooseBIf[], avoidAIf[], avoidBIf[], avoidBothIf[], finalRecommendation) depuis les fichiers vérifiés Downloads
- Merge de `pricingComparison` (entryLevel, freePlanReality, whenPaidBecomesNecessary, hiddenCosts, tooltrimNote) depuis les fichiers vérifiés Downloads
- `slack-vs-microsoft-teams.json` — `tooltrimAtAGlance` enrichi de 3 champs hero concis : `defaultChoiceLabel`, `budgetShort`, `complexityLabel` (valeurs mission : "Ça dépend du socle existant", "Slack s'ajoute. Teams peut déjà être inclus.", "À cadrer") + mise à jour `bestForToolA/B`, `mainRisk`

**`src/index.css`**
- `.cp-verdict-col--full` — span 3 colonnes pour "Évite les deux"
- `.cp-verdict-list` — liste puces `✓` avec gap 6px
- `.cp-verdict-list--avoid` — puce `✕` rouge (#C0392B)
- `.cp-verdict-avoid-label` — label "Évite X si…" en 11px caps rouge

### QA zero-redondance (Slack vs Teams)
- Hero : étiquettes courtes ("Multi-clients + stack ouverte", "À cadrer", etc.)
- Verdict 01 : conditions précises ×5 (chooseA, chooseB, avoidA, avoidB, avoidBoth)
- Coût 03 : freePlanReality, whenPaid, hiddenCosts — jamais répétés ailleurs
- Aucune information n'apparaît dans deux sections différentes

### Build
- `npx tsc --noEmit` → ✅ 0 errors
- `npm run build` → ✅ built in 27s, 0 errors

## 2026-05-18 — Sprint 59 : Hero fact sheet no-truncation fix

### Objectif
Supprimer toute troncature des valeurs de la table signalétique hero, en particulier NIVEAU qui affichait "inst..." au lieu de "Installé". Restreindre la grille 6 colonnes à ≥1440px.

### Cause racine
`.sd-fact-col--compact .sd-fact-value { white-space: nowrap }` (ligne ~14115, sprint typographie) était appliqué à la colonne NIVEAU car "NIVEAU" figurait dans `compactLabels`. Combiné à `overflow: hidden` hérité du conteneur `.sd-hero-fact-table`, le texte était coupé invisiblement.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — "NIVEAU"/"LEVEL" sortis de `compactLabels` vers un nouveau tableau `levelLabels`; le modificateur `sd-fact-col--level` est appliqué à la place de `sd-fact-col--compact`.
- `src/index.css` — bloc sprint ajouté en fin de fichier : grille 6 col uniquement ≥1440px, 3×2 col 769–1439px, 2 col ≤768px, 1 col ≤480px. Règles `!important` sur `white-space`, `overflow`, `text-overflow`, `-webkit-line-clamp`, `max-width` pour toutes les familles de valeurs (compact, level, long).
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de la règle no-truncation et du nouveau modificateur niveau.

### Résultat
- Aucune cellule de la table signalétique ne peut tronquer sa valeur.
- NIVEAU a son propre modificateur CSS `sd-fact-col--level` (police légèrement plus petite que compact, mais `white-space: normal`).
- La grille 6 colonnes ne s'active qu'à ≥1440px ; entre 769px et 1439px, la table est 3×2.

---

## 2026-05-18 — Sprint 58 : Budget decision module redesign

### Objectif
Remplacer les 3 grandes cartes avec tool chips de la section Budget par un module de décision épuré : bande de seuils (3 niveaux), 3 principes courts (sans logos) et une note. Supprimer le CTA "Auditer ma stack" de cette section.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — remplacement complet du bloc BUDGET : suppression de `sd-budget-decision-grid`, `BudgetToolChips` et `sd-budget-action`/Link CTA ; ajout de la bande de seuils avec classes `sd-bt-range/label/desc`, du bloc `sd-budget-principles` et d'une note étendue.
- `src/index.css` — ajout du sprint budget decision module : `.sd-budget-thresholds` (bordure + border-radius unifiés), `.sd-budget-threshold--active`, `.sd-bt-range/label/desc`, `.sd-budget-principles`, `.sd-budget-principle`, `.sd-bp-head/body`, `.sd-budget-intro` (18px), `.sd-budget-note` (13px) et responsive ≤900px.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du module décision budget sans logos ni CTA.

### Résultat
- Aucun tool chip / logo dans la section Budget.
- Le CTA "Auditer ma stack" / "Audit my stack" est retiré de cette section.
- Titre dynamique construit depuis `stack.monthlyBudget` avec fallback.
- Bande de seuils : Testing (0–15€) / Livrer régulièrement (valeur dynamique, highlighted) / Auditer (80–100€).
- 3 principes : À payer / À garder gratuit / À auditer — texte uniquement.
- Note éditoriale courte, 13px muted.
- Variables inutilisées `budgetPaidTools`, `budgetFreeTools`, `budgetDriverTools`, `budgetWatchLabel` supprimées.

---

## 2026-05-18 — Sprint 57 : Simplify workflow tool item containers

### Objectif
Alléger les tool items dans les workflow family cards : un seul conteneur logo (56×56px), plus de double border/ring autour des logos, nom à 17px/650, pas de badge statut sous le nom (les group tags portent le sens).

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — `ToolLogo` size prop : 26 → 34 dans les trois groupes (core, secondary, extension).
- `src/index.css` — sprint block mis à jour : `.sd-tool-item` flex + gap 14px, `.sd-tool-logo` 56×56px radius 16px border #DADAD4, `.sd-tool-logo img` strip ring/bg/padding de ToolLogo, `.sd-tool-name` 17px/650, `.sd-tool-grid` auto-fit minmax(210px,1fr), mobile 48px logo / 28px image.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern tool item.

### Avant → après
- **Niveaux de nesting logo :** 2 (`.sd-tool-logo` shell 44px + `ToolLogo <img>` avec ring-1/bg-card/padding propres) → 1 (`.sd-tool-logo` seul shell 56px, img sans décoration propre)
- **Supprimé du JSX :** aucun (status badge déjà absent depuis sprint précédent)
- **Taille logo :** 44px → 56px (shell), 26px → 34px (image), mobile 40px → 48px / 22px → 28px
- **Nom outil :** 15px/600 → 17px/650, max-width 160 → 180px
- **Grid :** minmax(180px) → minmax(210px), gap 14/24 → 18/28

### Résultat
- Logos bien visibles, un seul border, pas de double ring
- Group tags (Socle recommandé / Selon ton usage / Extensions) toujours visibles
- 0 erreurs build, 0 erreurs lint

---

## 2026-05-18 — Sprint 56 : Hero fact sheet typography scale

### Objectif
Harmoniser l'échelle typographique de la table signalétique hero : valeurs métriques (Budget, Outils, Niveau) en grand/gras distinct des valeurs descriptives (Profil, Workflow, Point d'attention) en semi-gras lisible. Budget divisé en montant principal (`118€`, 24–32px, 700) + unité (`/mois`, 14px, muted).

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — refactoring du helper `splitBudget()` (propriétés `main`/`unit`), JSX mis à jour avec `sd-budget-composition` + `sd-budget-main` + `sd-budget-unit`.
- `src/index.css` — nouveau bloc sprint final : `min-width: 0` sur toutes les cellules, deux familles CSS (`sd-fact-col--compact` / `sd-fact-col--long`), composition budget en `inline-flex` baseline.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de l'échelle typographique.

### Échelle typographique
- **Métrique** (`sd-fact-col--compact`): `clamp(1.5rem, 2vw, 2rem)` — 24–32px, font-weight 700, letter-spacing -0.045em, white-space nowrap
- **Descriptif** (`sd-fact-col--long`): `clamp(1.0625rem, 1.1vw, 1.25rem)` — 17–20px, font-weight 600, letter-spacing -0.025em, overflow-wrap anywhere
- **Budget main** (`sd-budget-main`): clamp 24–32px, 700, -0.05em
- **Budget unit** (`sd-budget-unit`): 14px, 500, #6F6F68

### Breakpoints responsive
- ≥1280px : 6 colonnes pondérées (minmax robustes)
- 1025–1279px : 3×2
- ≤1024px : 2 colonnes, border-radius 14px
- ≤420px : 1 colonne, border-radius 12px

### Résultat
- "118€" s'affiche grand et gras, "/mois" en petit et muted — jamais coupé
- Colonnes descriptives lisibles à toutes largeurs sans overflow
- Grille protégée par `min-width: 0` sur chaque cellule

---

## 2026-05-18 — Sprint 55 : Hero fact sheet overflow fix

### Objectif
Corriger les dépassements de contenu dans la table signalétique du hero : la valeur "118€/mois" dans la colonne BUDGET était coupée. Toutes les largeurs de colonnes ont été rendues robustes face à la longueur réelle du contenu, et la typographie a été différenciée entre colonnes compactes (Budget/Outils/Niveau) et colonnes longues (Profil/Workflow/Point d'attention).

### Correctif critique
`min-width: 0` sur les enfants de la grille CSS est indispensable : sans cette propriété, un contenu plus large que l'espace alloué force la colonne à s'élargir, ce qui provoque le blowout de la grille.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout du helper `splitBudget()`, rendu conditionnel de la valeur budget avec `sd-budget-amount` (grand) + `sd-budget-unit` (petit).
- `src/index.css` — nouveau bloc sprint avec `grid-template-columns` pondérées (minmax robustes par colonne), `min-width: 0` sur `.sd-fact-col`, typographie compacte/longue différenciée, responsive 6→3 colonnes à 1279px, 2 colonnes à 1024px.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du correctif.

### Budget : affichage montant/unité séparé
Le budget "118€/mois" est maintenant rendu en deux spans : `sd-budget-amount` (valeur, clamp 22–30px, 700) + `sd-budget-unit` ("/mois", 13px, #6F6F68). Plus premium, moins de risque de dépassement.

### Breakpoints responsive
- ≥1280px : 6 colonnes pondérées
- 1025px–1279px : 3 colonnes (3×2)
- 769px–1024px : 2 colonnes
- ≤768px : 2 colonnes, border-radius 12px
- ≤420px : 1 colonne

### Résultat
- "118€/mois" et "420€/mois" ne sont plus coupés à aucune largeur.
- La grille ne blowout plus grâce à `min-width: 0`.
- Le budget passe en 3 colonnes à 1279px, ce qui donne à chaque cellule ≈1/3 du conteneur.

---

## 2026-05-18 — Sprint 54 : Workflow card UX hierarchy

### Objectif
Raffiner la hiérarchie visuelle et typographique des cartes « Carte de la stack » : retravailler la colonne gauche, remplacer les étiquettes de groupe par des pill tags, agrandir les logos, supprimer les compteurs flottants et simplifier les items d'outil.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout des classes `sd-stack-card-title`, `sd-stack-card-role`, `sd-stack-card-micro` dans la colonne gauche ; remplacement de `sd-tool-group-label` par `sd-group-tag` ; outils passent de `sd-tool-pill` (Link pill) à `sd-tool-item` (Link avec `sd-tool-logo` + `sd-tool-name`) ; micro-info visible avant le bouton expand quand des outils sont masqués ; suppression du bloc `sd-tools-total` dans la colonne droite.
- `src/index.css` — nouveau bloc Sprint 54 : `sd-stack-card-title` (clamp 26–32px, bold, tight tracking), `sd-stack-card-role` (17px, muted), `sd-stack-card-decision` (15px, 500, dark — override du sprint précédent), `sd-stack-card-micro` (12px, muted), `sd-group-tag` (pill transparent, border, 10px caps), `sd-tool-item` / `sd-tool-logo` (44px, radius 12, white bg) / `sd-tool-name` (15px, 600), `sd-tool-grid` en CSS grid `auto-fill minmax(180px)`, `sd-tools-total` masqué, mobile responsive.

### Résultat
- Colonne gauche : titre éditorial > description > phrase de recommandation > micro-info > bouton expand.
- Plus de compteur flottant "X outils affichés" ni de total au bas de la colonne droite.
- Logos 44px dans un conteneur rond, bien lisibles.
- Pill tags slim pour identifier les trois groupes (Socle recommandé · Selon ton usage · Extensions).
- Items d'outil simplifiés : logo + nom uniquement, sans badge de statut.

---

## 2026-05-18 — Sprint 53 : Workflow cards grouped by recommendation level

### Objectif
Remplacer la liste plate d'outils avec badge de statut par-outil dans les cartes de la stack map. Chaque carte affiche désormais trois groupes — Socle recommandé / Selon ton usage / Extensions — pour que le lecteur comprenne immédiatement quoi adopter, quoi activer selon son usage et quoi éviter par réflexe.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout de `getToolGroup()`, `groupToolsByRecommendation()`, `getWorkflowDecisionCopy()` ; remplacement du rendu de la liste plate par la structure groupée ; suppression de `.sd-tools-count-indicator` (résumé de comptage en haut) ; ajout du total discret en bas `.sd-tools-total` ; logique d'expansion progressive (socle + 3 secondaires visibles, reste sur expand).
- `src/index.css` — ajout du bloc sprint avec `.sd-stack-card-decision`, `.sd-tool-group`, `.sd-tool-group-label`, `.sd-tool-grid`, `.sd-tool-pill`, `.sd-tools-total`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du nouveau pattern.

### Résultat
- Les outils sont groupés visuellement par niveau de recommandation dans chaque card.
- Les badges de statut par outil (`Socle`, `Selon usage`, `Extension`) sont supprimés des cartes workflow : le groupe-label porte l'information.
- Un micro-texte éditorial (`sd-stack-card-decision`) sous la phrase de rôle résume la logique de choix pour cette étape.
- L'indicateur "6 sur 9 outils affichés" en haut de grille est supprimé ; remplacé par "9 outils dans cette étape" discret en bas.
- Bouton d'expansion uniquement quand des groupes sont masqués (secondaires > 3 ou extensions présentes).
- 0 erreur de build, 0 erreur lint.

---

## 2026-05-18 — Sprint 52 : Hero fact sheet refinement

### Objectif
Affiner la table signalétique du hero des fiches stack : réordonner les colonnes, pondérer la grille, hiérarchiser la typographie entre colonnes courtes (chiffres) et longues (texte), renommer RISQUE en POINT D'ATTENTION et mettre à jour les copies éditoriales par slug.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — nouvelle ordre des repères (PROFIL · BUDGET · OUTILS · NIVEAU · WORKFLOW · POINT D'ATTENTION), labels compact/long mis à jour pour inclure `POINT D'ATTENTION` et `KEY RISK`, copies éditoriales mises à jour pour 6 slugs (designer-freelance-solo, consultant-b2b-propre, developpeur-freelance-shipper, createur-sites-ia-automation, architecte-interieur), ajout du slug agence-marketing.
- `src/index.css` — nouveau bloc sprint : grille pondérée 6 colonnes, breakpoints responsive (1199px, 900px, 420px), typographie `.sd-fact-col--compact` (20–26px / 700) et `.sd-fact-col--long` (15–18px / 600), labels `10px/600 #555550`, `.sd-hero-promise max-width 860px`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de l'ordre des colonnes, du renommage RISQUE → POINT D'ATTENTION, de la hiérarchie typographique.

### Résultat
- Ordre des colonnes : PROFIL · BUDGET · OUTILS · NIVEAU · WORKFLOW · POINT D'ATTENTION.
- Budget, Outils, Niveau : colonnes étroites, valeurs 20–26px / gras 700 — les chiffres sautent aux yeux.
- Profil, Workflow, Point d'attention : colonnes larges, valeurs 15–18px / semi-bold 600 — le texte reste lisible sans débordement.
- "RISQUE" disparu de toutes les tables ; remplacé par "POINT D'ATTENTION" (FR) / "KEY RISK" (EN).
- Slug agence-marketing couvert par un bloc éditorial dédié.
- Aucun scroll horizontal sur aucun breakpoint.

---

## 2026-05-18 — Sprint 51 : Workflow card UX improvements

### Objectif
Améliorer la lisibilité des cartes "Carte de la stack" (section Outils) sans toucher au héros ni aux autres sections. Quatre problèmes résolus : étiquette "À challenger" anxiogène → "Extension", badge "À surveiller" supprimé, résumé technique remplacé par un résumé lisible, bouton d'expansion trop discret remplacé par un vrai bouton secondaire avec bordure, et ajout d'un indicateur de compte visible.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout des fonctions `getWorkflowStatusLabel()` et `buildWorkflowStatusSummary()` ; remplacement du rendu dans la section workflow cards : suppression du badge `.sd-stack-map-watch`, remplacement du résumé technique par `buildWorkflowStatusSummary()`, remplacement du bouton `.sd-stack-map-toggle` par `.sd-expand-btn`, ajout du wrapper `.sd-stack-map-tools-wrapper` avec indicateur `.sd-tools-count-indicator`, remplacement de `getToolDecisionDisplay()` par `getWorkflowStatusLabel()` pour les labels outils.
- `src/index.css` — bloc sprint appended : `.sd-stack-map-tools-wrapper`, `.sd-tools-count-indicator`, `.sd-expand-btn` (hover, focus-visible), responsive mobile.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — mise à jour des spécifications des cartes workflow.

### Décisions d'implémentation
- `getWorkflowStatusLabel()` utilisé UNIQUEMENT dans les workflow cards — les autres sections (Risques, Budget, hero) gardent leurs labels existants.
- Le modèle de données (`decision: "core" | "conditional" | "challenge"`) est inchangé.
- `buildWorkflowStatusSummary()` utilise `getToolDecisionStatus()` comme fallback pour les items sans `slot.decision` explicite.
- L'indicateur de compte est toujours affiché (même quand tous les outils sont visibles), avec libellé adapté.
- Le bouton expand est masqué quand `hiddenCount === 0` (grâce au `isExpandable` guard existant).
- Le badge "À surveiller" (`shouldWatchFamily`, `.sd-stack-map-watch`) est entièrement supprimé du JSX des workflow cards. La logique `shouldShowWorkflowWatch()` et le CSS existant sont conservés pour éviter des régressions.

### Nouvelles étiquettes de statut (workflow cards uniquement)
| Clé interne | FR | EN |
|---|---|---|
| `core` | Socle | Core |
| `conditional` | Selon usage | As needed |
| `challenge` | Extension | Extension |

### Résultat
- Aucun "À challenger" visible dans les cartes workflow.
- Aucun badge "À surveiller" visible dans les cartes workflow.
- Résumé lisible : "Socle : 2 · Selon usage : 4 · Extensions : 3".
- Indicateur de compte : "6 sur 9 outils affichés" / "9 outils affichés".
- Bouton expand visible, avec bordure `#DADAD4`, hover noir.
- Build : 0 erreurs. Lint : 0 erreurs (156 warnings pre-existants inchangés).

---

## 2026-05-18 — Sprint 50 : Balanced hero fact-sheet columns

### Objectif
Remplacer la grille uniforme `repeat(6, 1fr)` de la table signalétique par une grille pondérée : colonnes BUDGET/OUTILS/NIVEAU compactes, colonnes PROFIL/WORKFLOW/RISQUE moyennes à larges. Raccourcir les valeurs dynamiques pour qu'aucune cellule ne devienne un paragraphe.

### Fichiers modifiés
- `src/index.css` — bloc sprint appended : grille pondérée `.sd-hero-fact-table` (1.5fr workflow, 0.4fr outils…), padding `.sd-fact-col` réduit à 22px 24px, modificateur `.sd-fact-col--compact` (valeur 20–24px), modificateur `.sd-fact-col--long` (valeur 15–17px / line-height 1.3), breakpoints 900–1199px → 3 col, ≤900px → 2 col, ≤420px → 1 col.
- `src/pages/StackDetailPage.tsx` — rendu de la table via `.map()` : ajout dynamique des classes `sd-fact-col--compact` (BUDGET, OUTILS, NIVEAU, TOOLS, LEVEL) et `sd-fact-col--long` (PROFIL, WORKFLOW, RISQUE, PROFILE, RISK) ; ajout du helper `truncate(s, max=40)` ; application de `truncate()` aux valeurs PROFIL, WORKFLOW, RISQUE du fallback dynamique.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — mise à jour des spécifications de la table signalétique : grille pondérée, modificateurs compact/long, règle éditoriale max 8 mots, responsive révisé.

### Décisions d'implémentation
- Pas de nouvelles classes sur les stacks éditoriaux dédiés (les valeurs sont déjà courtes) — les classes sont ajoutées dynamiquement sur `repere.label` dans le `.map()`.
- Le fallback dynamique reste intact fonctionnellement ; seule la troncature à 40 chars est ajoutée.
- Les breakpoints remplacent les anciens 1024/640/390 dans le bloc sprint — la cascade CSS garantit que les overrides sprint s'appliquent en dernier.

### Résultat
- Desktop ≥1200px : WORKFLOW 50% plus large que OUTILS, table moins haute.
- 900–1199px : 3 colonnes par rangée.
- ≤900px : 2 colonnes. ≤420px : 1 colonne.
- Build : 0 erreurs. Lint : 0 erreurs (156 warnings pre-existants inchangés).

---

## 2026-05-18 — Sprint 49 : Premium sticky bottom section nav (StackStickyNav)

### Objectif
Ajouter une navigation flottante premium en bas d'écran sur les fiches stack detail (desktop uniquement), remplaçant la subnav inline sur desktop. La subnav inline reste visible sur mobile. Inspiration Awwwards : dark capsule centré, logo à gauche, items au centre, item actif avec bordure outline visible.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout du composant `StackStickyNav` (inline, avant le composant principal), import `useRef`, états `sentinelRef` et `isStickyVisible`, sentinel `<div>` à la fin de la section hero, wrapper `.sd-subnav-wrapper` autour de la subnav inline, rendu de `<StackStickyNav>` en bas du JSX principal.
- `src/index.css` — bloc sprint appended : `.stack-sticky-nav`, `.stack-sticky-nav--hidden`, `.stack-sticky-nav-logo`, `.stack-sticky-nav-items`, `.stack-sticky-nav-item`, `.stack-sticky-nav-item--active`, masquage `.sd-subnav-wrapper` sur desktop (≥768px), masquage `.stack-sticky-nav` sur mobile (≤767px), `scroll-margin-top: 80px` sur sections.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — documentation du composant `StackStickyNav`.

### Architecture du composant
- `StackStickyNav` : composant fonctionnel inline dans `StackDetailPage.tsx`, reçoit `sections`, `activeId`, `prefix`, `visible`.
- Visibilité contrôlée par `IntersectionObserver` sur un sentinel `<div>` placé à la fin de la `<section>` hero. Quand le sentinel sort du viewport, `isStickyVisible` passe à `true`.
- Active state : partagé avec l'état `activeSection` existant (scrollspy déjà en place).
- Click : `scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- Animation : `opacity` + `translateY` 220ms ease. `prefers-reduced-motion` → transition 0ms.

### Décisions d'implémentation
- Pas de nouveau fichier : composant inline dans `StackDetailPage.tsx`.
- La subnav inline existante (`sd-nav`) est conservée intacte pour mobile — seul son wrapper `.sd-subnav-wrapper` est masqué sur desktop via CSS.
- `aria-label` sur le `<nav>`, `aria-current="page"` sur l'item actif, focus ring visible.

### Résultat
- Desktop ≥768px : capsule flottante sombre en bas, subnav inline masquée.
- Mobile <768px : subnav inline visible, capsule masquée.
- Build : 0 erreurs. Lint : 0 erreurs (warnings pre-existants inchangés).

---

## 2026-05-18 — Sprint 48 : Hero premium fact sheet — no CTA, bigger typography, generous spacing

### Objectif
Finaliser le hero des fiches stack en bloc éditorial premium : supprimer le CTA "Analyser ma stack" du hero, agrandir la typographie (H1 plus grande, valeurs de table plus lisibles), aérer les paddings, garder la non-redondance absolue.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — suppression du `<Link>` CTA dans la zone hero (`.sd-hero-editorial`).
- `src/index.css` — bloc sprint appended : overrides `.sd-hero-editorial` (padding 96px), `.sd-hero-h1` (weight 700, clamp plus large), `.sd-hero-desc` (color #3A3A38), `.sd-hero-eyebrow` (margin-bottom 20px), `.sd-hero-fact-table` (margin-top 56px, margin-bottom 72px), `.sd-fact-col` (padding 24px), `.sd-fact-value` (clamp ~15–19px). Mobile 390px → 2 colonnes (pas 1).
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — règle mise à jour : Zéro CTA dans le hero, non-redondance absolue explicitée, typographie et paddings cibles documentés.

### Résultat
- Hero : breadcrumb → eyebrow → H1 → promesse → table signalétique. Rien d'autre.
- CTA supprimé du hero. Il reste dans `sd-cta-band` après les sections.
- H1 : weight 700, clamp(3.25rem, 5.5vw, 4.5rem), letter-spacing -0.065em.
- Valeurs de la table : clamp(0.9375rem, 1.3vw, 1.1875rem), lisibles sans zoom.
- Mobile 390px : table reste en 2 colonnes (pas de scroll horizontal, pas de colonne unique).
- Build : 0 erreurs. Lint : 0 erreurs (warnings pre-existants inchangés).

---

## 2026-05-18 — Stack detail : hero premium fact sheet (table signalétique, zéro panneau droit)

### Objectif
Transformer le hero des fiches stack en un bloc éditorial propre suivi d'une table signalétique horizontale à 6 colonnes. Suppression du panneau droit (budget + watchout = doublons). Chaque information n'apparaît qu'une seule fois.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — nouveau layout héro (`.sd-hero-editorial` + `.sd-hero-fact-table`), labels repères renommés (PROFIL/WORKFLOW/BUDGET/OUTILS/NIVEAU/RISQUE), suppression du panneau `.sd-snapshot`, données éditoriales ajoutées pour `consultant-b2b-propre`, alias de slug `consultant-b2b` → `consultant-b2b-propre`, nettoyage des variables inutilisées (budgetDisplay, watchText, logoPills, logoOverflow).
- `src/index.css` — nouveau bloc sprint avec classes `.sd-hero-editorial`, `.sd-hero-fact-table`, `.sd-fact-col`, `.sd-fact-label`, `.sd-fact-value`. Responsive 6→3→2→1 colonnes.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — règle hero mise à jour.

### Détails
- Suppression de `.sd-reperes-grid` (grille 2×3 administrative) et du panneau `.sd-snapshot` (budget + watchout + logos).
- Remplacement par `.sd-hero-fact-table` : une seule rangée horizontale de 6 colonnes — PROFIL · WORKFLOW · BUDGET · OUTILS · NIVEAU · RISQUE.
- Contenu éditorial spécifique pour 5 stacks : `consultant-b2b-propre`, `designer-freelance-solo`, `developpeur-freelance-shipper`, `createur-sites-ia-automation`, `architecte-interieur`.
- Fallback dynamique pour toutes les autres stacks via `buildFallbackEditorial`.
- Slug alias : `/fr/stacks/consultant-b2b` résolu vers `consultant-b2b-propre`.
- Table style : fond `#FAFAF7`, bordure `#DADAD4`, radius 16px, labels 10px uppercase, valeurs 14px/600.

---

## 2026-05-18 — Stack detail : hero decision dashboard (repères compact + panel simplifié)

### Objectif
Simplifier le hero des fiches stack en un "decision dashboard" lisible en 5 secondes. Remplacement des 3 grandes cartes (POUR QUI / CE QUE ÇA COUVRE / À ÉVITER SI) par une grille compacte de 6 repères. Simplification du panel droit pour éviter les doublons.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — nouveau composant repères, `getHeroDecisionMap` retourne `reperes` + `socleSlugs`, panel droit allégé, helper `getSocleTools`, nettoyage imports inutilisés.
- `src/index.css` — nouveau bloc sprint avec classes `.sd-reperes-grid`, `.sd-repere-item`, `.sd-repere-label`, `.sd-repere-value`.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — règle hero decision dashboard mise à jour.

### Détails
- Les 3 cartes `stack-fit-card--hero` (POUR QUI / CE QUE ÇA COUVRE / À ÉVITER SI) sont supprimées du hero.
- Remplacement par `.sd-reperes-grid` : grille 3×2 de data points (Pour qui · Workflow · Budget · Outils · Niveau · À surveiller).
- Contenus spécifiques pour 4 stacks : `designer-freelance-solo`, `developpeur-freelance-shipper`, `sites-ia-automation`, `architecte-interieur`. Fallback dynamique pour les autres.
- Panel droit : suppression de la grille facts (Profil/Outils/Niveau/Complexité) — ces infos sont maintenant dans les repères. Seuls Budget cible + Socle (logos) + À surveiller restent.
- Helper `getSocleTools` : utilise `socleSlugs` éditoriales si définies, sinon remonte les outils Socle de la stack.
- `getHeroDecisionMap` refactorisé pour retourner un type `HeroDecisionMap` avec `reperes[]` et `socleSlugs[]`.
- Imports inutilisés supprimés : `getStackDerivedFields`, `getStackObjectives`.

---

## 2026-05-17 — Stack detail : système éditorial, logos et lignes pointillées

### Objectif
Renforcer le langage UI des fiches stack avec des marqueurs ToolTrim plus reconnaissables : séparateurs pointillés, chips d'usage, matrice de décision avec logos et lignes outils plus éditoriales.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — chips d'usage, matrice décisionnelle avec logos/fallbacks, colonne décision dédiée dans les lignes outils.
- `src/index.css` — utilitaire pointillé, chips larges, matrice éditoriale, colonne décision et rythme responsive.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — marqueurs réutilisables pour fiches stack.

### Détails
- Ajout des usages clés dans l'overview pour `architecte-interieur` et `developpeur-freelance-shipper`.
- Remplacement des quatre cartes décision par des lignes éditoriales avec logos ou fallback textuel.
- Ajout d'une colonne décision dédiée dans la liste d'outils, avec séparateurs pointillés.
- Affinage du résumé hero avec séparateurs pointillés internes.

---

## 2026-05-17 — Stack detail : outils recommandés en liste de décision

### Objectif
Transformer la section “Outils recommandés” des fiches stack en liste de décisions plus lisible, notamment pour les longues stacks comme architecte d'intérieur.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — titre, sous-texte, légende en chips, headers de catégories et lignes d'outils nettoyées.
- `src/index.css` — nouveau layout compact pour les lignes d'outils, catégories et états responsive.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — pattern de liste outils pour les fiches stack.

### Détails
- Remplacement des points couleur par des chips textuelles “Essentiel”, “Conditionnel”, “À challenger”.
- Suppression des libellés répétés “Rôle” et “Pourquoi” dans chaque ligne.
- Catégories structurées avec nom, compteur et séparateur net.
- Lignes organisées autour de l'identité outil, la raison, le prix et l'action.

---

## 2026-05-17 — Stack detail : vue d'ensemble architecte d'intérieur

### Objectif
Rendre la section “Vue d'ensemble” plus lisible sur les fiches stack, avec un titre éditorial court, des cartes de lecture et une note ToolTrim plus légère.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — titre, intro et cartes spécifiques pour la stack architecte d'intérieur ; note ToolTrim restructurée.
- `src/index.css` — affinage typographique et card-based layout pour la section overview et la note.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — règle de pattern pour les sections “Vue d'ensemble” des fiches stack.

### Détails
- Remplacement du H2 audience trop long par “Une chaîne claire, du brief au chantier.” pour `/fr/stacks/architecte-interieur`.
- Passage de “Elle sert à / Elle évite / Elle n'est pas faite pour” en cartes blanches avec bordures fines.
- Note ToolTrim allégée avec une ligne principale, une astuce de dossier projet et un point “À challenger”.

---

## 2026-05-16 — Sprint 6 : Ticker Awwwards — typographie pure, animation lente

### Objectif
Transformer la barre ticker en signature éditoriale fine et rythmée, style Awwwards.
Supprimer les logos. Textes courts. Séparateur sobre. Animation lente.

### Fichiers modifiés
- `src/components/home/TickerBar.tsx` — réécriture complète (sans logos)
- `src/index.css` — override hp-ticker height 40px + nouvelles classes hpt-*
- `tailwind.config.ts` — durée animation 28s → 45s
- `docs/CHANGELOG_AI.md` — ce fichier

### TickerBar.tsx

**Modèle de données simplifié :**
```ts
interface TickerItem {
  tools: string;       // nom(s) propres, identiques FR/EN
  decisionFr: string;  // décision courte en français
  decisionEn: string;  // décision courte en anglais
}
```

**9 items :** Notion+Trello / Slack Pro / Zoom+Teams / Zapier / HubSpot / Figma+Sketch / Loom / Harvest / Coda+Notion

**Structure d'un item rendu :**
```
<span class="hpt-item-group">
  <span class="hpt-tools">Notion + Trello</span>      ← 400 / #6F6F68
  <span class="hpt-decision">Doublon possible</span>  ← 600 / #222222
  <span class="hpt-sep">◌</span>                     ← opacity 0.35
</span>
```

**Pas de `useState`, pas de logos, pas d'imports inutiles.** `aria-hidden="true"` (décoratif).

### CSS — classes Sprint 6

**`.hp-ticker` :** `height:40px` (était 44px), `display:flex; align-items:center`

**`.hpt-track` :** `display:inline-flex; align-items:center; white-space:nowrap; height:40px`

**`.hpt-item-group` :** `display:inline-flex; align-items:center; gap:10px`

**`.hpt-tools` :** `font-size:14px; font-weight:400; color:#6F6F68`

**`.hpt-decision` :** `font-size:14px; font-weight:600; color:#222222`

**`.hpt-sep` :** `font-size:14px; color:#222222; opacity:0.35; margin:0 22px`

**`prefers-reduced-motion` :** `animation: none !important` sur `.animate-ticker`

### tailwind.config.ts

`ticker: "ticker 45s linear infinite"` (était 28s)

---

## 2026-05-16 — Sprint 5 : Ticker logos · Titre section · Design tokens espacement

### Objectif
Rendre le ticker visuellement concret (logos d'outils), introduire les 3 cards avec un vrai titre éditorial, et ancrer tous les espacements dans des tokens de design system.

### Fichiers modifiés
- `src/components/home/TickerBar.tsx` — réécriture complète avec logos
- `src/pages/HomePage.tsx` — `EntryCardsSection` : ajout header éditorial + renommage classes
- `src/index.css` — tokens `--space-*`, classes `hpt-*` (ticker), classes `home-actions-*`
- `docs/CHANGELOG_AI.md` — ce fichier

### TickerBar.tsx — réécriture avec logos

**Structure item :**
```
[logo] Outil A  +  [logo] Outil B  →  Décision
```

**Nouveau data model :**
```ts
interface TickerItem {
  tools: Array<{ name: string; domain: string }>;
  decisionFr: string;
  decisionEn: string;
}
```

**Composant `TickerLogo` :** favicon CDN (`t3.gstatic.com/faviconV2`) + lettre initiale en fallback via `useState`.

**8 items :** Notion+Coda / Slack / Zoom+Teams / HubSpot / Zapier / Harvest+Pennylane / Figma+Sketch / Loom

**Nouvelles classes CSS `hpt-*` :**
- `.hpt-item` : `display:inline-flex; height:44px; padding:0 22px; border-right:1px solid #DADAD4`
- `.hpt-logo` : pill 24×24px, border #DADAD4, bg white
- `.hpt-logo img` : max 15×15px
- `.hpt-name` : 13px #6F6F68
- `.hpt-plus` : 11px #9A9A92
- `.hpt-arrow` : 13px #9A9A92
- `.hpt-decision` : 13px 600 #222222

**`.hp-ticker` override :** `height:44px; max-height:none`

### HomePage.tsx — EntryCardsSection

**Section wrapper :** `hac-section` → `home-actions-section`
**Grid :** `hac-grid` → `home-actions-grid`

**Header éditorial ajouté au-dessus de la grille :**
- Eyebrow : "TROIS FAÇONS DE DÉCIDER"
- Titre : "Commence par la bonne question." — `clamp(2.25rem, 4vw, 3.5rem)` / `ls -0.05em`
- Description : 17px / `max-width: 680px`

### index.css — tokens et classes

**Tokens d'espacement** ajoutés dans `:root` (remplace le commentaire placeholder) :
```css
--space-2xs: 4px;   --space-xs: 8px;    --space-sm: 12px;
--space-md: 16px;   --space-lg: 24px;   --space-xl: 32px;
--space-2xl: 48px;  --space-3xl: 64px;  --space-4xl: 96px;
```

**`.home-actions-section` :** `padding: var(--space-3xl) 0 72px` (mobile: `var(--space-2xl) 0 56px`)
**`.home-actions-header` :** `max-width:760px; margin-bottom: var(--space-2xl)`
**`.home-actions-grid` :** 3 colonnes, gap 16px (mobile: 1 colonne, gap 14px)

---

## 2026-05-16 — Sprint 4d — HomeActionCards (contours noirs, header tableau, logos, scénario)

### Objectif
Remplacer les colonnes textuelles par 3 vraies cards avec contour noir, header interne façon tableau, logos d'outils dans pills, scénario concret, capsule verdict, CTA.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — `EntryCardsSection` réécrite + `HacLogo` component
- `src/index.css` — bloc `hac-*` (~130 lignes)

### Détails
- `hac-card` : `border:1.5px solid #222222; border-radius:12px`
- `hac-header` : grid 2 colonnes (label / numéro), `border-bottom:1.5px solid #222222`
- `hac-logo` : pill 30×30px, bg white, `border:1px solid #DADAD4`
- `hac-capsule` : pill 26px, `border:1px solid #222222`
- Mobile : 1 colonne, gap 14px

---

## 2026-05-16 — Sprint Home : Identité et vie (Hero 2-col + modules produit)

### Objectif
Rendre la home plus vivante, concrète et produit-focused. Montrer le geste ToolTrim dès le hero : auditer, trier, garder, couper, remplacer. Ajouter des modules visuels qui donnent une identité produit immédiate.

### Fichiers modifiés
- `src/components/home/HeroSection.tsx` — réécriture complète (2-col + StackAuditPreview)
- `src/pages/HomePage.tsx` — enrichissement de 3 sections + 2 nouvelles sections
- `src/index.css` — ajout classes `hp-*` Sprint 4 (~350 lignes)
- `docs/CHANGELOG_AI.md` — ce fichier

### HeroSection.tsx — réécriture 2-colonnes

**Supprimé :**
- `eh-root--centered` (hero centré, colonne unique)
- `justifyContent: center` sur tous les éléments

**Ajouté :**
- Layout `hp-hero-2col` : `1fr 420px` sur desktop, colonne unique sous 1100px
- `hp-hero-left` : eyebrow + H1 alignés à gauche + description + CTAs
- `hp-hero-right` : `StackAuditPreview` inline component
- **`AuditToolLogo`** : favicon CDN (`t3.gstatic.com/faviconV2`) + lettre fallback via `useState`
- **`AuditBadge`** : 4 variants CSS (`--keep` vert / `--challenge` ambre / `--duplicate` rouge / `--soon` gris)
- **`StackAuditPreview`** : 5 outils (Notion/Canva/Loom/Trello/Zapier), header budget actuel 85€, footer budget cible 48€ + saving −37€/mois, hover "Pourquoi?" reveal (CSS pur, no JS), mini-CTA "Auditer ma vraie stack", disclaimer italique

### HomePage.tsx — enrichissements et nouvelles sections

**EntryCardsSection enrichie :**
- Ajout `exampleFr`/`exampleEn` par carte (italic sous la description)
- CTA spécifique par carte : "Lancer l'audit" / "Voir les stacks" / "Comparer maintenant" (au lieu de "Commencer" générique)

**ManifestoSection enrichie :**
- Ajout bloc `hp-decisions` après les 3 paragraphes
- 3 lignes : Garder / Couper / Remplacer — chacune avec clé uppercase + description en gras ciblé

**WhatWeCutSection réécrite (liste → decision rows) :**
- Passage de `hp-cuts-item` (dash + texte) → `hp-cut-row` (point + titre + exemple italique)
- Chaque item a maintenant un exemple concret (ex : "Loom ouvert 2 fois ce mois. Slack video suffit.")

**AvantAprèsSection — NOUVELLE :**
- Heading : "9 outils, 123 €/mois → 5 outils, 48 €/mois."
- 2 panels côte à côte (`hp-aa-panel` / `hp-aa-panel--after`)
- Panel Avant : header cream, 9 outils listés avec prix
- Panel Après : header noir, items kept (vert) vs cut (barré gris) avec label doublon/dormant/trop tôt
- Saving summary : "−75 € / soit −900 €/an"
- CTA : "Calculer mon économie →"

**MethodeSection — NOUVELLE :**
- Heading : "3 étapes. Pas de jargon." + CTA inline "Commencer l'audit"
- Grille 3 colonnes (`hp-methode-grid`) : 01 usage / 02 doublons / 03 décision
- Chaque step : grand numéro décoratif (couleur cream), titre, description, exemple en box italique

**Ordre des sections mis à jour :**
1. Hero → 2. TickerBar → 3. EntryCards → 4. Manifesto → 5. WhatWeCut → **6. AvantAprès (NOUVEAU)** → **7. Méthode (NOUVEAU)** → 8. BusinessObjectives → 9-16. sections existantes

### index.css — nouvelles classes Sprint 4 (`@layer components`)

| Famille | Classes |
|---------|---------|
| Hero 2-col | `hp-hero-2col`, `hp-hero-left`, `hp-hero-right` |
| Audit preview | `hp-audit`, `hp-audit-header`, `hp-audit-row`, `hp-audit-logo`, `hp-audit-badge` (4 variants), `hp-audit-price`, `hp-audit-why`, `hp-audit-footer`, `hp-audit-mini-cta`, `hp-audit-disclaimer` |
| Entry enriched | `hp-entry-example`, `hp-entry-example-label` |
| Decisions | `hp-decisions`, `hp-decision`, `hp-decision-key`, `hp-decision-desc` |
| Cut rows | `hp-cut-rows`, `hp-cut-row`, `hp-cut-row-header`, `hp-cut-row-indicator`, `hp-cut-row-title`, `hp-cut-row-example` |
| Avant/Après | `hp-aa`, `hp-aa-inner`, `hp-aa-panel`, `hp-aa-panel--after`, `hp-aa-panel-header`, `hp-aa-list`, `hp-aa-item`, `hp-aa-item--kept`, `hp-aa-item--cut`, `hp-aa-saving` |
| Méthode | `hp-methode`, `hp-methode-grid`, `hp-methode-step`, `hp-methode-num`, `hp-methode-title`, `hp-methode-desc`, `hp-methode-example` |

### Décisions techniques

- `AuditToolLogo` : `useState(false)` pour détecter l'erreur de chargement favicon → fallback lettre
- Hover "Pourquoi?" : `opacity: 0` → `opacity: 1` sur `.hp-audit-row:hover .hp-audit-why` (pur CSS, 0 JS)
- Badges colorés (vert/ambre/rouge/gris) : seul usage de couleur fonctionnelle sur la home, justifié par la valeur sémiologique (status = décision)
- Pas de gradient, pas de bleu, palette 100% dans le design system existant
- Breakpoint 1100px pour le hero (pas 900px) : la preview audit a besoin d'espace à 420px

---

## 2026-05-16 — Sprint Home : Repositionnement autour de l'audit de stack

### Objectif
Repositionner la home de ToolTrim : sortir du positionnement "comparateur SaaS / annuaire d'outils" pour affirmer le territoire "audit de stack pour freelances et solopreneurs". Le catalogue n'est plus le centre de la home. L'audit de stack devient le CTA principal.

### Fichiers modifiés
- `src/components/home/HeroSection.tsx` — réécriture complète
- `src/pages/HomePage.tsx` — restructuration + 3 nouvelles sections
- `src/index.css` — ajout classes `hp-*` (~130 lignes)
- `docs/CHANGELOG_AI.md` — ce fichier

### HeroSection.tsx — réécriture

**Supprimé :**
- Barre de recherche d'outils (input + chips = comportement annuaire)
- Grille de 12 outils "featured" (Figma, Notion, Slack...)
- Ligne de stat "X outils couverts · prix vérifiés · recommandations indépendantes"
- CTA "Explorer les outils" → /tools
- Import `Search`, `ToolLogo`, `useToolSummaries`, `useNavigate`

**Ajouté :**
- Eyebrow : "pour les freelances et solopreneurs"
- H1 : "Arrête d'empiler les outils. / Construis une stack qui travaille / vraiment pour toi."
- Sous-titre : "ToolTrim aide les freelances et solopreneurs à auditer leurs abonnements, repérer les doublons et choisir les outils qui valent vraiment le coût."
- CTA primaire : "Auditer ma stack →" → `/fr/selector` (noir, `eh-cta-primary` sans `--accent`)
- CTA secondaire : "Explorer les stacks types" → `/fr/stacks` (outline)

### HomePage.tsx — restructuration

**Nouvelle structure des sections :**
1. HeroSection (rewriten)
2. TickerBar (inchangé)
3. **EntryCardsSection** — NOUVELLE
4. **ManifestoSection** — NOUVELLE
5. **WhatWeCutSection** — NOUVELLE
6. BusinessObjectivesSection (titre mis à jour : "Des setups concrets, par métier.")
7. StatsSection (inchangé)
8. PersonasSection (inchangé)
9. HowItWorks (lazy, inchangé)
10. DiffTable (lazy, inchangé)
11. TestimonialsSection (lazy, inchangé)
12. Guides (inchangé)
13. FAQ (stats mises à jour : "< 3 min" + "100% indépendant")
14. FinalCTA (lazy, inchangé)

**Supprimé :**
- Section Categories (grille 4 colonnes de catégories = catalog pur)
- Import `getCategoryIcon`, `stripLeadingEmoji`

**SEO tags mis à jour :**
- Title FR : "ToolTrim — Audite ta stack, coupe ce qui ne sert pas"
- Description FR : centrée sur l'audit, pas sur le nombre d'outils
- JSON-LD `WebSite` : suppression `potentialAction SearchAction` (comportement annuaire)
- JSON-LD `Organization` : description mise à jour

### Nouvelles sections (composants inline)

**EntryCardsSection** — 3 chemins d'entrée
- Grille 3 colonnes desktop (`hp-entries-grid`), 1 colonne mobile (border-top séparateurs)
- 01 "Auditer ma stack" → /selector
- 02 "Trouver ma stack" → /stacks
- 03 "Comparer deux outils" → /comparatifs
- Chaque card : numéro en small caps + titre + description + lien "Commencer →"
- Hover : background #F8F8F4, gap sur la flèche

**ManifestoSection** — "Pas un annuaire de plus"
- Fond `#EDEDE8` (medium cream), border-top `#DADAD4`
- Layout 2 colonnes : heading gauche + 3 paragraphes droite
- Heading : "Pas un annuaire de plus."
- Copy : "ToolTrim ne cherche pas à lister tous les outils du marché. L'objectif est plus simple : t'aider à décider. / Quel outil garder. Quel outil couper. Quel outil remplacer. / Un bon outil doit avoir un rôle clair dans ta stack."
- Mobile : 1 colonne, gap 40px

**WhatWeCutSection** — "Ce que ToolTrim coupe"
- Fond blanc, border-top `#DADAD4`
- Layout 2 colonnes : heading gauche + liste + CTA droite
- Heading : "Tout ce qui alourdit ta stack sans raison."
- Liste 5 items avec dash `hp-cuts-item-dash` + border-bottom `#EDEDE8`
  1. Les doublons fonctionnels
  2. Les outils dormants
  3. Les abonnements trop tôt
  4. Les alternatives trop lourdes
  5. Les stacks qui coûtent plus qu'elles ne rapportent
- CTA "Auditer ma stack →" noir, 48px, radius 8px
- Mobile : 1 colonne, heading puis liste

### Classes CSS ajoutées (hp-* dans index.css)

```
hp-entries, hp-entries-grid, hp-entry, hp-entry + hp-entry
hp-entry-number, hp-entry-title, hp-entry-desc, hp-entry-link
hp-manifesto, hp-manifesto-inner, hp-manifesto-label
hp-manifesto-heading, hp-manifesto-body, hp-manifesto-para
hp-cuts, hp-cuts-inner, hp-cuts-heading, hp-cuts-label
hp-cuts-list, hp-cuts-item, hp-cuts-item-dash, hp-cuts-cta
```

Mobile breakpoints : `hp-entries-grid` → 1 colonne (< 768px), `hp-manifesto-inner` + `hp-cuts-inner` → 1 colonne (< 900px).

---

## 2026-05-15 — Sprint Stacks Facettes : sidebar de facettes /fr/stacks

### Sprint Stacks Facettes — sidebar combinatoire

**Fichiers modifiés** : `src/pages/StacksPage.tsx` (réécriture complète) + `src/index.css` (+280 lignes sk-*)

**Layout**
- `sk-listing-layout` : `grid-template-columns: 256px minmax(0, 1fr)` + gap 48px
- Sidebar sticky : `top: calc(var(--navbar-h, 68px) + 24px)` + `max-height: calc(100vh - navbar - 48px)` + `overflow-y: auto` (scrollable quand contenu > viewport)
- Mobile < 1024px : sidebar masquée, `sk-listing-layout` → 1 colonne

**Sidebar de facettes (desktop)**
- Header : eyebrow "AFFINER", titre 20px, description 14px #6F6F68
- 4 groupes de facettes : PROFIL / OBJECTIF / BUDGET / COMPLEXITÉ
- `sk-facet-group` : border-top + padding 20px 0
- `sk-facet-option` : button pleine largeur 34px, hover #EDEDE8, active #222222
- `sk-facet-count` : count à droite (opacity 0.6), masqué sur option "Tous"
- `sk-sidebar-reset` : bouton discret, désactivé si aucun filtre actif

**Facettes et types**
- `StackFacetProfile` : `"all" | StackPersona` (6 personas)
- `StackFacetObjective` : `"all" | "content" | "sell" | "clients" | "automate" | "produce" | "organize"` (dérivé depuis `subProfiles`)
- `StackFacetBudget` : `"all" | "light" | "standard" | "premium"` (≤50 / 51-150 / >150€)
- `StackFacetComplexity` : `"all" | StackStage` (starter/lean/scale)
- Mapping `OBJECTIVE_SUBPROFILES` : chaque objectif → liste de subProfiles correspondants
- `getStackObjectives(stack)` : dérive les objectifs depuis `stack.subProfiles`
- Filtrage combinatoire : toutes les facettes s'appliquent ensemble

**Compteurs dans la sidebar**
- Calculés dynamiquement sur l'ensemble STACKS (pas sur la sélection courante)
- `countForProfile / countForObjective / countForBudget / countForComplexity`
- Total 212 stacks : Créateur 40, Consultant 47, Designer 36, Développeur 37, Ops 28, Solo 24

**Panneau mobile**
- `sk-mobile-trigger-row` : visible < 1024px, masqué >= 1024px
- Bouton "Filtres" + badge count actif (ex: "Filtres (2)")
- `sk-mobile-panel` : fixed full-screen, fond #F8F8F4
- Header blanc + titre + bouton fermer (×)
- Corps scrollable avec `SidebarContent` (mêmes facettes)
- Footer blanc : CTA "Voir les N stacks" noir + "Réinitialiser" secondaire
- Fermeture via bouton ×, via Escape (event listener), body overflow:hidden pendant ouverture

**Composant partagé `SidebarContent`**
- Utilisé à la fois par `sk-sidebar` (desktop) et `sk-mobile-panel` (mobile)
- Reçoit tous les états facettes en props + callbacks
- `FacetGroup<T>` générique : label + options + active + onChange + counts

**Barre résultats**
- `sk-results-header` : "N stacks trouvées" (gauche) + tri select (droite)
- `sk-results-search` : champ recherche desktop (masqué mobile)
- Le champ recherche mobile est dans `sk-mobile-trigger-row`

**Cards améliorées**
- Tags `sk-card-tags-row` : budget tier + complexité (stage label) + nombre d'outils
- STAGE_LABELS : starter → Débutant / lean → Intermédiaire / scale → Avancé
- `budgetDisplayLabel()` : Budget léger / Standard / Premium

**Empty state**
- `sk-empty-state` : card avec titre brand + description + CTA "Réinitialiser les filtres"
- Reset : remet toutes les facettes à "all", query = "", sort = "recommended"

**Supprimé**
- `StackFilterId` et `FILTER_PILLS` (pills horizontales) — remplacés par sidebar
- `stackMatchesFilter` — remplacé par `stackMatchesFacets`

---

## 2026-05-15 — Sprint Stacks : tri sur /fr/stacks + Sprint Comparatifs Index : refonte /fr/comparatifs

### Sprint Stacks — ajout tri discret

**Fichier modifié** : `src/pages/StacksPage.tsx` + `src/index.css`

**Ajouts**
- `StackSortId` type : `"recommended" | "budget" | "tools"`
- `sortBy` state + sort logic dans `filteredStacks` useMemo
- Sort select (`gi-sort-select`) intégré dans `sk-filter-row` aux côtés des filter pills
- `.sk-filter-row` CSS : flex row, pills flex-1, sort à droite, wraps sur mobile
- Empty state amélioré : message explicit + bouton "Voir toutes les stacks" (reset filter + query + sort)

### Sprint Comparatifs Index — refonte /fr/comparatifs

**Fichier modifié** : `src/pages/ComparesIndexPage.tsx` + `src/index.css` (+280 lignes cix-*)

**Hero** : réécriture inline — suppression `EditorialHero` et méta ANNÉE/PRIX VÉRIFIÉS/VERDICTS.
Structure : eyebrow + H1 `clamp(3.5rem→6rem)` + description 19px + fond `#F8F8F4` border-bottom uniquement.

**Recherche** : input `cix-search-input` (height 56px, border-radius 10px) dans le hero, placeholder éditorial, icône `Search` droite, focus → border #222222.

**Suggestions** : 5 chips `cix-suggestion-chip` (Notion vs Airtable / ChatGPT vs Claude / Zapier vs Make / Figma vs Canva / Linear vs Jira) — navigate vers page comparatif.

**Filtres catégories** : `cix-filter-row` avec 5 `gi-filter-pill` (Tous / IA / Productivité / Design / Automatisation / CRM). Détection catégorie par pattern slugPair via `getSlugCategory()`.

**Grid** : `cix-grid` 2 colonnes desktop / 1 colonne mobile, gap 20px.

**Card** `cix-card` (border `#CFCFC8`, hover `#222222` + translateY(-1px)) :
- Label catégorie uppercase
- VS block : logos ronds 32px + noms tools
- Titre `font-brand clamp(1.375rem→1.75rem)`
- Description dérivée de `verdict.keepIf` ou `shortDescription`
- Ligne prix
- CTA "Lire le comparatif →" avec arrow transition

**Comparateur custom** conservé, restyled avec classes `cix-comparator-*` (sans Tailwind).

**Empty states** : sur search vide + filtres vides → bouton reset.

---

## 2026-05-15 — Sprint Comparatif v2 : renforcement affordance de comparaison

**Fichiers modifiés**
- `src/pages/ComparePage.tsx` — extension interface + 3 nouvelles sections + subnav mis à jour
- `src/index.css` — ajout `cp-overview-*`, `cp-pros-cons-*`, `cp-decision-*` (~130 lignes)

**Nouvelles sections**
1. **"Ce que fait chaque outil"** (`id="outils"`) — 2 cards symétriques (`cp-overview-grid`) : description courte + liste de cas d'usage pour chaque outil, avant le tableau comparatif
2. **"Avantages et limites"** (`id="avantages"`) — remplace l'ancienne section "Limites" isolée ; chaque outil affiche maintenant Avantages (`+` vert) + Limites (`—` gris) en 2 colonnes
3. **"Ce qui doit te faire choisir"** — liste de `CompareDecisionRow` (contexte → outil recommandé)

**Interface `CompareEditorialContent` étendue**
```typescript
toolADesc / toolADescEn
toolAUseCases[] / toolAUseCasesEn[]
toolBDesc / toolBDescEn
toolBUseCases[] / toolBUseCasesEn[]
prosA[] / prosAEn[]     // avantages outil A
prosB[] / prosBEn[]     // avantages outil B
decisionRows: CompareDecisionRow[]   // context + choice
```

**Subnav** : 7 ancres (Verdict / Ce que font les outils / Comparaison / Avantages / Profils / Prix / FAQ)

**Labels verdict** : "Prends {toolA} si…" / "Prends {toolB} si…" / "Évite les deux si…" (plus explicites)

**`buildFallbackContent`** mis à jour avec les nouveaux champs (dérivés des données outil)

---

## 2026-05-15 — Sprint Stack Detail : refonte StackDetailPage en page de décision éditoriale

**Fichiers modifiés**
- `src/pages/StackDetailPage.tsx` — réécriture complète (~1230 lignes)
- `src/index.css` — ajout du système `sd-*` étendu (~297 lignes)

**Architecture**
- Supprimé : bande métriques `sd-summary`, section Avis standalone, ancienne section Pièges
- Ajouté : `StackEditorialContent` interface + `EDITORIAL_REGISTRY` + `buildFallbackEditorial()`
- Ajouté : `PERSONA_LAYERS` — couches thématiques spécifiques par persona (contenu : IA / Idées / Visuels / Vidéo / Publication / Stockage)
- Conservé intact : `ToolPanel` + `Sheet`/`SheetContent`/`SheetClose` (shadcn/ui)

**Interfaces TypeScript**
```typescript
interface StackEditorialContent {
  verdictShort / verdictShortEn
  overviewIntro / overviewIntroEn
  overviewLabels[3] / overviewTexts[3] + EN
  priority: { essential[3], optional[3], challenge[3] } + EN
  budgetRows: StackBudgetRow[3]         // tier / amount / desc
  risks: StackRiskEnhanced[5]           // problem / consequence / reco
  altVariants: StackAltVariant[3]       // label / title / budget / tools / compromise
  faq: StackFaqItem[5]                  // q / a + EN
  expertNote / expertNoteEn
}
```

**Structure de la page (7 nouvelles sections + hero 2-col)**
1. **Hero 2 colonnes** — breadcrumb, eyebrow STACK, H1 `font-brand clamp(3.25rem,6vw,5.5rem)` ls -0.06em, desc 18px / module `sd-snapshot` sticky (logos pastilles 28px, métriques, verdict court)
2. **Subnav sticky** — 6 ancres (Vue d'ensemble / Outils / Budget / Risques / Alternatives / FAQ), underline noir
3. **Vue d'ensemble** — intro 17px + grille 3 colonnes (Elle sert à / Elle évite / Elle n'est pas faite pour) + note expert fond #EDEDE8
4. **Outils** — sections par couche (PERSONA_LAYERS ou STACK_LAYERS), bouton "Voir le détail" → ToolPanel
5. **Priorités** — `sd-priority-grid` 3 colonnes, border-top colorée (vert/gris/rouge), items avec dashes
6. **Budget** — `sd-budget-list` 3 lignes (Minimal / Recommandé / À surveiller), grille 180px + 110px + 1fr
7. **Risques** — `sd-risk-enhanced-row` 3 colonnes (Problème / Conséquence / Recommandation)
8. **Alternatives** — `sd-alt-grid` 3 cards (Minimale / Recommandée / Intensive)
9. **CTA band** — fond `#EDEDE8`, `sd-cta-inner` wrapper (max 1280px)
10. **FAQ** — `sd-faq-list` avec `<details>/<summary>` natif + ChevronDown rotatif

**Contenu éditorial createur-contenu-operateur**
Stack `createur-contenu-operateur` : 8 outils (ChatGPT/Notion/Canva/Tally/Beehiiv/Buffer/Descript/Google Drive), 5 risques, 3 variantes alternatives, 5 FAQ.

---

## 2026-05-15 — Sprint Comparatif : refonte /fr/comparatif/:pair en page de décision éditoriale

**Fichiers modifiés**
- `src/pages/ComparePage.tsx` — réécriture complète
- `src/index.css` — ajout du système `cp-*` (~300 lignes)

**Architecture**
- Supprimé : `PageHero`, `CompareSidebar`, `CompareVerdictCards`, `CompareStrengthBars`, `FeatureDiff`, `ProsConsSection`, `QuickVerdict`, `ToolFaceCard`, `PricingSection` (tous à fond bleu)
- Ajouté : contenu éditorial hardcodé `NOTION_VS_AIRTABLE` + registre `EDITORIAL_CONTENT` + fallback générique `buildFallbackContent()`

**Structure de la page (13 sections)**
1. **Hero 2 colonnes** — breadcrumb, eyebrow COMPARATIF, H1 `font-brand clamp(4rem,7vw,7rem)` ls -0.06em, phrase de cadrage 21px, verdict court 18px / module `cp-vs-module` sticky (logos, séparateur VS, verdict rapide)
2. **Subnav sticky** — 6 ancres (Verdict / Comparaison / Profils / Prix / Alternatives / FAQ), underline noir, zéro bleu
3. **Verdict rapide** — `cp-verdict-grid` 3 colonnes (Notion gagne si / Airtable gagne si / À éviter si)
4. **Tableau comparatif** — `cp-table` 10 lignes × 4 colonnes (Critère / Notion / Airtable / Verdict), responsive `data-label`
5. **Profils** — `cp-profile-grid` 6 cartes (persona + recommendation + cas d'usage)
6. **Prix** — 2 `cp-price-row` + bloc recommandation ToolTrim
7. **Limites** — `cp-limits-grid` 2 colonnes avec dashes `::before "—"`
8. **Alternatives** — 5 `cp-alt-row` (lien `/tool/` si outil en DB, sinon `<div>`)
9. **CTA band** — fond `#EDEDE8`, bouton noir `<Link>`
10. **FAQ** — 5 `FaqItem` avec `<details>/<summary>` + chevron rotatif

**Composants internes**
- `PricingNote` — rend le `**texte**` en `<strong>` via regex
- `FaqItem` — `<details>/<summary>` avec `useState` pour la rotation du chevron

**Règle éditoriale**
- Zéro couleur bleue (`hsl(var(--primary))`)
- Fond du module VS : `#FFFFFF`, bordure `#DADAD4`
- CTA band : `#EDEDE8` (pas `#F8F8F4`)

---

## 2026-05-15 — Sprint 5b : refonte StacksPage + StackDetailPage

**Fichiers modifiés**
- `src/pages/StacksPage.tsx` — réécriture complète
- `src/pages/StackDetailPage.tsx` — réécriture complète
- `src/index.css` — ajout des systèmes `sk-*` et `sd-*`

### StacksPage — système `sk-*`

**Supprimé** : `EditorialHero`, filtres à checkboxes avec `facetCounts`, `STACK_FILTER_GROUPS`, `STACK_BUDGET_FILTERS`, `selectedFilters` complexe

**Ajouté**
- Hero inline `eh-*` — H1 `clamp(3.5rem, 6vw, 6rem)` ls -0.055em lh 0.98
- Section "Commencer par ton profil" — `sk-profiles-grid` avec 6 `Link` cards (persona → stack recommandée)
- Filtres 7 pills (`gi-filter-pill` / `gi-filter-pill--active`) : Tous / Création / Business / Tech / Ops / Budget léger / IA
- Cards inline `sk-card` : tool logo pastilles (cercles 28px, stack -6px) + risk snippet + budget + badge persona
- `stackMatchesFilter()` — filtre par persona et critères (budget ≤ 50€, slugs IA)

### StackDetailPage — système `sd-*`

**Supprimé** : `Button` import, `ArrowRight` icon, sticky nav en onglets bleus

**Conservé intégralement** : `Sheet` / `SheetContent` / `SheetClose` / `ToolPanel` (inchangé)

**Ajouté**
- Hero `sd-container` — tags persona/stage, H1 `clamp(3.5rem, 7vw, 7rem)` ls -0.06em lh 0.94, bouton noir `<Link>` inline
- `sd-nav` sticky `top: var(--navbar-h, 68px)` — liens `sd-nav-link` (hover noir, zéro bleu)
- `sd-summary` — 4 `sd-metric` : budget / nb outils / étape / risque
- `sd-decision-grid` — verdict 3 colonnes (À copier si / Risque principal / À éviter si)
- `sd-tool-row` — 5 colonnes : logo | nom+rôle | raison | badge statut | flèche
- Badges statut : couleurs inline (vert core / gris conditional / rouge challenge)
- `sd-risk-row` — liste des pièges par outil (section conditionnelle `hasTraps`)
- `sd-cta-band` — titre `font-brand` + bouton noir
- `sd-related-grid` — 3 stacks liées (`sd-related-card`)

**Fix React hooks** : `relatedStacks = useMemo(...)` déplacé avant le `if (!stack) return <Navigate/>` (violations de règles des hooks)

---

## 2026-05-15 — Sprint 4 : Cards / Listings — unification du système de cards

**Fichiers modifiés**
- `src/pages/ToolsPage.tsx` — grille principale migrée vers ToolCardEditorial
- `src/pages/CategoryPage.tsx` — liste migrée vers ToolRowEditorial
- `src/pages/StacksPage.tsx` — cartes migrées vers StackCardEditorial
- `src/index.css` — ajout du système `tcr-*` (ToolRowEditorial)

**Nouveaux composants**
- `src/components/ToolRowEditorial.tsx` — ligne éditoriale horizontale (rank + logo + contenu + score + prix + CTA)
- `src/components/StackCardEditorial.tsx` — carte stack éditoriale (variants `row` + `compact`)

### ToolCardEditorial activé (anciennement orphelin)
`ToolCardEditorial` remplace `ToolCard variant="default"` dans la grille principale de `ToolsPage`.
Score ToolTrim visible sur chaque carte (`prescription_quality` → score numérique affiché).
`ToolCard variant="featured"` conservé pour la section Sélection éditoriale.

### ToolRowEditorial — nouveau système `tcr-*`
Remplace `ToolCard variant="list-row"` dans `CategoryPage`.
Layout horizontal : rang · logo · nom/catégorie/extrait · score /5 · prix · flèche CTA.
Score masqué sur mobile (≤640px) pour économiser la place.
Badge `tcr-pick` inline si `prescription_quality === "ferme"`.

### StackCardEditorial — extraction des cards StacksPage
Deux variants :
- `row` — carte principale de la liste (image 140px + corps + panneau data logo/coût/outils)
- `compact` — carte recommandée par profil (label persona + titre + bestFor)
`StacksPage` conserve toute la logique data (filtres, facettes, query) ; `StackCardEditorial` gère uniquement le rendu.
Import `ArrowRight` et `ToolLogo` supprimés de `StacksPage` (devenus redondants).

---

## 2026-05-15 — Sprint Guides v2 : filtres, tri, logos, section Commencer ici

**Fichiers modifiés**
- `src/pages/GuidesPage.tsx`
- `src/index.css`
- `docs/DESIGN_SYSTEM.md`

### GuidesPage — nouvelles fonctionnalités

**Barre de filtres éditoriaux** (`gi-filter-bar`, `gi-filter-pill`)
7 filtres : Tous · Comparer · Remplacer · Réduire les coûts · Construire une stack · IA · Freelance.
Pills `height: 34px`, `border-radius: 999px`, fond transparent, filtre actif `background: #222222`. Zéro bleu.
Filtre détecté via keywords dans `title + excerpt + tags + category` (fonction `matchesFilter`).

**Tri discret** (`gi-sort-wrapper`, `gi-sort-select`)
3 options : Récents (date desc) · Sélection ToolTrim (ordre data source) · Lecture courte (readTime asc).
Label uppercase `TRIER PAR`, `<select>` sobre, height 34px, flèche custom SVG inline.

**Logos outils cités — pastilles rondes** (`tool-logo-stack`, `tool-logo-pill`)
Utilise `useArticleTools` (hook existant) pour matcher les outils mentionnés dans chaque guide.
Pastilles 32px, chevauchement `margin-left: -6px`, hover `translateY(-1px)`.
Overflow → pastille `+N` (`tool-logo-more`, fond #F8F8F4).
Label `OUTILS CITÉS` 11px uppercase #9A9A92 au-dessus.
Maximum 5 logos par row.

**Rows guides améliorées** — colonne gauche 150px (était 140px), padding 32px (était 28px)
Left meta : type (GUIDE / COMPARATIF / ALTERNATIVE / STACK) + intent (COMPARER / REMPLACER / RÉDUIRE LES COÛTS / STACK) + read time.
Fonctions `getPostType()` + `getPostIntent()` dérivées des tags/category/slug.

**Section "Commencer ici"** (`gi-start-here-grid`, `gi-start-here-item`)
3 colonnes, placée après le featured block.
Chaque item clique sur un filtre et scroll vers #guides.
Angles : Choisir un outil (comparer) · Remplacer (remplacer) · Stack (stack).
Pas de card lourde : `border-top` uniquement, fond transparent.

**Load more** (`gi-load-more`)
Affiche 12 guides max (1 featured + 11 rows). Bouton secondaire sobre.
Reset automatique de la pagination sur changement de filtre ou de tri.

**Hero right module** — synchro avec `activeFilter`.
Les items (Comparatifs, Alternatives, IA, Stacks, Freelance) utilisent désormais les mêmes IDs que la barre de filtres.

### Responsive

- Filtres : scroll horizontal `overflow-x: auto`, `flex-wrap: nowrap`, `≤700px`
- Tri : sous les filtres sur mobile
- "Commencer ici" : 1 colonne `≤768px`
- Rows : 1 colonne `≤700px`

---

## 2026-05-15 — Sprint Grid : Système de grille global

**Fichiers modifiés**
- `src/index.css`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN_SYSTEM.md`

### Tokens de layout ajoutés dans `:root`

```css
--layout-max:            1440px;   /* full-width shell */
--layout-content:        1280px;   /* contenu éditorial */
--layout-article:        760px;    /* colonne texte article */
--layout-sidebar:        260px;    /* sidebar TOC article */
--layout-tool-sidebar:   360px;    /* sidebar sticky outil */
--layout-gutter:         48px;     /* desktop */
--layout-gutter-tablet:  32px;
--layout-gutter-mobile:  20px;
```

Overrides responsive dans `@layer base` :
- `@media (max-width: 1023px)` → `--layout-gutter: var(--layout-gutter-tablet)`
- `@media (max-width: 767px)` → `--layout-gutter: var(--layout-gutter-mobile)`

### Classes utilitaires créées dans `@layer components`

| Classe | Usage |
|---|---|
| `.layout-shell` | Conteneur 1440px (hero backgrounds, CTA bands) |
| `.layout-content` | Conteneur 1280px (guides, articles) |
| `.layout-article-grid` | Grille 2-col article (760px + 260px TOC) |
| `.layout-tool-grid` | Grille 2-col outil (1fr + 360px sidebar) |

### Corrections d'alignement

**GuideDetailPage** (problème critique — 80px de décalage à 1300px viewport) :
- `ga-body-grid` : `max-width: 1120px` → `max-width: var(--layout-content)` (1280px)
- `ga-cta-inner` : `max-width: 1120px` → `max-width: var(--layout-content)` (1280px)
- `ga-container` : hardcodé 1280px/48px → `var(--layout-content)` / `var(--layout-gutter)`

**GuidesPage** (décalage hero vs body) :
- `eh-container` : `max-width: 1440px` → `max-width: var(--layout-content)` (1280px)
- `gi-container` : hardcodé 1280px/48px → `var(--layout-content)` / `var(--layout-gutter)`

**ToolDetailPage** :
- `td-container` : hardcodé 1440px/48px/20px → `var(--layout-max)` / `var(--layout-gutter)` / `var(--layout-gutter-mobile)`

### Principe après fix

| Zone | max-width | Source |
|---|---|---|
| Hero fonds (CTA bands, diag) | 1440px | `var(--layout-max)` |
| Contenu éditorial (guides, articles, outils) | 1280px | `var(--layout-content)` |
| Colonnes gauches des articles | 760px | `var(--layout-article)` |
| Sidebar TOC | 260px | `var(--layout-sidebar)` |

---

## 2026-05-15 — Sprint 3 : Refonte éditoriale Guides + Articles

**Fichiers modifiés**
- `src/pages/GuidesPage.tsx`
- `src/pages/GuideDetailPage.tsx`
- `src/index.css`
- `src/data/posts-fr.json`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN_SYSTEM.md`

### GuidesPage — améliorations éditoriales

**Hero metadata** : les tags `gi-hero-tag` sont passés de badges avec bordure (`border: 1px solid #DADAD4`, `background: #FFFFFF`) à une rangée de texte brut dot-séparée (`·` en `::before`). Plus léger, plus éditorial.

**Bloc featured** : titre agrandi `clamp(1.75rem, 3vw, 2.75rem)` → `clamp(2rem, 3.5vw, 3rem)`.

**Lignes articles** :
- `gi-row-title` : `clamp(1.5rem, 2.5vw, 2rem)` → `clamp(1.875rem, 3.2vw, 2.625rem)` (30px→42px)
- `gi-row-excerpt` : 15px → 16px, `line-height` 1.5 → 1.45, `max-width` 680→720px, ajout `margin-top: 10px`
- `gi-row-cta` : 14px → 15px, couleur `#9A9A92` → `#222222` (toujours visible, hover opacity)
- `gi-row` padding : 32px → 28px, colonnes `130px` → `140px`

**Correction** : CTA band liait vers `/fr/diagnostic` (route inexistante) → corrigé en `/fr/selector`.

### GuideDetailPage — améliorations éditoriales

**Typographie article** :
- H2 : `clamp(1.875rem, 3vw, 2.625rem)` → `clamp(2.625rem, 4vw, 3.5rem)` (42px→56px)
- H3 : `clamp(1.375rem, 2.2vw, 1.875rem)` → `clamp(1.75rem, 2.5vw, 2.125rem)` (28px→34px), `margin-bottom` 16→18px

**TOC** :
- `ga-toc-col top` : `96px` → `calc(var(--navbar-h, 68px) + 24px)` (utilise la variable canonique)
- `ga-toc-link` : couleur `#9A9A92` → `#6F6F68` (plus visible), taille 13→14px, `margin-bottom` 11→12px
- `ga-toc-nav padding-left` : 18px → 20px

**Encadrés "À retenir"** : le renderer Markdown (`markdownToHtml`) détecte maintenant les blockquotes commençant par `À retenir`, `Key takeaway`, `À noter` ou `Note :` et les transforme en `<div class="ga-takeaway">`. Deux exemples ajoutés dans `posts-fr.json` pour l'article `top-5-competences-ia-freelance-2026`.

**Module outils** : `ToolRow` amélioré — prix v5 utilisé en priorité, badge prix sobre (`border: 1px solid #DADAD4`, `background: #F8F8F4`), usage simplifié.

**Correction** : CTA band liait vers `/fr/diagnostic` → corrigé en `/fr/selector`.

### Hero global (EditorialHero / eh-description)

`eh-description` standardisé : `font-size` 19px fixe (était clamp 17→19px), `line-height` 1.55→1.45, `color` `#4A4A44`→`#6F6F68`, `max-width` 640→680px.

---

## 2026-05-15 — Fix React error #310 — Rules of Hooks violation

**Fichiers modifiés**
- `src/pages/ToolDetailPage.tsx`

### Problème
Trois hooks (`useEffect` redirect + `useRef` × 2 + `useEffect` scroll) étaient déclarés **après** le `if (loading) return` (ligne 170). En React 18 concurrent mode, le nombre de hooks appelés variait selon `loading`, ce qui déclenche l'erreur #310 ("Cannot update a component while rendering a different component").

### Fix
Tous les hooks déplacés avant le premier `return` conditionnel. Les `useRef` et `useEffect` sont maintenant dans le bon ordre : SEO effect → redirect effect → prevSubPageRef → prevSlugRef → scroll effect → puis les `if (loading) return` et `if (!tool) return null`.

---

## 2026-05-15 — Correction footer : suppression bloc marketing global

**Fichiers modifiés**
- `src/components/Footer.tsx`

### Supprimé
Bloc marketing "brand statement" du footer global :
- grand logo picto ToolTrim
- wordmark ToolTrim (clamp 2.8rem → 5rem)
- texte "Votre stack coûte trop cher. On le prouve en 3 minutes."
- bouton bleu "Lancer mon analyse"
- mention "Gratuit · Sans inscription"
- radial glow background

### Conservé
- Colonnes de navigation (Produit / Catégories / Outils / Entreprise / Légal)
- Barre de copyright et liens légaux

### Nettoyage imports
Supprimés de `Footer.tsx` car inutilisés : `useLocation`, `ArrowRight`, `pictoLogo`.
La logique conditionnelle `isToolPage` a également été retirée (plus nécessaire).

---

## 2026-05-15 — Sprint 2 suite : stabilisation tabs page outil

**Fichiers modifiés**
- `src/pages/ToolDetailPage.tsx`

### Problème
Le commit précédent (`0e8c66d`) utilisait `useNavigate` + `preventScrollReset: true` pour
gérer le scroll des tabs. Cette approche causait une React error #310
("Cannot update a component while rendering a different component") en production,
spécifique à l'environnement `BrowserRouter` (non-data router).

### Fix — approche useRef + useEffect
Remplacement complet de `handleTabClick` / `useNavigate` / `useCallback` par :

```tsx
const prevSubPageRef = useRef<string | null>(null);
const prevSlugRef    = useRef<string | null>(null);

useEffect(() => {
  // Skip premier rendu et changement d'outil
  if (prevSubPageRef.current === null || prevSlugRef.current !== slug) {
    prevSubPageRef.current = subPage;
    prevSlugRef.current    = slug ?? null;
    return;
  }
  if (prevSubPageRef.current === subPage) return;
  prevSubPageRef.current = subPage;

  const id = subPage === "presentation" ? "analyse" : subPage;
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 92, behavior: "smooth" });
}, [subPage, slug]);
```

- `<Link>` gère la navigation normalement (URL + SEO préservés)
- L'`useEffect` détecte le changement de `subPage` et scrolle
- L'offset `92px` = navbar 68px + marge de confort
- Les sections ont `id="analyse|prix|alternatives|avis|faq"` + `scroll-margin-top` CSS

### Nettoyage imports
Supprimés : `useNavigate`, `useCallback`, `ToolVerdictBlock` (orphelin), `TrendingDown`, `Sparkles`, `ShieldCheck`.

---

## 2026-05-15 — Sprint 2 correction : Suppression CTA dupliqués

**Fichiers modifiés**
- `src/pages/ToolDetailPage.tsx`
- `src/components/Footer.tsx`
- `docs/DESIGN_SYSTEM.md`

### Problème
Sur les pages outils, 3 blocs CTA s'empilaient en bas de page :
1. `td-diag-band` — "[outil] fait partie de ta stack ?" (contextuel)
2. `td-footer-cta` — "Une stack plus claire. Moins d'abonnements inutiles." (global)
3. Footer brand statement — logo picto + "Votre stack coûte trop cher. On le prouve en 3 minutes." + bouton bleu

### Fix

**`ToolDetailPage.tsx`** — suppression complète de la section `td-footer-cta` (CTA global inline). Ne reste que `td-diag-band` (CTA contextuel outil).

**`Footer.tsx`** — ajout de `useLocation()` et de la variable `isToolPage` (regex `/\/tool\/[^/]+/`). Le bloc brand statement est conditionnel : `{!isToolPage && (...)}`. Il reste visible sur toutes les autres pages (home, tools, guides, catégories, comparatifs…).

**`DESIGN_SYSTEM.md`** — ajout de la règle "Une seule conversion par page outil" avec table de référence et justification.

---

## 2026-05-15 — Sprint 2 : Refonte template page outil

**Fichiers modifiés**
- `src/pages/ToolDetailPage.tsx`
- `src/components/tool/StickyDecisionCard.tsx`
- `src/index.css`

### 1. H1 conditionnel — noms courts (≤ 5 caractères)

**Problème :** Pour les outils à noms courts (Box, Slack, Zoom…), le H1 en `clamp(4.5rem, 8vw, 7.75rem)` atteignait 124px — disproportionné visuellement.

**Fix :** Condition inline dans `ToolDetailPage.tsx` :
- `tool.name.length <= 5` → `clamp(4.5rem, 8vw, 6.5rem)` (max 104px)
- Sinon → `clamp(4.5rem, 8vw, 7.75rem)` (max 124px, inchangé)

Pages prioritaires vérifiées : `/fr/tool/box` (3 chars ✓) · `/fr/tool/framer` (6 chars → max normal ✓)

### 2. Sidebar sticky top — ajustement offset

**Avant :** `top: calc(var(--header-height) + 24px)` (92px total)
**Après :** `top: calc(var(--navbar-h, 68px) + 20px)` (88px total)

- Utilise la variable canonique `--navbar-h` avec fallback `68px`
- Réduit l'offset de 24px → 20px conformément au spec Sprint 2
- Modifié dans `.td-sidebar-desktop` (index.css)

### 3. Label "Prix à partir de" dans StickyDecisionCard

**Avant :** La ligne de fait affichait toujours `Prix` comme label.
**Après :** Si `displayPrice > 0`, le label devient `Prix à partir de` / `From`. Sinon reste `Prix` / `Price`.

Logique dans `metaRows` de `StickyDecisionCard.tsx`.

---

## 2026-05-15 — Sprint 1 : Stabilisation structurelle

**Fichiers modifiés**
- `src/components/Navbar.tsx`
- `src/index.css`

**Fichiers créés**
- `CLAUDE.md`
- `docs/AI_HANDOFF.md`
- `docs/ROADMAP.md`

### 1. Mobile menu — fix complet

**Problème :** Le panel Explorer (`EditoralPanel`) utilisait des styles inline fixes (`left: 24px`, `right: 24px`, `height: 560px`) quel que soit l'écran. La media query existante (`max-width: 767px`) ne couvrait pas les tablettes (768–1023px).

**Fix :**
- Ajout d'un état `isMobile` dans `Navbar` (detecté via `window.innerWidth < 1024`, mis à jour au resize)
- Passage de `isMobile` à `EditoralPanel` comme prop
- `EditoralPanel` utilise des styles inline conditionnels :
  - **Mobile (< 1024px)** : `top: 68px, left: 0, right: 0, bottom: 0, height: auto` → full-screen sous le header
  - **Desktop (≥ 1024px)** : comportement inchangé (`left: 24px, right: 24px, height: 560px`)
- Classe `panel-rail-footer` ajoutée au div footer du rail (caché sur mobile via CSS)
- Media query CSS étendue de `max-width: 767px` → `max-width: 1023px` avec layout corrigé :
  - `panel-body` : `height: auto; flex: 1; min-height: 0` (fix du bug height: 100% sur parent auto)
  - `panel-rail` : scrollable horizontalement, `border-right: none; border-bottom: 1px solid #DADAD4`
  - `panel-content` : `flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden`
  - `panel-columns` : `flex-wrap: wrap; gap: 32px 40px`
  - `panel-link` : `white-space: normal` (wrapping sur écrans étroits)
- Fermeture Escape : déjà implémentée
- Fermeture au clic extérieur : déjà implémentée (click-catcher `z-[45]`)

### 2. Variable --navbar-h

Ajout de `--navbar-h: 68px` dans `:root` comme variable canonique.
`--header-height: var(--navbar-h)` est maintenant un alias.

Utilisations :
- `.td-sidebar-desktop` : `top: calc(var(--header-height) + 24px)`
- `.td-tab-nav` : `top: var(--header-height)`
- Plus de valeurs hardcodées (`88px`) dans le CSS.

### 3. Sticky sidebar — vérification

La sticky sidebar fonctionne correctement depuis Session 1. Pattern vérifié :
- `position: sticky` est sur `.td-sidebar-desktop` (grid item direct)
- `align-self: start` + `height: fit-content` sont présents
- Parents `td-container` et `td-body-grid` n'ont pas `overflow: hidden`, `transform`, `filter`
- `top: calc(var(--navbar-h) + 24px)` = 92px — suffisant pour passer sous le header

### 4. ToolCardEditorial — documenté (non migré)

`ToolCardEditorial` (src/components/ToolCardEditorial.tsx) existe mais n'est importé nulle part.
Migration vers ToolsPage + CategoryPage documentée en Phase 3 du ROADMAP.

### 5. Dark mode — dette technique documentée

`gi-*` et `ga-*` (guides) n'ont aucun dark variant.
Documenté comme dette technique dans ROADMAP.md (Phase 6).
Non traité dans ce sprint.

### 6. Docs créés

- `CLAUDE.md` — guide pour Claude (conventions, variables, règles)
- `docs/AI_HANDOFF.md` — handoff opérationnel pour reprendre une session
- `docs/ROADMAP.md` — phases + dette technique

---

Suivi des modifications appliquées par sessions Claude. Format : date · session · fichiers · résumé.

---

## 2026-05-15 — Session 3 : Refonte page outil

**Fichiers modifiés**
- `src/pages/ToolDetailPage.tsx`
- `src/components/tool/ToolDiagCta.tsx`
- `src/index.css`

**Résumé**

### Hero simplifié
Le hero était en 2 colonnes (identité gauche + `HeroDecisionSummary` droite) avec une barre de métadonnées (Catégorie / Modèle / Plan gratuit / Mis à jour). Trop chargé, trop répétitif avec la sidebar.

Nouveau hero : colonne unique, max-width 860px. Breadcrumb → logo + badge catégorie → H1 `clamp(4.5rem, 8vw, 7.75rem)` → description 22px → contexte court 17px/#6F6F68. Aucune métadonnée, aucune grille décisionnelle.

Supprimé : `HeroDecisionSummary` (composant + call JSX), `.td-hero-meta` (row de métadonnées), la classe `.td-hero-layout` reconvertie en simple padding block.

### Section Décision rapide (nouveau)
Remplace la section "Verdict ToolTrim + ToolVerdictBlock" qui était la première section du tab Analyse.

Nouvelle structure : eyebrow `DÉCISION RAPIDE` → H2 `{outil} — quand ça a du sens.` → phrase verdict → grille 3 colonnes `.td-dr-grid` (`.td-dr-block` avec label 11px uppercase + texte 17px).

Données : `verdict.keepIf` → "À garder si" · `verdict.avoidIf` → "À challenger si" · `tool.cons[0]` → "Limite principale".

### Onglets renforcés
- Hauteur : 64px → **72px**
- Font-size : 15px → **16px**
- Letter-spacing : -0.015em → **-0.02em**
- Gap entre items : 0 → **40px**
- Underline actif : 1px → **2px**
- Sticky offset : `top: 0` → `top: var(--header-height)` (68px)

### Bande Audit de stack (full-width)
`ToolDiagCta` sorti du body-grid. Placé juste après `</div.td-container>`, toujours visible (pas conditionnel au subPage). Inliné directement dans `ToolDetailPage.tsx`.

Style : `border-top/border-bottom 1px solid #DADAD4`, `background #F8F8F4`, grille `1fr auto`. Titre clamp(2rem → 2.75rem), CTA black button, pas de bleu, pas de card arrondie.

`ToolDiagCta.tsx` mis à jour au même style pour cohérence (si réutilisé ailleurs).

### Footer CTA ToolTrim (full-width)
Nouveau section après la bande audit. Remplace l'ancien bloc avec grand logo décoratif.

Style : `background #F8F8F4`, `border-top 1px solid #DADAD4`, `padding 72px 0`. Grille `1fr auto`, `align-items: end`. Titre `.td-footer-title` clamp(3rem → 5.125rem), lh 0.95, ls -0.055em.

Eyebrow "TOOLTRIM" en 11px uppercase → titre sobre → texte explicatif → CTA "Lancer mon analyse →" + "Gratuit · Sans inscription".

### Variables CSS
Ajout `--header-height: 68px` dans `:root`. Utilisé dans :
- `.td-sidebar-desktop` : `top: calc(var(--header-height) + 24px)`
- `.td-tab-nav` : `top: var(--header-height)`

### Nouvelles classes CSS (index.css)
- `td-dr-grid` / `td-dr-block` / `td-dr-label` / `td-dr-text` — Décision rapide 3 colonnes
- `td-diag-band` / `td-diag-inner` — Bande audit de stack
- `td-footer-cta` / `td-footer-inner` / `td-footer-title` — Footer CTA ToolTrim

---

## 2026-05-14 — Session 2 : Guides index + Guide article

**Fichiers modifiés**
- `src/pages/GuidesPage.tsx` (réécriture)
- `src/pages/GuideDetailPage.tsx` (réécriture)
- `src/index.css` (ajout systèmes `gi-*` et `ga-*`)

**Résumé**
GuidesPage : layout éditorial Awwwards. FeaturedBlock horizontal + ArticleRow 3 colonnes (130px date/cat | titre | lire →) + thème columns + CTA band. Suppression PersonaGuidesSection (photos Unsplash).

GuideDetailPage : header `ga-header` avec eyebrow + `ga-title` clamp + standfirst. Body grid 2 colonnes `ga-body-grid` (760px + 260px TOC). Système `ga-content` avec sélecteurs explicites H2/H3/blockquote. TOC sticky + barre de progression 2px noire.

---

## 2026-05-14 — Session 1 : StickyDecisionCard + Hero tool

**Fichiers modifiés**
- `src/components/tool/StickyDecisionCard.tsx` (réécriture)
- `src/pages/ToolDetailPage.tsx` (hero 2-col + sticky fix)
- `src/index.css` (système `td-*` initial)

**Résumé**
StickyDecisionCard : score 64px, verdict 16px, ordre header→score→verdict→CTAs→4 facts→alternative. Suppression "Best for / Not ideal if" inline dans la sidebar.

Hero 2-col (déprécié en session 3). Sticky sidebar : bug corrigé — `position: sticky` mis sur `.td-sidebar-desktop` (grid item direct) et non sur un enfant.

---

## 2026-05-16 — Sprint 8 : Ticker logos obligatoire + header actions clarifié

### Objectif
Réconcilier le ticker Awwwards avec la valeur produit ToolTrim : chaque décision doit rester fine, mais toujours montrer les logos des outils concernés.

### Fichiers modifiés
- `src/components/home/TickerBar.tsx` — ticker court avec logos obligatoires et fallback lettre.
- `src/components/home/StatsSection.tsx` — header de section remplacé par “Trois façons de décider”.
- `src/index.css` — classes `home-decision-ticker*` et `ticker-*`, hauteur 44px, séparateurs visibles.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Détails
- Items courts : Loom, Slack Pro, Zoom + Teams, Zapier, HubSpot → Brevo, Figma + Sketch, Harvest + Pennylane, Coda + Notion.
- Logos en pills 26px, image max 17px, fallback initiale.
- Séparation principale via `border-right: 1px solid #DADAD4`.
- Motion respectueuse de `prefers-reduced-motion`.

---

## 2026-05-16 — Sprint 9 : Section position et tri

### Objectif
Renforcer la section "Pas un annuaire" pour en faire un vrai bloc de positionnement et de décision ToolTrim.

### Fichiers modifiés
- `src/components/home/DiffTable.tsx` — remplacement de la table comparative par un module Garder / Couper / Remplacer.
- `src/index.css` — styles `home-position-*` et `home-decision-*`.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Détails
- Nouveau titre : "Pas un annuaire. Un outil de tri."
- Layout desktop 2 colonnes : position à gauche, intro + module de décision à droite.
- Fond #EDEDE8, bordures simples, aucune carte blanche, icône ou gradient.

---

## 2026-05-16 — Sprint 9b : ManifestoSection réellement rendu

### Correction
Le rendu visible de la home utilisait encore un `ManifestoSection` hardcodé dans `src/pages/HomePage.tsx`, placé avant `DiffTable`. La tentative précédente avait modernisé `DiffTable`, mais pas ce bloc rendu en priorité.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — remplacement du JSX `ManifestoSection` par le nouveau module de tri.
- `src/index.css` — styles appliqués aux classes réellement rendues.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Ancien titre supprimé du composant rendu.
- Anciennes lignes "Quel outil garder / couper / remplacer" supprimées.
- Nouveau module `+ GARDER / – COUPER / → REMPLACER` rendu dans la section.

---

## 2026-05-16 — Sprint 10 : Diagramme de décision home

### Objectif
Ajouter du rythme visuel dans la section de positionnement sans illustration générique : montrer comment ToolTrim transforme une stack brute en décisions concrètes.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — ajout du module `EXEMPLE DE TRI` dans `ManifestoSection`, avec logos et fallback initiale.
- `src/index.css` — styles du module `home-stack-*`, connecteur et lignes de décision responsive.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Une stack brute Notion / Trello / ClickUp / Zapier / Loom / Canva est triée visuellement.
- Les décisions affichées sont `À garder`, `À couper`, `À remplacer` et `À challenger`.
- Les logos gardent leurs couleurs natives ; aucune image statique ou décoration gratuite ajoutée.

---

## 2026-05-16 — Sprint 11 : Section éditoriale + cloud de logos

### Objectif
Remplacer le bloc de positionnement trop explicatif par une section plus premium : moins de texte, une idée plus nette, et un cloud de logos animé qui montre le bruit créé par l'accumulation d'outils.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — reconstruction de `ManifestoSection` avec copy courte et cloud animé.
- `src/index.css` — styles `home-noise-*` et `home-logo-cloud-*`, animation douce et reduced motion.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Anciennes rows `Garder / Couper / Remplacer` supprimées de la section.
- Nouveau titre : `Trop d'outils. Pas assez de décisions.`
- Cloud de 16 logos colorés avec labels discrets `À garder`, `À couper`, `À remplacer`.

---

## 2026-05-16 — Sprint 12 : Raffinement du cloud éditorial

### Objectif
Rendre la section plus naturelle et premium : copy moins générique, cloud moins "panel UI", décisions mieux intégrées dans la composition.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — copy affinée, positions du cloud resserrées, classes de profondeur et de motion par logo.
- `src/index.css` — container plus atmosphérique, ombre subtile, labels avec blur, axe discret et animations différenciées.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Subtitle retenu : `Un outil de plus paraît souvent anodin. Jusqu’au moment où ta stack devient illisible.`
- Closing retenu : `ToolTrim transforme le bruit en décisions : garder, couper, remplacer.`
- Ajout du label discret `À challenger` sans densifier la copy principale.

---

## 2026-05-16 — Sprint 13 : Cloud de logos plus structuré

### Objectif
Renforcer uniquement la zone droite de la section de positionnement : plus de densité, plus de profondeur, et une lecture plus claire de la stack comme ensemble.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — ajout de Framer et Webflow, nouvelle composition à 18 logos, classes de profondeur et motion enrichies.
- `src/index.css` — container plus fort, inner frame, axe discret, tailles 46/58/72, profondeur foreground/mid/back et animation `floatLogoD`.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- La composition devient plus dense au centre et moins uniformément dispersée.
- Les labels décisionnels restent intégrés au cloud, sans créer de diagramme.
- La motion reste ambiante et respecte `prefers-reduced-motion`.

---

## 2026-05-16 — Sprint 14 : Section diagnostic des coûts cachés

### Objectif
Transformer la section `Ce que ToolTrim coupe` en bloc de diagnostic plus lisible : labels métier, exemples plus visibles et CTA rattaché à la liste.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — nouveau titre, intro courte, labels `DOUBLON / DORMANT / TROP TÔT / TROP LOURD / TROP CHER`.
- `src/index.css` — rows diagnostiques, grille label/contenu, exemples sans italique, CTA aligné à la colonne texte.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Les puces génériques disparaissent.
- La section explique mieux ce que ToolTrim détecte avant l'audit.
- Les exemples deviennent un élément de preuve, pas une note secondaire.

---

## 2026-05-17 — Sprint 15 : Suppression section visuelle Trois façons

### Objectif
Retirer de la home la section doublon avec chips statistiques et cartes visuelles `Couper / doublons / downgrade`, devenue trop lourde par rapport à la nouvelle direction éditoriale.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — suppression du rendu `StatsSection` et de son import.
- `src/components/home/StatsSection.tsx` — composant supprimé car il n'était plus référencé ailleurs.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- La home passe directement de `BusinessObjectivesSection` à `PersonasSection`.
- Les 3 cartes principales `AUDIT / STACK / COMPARER` sont conservées.
- CSS `home-actions-*` / `hac-*` conservé car partagé avec les cartes principales.

---

## 2026-05-17 — Sprint 16 : Fusion diagnostic et résultat

### Objectif
Fusionner la section `Ce qui pèse` et la section `Résultat concret` pour raconter une seule séquence : diagnostic → décision → résultat.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — intégration des tableaux avant/après dans `WhatWeCutSection`, suppression du rendu et du composant `AvantApresSection`.
- `src/index.css` — styles `hp-result-*`, spacing de section unifié et CTA unique.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Une seule section explique ce que ToolTrim révèle et montre un exemple de résultat.
- Le wording précise que l'économie est un exemple, pas une promesse.
- Le CTA `Auditer ma stack` n'apparaît plus qu'une fois dans ce bloc.

---

## 2026-05-17 — Sprint 17 : Suppression position/process redondants

### Objectif
Alléger la home en supprimant deux blocs devenus redondants avec la nouvelle direction : l'ancien bloc position `Pas un annuaire` et le bloc sombre `Processus`.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — suppression des rendus `HowItWorks` et `DiffTable` et de leurs imports lazy.
- `src/components/home/HowItWorks.tsx` — composant supprimé car non référencé ailleurs.
- `src/components/home/DiffTable.tsx` — composant supprimé car non référencé ailleurs.
- `src/index.css` — suppression des styles exclusifs `home-position-*` / `home-decision-*` du bloc `Pas un annuaire`.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Les sections `NOTRE POSITION` et `Processus` ne sont plus rendues sur la home.
- La home enchaîne directement `PersonasSection` vers `TestimonialsSection`.
- Les styles du ticker `home-decision-ticker-*` sont conservés car ils appartiennent à la barre animée.

---

## 2026-05-17 — Sprint 18 : Diagnostic et résultat dans une seule lecture

### Objectif
Rendre la zone `Ce que ToolTrim révèle` réellement unifiée : le diagnostic, l'exemple chiffré et les tableaux avant/après doivent se lire comme une seule composition, pas comme deux sections successives.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — déplacement du résumé `9 outils, 123 €/mois → 5 outils, 48 €/mois` dans la colonne gauche, intégration du panel `Avant / Après ToolTrim` sous les lignes diagnostiques à droite, suppression du wrapper résultat pleine largeur.
- `src/index.css` — nouvelle grille diagnostic/résultat, résumé chiffré à gauche, panel avant/après compact dans le flux droit, suppression des styles de bloc résultat autonome.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- La section ne présente plus `EXEMPLE DE RÉSULTAT` comme un second bloc.
- Le CTA `Auditer ma stack` reste unique et rattaché à la colonne de décision.
- Les tableaux avant/après restent visibles, mais ne dominent plus la section.

---

## 2026-05-17 — Sprint 19 : Diagnostic home simplifié

### Objectif
Réécrire la section diagnostic/résultat pour la rendre plus calme, plus lisible et moins accusatoire, en retirant les tableaux avant/après trop complexes.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — nouveau wording `Ce que tu paies encore`, lignes diagnostiques raccourcies, suppression des tableaux `Avant / Après ToolTrim`, ajout d'une carte résultat compacte.
- `src/index.css` — fond plus doux, rows simplifiées label/exemple, carte résultat compacte, suppression des styles de panel résultat dans cette section.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Le bloc ne contient plus de tableaux avant/après.
- Les cinq signaux sont plus courts et plus faciles à scanner.
- Le résultat chiffré reste présent, mais comme exemple indicatif dans une carte légère.

---

## 2026-05-17 — Sprint 20 : Méthode orientée contexte

### Objectif
Rendre la section méthode moins générique en montrant que ToolTrim part du contexte réel avant toute recommandation.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — nouveau titre `On part de ton contexte`, ajout du sous-texte, réécriture des trois étapes et exemples.
- `src/index.css` — style du sous-texte méthode et légère remontée de visibilité des numéros `01 / 02 / 03`.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- La méthode met en avant profil, niveau, budget, TJM et usages réels.
- Les étapes évitent le vocabulaire trop générique ou technique.
- La grille existante reste inchangée visuellement.

---

## 2026-05-17 — Sprint 21 : Profils contextualisés

### Objectif
Rendre la section `Chaque profil` plus crédible et moins dashboard, en supprimant les économies fixes et en clarifiant que les recommandations changent selon le contexte.

### Fichiers modifiés
- `src/components/home/PersonasSection.tsx` — nouveau wording `Chaque profil a ses angles morts`, tabs plus courtes, suppression des montants `-€/an`, remplacement par `Budget à recalibrer` / `Abonnements évitables` et colonne `Recommandation ToolTrim`.
- `src/index.css` — nouvelle direction claire et éditoriale pour `home-profile-*`, tabs sobres, panel blanc 3 colonnes, CTA noir.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Plus de promesse d'économie moyenne non sourcée dans cette section.
- La lecture passe de `claim chiffré` à `stack typique → signaux → recommandation`.
- Le bleu dominant disparaît au profit du système noir / gris / blanc de la home.

---

## 2026-05-17 — Sprint 22 : Remplacement témoignages par cas types

### Objectif
Remplacer la section de faux témoignages par une section plus honnête et utile : des cas types repérés par ToolTrim, sans portraits, sans citations inventées et sans promesses d'économies non vérifiées.

### Fichiers modifiés
- `src/components/home/TestimonialsSection.tsx` — suppression du carousel, des portraits, des citations et des montants ; ajout de trois cartes `Designer freelance`, `Fondateur early-stage`, `Solopreneur IA`.
- `src/pages/HomePage.tsx` — commentaire de section mis à jour en `Cas types`.
- `src/index.css` — styles `home-case-*` pour une section claire, sobre, alignée avec la direction éditoriale de la home.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Aucun portrait ni initiales fictives ne sont rendus dans cette section.
- Les claims chiffrés de type `-€/an` disparaissent.
- Le bloc devient une lecture `profil → situation → stack → signal → décision`.

---

## 2026-05-17 — Sprint 23 : Guides home orientés décision

### Objectif
Transformer la section Guides de la home en contenu d'aide à la décision, plutôt qu'en simple flux de blog avec extraits SEO tronqués.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — remplacement des cartes dynamiques issues des posts par trois cartes éditoriales hardcodées pour la home : facturation, compétences IA, stack IA freelance.
- `src/index.css` — styles `home-guide-*` : cartes sans troncature, footer meta/CTA, hover sobre.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Le titre devient `Lire pour mieux décider.`.
- Chaque carte indique la décision que le guide aide à prendre.
- Les extraits tronqués et les titres SEO longs ne sont plus utilisés dans cette section.

---

## 2026-05-17 — Sprint 24 : Stacks par objectif en cartes de recommandation

### Objectif
Transformer la section `Stacks par objectif` pour qu'elle ressemble à des recommandations ToolTrim calibrées par profil, budget et outils, plutôt qu'à des cartes éditoriales avec photos génériques.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — nouveau titre `Des stacks calibrées pour ton usage`, ajout du sous-texte, suppression du rendu des photos, remplacement par un panneau de stack avec budget cible, logos/pastilles d'outils et ligne `À challenger`.
- `src/index.css` — styles `home-stack-*` pour les cartes de recommandation, panneaux de stack, logos et footer meta/CTA.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Les photos stock ne sont plus rendues dans cette section.
- Les économies fixes de type `-58€` disparaissent de la home.
- Chaque carte affiche un budget cible, des outils clés et un angle de décision.

---

## 2026-05-17 — Sprint 25 : Audit global homepage

### Objectif
Nettoyer la home après les itérations successives pour retrouver une narration cohérente : ToolTrim part du profil, du niveau, du budget, du TJM, des usages et de la stack existante, plutôt que d'empiler des listes d'outils.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — nettoyage des anciennes URLs de photos stock dans les données de stacks, mise à jour des métadonnées SEO et alignement de la FAQ sur le conteneur global.
- `src/components/home/FinalCTA.tsx` — remplacement de la promesse chiffrée `847€/an` par un CTA final plus calme et contextualisé.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Les anciens marqueurs de comparateur générique et de promesse d'économie non sourcée sont retirés de la home.
- La FAQ utilise le même système de grille que les autres sections.
- Le CTA final revient à la promesse centrale : auditer la stack depuis le profil, le budget et les usages réels.
- La meta description de la home intègre désormais le TJM dans les critères de recommandation.

---

## 2026-05-17 — Sprint 26 : Flux visuel homepage

### Objectif
Retirer les séparateurs pleine largeur trop présents sur la homepage pour retrouver un rythme plus fluide, premium et éditorial.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — ajout d'une classe racine `home-page` pour limiter les ajustements à la home.
- `src/index.css` — override scoped supprimant les `border-top` / `border-bottom` des wrappers de sections homepage, sans toucher aux bordures internes.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — règle de rythme homepage documentée.

### Résultat
- Les coupes horizontales entre sections sont supprimées sur la home.
- Les bordures du ticker, des cartes, des lignes de diagnostic et des panels restent intactes.
- La séparation repose davantage sur l'espacement, les fonds et la grille commune.

---

## 2026-05-17 — Sprint 27 : Carte d'audit hero

### Objectif
Rendre la carte d'audit du hero plus précise et moins dashboard, sans changer le message du hero ni le rôle de la preview.

### Fichiers modifiés
- `src/components/home/HeroSection.tsx` — footer de carte regroupé, wording budget/disclaimer simplifié.
- `src/index.css` — styles `hp-audit-*` affinés : ombre réduite, grille plus nette, labels décisionnels textuels, CTA secondaire en lien discret.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- La preview ressemble davantage à une fiche de décision ToolTrim qu'à un widget SaaS.
- Le CTA de la carte ne concurrence plus le CTA principal du hero.
- Les logos, outils, décisions, budget cible et disclaimer restent présents.

---

## 2026-05-17 — Sprint 28 : Alignement copy et conversion homepage

### Objectif
Aligner la homepage sur la promesse conversion : auditer une stack freelance existante, repérer les doublons et abonnements inutiles, puis recommander selon profil, budget, TJM et usage réel.

### Fichiers modifiés
- `src/components/Navbar.tsx` — label `Alternatives` remplacé par `Comparatifs`, CTA desktop `Auditer ma stack`, lien `Soumettre un outil` rendu plus discret.
- `src/components/home/HeroSection.tsx` — nouveau H1, nouveau sous-texte et disclaimer de preview basé sur un profil freelance type.
- `src/pages/HomePage.tsx` — copy des sections action cards, différence, diagnostic, méthode, stacks, guides, FAQ et metadata mise à jour.
- `src/components/home/PersonasSection.tsx` — suppression du profil `DSI PME` et sous-texte resserré autour des profils freelance/solo.
- `src/components/home/TestimonialsSection.tsx` — sous-texte des cas types aligné sur la logique profil.
- `src/components/home/FinalCTA.tsx` — nouveau CTA final plus direct.
- `src/index.css` — hiérarchie visuelle nav/CTA ajustée.

### Résultat
- La page utilise un ton cohérent en `tu`.
- Le CTA principal devient clairement `Auditer ma stack`.
- Les comparatifs sont nommés comme tels dans la navigation.
- La FAQ commence par indépendance, gratuité, fonctionnement, durée et fiabilité.
- Le positionnement public sort du comparateur générique pour revenir à l'audit de stack freelance.

---

## 2026-05-17 — Sprint 29 : Page stacks contextuelle

### Objectif
Transformer `/fr/stacks` en outil de sélection contextualisé plutôt qu'en liste générique : profil, sous-profil, objectif, budget, niveau, complexité, type de stack et recherche.

### Fichiers modifiés
- `src/pages/StacksPage.tsx` — hero réécrit, filtres URL-persistants, sous-profils dépendants du profil, chips de filtres actifs, grille de cards décisionnelles.
- `src/data/stacks.ts` — ajout de helpers dérivés pour `budgetRange`, `level`, `complexity`, `stackType`, `toolCount`, verdict et outils à garder/challenger.
- `src/index.css` — grille 280px / résultats, cards stack en 2 colonnes, filtres et chips actifs.
- `src/components/StackCardEditorial.tsx` — supprimé : l'ancien composant n'était plus utilisé et créait un deuxième système de cards stack.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` — documentation alignée.

### Résultat
- `/fr/stacks` conserve les données existantes sans casser les fiches détail.
- Les filtres se partagent via query params et se combinent en logique `AND`.
- Les compteurs globaux trompeurs sont retirés.
- Les cards affichent désormais verdict, idéal si, à éviter si, budget cible, niveau, complexité et logos outils.

---

## 2026-05-17 — Sprint 30 : UX facettes stacks

### Objectif
Repenser les filtres de `/fr/stacks` comme une description de situation freelance plutôt qu'un filtrage produit.

### Fichiers modifiés
- `src/pages/StacksPage.tsx` — sidebar réorganisée en `Ton contexte`, `Ton besoin`, `Affiner`; spécialités/objectifs/types en multi-sélection; logique `AND` entre facettes et `OR` dans les facettes multiples; chips actifs supprimables; query params multi-valeurs.
- `src/index.css` — styles des groupes de facettes, options multi-sélection, états désactivés et message de spécialité dépendante.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md`, `docs/ARCHITECTURE.md` — documentation du nouveau pattern.

### Résultat
- `Profil` reste single-select et réinitialise les spécialités quand il change.
- `Spécialité` n'apparaît qu'après choix d'un profil et permet plusieurs choix.
- `Objectif` et `Type de stack` permettent plusieurs choix en logique `OR`.
- Les filtres impossibles sont désactivés au lieu d'afficher des compteurs globaux trompeurs.
- L'URL peut partager une combinaison comme `?profile=designer&specialty=brand,ui-ux&objective=produce,organize&budget=30-80`.

---

## 2026-05-17 — Sprint 31 : Template détail stack décisionnel

### Objectif
Transformer `/fr/stacks/developpeur-freelance-shipper` en page de décision : pour qui, budget cible, outils essentiels, optionnels, à challenger, limites de calibration.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — hero enrichi avec profil/spécialité, budget, niveau, complexité, verdict, `Idéal si` / `À éviter si`; ajout du bloc `La décision ToolTrim`; contenu éditorial spécifique dev shipper; outils regroupés par rôle métier; section `Quand cette stack devient mal calibrée`.
- `src/index.css` — styles `sd-*` pour résumé décisionnel, rows outil avec fiche produit, calibration trop légère/trop lourde, budget note.
- `docs/CHANGELOG_AI.md`, `docs/ARCHITECTURE.md` — documentation du nouveau template.

### Résultat
- La page ne lit plus comme une simple fiche descriptive : elle expose quoi garder, quoi challenger et quoi éviter dès le haut.
- Les outils affichent logo, rôle, raison, prix/plan indicatif, décision et lien vers la fiche outil.
- Le budget est présenté comme cible de calibration, sans promesse d'économie exacte.
- Les fallbacks s'appuient sur `tools[]`, `decision`, `bestFor`, `avoidIf`, `monthlyBudget`, `stage` et `getStackDerivedFields`.

---

## 2026-05-17 — Sprint 32 : Typographie et rythme détail stack

### Objectif
Rendre `/fr/stacks/developpeur-freelance-shipper` plus contrôlé et scalable sans réécrire le contenu ni modifier la logique produit.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — micro-ajustement des CTA inline et de la métrique risque pour respecter l'échelle typographique.
- `src/index.css` — surcouche `sd-*` pour H1, sous-titre hero, H2, corps, métadonnées, largeur de shell, grille hero, rows outils, labels décisionnels et espacements sectionnels.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du scale détail stack.

### Résultat
- Le H1 plafonne à 104px avec line-height plus serré, les H2 suivent un scale commun et les textes longs reviennent sur une lecture 16px / 1.5.
- Le shell détail stack est limité à 1240px, avec une colonne résumé maîtrisée à 360px.
- Les lignes outils gagnent en scannabilité : nom 18px, raison/rôle 15px, label décisionnel 11px en pastille sobre.
- Les séparateurs pleine largeur du template sont adoucis au profit d'un rythme par espacements.

---

## 2026-05-17 — Sprint 33 : Nettoyage éditorial stack dev

### Objectif
Nettoyer la page `/fr/stacks/developpeur-freelance-shipper` sans toucher au template : ton plus naturel, moins d'anglais, suppression des tirets longs rendus et meilleure lisibilité des labels.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — H1 remplacé par `Dev freelance qui livre`, sous-titre hero simplifié, heading décisionnel réécrit, note ToolTrim renommée `Astuce` / `Réglage utile`, CTA diagnostic et stacks proches réécrits.
- `src/index.css` — puces CSS `sd-*` remplacées par des points sobres pour éviter les tirets longs rendus dans les listes.
- `docs/CHANGELOG_AI.md` — ce suivi.

### Résultat
- La page ne présente plus `shipper` dans le H1.
- Le hero ne répète plus la même idée entre sous-titre et verdict.
- La section décision devient `CE QU'ON GARDE, CE QU'ON ÉVITE` / `Simple par choix, pas par manque.`
- Les tirets longs visibles dans les blocs de cette page sont remplacés par deux-points, phrases naturelles ou puces simples.

---

## 2026-05-17 — Sprint 34 : Navigation d'ancre détail stack

### Objectif
Rendre la navigation interne de `/fr/stacks/developpeur-freelance-shipper` plus claire et plus utile sans changer le contenu ni la structure des sections.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout d'un état actif `activeSection`, scrollspy via `IntersectionObserver`, `aria-current="location"`, label accessible `Navigation de la page` et libellé discret `Sur cette page`.
- `src/index.css` — style segmenté compact, sticky sous le header, fond translucide avec blur, offset d'ancres et smooth scroll respectant `prefers-reduced-motion`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern d'ancre.

### Résultat
- La barre reste visible au scroll sans ressembler à une seconde navigation globale.
- Le lien actif se met à jour au clic et au scroll.
- Les ancres atterrissent sous le header sticky grâce à `scroll-margin-top`.
- Sur mobile, la navigation reste horizontale avec scroll interne, sans scroll horizontal de page.

---

## 2026-05-17 — Sprint 35 : Hero détail stack, architecture décisionnelle

### Objectif
Renforcer le hero du template StackDetailPage sans réécrire la page : hiérarchie plus claire, fit/avoid moins tableau, carte droite moins administrative.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout d'une phrase contexte, remplacement du bloc `Idéal si / À éviter si` par deux cartes éditoriales, refonte de la carte `En un coup d'œil` en budget + facts grid + `À surveiller` + logos clés.
- `src/index.css` — grille hero `1fr + 380px`, gap plus ample, cartes `stack-fit-*`, budget fort, facts grid, blocs internes espacés sans séparateurs ligne par ligne.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du nouveau pattern hero quick-read.

### Résultat
- Le hero lit d'abord le contexte, puis la décision, puis l'action.
- La carte droite n'est plus une table d'administration : le budget devient l'ancre visuelle et les infos secondaires sont regroupées.
- Les logos clés passent à 6 visibles maximum avec pastilles 32px et `+N`.
- Le même template reste compatible avec les autres stacks, dont architecte d'intérieur.

---

## 2026-05-17 — Sprint 36 : Outils stack en chaîne de workflow

### Objectif
Remplacer la lecture table/cards de la section `02 — OUTILS` par une compréhension en 5 secondes : workflow d'abord, socle ensuite, inventaire complet en secondaire.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout d'un mapping de workflow par stack cible, rendu `La chaîne de travail`, blocs `Le socle à garder`, `À activer selon le projet` et inventaire complet secondaire.
- `src/index.css` — styles des nodes workflow, connecteurs, chips de socle/options et inventaire compact.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern.

### Résultat
- `/fr/stacks/architecte-interieur` lit désormais Brief → Moodboard → Plans → 3D → Rendu → Sourcing → Budget → Validation → Facturation.
- `/fr/stacks/developpeur-freelance-shipper` et `/fr/stacks/designer-freelance-solo` utilisent la même logique de chaîne contextualisée.
- Les outils Socle / Conditionnel / À challenger restent visibles, mais la liste complète n'est plus le premier contact avec la section.

---

## 2026-05-17 — Sprint 37 : Inventaire intégré dans le workflow

### Objectif
Supprimer la redondance entre workflow et inventaire complet dans `02 — OUTILS` : la chaîne devient l'interface principale et contient elle-même tous les détails via disclosure.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — remplacement des blocs séparés socle/options/inventaire par des nodes workflow expansibles avec aperçu, résumé de compte et détails par statut.
- `src/index.css` — grille workflow 3/2/1 colonnes, état ouvert, détails intégrés et rows compactes dans chaque node.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern workflow intégré.

### Résultat
- Plus de section `Inventaire complet` séparée sous le workflow.
- Chaque étape affiche le socle en aperçu et expose Conditionnel / À challenger au clic.
- Le premier node important est ouvert par défaut selon la stack.

---

## 2026-05-17 — Sprint 38 : Module outils stack non redondant

### Objectif
Finaliser `02 — OUTILS` comme un seul module workflow, sans inventaire séparé ni couches redondantes héritées des itérations précédentes.

### Fichiers modifiés
- `src/index.css` — suppression des styles morts `sd-inventory`, `sd-stack-essentials` et `sd-stack-options`.
- `docs/DESIGN_SYSTEM.md` — retrait de l'ancien pattern workflow + inventaire séparé au profit du pattern intégré.
- `docs/CHANGELOG_AI.md` — ce suivi.

### Résultat
- Le code ne garde plus de styles pour une section `Inventaire complet` séparée.
- Le pattern documenté est désormais unique : workflow nodes + détails intégrés.

---

## 2026-05-17 — Sprint 39 : Stack par étape

### Objectif
Adapter le principe `Stack by Layer` à ToolTrim sans copier StackShare : la section `02 — OUTILS` présente la stack comme un workflow de décision, pas comme une liste d'outils.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — framing `La stack par étape`, subtitle orienté workflow et aria-label du module ajusté.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern ToolTrim `stack by workflow`.

### Résultat
- Le module reste unique : nodes workflow + détails intégrés.
- Aucun inventaire séparé, table ou liste complète redondante n'est rendu sous la grille.

---

## 2026-05-17 — Sprint 40 : Reframing Stack by Workflow

### Objectif
Aligner le wording de `02 — OUTILS` sur le modèle mental `Stack by Workflow` : la section explique comment un freelance travaille, pas seulement quels outils sont groupés.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — titre `La stack par workflow`, sous-titre `On ne choisit pas des outils un par un...`, label accessible du module ajusté.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du framing.

### Résultat
- Le module reste unique : nodes workflow + disclosure intégré.
- Aucun inventaire séparé, table ou matrice décisionnelle n'est rendu dans `02 — OUTILS`.

---

## 2026-05-18 — Sprint 41 : Stack detail structurée par workflow

### Objectif
Finaliser les pages détail stack autour de la lecture `profil → workflow → décisions`, avec `02 — OUTILS` comme module unique et non redondant.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — objectifs courts par étape pour architecte intérieur, dev freelance et designer solo ; ajout du signal discret `À surveiller` sur les nodes trop chargés en conditionnel/challenge.
- `src/index.css` — style du marqueur workflow `À surveiller`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern final.

### Résultat
- La section outils reste une seule grille `Stack by Workflow`, avec détails accessibles dans chaque node.
- Les outils restent tous accessibles via disclosure, sans inventaire complet séparé ni table-first layout.
- Le poids d'une étape est lisible via le résumé de compte et le marqueur `À surveiller` quand il apporte une vraie information.

---

## 2026-05-18 — Sprint 42 : Stack detail orientée workflow-first

### Objectif
Recentrer la page détail dev freelance sur la lecture `profil → workflow → décisions`, pour éviter le framing générique “base recommandée” et clarifier que la stack sert une chaîne de travail.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — copie hero, metadata SEO, overview, budget et sous-titre `02 — OUTILS` spécifiques à `developpeur-freelance-shipper`.
- `src/data/stacks.ts`, `vite.config.ts` — alignement de la description statique/pré-rendue pour éviter l'ancien framing “base recommandée” et “stack divisée par usages”.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de la règle d'information ownership.

### Résultat
- Le hero explique d'abord le workflow dev : coder, montrer, documenter, encaisser.
- La meta description ne dit plus “stack divisée par usages, risques et alternatives”.
- `02 — OUTILS` reste le seul module d'outils, avec nodes workflow et détails intégrés.

---

## 2026-05-18 — Sprint 43 : Stack Map Sana-inspired

### Objectif
Remplacer les nodes workflow trop interactifs par une carte de stack plus calme : familles de travail à gauche, grille de logos à droite, statuts discrets et disclosure seulement quand une famille dépasse 6 outils.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout des familles `Stack Map` par stack cible et remplacement du rendu `02 — OUTILS` par des blocs de workflow.
- `src/index.css` — styles des blocs `sd-stack-map`, grille logo + label, statut discret et comportement responsive.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern Stack Map.

### Résultat
- `02 — OUTILS` affiche `La carte de la stack.`
- Les outils restent tous accessibles dans les familles de workflow, sans inventaire séparé ni table.
- Les statuts restent `Socle`, `Conditionnel`, `À challenger`, lisibles sans code couleur.

---

## 2026-05-18 — Sprint 44 : Vue d'ensemble simplifiée

### Objectif
Réduire `01 — VUE D'ENSEMBLE` à son rôle principal : qualifier rapidement si la stack correspond à la façon de travailler de l'utilisateur.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — suppression du rendu des chips workflow et de la note ToolTrim dans l'overview ; labels de qualification standardisés.
- `src/index.css` — ajout d'une ligne workflow légère et réduction de l'espacement avant les trois blocs.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du rôle limité de l'overview.

### Résultat
- Plus de bloc `Note ToolTrim` dans `Vue d'ensemble`.
- Plus de chips workflow redondants avant `La carte de la stack`.
- Les trois blocs restent centrés sur `Pour qui`, `Ce que ça évite`, `Quand passer plus lourd`.

---

## 2026-05-18 — Sprint 45 : Budget en module de décision

### Objectif
Transformer `03 — BUDGET` en aide à la décision plutôt qu'en tableau de prix : expliquer quoi payer, ce qui peut rester gratuit, ce qui fait grimper la facture et quand auditer.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — remplacement des rows budget par trois blocs de décision, chips d'outils et bande de seuils.
- `src/index.css` — styles du module budget, seuils compacts et chips logo.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de la propriété d'information du budget.

### Résultat
- Le budget répond à `Combien payer, et pour quoi ?`.
- La table `Budget minimal / recommandé / à surveiller` n'est plus le contenu principal.
- Le CTA `Auditer ma stack` apparaît après les seuils pour guider l'action.

---

## 2026-05-18 — Sprint 46 : Vue d'ensemble comme qualification

### Objectif
Réécrire `01 — VUE D'ENSEMBLE` pour les pages stack clés afin qu'elle réponde à `Est-ce que cette stack correspond à ma façon de travailler ?`, sans répéter le hero ni la carte des outils.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — titres, intros et blocs de qualification dédiés pour dev freelance, sites IA & automation, designer freelance solo et architecte intérieur.
- `src/index.css` — allègement des blocs overview et suppression du style de ligne workflow devenue inutile.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du rôle qualification de l'overview.

### Résultat
- Les blocs `POUR QUI`, `CE QUE ÇA ÉVITE`, `QUAND PASSER PLUS LOURD` deviennent la structure standard.
- Les listes de capacités et les détails de workflow restent hors de l'overview.
- Le slug demandé `sites-ia-automation` est résolu vers la stack source `createur-sites-ia-automation`.

---

## 2026-05-18 — Sprint 47 : Hero stack decision map

### Objectif
Faire du hero la vraie carte de décision de la fiche stack : cible, promesse, couverture, condition d'évitement, budget, niveau, complexité, vigilance et outils clés visibles immédiatement.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout du helper hero decision map par stack clé, suppression du rendu de `Vue d'ensemble`, navigation d'ancre démarrant à `Outils`, panel `En un coup d'œil` enrichi avec le workflow.
- `src/index.css` — cartes hero en grille de qualification, bloc workflow dans le snapshot et retrait de l'ancre `apercu`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du nouveau rôle du hero et de la suppression de l'overview redondante.

### Résultat
- Les pages stack se comprennent dès le hero, sans attendre une section overview.
- `Outils` devient la première ancre de page.
- `Vue d'ensemble` n'est plus rendue comme section autonome sur le template stack detail.

---

## 2026-05-18 — Sprint 48 : Comparatifs orientés décision

### Objectif
Reprendre les pages comparatif avec la même logique que les fiches stack : verdict visible tôt, table resserrée, cas d'usage concrets et points de vigilance spécifiques.

### Fichiers modifiés
- `src/pages/ComparePage.tsx` — hero signalétique, panel décision rapide, verdict ToolTrim renforcé, table limitée aux critères utiles, remplacement des blocs redondants par `Cas d'usage` et `Points de vigilance`.
- `src/pages/ComparesIndexPage.tsx` — cartes enrichies avec question centrale et signal `Meilleur pour`.
- `src/index.css` — styles `cp-decision-panel`, `cp-usecase-*`, `cp-watchout-*`, `cix-card-question` et `cix-card-signal`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du nouveau flux décisionnel.

### Résultat
- Le comparatif répond plus vite à `quel outil choisir ?`.
- La table n'est plus l'inventaire principal, mais un module de vrais écarts.
- Les anciens blocs `Ce que fait chaque outil`, `Avantages et limites`, `Critères de décision` et `Profils` ne sont plus rendus comme couches séparées.

---

## 2026-05-18 — Sprint 49 : Comparatifs alignés système Stack

### Objectif
Aligner les pages comparatif avec la logique des fiches stack : hero en fiche signalétique, navigation sticky bottom, sections numérotées et information non redondante.

### Fichiers modifiés
- `src/pages/ComparePage.tsx` — hero sans panneau droit, fact sheet comparatif, `CompareStickyNav`, sections numérotées et libellés clarifiés.
- `src/index.css` — styles du hero fact sheet et de la sticky nav comparatif en capsule basse.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de la structure comparatif stack-like.

### Résultat
- Le hero répond immédiatement à `de quoi parle ce comparatif et quel choix dois-je faire ?`.
- La navigation de page reprend l'esprit des fiches stack, cachée sur mobile pour préserver la lecture.
- Les sections suivent le flux : verdict, comparer, cas d'usage, attention, alternatives, FAQ.

---

## 2026-05-18 — Sprint 50 : Profondeur décisionnelle des comparatifs

### Objectif
Enrichir les pages comparatif avec un modèle éditorial ToolTrim capable d'expliquer non seulement `qui gagne`, mais dans quel contexte, à quel coût réel et à partir de quel seuil l'autre outil devient plus pertinent.

### Fichiers modifiés
- `src/pages/ComparePage.tsx` — ajout des champs `finalRecommendation`, `decisiveCriteria`, `tippingPoint`, `costReality` et `tooltrimRisks`, avec fallback pour les comparatifs non éditorialisés.
- `src/pages/ComparesIndexPage.tsx` — ajout du signal de risque principal sur les cartes comparatif.
- `src/index.css` — styles des critères décisifs, seuil de bascule, coût réel et points d'attention enrichis.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du modèle décisionnel enrichi.

### Résultat
- La page compare d'abord les vrais écarts avant de montrer le tableau.
- Le seuil de bascule devient une section dédiée.
- Le coût réel distingue prix affiché, moment où payer et coût caché.
- Les points d'attention décrivent erreur, conséquence et recommandation ToolTrim.

---

## 2026-05-18 — Sprint 51 : Comparatifs en battle utile

### Objectif
Transformer les pages comparatif en battles utiles : deux outils visibles face-à-face, verdict ToolTrim au centre, signaux d'adéquation qualitatifs et scores par usage sans notation opaque.

### Fichiers modifiés
- `src/pages/ComparePage.tsx` — hero battle face-à-face, fact sheet recentrée sur le choix, navigation sticky `Scores`, section `Scores par usage` et suppression du bloc cas d'usage redondant.
- `src/index.css` — styles `cp-battle-*` et `cp-score-*`, fact sheet hero simplifiée en grille compacte.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern battle utile et des scores qualitatifs.

### Résultat
- Le comparatif démarre par `quel outil est juste pour quel usage ?`, pas par une table.
- Les scores restent éditoriaux : `Avantage`, `Suffisant`, `Dépend`.
- Le flux suit : Verdict, Scores, Comparer, Seuil, Coût, Erreurs, Alternatives, FAQ.

---

## 2026-05-18 — Sprint 52 : Premiers comparatifs battle data

### Objectif
Brancher les premiers fichiers de données comparatif enrichies dans le rendu `ComparePage`, sans casser les fallbacks existants.

### Fichiers modifiés
- `src/data/comparison-battles/*.json` — ajout des fiches enrichies `chatgpt-vs-claude`, `notion-vs-airtable`, `figma-vs-canva`, `make-vs-zapier` et `webflow-vs-framer`.
- `src/data/comparisonBattles.ts` — registre typé des fiches battle.
- `src/pages/ComparePage.tsx` — adaptateur JSON vers le modèle éditorial ToolTrim existant.
- `src/data/comparisons.ts` — ajout de `make-vs-zapier` et `webflow-vs-framer` dans les comparatifs accessibles.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du branchement des données battle.

### Résultat
- Les cinq premiers comparatifs utilisent maintenant leurs données de décision : choix rapide, scores par usage, table des écarts, seuil de bascule, coût réel, erreurs fréquentes et FAQ.
- Les autres comparatifs gardent le fallback éditorial généré depuis les données outils.

---

## 2026-05-19 — Sprint 53 : Modèle comparatif scalable inspiré G2

### Objectif
Transformer les pages Comparatif en pages scalables et utiles : plus de fond décisionnel, plus de structure, moins de texte SEO générique. Inspiré de la structure G2 (At a glance, ratings, pricing, features, reviews, tipping point) mais avec l'angle ToolTrim : pas "A gagne contre B" mais "A est le bon choix dans ce contexte, B dans cet autre".

### Principe ToolTrim vs G2
- **G2** = marketplace d'avis et ratings, score objectif, comparaison exhaustive
- **ToolTrim** = aide à la décision contextuelle pour freelances et petites équipes — chaque section répond à une question précise

### Fichiers modifiés
- `src/pages/ComparePage.tsx` — suppression du `cp-battle-stage` dans le hero (redondant avec la fact sheet), ajout de la section `#apercu` (At a glance), réordonnancement des sections (coût avant features, seuil après features), renommage des IDs (`#scores` → `#criteres`, `#comparaison` → `#features`), mise à jour de la sticky nav avec les nouveaux labels.
- `src/index.css` — ajout des styles `.cp-aglance-*` pour la section At a glance, grille 3 colonnes avec séparateurs signalétiques.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du modèle scalable.

### Architecture de sections cible
1. Hero — table signalétique 6 faits (sans battle stage)
2. En un coup d'œil (#apercu) — grille At a glance
3. Verdict ToolTrim (#verdict) — Le choix rapide
4. Critères décisionnels (#criteres) — Les critères qui changent le choix
5. Coût réel (#cout) — Ce que tu paies vraiment
6. Features décisives (#features) — Ce qui change vraiment la décision (table filtrée)
7. Seuil de bascule (#seuil) — Quand passer de A à B
8. Points d'attention (#vigilance) — Erreurs de choix fréquentes
9. Alternatives (#alternatives) — conditionnel
10. FAQ (#faq) — conditionnel

### Sticky nav
Labels : Coup d'œil, Verdict, Critères, Coût, Features, Seuil, Attention, Alternatives, FAQ

### Fallbacks
- At a glance : toujours rendu depuis les données existantes
- Features : conditionnel si `decisionTableRows.length > 0`
- FAQ : conditionnel si `content.faq.length > 0`
- Sections absentes = non rendues, jamais de titre vide

### Résultat
- Le hero répond en 5 secondes sans double contenu
- La section At a glance oriente avant que l'utilisateur lise le verdict
- Coût réel précède les features pour ancrer la réalité budgétaire
- Le seuil de bascule clôt la partie décisionnelle avant les erreurs
- Build : ✅ 0 erreur, 156 warnings pré-existants

---

## 2026-07-15 — Explorer : exploration contextuelle transversale

### Objectif
Ouvrir une découverte associative inspirée de Pinterest depuis toute surface portant un outil précis, sans présenter les résultats comme des recommandations personnalisées.

### Fichiers modifiés
- `src/pages/ExplorerPage.tsx` — page dédiée, source sticky, angles, grille, recentrage, historique et ajout sans perte de contexte.
- `src/lib/toolExploration.ts` — modèle discriminé, classement partagé, attribution à l’outil source exact et génération centralisée des URL.
- `src/pages/CartPage.tsx` — entrées objectif/fiche de stack et redirection transparente des anciennes URL `?idees=`.
- `src/pages/ToolsPage.tsx`, `src/pages/CategoryPage.tsx`, `src/pages/SearchPage.tsx`, `src/components/ToolCardEditorial.tsx` — action Compass attachée aux cartes outil.
- `src/components/tool/StickyDecisionCard.tsx` — entrée depuis les cartes de décision desktop et mobile des fiches catalogue.
- `src/hooks/useStackPins.ts` — ajout avec classement automatique explicite et fallback `À ranger`.
- `src/components/stack/StackToolInspector.tsx` — entrée « Explorer autour de cet outil » depuis une fiche de Ma stack.
- `src/index.css` — bandeau source sticky, quatre angles toujours visibles, cartes compactes et transitions accessibles.
- `src/lib/toolExploration.test.ts`, `scripts/validate-ma-stack-e2e.mjs` — attribution multi-source, états stack, URL, navigation, ajout, migration et responsive.

### Résultat
- La page `/fr/explorer` conserve dans son URL la source, la destination éventuelle et l’angle actif.
- Le bandeau montre en permanence la source, l’origine du parcours et la règle de rangement des ajouts.
- Chaque relation nomme l’outil qui a produit le signal, y compris depuis un objectif multi-outils.
- Un clic principal change seulement la source ; le bouton `+` change seulement Ma stack et confirme l’état sur place.
- Sans destination, le rangement automatique indique l’objectif réellement choisi et conserve les cas faibles dans `À ranger`.
- Depuis un objectif, le bandeau parle désormais de découverte dans un ton simple et humain, et les filtres deviennent des thématiques métier (`Interfaces`, `Image & identité`, `Vidéo & mouvement`, `3D & rendu` pour Design).
- Les angles `Alternatives`, `Extensions` et `Usages proches` apparaissent uniquement lorsqu’un outil précis devient la source ; les cartes d’un objectif emploient le libellé plus naturel `À découvrir avec …`.
- Lorsqu’un outil devient la source, Explorer l’ouvre désormais dans un hero zoomé inspiré de Pinterest : grand aperçu canonique, identité, description, catégorie et accès à la fiche complète avant la grille associée.
- Les filtres utilisent directement la capsule flottante déjà présente sur les fiches outils : elle reste visible dès l’ouverture puis pendant le scroll, sans répéter la navigation dans le hero ni perdre la position de lecture.
- Le hero d’un objectif adopte une structure plus proche de Pinterest : flèche seule, titre central `Plus d’outils`, objectif en contexte discret et destination d’ajout compacte à droite.
- La source outil devient une carte verticale centrée d’environ une demi-largeur sur desktop : image OG complète au bon ratio, puis identité et contenu sous l’image ; elle reprend toute la largeur sur tablette et mobile.
- La page d’une source outil adopte finalement la composition Pinterest complète : carte source collée à gauche sur deux colonnes, résultats associés immédiatement à droite, puis remplissage dense des emplacements libres sous la carte.
- Le remplissage masonry n’utilise plus un nombre fixe de rangées : un `ResizeObserver` mesure la hauteur réelle de la source et des résultats, calcule leur span sur une trame de 8 px et supprime les trous lorsque le contenu ou le zoom change.
- `Voir plus` occupe les deux colonnes restantes afin de fermer la dernière cellule vide possible en fin de composition.
- Explorer affiche désormais 20 outils dès l’ouverture, puis charge 12 idées supplémentaires à chaque clic sur `Voir plus`, pour créer un véritable espace de découverte sans charger tout le catalogue d’un coup sur mobile.
- `Voir plus` devient un véritable CTA compact : pilule sombre, icône `+` et nombre exact d’outils chargés au prochain clic, sans imiter une carte de résultat vide.
- Le bandeau de la source outil n’est plus un simple indicateur beige : il devient un bouton d’ajout réel vers l’objectif courant ou Ma stack, fusionne les affectations existantes et confirme immédiatement l’état `Déjà dans …`.
- La navigation distingue désormais explicitement un changement de source d’un filtre : toute nouvelle source Explorer revient en haut après rendu, tandis que les angles, `Voir plus` et les ajouts conservent la position de lecture.
- Le retour devient contextuel sur plusieurs niveaux : navigateur, flèche du hero et bouton du sticky remontent tous d’un seul outil, avec un libellé qui nomme la source précédente ; la position de lecture et le nombre de résultats déjà chargés sont restaurés, tandis qu’une navigation vers un nouvel outil commence toujours en haut.
- Le hero d’un objectif formule désormais directement l’action humaine — `Ajouter des outils pour créer des visuels` — et supprime la pilule de destination non interactive qui ressemblait à tort à un bouton.
- La découverte charge désormais automatiquement les outils par lots de 12 à l’approche du bas de la grille ; quatre cartes skeleton annoncent le chargement sans déplacer le contexte, avec une version statique sous `prefers-reduced-motion`.
- Les cartes de découverte sont recentrées sur la navigation télescopique : identité, catégorie et description expliquent l’outil, tandis que toute la surface éditoriale approfondit l’exploration. Le bloc `Pourquoi ici` et le CTA `Voir la fiche` disparaissent ; seul `Ajouter` reste séparé comme action utilitaire. Le skeleton reprend cette même hiérarchie simplifiée.
- Le filtre flottant sombre est remplacé par une barre de tags inspirée de YouTube : intégrée au flux, sticky sous le header, active en contraste fort et scrollable horizontalement sur mobile. Elle ne mélange plus le tri avec l’action de retour et ne recouvre plus les cartes.
- Le séparateur inférieur de la barre de tags est retiré et un espacement dédié la détache de la grille : les cartes ne viennent plus heurter visuellement la zone sticky lors de son activation.
- La barre détecte maintenant son débordement réel : contrôles précédent/suivant affichés uniquement lorsque nécessaires, swipe horizontal conservé et tag actif automatiquement recentré après un changement de filtre. Les contrôles disparaissent aux extrémités et respectent `prefers-reduced-motion`.
- Le tag relationnel `Usages proches` devient `Outils complémentaires` afin de distinguer immédiatement les outils utilisés autour de la source des `Alternatives`, qui peuvent la remplacer. La valeur d’URL `angle=adjacent` reste inchangée.
## 2026-07-16 — Fiches outils : nettoyage structurel du template

### Objectif
Rendre les fiches outils plus rapides à parcourir, réduire la hauteur du premier écran et remettre la carte de décision dans le système de design commun.

### Fichiers modifiés
- `src/pages/ToolDetailPage.tsx` — hero factuel sans répétition du verdict et variante compacte image/contenu.
- `src/components/tool/StickyDecisionCard.tsx` — suppression des styles JSX inline au profit de classes `td-*` maintenables.
- `src/index.css` — hero split-view desktop, rythme vertical resserré, grille de décision à deux colonnes et système complet de styles pour la sidebar.

### Résultat
- La couverture ne monopolise plus le premier écran sur desktop.
- Le prix reste dans le hero ; le verdict demeure dans les surfaces décisionnelles dédiées.
- Le parcours suit six chapitres explicites : Analyse, Prix, Alternatives, Détails, Avis et FAQ.
- L'ancienne reprise silencieuse de l'analyse devient un chapitre `Détails` adressable depuis la navigation flottante.
- Le descriptif long n'est plus répété dans l'ouverture ; le résumé structuré est relégué à la fin du chapitre Détails.
- La section Avis explique le verdict sans répéter le score numérique déjà présent dans la carte de décision.
- Les derniers styles JSX propres au template (verdict, analyse longue et guides liés) sont migrés vers les classes `td-*`.
- Les introductions SEO redondantes de Prix, Alternatives, Détails et FAQ sont retirées du rendu visible ; les composants métier portent directement l'information.
- Le placeholder d'avis utilisateurs, le footer de fraîcheur dupliqué et les tags/faits répétés de la sidebar sont supprimés.
- Les traits systématiques entre chapitres et autour du verdict détaillé sont remplacés par l'espacement et la hiérarchie typographique.
- La vue d'ensemble quitte les styles de l'inspecteur Ma stack et adopte une grille éditoriale 2×2 compacte, avec listes et tags proportionnés.
- Le pricing devient une seule surface comparative : plans côte à côte, avertissement sans encadré supplémentaire et provenance tarifaire discrète.
- Le bloc IA passe en deux colonnes et la fiche technique est conservée uniquement pour les données structurées, sans faux chapitre visible ni grand vide avant Avis.
- Un résumé d'orientation apparaît désormais immédiatement sous le hero : profils adaptés, signal solo/équipe et six fonctions principales.
- Les anciennes sections longues `Pour qui` et `Ce que couvre` sont supprimées du chapitre Détails afin que cette information importante soit unique et visible dès l'ouverture.
- L'ancienne vue `En un coup d'œil` devient `Les points qui comptent` et se concentre sur les usages, forces et limites plutôt que de répéter les fonctions.
- L'analyse longue quitte le chapitre Détails et devient une véritable introduction éditoriale juste après la fiche d'ouverture.
- Cette introduction adopte une composition titre/contenu en deux colonnes sur desktop, puis une lecture verticale sur mobile ; la première idée porte le cadrage, les paragraphes suivants apportent contexte et limites.
- `Les points qui comptent` suit désormais une séquence explicite : usages concrets pleine largeur, puis bénéfices et limites face à face.
- Les usages deviennent quatre unités courtes sur deux colonnes ; `Pourquoi le choisir` et `Limites à connaître` utilisent deux surfaces équilibrées sans laisser de bloc orphelin ni de grand vide.
- Les usages concrets distinguent désormais le livrable du bénéfice attendu : un intitulé court et scannable, suivi d'une précision opérationnelle plus discrète.
- Les cas Framer sont reformulés en français et en anglais autour de quatre productions identifiables (portfolio, landing page, site marketing et microsite), tout en conservant la compatibilité avec les anciennes chaînes libres du catalogue.
- `Usages concrets` et `Forces et limites` deviennent deux sections éditoriales autonomes : la première décrit ce que l'on peut produire, la seconde aide à évaluer le choix de l'outil.
- Le choix par profil quitte le chapitre Alternatives et rejoint directement la séquence de décision `Quand ça a du sens`, avant les seuils de rentabilité.
- L'ancien tableau profil/recommandation devient une rangée compacte de recommandations par profil, sans styles inline, puis s'empile proprement sur mobile.
- Toute la séquence de décision devient une surface visuelle continue : signaux d'adéquation illustrés, profils identifiables par icône et seuil de rentabilité clairement titré.
- Les séparateurs internes du seuil de rentabilité sont supprimés ; des repères circulaires `+` et `−` suffisent à distinguer les critères sans quadriller les cartes.
- Le faux intertitre flottant `Détails / Bien choisir…` disparaît : les sous-blocs portent désormais eux-mêmes leur contexte.
- L'analyse IA devient une surface éditoriale autonome avec titre, position de l'IA, deux axes de lecture et outils associés réunis dans un même ensemble.
- Le comparatif forces/limites devient explicitement `Avantages et inconvénients` : titre de section éditorial, phrase de cadrage et deux en-têtes de cartes typographiquement distincts avec repères `+` et `−`.
- Le rythme vertical de la fiche repose désormais sur deux valeurs uniques : un écart entre chapitres et un écart entre sous-sections.
- Les doubles espacements issus de `padding` symétriques, puis de couples `margin + padding`, sont supprimés ; la colonne principale devient un élément `<main>` explicite.
- Le tableau horizontal des alternatives devient une grille de cartes : outil actuel en référence, quatre alternatives, données comparables regroupées et navigation directe vers chaque fiche.
- La comparaison n'utilise plus de styles inline ni de classes Tailwind de mise en page ; elle s'adapte en une colonne sur mobile sans défilement horizontal.
- La fiche applique une règle de profondeur unique : aucune grande surface ne contient désormais une seconde grille de cards lorsque l'espace et la typographie suffisent.
- Les usages concrets redeviennent une liste ouverte, la séquence de décision perd son grand fond englobant et les deux axes IA sont intégrés directement dans leur surface parent.
- La capsule de navigation flottante est retirée des fiches outils : elle recouvrait le contenu et ses ancres ne reflétaient plus la structure éditoriale actuelle.
- Les routes profondes Prix, Alternatives, Avis et FAQ conservent leur défilement automatique, y compris lors d'une navigation SPA déjà montée.
- Les cartes de comparaison utilisent désormais les images OG des outils comme couvertures éditoriales.
- L'outil actuel ouvre la comparaison dans une carte horizontale image/contenu ; les alternatives adoptent une couverture 1,9:1 et une légère animation d'image au survol.
- Les cartes `À garder / À challenger` et `Rentable / Trop cher` sont fusionnées en deux colonnes décisionnelles : adéquation fonctionnelle en premier, seuil économique dans la continuité.
- L'introduction éditoriale regroupe désormais son eyebrow et son titre dans un même `<header>` aligné en haut ; le texte long ne peut plus repousser artificiellement le titre au milieu de la section.
- Lorsqu'une introduction éditoriale existe, les usages concrets rejoignent directement sa colonne de texte ; ils ne repartent plus sur une nouvelle section pleine largeur.
- Les fiches sans introduction longue conservent automatiquement le bloc d'usages autonome afin de ne perdre aucune information.
- Le bloc `Le bon choix selon votre profil` est supprimé : ses recommandations répétaient les critères `À garder / À challenger` et les alternatives déjà détaillées plus bas.
- La comparaison des alternatives devient un rail compact de cinq cartes homogènes ; l'outil actuel ne monopolise plus une rangée complète.
- Le rail affiche quatre à cinq outils selon la largeur disponible et active un défilement horizontal avec snap lorsque nécessaire.
- Le bouton secondaire `Comparer les alternatives` est retiré de la carte de décision : il doublonnait la navigation éditoriale sans apporter de destination fiable.
- La restauration globale du scroll distingue désormais un rafraîchissement complet d'un vrai Retour/Avance navigateur : le reload repart en haut, tandis que l'historique SPA conserve sa position.
- `history.scrollRestoration` passe en mode manuel pour empêcher la restauration native de concurrencer celle de l'application. Test automatisé local : `5860 px` avant reload, `0 px` après.
- La carte sticky et sa version mobile partagent exactement les mêmes styles.
- Vérification mobile complète sur la fiche Framer : OK.
- Build production : PASS.
## 2026-07-16 — Carrousel d’alternatives allégé

- Les cartes d’alternatives sont recentrées sur le positionnement, le score, le prix et la présence d’un plan gratuit.
- Suppression des blocs « remplaçable » et « verdict », trop répétitifs dans ce contexte de comparaison rapide.
- Ajout d’un vrai carrousel accessible : précédent/suivant, pagination, scroll snap et navigation clavier.
- Retrait du libellé de commande et du compteur ambigu : les flèches restent seules, alignées à droite.
- La section tarifaire se termine désormais après les plans : retrait de l’avertissement, des métadonnées de vérification et du lien externe redondants.
- Retrait sous le carrousel de la note méthodologique et du simple compteur d’alternatives gratuites, sans valeur décisionnelle.

## 2026-07-16 — Passe SEO/GEO des fiches outil

- Centralisation du prix mensuel sur `pricing_v5.compare_price_monthly_eur`, avec `defaultMonthlyPrice` uniquement en fallback, pour aligner UI, FAQ, rentabilité, métadonnées, noscript et JSON-LD.
- Correction de la fiche Framer : prix d’entrée 5 €, ajout du plan Mini dans les textes tarifaires FR/EN.
- Spécialisation des sous-pages `/prix`, `/alternatives`, `/avis` et `/faq` : H1 et contenu propres à chaque intention, sans répéter toute la fiche canonique.
- Ajout d’un maillage interne non sticky entre la vue d’ensemble et les quatre sous-pages, avec état actif et breadcrumbs cohérents.
- Suppression du double titre FAQ et arrêt du scroll automatique des anciennes deep-links.
- Ajout d’une preuve tarifaire compacte (source officielle + date de vérification) et de `WebPage.dateModified` dans le pré-rendu.
- Suppression du faux `AggregateRating` : le score ToolTrim est désormais exposé uniquement comme un `Review` éditorial attribué.
- Alignement des titres client et pré-rendus, des offres freemium et des données structurées sur les mêmes faits.
- Normalisation des slashes finaux afin que `/prix` et `/prix/` conservent la même intention, le même H1 et les mêmes métadonnées après hydratation.

## 2026-07-16 — Alignement de l’ouverture des fiches outil

- Le fil d’Ariane quitte la seule colonne de contenu et prend place au-dessus de la grille principale.
- La carte hero et la carte de verdict partagent désormais la même ligne de départ sur desktop.
- Les espacements avant et après le fil d’Ariane sont harmonisés sur desktop et mobile.
- La navigation des sous-pages gagne en taille, en espacement et en contraste ; l’onglet actif est matérialisé par un trait dédié plutôt que par un simple soulignement de texte.
- Sur mobile, les onglets restent sur une ligne et défilent horizontalement sans comprimer leurs libellés.

## 2026-07-16 — Fondation du nouveau système de cards outils

- Les cards catalogue adoptent une anatomie média inspirée des interfaces de contenu : miniature pour reconnaître, logo pour identifier, texte court pour décider et actions séparées.
- Le prix et le statut `ToolTrim Pick` deviennent des informations superposables à la miniature, sans masquer le visuel.
- Le nom et l’image ouvrent la fiche ; les actions Explorer et Ajouter à la stack ne sont plus imbriquées dans le lien principal.
- La description est visible sur deux lignes et ne dépend plus d’un hover inaccessible sur mobile.
- Les cards compactes du constructeur de stack restent une variante autonome afin de préserver leurs interactions de sélection et de déplacement.
- La hiérarchie typographique reprend une logique de carte média : nom dense sur deux lignes maximum, catégorie secondaire puis description courte alignée avec le texte plutôt qu’avec le logo.

## 2026-07-22 — Piles de logos produits unifiées

- Création du composant partagé `ToolLogoPile` pour remplacer les rangées de logos encadrés indépendamment.
- Les logos deviennent des avatars circulaires chevauchés avec contour de séparation, survol léger et compteur `+n` final.
- Migration des cards de stacks, des cards de guides et des rails stacks/guides de la homepage.
- Les piles interactives de l’éditeur de stack restent distinctes car elles proposent un popover et des actions supplémentaires.

## 2026-07-22 — Cohérence des petites surfaces publiques

- Les cartes compactes, résultats de recherche, guides liés, stacks liées et variantes de stacks partagent désormais le rayon informatif, une bordure douce et un survol local sans ombre ni déplacement vertical.
- Les cartes de stacks abandonnent leur animation SaaS en élévation au profit d'une interaction éditoriale plus calme.
- Les profils de stacks sont regroupés dans un panneau neutre sans double coque extérieure.
- L'index des catégories quitte ses anciennes cartes bleutées Tailwind et adopte une variante dédiée alignée sur les cartes de recherche : icône 36px, hiérarchie typographique compacte et métadonnées neutres.

## 2026-07-20 — Dark launch du catalogue canonique Supabase

- Déploiement additif rév. 4.12 commité sur Supabase après preflight en lecture seule et restauration-test d'un backup PostgreSQL 17.
- Catalogue porté à 1 126 outils, dont 593 imports legacy complets ; projection publique bilingue à 2 252 lignes.
- Schémas internes protégés de `anon` et `authenticated`, projection publique accessible via un propriétaire `NOLOGIN` sans `BYPASSRLS` et une vue `security_barrier`.
- Wix reste en recherche : 4 observations contextualisées, une attestation humaine active et aucun prix approuvé ; le resolver publie `needs_review` avec montant nul.
- Aucun consommateur Fiche/Ma Stack/Explorer/build n'est basculé pendant le dark launch ; aucune projection diagnostic n'est créée.
- Les 61 outils dont la catégorie legacy n'existe pas encore dans `public.categories` conservent la valeur brute dans `legacy_payload` et attendent un mapping séparé.
- Validation : 164/164 tests RESEARCH, parité `legacy_is_free` 589/537, accès effectifs sous `anon`/`authenticated` et bundle SQL verrouillé par hashes.
- Exposition du seul schéma `catalog_api` dans la Data API, avec `catalog_private` toujours absent ; ajout d'un gate REST en lecture seule contrôlant cardinalités, contrat Wix legacy et isolation privée.
- Shadow read complet entre `public.tools` et la projection : correction de 182 fallbacks de verdict anglais portant un littéral JSON `null`, puis zéro divergence sur 40 champs et 2 252 lignes.
- Pagination du fetch Supabase du build SEO : les 1 126 outils sont désormais lus malgré le plafond de 1 000 lignes par requête.
- Activation couplée Fiche + SSR/SEO sur `catalog_api`, avec fallback automatique et rollback unique via `VITE_CATALOG_PROJECTION_FICHE=false` ; Ma Stack, Explorer et Comparateur restent inchangés.
- Validation de 97 deltas d'alternatives intentionnels : cibles canoniques et publiées uniquement, sans slug orphelin.
- Canari pré-commit reproductible : 10 fiches représentatives contrôlées en FR/EN et navigation SPA Figma → Canva, soit 21/21 contrôles verts sans erreur d'hydratation ni ressource locale en échec.
- Wix devient le premier pilote réellement canonique : quatre observations tarifaires officielles approuvées (16,80 €, 30 €, 40,80 €, 178,80 €), plan gratuit, engagement annuel payé d'avance, TVA et unité par site restitués sur la fiche et sa sous-page Prix.
- La transaction de bascule Wix est rollback-only par défaut, idempotente et verrouillée ; elle publie les contenus FR/EN seulement après une parité champ par champ, sans basculer les 1 125 autres outils.
- Canari final étendu à 22/22 avec contrôle SSR et rendu de `/fr/tool/wix/prix`.
- Les cartes tarifaires canoniques peuvent désormais restituer une correspondance synthétique par plan (public cible et trois différences clés), séparée des observations de prix et reliée à une source officielle. Wix inaugure ce format sur ses cinq offres.

## 2026-07-23 — Sidebar du shell et préférences d’affichage

- Le shell desktop sépare désormais la navigation et l'espace de travail en deux boîtes autonomes, reliées par une gouttière neutre plutôt que par une bordure verticale.
- Le logo ToolTrim est intégré à la sidebar : pictogramme en mode compact, signature complète en mode déployé.
- Le header de recherche est intégré à la boîte de contenu afin que toute la partie droite forme une seule surface cohérente.
- La sidebar desktop possède désormais une version compacte iconographique et une version déployée avec libellés, mémorisées localement.
- Les états actifs utilisent une surface neutre et une hiérarchie typographique plus fine, sans pavé noir décoratif.
- Une zone de préférences dédiée est placée en bas : changement de langue, thème clair/sombre et réduction de la navigation.
- Le changement de langue conserve la page, les paramètres et l’ancre en cours.
- Le thème suit d’abord la préférence enregistrée, puis celle du système, et applique un `color-scheme` cohérent au document.
- Les variantes ont été vérifiées visuellement sur l’index des guides, en clair et en sombre, ainsi que par tests E2E de persistance.

## 2026-07-27 — Rythme vertical de la homepage

- Les sections du catalogue de la homepage partagent désormais une classe structurelle et un espacement vertical unique.
- Suppression des marges inline répétées qui ajoutaient un vide artificiel lorsque la section « Outils en vedette » n'était pas rendue.
- Le premier bloc commence plus près du hero ; les blocs suivants conservent une séparation régulière après leur pagination.
- Le padding final du catalogue n'est plus doublé par celui de la dernière section.

## 2026-07-27 — Finition visuelle de la sidebar

- Les deux surfaces du shell adoptent un rayon extérieur plus contenu de 20 px et une gouttière légèrement plus fine.
- Le fond du shell gagne en contraste tandis que la sidebar conserve une teinte presque blanche distincte de l'espace de travail.
- Une bordure optique très légère précise les contours sans transformer les surfaces en cards.
- Les icônes et libellés inactifs utilisent une tonalité secondaire ; l'état actif reste neutre, sans aplat noir ni accent bleu.
- Le pictogramme compact ToolTrim est neutralisé afin de ne pas concurrencer les visuels éditoriaux.

## 2026-07-27 — Toolbar catalogue flottante

- L’aplat noir pleine largeur des filtres sticky est remplacé par une surface translucide contenue dans la colonne.
- Le fond de secours reste suffisamment opaque pour préserver le contraste avant même l’application du flou d’arrière-plan.
- Une bordure optique et une ombre douce détachent les filtres des résultats sans recréer une deuxième barre de navigation.
- Les rayons, marges et décalages sont adaptés au mobile afin de conserver le même comportement flottant.
- La page Stacks adopte le même état sticky que les catalogues Outils, Guides et Comparatifs.
- La toolbar sticky remplace entièrement le header global pendant le scroll et conserve sa recherche contextuelle : une seule barre fonctionnelle reste visible.
- L'état sticky forme un bandeau pleine largeur, collé en haut du workspace, sans rayon ni coque de card supplémentaire ; le verre reste limité au fond du bandeau.
- Les popovers de filtre Outils, Stacks et Comparatifs partagent désormais une largeur de 280 px, le même rythme de 42 px, les mêmes rayons, ombres et états de focus neutres.
- Les différences de sélection restent explicites : cases à cocher pour les catégories multiples, coche terminale pour les choix uniques.
- Les cinq catalogues Outils, Catégorie, Guides, Comparatifs et Stacks utilisent désormais le même hook d’observation et les mêmes classes structurelles `tt-sticky-toolbar`.
- Suppression des états sticky visuels propres aux pages : le fond glass, l’ancrage, la pleine largeur et le remplacement du header proviennent d’une seule règle partagée.

## 2026-07-27 — Réparation du garde-fou design tokens

- Remplacement des rayons CSS littéraux ajoutés depuis la dernière baseline par les tokens `--radius-*` correspondants.
- Remplacement des nouvelles couleurs grises en dur par `--color-muted`.
- Réalignement de la baseline sur la dette réellement présente dans le commit distant : 64 couleurs CSS en dur, aucun rayon CSS littéral et 214 styles inline TSX.
- Validation complète de la CI locale : garde-fous design et diagnostic, TypeScript, tests Ma Stack, build avec prerender et hygiène du diff.

## 2026-07-27 — Nettoyage du template des fiches Stack

- Le parcours éditorial des fiches Stack suit désormais un fil plus court : promesse, outils, budget, limites, alternatives proches et FAQ.
- Le hero conserve uniquement quatre repères utiles — profil, budget, nombre d'outils et workflow — afin d'éviter l'effet tableau de bord.
- La section Budget est ramenée à trois seuils lisibles et une règle de décision, sans principes ni avertissements répétés.
- Les anciens blocs Risques et Calibrage sont fusionnés en trois points de vigilance directement actionnables.
- Suppression du panneau latéral d'outil devenu inaccessible et de ses composants associés.
- Les espacements, surfaces, cartes, FAQ et fiches proches sont alignés sur le rythme éditorial actuel des pages produit et comparatifs.
- Le template utilise désormais la même grille article + sidebar que les fiches produit ; la carte de décision reste sticky et remplace la navigation flottante de bas de page.
- Une passe anti-redondance attribue désormais un rôle clair à chaque zone : promesse dans le hero, décision dans la sidebar, composition dans les outils, coût dans le budget et risques spécifiques dans les limites.

## 2026-07-28 — Présence visuelle des cartes Comparatifs

- Les cartes de l’index Comparatifs séparent désormais clairement l’identité du duel et les deux critères de décision.
- Le header utilise une surface secondaire, un badge de catégorie contrasté et des logos mieux cadrés.
- Les cartes ne sont plus étirées artificiellement par leur ligne de grille ; leur hauteur suit le contenu réel.
- Une ombre légère et un déplacement discret renforcent l’état interactif sans introduire de couleur d’accent.
- Le badge de catégorie flottant en bas est supprimé au profit d’une information intégrée à la hiérarchie du titre.
- La seconde passe retire les libellés « Choisir » et les noms d’outils répétés dans chaque colonne : le header porte l’identité du duel, les cellules ne conservent que le critère discriminant.
- La grille desktop affiche quatre cartes par ligne ; les critères sont empilés dans chaque carte pour préserver la lisibilité, avec deux colonnes sur tablette et une sur mobile.
- Les critères descriptifs sont finalement retirés de l’index : les cartes servent uniquement à identifier et ouvrir un duel, tandis que l’analyse reste dans la page Comparatif.
- Le registre des comparatifs accepte désormais une accroche éditoriale FR/EN optionnelle ; Trello vs Linear inaugure ce format avec une synthèse courte sur leurs logiques respectives.
- Toutes les cards affichent désormais cette synthèse : une accroche rédigée lorsqu’elle existe, sinon une composition courte issue du positionnement éditorial FR/EN de chaque outil.

# 2026-07-28 — Architecture typographique de la page d'accueil

- Alignement du hero, des titres de sections et des titres de cartes sur l’échelle éditoriale utilisée par les Guides.
- Unification des graisses : hero `480`, sections et cartes `500`, corps `400`.
- Remplacement des espacements locaux par les tokens globaux entre sections et entre en-têtes et contenus.
- Suppression du style inline du conteneur du hero au profit du système CSS `hv2-*`.
- Formalisation d’une grille spatiale inspirée d’OpenAI : gouttières `32px`, écart en-tête/contenu `32px`, grille `24px` et respiration inter-section `120px`, avec réductions dédiées tablette et mobile.
- Recalage typographique sur les valeurs calculées de la référence : titres de section fluides `20–22px`, titres de cartes `17–18px`, métadonnées `14px`, graisse `500` et interlignages respectifs `1.252`, `1.31` et `1.4`.
- Refonte des articles de l’accueil sur le modèle éditorial de la référence : grande miniature `16:10`, titre et métadonnées sous l’image, sans bordure, fond, pile de logos ni extrait concurrent.
# 2026-07-28 — Ligne éditoriale par univers sur l’accueil

- Remplacement des anciens panneaux de catégories compacts par une seule rangée de trois modules éditoriaux.
- Chaque module associe une miniature produit, un outil mis en avant, trois outils secondaires et un accès à la catégorie.
- La nouvelle composition casse la répétition des carrousels tout en conservant la grille, les tokens typographiques et les comportements responsive de ToolTrim.
- Transformation des stacks recommandées en collections visuelles : cinq couvertures sur desktop, titre et nombre d’outils ouverts sous l’image, rail horizontal tactile sur tablette et mobile.

# 2026-07-28 — Recherche de l’index Guides

- L’icône de recherche est désormais un vrai bouton : elle ouvre le champ, lui donne immédiatement le focus et permet de saisir une requête.
- La croix efface la recherche sans perdre le focus ; la touche Échap efface puis referme le champ.

# 2026-07-28 — Navigation arborescente du catalogue Outils

- La barre des univers devient une navigation à deux niveaux : sélectionner un univers remplace la racine par ses usages les plus représentés.
- Le second niveau accepte plusieurs usages simultanément et conserve un bouton de retour explicite vers tous les univers.
- Les sous-tags sont dérivés des besoins fonctionnels réels des outils de l’univers, puis ordonnés par représentativité.
- Les variations de graisse sont réservées à l’état actif ; une réserve typographique invisible empêche désormais les libellés voisins de se déplacer.
- Les listes trop longues deviennent des rails horizontaux : fondus latéraux, flèches contextuelles et défilement fluide n’apparaissent que lorsqu’un contenu reste hors champ.

# 2026-08-16 — Guide d’audit de stack SaaS

- Publication d’un guide opérationnel pour auditer une stack en 45 minutes sans déclencher de migration improvisée.
- La méthode distingue inventaire, rôles, sources de vérité, usage réel, dépendances et coût de sortie avant toute décision.
- Ajout d’une matrice claire « garder / challenger / remplacer / supprimer », d’un exemple pédagogique explicitement non tarifaire et de garde-fous sur les données, paiements et accès partagés.
- Ajout des métadonnées SEO, des FAQ structurées, des liens vers Ma Stack et Comparatifs, ainsi que de trois visuels éditoriaux existants avec textes alternatifs.
- Synchronisation des sources `src` et `public`, régénération de l’index d’accueil, prerender Article + FAQ et validation complète du build de production.

# 2026-08-17 — Nettoyage des comparatifs au prerender

- Alignement des références Adobe Firefly et ConvertKit sur leurs slugs canoniques actuels (`firefly` et `kit`).
- Retrait de Canva vs Photoshop Elements du registre publié, Photoshop Elements n’ayant plus de fiche catalogue exploitable.
- Suppression des quatre avertissements de comparatifs introuvables pendant le build, sans modifier le fallback temporaire de la projection Supabase.

# 2026-08-17 — Fallback hybride des fiches catalogue

- Le prerender conserve désormais chaque fiche bilingue disponible dans la projection publique Supabase au lieu d'abandonner toute la projection lorsque sa couverture est partielle.
- Les outils encore absents de la projection utilisent individuellement la source JSON historique, sans interrompre ni dégrader les fiches déjà canoniques.
- Une vraie erreur réseau, HTTP ou une perte d'outil dans les deux sources reste bloquante et déclenche le fallback global de sécurité.
- Le journal de build résume explicitement le nombre de fiches projetées et de fallbacks JSON, sans stack trace trompeuse pour une migration progressive attendue.

# 2026-08-17 — Réparation du garde-fou des design tokens

- Remplacement des couleurs locales des illustrations Stories, familles de stacks et tutoriels vidéo par des tokens sémantiques nommés.
- Alignement des quinze rayons littéraux ajoutés récemment sur l’échelle canonique `--radius-*`.
- La dette CSS mesurée redescend de 64 à 52 couleurs en dur et reste à zéro rayon littéral, sans relever la tolérance du CI.
## 2026-08-18 - Recherche globale exploratoire

- Transformation de la palette de recherche en hub d'exploration plein écran.
- Ajout des vues Tendances, Catégories, Plateformes, Fonctionne avec, Collections et Articles.
- Conservation de la recherche transversale outils, catégories et guides avec navigation clavier.
- Ajout d'une adaptation mobile avec navigation horizontale et grilles responsives.
- Recalibrage du panneau desktop à 1040 x 680 px maximum, avec recherche, navigation, cartes, logos et espacements plus fins.
- Allègement des bordures et des effets afin de rapprocher la densité visuelle d'un outil de navigation compact.
- Validation par le build production complet.
- **Recherche globale compacte** : le panneau desktop est désormais plafonné à environ un quart de la surface de la fenêtre, avec une colonne de navigation et des grilles recalibrées pour ce format.
- **Recherche globale sans défilement** : le panneau desktop retrouve une surface intermédiaire de `920 × 660 px` afin d'afficher les grilles d'exploration sans scroll interne.
# 2026-08-18 - Recherche globale, finition typographique

- Réduction de l'échelle typographique de la fenêtre de recherche pour retrouver une lecture plus utilitaire et plus fine.
- Graisses, interlettrage, hauteurs de ligne et niveaux de gris harmonisés entre navigation, titres, tuiles, collections et résultats.
## 2026-08-18 · Recherche globale, couvertures éditoriales

- Remplacement du pictogramme générique des articles par leur image de couverture dans la recherche globale.
- Conservation d'un repli iconographique lorsque la couverture est absente.
- Recomposition des cartes avec une hiérarchie média, titre, puis métadonnées cohérente avec l'accueil.

## 2026-08-24 · Fiche outil, lecture et barre de décision

- Recomposition du bloc éditorial en deux colonnes internes : analyse et usages à gauche, audience et faits vérifiés à droite.
- Suppression du bandeau de contexte redondant afin de conserver une seule source visuelle pour « Pour qui » et les fonctionnalités.
- Suppression du header compact dupliqué : le hero visuel devient lui-même compact et sticky après son passage à l’écran.
- Conservation dans cet état réduit de l’image, du nom et de l’accès au site ou à l’offre, sans masquer ni déplacer la sidebar de décision.
- Maintien de la colonne de décision à droite, alignée en haut et indépendante du hero qui reste strictement dans le contenu éditorial gauche.
- Transition progressive de l’image, de la hauteur et des contenus vers l’état compact, sans déplacement de la sidebar.
- État compact complété par la catégorie et le prix, rayons harmonisés sur les panneaux ToolTrim et CTA renommé « Visiter le site » pour refléter sa destination réelle.
- Bandeau compact allégé à 62 px, avec visuel, typographie, CTA, rayon et ombre recalibrés pour accompagner la lecture sans recouvrir visuellement le contenu.

## 2026-08-24 · Préférence de devise EUR / USD

- Ajout d’une préférence de devise indépendante de la langue : un passage FR/EN ne modifie jamais silencieusement les prix.
- Sélecteur EUR/USD disponible dans les préférences de la navigation et dans la barre mobile, avec mémorisation locale pour les visites suivantes.
- Conversion des prix normalisés des fiches outils, des faits clés et des plans tarifaires EUR/USD ; conservation de la devise native lorsqu’elle n’est pas convertible de façon fiable.
- Taux de référence BCE daté du 21 août 2026, présenté comme conversion indicative dans la section tarifaire ; les données structurées SEO restent en EUR.
- Correction de la hiérarchie tarifaire : un prix natif USD collecté est désormais affiché tel quel ; le prix EUR normalisé n’est reconverti que lorsqu’aucune observation USD fiable n’est disponible.
- Priorité aux plans canoniques, puis au registre `pricing_truth`, puis au montant explicitement libellé dans le contenu tarifaire ; le marqueur `≈` et la note BCE n’apparaissent que pour un montant réellement converti.
- Le hero compact sticky masque directement le contenu défilant avec un fondu alpha progressif sur 64 px : aucune couleur blanche n’est peinte et textes, icônes et surfaces s’éteignent ensemble, sans chevauchement, surbrillance, filet ni aplat visible.
- 2026-08-24 — Page outil : le grand titre et son état sticky partagent désormais la même grille d’identité (logo, nom/catégorie, CTA), afin de conserver les axes et la hiérarchie pendant la transition.
- 2026-08-24 — Galerie hero : les médias sortent de la carte d’identité et adoptent le ratio OG 1200:630 sans fond ni cadre englobant, pour supprimer l’effet de boîte imbriquée.
- 2026-08-24 — Sticky hero : suppression du spacer qui conservait artificiellement la hauteur de la galerie ; sa hauteur et sa marge se replient ensemble, tandis qu’un décalage égal à la barre compacte synchronise l’arrivée du contenu juste sous le sticky.
- 2026-08-24 — Identité hero : le bloc nom/catégorie prend exactement la hauteur du logo, avec justification verticale haut/bas et titre recalibré pour conserver des proportions cohérentes dans les états large et sticky.
- 2026-08-25 — Hero outil : alignement du gabarit d’identité sur les mesures Toolfolio (logo 56 px, titre 30 px, catégorie 16 px, CTA 40 px, retrait 20 px), conservées à l’identique dans le sticky au lieu d’une miniaturisation.
- 2026-08-25 — Hero outil : suppression de la catégorie sous le nom ; titre et CTA reprennent les métriques typographiques Toolfolio (Inter 30/36 en 300, interlettrage -0,75 px ; CTA Inter 14/20 en 400).
- 2026-08-25 — Hero outil : la description est alignée sur l’axe du titre (décalage logo + gouttière de 72 px) et ramenée à Inter 16/24 pour rester secondaire.
- 2026-08-25 — Hero outil : réduction de l’espace vertical entre l’identité et la description de 24 à 12 px.
- 2026-08-25 — Hero outil : nom et description sont réunis dans le même bloc de 56 px, sur deux lignes contiguës 36/20, alignées sur la hauteur du logo et conservées dans le sticky.
- 2026-08-25 — Galerie Bodymovin : ajout de trois captures fonctionnelles officielles aescripts (sélection de composition, rendu et récupération du player), enregistrées localement pour garantir leur disponibilité et éviter le hotlinking.

## 2026-08-25 · Ma stack, navigation de bibliothèque

- Remplacement du vocabulaire « tableaux » par « collections » dans le résumé de la stack.
- Recomposition des filtres comme une navigation soulignée, sans capsules concurrentes ni bordure de séparation sous le menu.
- Déplacement de l’accès à l’organisation à droite de la navigation, sous le libellé explicite « Organiser mes outils » avec pictogramme de réglage.
- Transformation du bouton rond ambigu en CTA « Explorer les outils », avec une affordance et une destination compréhensibles sans infobulle.

## 2026-08-25 · Compte facultatif et synchronisation Ma Stack

- Ajout d’un CTA secondaire « Synchroniser » dans Ma Stack, sans mur de connexion pendant l’exploration.
- Ajout d’une modale de compte avec Google OAuth, magic link email, état synchronisé, déconnexion et parcours de suppression confirmé en deux étapes.
- Mise en place d’un snapshot personnel versionné : fusion initiale du local et du distant, conservation du cache navigateur et sauvegarde automatique après modification.
- Ajout des tables Supabase `profiles` et `stack_snapshots`, de leurs droits authentifiés et de politiques RLS par propriétaire.
- Ajout des tests de fusion et réouverture automatique de la modale au retour de l’authentification.

## 2026-08-27 · Système d’icônes Iconoir

- Remplacement transversal de `lucide-react` par `iconoir-react` sur le shell V2, Explorer, Ma Stack, les fiches outils et les composants partagés.
- Ajout d’une couche centralisée `src/lib/icons.tsx` qui conserve les tailles, refs, attributs ARIA et contrats existants tout en définissant les équivalents Iconoir choisis par ToolTrim.
- Suppression de Lucide des dépendances et synchronisation des lockfiles npm et Bun.
- Validation TypeScript, contrôle des imports résiduels, `git diff --check` et build production complet avec fallback JSON pendant la restriction de quota Supabase.

## 2026-09-01 · Page dédiée de soumission d’un outil

- Création d’une route bilingue `/submit`, distincte de Contact, avec une explication claire de l’analyse effectuée avant toute décision de publication.
- Tunnel en trois étapes : informations sur l’outil, installation et vérification du badge ToolTrim, puis récapitulatif et validation finale.
- Vérification serveur du badge sur une page HTTPS publique du domaine présenté, avec blocage des destinations privées et jeton signé temporaire obligatoire pour l’envoi final.
- Proposition d’un contact direct lorsqu’un éditeur souhaite convenir d’une autre solution que le badge.
- Ajout d’un badge neutre « Choisir, pas empiler » utilisant le pictogramme officiel ToolTrim, sans revendiquer une sélection avant analyse.
- Déclinaison Light/Dark au format 216 × 54, avec snippet HTML prêt à copier, attribut `alt` personnalisé au nom de l’outil et suivi des clics par paramètres UTM.
- Renforcement de l’API avec validation des champs et URL, limites de longueur et échappement HTML des emails reçus.
