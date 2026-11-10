# Édition d’une fiche ToolTrim sur une page

Le super administrateur doit pouvoir ouvrir une fiche, voir son contenu et savoir quoi faire sans connaître le catalogue JSON. L’éditeur actuel reprend les sections de la fiche publique et distribue des champs déjà ouverts, des accordéons et des actions loin de leur cible. Une fiche se lit d’abord, puis s’édite à l’endroit choisi.

## Approche choisie

La maquette proposait une section à la fois et une fiche continue avec raccourcis. Michael a choisi la fiche continue. Elle permet de relire des sections voisines et de modifier dans le même contexte. Des blocs compacts et une navigation qui défile jusqu’aux sections limitent la longueur perçue.

## Écran

- En haut, le nom de la fiche, **Retour aux fiches**, l’état du brouillon et **Aperçu public**. Les raccourcis conduisent à Présentation, Prix et offres, Usages et tags, Médias, Analyse ToolTrim et Réglages avancés. Ils déplacent la lecture dans la même page. Ils n’ouvrent ni onglet d’édition ni colonne latérale.
- La fiche commence sur Présentation. Les valeurs existantes se lisent comme du contenu. Chaque bloc possède une action visible et nommée, par exemple **Modifier la présentation**, **Modifier les usages** ou **Ajouter un média**. Une section vide dit ce qui manque et montre l’action pour ajouter le premier élément.
- **Modifier** transforme le bloc ou la ligne sur place. Le focus arrive au premier champ et revient au bouton de départ à la fermeture. Un seul bloc ou élément est en cours de modification. **Terminer** applique uniquement les changements de ce bloc au brouillon, que le système enregistre. **Annuler** ferme le bloc et abandonne uniquement les saisies encore locales dans ce bloc. Les autres modifications restent intactes. Une validation bloquante reste près du champ et maintient le bloc ouvert.
- Une ancre de section peut être utilisée pendant la saisie et conserve le bloc ouvert. Si une action ferait disparaître des saisies en cours, l’éditeur propose de terminer ou d’annuler cette modification. Ce garde local complète le garde existant des brouillons et de la navigation. L’aperçu peut être ouvert après avoir terminé le bloc en cours. Il reste en lecture seule et présente le brouillon via le rendu public partagé.
- Les tâches moins fréquentes et les champs protégés se trouvent dans Réglages avancés. Les alertes de qualité indiquent la section concernée en mots usuels. Une erreur d’enregistrement reste visible dans l’en-tête et propose la relance existante.

## Gestes par section

| Section | Ce qui se lit au repos | Ce qui s’ouvre en place |
|---|---|---|
| Présentation | Nom, description, site et informations principales | Libellés humains, champs FR et EN identifiables, liens commerciaux et détails secondaires dans leurs propres blocs |
| Prix et offres | Toutes les offres dans leur ordre, chacune avec son nom et un prix ou un état lisible | **Ajouter une offre** puis saisie dans une nouvelle ligne. Sur chaque offre, **Modifier**, **Monter**, **Descendre**, **Retirer**. Une seule offre ouverte à la fois |
| Usages et tags | Les valeurs présentes, groupées par nature | Sélection avec le vocabulaire existant, suppression ciblée, premier ajout visible et recherche des valeurs quand la liste est longue |
| Médias | Logo et miniatures des images présentes | Ajout ou remplacement des URL et textes alternatifs déjà pris en charge, retrait et ordre lorsque la collection le permet |
| Analyse ToolTrim | Verdict, note, points forts et limites | Édition par bloc pour les administrateurs habilités. Les futurs éditeurs pourront consulter l’analyse sans la modifier |
| Réglages avancés | Résumé des groupes disponibles et état des contrôles | Référencement, alternatives, relations, sources et champs rares. Les champs protégés restent consultables avec une explication |

La liste affiche les entrées de la langue choisie dans le même ordre que la fiche publique dans cette langue. Un déplacement réordonne cette grille. Les modifications et retraits qui affectent une entrée liée suivent les opérations existantes et annoncent leur portée avant application. Le rapprochement des variantes ne se déduit jamais de leur nom. Une offre en cours d’ajout ne rejoint la liste qu’après **Terminer**. Une offre payante distingue montant, devise, unité et fréquence de facturation. Une facturation annuelle avec prix affiché au mois indique explicitement ce que le client paie. **Gratuit**, **Sur devis**, **Prix non communiqué** et **À l’usage** exposent seulement les champs pertinents. Les références de prix, le prix de comparaison, les variantes historiques et les traductions utilisent les règles métier existantes. Un changement partagé entre FR et EN l’indique avant application. **Retirer** offre un retour immédiat par **Annuler le retrait**, en utilisant l’opération d’annulation existante.

Après validation locale, **Terminer** ferme le bloc et l’en-tête indique **Enregistrement…** puis **Brouillon enregistré** lorsque le serveur confirme. Si le serveur refuse, les valeurs restent dans le brouillon de travail et l’en-tête propose de réessayer ou de revenir au bloc concerné. L’aperçu peut montrer ce brouillon de travail en indiquant qu’il reste à enregistrer. Une validation locale bloquante garde le bloc ouvert.

## Affordances du formulaire

Le contrôle dépend de ce que la personne peut faire avec la donnée. Les valeurs se lisent dans leur contexte et l’intitulé du bouton annonce le geste. Le texte d’aide explique une conséquence concrète, notamment l’effet d’une modification sur les deux langues.

| Type de donnée | Geste visible et règle |
|---|---|
| Texte court ou long | **Modifier la description** ouvre une zone adaptée à la longueur. Le libellé reste visible en écrivant. Une traduction manquante affiche **Ajouter la version anglaise**, sans remplacer le texte français. |
| Tags du vocabulaire | Les tags de la fiche apparaissent comme des pastilles. **Ajouter un usage** ouvre une recherche des libellés existants. Le résultat propose **Ajouter [libellé]**, et les valeurs déjà choisies sont exclues. Aucun doublon ni création de tag en validant la recherche. |
| Retrait d’un tag | La croix dans chaque pastille s’appelle **Retirer [libellé]** pour le clavier et les lecteurs d’écran. Le geste détache le tag de cette fiche. **Annuler le retrait** le remet à sa place. **Annuler** à l’échelle du bloc rejette toutes les modifications de ce bloc. |
| Usages décrits, points forts et limites | Une liste de lignes, avec **Ajouter un exemple d’usage** ou **Ajouter un point fort**. Une ligne comporte du texte éditorial, avec l’ordre et le retrait lorsqu’ils ont un effet sur la fiche. Ce texte libre ne crée aucun tag dans le vocabulaire. |
| Catégorie et type | Un seul choix par champ. La valeur actuelle est lisible dans le bloc. Le sélecteur décrit le changement et conserve l’ancienne valeur tant que la modification n’est pas terminée. |
| Personnes, usages et secteurs | Un groupe distinct par nature. Une sélection dans « Publics » ne modifie pas « Usages » ni « Secteurs ». Un tag historique sans entrée de vocabulaire reste visible et retirable, sans être proposé aux nouvelles sélections. |
| Offre | **Ajouter une offre** ouvre une ligne provisoire. La carte résume nom, type, montant affiché, unité et rythme de paiement applicables. Les champs apparaissent au fur et à mesure selon le type choisi. Le retrait et le déplacement restent accessibles depuis la liste. |
| Image ou lien | Une image existante affiche sa miniature et son texte alternatif. **Remplacer**, **Ajouter** et **Retirer** ont chacun une cible explicite. Une URL invalide ou une image introuvable a un message près du champ. |
| Note ou verdict | La valeur est visible à côté de son échelle ou de son libellé. Les accès réservés à ToolTrim sont expliqués sur le bloc. Les personnes en lecture seule ne voient pas de bouton d’édition indisponible. |

Pour les tags, la recherche accepte un libellé avec ou sans accent et l’identifiant connu. Les suggestions montrent un nombre limité de résultats et invitent à affiner la recherche. Si aucune valeur ne correspond, afficher **Aucun usage correspondant**. Si la liste de la fiche est vide, afficher **Aucun usage renseigné** et garder **Ajouter un usage** visible. Une recherche seule ne modifie jamais le brouillon. Le clavier peut ouvrir le sélecteur, parcourir ses suggestions, en ajouter une explicitement et fermer la recherche. Après ajout, le focus retourne au champ de recherche pour permettre plusieurs ajouts. Après fermeture du bloc, il revient à l’action de départ.

Scénario de recette : ouvrir la fiche, ajouter « Automatisation » en le recherchant, vérifier qu’il disparaît des suggestions, retirer « Notes », annuler le retrait, puis annuler le bloc. Les tags initiaux doivent être de retour. Refaire l’ajout et terminer, puis rouvrir la fiche et retrouver « Automatisation » avec son identifiant canonique. La création d’un terme de vocabulaire est un autre geste de gestion du catalogue et reste hors de cet écran.

## Contrats et réalisation

L’espace auteur est une composition dédiée. Les contrôles typés, les opérations sur les collections, les permissions et le service de brouillons existants restent les sources de vérité. Le rendu public reste celui de l’aperçu. La publication groupée reste dans la liste des fiches et continue de vérifier versions, droits et sources. Cette refonte ne crée ni nouveau rôle, ni téléversement, ni migration, ni mise à jour du catalogue publié.

Le registre des champs fait foi. Chaque chemin éditable doit avoir un accès explicite dans une section, y compris les champs avancés, les premières valeurs absentes et les données antérieures. Vérifier la correspondance par chemin entre le registre, le brouillon enregistré et ce que montre l’aperçu. Les champs qu’une règle protège restent lisibles. Les composants utilisent les jetons et les contrôles du système de design ToolTrim. Le constructeur décide du découpage des composants et de la technique de conservation des positions de défilement.

## Recette

1. Depuis la liste, ouvrir une vraie fiche. Trouver Prix et offres sans descendre la page à la recherche d’un champ. Identifier toutes les offres et leurs actions au repos.
2. Ouvrir une offre, passer de Payant à Sur devis, vérifier les champs et le résumé, annuler, puis refaire et terminer. Ajouter une offre, annuler un autre ajout, déplacer et retirer une offre, annuler le retrait.
3. Modifier un usage, ajouter le premier élément d’une collection vide et retrouver les champs moins fréquents. Une fois le brouillon enregistré, recharger la fiche et vérifier les mêmes données dans la section puis dans l’aperçu.
4. Vérifier qu’Annuler ne défait que les saisies du bloc ouvert. Vérifier le retour clavier, les états d’erreur et de reconnexion, le garde de navigation, l’indépendance de l’analyse et la publication groupée sur un serveur de test isolé.
5. Vérifier sur mobile et ordinateur en FR et EN, au clavier, avec titres longs et fiches pleines ou vides. Faire la revue visuelle sur le parcours rendu et dans Storybook avant la mise en ligne.
