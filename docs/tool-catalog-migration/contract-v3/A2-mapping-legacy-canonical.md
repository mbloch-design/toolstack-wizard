# Artefact 2/6 — Mapping legacy → canonical (+ import des 593 payloads complets)

> Rév. 4.10. **Aucune écriture Supabase/JSON.** Coexistence `legacy`/`canonical`, clés déterministes et conservation privée des payloads/preuves collecteur.

## Mapping champ à champ

| Legacy (`public.tools` colonnes historiques) | Canonical (`catalog_private.*`) | En mode `legacy` |
|---|---|---|
| `short/long_description(_en), pros, cons, covers, use_cases, verdict(_en), seo, relevant_for` | `tool_editorial_content` (par `lang`) | **colonnes historiques lues telles quelles** |
| `gallery_images`, `aiAngle` (ou `seo.aiAngle`) | `tool_editorial_content.gallery_images`, `ai_angle` | fallback depuis `legacy_payload` complet |
| présentation `pricing_v5` (`costTable*`, `cautions`, `tcoExample*`, `minSeats`, `usage_sensitive`, `price_reliability`, `billing_options`) | `tool_editorial_content.pricing_guidance` | `pricing_v5` historique, sans le présenter comme observation native |
| `pricing_v5.compare_plan_name`, `compare_plan_kind` | `tool_plans.plan_key` + `pricing_unit` + `is_compare_plan` | `pricing_v5` lu |
| `pricing_v5.compare_price_monthly_eur` | `tool_price_observations.normalized_monthly_eur` (calculé) | conversion legacy **séparée** (jamais native) |
| `pricing.paid/free`, `defaultMonthlyPrice` | observations natives + `tool_plans.is_free` | lus tels quels ; `is_free` via `hasGenuineFreeTier` |
| `pricing_v5.official_source_url`, `verified_on` | `tool_sources` + `tool_source_captures` | lus tels quels |
| noms de plans localisés | `tool_plan_localizations` | (aucun équivalent legacy) |
| `alternatives, betterAlternative, free_alternative, host_app, bundle_parent` | `tool_relationships` (`substitutes`/`extends`/`complements`) | **restitués depuis legacy** (artefact 5 §relations) |
| `substitution_cluster_v2, decision_policy_v3, prescription_*, pertinence_by_persona, force_silence, functional_needs, ia_use_case, downgrade_plan` | **hors contrat actif** (Diagnostic différé) | conservés sans projection ni migration dans cette révision |
| — | `public.tools.data_contract` (`legacy`→`canonical`) | pilote la source lue |

Legacy purs à retirer en fin de migration : `bestFor, link, website, pricingTiers, tags, pivot_integration_source, categoryId, description`.

## Import des 593 payloads legacy **complets** (nécessaires aux resolvers)

Les resolvers `legacy_is_free`, `legacy_freshness`, `legacy compare` (artefact 4) lisent `pricing`, `pricing_v5`, `default_monthly_price`, `short_description(_en)`, etc. L'import M0 doit donc apporter **le payload complet**, pas seulement l'identité.

Le chargeur M0 lit `manifest-1126.json`, stage les **1 126 objets complets** de `src/data/tools_v4.json`, marque `is_json_only=true` pour les 593 slugs de `legacyJsonOnlySlugs` et calcule le SHA-256 de chaque payload canonically serialized. Les 533 lignes existantes reçoivent ainsi aussi leur `legacy_payload` complet (utile à la compatibilité et à d'éventuels usages futurs), puis seules les 593 absentes sont insérées. Ce chargement est une opération future : il n'a pas été exécuté pendant la rédaction.

```sql
-- ⛔ BROUILLON NON EXÉCUTÉ. Précondition : stage=1126 dont 593 JSON-only,
-- hashes vérifiés, commit identique au manifeste.
update public.tools t set legacy_payload=s.payload
from catalog_private.legacy_import_stage s
where s.slug=t.slug and not s.is_json_only;

insert into public.tools (
  id, slug, name, category, tool_type, website_url, affiliate_link, logo, og_image_url,
  short_description, short_description_en, long_description, long_description_en,
  pricing, pricing_en, default_monthly_price, pricing_v5,
  verdict, verdict_en, pros, pros_en, cons, cons_en, covers, use_cases, use_cases_en,
  relevant_for, seo, articles, alternatives, functional_needs, verticals, personas,
  better_alternative, free_alternative, migration_guide, downgrade_plan,
  solo_relevance, team_relevance, time_gained_hours_per_month, substitutable,
  prescription_quality, prescription_output, prescription_block_reasons,
  prescription_context_questions, substitution_cluster_v2, decision_policy_v3,
  pertinence_by_persona, force_silence, ia_use_case, host_app, bundle_parent,
  data_contract, research_status, content_status, legacy_payload
)
select
  p->>'id', coalesce(p->>'slug',p->>'id'), p->>'name',
  case when exists (select 1 from public.categories c where c.id=coalesce(p->>'category',p->>'categoryId'))
       then coalesce(p->>'category',p->>'categoryId') else null end,
  coalesce(p->>'tool_type','satellite'), coalesce(p->>'websiteUrl',p->>'website',p->>'link'),
  p->>'affiliateLink', p->>'logo', p->>'ogImageUrl',
  p->>'shortDescription', p->>'shortDescriptionEn',
  coalesce(p->>'longDescription',p->>'description'), coalesce(p->>'longDescriptionEn',p->>'descriptionEn'),
  coalesce(p->'pricing',p->'pricingTiers'), p->'pricingEn', nullif(p->>'defaultMonthlyPrice','')::numeric, p->'pricing_v5',
  coalesce(p->'verdict',p->'verdictFr'), p->'verdictEn', p->'pros', p->'prosEn', p->'cons', p->'consEn',
  p->'covers', p->'useCases', p->'useCasesEn', p->'relevantFor', p->'seo', p->'articles', p->'alternatives',
  p->'functional_needs', p->'verticals', p->'personas', p->'betterAlternative', p->>'freeAlternative',
  p->'migrationGuide', p->'downgradePlan', p->>'soloRelevance', p->>'teamRelevance',
  nullif(p->>'timeGainedHoursPerMonth','')::numeric, coalesce((p->>'substitutable')::boolean,true),
  coalesce(p->>'prescription_quality','silence'), p->'prescription_output', p->'prescription_block_reasons',
  p->'prescription_context_questions', p->>'substitution_cluster_v2', p->'decision_policy_v3',
  p->'pertinence_by_persona', coalesce((p->>'force_silence')::boolean,false), p->'ia_use_case',
  p->>'host_app', p->>'bundle_parent', 'legacy', 'todo', 'draft', p
from (select payload p from catalog_private.legacy_import_stage where is_json_only) staged
on conflict (id) do nothing;
```

Le `legacy_payload` conserve aussi les relations absentes du schéma historique (`complements`, `integrates_with`, `relations`) et tout champ futur présent dans le JSON. Les projections lisent les colonnes typées d'abord, puis ce payload pour ces seules extensions ; aucune donnée nécessaire au resolver n'est perdue.

**Gate M0** : stage = **1 126** dont `is_json_only=593`, backfill payload = **533**, import = **593**, `count(public.tools)=1126`, 0 ligne `data_contract='canonical'`, aucun hash/commit divergent, et parité de projection sur les 1 126 (tests de l'artefact 6).

## Import idempotent des faits et du ledger (rév. 4.10)

Cet import est distinct de M0 et s'effectue slug par slug, après les sources/captures et avant toute approbation.

Les UUID SQL restent des identifiants internes. Le chargeur conserve obligatoirement les identifiants déterministes locaux :

- `source_id` local → `tool_sources.collector_id`, unique par outil ;
- `capture_id` local → `tool_source_captures.collector_id`, unique par source ;
- `observation_id` → `tool_price_observations.collector_id`, unique par plan ;
- `claim_id` → `tool_claims.collector_id`, unique par outil ;
- localisations/relations sans ID natif → IDs `loc:`/`rel:` calculés sur leur clé métier complète, uniques dans leur périmètre.

Cette portée est nécessaire : `sourceIdOf(url)` et `claimIdOf(key,value)` ne contiennent pas le slug et peuvent donc être identiques pour deux outils différents. Les rendre globalement uniques serait incorrect.

Chaque source, capture, observation et claim conserve aussi son objet local dans `collector_payload`. Les colonnes typées pilotent les contraintes et resolvers ; le payload privé garantit qu'aucun sélecteur, extrait, preuve secondaire, candidat de contexte ou champ d'une future version du collecteur n'est perdu pendant l'import.

Le mapper pur `scripts/research-stage-model.mjs` produit d'abord une proposition `STAGING_PROPOSAL_ONLY` en mémoire. Les références `source_collector_id`, `capture_collector_id` et `plan_ref` y sont volontairement des clés locales : l'importeur SQL les résout vers les UUID privés dans la même transaction. Elles ne sont donc pas des colonnes supplémentaires du contrat. La proposition est refusée si une référence est orpheline, une clé déterministe est dupliquée ou un statut `approved` est injecté.

1. Upserter sources/captures par leurs clés collecteur et résoudre leurs UUID SQL.
2. `collector.context_attestations[]` → `tool_context_attestations`, payload intégral conservé ; chaque basis est reliée à la capture SQL correspondant à son URL+hash.
3. `review_attestations[]` → `tool_review_attestations`, identifiant local et `collector_payload` intégral conservés, FK vers la basis ; les champs `active/revoked_*` ne réécrivent pas l'acte initial.
4. Pour toute attestation locale portant `revoked_at`, produire un événement déterministe `attestation_revoked` lié à l'attestation. Au premier import Wix, aucun fait n'est encore approuvé : la garde de dépendances autorise donc cet événement.
5. Importer les événements de contexte/incidents de `review_events[]` en conservant l'identifiant local ; un type local d'incident est normalisé en `incident_recorded`, avec le type original dans `payload`.
6. Upserter plans, observations et claims par leurs clés déterministes, uniquement en `observed` ; une attestation active ne change aucun statut.
7. Importer ensuite les éventuels événements visant ces faits, car le trigger refuse tout sujet inexistant.
8. Une revue humaine ultérieure insère d'abord un événement d'approbation attribué, puis passe la ligne visée à `approved` avec `approval_event_id` et, pour `reference_fr`, `context_attestation_id`.

Idempotence : basis, attestations humaines et événements utilisent leurs identifiants déterministes avec `ON CONFLICT DO NOTHING`. Une seconde passe identique crée zéro ligne et ne modifie aucun acte antérieur.

**Wix avant l'acte réel** : les 17 basis actuelles importées avec leur payload, 1 attestation humaine historique importée, 1 événement de révocation synthétisé, 1 événement d'incident importé, 0 attestation humaine active, 4 observations `observed`, 0 `approved`.

### Outillage local de préparation (non appliqué)

- `node scripts/research-stage.mjs --slug=wix` : résumé déterministe uniquement ; zéro réseau, zéro fichier écrit, zéro SQL.
- `--show-plan` : affiche la proposition complète sur stdout pour audit.
- `--emit-sql` : affiche sur stdout un brouillon transactionnel qui exige le manifeste matérialisé et termine obligatoirement par `ROLLBACK` ; il ne possède aucun chemin `COMMIT`.
- `--apply` est explicitement refusé par le CLI.

La rév. 4.9 a été validée sur PostgreSQL 16 jetable pour A1 + import Wix ×2, en rollback-only. La rév. 4.10 rend explicite le `GRANT SELECT public.tools TO service_role` qui avait dû être ajouté au harnais vanilla. Le chemin API A4/A5 reste à valider dans une seconde répétition générale complète avant toute autorisation Supabase.

Les relations sont désormais câblées comme faits `proposed` uniquement : cible présente dans le manifeste et `content_status='published'`, explication FR ou EN, capture source obligatoire pour une relation issue de la recherche, payload brut conservé et aucun événement d'approbation synthétisé. Le mapper distingue toujours le **slug public** de l'**ID SQL** : cette règle couvre notamment `aircall → aircall-inc` et `kit → convertkit`, les deux écarts réels du catalogue actuel.

Avant la bascule d'une fiche, l'import éditorial extrait également du payload complet : `gallery_images`, `aiAngle` (fallback `seo.aiAngle`) et les seuls sous-champs de présentation de `pricing_v5`. Les montants, devises, engagements, dates et sources comparatives restent exclusivement dans `tool_price_observations`/captures ; `pricing_guidance` ne doit jamais devenir une seconde source de vérité factuelle.

## Invariant de coexistence

Tant que `data_contract='legacy'`, un outil lit **uniquement** ses colonnes historiques. Le passage `canonical` d'un outil est une transaction unique (artefact 6) : dès lors, la projection lit `catalog_private.*` pour ce slug, les autres restant `legacy` — sans divergence, car la projection est unique.
