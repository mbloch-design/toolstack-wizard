# Fiches niveau A supplantées par le contrat canonical

Ces fiches ont été produites par la repasse éditoriale niveau A avant qu'on
identifie qu'elles disposaient déjà d'un contenu **canonical** plus riche
(pipeline avec observations de prix attestées, `catalog_private`).

Elles ont été appliquées par erreur sur `public.tools`, écrasant le contenu
canonical. La restauration a été faite depuis la source
(`scripts/sql/restore-canonical-editorial.sql`).

Elles sont conservées ici pour mémoire mais **ne doivent pas être réappliquées**.

Règle : avant toute repasse niveau A, exclure les slugs dont
`data_contract = 'canonical'` ou `research_status = 'approved'`.
