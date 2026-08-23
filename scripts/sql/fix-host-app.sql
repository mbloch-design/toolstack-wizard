-- Reparation des liens plugin -> logiciel hote.
--
-- host_app portait trois valeurs qui ne correspondaient a AUCUN slug du
-- catalogue : « after-effects », « photoshop » et « premiere-pro ». Les slugs
-- reels sont prefixes par l'editeur. Consequence : 19 fiches sur 47 pointaient
-- dans le vide — Bodymovin, Newton3, Trapcode, Magic Bullet, Duik, Overlord,
-- Topaz Gigapixel, Luminar Neo entre autres.
--
-- Ces liens morts etaient invisibles : rien ne verifiait que host_app resolve
-- vers une fiche existante. C'est le meme angle mort que les captures d'ecran
-- cassees. Un garde-fou (scripts/guard-plugins.mjs) est ajoute en parallele.
--
-- La reparation conditionne chaque correction a l'existence reelle du slug
-- cible, pour ne pas remplacer un lien mort par un autre.
UPDATE public.tools SET host_app = 'adobe-after-effects'
WHERE host_app = 'after-effects'
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'adobe-after-effects');

UPDATE public.tools SET host_app = 'adobe-photoshop'
WHERE host_app = 'photoshop'
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'adobe-photoshop');

UPDATE public.tools SET host_app = 'adobe-premiere-pro'
WHERE host_app = 'premiere-pro'
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'adobe-premiere-pro');
