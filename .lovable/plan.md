

## Diagnostic : Articles manquants dans les guides

### Le problème

La fonction `usePosts()` dans `useSupabaseData.ts` (ligne 150) **remplace** les articles locaux par ceux de Supabase dès qu'elle reçoit au moins 1 résultat :

```typescript
if (!error && data && data.length > 0) setPosts(data.map(mapPost));
```

Or la table `posts` en Supabase ne contient que **6 articles** (1 FR + 5 EN), alors que les fichiers JSON locaux en contiennent **42** (18 FR + 24 EN). Résultat : les 36 articles manquants disparaissent de l'affichage.

### Solution en 2 étapes

**Étape 1 — Correction immédiate du hook `usePosts`** (fichier `src/hooks/useSupabaseData.ts`)

Fusionner les articles Supabase avec les articles locaux au lieu de remplacer. Les articles Supabase sont prioritaires (par slug), les articles locaux comblent les manques :

```typescript
if (!error && data && data.length > 0) {
  const supabasePosts = data.map(mapPost);
  const supabaseSlugs = new Set(supabasePosts.map(p => p.slug));
  const merged = [...supabasePosts, ...localPosts.filter(p => !supabaseSlugs.has(p.slug))];
  merged.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  setPosts(merged);
} else {
  setPosts(localPosts);
}
```

**Étape 2 — Re-seeder tous les articles dans Supabase**

Appeler la Edge Function `seed-content` avec l'action `seed_posts` pour injecter les 42 articles (18 FR + 24 EN) depuis les fichiers `posts-fr.json` et `posts-en.json`. Cela rendra l'étape 1 pérenne : Supabase aura toutes les données et le fallback local ne sera plus nécessaire.

### Impact

- Les 42 articles seront immédiatement visibles dans la section Guides (FR et EN)
- La page d'accueil affichera à nouveau les 3 articles en vedette
- Les pages outils retrouveront leurs articles liés

