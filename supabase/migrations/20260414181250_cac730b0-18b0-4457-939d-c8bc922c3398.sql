
-- 1. Fix the 6 Adobe aliases in cluster tool_ids
UPDATE public.clusters
SET tool_ids = (
  SELECT jsonb_agg(
    CASE e.val
      WHEN 'photoshop' THEN '"adobe-photoshop"'::jsonb
      WHEN 'illustrator' THEN '"adobe-illustrator"'::jsonb
      WHEN 'lightroom' THEN '"adobe-lightroom"'::jsonb
      WHEN 'premiere-pro' THEN '"adobe-premiere-pro"'::jsonb
      WHEN 'after-effects' THEN '"adobe-after-effects"'::jsonb
      WHEN 'adobe-creative-cloud' THEN '"adobe-cc"'::jsonb
      ELSE to_jsonb(e.val)
    END
  )
  FROM jsonb_array_elements_text(tool_ids) AS e(val)
)
WHERE tool_ids::text ~ '(photoshop|illustrator|lightroom|premiere-pro|after-effects|adobe-creative-cloud)';

-- 2. Insert all genuinely missing tools
INSERT INTO public.tools (id, name, slug, category, default_monthly_price, website_url, short_description, tool_type) VALUES
-- Communication
('zoom', 'Zoom', 'zoom', 'communication', 13.33, 'https://zoom.us', 'Visioconférence et réunions en ligne', 'satellite'),
('discord', 'Discord', 'discord', 'communication', 0, 'https://discord.com', 'Messagerie vocale et textuelle pour communautés', 'satellite'),
('teams', 'Microsoft Teams', 'teams', 'communication-team', 4.20, 'https://microsoft.com/teams', 'Communication et collaboration Microsoft', 'satellite'),

-- Design & Creative
('framer', 'Framer', 'framer', 'design-tools', 5, 'https://framer.com', 'Design et publication de sites web interactifs', 'satellite'),
('sketch', 'Sketch', 'sketch', 'design-tools', 10, 'https://sketch.com', 'Design UI/UX pour macOS', 'satellite'),
('adobe-xd', 'Adobe XD', 'adobe-xd', 'design-tools', 0, 'https://adobe.com/products/xd', 'Prototypage et design UI (abandonné)', 'satellite'),
('miro', 'Miro', 'miro', 'design-tools', 0, 'https://miro.com', 'Tableau blanc collaboratif en ligne', 'satellite'),
('affinity-photo', 'Affinity Photo', 'affinity-photo', 'design-tools', 0, 'https://affinity.serif.com/photo', 'Retouche photo professionnelle (achat unique)', 'satellite'),
('snapseed', 'Snapseed', 'snapseed', 'design-tools', 0, 'https://snapseed.online', 'Retouche photo mobile par Google', 'satellite'),
('indesign', 'Adobe InDesign', 'indesign', 'design-tools', 26.21, 'https://adobe.com/products/indesign', 'Mise en page et PAO professionnelle', 'satellite'),
('final-cut-pro', 'Final Cut Pro', 'final-cut-pro', 'creation', 0, 'https://apple.com/final-cut-pro', 'Montage vidéo professionnel Apple (achat unique)', 'satellite'),
('gamma', 'Gamma', 'gamma', 'creation', 0, 'https://gamma.app', 'Présentations et documents alimentés par IA', 'satellite'),
('google-slides', 'Google Slides', 'google-slides', 'creation', 0, 'https://docs.google.com/presentation', 'Présentations collaboratives Google', 'satellite'),

-- Project Management
('monday-com', 'Monday.com', 'monday-com', 'project-management', 9, 'https://monday.com', 'Gestion de projets et workflows visuels', 'satellite'),

-- AI
('jasper', 'Jasper', 'jasper', 'ai-general', 39, 'https://jasper.ai', 'Assistant IA pour le marketing et la rédaction', 'satellite'),

-- Analytics
('google-analytics', 'Google Analytics', 'google-analytics', 'analytics', 0, 'https://analytics.google.com', 'Analytics web gratuit par Google', 'satellite'),
('metricool', 'Metricool', 'metricool', 'analytics', 0, 'https://metricool.com', 'Analytics et planification réseaux sociaux', 'satellite'),

-- Hébergement & Infra
('firebase', 'Firebase', 'firebase', 'nocode-web', 0, 'https://firebase.google.com', 'Plateforme backend Google (auth, DB, hosting)', 'core'),
('netlify', 'Netlify', 'netlify', 'nocode-web', 0, 'https://netlify.com', 'Hébergement et déploiement JAMstack', 'satellite'),
('heroku', 'Heroku', 'heroku', 'nocode-web', 5, 'https://heroku.com', 'Plateforme cloud pour déployer des apps', 'satellite'),
('digitalocean', 'DigitalOcean', 'digitalocean', 'nocode-web', 5, 'https://digitalocean.com', 'Cloud computing et hébergement', 'satellite'),
('fly-io', 'Fly.io', 'fly-io', 'nocode-web', 0, 'https://fly.io', 'Déploiement global de containers', 'satellite'),
('railway', 'Railway', 'railway', 'nocode-web', 5, 'https://railway.app', 'Déploiement simplifié de backends', 'satellite'),
('render', 'Render', 'render', 'nocode-web', 0, 'https://render.com', 'Cloud moderne pour apps, APIs et sites', 'satellite'),
('supabase', 'Supabase', 'supabase', 'nocode-web', 0, 'https://supabase.com', 'Alternative open source à Firebase (Postgres, auth, storage)', 'core'),

-- Bases de données
('neon', 'Neon', 'neon', 'nocode-web', 0, 'https://neon.tech', 'Base de données Postgres serverless', 'satellite'),
('planetscale', 'PlanetScale', 'planetscale', 'nocode-web', 0, 'https://planetscale.com', 'Base de données MySQL serverless', 'satellite'),
('mongodb-atlas', 'MongoDB Atlas', 'mongodb-atlas', 'nocode-web', 0, 'https://mongodb.com/atlas', 'Base de données NoSQL cloud', 'satellite'),

-- Automation
('n8n', 'n8n', 'n8n', 'automation', 0, 'https://n8n.io', 'Automatisation de workflows open source', 'satellite'),

-- CRM & Marketing
('hubspot', 'HubSpot', 'hubspot', 'organization', 0, 'https://hubspot.com', 'CRM, marketing et ventes tout-en-un', 'core'),
('folk', 'Folk', 'folk', 'organization', 19, 'https://folk.app', 'CRM léger et collaboratif', 'satellite'),

-- Email & Newsletter
('brevo', 'Brevo', 'brevo', 'email-productivity', 0, 'https://brevo.com', 'Email marketing et automatisation (ex Sendinblue)', 'satellite'),
('ghost', 'Ghost', 'ghost', 'nocode-web', 9, 'https://ghost.org', 'Plateforme de publication et newsletter', 'satellite'),

-- Paiement
('paypal', 'PayPal', 'paypal', 'finance', 0, 'https://paypal.com', 'Paiements en ligne et transferts', 'satellite'),
('gumroad', 'Gumroad', 'gumroad', 'finance', 0, 'https://gumroad.com', 'Vente de produits numériques', 'satellite'),
('lemonsqueezy', 'Lemon Squeezy', 'lemonsqueezy', 'finance', 0, 'https://lemonsqueezy.com', 'Paiements pour créateurs et SaaS', 'satellite'),
('wave', 'Wave', 'wave', 'finance', 0, 'https://waveapps.com', 'Comptabilité et facturation gratuite', 'satellite'),
('pennylane', 'Pennylane', 'pennylane', 'finance', 35, 'https://pennylane.com', 'Comptabilité collaborative en temps réel', 'satellite'),
('xero', 'Xero', 'xero', 'finance', 15, 'https://xero.com', 'Logiciel de comptabilité cloud', 'satellite'),
('tiime', 'Tiime', 'tiime', 'finance', 0, 'https://tiime.fr', 'Comptabilité automatisée pour indépendants', 'satellite'),

-- Sécurité
('bitwarden', 'Bitwarden', 'bitwarden', 'security', 0, 'https://bitwarden.com', 'Gestionnaire de mots de passe open source', 'satellite'),
('dashlane', 'Dashlane', 'dashlane', 'security', 4, 'https://dashlane.com', 'Gestionnaire de mots de passe et VPN', 'satellite'),
('lastpass', 'LastPass', 'lastpass', 'security', 3, 'https://lastpass.com', 'Gestionnaire de mots de passe', 'satellite'),
('nordpass', 'NordPass', 'nordpass', 'security', 1.99, 'https://nordpass.com', 'Gestionnaire de mots de passe par NordVPN', 'satellite'),

-- Stockage
('onedrive', 'OneDrive', 'onedrive', 'storage', 0, 'https://onedrive.com', 'Stockage cloud Microsoft', 'satellite'),
('wetransfer', 'WeTransfer', 'wetransfer', 'storage', 0, 'https://wetransfer.com', 'Transfert de fichiers volumineux', 'satellite'),

-- Réseaux sociaux
('publer', 'Publer', 'publer', 'analytics', 0, 'https://publer.io', 'Planification et analytics réseaux sociaux', 'satellite'),

-- RH
('bamboohr', 'BambooHR', 'bamboohr', 'organization', 0, 'https://bamboohr.com', 'Logiciel RH et gestion des talents', 'satellite'),
('gusto', 'Gusto', 'gusto', 'finance', 40, 'https://gusto.com', 'Paie et avantages sociaux', 'satellite'),
('rippling', 'Rippling', 'rippling', 'organization', 8, 'https://rippling.com', 'RH, paie et gestion IT unifiée', 'satellite')

ON CONFLICT (id) DO NOTHING;
