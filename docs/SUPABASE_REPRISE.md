# Reprise Supabase

Supabase est indisponible depuis septembre 2026 (`HTTP 402`, `exceed_egress_quota`).
Le travail editorial continue dans les fichiers JSON du depot, qui servent de
source au prerendu. **Ce document liste ce qui doit etre reinjecte dans Supabase
des son retour**, prevu courant semaine du 14/09/2026.

## Pourquoi ce document existe

Les deux sources ne se comportent pas pareil.

| Surface | Source du prerendu | Source apres hydratation |
|---|---|---|
| Fiches outil | `src/data/tools_v4.json`, ecrase par Supabase si joignable | Supabase |
| Guides | `src/data/posts-*.json` | table `posts` de Supabase |

Consequence : tant que Supabase repond 402, le HTML servi porte le contenu du
depot. Des qu'il repond de nouveau, **le contenu Supabase gagne**, et tout ce
qui n'y a pas ete reinjecte disparait, sans erreur ni ligne de log.

Une protection partielle a ete posee dans `vite.config.ts` : un champ editorial
vide ou rempli d'un gabarit cote Supabase ne peut plus effacer un texte local.
Elle ne couvre que `longDescription` et `longDescriptionEn`, et elle ne remplace
pas la reinjection. **A retirer une fois la reinjection faite.**

## 1. Descriptions anglaises de fiches outil

37 fiches ou un editorial francais existait sans equivalent anglais. Le champ
concerne est `tools.long_description_en`. Les montants et devises sont repris
tels quels du francais : les convertir republierait un prix non verifie.

Source : `src/data/tools_v4.json`, champ `longDescriptionEn`.

- `agicap`
- `axeptio`
- `captaindoc`
- `chartmogul`
- `coda`
- `coupa`
- `crowdstrike`
- `didomi`
- `drata`
- `fig-terminal`
- `greenhouse`
- `greenly`
- `heptabase`
- `integrately`
- `kelio`
- `loopio`
- `microsoft-clarity`
- `microsoft-defender`
- `moss`
- `notionlytics`
- `nusii`
- `optimizely`
- `profitwell`
- `proposify`
- `rydoo`
- `sage-paie`
- `sami`
- `shield-app`
- `signrequest`
- `silae`
- `skribble`
- `sweep`
- `triple-whale`
- `usertesting`
- `vwo`
- `waalaxy`
- `workday`

18 autres fiches avaient une source francaise d'une seule phrase. Elles ont
**volontairement** ete laissees telles quelles : leur traduction anglaise fidele
existait deja, et leur probleme etait le seuil d'affichage, corrige dans
`src/lib/editorialSubstance.ts`.

## 2. Guides

Table `posts`. Travail de la semaine du 07/09/2026 :

- `chatgpt-pro-worth-it` : article anglais cree, 1 825 mots. La paire francaise
  `chatgpt-plus-utile-ou-inutile` declarait auparavant un article anglais qui
  traitait d'une autre question.
- `chatgpt-plus-utile-ou-inutile` : passage au tutoiement, 24 reecritures, mots
  proscrits retires.
- Famille IA : versions de modeles retirees plutot que mises a jour, paliers
  Claude corriges, trois affirmations inverifiables supprimees.
- `chatgpt-plus-worth-it` : renvoi ajoute vers le nouveau guide Pro.

## 3. Verification apres reinjection

```bash
npm run build            # doit logger le fetch Supabase sans 402
npx vitest run src/lib/editorialSubstance.test.ts
```

Puis controler le **HTML servi**, pas le JSON :

```bash
grep -c td-editorial-intro-title dist/en/tool/*/index.html | grep -c ':1'
```

Le compte doit rester proche de celui des fiches francaises. Un effondrement du
cote anglais signale que la reinjection est incomplete.

Si le build logge `champs editoriaux conserves depuis le JSON`, c'est que la
protection de `vite.config.ts` a encore du travail a faire : la reinjection
n'est pas terminee.
