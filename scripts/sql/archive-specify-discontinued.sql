-- Specify : la page officielle affiche « Saying Goodbye: The End of Specify » → produit arrêté
UPDATE public.tools SET content_status='archived'
WHERE slug = 'specify' AND content_status='published';
