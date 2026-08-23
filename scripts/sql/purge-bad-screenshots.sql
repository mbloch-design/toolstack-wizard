-- Retrait des captures de secours inutilisables.
--
-- 41 fiches affichaient comme visuel une page de challenge anti-bot
-- (« Performing security verification », « Sorry, you have been blocked »,
-- « One more step ») ou une capture blanche, y compris sur des outils phares :
-- Midjourney, Perplexity, Gusto, Product Hunt, ArtStation, Unreal Engine.
--
-- Le seul controle du script de capture etait la taille du fichier (> 2 Ko) :
-- une page Cloudflare pese son poids normal et passait donc sans encombre.
-- Un garde-fou lisant le HTML de la page source a ete ajoute a
-- scripts/screenshot-fallback-images.mjs ; ce fichier traite l'existant.
--
-- METHODE : la sonde HTTP seule ne suffit pas — un site peut servir un
-- challenge aujourd'hui alors que la capture stockee est bonne (power-bi,
-- looka, itch-io sont dans ce cas et sont CONSERVES). Chaque image a ete
-- regardee, et le seuil de taille calibre sur deux bornes verifiees a l'oeil :
-- auto-rig-pro (32 Ko, page « blocked ») et looka (48 Ko, vraie capture).
--
-- og_image_url repasse a NULL : la fiche s'affiche alors sans visuel de
-- couverture, ce qui vaut mieux qu'une page d'erreur presentee comme le produit.
UPDATE public.tools SET og_image_url = NULL
WHERE slug IN (
  ('app-store-connect'),
  ('artlist'),
  ('artstation'),
  ('auto-rig-pro'),
  ('coupa'),
  ('drata'),
  ('excel'),
  ('figma-stark'),
  ('flask'),
  ('gusto'),
  ('hard-ops-boxcutter'),
  ('ideogram'),
  ('insightly'),
  ('jobber'),
  ('jquery'),
  ('justworks'),
  ('kling-ai'),
  ('leonardo-ai'),
  ('lottie'),
  ('lottiefiles'),
  ('lusha'),
  ('midjourney'),
  ('motion'),
  ('motion-array'),
  ('motion-bro'),
  ('namecheap'),
  ('openai'),
  ('perplexity'),
  ('personio'),
  ('pro-tools'),
  ('product-hunt'),
  ('sage'),
  ('shotdeck'),
  ('superdev-pro'),
  ('tezza'),
  ('triple-whale'),
  ('twinmotion'),
  ('ukg-pro'),
  ('unit4'),
  ('unreal-engine'),
  ('whisper')
)
AND og_image_url LIKE '%og-screenshots%';
