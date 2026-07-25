-- Doublons / URL parkée repérés pendant la repasse (vague creation 1) :
--   gamma-ai   -> doublon de gamma (gamma.app réel ; gammaai.com fabriqué)  → 301
--   adcreative -> doublon de adcreative-ai (lien affilié)                     → 301
--   inbound    -> domaine parké (GoDaddy à vendre), pas un produit           → archive
UPDATE public.tools SET content_status='archived'
WHERE slug IN ('gamma-ai','adcreative','inbound') AND content_status='published';
