
INSERT INTO public.tools (id, slug, name, category, default_monthly_price, bundle_parent, tool_type, website_url) VALUES
  ('canva-pro', 'canva-pro', 'Canva Pro', 'creation', 13, NULL, 'core', 'https://www.canva.com/pro/'),
  ('canva-ai', 'canva-ai', 'Canva AI', 'ai-general', 0, 'canva-pro', 'ia', 'https://www.canva.com/ai/'),
  ('microsoft-365', 'microsoft-365', 'Microsoft 365', 'productivity-tracking', 7, NULL, 'core', 'https://www.microsoft.com/microsoft-365'),
  ('microsoft-teams', 'microsoft-teams', 'Microsoft Teams', 'communication-team', 0, 'microsoft-365', 'satellite', 'https://www.microsoft.com/teams'),
  ('remove-bg', 'remove-bg', 'Remove.bg', 'creation', 0, 'adobe-photoshop', 'satellite', 'https://www.remove.bg/'),
  ('zoom-pro', 'zoom-pro', 'Zoom Pro', 'communication', 14, NULL, 'core', 'https://zoom.us/pricing'),
  ('zoom-ai-companion', 'zoom-ai-companion', 'Zoom AI Companion', 'ai-general', 0, 'zoom-pro', 'ia', 'https://zoom.us/ai-assistant')
ON CONFLICT (id) DO UPDATE SET
  bundle_parent = EXCLUDED.bundle_parent,
  default_monthly_price = EXCLUDED.default_monthly_price;

UPDATE public.tools SET bundle_parent = 'canva-pro' WHERE id = 'canva';
UPDATE public.tools SET bundle_parent = 'zoom-pro' WHERE id = 'zoom';
