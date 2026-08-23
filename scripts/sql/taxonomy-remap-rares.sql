-- Remappage des termes rares de la taxonomie.
--
-- 164 termes n'apparaissaient que sur UNE fiche : ils ne creent aucun lien
-- entre outils, donc ne servent ni a l'exploration ni a l'appariement.
-- Chacun est rattache au terme le plus proche deja porte par au moins trois
-- fiches, ou laisse tel quel quand aucun equivalent honnete n'existe.
--
-- 28 termes sont volontairement CONSERVES : aucun terme solide ne couvre
-- leur sens (audit, localization, traduction, watermark, url-shortening...).
-- Les rapprocher aurait cree de faux voisinages entre outils, ce qui degrade
-- la recommandation sans que cela se voie nulle part.
--
-- Fusions refusees apres relecture, malgre la ressemblance des mots :
--   social-listening -> monitoring  (veille informationnelle vs supervision technique)
--   rigging -> ai-mocap             (le rigging n'est pas de la capture de mouvement)
--   tokens -> coding                (jetons LLM, aucun rapport)
--   api-integration -> integration-llm  (integration API generique)
--   resume-builder -> redaction     (creation de CV, pas de la redaction)
-- Elles ont ete redirigees vers une cible correcte ou annulees.
--
-- A executer APRES taxonomy-merge.sql et taxonomy-fill-covers.sql.

CREATE TEMP TABLE remap_rares(source text PRIMARY KEY, cible text) ON COMMIT DROP;
INSERT INTO remap_rares(source, cible) VALUES
  ('ab-testing', 'analytics'),
  ('academic-writing', 'redaction'),
  ('ad-creative', 'creative-assets'),
  ('agrandissement-photo', 'upscaling'),
  ('ai-agents', 'ai-general'),
  ('ai-builder', 'app-builder'),
  ('ai-chatbot', 'chatbot'),
  ('ai-coding', 'code-generation'),
  ('ai-content', 'content-generation'),
  ('ai-development', 'coding'),
  ('ai-notes', 'notes'),
  ('ai-planning', 'planning'),
  ('ai-productivity', 'assistant-generaliste'),
  ('ai-scheduling', 'calendar'),
  ('ai-tools', 'ai-general'),
  ('ai-video', 'video-creation'),
  ('ai-voice', 'generation-audio'),
  ('ai-writing', 'writing-assistant'),
  ('animation-lignes', 'animation'),
  ('appointment-booking', 'prise-rendez-vous'),
  ('auth', 'security'),
  ('autocompletion', 'code-generation'),
  ('avatar-ia', 'generation-image'),
  ('background-removal', 'detourage'),
  ('backlink-analysis', 'seo'),
  ('baking-3d', 'texturing-3d'),
  ('bases-de-donnees', 'base-de-donnees'),
  ('browser-automation', 'automatisation'),
  ('cartes-paiement', 'paiements'),
  ('chrome-extension', 'developer-tools'),
  ('churn-analysis', 'analytics-produit'),
  ('citation-management', 'knowledge-base'),
  ('code-editor', 'developer-tools'),
  ('collaboration-equipe', 'collaboration'),
  ('collaboration-projet', 'collaboration'),
  ('competitive-intel', 'veille'),
  ('content-automation', 'automatisation'),
  ('content-creation', 'creation'),
  ('contracts', 'legal-contracts'),
  ('crawling', 'web-scraping'),
  ('creation-visuels', 'design-tools'),
  ('creative-brief', 'brief'),
  ('data-warehouse', 'base-de-donnees'),
  ('demo-creation', 'video-creation'),
  ('design', 'design-tools'),
  ('design-to-code', 'handoff-dev'),
  ('direction-artistique', 'branding'),
  ('document-analysis', 'analyse'),
  ('document-automation', 'workflows'),
  ('document-review', 'validation'),
  ('domain-registration', 'hosting'),
  ('ecommerce-retention', 'ecommerce'),
  ('email-triage', 'email'),
  ('emailing', 'email-marketing'),
  ('enregistrement-simple', 'screen-recording'),
  ('etl', 'data-fetching'),
  ('export-lottie', 'animation'),
  ('feature-flags', 'developer-tools'),
  ('file-storage', 'cloud-storage'),
  ('fine-tuning', 'ai-general'),
  ('flowcharts', 'diagramming'),
  ('freelance-finance', 'finance'),
  ('gestion-communaute', 'communaute'),
  ('gestion-equipe', 'team-collaboration'),
  ('habits', 'planning'),
  ('heatmaps', 'analytics-ux'),
  ('icones', 'icons'),
  ('image-enhancement', 'photo-enhancement'),
  ('information-architecture', 'wireframing'),
  ('intent-signals', 'analytics'),
  ('issue-tracking', 'bug-tracking'),
  ('jingles', 'generation-audio'),
  ('job-application', 'ats'),
  ('job-search', 'sourcing'),
  ('keyword-research', 'seo'),
  ('link-management', 'website-builder'),
  ('linkedin-outreach', 'prospection'),
  ('logs', 'observabilite'),
  ('meeting-management', 'calendar'),
  ('meeting-summary', 'notes-reunion'),
  ('optimisation-youtube', 'seo-video'),
  ('paiement-abonnements', 'paiements'),
  ('payment-processing', 'paiements'),
  ('performance-app', 'performance'),
  ('personal-productivity', 'assistant-generaliste'),
  ('photo-manipulation', 'retouche-photo'),
  ('portrait-ia', 'generation-image'),
  ('presets-animation', 'animation'),
  ('productivity-docs', 'documentation'),
  ('real-time-search', 'recherche'),
  ('recherche-notes', 'knowledge-management'),
  ('references-visuelles', 'references'),
  ('remplacement-ciel', 'retouche-photo'),
  ('retouche-portrait', 'retouche-photo'),
  ('revue-code', 'code-review'),
  ('rigging-personnages', 'animation-2d-3d'),
  ('rigging-simple', 'animation-2d-3d'),
  ('saas-development', 'coding'),
  ('scenography', '3d'),
  ('segmentation', 'analytics-produit'),
  ('simulation-physique', 'simulation'),
  ('site-audit', 'seo'),
  ('social-listening', 'veille'),
  ('social-media-video', 'social-media'),
  ('social-monitoring', 'veille'),
  ('sop', 'documentation'),
  ('speech-to-text', 'transcription'),
  ('sql', 'base-de-donnees'),
  ('ssl', 'security'),
  ('subscription-management', 'paiements'),
  ('tax-compliance', 'finance'),
  ('team-communication', 'team-collaboration'),
  ('terrain-3d', 'generation-3d'),
  ('threat-detection', 'security'),
  ('ticket-management', 'helpdesk'),
  ('traduction-video', 'video-editing'),
  ('transfert-vectoriel', 'illustration-vectorielle'),
  ('tutorial-creation', 'creation-cours'),
  ('ui-icons', 'icons'),
  ('ux-design', 'ui-design'),
  ('ux-ui', 'ui-design'),
  ('vector-design', 'illustration-vectorielle'),
  ('veille-concurrentielle', 'veille'),
  ('video-narration', 'video-creation'),
  ('video-repurposing', 'content-repurposing'),
  ('video-tutorial', 'video-creation'),
  ('virements-sepa', 'paiements'),
  ('visual-identity', 'branding'),
  ('visual-organization', 'organization'),
  ('visualisation-architecturale', '3d'),
  ('voice-notes', 'notes'),
  ('voice-over', 'generation-audio'),
  ('voice-to-text', 'transcription'),
  ('voix-chantee', 'generation-audio'),
  ('vr-architecture', '3d'),
  ('whiteboard', 'brainstorming');

UPDATE public.tools t SET covers = (
  SELECT jsonb_agg(DISTINCT COALESCE(m.cible, v))
  FROM jsonb_array_elements_text(t.covers) v
  LEFT JOIN remap_rares m ON m.source = v
)
WHERE t.covers IS NOT NULL AND jsonb_array_length(t.covers) > 0
  AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(t.covers) v JOIN remap_rares m ON m.source = v);

UPDATE public.tools t SET functional_needs = (
  SELECT jsonb_agg(DISTINCT COALESCE(m.cible, v))
  FROM jsonb_array_elements_text(t.functional_needs) v
  LEFT JOIN remap_rares m ON m.source = v
)
WHERE t.functional_needs IS NOT NULL AND jsonb_array_length(t.functional_needs) > 0
  AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(t.functional_needs) v JOIN remap_rares m ON m.source = v);
