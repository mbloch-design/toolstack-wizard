-- Recatégorisation finale des entrées 'placeholder' (preuve HTTP à l'appui).
-- Archive : URL morte (DNS inexistant) OU domaine parké/générique (pas de produit réel),
-- + 4 combos/doublons redirigés en 301 vers leur vrai produit (voir vercel.json).
-- 'archived' sort les fiches de catalog_api.published_tool_projection. Réversible.
--
-- Redirections 301 (aussi archivées ici pour quitter l'index) :
--   zapier-make -> zapier
--   webflow-framer -> webflow
--   krea -> krea-ai
--   teleprompter-apps -> teleprompter
--
-- Gardés (remplis via la campagne sourcée, NON archivés) : tiktok, brand-kits, teleprompter, topaz

UPDATE public.tools
SET content_status = 'archived'
WHERE slug IN (
  'affiliate-dashboards',
  'affiliate-tools',
  'archive-tools',
  'bots-discord',
  'canva-kits',
  'canva-templates',
  'capcut-templates',
  'caption-tools',
  'chart-tools',
  'chatgpt-pour-brouillons-non-juridiques',
  'comfyui-workflows',
  'content-credentials-tools',
  'emoji-sticker-packs',
  'figma-templates',
  'form-apps',
  'frame-guides',
  'gaming-overlays',
  'krea',
  'krea-selon-metier',
  'lighting-kits',
  'lightroom-presets',
  'link-in-bio',
  'link-in-bio-tools',
  'map-tools',
  'media-kit-templates',
  'meme-templates',
  'mobile-gimbal-apps',
  'mockup-plugins',
  'music-libraries',
  'newsletter-referral-tools',
  'overlays',
  'pennylane-ai-selon-dispo',
  'pennylane-ou-indy',
  'pennylane-qonto',
  'presets',
  'presets-lightroom',
  'prompt-libraries',
  'recipe-card-templates',
  'review-tools',
  'scheduling-tools',
  'screen-capture-tools',
  'screenshot-tools',
  'shared-cloud-folders',
  'social-schedulers',
  'stock-footage',
  'subtitle-tools',
  'teleprompter-apps',
  'templates',
  'templates-ugc',
  'utm-builders',
  'webflow-framer',
  'webhooks',
  'workout-templates',
  'zapier-make'
)
AND content_status = 'published';

-- Vérification :
-- SELECT slug, content_status FROM public.tools WHERE content_status='archived' ORDER BY slug;
