

## Diagnostic

Le bug est sur la **ligne 80** de `src/App.tsx` :

```
<Route path="/en/tool/:slug" element={<RedirectToolToFr />} />
```

Cette route legacy redirige **toutes** les URLs `/en/tool/:slug` vers `/fr/tool/:slug`. Elle est définie **avant** la route `/:lang` et matche en priorité. Donc quand tu cliques sur "EN" depuis `/fr/tool/chatgpt`, le navigateur charge `/en/tool/chatgpt`, React Router matche cette route de redirection, et te renvoie sur `/fr/tool/chatgpt`.

Même problème potentiel sur la ligne 83 : `/en/category/*` redirige tout vers `/fr`.

## Plan

1. **Supprimer la ligne 80** : `<Route path="/en/tool/:slug" element={<RedirectToolToFr />} />` — cette redirection est un vestige qui casse le bilinguisme des pages outils.

2. **Supprimer la ligne 83** : `<Route path="/en/category/*" element={<Navigate to="/fr" replace />} />` — même problème pour les catégories EN.

3. **Conserver la ligne 79** (`/tool/:slug` sans préfixe de langue) car elle gère les URLs legacy sans préfixe.

Aucun autre fichier n'est modifié.

