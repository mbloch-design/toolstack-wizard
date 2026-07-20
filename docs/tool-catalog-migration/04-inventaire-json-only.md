# Livrable 4 — Inventaire classé des fiches JSON-only

> Lecture seule. Données canoniques (`New project`), 2026-07-16.
> Fichier détaillé : [`inventory-json-only.csv`](./inventory-json-only.csv) — **une ligne par fiche (593)**.
> **Triage de première passe. Chaque bucket exige une validation humaine (D3).**

## 1. Périmètre

593 fiches présentes dans `src/data/tools_v4.json` mais **absentes de Supabase** (`tools`). Elles disparaîtraient du site si le JSON était supprimé avant migration. Aucune n'est un doublon (0 doublon id/slug côté canonique).

## 2. Totaux par bucket

| Bucket | Nombre | Définition |
|---|---:|---|
| `migrer` | **270** | Fiche riche + pricing, scope SaaS → candidate à publier dans Supabase |
| `rechercher` | **303** | Couverture partielle ou pricing/source à (re)collecter |
| `hors_scope_candidate` (ex-`archiver`) | **20** | Librairie/framework dev — hors scope éditorial SaaS |
| `doublon` | **0** | Aucun (Supabase est l'identité canonique, sans collision) |

> **Terminologie** : bucket renommé `hors_scope_candidate` (non destructif) — il **signale** un candidat hors-scope à revoir, sans impliquer de suppression. La colonne `bucket` du CSV porte encore la valeur `archiver` (générée avant le renommage) ; les prochains livrables utilisent `hors_scope_candidate`.

Par confiance, **détaillé par bucket** — correction : il y a **156** `migrer/high`, pas 176. Les 176 high globaux incluent les 20 `hors_scope_candidate/high` :

| Bucket | high | medium | low |
|---|---:|---:|---:|
| `migrer` (270) | **156** | 114 | 0 |
| `rechercher` (303) | 0 | 244 | 59 |
| `hors_scope_candidate` (20) | 20 | 0 | 0 |
| **Total** | **176** | **358** | **59** |

Les `low`/`medium` concentrent les cas à trancher humainement.

## 3. Colonnes du CSV

`id, slug, category, tool_type, quality_9, has_compare_price, has_source_url, signals, bucket, confidence, reason`

- **quality_9** : présence de shortDesc, longDesc, `verdict.keepIf`, pros, cons, covers, `compare_price_monthly_eur`, `official_source_url`, alternatives (0–9).
- **signals** : traces structurées de la décision (voir §4).
- **reason** : phrase de justification par ligne.

## 4. Signaux et règle de classement (structurés, reproductibles)

| Signal | Détection | Effet |
|---|---|---|
| `cat:ui-components` | catégorie = `ui-components` | signal librairie dev |
| `url:github/npm` | `websiteUrl` contient `github.com`/`npmjs.com` | signal librairie dev |
| `txt:library` | description contient `open source`/`bibliothèque`/`framework` (hors `nocode-web`) | signal librairie dev |
| `price:0/none` | `defaultMonthlyPrice=0` **et** pas de `compare_price_monthly_eur` | gratuit à qualifier (plan vs essai) — **jamais archivage seul** |

**Règle :**
- **≥ 2 signaux librairie** → `archiver` (confiance `high`). Ex. `react-router`, `solid-js`, `mantine`, `greensock`, `highcharts`, `apexcharts`, `alpinejs`, `angular-material`, `emotion`, `relay`, `knockout` (20 au total, tous `ui-components`/`prototyping`).
- **1 signal librairie** → `rechercher` (confiance `low`) : OSS possible mais à confirmer (ex. `plane`).
- Sinon **quality ≥ 7 + prix + source** → `migrer` (`high`).
- **quality ≥ 6 + prix** → `migrer` (`medium`, source à confirmer).
- **quality ≥ 4** → `rechercher` (`medium`).
- **quality < 4** → `rechercher` (`low`).

`price:0/none` ne déclenche **jamais** un archivage à lui seul (D5 : distinguer plan gratuit d'un essai via `src/lib/pricing.ts`).

## 5. Répartition par catégorie (top)

- **migrer** : creation 111 · design-tools 33 · project-management 24 · communication 19 · finance 17 · analytics 17
- **rechercher** : nocode-web 84 · creation 52 · analytics 43 · design-tools 23 · ui-components 15 · security 14
- **archiver** : ui-components 19 · prototyping 1

Le bloc `nocode-web` (84) en `rechercher` mérite une passe dédiée (beaucoup de constructeurs de sites à re-sourcer). `creation` domine `migrer` (111).

## 6. Échantillon QA (contrôle des limites du triage)

| bucket | conf | q | id | catégorie | signaux |
|---|---|---|---|---|---|
| migrer | high | 8 | tradingview | creation | — |
| migrer | high | 8 | mailerlite | email-productivity | — |
| migrer | high | 8 | product-hunt | communication | — |
| migrer | medium | 6 | webhooks | automation | — |
| migrer | medium | 6 | figma-slides | design-tools | — |
| rechercher | medium | 6 | payload-cms | nocode-web | price:0/none |
| rechercher | medium | 7 | carrd | nocode-web | — |
| rechercher | low | 8 | plane | project-management | txt:library |
| archiver | high | 7 | react-router | ui-components | cat:ui-components\|txt:library\|price:0/none |
| archiver | high | 7 | apexcharts | ui-components | cat:ui-components\|txt:library\|price:0/none |

**Limites connues à valider humainement :**
- Des entrées `migrer` en `medium` peuvent être des **sous-fonctions/plugins** plutôt que des outils autonomes (ex. `figma-slides`, `canva-templates`, `streamelements-widgets`, `eneroth-face-creator`) → à qualifier `complement`/`host_app` plutôt que fiche indépendante.
- `plane` (OSS PM) est en `rechercher/low` : signal librairie unique, mais c'est un vrai produit — arbitrage humain.
- `nocode-web` volumineux : vérifier les doublons fonctionnels (constructeurs de sites) avant migration.

## 7. Suite proposée (sans écriture)

1. Revue humaine du CSV par bucket, en commençant par `archiver` (20, rapide) puis les `migrer/high` (176).
2. Requalifier les sous-fonctions/plugins détectées.
3. N'ouvrir **RESEARCH** que sur un sous-ensemble validé — en priorité le lot pilote (framer, webflow, wix, squarespace, figma), qui sont **déjà dans Supabase** (matched), pour tester le modèle de provenance avant d'étendre aux JSON-only `migrer`.

Aucune fiche n'est publiée, archivée ou supprimée par ce document.
