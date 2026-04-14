

## Diagnostic — Fondations (types, data layer, routing)

### Constat important

Le projet utilise **react-router-dom**, pas wouter. Les instructions mentionnent wouter mais le routeur en place est react-router-dom avec `useParams`, `useNavigate`, `<Routes>`, etc. Le plan suit les conventions react-router-dom existantes.

Les tables `clusters`, `doublon_rules` et `discovery_questions` **n'existent pas** en base. Il faut les créer.

### Ce qui sera créé

**4 fichiers créés, 0 fichier existant modifié** (conformément à la consigne).

---

### 1. Types — `src/types/diagnostic.ts`

Fichier copié tel quel depuis le prompt. Contient `SessionState`, `Tool`, `Cluster`, `DoubleRule`, `DiscoveryQuestion`, `DiagnosticResult`, `Prescription`, `Persona`.

### 2. Pertinence fallback — `src/utils/pertinenceFallback.ts`

Fichier copié tel quel depuis le prompt. Fonction `computePertinenceFallback(tool, persona)` avec la matrice catégorie × persona.

### 3. Tables Supabase — migration SQL

Création de 3 tables avec RLS en lecture publique :

```text
clusters
├── id (text PK)
├── persona (text NOT NULL)
├── "order" (int NOT NULL)
├── question (text NOT NULL)
├── question_en (text)
├── why (text)
├── cols (int DEFAULT 2)
├── tool_ids (jsonb DEFAULT '[]')

doublon_rules
├── id (uuid PK, gen_random_uuid)
├── ids (jsonb NOT NULL)
├── message (text NOT NULL)
├── savings (numeric DEFAULT 0)
├── category (text)

discovery_questions
├── id (text PK)
├── persona (text NOT NULL)  -- "THEO"|"ALL" etc.
├── question (text NOT NULL)
├── subtitle (text)
├── options (jsonb NOT NULL)
├── condition_tool_ids (jsonb DEFAULT '[]')
├── condition_type (text DEFAULT 'any')
```

### 4. Hook data — `src/hooks/useDiagnosticData.ts`

Hook `useDiagnosticData()` qui :
- Charge `tools`, `clusters`, `doublon_rules`, `discovery_questions` depuis Supabase
- Retourne `{ tools, clusters, doublonRules, discoveryQuestions, loading, error }`
- Mappe les résultats vers les types de `diagnostic.ts`

### 5. Router — `src/components/DiagnosticRouter.tsx`

Composant qui :
- Reçoit `lang` via `useLang()` (pattern existant, pas useParams direct)
- Charge les données via `useDiagnosticData()`
- Gère un `useState<number>(0)` pour le step courant (0-7)
- Rend un placeholder par step (pas de composants UI dans ce prompt)
- Utilise `useNavigate` de react-router-dom pour la navigation

Ce composant n'est **pas branché sur les routes** — aucune modification de `App.tsx` ni de `SelectorPage.tsx`. Il sera intégré dans un prochain prompt.

---

### Résumé des fichiers

| Action | Fichier |
|--------|---------|
| Créer | `src/types/diagnostic.ts` |
| Créer | `src/utils/pertinenceFallback.ts` |
| Créer | `src/hooks/useDiagnosticData.ts` |
| Créer | `src/components/DiagnosticRouter.tsx` |
| Migration | 3 nouvelles tables Supabase |

