-- Axe « forme de distribution », separe du role dans la stack.
--
-- POURQUOI : tool_type melangeait deux axes incompatibles. core / satellite /
-- metier / gestion / specialise / ia decrivent un ROLE dans une stack ; plugin
-- et bundle decrivent une FORME de distribution. Un plugin After Effects a
-- aussi un role, donc les loger dans le meme champ imposait un choix arbitraire
-- — d'ou « satellite » devenu fourre-tout sur 528 fiches sur 1035.
--
-- tool_type n'est PAS modifie : il est structurant dans le moteur de
-- diagnostic (scoring.ts, DiagStepStackScan) et dans une union typee.
-- Le renommer aurait change le comportement du scoring en silence.
--
-- VOCABULAIRE FERME, volontairement court et ENTIEREMENT EN ANGLAIS pour
-- rester coherent (plugin et mcp s'ecrivent pareil dans les deux langues) :
--   app      produit autonome, s'utilise seul                 (defaut)
--   plugin   s'execute a l'interieur d'un logiciel hote
--   library  s'importe dans du code
--   mcp      expose un service a un client IA
--   suite    regroupement commercial de plusieurs produits
--   asset    contenu pret a l'emploi depose dans un hote : template,
--            kit UI, bibliotheque de composants, presets. Ne s'execute pas,
--            ne s'importe pas dans du code — on l'insere dans un projet.
--
-- La valeur stockee n'est PAS destinee a l'affichage. Le libelle est localise
-- cote front, comme pour la taxonomie covers (« Comptabilite » / « Accounting »
-- via LABEL_OVERRIDES) :
--   app -> Application / App        plugin  -> Plugin / Plugin
--   library -> Bibliotheque / Library   (« librairie » est un faux ami :
--                                        en francais c'est un magasin de livres,
--                                        et les fiches disent deja « Bibliotheque »)
--   mcp -> Serveur MCP / MCP server  suite -> Suite / Suite
--   asset -> Ressource / Asset
--
-- Etendre = ajouter une valeur ici ET dans guard-plugins.mjs. Jamais de
-- valeur libre : c'est ce qui a produit les 590 termes de taxonomie nettoyes
-- precedemment.
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS form_factor text;

-- Defaut : tout est une application autonome tant qu'on n'a pas dit le contraire.
UPDATE public.tools SET form_factor = 'app' WHERE form_factor IS NULL;

-- Plugins : ceux deja types, plus ceux rattaches a un logiciel hote.
UPDATE public.tools SET form_factor = 'plugin'
WHERE tool_type = 'plugin' OR host_app IS NOT NULL;

-- Librairies : rattachees a un framework, on les importe dans du code.
UPDATE public.tools SET form_factor = 'library'
WHERE host_app IN ('react', 'vue-cli');

-- Suites commerciales.
UPDATE public.tools SET form_factor = 'suite' WHERE tool_type = 'bundle';

-- REGLE DU PRODUIT AUTONOME : host_app n'est renseigne que si le produit
-- n'existe QUE dans son hote. Luminar Neo, Nik Collection et Topaz Gigapixel
-- sont des logiciels autonomes qui savent AUSSI se brancher dans Photoshop et
-- Lightroom. Les declarer plugins de Photoshop les faisait disparaitre de leur
-- propre marche et n'exprimait que la moitie de leur compatibilite.
-- La compatibilite multiple passe par covers, qui est deja multivalue.
UPDATE public.tools SET host_app = NULL, form_factor = 'app'
WHERE slug IN ('luminar-neo', 'nik-collection', 'topaz-gigapixel');

UPDATE public.tools t SET covers = (
  SELECT jsonb_agg(DISTINCT v) FROM (
    SELECT jsonb_array_elements_text(COALESCE(t.covers, '[]'::jsonb)) v
    UNION SELECT 'retouche-photo'
  ) s
)
WHERE t.slug IN ('luminar-neo', 'nik-collection', 'topaz-gigapixel');

-- Plugin reel laisse sans hote : la description annonce « Plugins Illustrator ».
UPDATE public.tools SET host_app = 'adobe-illustrator', form_factor = 'plugin'
WHERE slug = 'astute-graphics'
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'adobe-illustrator');
