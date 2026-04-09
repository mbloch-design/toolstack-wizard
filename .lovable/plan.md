

## Diagnostic

Les textes qui restent en français sur `/en/tool/chatgpt` ne sont **pas un bug de code** — c'est un **problème de données**. Les champs suivants n'existent qu'en français dans la table `tools` et le JSON `tools_v4.json` :

| Champ | Exemple sur ChatGPT EN |
|---|---|
| `long_description` | "ChatGPT est l'assistant IA polyvalent d'OpenAI..." |
| `verdict.threshold` | "Dès que l'attente ou les erreurs..." |
| `verdict.keepIf[]` | "Usage intensif (>10h/semaine)" |
| `verdict.avoidIf[]` | "Usage ponctuel", "Recherches simples" |
| `pros[]` | Tous en français |
| `cons[]` | Tous en français |
| `useCases[]` | Tous en français |
| `pricing.free / paid` | Textes descriptifs en français |
| `alt.shortDescription` | Descriptions des alternatives en français |
| `alt.pros[0]` | Premier avantage affiché dans les cartes alternatives |

Les **labels UI** (titres de sections, boutons) sont déjà correctement traduits via `t()`. Le problème concerne uniquement le **contenu des fiches outils**.

## Plan

### Étape 1 — Ajouter les colonnes EN dans la table `tools`

Migration SQL ajoutant 7 colonnes :
- `short_description_en` (text)
- `long_description_en` (text)
- `pros_en` (jsonb)
- `cons_en` (jsonb)
- `use_cases_en` (jsonb)
- `verdict_en` (jsonb) — même structure que `verdict` : `{keepIf, avoidIf, threshold}`
- `pricing_en` (jsonb) — même structure que `pricing` : `{free, paid}`

### Étape 2 — Mapper les champs EN dans le code

Dans `useSupabaseData.ts` → `mapToolFromJson()`, ajouter le mapping des nouveaux champs EN vers le type `Tool`.

Dans `types.ts`, ajouter les champs optionnels correspondants sur l'interface `Tool`.

### Étape 3 — Utiliser `t()` pour chaque champ de contenu

Dans `ToolDetailPage.tsx` et ses sous-composants, remplacer les affichages directs par des appels `t(frValue, enValue)` :

- **Description** (ligne 171) : `t(tool.longDescription, tool.longDescriptionEn || tool.longDescription)`
- **Pros/Cons** (lignes 263-278) : mapper avec `t(pro, prosEn[i] || pro)`
- **Use cases** (lignes 201-206) : idem
- **Verdict** (ToolVerdictBlock) : `t(tool.verdict.threshold, tool.verdictEn?.threshold || tool.verdict.threshold)`
- **Pricing** (ToolPricingSection) : `t(tool.pricing.free, tool.pricingEn?.free || tool.pricing.free)`
- **Alternatives cards** (ToolAlternativesSection, lignes 80-84) : `t(alt.shortDescription, alt.shortDescriptionEn || alt.shortDescription)`

### Étape 4 — Peupler les données EN pour les outils principaux

Insérer les traductions EN pour les outils les plus consultés (ChatGPT, Notion, Figma, Slack, etc.) via une migration SQL `UPDATE`. Les autres outils afficheront le texte FR en fallback jusqu'à traduction.

---

### Ce que ça ne touche pas
- La logique de traduction `t()` et `useLang` existante
- Les labels UI déjà traduits
- Les fichiers JSON de contenu des articles
- Les pages qui fonctionnent déjà

