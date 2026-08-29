# Registre maître de relecture des fiches

Ce registre garantit qu'un slug du catalogue est attribué une seule fois, qu'une validation vise une version exacte de la fiche et qu'une modification ultérieure rend automatiquement cette validation périmée.

## Source de vérité

- Catalogue public : `src/data/tools_v4.json`
- Registre généré : `research/catalog-review-ledger.json`
- Dossiers factuels : `research/bundle-editorial/<slug>.json`

Les anciens fichiers `scripts/repass/blocks/*.json` ne prouvent pas la couverture globale. Le registre est toujours régénéré depuis le catalogue public complet.

## Commandes

```bash
npm run catalog:review:sync
npm run catalog:review:check
npm run catalog:review:report
npm run catalog:review:work-order -- --batch=review-design-tools-critical-001
```

Exemple de progression d'une fiche :

```bash
npm run catalog:review:mark -- --slug=figma --status=RESEARCHED
npm run catalog:review:mark -- --slug=figma --status=EDITORIAL_READY
npm run catalog:review:mark -- --slug=figma --status=MEDIA_READY
npm run catalog:review:mark -- --slug=figma --status=VALIDATED --reviewer="ToolTrim - Mike"
npm run catalog:review:mark -- --slug=figma --status=RENDER_VERIFIED --reviewer="ToolTrim - Mike"
npm run catalog:review:mark -- --slug=figma --status=PUBLISHED --reviewer="ToolTrim - Mike"
```

Pour un blocage ou une identité ambiguë :

```bash
npm run catalog:review:mark -- --slug=outil --status=BLOCKED --reason="identité officielle ambiguë"
```

## Invariants

1. Chaque slug public possède exactement une entrée.
2. Chaque entrée appartient à un lot.
3. Une fiche doit passer par `MEDIA_READY` avant `VALIDATED`.
4. Une fiche `VALIDATED`, `RENDER_VERIFIED` ou `PUBLISHED` référence exactement son `review_fingerprint`.
5. L'empreinte combine la fiche publique, son dossier factuel, sa preuve média et la version du protocole qualité.
6. Une modification de l'un de ces éléments transforme la fiche en `STALE` au prochain `sync`.
7. Une fiche ne peut pas passer directement de `QUEUED` à `PUBLISHED`.
8. Les états de décision négatifs exigent une raison.
9. Les validations exigent l'identité du réviseur.

## Contrat média

Chaque fiche possède un fichier `research/media-evidence/<slug>.json`.

Si des médias officiels existent :

- utiliser uniquement des images fournies par l'éditeur du produit
- enregistrer l'URL du média et la page officielle sur laquelle il a été trouvé
- conserver entre une et quatre images utiles
- interdire toute capture ToolTrim dans ce mode

Exemple :

```json
{
  "slug": "figma",
  "verified_on": "2026-08-29",
  "mode": "sourced",
  "discovery": {
    "official_media_found": true,
    "official_pages_checked": ["https://www.figma.com/"]
  },
  "items": [
    {
      "kind": "image",
      "url": "https://static.figma.com/official-product-image.png",
      "source_page_url": "https://www.figma.com/",
      "official": true
    }
  ]
}
```

Si aucun média officiel exploitable n'existe :

- documenter les pages officielles contrôlées
- produire exactement une capture navigateur
- enregistrer cette capture comme ressource locale
- ne jamais ajouter une seconde capture ToolTrim

```json
{
  "slug": "outil",
  "verified_on": "2026-08-29",
  "mode": "fallback_screenshot",
  "discovery": {
    "official_media_found": false,
    "official_pages_checked": ["https://outil.example/"]
  },
  "items": [
    {
      "kind": "screenshot",
      "url": "/og-screenshots/outil.png",
      "source_page_url": "https://outil.example/",
      "official": false,
      "capture_method": "browser_screenshot"
    }
  ]
}
```

## Utilisation des tokens

Le lot attribué sert uniquement à sélectionner les slugs. Pour chaque slug, l'agent reçoit un work order compact produit par l'usine catalogue existante. Il ne reçoit ni l'ensemble du catalogue ni les rapports précédents. Les scripts contrôlent les invariants et ne renvoient à l'agent que les erreurs ou ambiguïtés.

Les work orders de repasse sont écrits dans `research/review-work-orders/<lot>/`. Un fichier distinct est produit pour chaque slug, avec un manifeste léger pour le lot. Un agent ne charge donc jamais les dix fiches en même temps. Chaque dossier contient uniquement l'état de suivi, la fiche actuelle, le dossier factuel disponible et l'action attendue.
