/**
 * Colonnes de la table Supabase `tools` réellement consommées par le site.
 *
 * `select("*")` sur cette table tire 64 colonnes par ligne, dont 6 ne sont lues
 * nulle part dans le code, client ou build : `legacy_payload` à lui seul pèse
 * la moitié du poids d'une ligne. Cette table alimente à la fois le prérendu
 * (vite.config.ts, sous Node) et le rafraîchissement client (useSupabaseData.ts,
 * dans le navigateur), d'où ce fichier partagé plutôt que deux listes qui
 * pourraient diverger.
 *
 * Colonnes retirées, confirmées sans aucune référence dans vite.config.ts ni
 * src/ (hors fichiers de données qui ne font que refléter la même clé) :
 * `content_status`, `editorially_reviewed_at`, `legacy_payload`,
 * `next_review_at`, `research_status`, `trial_days`.
 *
 * Si une future fonctionnalité a besoin d'une de ces colonnes, l'ajouter ici
 * la réactive partout d'un coup.
 */
export const TOOLS_TABLE_COLUMNS = [
  "id", "name", "slug", "category", "short_description", "long_description",
  "affiliate_link", "website_url", "default_monthly_price", "pricing", "logo",
  "solo_relevance", "team_relevance", "verdict", "pros", "cons", "use_cases",
  "covers", "relevant_for", "alternatives", "seo", "articles",
  "time_gained_hours_per_month", "free_alternative", "personas", "tool_type",
  "substitutable", "host_app", "bundle_parent", "verticals", "functional_needs",
  "ia_use_case", "better_alternative", "migration_guide", "downgrade_plan",
  "prescription_quality", "prescription_output", "prescription_block_reasons",
  "prescription_context_questions", "substitution_cluster_v2", "pricing_v5",
  "decision_policy_v3", "short_description_en", "long_description_en",
  "pros_en", "cons_en", "use_cases_en", "verdict_en", "pricing_en",
  "pertinence_by_persona", "force_silence", "og_image_url", "gallery_images",
  "data_contract", "published_at", "updated_at", "form_factor", "works_with",
] as const;

export const TOOLS_TABLE_SELECT = TOOLS_TABLE_COLUMNS.join(",");
