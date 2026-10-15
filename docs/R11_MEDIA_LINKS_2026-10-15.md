# R11 — Médias et liens externes, 15 octobre 2026

Les anomalies de disponibilité démontrées dans ce périmètre sont corrigées localement : **62 corrections exactes sur 54 outils**, dont 46 remplacements vérifiés et 16 retraits de références défaillantes. La règle de blocage des captures blanches/anti-bot s'applique désormais aussi au hero des fiches. Aucun prix, offre, texte éditorial, classement ou droit d'usage n'est ajouté ou recertifié. Aucune écriture Supabase, publication ou soumission à un moteur.

## Inventaire et méthode

L'audit couvre les **1 349 fiches** de chacun des deux snapshots `tools_v4.json` et `tools_index.json`, les **40 articles FR et 47 EN**, et les médias curatoriaux de `toolMedia.ts`. Les 7 356 références source produisent **3 519 URL distinctes avant correction**. Les inventaires complets conservent la provenance, le slug et le champ de chaque référence. La valeur relative non absolue `assets/images/bg8.jpg` de Stock Footage (présente dans les deux snapshots) ne constitue pas une URL GET : elle est inventoriée en supplément dans `malformed-reference.json` et corrigée. Le script reproductible classe désormais aussi ces valeurs en `invalid_url` au lieu de les ignorer. Les comptes réseau ci-dessous restent ceux du run initial, sans réécriture de ses preuves.

| Type | URL distinctes avant correction |
|---|---:|
| Couverture ogImageUrl | 1 196 |
| Logo | 304 |
| Galerie | 592 |
| Destination websiteUrl | 1 313 |
| Destination affiliateLink | 708 |
| Liens externes extraits des articles FR/EN | 52 |
| Médias curatoriaux explicites | 3 |
| Sources des médias curatoriaux | 2 |

Les types se recoupent : leur somme n'est pas le total unique. Les articles sont inspectés comme sources de liens, pas réécrits ni recertifiés sur leurs assertions tarifaires.

Le script reproductible est `scripts/audit-r11-media-links.mjs`. Exécution réseau en lecture seule, GET avec redirections suivies, 20 requêtes concurrentes au maximum, délai 10 s par URL. L'audit général lit les en-têtes puis ferme le corps ; les candidats de remplacement sont vérifiés séparément par lecture du contenu image, taille, SHA-256 et dimensions PNG lorsqu'elles sont disponibles. Pour les URL d'assets locaux, contrôle de présence sous `public/`.

HTTP 404/410 est distingué de 401/403/429, timeout, DNS, 5xx et paiement requis. Un refus de bot ne justifie jamais une suppression. Un HTTP 200 établit une disponibilité à cet instant ; il ne prouve ni authenticité visuelle, licence d'exploitation, pertinence produit ou disponibilité future.

## Résultats avant et après

| Classification | Avant : GET / fichiers | Après : inventaire réconcilié |
|---|---:|---:|
| Fichier local présent | 474 | 474 |
| Fichier local absent | 9 | 0 |
| HTTP 2xx attendu | 2 577 | 2 619 |
| HTTP 404/410 | 37 | 0 |
| Réponse HTML pour une URL média | 1 | 0 |
| Refus d'accès 401/403/429 | 109 | 110 |
| Réseau indéterminé / timeout / DNS | 302 | 302 |
| HTTP 5xx | 3 | 3 |
| Autres HTTP | 7 | 4 |
| **URL distinctes** | **3 519** | **3 512** |

L'après réconcilie l'inventaire local final avec les résultats GET inchangés et les preuves des nouveaux candidats. Les 3 519 URL ne sont pas toutes interrogées une seconde fois. Les quatre autres HTTP finaux sont des 402 : Shield/Shield App et deux liens Le Monde. Ils ne sont pas présentés comme cassés. **419 URL restent de disponibilité indéterminée ou restreinte**, sans suppression conjecturale.

Pour les 52 liens d'articles : 45 réponses 2xx, 4 restrictions, 1 erreur réseau et 2 réponses 402 ; aucun 404 démontré. Les citations et le contenu des articles sont conservés.

L'audit historique `audit-card-images.mjs`, relancé après correction, passe de 10 références cassées à **0** sur 1 349 cartes : 270 images locales reconnues, 129 fallbacks existants, 28 éléments « review », 922 médias distants non contrôlés par ce script hors réseau. Les « review » mêlent formats dont son parseur ne lit pas les dimensions et images trop petites ; ils ne sont pas assimilés automatiquement à des liens morts. Les contrôles `naturalWidth/naturalHeight` et le fallback logo des cartes restent actifs.

## Corrections établies

Les cinq chemins relatifs éditeur (Flutter, OneTrust, Krea, Webhooks, WeTransfer) avaient été interprétés comme des assets ToolTrim. Les métadonnées officielles ont été relues. Flutter, OneTrust, Krea et Webhooks retrouvent leur origine vérifiée. Le visuel WeTransfer courant ne mesure que 200×200 : sa couverture est retirée au profit du fallback logo déjà existant.

Les captures locales Audionotes et Jenni manquaient ; elles sont remplacées par les visuels Open Graph actuellement déclarés par leurs sites officiels, vérifiés en 200 image. La référence AE GifGun utilise le média local de sa galerie déjà publiée. La capture VisualCV absente est retirée : **c'est l'absence du fichier local qui prouve ce défaut**, pas le 429 du site officiel, qui reste indéterminé.

Les autres anciennes URL 404 ou mal encodées disposent soit d'un média courant dans les métadonnées du site officiel, soit d'aucun remplacement valide. Brandcrowd, Brandpad, Nearst et Saleor n'ont pas de candidat image validé ; leurs références défaillantes sont retirées. Stock Footage retourne du HTML à l'URL supposée de l'image. La carte statique Google Maps était invalide et représentait un lieu, sans constituer un visuel produit : elle n'est pas remplacée par une nouvelle localisation arbitraire.

Destinations : Zoom utilise sa page produit actuelle ; l'ancienne marketplace CloudTask redirige désormais officiellement vers le site éditeur, destination retenue. Pour PluralEyes, l'ancien lien d'acquisition 404 est remplacé par **l'annonce officielle de maintenance**, sans promesse d'offre ou d'achat ; le lien support existant reste disponible dans les données. Les anciennes destinations Logome et Liquid Web Partner Program sont 404 ; aucun site/programme de remplacement adéquat n'a été vérifié. Les champs contenant ces seules destinations mortes sont retirés. Les CTA conditionnels déjà présents les masquent, y compris la navigation locale : aucune garde supplémentaire n'a été ajoutée à cette dernière.

### Liste exacte des champs corrigés

Les URL avant/après, dates d'observation, raisons et sources sont intégrales dans [toolUrlCorrections.json](../src/data/toolUrlCorrections.json). Les lignes suivantes constituent l'inventaire des 62 changements.

| Outil | Champ | Action | Source de remplacement / contexte |
|---|---|---|---|
| `ae-gifgun` | `ogImageUrl` | Remplacement vérifié | [source](https://aescripts.com/gifgun) |
| `audionotes` | `ogImageUrl` | Remplacement vérifié | [source](https://www.audionotes.app/) |
| `brandcrowd` | `ogImageUrl` | Référence retirée | [source](https://www.brandcrowd.com/) |
| `brandpad` | `ogImageUrl` | Référence retirée | [source](https://brandpad.io/) |
| `chatbase` | `ogImageUrl` | Remplacement vérifié | [source](https://www.chatbase.co/) |
| `cloudtask-marketplace` | `affiliateLink` | Remplacement vérifié | [source](https://cloudtask.com/) |
| `cloudtask-marketplace` | `websiteUrl` | Remplacement vérifié | [source](https://cloudtask.com/) |
| `datev` | `ogImageUrl` | Remplacement vérifié | [source](https://www.datev.com/) |
| `docyt` | `ogImageUrl` | Remplacement vérifié | [source](https://www.docyt.com/) |
| `expo` | `ogImageUrl` | Remplacement vérifié | [source](https://expo.dev/) |
| `fathom-analytics` | `ogImageUrl` | Remplacement vérifié | [source](https://usefathom.com/) |
| `figma-weave` | `ogImageUrl` | Remplacement vérifié | [source](https://weave.figma.com/) |
| `flutter` | `ogImageUrl` | Remplacement vérifié | [source](https://flutter.dev/) |
| `fly-io` | `ogImageUrl` | Remplacement vérifié | [source](https://fly.io/) |
| `glide` | `ogImageUrl` | Remplacement vérifié | [source](https://www.glideapps.com/) |
| `glyphe` | `ogImageUrl` | Remplacement vérifié | [source](https://glyphe.eu/) |
| `google-maps` | `ogImageUrl` | Référence retirée | [source](https://www.google.com/maps?ucbcb=1) |
| `heygen` | `ogImageUrl` | Remplacement vérifié | [source](https://www.heygen.com/) |
| `hibob` | `ogImageUrl` | Remplacement vérifié | [source](https://www.hibob.com/) |
| `humaans` | `ogImageUrl` | Remplacement vérifié | [source](https://humaans.io/) |
| `intercom` | `ogImageUrl` | Remplacement vérifié | [source](https://www.intercom.com/) |
| `itsdart` | `ogImageUrl` | Remplacement vérifié | [source](https://www.dartai.com/) |
| `jenni` | `ogImageUrl` | Remplacement vérifié | [source](https://jenni.ai/) |
| `klark` | `ogImageUrl` | Remplacement vérifié | [source](https://klark.app/) |
| `krea` | `ogImageUrl` | Remplacement vérifié | [source](https://www.krea.com/) |
| `liquid-web-partner-program` | `affiliateLink` | Référence retirée | Voir preuves des destinations |
| `liquid-web-partner-program` | `websiteUrl` | Référence retirée | Voir preuves des destinations |
| `logomeai` | `affiliateLink` | Référence retirée | Voir preuves des destinations |
| `logomeai` | `websiteUrl` | Référence retirée | Voir preuves des destinations |
| `loom` | `ogImageUrl` | Remplacement vérifié | [source](https://www.loom.com/) |
| `magnific-ai` | `ogImageUrl` | Remplacement vérifié | [source](https://www.magnific.com/) |
| `mari` | `ogImageUrl` | Remplacement vérifié | [source](https://www.foundry.com/products/mari) |
| `masv` | `ogImageUrl` | Remplacement vérifié | [source](https://masv.io/) |
| `meta-ads` | `ogImageUrl` | Remplacement vérifié | [source](https://www.facebook.com/business/ads) |
| `metabase` | `ogImageUrl` | Remplacement vérifié | [source](https://www.metabase.com/) |
| `nearst` | `ogImageUrl` | Référence retirée | [source](https://near.st/) |
| `onetrust` | `ogImageUrl` | Remplacement vérifié | [source](https://www.onetrust.com/) |
| `pika-labs` | `galleryImages` | Remplacement vérifié | [source](https://pika.art/) |
| `pika-labs` | `ogImageUrl` | Remplacement vérifié | [source](https://pika.art/) |
| `pluraleyes` | `affiliateLink` | Remplacement vérifié | [source](https://www.maxon.net/en/article/pluraleyes-to-enter-limited-maintenance-mode) |
| `prisma` | `ogImageUrl` | Remplacement vérifié | [source](https://www.prisma.io/) |
| `react-hook-form` | `ogImageUrl` | Remplacement vérifié | [source](https://react-hook-form.com/) |
| `redis` | `ogImageUrl` | Remplacement vérifié | [source](https://redis.io/) |
| `saleor` | `ogImageUrl` | Référence retirée | [source](https://saleor.io/) |
| `screen-studio` | `ogImageUrl` | Remplacement vérifié | [source](https://screen.studio/) |
| `sellfy` | `ogImageUrl` | Remplacement vérifié | [source](https://sellfy.com/) |
| `stock-footage` | `ogImageUrl` | Référence retirée | [source](https://stockfootage.com/) |
| `visualcv` | `ogImageUrl` | Référence retirée | [source](https://www.visualcv.com/) |
| `webhooks` | `ogImageUrl` | Remplacement vérifié | [source](https://webhooks.fyi/) |
| `wetransfer` | `ogImageUrl` | Référence retirée | [source](https://wetransfer.com/) |
| `whimsical` | `ogImageUrl` | Remplacement vérifié | [source](https://whimsical.com/) |
| `wistia` | `ogImageUrl` | Remplacement vérifié | [source](https://wistia.com/) |
| `youform` | `ogImageUrl` | Remplacement vérifié | [source](https://youform.com/) |
| `zoom-ai-companion` | `websiteUrl` | Remplacement vérifié | [source](https://www.zoom.com/en/products/ai-assistant/) |

## Cohérence live, projection, SSR et galerie

Un helper JavaScript partagé, `src/lib/toolUrlCorrections.mjs` (déclaration `.d.mts`), applique les mêmes règles à la normalisation complète live, aux résumés live et statiques, à la projection canonique et à la sync locale. Les deux snapshots sont corrigés pour le prérendu et les shards générés. Chaque règle exige **slug + champ + URL attendue exacte** ; une future URL canonique corrigée n'est pas écrasée. Le helper est pur, idempotent, sans fetch ni écriture distante. La sync n'a pas été exécutée contre Supabase.

Preuve du périmètre JSON : 1 349 enregistrements conservés par fichier, 62 champs modifiés dans v4 et 58 dans index, exclusivement `ogImageUrl`, `galleryImages`, `websiteUrl` et `affiliateLink`. Le build intégré relève du lot parent.

Le contrôle visuel des fichiers réels OpenAI, Personio et jQuery confirme respectivement un écran de chargement quasi vide, un challenge « We're verifying your browser » et une capture blanche. La fiche affichait ces covers malgré la blocklist utilisée par les cartes et comparaisons. Trois tests navigateur échouaient sur la présence de ces images avant correction. `isToolCoverBlocked` est désormais commun aux trois surfaces ; il écarte aussi une copie de la cover bloquée dans la galerie, sans retirer les autres vrais médias. La liste historique demeure intacte. **Seule une URL de remplacement exacte, non vide et auditée** peut rétablir la cover d'un slug bloqué ; une future URL inconnue reste bloquée. La vraie galerie locale AE GifGun reste visible, chargée et de largeur naturelle supérieure à 320 px.

## Vérifications persistées

- Tests rouges initiaux : trois échecs de correction URL ; puis verts. Contrôle du retour pur/idempotent, de l'absence de mutations sur les autres champs, de la projection live, des galeries et du remplacement exact autorisé : **11 tests ciblés réussis**, en deux fichiers.
- Compatibilité CI : import et exécution directe du helper sous **Node v20.20.2**, sans chargeur TypeScript ; types application réussis.
- Chromium : **16 cas réussis**, FR/EN × 390/1440 px × Audionotes/Flutter/Logome/Zoom. Images chargées avec dimensions naturelles, destinations corrigées et absence de CTA mort. Quatre captures desktop FR conservées.
- Régression hero : **3 tests rouges puis 6 tests Chromium réussis**, couvrant les captures OpenAI/Personio/jQuery masquées, la galerie AE GifGun préservée et les CTA sans lien FR/EN.
- Checklist React appliquée aux trois composants touchés : aucun nouveau hook/effect, requête ou état ; état dérivé pendant le rendu, mêmes chemins de filtre sur les surfaces, textes alternatifs et médias curatoriaux existants conservés. Les contrôles de build/suites complets et la comparaison CSS appartiennent à la validation intégrée parent.

Les preuves sont sous [proofs/r11-2026-10-15](proofs/r11-2026-10-15/) : inventaire initial, inventaire final réconcilié, candidats officiels et réponses images, destinations officielles, diff de champs des snapshots, tests rouges/verts, import Node20, résultats Chromium et captures. La disponibilité ne certifie pas des droits de réutilisation des médias. Aucun média n'a été synthétisé ou reconstruit pour simuler une capture officielle. Aucun message externe, commit ou push n'est effectué par ce lot.


### Complément final : destinations malformées

Quatre valeurs textuelles de fin de phrase avaient été stockées comme URL et ignorées par le premier extracteur : Snov.io, Plutio, Elfsight et vcita. L’audit les détecte désormais comme `invalid_url`. Les huit champs concernés sont corrigés : quatre sites officiels, vérifiés sur les pages éditeur, et quatre champs affiliés remis à null, sans création de tracking. Les réponses GET sont 200 pour Snov.io/Plutio/Elfsight et 403 pour vcita ; ce dernier reste classé comme accès restreint, pas comme panne. Les sites officiels sont [Snov.io](https://snov.io/), [Plutio](https://www.plutio.com/), [Elfsight](https://elfsight.com/) et [vcita](https://www.vcita.com/).

Quatre tests ont échoué avant cette correction, puis réussi. L’inventaire final complet compte 3 512 URL uniques, sans référence locale absente ni valeur malformée. Les champs exacts sont dans `malformed-destinations-fixed.json` ; ce complément ajoute huit corrections à l’inventaire initial de 54 ci-dessus. L’après réconcilié conserve explicitement les résultats initiaux inchangés et ajoute ces quatre contrôles, sans prétendre à un nouveau crawl intégral.
