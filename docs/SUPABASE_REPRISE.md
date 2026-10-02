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

## 2 bis. Prix officiels releves le 24/09/2026

44 fiches portaient la sentinelle `compare_plan_name: "Prix non public"` alors
que l'editeur publie un prix. Leur `pricing_v5` a ete rempli dans
`src/data/tools_v4.json` a partir de la page tarifaire officielle (preuve
recopiee pour chaque prix, 35 controles automatiques et 9 dans le navigateur).
Le bloc a ete fusionne, pas remplace : les champs editoriaux voisins
(`tcoExample*`, `costTable`) sont intacts. Les montants restent dans la devise
de l'editeur dans `plans[].nativeAmount`, et `compare_price_monthly_eur` est
normalise au taux de `src/lib/currencyRates.ts`.

A reinjecter : `pricing_v5` et `default_monthly_price` de
`ashby`, `attio`, `authoredup`, `bamboohr`, `bubble`, `captions`, `clay`, `docusign`, `gempages`, `google-workspace`, `headliner`, `hubspot`, `icons8`, `instantly`, `judge-me`, `linktree`, `mailerlite`, `memberful`, `microsoft-365`, `microsoft-entra-id`, `okta`, `opusclip`, `otter`, `pandadoc`, `pennylane`, `pretty-links`, `rankmath`, `readwise`, `repurpose-io`, `rewardful`, `stan-store`, `storyblocks`, `streamlabs`, `submagic`, `systeme-io`, `taplio`, `thirstyaffiliates`, `tradingview`, `trainerize`, `truecoach`, `vidyard`, `wistia`, `xero`, `yoast`.

Controle : aucune de ces fiches ne doit repasser a `"Prix non public"` apres
le retour de Supabase.

## 2 ter. Categories et liens corriges le 25/09/2026

Les etageres et les besoins du catalogue `/tools` exposaient des outils mal
ranges. Champ `tools.category` :

- `wix`, `squarespace` : `automation` vers `nocode-web` (createurs de sites)
- `freshservice`, `zendesk` : `organization` vers `communication` (helpdesks,
  comme `crisp`, `intercom`, `helpscout`)
- `honeybook` : `organization` vers `crm`
- `instantly` : `project-management` vers `email-productivity` (cold email)
- `gusto` : `finance` vers `hris-payroll` (paie)

Cinq fiches avaient subi un decalage CSV : la description etait coupee a une
virgule et sa fin atterrissait dans les champs d'URL. A reinjecter :
`website`, `website_url`, `affiliate_link`, `short_description`,
`short_description_en`, `description`, `long_description`,
`long_description_en` de `prowritingaid`, `visme`, `sendible`, et les trois
champs d'URL seuls pour `dubsado` et `honeybook`. Les URL officielles ont ete
verifiees (HTTP 200) le 25/09/2026.

## 2 quater. Fiches issues des dossiers de recherche (25/09 au 02/10/2026)

Fusionnees par `scripts/research/merge.mjs` depuis `research/dossiers/<slug>.json`.
A reinjecter pour chaque slug : `pricing_v5`, `pricing_v5_en`, `pricing`,
`pricing_en`, `default_monthly_price`, `alternatives`, `tool_trim_rating`,
`short_description(_en)`, `long_description(_en)`, `pros(_en)`, `cons(_en)`,
`use_cases(_en)`, `verdict(_en)`, `personas`, `solo_relevance`,
`team_relevance`, `seo`, et `website`/`affiliate_link` quand l'URL officielle a
change. Trois champs nouveaux n'existent pas encore dans la table (`tagline`,
`lifecycle`, `research`) : a ajouter au schema ou a laisser dans le JSON.

**Attention aux deux grilles de prix** (regle du 02/10/2026) : pour un editeur
qui publie dollars et euros, `pricing_v5_en` porte la grille en dollars et
`pricing_v5` la grille en euros. Les reinjecter separement, sans recopier l'une
dans l'autre.

La liste a jour se regenere ainsi (elle grandit a chaque fusion) :

```bash
node -e 'console.log(require("./src/data/tools_v4.json").filter(t=>t.research).map(t=>t.slug).join(" "))'
```

Etat au 02/10/2026, 355 fiches : `1password`, `ableton-live`, `acast`, `adobe`, `adobe-acrobat`, `adobe-after-effects`, `adobe-cc`, `adobe-fresco`, `adobe-illustrator`, `adobe-lightroom`, `adobe-photoshop`, `adobe-podcast-ai`, `adobe-premiere-pro`, `adobe-substance-3d`, `ae-animation-composer`, `ae-bao-boa`, `ae-bodymovin`, `ae-duik`, `ae-gifgun`, `ae-newton4`, `ae-overlord`, `ae-red-giant`, `aescripts-flow`, `affinity-photo`, `ahrefs`, `aircall`, `airtable`, `aloware`, `anaplan`, `angular-material`, `ant-design`, `apexcharts`, `apollo-io`, `archicad`, `artlist`, `artstation`, `asana`, `ashby`, `astute-graphics`, `audacity`, `auto-rig-pro`, `autocad-lt`, `aws`, `basecamp`, `better-proposals`, `bigquery`, `blender`, `bloom-crm`, `bolt-business`, `bolt-new`, `box`, `brand24`, `browzwear`, `bubble`, `budibase`, `buffer`, `bullmq`, `buzzsprout`, `callrail`, `calltrackingmetrics`, `canva`, `canva-ai`, `canva-pro`, `capture-one`, `cargo-site`, `chakra-ui`, `chartjs`, `chatgpt`, `cinema-4d`, `circle`, `cleanup3`, `clerk`, `clickup`, `clip-studio-paint`, `clo-3d`, `clockify`, `cloudinary`, `codemagic`, `confluence`, `contra`, `corona-renderer`, `coupler-io`, `crayo-ai`, `creditsafe`, `cursor`, `d5-render`, `darktable`, `dashlane`, `datadog`, `davinci-resolve`, `dbt`, `deel`, `dependabot`, `deputy`, `descript-ai`, `dext`, `didomi`, `digitalocean`, `discord`, `doola`, `dovetail`, `drata`, `dropbox`, `dxo-photolab`, `eagle`, `eas-build`, `echarts`, `elevenlabs`, `elfsight`, `elgato-stream-deck`, `embergen`, `enscape`, `envato-elements`, `esko-studio`, `eslint`, `eventbrite`, `excalidraw`, `expo`, `fathom-analytics`, `feedly`, `fellow`, `figma`, `figma-anima`, `figma-tokens`, `firebase`, `firecrawl`, `firefly`, `flask`, `fly-io`, `format`, `frame-io`, `framer`, `fredo6-bundle`, `freshbooks`, `freshservice`, `fusion-360`, `gaea`, `gcp`, `gelato`, `getida`, `gitlens`, `gmail`, `google-ai-studio`, `google-docs`, `google-drive`, `google-earth-studio`, `google-play-console`, `google-search-console`, `grammarly`, `gusto`, `helpscout`, `heptabase`, `heroku`, `highcharts`, `honeybook`, `hostfully`, `hotjar`, `houdini`, `hugeicons`, `hyperbrowser`, `ignition`, `indesign`, `indy`, `infisical`, `intercom`, `itch-io`, `jira`, `jobber`, `jotform`, `kajabi`, `kelio`, `klaviyo`, `knockout`, `krea-ai`, `kubernetes`, `la-growth-machine`, `later`, `legalplace`, `lemlist`, `leonardo-ai`, `lightroom-mobile`, `linear`, `linkedin-recruiter`, `linktree`, `localwp`, `logseq`, `looker-studio`, `loopio`, `lottiefiles`, `lovable`, `luminar-neo`, `maced-ai`, `madmapper`, `magic-bullet`, `magnific`, `magnific-ai`, `mailchimp`, `mapbox`, `material-ui`, `maxon-one`, `maze`, `memberstack`, `metabase`, `microsoft-defender`, `microsoft-dynamics-365-finance-operations`, `midjourney`, `milanote`, `mixpanel`, `mongodb-atlas`, `motion-array`, `motion-bro`, `move-ai`, `namecheap`, `neon`, `nestjs`, `netlify`, `netsuite`, `nick-launches`, `nik-collection`, `nomad-sculpt`, `nordpass`, `notion`, `obsidian`, `octane-render`, `onetrust`, `openphone`, `opus-clip`, `oracle-fusion-cloud`, `ovh`, `pagerduty`, `pagespeed-insights`, `payhawk`, `payoneer`, `pennylane`, `personio`, `photopea`, `php`, `pika-labs`, `pixieset`, `plasticity`, `plausible`, `plutio`, `podbean`, `posthog`, `postman`, `prezi`, `printify`, `procreate`, `product-hunt`, `productioncrate`, `productive-io`, `profile-builder-3`, `prometheus`, `proposify`, `python`, `qonto`, `quarkxpress`, `quickbooks`, `quickbooks-online`, `quixel-megascans`, `react`, `react-router`, `reaper`, `recharts`, `redshift`, `reflect-notes`, `remix`, `renderman`, `resend`, `restream`, `revenuecat`, `revit`, `rive`, `riverside`, `roam-research`, `rocket-lawyer`, `rocketlink`, `runway`, `rydoo`, `safetyculture`, `samcart`, `sap-s4hana`, `scribe`, `securityscorecard`, `sellfy`, `semrush`, `sendible`, `sentry`, `shadcn-ui`, `shine`, `shipstation`, `shopify-payments`, `signrequest`, `silae`, `similarweb`, `simpletexting`, `simvoly`, `sketchup-pro`, `smartsuite`, `snapseed`, `socialbee`, `softr`, `soldo`, `solid-inspector2`, `spendesk`, `spline`, `spotify-for-podcasters`, `sprout-social`, `steamworks`, `storyblocks`, `storybook`, `substance-3d-designer`, `substance-3d-painter`, `suno`, `supabase`, `superlist`, `sysaid`, `tally`, `thinkific`, `tiktok-studio`, `toggl`, `topaz-gigapixel`, `topaz-photo-ai`, `topaz-video-ai`, `touchdesigner`, `tradingview`, `trainerize`, `trello`, `tubebuddy`, `twinmotion`, `typeform`, `udio`, `unbounce`, `unity`, `vault`, `vectorworks`, `vercel`, `vidiq`, `wetransfer`, `wix`, `wolters-kluwer`, `woocommerce`, `wordpress`, `wordpress-com`, `workable`, `xero`, `yousign`, `youtube-studio`, `zbrush`, `zed`, `zendesk`, `zoho`, `zoom`, `zoom-pro`, `zotero`.

## 2 quinquies. Fiches retirees et renommees (02/10/2026, `5107c24b`)

Retirees du site (liste `DEPRECATED_TOOL_SLUGS` + 301 dans `vercel.json`), a
archiver dans la table (pas a supprimer) : `tubebody`, `lottie`, `apollo`,
`avocode`, `twitch-studio`, `pluraleyes`, `premiere-rush`, `ae-newton3`.
Deja retirees avant, sans 301 jusque-la : `invision`, `bots-discord`.

Nouvelle fiche a creer dans la table : `ae-newton4` (Newton 4, successeur de
Newton 3).

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
