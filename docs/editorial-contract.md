# Contrat éditorial ToolTrim (fiches canoniques) — v1

Spec réutilisable pour la génération éditoriale FR/EN d'une fiche. Gabarit de référence : le bloc
`editorial_drafts` de `research/tool-pages/n8n.json` (structure à copier exactement).

## Entrées (autorité)
Uniquement les faits collectés du dossier `research/tool-pages/<slug>.json` : `collector.sources`,
`collector.observations`, `collector.claims`, `collector.context_attestations`, captures/`evidence_excerpt`.
Le contenu legacy éventuel est un **signal à vérifier, jamais une autorité**.

## Sortie : `editorial_drafts`
Champs racine : `author="Claude Code"`, `content_version`, `status="draft"`, `generated_on`,
`pricing_facts_policy`, `facts_basis` (= `capture_id` réels du dossier), `fr{...}`, `en{...}`.

Champs FR **et** EN (réellement rédigés séparément, jamais une copie substituée) :
`short_description`, `long_description`, `verdict{keepIf,avoidIf,threshold}`, `pros`, `cons`,
`use_cases`, `covers`, `relevant_for`, `personas`, `functional_needs`, `verticals`,
`solo_relevance`, `team_relevance`, `ai_angle` (clés `augmentFr/replaceFr/idealForFr` en FR,
`augmentEn/replaceEn/idealForEn` en EN, `stance`, `aiTools`), `seo{metaDescription,aiAngle}`,
`pricing_guidance{ free_plan_card?, pricing_model, deployment_note, price_reliability,
usage_sensitive, cautions, plan_details (par plan) }`.

## Règles (non négociables)
- `status="draft"`, pas de `reviewed_by`.
- **Aucun montant / devise / quota / % / durée tarifaire dans la prose NI dans `pricing_guidance`** :
  les faits de prix restent exclusivement dans `collector.observations`.
- FR et EN réellement rédigés ; rédaction concrète, pas de remplissage, pas de superlatif non sourcé,
  pas de phrase générique identique entre outils.
- Expliquer : à qui l'outil convient, quand l'éviter, le niveau technique requis ; distinguer
  éditions (Cloud/desktop/mobile/self-hosted si pertinent) et licence / hébergement / exploitation.
- **Essai gratuit ≠ plan gratuit.** Un tier gratuit durable est un plan gratuit, mais coût total ≠ 0
  s'il y a commissions/infra/frais → `free_plan_card` doit qualifier, jamais impliquer coût nul.
  Pas de plan gratuit durable ⇒ **ne pas** inventer de `free_plan_card`.
- Ne jamais transformer une hypothèse en fait ; un prix non public ⇒ `needs_review`, jamais inventé.

## Contrôles auto (bloquants)
- Tous les champs obligatoires FR+EN non vides ; aucun placeholder.
- Scan devise/montant/quota dans prose + `pricing_guidance` = 0.
- `verdict` structuré ; ≥3 pros / ≥3 cons / ≥3 use_cases si les sources le permettent.
- JSON valide, indent 2 espaces, newline final ; n'écraser QUE `editorial_drafts` (reste du fichier intact).

## Rapport attendu (compact, ≤12 lignes ; ne jamais coller le texte éditorial)
slug ; champs FR/EN OK ; faits saillants retenus ; blocages/needs_review ;
confirmations « aucun prix dans la prose », « essai≠gratuit respecté ».
