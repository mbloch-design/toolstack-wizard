-- Repasse email/productivité :
--   sendinblue -> ancien nom de Brevo (rebranding 2023)                                   → 301 vers brevo
--   clearbit   -> racheté par HubSpot fin 2023, rebrandé Breeze Intelligence, API arrêtée → archive
UPDATE public.tools SET content_status='archived'
WHERE slug IN ('sendinblue','clearbit') AND content_status='published';
